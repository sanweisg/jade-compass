"""
Crawler Engine — Main orchestrator for competitive intelligence gathering.
"""
import json
import time
import os
from datetime import datetime
from typing import Optional

from .search import SearchClient
from .analyze import run_competitive_analysis, format_analysis_report

# ─── Search Strategy Templates ────────────────────────────────────────

SEARCH_STRATEGIES = {
    "direct": [
        "{industry} companies brands",
        "top {industry} industry leaders",
    ],
    "local": [
        "{industry} businesses shops",
        "best {industry} companies",
    ],
    "market": [
        "{industry} market trends growth 2025",
    ],
}


class CompetitiveCrawler:
    """
    Multi-source competitive intelligence crawler.
    
    Usage:
        crawler = CompetitiveCrawler(cache_dir="./crawler_cache")
        result = crawler.analyze(
            business_name="My Business",
            industry="Pet Products",
            location="United States"
        )
    """

    def __init__(self, cache_dir: Optional[str] = None):
        self.search = SearchClient()
        self.cache_dir = cache_dir
        self._search_count = 0

    def analyze(
        self,
        business_name: str,
        industry: str,
        location: str = "",
        revenue_range: str = "",
    ) -> dict:
        """
        Full competitive analysis pipeline.
        
        Args:
            business_name: Name of the business
            industry: Industry/category description
            location: Geographic location (city, state, country)
            revenue_range: Revenue range (e.g., "$500K - $1M")
            
        Returns:
            dict with full analysis results
        """
        start_time = time.time()

        # Phase 1: Gather search intelligence
        raw_search_results = self._gather_intelligence(business_name, industry, location)

        # Phase 2: Extract deep data from top pages
        extracted_pages = self._extract_deep_data(raw_search_results[:8])

        # Phase 3: Run competitive analysis
        analysis = run_competitive_analysis(
            business_name, industry, raw_search_results, extracted_pages
        )

        # Phase 4: Format report
        report_md = format_analysis_report(analysis)

        # Phase 5: Generate structured JSON
        report_json = self._generate_structured_report(
            analysis, report_md, start_time, business_name, industry, location
        )

        return report_json

    def _gather_intelligence(
        self, business_name: str, industry: str, location: str
    ) -> list[dict]:
        """
        Phase 1: Run all search strategies to gather intelligence.
        """
        all_results = []
        seen_urls = set()

        # Generate search queries from strategies
        queries = []
        for strategy, templates in SEARCH_STRATEGIES.items():
            for tmpl in templates:
                query = tmpl.format(industry=industry)
                if location:
                    query += f" {location}"
                queries.append((strategy, query))

        # Add direct business-specific queries
        queries.append(("business", f"{business_name} {industry}"))
        queries.append(("competitive", f"{business_name} vs competitors"))
        queries.append(("competitive", f"{business_name} alternative"))

        # Execute searches
        for strategy, query in queries:
            try:
                results = self.search.multi_search(query, num=5)
                self._search_count += 1

                for r in results:
                    url = r["url"]
                    if url not in seen_urls:
                        seen_urls.add(url)
                        r["search_strategy"] = strategy
                        r["search_query"] = query
                        all_results.append(r)

            except Exception as e:
                continue

        # Sort by relevance heuristic: URLs with industry keywords first
        industry_words = industry.lower().split()

        def relevance_score(r):
            score = 0
            url_lower = r["url"].lower()
            title_lower = r["title"].lower()

            # Industry keyword match
            for w in industry_words:
                if len(w) > 3:
                    if w in url_lower: score += 3
                    if w in title_lower: score += 2

            # .com domains slightly preferred
            if ".com" in url_lower: score += 1

            # Avoid known aggregators
            for agg in ["wikipedia", "facebook.com", "twitter.com", "instagram.com",
                        "linkedin.com", "pinterest", "reddit.com", "youtube.com"]:
                if agg in url_lower: score -= 2

            return score

        all_results.sort(key=relevance_score, reverse=True)

        return all_results

    def _extract_deep_data(self, results: list[dict]) -> list[Optional[dict]]:
        """
        Phase 2: Extract detailed content from top URLs.
        """
        extracted = []
        for i, result in enumerate(results):
            url = result["url"]
            try:
                page = self.search.extract_page(url)
                if page:
                    extracted.append(page)
            except Exception:
                extracted.append(None)
            # Polite delay between requests
            if i < len(results) - 1:
                time.sleep(0.5)

        return extracted

    def _generate_structured_report(
        self,
        analysis: dict,
        report_md: str,
        start_time: float,
        business_name: str,
        industry: str,
        location: str,
    ) -> dict:
        """
        Generate the final JSON report structure.
        """
        elapsed = round(time.time() - start_time, 1)

        comp = analysis["competitors"]
        opps = analysis["market_opportunities"]

        # Top competitors summary
        top_known = [{
            "name": c["name"],
            "url": c["url"],
        } for c in comp.get("known_brands", [])[:5]]

        top_local = [{
            "name": c["name"],
            "url": c["url"],
        } for c in comp.get("local_competitors", [])[:8]]

        return {
            "metadata": {
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "elapsed_seconds": elapsed,
                "searches_executed": self._search_count,
                "competitors_found": comp["total_found"],
            },
            "business": analysis["business"],
            "competitive_landscape": {
                "total_competitors": comp["total_found"],
                "major_brands": top_known,
                "local_competitors": top_local,
                "market_gaps": opps.get("gaps", []),
            },
            "review_intelligence": analysis.get("review_intelligence", {}),
            "report_markdown": report_md,
        }


# ─── CLI Entry Point ──────────────────────────────────────────────────

def main():
    """CLI entry point for running analysis from command line."""
    import argparse

    parser = argparse.ArgumentParser(description="Jade Compass Competitive Intelligence Crawler")
    parser.add_argument("--name", required=True, help="Business name")
    parser.add_argument("--industry", required=True, help="Industry / category")
    parser.add_argument("--location", default="", help="Location (city, state)")
    parser.add_argument("--revenue", default="", help="Revenue range")
    parser.add_argument("--output", "-o", default="", help="Output file path (JSON)")
    parser.add_argument("--pretty", action="store_true", help="Pretty print to stdout")

    args = parser.parse_args()

    crawler = CompetitiveCrawler()
    result = crawler.analyze(
        business_name=args.name,
        industry=args.industry,
        location=args.location,
        revenue_range=args.revenue,
    )

    output = json.dumps(result, indent=2, ensure_ascii=False)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"✅ Report saved to {args.output}")
        print(f"   Found {result['competitive_landscape']['total_competitors']} competitors")
        print(f"   Searches: {result['metadata']['searches_executed']}")
        print(f"   Time: {result['metadata']['elapsed_seconds']}s")
    elif args.pretty:
        print(output)
    else:
        print(result["report_markdown"])


if __name__ == "__main__":
    main()
