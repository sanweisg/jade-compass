"""
Competitive Analysis Engine — Extract intelligence from raw search data.
"""
import re
import json
from typing import Optional


# ─── Industry Classification ───────────────────────────────────────────

INDUSTRY_SIGNALS = {
    "pet": {
        "keywords": ["pet", "dog", "cat", "animal", "veterinary", "pet supply",
                     "pet food", "pet store", "grooming", "pet care", "animal hospital",
                     "pet toy", "pet accessory", "pet product"],
        "competitors": ["chewy", "petsmart", "petco", "pet valu", "mud bay",
                       "pet supplies plus", "bark", "petmate", "kong"],
    },
    "restaurant": {
        "keywords": ["restaurant", "cafe", "bistro", "dining", "food", "eatery",
                     "grill", "kitchen", "fast food", "fast casual", "takeout",
                     "delivery", "catering", "lunch", "dinner", "breakfast"],
        "competitors": ["chipotle", "sweetgreen", "subway", "mcdonald", "wendy",
                       "panera", "chick-fil-a", "five guys", "shake shack"],
    },
    "fitness": {
        "keywords": ["gym", "fitness", "workout", "exercise", "yoga", "pilates",
                     "crossfit", "personal training", "health club", "spin class"],
        "competitors": ["planet fitness", "24 hour fitness", "la fitness", "equinox",
                       "orange theory", "soulcycle", "barry's", "crunch fitness"],
    },
    "retail": {
        "keywords": ["store", "shop", "retail", "boutique", "merchant", "ecommerce",
                     "online store", "shopping", "marketplace"],
        "competitors": ["amazon", "walmart", "target", "costco", "best buy",
                       "kohl", "nordstrom", "home depot"],
    },
    "beauty": {
        "keywords": ["salon", "spa", "beauty", "cosmetic", "skincare", "makeup",
                     "hair", "nail", "barber", "massage", "esthetician"],
        "competitors": ["sephora", "ulta", "bath and body works", "lush",
                       "aesop", "kiehl", "glossier", "rare beauty"],
    },
    "technology": {
        "keywords": ["software", "saas", "app", "tech", "platform", "cloud",
                     "digital", "ai", "machine learning", "data", "startup"],
        "competitors": ["microsoft", "google", "amazon", "apple", "meta", "salesforce",
                       "oracle", "adobe", "shopify", "hubspot", "stripe"],
    },
    "healthcare": {
        "keywords": ["clinic", "medical", "doctor", "hospital", "health", "wellness",
                     "therapy", "telehealth", "pharmacy", "dental", "vision"],
        "competitors": ["unitedhealth", "cvs", "walgreens", "one medical", "teladoc",
                       "zymergen"],
    },
    "education": {
        "keywords": ["tutoring", "course", "training", "education", "learning",
                     "academy", "online course", "mentoring", "coach", "consulting"],
        "competitors": ["coursera", "udemy", "masterclass", "khan academy", "skillshare",
                       "linkedin learning", "edx"],
    },
}


def classify_industry(business_name: str, industry: str) -> dict:
    """
    Classify the business into our known industry taxonomy.
    Returns matched categories with confidence scores.
    """
    text = (business_name + " " + industry).lower()
    matches = {}

    for category, signals in INDUSTRY_SIGNALS.items():
        score = 0
        for kw in signals["keywords"]:
            if kw in text:
                score += 1
        if score > 0:
            matches[category] = {
                "score": score,
                "total_keywords": len(signals["keywords"]),
                "confidence": min(score / 3, 1.0),
                "known_competitors": signals["competitors"],
            }

    return dict(sorted(matches.items(), key=lambda x: x[1]["score"], reverse=True))


# ─── Competitor Identification ─────────────────────────────────────────

