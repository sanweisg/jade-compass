#!/usr/bin/env python3
"""
Jade Compass Lead Scraper — Google Maps alternative via web search.
Searches for businesses by industry + location, extracts contact info.
"""
import json, re, sys, os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


# ─── Target Configuration ───────────────────────────────────────────

TARGETS = {
    "pet_services": {
        "label": "Pet Stores & Grooming",
        "queries": [
            "pet store {city} WhatsApp phone contact",
            "pet grooming {city} phone number WhatsApp",
            "pet shop {city} contact email phone",
            "dog grooming {city} WhatsApp",
        ],
    },
    "restaurants": {
        "label": "Independent Restaurants & Cafes",
        "queries": [
            "independent cafe {city} phone contact WhatsApp",
            "restaurant {city} small business contact",
            "bistro {city} phone number email",
            "coffee shop {city} independent local contact",
        ],
    },
    "fitness": {
        "label": "Gyms & Fitness Studios",
        "queries": [
            "gym {city} personal training phone WhatsApp",
            "fitness studio {city} independent contact",
            "yoga studio {city} phone number email",
            "crossfit {city} contact WhatsApp",
        ],
    },
    "auto_repair": {
        "label": "Auto Repair & Mechanics",
        "queries": [
            "auto repair {city} independent shop phone",
            "car mechanic {city} small business WhatsApp",
            "garage {city} independent contact phone",
            "mot service {city} phone number email",
        ],
    },
}

CITIES = [
    # UK
    {"city": "London", "country": "UK", "region": "London"},
    {"city": "Manchester", "country": "UK", "region": "North West"},
    {"city": "Birmingham", "country": "UK", "region": "West Midlands"},
    
    # Ireland
    {"city": "Dublin", "country": "Ireland", "region": "Dublin"},
    {"city": "Cork", "country": "Ireland", "region":"Munster"},
    
    # Australia
    {"city": "Sydney", "country": "Australia", "region": "NSW"},
    {"city": "Melbourne", "country": "Australia", "region": "VIC"},
]

# Phone/contact patterns
PHONE_PATTERN = re.compile(
    r'(?:(?:\+44|0044|0)\s*[1-9]\d{0,3}[\s-]?\d{3,4}[\s-]?\d{3,4})|'  # UK
    r'(?:(?:\+353|00353|0)\s*\d{1,3}[\s-]?\d{3,4}[\s-]?\d{3,4})|'      # Ireland
    r'(?:(?:\+61|0061|0)\s*\d{1,3}[\s-]?\d{3,4}[\s-]?\d{3,4})|'        # Australia
    r'(?:\d{4,5}[\s-]?\d{5,6})'  # Generic
)

WHATSAPP_PATTERN = re.compile(
    r'(?:WhatsApp|whatsapp|WA)[:\s]*((?:\+?\d[\d\s-]{7,15}))|'
    r'((?:\+?\d[\d\s-]{7,15}))(?=.*(?:WhatsApp|whatsapp|WA))',
    re.IGNORECASE
)

EMAIL_PATTERN = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')


def extract_contacts(text: str, url: str = "", title: str = "") -> dict:
    """Extract phone, WhatsApp, and email from text."""
    contacts = {"phone": [], "whatsapp": [], "email": [], "source_url": url, "source_title": title}
    
    # Extract all phone numbers
    phones = PHONE_PATTERN.findall(text)
    # PHONE_PATTERN with alternation returns tuples
    phone_set = set()
    for match in re.finditer(PHONE_PATTERN, text):
        num = match.group(0).strip()
        if len(num) >= 7:  # sanity check
            phone_set.add(num)
    contacts["phone"] = list(phone_set)
    
    # Extract WhatsApp-specific numbers
    for match in re.finditer(WHATSAPP_PATTERN, text):
        for g in match.groups():
            if g and len(g.strip()) >= 7:
                num = g.strip()
                if num not in contacts["phone"]:
                    contacts["phone"].append(num)
                contacts["whatsapp"].append(num)
    
    # Extract emails
    emails = EMAIL_PATTERN.findall(text)
    contacts["email"] = list(set(emails))
    
    return contacts


