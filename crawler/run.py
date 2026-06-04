"""
Jade Compass Competitive Intelligence Crawler
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Uses Hermes tools (web_search, web_extract) for reliable web access
behind the Clash proxy. Runs via execute_code in a Python subprocess.

Usage:
    python3 crawler/run.py --name "Business Name" --industry "Industry" [--location "City"]
"""

import json
import re
import os
import sys
import time
from datetime import datetime
from html.parser import HTMLParser


class MLStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.reset()
        self.text = []
    def handle_data(self, d):
        self.text.append(d)
    def get_data(self):
        return ''.join(self.text)


def strip_html(html):
    s = MLStripper()
    s.feed(html)
    return s.get_data()


# ─── Industry Signals ──────────────────────────────────────────────────

INDUSTRY_DATA = {
    "pet": {
        "keywords": ["pet", "dog", "cat", "animal", "veterinary", "pet supply",
                     "pet food", "pet store", "grooming", "pet care"],
        "brands": ["Chewy", "PetSmart", "Petco", "Pet Supplies Plus", "Mud Bay",
                   "Pet Valu", "BarkBox", "Petmate", "KONG Company"],
    },
    "restaurant": {
        "keywords": ["restaurant", "cafe", "bistro", "dining", "food", "eatery",
                     "fast casual", "takeout", "lunch", "dinner"],
        "brands": ["Chipotle", "Sweetgreen", "Panera", "Chick-fil-A", "Shake Shack",
                   "Five Guys", "Subway", "McDonald's"],
    },
    "fitness": {
        "keywords": ["gym", "fitness", "workout", "exercise", "yoga", "pilates",
                     "personal training", "health club"],
        "brands": ["Planet Fitness", "24 Hour Fitness", "LA Fitness", "Equinox",
                   "OrangeTheory", "SoulCycle", "Barry's", "Crunch"],
    },
    "retail": {
        "keywords": ["store", "shop", "retail", "boutique", "ecommerce", "merchant"],
        "brands": ["Amazon", "Walmart", "Target", "Costco", "Best Buy", "Kohl's", "Nordstrom"],
    },
    "beauty": {
        "keywords": ["salon", "spa", "beauty", "cosmetic", "skincare", "makeup", "hair", "nail"],
        "brands": ["Sephora", "Ulta", "Bath & Body Works", "Lush", "Aesop", "Glossier"],
    },
}


def classify_industry(business_name, industry_desc):
    """Match business to our industry taxonomy."""
    text = (business_name + " " + industry_desc).lower()
    matches = {}
    for cat, signals in INDUSTRY_DATA.items():
        score = sum(1 for kw in signals["keywords"] if kw in text)
        if score > 0:
            matches[cat] = {
                "confidence": min(score / 3, 1.0),
                "brands": signals["brands"],
            }
    return dict(sorted(matches.items(), key=lambda x: x[1]["confidence"], reverse=True))


def identify_competitors(search_results, business_name, industry_desc, known_brands):
    """Identify competitors from web search results."""
    competitors = []
    seen_domains = set()
    biz_lower = business_name.lower().split()

    for r in search_results:
        url = r.get("url", "")
        title = r.get("title", "")
        snippet = r.get("content", "") or r.get("description", "") or ""

        domain = url.split("//")[-1].split("/")[0] if "//" in url else url
        if domain in seen_domains:
            continue

        # Skip own business
        if biz_lower and any(p in url.lower() for p in biz_lower if len(p) > 3):
            continue

        combined = (title + " " + snippet).lower()
        
        # Check relevance to industry
        industry_words = industry_desc.lower().split()
        relevance = sum(1 for w in industry_words if len(w) > 3 and w in combined)
        
        # Check if known brand
        is_brand = False
        for brand in known_brands:
            if brand.lower() in title.lower() or brand.lower() in url.lower():
                is_brand = True
                relevance += 10
                break

        if relevance == 0:
            continue

        seen_domains.add(domain)
        
        name = title.split(" | ")[0].split(" — ")[0].split(" - ")[0].strip()
        if not name or len(name) < 3:
            name = domain.replace("www.", "").split(".")[0].title()

        competitors.append({
            "name": name,
            "url": url,
            "domain": domain,
            "snippet": snippet[:250],
            "relevance": relevance,
            "is_known_brand": is_brand,
        })

    competitors.sort(key=lambda x: x["relevance"], reverse=True)
    return competitors