def identify_competitors_from_search(
    search_results: list[dict],
    business_name: str,
    industry: str,
    known_competitors: list[str]
) -> list[dict]:
    """
    Scan search results and extract likely competitor information.
    """
    competitors = []
    seen = set()

    all_text = (business_name + " " + industry).lower()

    for result in search_results:
        url = result.get("url", "")
        title = result.get("title", "")
        snippet = result.get("snippet", "")

        # Skip own business
        biz_parts = business_name.lower().split()
        if biz_parts and biz_parts[0] in url.lower():
            continue

        combined = (title + " " + snippet).lower()
        score = 0

        # Check if matches industry keywords
        for category, signals in INDUSTRY_SIGNALS.items():
            if any(kw in all_text for kw in signals["keywords"]):
                for kw in signals["keywords"]:
                    if kw in combined:
                        score += 1

        # Check if known competitor
        is_known = False
        for kc in known_competitors:
            if kc.lower() in url.lower() or kc.lower() in title.lower():
                is_known = True
                score += 5
                break

        if score == 0:
            continue

        competitor = {
            "name": title.split(" | ")[0].split(" — ")[0].split(" - ")[0].strip() if title else url.split("//")[1].split("/")[0] if "//" in url else url,
            "url": url,
            "source": result.get("source", ""),
            "relevance_score": score,
            "is_known_competitor": is_known,
            "snippet": snippet[:300] if snippet else "",
        }

        dedup_key = url.split("//")[-1].split("/")[0]  # domain
        if dedup_key not in seen:
            seen.add(dedup_key)
            competitors.append(competitor)

    competitors.sort(key=lambda x: x["relevance_score"], reverse=True)
    return competitors


# ─── Review Data Extraction ────────────────────────────────────────────

def extract_reviews_from_page(page_data: dict) -> dict:
    """
    Extract review data from a page (ratings, review count, etc.).
    Works on review sites and business pages.
    """
    text = (page_data.get("body_preview", "") + " " +
            page_data.get("description", "")).lower()

    # Try to find star ratings
    rating = None
    rating_patterns = [
        r'(\d+(?:\.\d+)?)\s*(?:out of|/|star|rating|stars)',
        r'rating[:\s]*(\d+(?:\.\d+)?)',
        r'(\d+(?:\.\d+)?)\s*stars?',
    ]
    for pat in rating_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                r = float(m.group(1))
                if 1 <= r <= 5:
                    rating = r
                    break
            except ValueError:
                pass

    # Try to find review count
    review_count = None
    count_patterns = [
        r'(\d[\d,]*)\s*(?:review|rating|reviewer)',
        r'based on (\d[\d,]*)',
        r'(\d[\d,]*)\s+customer review',
    ]
    for pat in count_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                review_count = int(m.group(1).replace(",", ""))
                break
            except ValueError:
                pass

    return {
        "rating": rating,
        "review_count": review_count,
    }


def estimate_business_size(page_data: dict) -> dict:
    """
    Estimate business size from page content.
    """
    text = (page_data.get("body_preview", "") + " " +
            page_data.get("description", "")).lower()

    size_signals = {
        "small": ["small business", "family owned", "local", "independent",
                  "mom and pop", "startup", "boutique"],
        "medium": ["growing", "mid-size", "regional", "established", "team of"],
        "large": ["enterprise", "fortune 500", "global", "international",
                  "thousands of", "multi-billion", "industry leader"],
    }

    sizes = {}
    for size, signals in size_signals.items():
        count = sum(1 for s in signals if s in text)
        if count > 0:
            sizes[size] = count

    return {"detected_sizes": sizes} if sizes else {"detected_sizes": {}}


# ─── Market Gap Analysis ──────────────────────────────────────────────

def analyze_market_gaps(
    competitors: list[dict],
    business_name: str,
    industry: str
) -> dict:
    """
    Identify market gaps and opportunities based on competitor analysis.
    """
    gaps = []
    all_text = business_name.lower() + " " + industry.lower()

    # Strategy 1: Look for underserved segments
    gaps.append({
        "type": "opportunity",
        "description": f"Analyze competitor offerings to identify underserved market segments in {industry}",
        "confidence": "medium",
    })

    # Strategy 2: Check if competitors show lack of specialization
    has_specialization = False
    for c in competitors[:5]:
        snippet = c.get("snippet", "").lower()
        if "special" in snippet or "niche" in snippet or "premium" in snippet:
            has_specialization = True
            break

    if not has_specialization:
        gaps.append({
            "type": "differentiation",
            "description": f"Competitors appear to be generalists — opportunity to specialize in a niche within {industry}",
            "confidence": "medium",
        })

    # Strategy 3: Pricing gap
    pricing_mentions = []
    for c in competitors:
        snippet = c.get("snippet", "").lower()
        if any(kw in snippet for kw in ["$", "price", "cost", "pricing", "affordable", "budget"]):
            pricing_mentions.append(c["name"])

    if len(pricing_mentions) < 3:
        gaps.append({
            "type": "pricing",
            "description": "Few competitors openly discuss pricing — transparent pricing could be a differentiator",
            "confidence": "low",
        })

    # Strategy 4: Digital presence gap
    gaps.append({
        "type": "digital",
        "description": "Competitor digital presence analysis — identify gaps in SEO, content marketing, social media",
        "confidence": "medium",
    })

    return {"gaps": gaps}


