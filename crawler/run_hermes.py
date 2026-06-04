"""
Crawler Runner — Bridges Hermes tools (web_search/web_extract) with the crawler.
Run this via execute_code() to search the web behind the proxy.

Called from:
    python3 /home/jace/jade-compass/crawler/run_hermes.py

Uses:
    from hermes_tools import web_search, web_extract
"""

import sys
import os
import json
from datetime import datetime

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from run import identify_competitors, classify_industry, generate_report


def run(business_name, industry_desc, location="", output_path=None):
    """
    Full crawler run using Hermes tools (web_search, web_extract).
    """
    from hermes_tools import web_search, web_extract

    print(f"\n{'='*50}")
    print(f"🔍 Jade Compass 竞争情报爬虫")
    print(f"{'='*50}")
    print(f"  目标: {business_name}")
    print(f"  行业: {industry_desc}")
    print(f"  位置: {location or '全球'}")
    print(f"{'='*50}\n")

    # ─── Phase 1: Classify industry ─────────────────────────────────
    industry_class = classify_industry(business_name, industry_desc)
    known_brands = []
    for cat, info in industry_class.items():
        known_brands.extend(info.get("brands", []))
    known_brands = list(set(known_brands))
    
    print(f"[1/3] 行业分类: {list(industry_class.keys())}")
    print(f"      已知品牌库: {len(known_brands)} 个")

    # ─── Phase 2: Search queries ────────────────────────────────────
    search_queries = [
        f"{industry_desc} companies",
        f"{industry_desc} brands industry leaders",
        f"top {industry_desc} companies",
        f"best {industry_desc} businesses",
        f"{industry_desc} market trends 2025",
        f"{business_name} {industry_desc} competitors",
    ]

    if location:
        search_queries.insert(0, f"{industry_desc} in {location}")
        search_queries.insert(2, f"{industry_desc} {location} companies")

    all_results = []
    seen_urls = set()

    print(f"\n[2/3] 执行搜索 ({len(search_queries)} 个查询)...")

    for i, query in enumerate(search_queries):
        try:
            result = web_search(query, limit=5)
            items = result.get("data", {}).get("web", [])
            
            for item in items:
                url = item.get("url", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    all_results.append({
                        "url": url,
                        "title": item.get("title", ""),
                        "content": item.get("description", ""),
                        "search_query": query,
                    })
            
            print(f"  [{i+1}/{len(search_queries)}] \"{query}\" → {len(items)} 结果")
        except Exception as e:
            print(f"  [{i+1}/{len(search_queries)}] \"{query}\" → 错误: {e}")

    print(f"\n  去重后共 {len(all_results)} 条唯一 URL")

    # ─── Phase 3: Extract pages ─────────────────────────────────────
    # Pick top relevant URLs to extract
    top_urls = []
    for r in all_results:
        url_lower = r["url"].lower()
        title_lower = r["title"].lower()
        
        # Score relevance
        score = 0
        industry_words = industry_desc.lower().split()
        for w in industry_words:
            if len(w) > 3:
                if w in url_lower: score += 2
                if w in title_lower: score += 1
        
        # Known brands get bonus
        for brand in known_brands:
            if brand.lower() in url_lower or brand.lower() in title_lower:
                score += 5
        
        # Skip aggregators
        for skip in ["wikipedia", "facebook", "twitter", "instagram", 
                     "linkedin", "reddit", "youtube", "pinterest"]:
            if skip in url_lower:
                score -= 3
        
        top_urls.append((r, score))
    
    top_urls.sort(key=lambda x: x[1], reverse=True)
    extract_urls = [u[0] for u in top_urls[:10]]

    print(f"\n[3/3] 提取页面内容 ({len(extract_urls)} 个页面)...")

    extracted_pages = []
    for i, item in enumerate(extract_urls):
        url = item["url"]
        try:
            page_result = web_extract(urls=[url])
            page_data = page_result.get("results", [{}])[0]
            
            if page_data and "content" in page_data:
                extracted_pages.append({
                    "url": url,
                    "title": page_data.get("title", ""),
                    "content": page_data.get("content", "")[:5000],
                    "error": page_data.get("error"),
                })
                print(f"  [{i+1}/{len(extract_urls)}] ✅ {url.split('//')[1][:60]}...")
            else:
                print(f"  [{i+1}/{len(extract_urls)}] ⚠️ {url.split('//')[1][:60]}... (no content)")
        except Exception as e:
            print(f"  [{i+1}/{len(extract_urls)}] ❌ {url.split('//')[1][:60]}... ({e})")

    # ─── Phase 4: Generate analysis ─────────────────────────────────
    result = generate_report(
        business_name, industry_desc, location,
        all_results, extracted_pages
    )

    # Save
    if not output_path:
        safe_name = business_name.lower().replace(" ", "-").replace("&", "and")[:30]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"/home/jace/jade-compass/crawler/output/{safe_name}_{timestamp}.json"
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    # Print results
    comp = result["competitors"]
    print(f"\n{'='*50}")
    print(f"✅ 竞争情报分析完成!")
    print(f"{'='*50}")
    print(f"  企业: {result['metadata']['business']}")
    print(f"  行业: {result['metadata']['industry']}")
    print(f"  竞争对手: {comp['total']} 家")
    print(f"  行业巨头: {len(comp['major_brands'])} 家")
    print(f"  本地竞争者: {len(comp['local_competitors'])} 家")
    print(f"  搜索: {len(search_queries)} 次查询, {len(all_results)} URL")
    print(f"  页面提取: {len(extracted_pages)} 页")
    print(f"  耗时: {result['metadata']['elapsed_seconds']} 秒")
    print(f"\n  报告保存: {output_path}")
    print(f"{'='*50}")

    # Print full markdown report
    print("\n" + result["report_text"])

    return output_path
