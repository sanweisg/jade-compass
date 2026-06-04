"""
Search Engine — Multi-source web search and data extraction.
"""
import json
import re
import time
import urllib.request
import urllib.parse
import urllib.error
import ssl
from html.parser import HTMLParser
from typing import Optional


class MLStripper(HTMLParser):
    """Strip HTML tags to get clean text."""
    def __init__(self):
        super().__init__()
        self.reset()
        self.strict = False
        self.convert_charrefs = True
        self.text = []

    def handle_data(self, d):
        self.text.append(d)

    def get_data(self):
        return ''.join(self.text)


def strip_html(html: str) -> str:
    s = MLStripper()
    s.feed(html)
    return s.get_data()


# ─── HTTP Client ───────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
}


def http_get(url: str, timeout: int = 10) -> Optional[str]:
    """Fetch a URL. Returns None on failure. Truncates large responses."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url, headers=HEADERS, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            raw = resp.read(200000)  # Cap at 200KB to avoid regex hangs
            # Try UTF-8 first, fallback to detected encoding
            try:
                return raw.decode("utf-8")
            except UnicodeDecodeError:
                return raw.decode("latin-1")
    except Exception as e:
        return None


# ─── Search Engine ─────────────────────────────────────────────────────

class SearchClient:
    """
    Searches the web using public search engines and returns structured results.
    Uses multiple strategies: direct Google scraping, browser-based fallback.
    """

    def __init__(self):
        self.session = None  # placeholder for future session management

    def search_google(self, query: str, num: int = 5) -> list[dict]:
        """Search Google and return organic results. Optimized for speed."""
        results = []
        encoded = urllib.parse.quote(query)
        url = f"https://www.google.com/search?q={encoded}&num={num}&hl=en"

        html = http_get(url, timeout=8)
        if not html:
            return results

        seen_urls = set()
        
        # Fast extraction: find <a> tags with href in /url?q= format
        for match in re.finditer(
            r'<a[^>]*href="(/url\?q=(https?://[^"&]+)[^"]*)"[^>]*>',
            html
        ):
            href = match.group(2)
            if href in seen_urls:
                continue
            if any(skip in href for skip in ['google.com/', 'accounts.', 'policies', 
                                              'support.google', 'youtube.com']):
                continue
            seen_urls.add(href)
            
            # Get title from next reasonable text span
            after = html[match.end():match.end()+300]
            title = strip_html(after.split('<')[0]).strip() if '<' in after else after.strip()
            if not title or len(title) < 5:
                continue
                
            results.append({
                "url": href,
                "title": title[:200],
                "snippet": "",
                "source": "google"
            })
            
            if len(results) >= num:
                break

        return results

    def search_bing(self, query: str, num: int = 10) -> list[dict]:
        """Search Bing as alternative source."""
        results = []
        encoded = urllib.parse.quote(query)
        url = f"https://www.bing.com/search?q={encoded}&count={num}"

        html = http_get(url)
        if not html:
            return results

        seen_urls = set()
        for match in re.finditer(
            r'<a[^>]*href="(https?://[^"]+)"[^>]*>.*?<cite[^>]*>(.*?)</cite>.*?</a>',
            html, re.DOTALL
        ):
            href = match.group(1)
            if href in seen_urls:
                continue
            if any(skip in href for skip in ['bing.com', 'microsoft.com']):
                continue
            seen_urls.add(href)
            
            # Get title from the <a> tag's inner text
            title_match = re.search(
                r'<a[^>]*href="' + re.escape(href) + r'"[^>]*>(.*?)</a>',
                html, re.DOTALL
            )
            title = strip_html(title_match.group(1)).strip() if title_match else ""

            results.append({
                "url": href,
                "title": title[:200] if title else href,
                "snippet": "",
                "source": "bing"
            })
            if len(results) >= num:
                break

        return results

    def search_duckduckgo(self, query: str, num: int = 10) -> list[dict]:
        """Search DuckDuckGo."""
        results = []
        encoded = urllib.parse.quote(query)
        url = f"https://html.duckduckgo.com/html/?q={encoded}"

        html = http_get(url)
        if not html:
            return results

        seen_urls = set()
        for match in re.finditer(
            r'<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>',
            html, re.DOTALL
        ):
            href = match.group(1)
            # DDG redirect URLs
            if href.startswith('//'):
                href = 'https:' + href
            title = strip_html(match.group(2)).strip()
            
            if not title or href in seen_urls:
                continue
            seen_urls.add(href)

            results.append({
                "url": href,
                "title": title[:200],
                "snippet": "",
                "source": "duckduckgo"
            })
            if len(results) >= num:
                break

        return results

    def multi_search(self, query: str, num: int = 8) -> list[dict]:
        """Search multiple engines and merge results."""
        all_results = []
        seen = set()

        # Try Google first
        try:
            results = self.search_google(query, num)
            for r in results:
                if r["url"] not in seen:
                    seen.add(r["url"])
                    all_results.append(r)
        except Exception:
            pass

        # Try Bing
        if len(all_results) < num:
            try:
                results = self.search_bing(query, num)
                for r in results:
                    if r["url"] not in seen:
                        seen.add(r["url"])
                        all_results.append(r)
            except Exception:
                pass

        # Try DuckDuckGo
        if len(all_results) < num:
            try:
                results = self.search_duckduckgo(query, num)
                for r in results:
                    if r["url"] not in seen:
                        seen.add(r["url"])
                        all_results.append(r)
            except Exception:
                pass

        return all_results[:num * 3]  # Return extra for dedup later

    def extract_page(self, url: str) -> Optional[dict]:
        """Extract structured content from a single page."""
        html = http_get(url, timeout=20)
        if not html:
            return None

        # Extract title
        title_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.DOTALL)
        title = strip_html(title_match.group(1)).strip() if title_match else ""

        # Extract meta description
        desc_match = re.search(
            r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\']',
            html, re.DOTALL
        )
        description = desc_match.group(1) if desc_match else ""

        # Extract meta keywords
        kw_match = re.search(
            r'<meta[^>]*name=["\']keywords["\'][^>]*content=["\']([^"\']*)["\']',
            html, re.DOTALL
        )
        keywords = kw_match.group(1) if kw_match else ""

        # Extract h1 tags
        h1_tags = re.findall(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
        headings = [strip_html(h).strip() for h in h1_tags if strip_html(h).strip()]

        # Extract all text (rough)
        body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL)
        body_text = ""
        if body_match:
            body_text = strip_html(body_match.group(1))
            # Clean whitespace
            body_text = re.sub(r'\s+', ' ', body_text).strip()[:5000]

        return {
            "url": url,
            "title": title,
            "description": description,
            "keywords": keywords,
            "headings": headings,
            "body_preview": body_text[:2000],
            "body_length": len(body_text),
        }