# ─── Analysis ──────────────────────────────────────────────────────────

def generate_report(business_name, industry_desc, location, search_results, extracted_pages):
    """Full competitive analysis pipeline."""
    start = time.time()

    # Classify
    industry_class = classify_industry(business_name, industry_desc)
    
    # Known brands
    known_brands = []
    for cat, info in industry_class.items():
        known_brands.extend(info["brands"])
    known_brands = list(set(known_brands))
    
    primary_cat = list(industry_class.keys())[0] if industry_class else "general"

    # Competitors from search
    competitors = identify_competitors(search_results, business_name, industry_desc, known_brands)
    major_brands = [c for c in competitors if c["is_known_brand"]]
    local_competitors = [c for c in competitors if not c["is_known_brand"]]

    # Extract ratings from pages
    ratings = {}
    for page in extracted_pages:
        if page and page.get("content"):
            text = page["content"].lower()
            # Find rating patterns
            rating_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:out of\s*5|/5|stars?|rating)', text)
            count_matches = re.findall(r'(\d[\d,]*)\s*(?:review|rating|reviewer)s?', text)
            if rating_matches or count_matches:
                domain = page.get("url", "").split("//")[-1].split("/")[0]
                ratings[domain] = {
                    "rating": rating_matches[0] if rating_matches else None,
                    "review_count": count_matches[0].replace(",", "") if count_matches else None,
                }

    # Generate market gaps
    gaps = _generate_gaps(competitors, industry_desc, primary_cat)
    
    elapsed = round(time.time() - start, 1)

    # Build report
    report = f"""# 竞争情报报告

**企业:** {business_name}
**行业:** {industry_desc}
**位置:** {location or "全球"}
**分类:** {primary_cat.title()}
**生成时间:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

---

## 市场概览

- **发现竞争对手:** {len(competitors)} 家
- **行业巨头:** {len(major_brands)} 家
- **本地/独立竞争者:** {len(local_competitors)} 家
"""

    if major_brands:
        report += "\n### 主要行业巨头\n"
        for c in major_brands[:6]:
            report += f"- **{c['name']}** — {c['domain']}\n"

    if local_competitors:
        report += "\n### 其他竞争企业\n"
        for c in local_competitors[:10]:
            report += f"- **{c['name']}** — {c['domain']}\n"
            if c['snippet']:
                report += f"  > {c['snippet'][:120]}\n"

    report += f"""
## 竞争格局分析

### {primary_cat.title()} 行业格局

- **市场结构:** {len(major_brands)} 家全国性品牌 + {len(local_competitors)} 家区域性/独立企业
- **主要玩家:** {', '.join(c['name'] for c in major_brands[:5]) if major_brands else '待深入调研'}
- **差异化空间:** {_generate_differentiation_insight(primary_cat, local_competitors)}

"""

    if ratings:
        report += "## 用户评分数据\n\n"
        for domain, data in ratings.items():
            if data.get("rating"):
                report += f"- **{domain}**: ⭐ {data['rating']}/5"
                if data.get("review_count"):
                    report += f" ({data['review_count']} 条评价)"
                report += "\n"
        report += "\n"

    report += "## 市场空白与机会\n\n"
    for g in gaps:
        report += f"- **{g['title']}**（可信度: {g['confidence']}）\n"
        report += f"  {g['description']}\n"

    report += f"""
---

## 搜索来源

本次分析执行了 {len(search_results)} 次搜索，提取了 {len(extracted_pages)} 个页面。
耗时: {elapsed} 秒
"""

    return {
        "metadata": {
            "business": business_name,
            "industry": industry_desc,
            "location": location,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "elapsed_seconds": elapsed,
        },
        "classification": {
            "primary_category": primary_cat,
            "categories_found": list(industry_class.keys()),
            "known_brands_in_industry": known_brands,
        },
        "competitors": {
            "total": len(competitors),
            "major_brands": major_brands[:8],
            "local_competitors": local_competitors[:12],
        },
        "ratings_data": ratings,
        "market_gaps": gaps,
        "report_text": report,
    }


