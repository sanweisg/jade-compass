"""
Price Scraper — Extract pricing data from competitor websites.
Uses Hermes tools (web_extract) to visit real competitor URLs and extract prices.
"""
import re
import json
import time
from html.parser import HTMLParser


# ─── Price Patterns ────────────────────────────────────────────────────

PRICE_PATTERNS = [
    # $XX.XX or $X,XXX.XX
    r'\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)',
    # XX.XX USD
    r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|US\$|dollars)',
    # From $XX to $XX
    r'(?:from|starting at|as low as)\s*\$?\s*(\d+(?:\.\d{2})?)',
    # $XX-$XX range
    r'\$\s*(\d+(?:\.\d{2})?)\s*(?:-|–|to)\s*\$?\s*(\d+(?:\.\d{2})?)',
]

CATEGORY_KEYWORDS = {
    "pet_food": ["dog food", "cat food", "pet food", "kibble", "wet food"],
    "treats": ["treats", "chews", "dog treat", "cat treat", "training treat"],
    "supplements": ["supplement", "vitamin", "joint", "probiotic", "health"],
    "beds": ["bed", "beds", "pet bed", "dog bed", "cat bed", "furniture"],
    "toys": ["toy", "toys", "enrichment", "puzzle", "fetch", "chew toy"],
    "grooming": ["grooming", "shampoo", "brush", "nail clipper", "groom"],
    "collars_leashes": ["collar", "leash", "harness", "muzzle"],
    "bowls_feeders": ["bowl", "feeder", "water fountain", "food storage"],
}


def extract_prices(html_text: str) -> list[dict]:
    """Extract all price mentions from page text."""
    prices = []
    seen = set()
    
    for pat in PRICE_PATTERNS:
        matches = re.finditer(pat, html_text, re.IGNORECASE)
        for m in matches:
            groups = m.groups()
            price_str = groups[0] if groups else ""
            # Clean
            price_str = price_str.replace(",", "")
            key = price_str[:10]  # dedup key
            
            if key in seen:
                continue
            seen.add(key)
            
            try:
                price_val = float(price_str)
                if 0.50 <= price_val <= 500:  # Sanity check — reasonable range
                    # Try to find context (20 chars before and after)
                    start = max(0, m.start() - 40)
                    end = min(len(html_text), m.end() + 40)
                    context = html_text[start:end].strip()
                    # Clean context
                    context = re.sub(r'\s+', ' ', context)[:80]
                    
                    prices.append({
                        "price": price_val,
                        "context": context,
                        "raw_match": m.group(0),
                    })
            except ValueError:
                pass
    
    # Dedup by price value
    unique = {}
    for p in prices:
        val = round(p["price"], 2)
        if val not in unique:
            unique[val] = p
    
    # Sort by price
    sorted_prices = sorted(unique.values(), key=lambda x: x["price"])
    return sorted_prices


def classify_product_category(context: str) -> str:
    """Try to classify what kind of product the price is for."""
    text = context.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                return category
    return "unknown"


def extract_pricing_summary(prices: list[dict]) -> dict:
    """Generate summary statistics from extracted prices."""
    if not prices:
        return {
            "has_prices": False,
            "min_price": None,
            "max_price": None,
            "avg_price": None,
            "median_price": None,
            "sample_size": 0,
            "price_distribution": {},
        }
    
    values = [p["price"] for p in prices]
    values.sort()
    
    n = len(values)
    mid = n // 2
    
    # Distribution
    distribution = {
        "budget": len([v for v in values if v < 15]),
        "mid": len([v for v in values if 15 <= v < 50]),
        "premium": len([v for v in values if 50 <= v < 100]),
        "ultra_premium": len([v for v in values if v >= 100]),
    }
    
    return {
        "has_prices": True,
        "min_price": min(values),
        "max_price": max(values),
        "avg_price": round(sum(values) / n, 2),
        "median_price": values[mid] if n % 2 else (values[mid-1] + values[mid]) / 2,
        "sample_size": n,
        "price_distribution": distribution,
        "price_points": [round(v, 2) for v in values[:20]],  # First 20 for reference
        "top_products": [p for p in prices[:5] if classify_product_category(p.get("context", "")) != "unknown"],
    }


