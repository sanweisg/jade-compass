"""
Jade Compass Competitive Intelligence Crawler
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Multi-source competitive intelligence gathering system.
Searches the web for competitors, extracts structured data,
analyzes market positioning, and identifies opportunities.

Usage:
    from crawler import CompetitiveCrawler
    
    crawler = CompetitiveCrawler()
    result = crawler.analyze(
        business_name="Paws & Claws Pet Supplies",
        industry="Pet Products / Pet Supplies",
        location="United States",
        revenue_range="$500K - $1M"
    )
"""

from .engine import CompetitiveCrawler

__all__ = ["CompetitiveCrawler"]
__version__ = "1.0.0"