def _generate_gaps(competitors, industry, category):
    """Generate market gap analysis."""
    gaps = []

    # Gap 1: Check specialization
    major_players = [c for c in competitors if c["is_known_brand"]]
    locals = [c for c in competitors if not c["is_known_brand"]]
    
    if len(major_players) > 2:
        gaps.append({
            "title": "专业化定位机会",
            "confidence": "高",
            "description": f"行业由{len(major_players)}家大品牌主导，它们覆盖范围广但缺乏深度专业化的细分定位。专注特定品类或客群可以避开正面竞争。"
        })

    if len(locals) < 8:
        gaps.append({
            "title": "区域性竞争优势",
            "confidence": "中",
            "description": f"区域性竞争者较少（仅{len(locals)}家），本地化服务和社区信任可以成为差异化优势。"
        })
    else:
        gaps.append({
            "title": "本地市场竞争激烈",
            "confidence": "高",
            "description": f"已有{len(locals)}家本地/区域竞争者，需要通过更精准的定位来突围。"
        })

    gaps.append({
        "title": "数字营销空白",
        "confidence": "中",
        "description": "许多传统企业的线上存在感薄弱，SEO优化和内容营销是低成本高回报的获客渠道。"
    })

    # Check for review gap
    gaps.append({
        "title": "客户评价管理",
        "confidence": "中",
        "description": "客户评价和在线口碑是关键的信任建立手段。系统化的好评管理和差评处理可以成为竞争优势。"
    })

    if category == "pet":
        gaps.append({
            "title": "宠物服务细分市场",
            "confidence": "高",
            "description": "宠物行业增长点：宠物健康护理、高端宠物食品、宠物保险、宠物旅店。这些细分市场的大品牌覆盖不足。"
        })
    elif category == "restaurant":
        gaps.append({
            "title": "餐饮体验差异化",
            "confidence": "高",
            "description": "消费者越来越重视用餐体验而非仅食物本身。独特氛围、主题活动、会员体系可以差异化。"
        })

    return gaps


def _generate_differentiation_insight(category, local_competitors):
    """Generate differentiation insight."""
    insights = {
        "pet": f"在{len(local_competitors)}家区域性竞争者中，多数是传统宠物店模式。可以通过高品质产品筛选+专业宠物知识咨询+线上社群的模式实现差异化。",
        "restaurant": "快餐连锁店占据标准化市场，独立餐厅可以通过本地食材、特色菜品、个性化服务来建立忠实客群。",
        "fitness": "大型连锁健身房提供标准化设施，精品工作室（瑜伽、普拉提、CrossFit）通过社群和课程体验实现差异化。",
        "retail": f"面对电商巨头的价格竞争，{len(local_competitors)}家本地零售商可以通过精选商品+专业顾问+体验式购物来建立自己的护城河。",
        "beauty": "大型连锁店靠规模和价格优势，独立美容院靠专业技术和个性化服务。",
    }
    return insights.get(category, "通过深入研究客户需求和竞争差距，可以找到专属差异化策略。")


# ─── Save to File ─────────────────────────────────────────────────────

def save_report(result, output_path):
    """Save report to JSON file and print summary."""
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    comp = result["competitors"]
    print(f"\n{'='*50}")
    print(f"✅ 竞争情报分析完成")
    print(f"{'='*50}")
    print(f"  企业: {result['metadata']['business']}")
    print(f"  行业: {result['metadata']['industry']}")
    print(f"  竞争对手: {comp['total']} 家")
    print(f"  行业巨头: {len(comp['major_brands'])} 家")
    print(f"  本地竞争者: {len(comp['local_competitors'])} 家")
    print(f"  耗时: {result['metadata']['elapsed_seconds']} 秒")
    print(f"\n  报告已保存到: {output_path}")
    print(f"{'='*50}\n")
    
    print(result["report_text"])


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--name", required=True)
    parser.add_argument("--industry", required=True)
    parser.add_argument("--location", default="")
    parser.add_argument("--output", "-o", default="")
    args = parser.parse_args()
    
    print(f"⚠️  这个脚本需要通过 Hermes execute_code 运行（使用 web_search / web_extract 工具）")
    print(f"   直接运行只会输出预设测试数据。")
    print(f"   正确用法: 在 Hermes 中调用 run_crawler.py")