def scrape_competitor_prices(competitor_url: str, competitor_name: str) -> dict:
    """
    Scrape pricing data from a single competitor URL.
    To be called via execute_code with web_extract.
    """
    from hermes_tools import web_extract
    
    print(f"  🔍 Scraping prices from: {competitor_url}")
    
    try:
        result = web_extract(urls=[competitor_url])
        if not result or not result.get("results"):
            return {"competitor": competitor_name, "error": "No content"}
        
        page = result["results"][0]
        content = page.get("content", "") or ""
        
        if not content:
            return {"competitor": competitor_name, "error": "Empty page"}
        
        prices = extract_prices(content)
        summary = extract_pricing_summary(prices)
        
        # Classify a few prices
        for p in prices[:8]:
            p["category"] = classify_product_category(p.get("context", ""))
        
        return {
            "competitor": competitor_name,
            "url": competitor_url,
            "prices_found": len(prices),
            "summary": summary,
            "sample_prices": prices[:12],
            "date_scraped": __import__('datetime').datetime.now().isoformat(),
        }
    except Exception as e:
        return {"competitor": competitor_name, "url": competitor_url, "error": str(e)}


def scrape_multiple_competitors(urls: list[dict]) -> list[dict]:
    """Scrape prices from multiple competitors."""
    results = []
    for i, entry in enumerate(urls):
        name = entry.get("name", entry.get("domain", "Unknown"))
        url = entry.get("url", "")
        if not url:
            continue
        
        result = scrape_competitor_prices(url, name)
        results.append(result)
        
        # Polite delay
        if i < len(urls) - 1:
            time.sleep(1)
    
    return results


def generate_pricing_analysis(price_results: list[dict]) -> dict:
    """Generate overall pricing intelligence from all scraped competitors."""
    competitors_with_prices = [r for r in price_results if r.get("prices_found", 0) > 0]
    competitors_failed = [r for r in price_results if r.get("error")]
    
    all_prices = []
    competitor_avg_prices = []
    
    for r in competitors_with_prices:
        summary = r.get("summary", {})
        if summary.get("has_prices"):
            competitor_avg_prices.append({
                "name": r["competitor"],
                "avg_price": summary["avg_price"],
                "min_price": summary["min_price"],
                "max_price": summary["max_price"],
                "sample_size": summary["sample_size"],
            })
            all_prices.extend(summary.get("price_points", []))
    
    if not all_prices:
        return {
            "status": "no_pricing_data",
            "message": "Could not extract pricing from any competitor websites.",
        }
    
    all_prices.sort()
    n = len(all_prices)
    mid = n // 2
    
    return {
        "status": "success",
        "competitors_scraped": len(competitors_with_prices),
        "competitors_failed": len(competitors_failed),
        "total_prices_extracted": len(all_prices),
        "market_pricing": {
            "overall_min": min(all_prices),
            "overall_max": max(all_prices),
            "overall_avg": round(sum(all_prices) / n, 2),
            "overall_median": all_prices[mid] if n % 2 else (all_prices[mid-1] + all_prices[mid]) / 2,
        },
        "competitor_pricing": competitor_avg_prices,
        "insights": generate_pricing_insights(competitor_avg_prices, all_prices),
    }


def generate_pricing_insights(competitor_prices: list[dict], all_prices: list) -> list[dict]:
    """Generate actionable pricing insights."""
    insights = []
    
    if not all_prices:
        return insights
    
    avg = sum(all_prices) / len(all_prices)
    
    # Market positioning insight
    insights.append({
        "type": "market_positioning",
        "insight": f"Market average price point: ${avg:.2f}. Most products fall in the ${min(all_prices):.0f}-${max(all_prices):.0f} range.",
        "actionable": "Position your pricing within this range based on your value proposition — above average for premium curated selection, at market for competitive entry.",
    })
    
    # Check if there's a gap in premium segment
    premium = [p for p in all_prices if p > avg * 1.5]
    budget = [p for p in all_prices if p < avg * 0.5]
    
    if len(premium) < 3:
        insights.append({
            "type": "premium_gap",
            "insight": f"Only {len(premium)} premium products found above ${avg*1.5:.0f}. The premium segment appears underserved.",
            "actionable": "Consider offering premium/vetted products at a higher price point to capture customers seeking quality over price.",
        })
    
    if len(budget) < 3:
        insights.append({
            "type": "budget_gap",
            "insight": f"Few budget-friendly options found under ${avg*0.5:.0f}.",
            "actionable": "Entry-level product options could attract price-sensitive customers who currently buy from big boxes.",
        })
    
    return insights