# ─── Main Analysis Pipeline ────────────────────────────────────────────

def run_competitive_analysis(
    business_name: str,
    industry: str,
    search_results: list[dict],
    extracted_pages: list[dict],
) -> dict:
    """
    Full competitive analysis pipeline.
    """
    # 1. Classify industry
    industry_class = classify_industry(business_name, industry)
    known_competitors = []
    for cat, info in industry_class.items():
        known_competitors.extend(info["known_competitors"])

    primary_category = list(industry_class.keys())[0] if industry_class else "general"

    # 2. Identify competitors from search results
    competitors = identify_competitors_from_search(
        search_results, business_name, industry, known_competitors
    )

    # 3. Extract reviews from extracted pages
    review_data = {}
    for page in extracted_pages:
        if page:
            reviews = extract_reviews_from_page(page)
            if reviews.get("rating") or reviews.get("review_count"):
                domain = page["url"].split("//")[-1].split("/")[0]
                review_data[domain] = reviews

    # 4. Market gap analysis
    market_analysis = analyze_market_gaps(competitors, business_name, industry)

    return {
        "business": {
            "name": business_name,
            "industry": industry,
            "primary_category": primary_category,
            "industry_classification": industry_class,
        },
        "competitors": {
            "total_found": len(competitors),
            "known_brands": [c for c in competitors if c["is_known_competitor"]],
            "local_competitors": [c for c in competitors if not c["is_known_competitor"]],
            "all_competitors": competitors,
        },
        "review_intelligence": review_data,
        "market_opportunities": market_analysis,
    }


# ─── Report Formatter ──────────────────────────────────────────────────

def format_analysis_report(analysis: dict) -> str:
    """
    Format the competitive analysis as a readable markdown report.
    """
    biz = analysis["business"]
    comp = analysis["competitors"]
    opps = analysis["market_opportunities"]

    lines = []

    # Header
    lines.append(f"# Competitive Intelligence Report")
    lines.append(f"**Business:** {biz['name']}")
    lines.append(f"**Industry:** {biz['industry']}")
    lines.append(f"**Classification:** {biz['primary_category'].title()}")
    lines.append("")

    # Market Overview
    lines.append("## Market Overview")
    lines.append(f"- **Total competitors identified:** {comp['total_found']}")
    lines.append(f"- **Major/known brands:** {len(comp['known_brands'])}")
    lines.append(f"- **Local/independent competitors:** {len(comp['local_competitors'])}")

    if comp['known_brands']:
        lines.append("\n### Known Competitors")
        for kc in comp['known_brands'][:8]:
            lines.append(f"- **{kc['name']}** — {kc['url']}")

    if comp['local_competitors']:
        lines.append("\n### Other Competitors")
        for lc in comp['local_competitors'][:10]:
            snippet = f" — {lc['snippet'][:100]}" if lc['snippet'] else ""
            lines.append(f"- **{lc['name']}**{snippet}")

    lines.append("")

    # Competitive Landscape
    lines.append("## Competitive Landscape")
    lines.append(f"### {biz['primary_category'].title()} Industry Players")

    if len(comp['known_brands']) > 0:
        lines.append(f"\nThe {biz['primary_category']} industry has {len(comp['known_brands'])} major national players identified. "
                     f"The primary challenge for {biz['name']} is differentiating from these established brands.")

    lines.append("")

    if analysis.get("review_intelligence"):
        lines.append("## Review Intelligence")
        for domain, reviews in analysis["review_intelligence"].items():
            rating_info = f"★ {reviews['rating']}/5" if reviews.get("rating") else "No rating detected"
            count_info = f" ({reviews['review_count']} reviews)" if reviews.get("review_count") else ""
            lines.append(f"- **{domain}**: {rating_info}{count_info}")
        lines.append("")

    # Market Opportunities
    lines.append("## Market Opportunities & Gaps")
    for gap in opps.get("gaps", []):
        confidence_icon = {
            "high": "🟢",
            "medium": "🟡",
            "low": "🔴",
        }.get(gap["confidence"], "⚪")
        lines.append(f"- {confidence_icon} **{gap['type'].title()}**: {gap['description']}")

    lines.append("")
    lines.append("---")
    lines.append(f"*Report generated by Jade Compass Intelligence Engine*")

    return "\n".join(lines)