def search_and_extract(industry: str, city: str, country: str) -> list[dict]:
    """Search for businesses and extract contact info."""
    from hermes_tools import web_search, web_extract
    
    results = []
    seen_urls = set()
    
    queries = TARGETS[industry]["queries"]
    
    for query_template in queries:
        query = query_template.format(city=city)
        
        try:
            search_res = web_search(query, limit=5)
            items = search_res.get("data", {}).get("web", [])
            
            for item in items:
                url = item.get("url", "")
                if url in seen_urls:
                    continue
                seen_urls.add(url)
                
                title = item.get("title", "")
                desc = item.get("description", "")
                combined = (title + " " + desc)[:3000]
                
                contacts = extract_contacts(combined, url, title)
                
                # Only keep if we found a phone or email
                if contacts["phone"] or contacts["email"]:
                    results.append({
                        "business_name": title.split(" | ")[0].split(" — ")[0].strip()[:80],
                        "industry": industry,
                        "industry_label": TARGETS[industry]["label"],
                        "city": city,
                        "country": country,
                        "url": url,
                        **contacts,
                        "search_query": query,
                    })
        except Exception as e:
            pass
    
    return results


def main():
    """Main scraper — runs across all targets."""
    from hermes_tools import web_search, web_extract
    
    all_leads = []
    
    print(f"\n{'='*60}")
    print(f"🔍 JADE COMPASS LEAD SCRAPER")
    print(f"{'='*60}")
    print(f"   Industries: {', '.join(TARGETS.keys())}")
    print(f"   Cities: {', '.join(c['city'] + ', ' + c['country'] for c in CITIES)}")
    print(f"{'='*60}\n")
    
    total_searches = sum(len(ind["queries"]) for ind in TARGETS.values())
    print(f"Total search queries: {total_searches} per city × {len(CITIES)} cities = {total_searches * len(CITIES)}")
    print(f"\nStarting...\n")
    
    for industry_key in TARGETS:
        ind_label = TARGETS[industry_key]["label"]
        
        for city_info in CITIES:
            city = city_info["city"]
            country = city_info["country"]
            
            print(f"[{ind_label}] {city}, {country}...", end=" ", flush=True)
            
            leads = search_and_extract(industry_key, city, country)
            all_leads.extend(leads)
            
            # Dedup by URL
            seen = set()
            unique = []
            for l in all_leads:
                if l["url"] not in seen:
                    seen.add(l["url"])
                    unique.append(l)
            all_leads = unique
            
            print(f"{len(leads)} leads (total: {len(all_leads)})")
    
    # ─── Save ──────────────────────────────────────────────────────
    output_path = "/home/jace/jade-compass/crawler/output/leads.json"
    
    result = {
        "generated_at": datetime.now().isoformat(),
        "total_leads": len(all_leads),
        "leads": all_leads,
        "summary": {
            "by_industry": {},
            "by_country": {},
            "with_whatsapp": sum(1 for l in all_leads if l.get("whatsapp")),
            "with_phone": sum(1 for l in all_leads if l.get("phone")),
            "with_email": sum(1 for l in all_leads if l.get("email")),
        }
    }
    
    for l in all_leads:
        ind = l["industry_label"]
        ctry = l["country"]
        result["summary"]["by_industry"][ind] = result["summary"]["by_industry"].get(ind, 0) + 1
        result["summary"]["by_country"][ctry] = result["summary"]["by_country"].get(ctry, 0) + 1
    
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    # ─── Print summary ─────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"✅ LEAD SCRAPING COMPLETE!")
    print(f"{'='*60}")
    print(f"   Total leads: {result['total_leads']}")
    print(f"   With phone: {result['summary']['with_phone']}")
    print(f"   With WhatsApp: {result['summary']['with_whatsapp']}")
    print(f"   With email: {result['summary']['with_email']}")
    print(f"\n   By Industry:")
    for ind, count in sorted(result["summary"]["by_industry"].items(), key=lambda x: -x[1]):
        print(f"     {ind}: {count}")
    print(f"\n   By Country:")
    for ctry, count in sorted(result["summary"]["by_country"].items(), key=lambda x: -x[1]):
        print(f"     {ctry}: {count}")
    print(f"\n   Saved: {output_path}")
    
    return result


if __name__ == "__main__":
    print("⚠️  Run via execute_code() to use Hermes tools")
