"""
Review Scraper & Sentiment Analysis — Extract ratings, reviews, and sentiment
from public business data sources using Hermes tools.
"""
import re
import json
import time
import math
from datetime import datetime


# ─── Rating Extraction ─────────────────────────────────────────────────

RATING_PATTERNS = [
    # Standard: 4.5 out of 5, 4.5/5, 4.5 stars
    r'(\d+(?:\.\d+)?)\s*(?:out of\s*5|/5|stars?\s*$|(?:star\s+)?rating\s*$)',
    # Google aggregate: ☆ 4.5
    r'(?:☆|★|⭐)\s*(\d+(?:\.\d+)?)\s*(?:☆|★|⭐)',
    # Yelp: 4.5 star rating
    r'(\d+(?:\.\d+)?)\s*star\s*rating',
    # "Rated 4.5"
    r'[Rr]ated\s+(\d+(?:\.\d+)?)\s*(?:out of|/)',
]

COUNT_PATTERNS = [
    r'(\d[\d,]*)\s*(?:reviews?|ratings?|votes?)',
    r'(?:reviews?|ratings?):\s*(\d[\d,]*)',
    r'based on\s+(\d[\d,]*)',
]


def extract_rating(text: str) -> float | None:
    """Extract star rating from text."""
    for pat in RATING_PATTERNS:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            try:
                r = float(m.group(1))
                if 1.0 <= r <= 5.0:
                    return r
            except ValueError:
                pass
    return None


def extract_review_count(text: str) -> int | None:
    """Extract number of reviews from text."""
    for pat in COUNT_PATTERNS:
        matches = re.findall(pat, text, re.IGNORECASE)
        for m in matches:
            try:
                count = int(m.replace(",", ""))
                if 1 <= count <= 999999:
                    return count
            except ValueError:
                pass
    return None


# ─── Sentiment Keyword Analysis ───────────────────────────────────────

SENTIMENT_POSITIVE = {
    "great": 2, "excellent": 3, "amazing": 3, "love": 3, "best": 3,
    "friendly": 2, "helpful": 2, "knowledgeable": 3, "clean": 1, "nice": 1,
    "good": 1, "wonderful": 3, "fantastic": 3, "awesome": 3, "recommend": 2,
    "convenient": 2, "affordable": 2, "quality": 2, "high-quality": 3,
    "professional": 2, "caring": 2, "convenient location": 2, "easy": 1,
    "quick": 1, "fast": 1, "responsive": 2, "wide selection": 2,
    "fresh": 1, "organic": 2, "natural": 1, "happy": 2, "satisfied": 2,
    "worth it": 2, "good value": 2, "fair price": 2, "loyal": 2,
}

SENTIMENT_NEGATIVE = {
    "expensive": -2, "overpriced": -3, "pricey": -2, "cheap": -1,
    "poor": -2, "terrible": -3, "awful": -3, "horrible": -3, "bad": -2,
    "rude": -3, "unhelpful": -2, "unfriendly": -2, "dirty": -2,
    "crowded": -1, "limited": -1, "disappointed": -2, "disappointing": -2,
    "worst": -3, "avoid": -3, "never again": -3, "waste": -2,
    "broken": -2, "defective": -2, "damaged": -2, "late": -1,
    "slow": -1, "unresponsive": -2, "unreliable": -2, "complaint": -2,
    "issue": -1, "problem": -1, "not worth": -3, "overrated": -2,
    "low quality": -2, "poor quality": -2, "cheaply made": -2,
}

# Category-specific sentiment (what customers care about in each vertical)
CATEGORY_THEMES = {
    "pet_supplies": {
        "price": ["price", "expensive", "cheap", "cost", "affordable", "overpriced", "deal"],
        "quality": ["quality", "durable", "well-made", "cheaply made", "broken", "lasts"],
        "selection": ["selection", "variety", "stock", "options", "limited", "wide"],
        "service": ["friendly", "helpful", "knowledgeable", "rude", "service", "staff"],
        "convenience": ["location", "parking", "hours", "convenient", "easy"],
    },
    "restaurant": {
        "price": ["price", "expensive", "cheap", "value", "overpriced"],
        "quality": ["delicious", "fresh", "tasty", "good", "bland", "quality"],
        "service": ["service", "friendly", "slow", "fast", "attentive", "rude"],
        "ambiance": ["atmosphere", "clean", "nice", "loud", "cozy"],
        "location": ["location", "parking", "convenient"],
    },
}


def analyze_sentiment(text: str) -> dict:
    """Basic sentiment analysis of text using keyword scoring."""
    text_lower = text.lower()
    
    # Score the text
    score = 0
    matches = []
    
    for word, weight in SENTIMENT_POSITIVE.items():
        count = text_lower.count(word)
        if count > 0:
            score += weight * count
            matches.append({"word": word, "count": count, "score": weight})
    
    for word, weight in SENTIMENT_NEGATIVE.items():
        count = text_lower.count(word)
        if count > 0:
            score += weight * count
            matches.append({"word": word, "count": count, "score": weight})
    
    # Determine sentiment
    if score > 3:
        sentiment = "positive"
    elif score < -3:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    # Frequency of key themes
    themes = {
        "price": 0, "quality": 0, "service": 0, "selection": 0, "convenience": 0
    }
    theme_words = {
        "price": ["price", "cost", "expensive", "cheap", "affordable", "value", "deal", "overpriced", "reasonable"],
        "quality": ["quality", "durable", "well", "broken", "good", "great", "excellent", "bad", "poor"],
        "service": ["service", "friendly", "helpful", "staff", "rude", "knowledgeable", "support", "employee"],
        "selection": ["selection", "variety", "wide", "limited", "stock", "choose", "options"],
        "convenience": ["location", "parking", "easy", "convenient", "hours", "near", "close"],
    }
    
    for theme, words in theme_words.items():
        themes[theme] = sum(1 for w in words if w in text_lower)
    
    return {
        "score": score,
        "sentiment": sentiment,
        "matches_count": len(matches),
        "top_matches": sorted(matches, key=lambda x: abs(x["score"]) * x["count"], reverse=True)[:8],
        "themes": themes,
    }


def analyze_review_texts(reviews: list[str]) -> dict:
    """Analyze multiple review texts for aggregate sentiment."""
    if not reviews:
        return {"error": "No review texts provided"}
    
    all_analyses = [analyze_sentiment(r) for r in reviews]
    
    total_score = sum(a["score"] for a in all_analyses)
    avg_score = round(total_score / len(reviews), 1)
    
    positive_count = sum(1 for a in all_analyses if a["sentiment"] == "positive")
    negative_count = sum(1 for a in all_analyses if a["sentiment"] == "negative")
    neutral_count = sum(1 for a in all_analyses if a["sentiment"] == "neutral")
    
    # Aggregate themes
    all_themes = {}
    for a in all_analyses:
        for theme, count in a["themes"].items():
            all_themes[theme] = all_themes.get(theme, 0) + count
    
    top_themes = sorted(all_themes.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "reviews_analyzed": len(reviews),
        "average_sentiment_score": avg_score,
        "breakdown": {
            "positive": positive_count,
            "negative": negative_count,
            "neutral": neutral_count,
        },
        "overall_label": "positive" if positive_count > negative_count * 2 else 
                        "negative" if negative_count > positive_count * 2 else "mixed",
        "top_themes": [{"theme": k, "mentions": v} for k, v in top_themes[:5]],
    }


# ─── Google/Yelp Search ───────────────────────────────────────────────

def search_business_reviews(business_name: str, domain: str = "") -> dict:
    """
    Search for reviews/ratings of a business.
    To be called via execute_code with web_search.
    """
    from hermes_tools import web_search
    
    queries = [
        f"{business_name} reviews ratings",
        f"{business_name} reviews",
    ]
    if domain:
        queries.insert(0, f"{domain} reviews ratings")
    
    combined_text = []
    found_rating = None
    found_count = None
    
    for query in queries:
        try:
            results = web_search(query, limit=3)
            items = results.get("data", {}).get("web", [])
            
            for item in items:
                text = (item.get("title", "") + " " + item.get("description", "")).lower()
                combined_text.append(text)
                
                if not found_rating:
                    found_rating = extract_rating(text)
                if not found_count:
                    found_count = extract_review_count(text)
        except Exception:
            pass
    
    return {
        "business": business_name,
        "rating": found_rating,
        "review_count": found_count,
        "search_results_raw": len(combined_text),
        "source": "web_search"
    }


# ─── Yelp Data Extractor ──────────────────────────────────────────────

def extract_yelp_listing(yelp_url: str) -> dict | None:
    """
    Extract rating data from a Yelp business page.
    To be called via execute_code with web_extract.
    """
    from hermes_tools import web_extract
    
    try:
        result = web_extract(urls=[yelp_url])
        if not result or not result.get("results"):
            return None
        
        page = result["results"][0]
        content = page.get("content", "") or ""
        title = page.get("title", "")
        
        if not content:
            return None
        
        rating = extract_rating(content) or extract_rating(title)
        count = extract_review_count(content)
        
        # Sentiment on descriptions
        sentiment = analyze_sentiment(content[:3000])
        
        return {
            "url": yelp_url,
            "title": title,
            "rating": rating,
            "review_count": count,
            "sentiment": sentiment["sentiment"],
            "sentiment_score": sentiment["score"],
        }
    except Exception as e:
        return {"url": yelp_url, "error": str(e)}


# ─── Summary Generator ────────────────────────────────────────────────

def generate_review_summary(review_data: list[dict]) -> dict:
    """Generate overall review intelligence summary."""
    valid = [r for r in review_data if r.get("rating") or r.get("review_count")]
    
    if not valid:
        return {
            "status": "no_data",
            "message": "Could not retrieve review data.",
        }
    
    ratings = [r["rating"] for r in valid if r.get("rating")]
    counts = [r["review_count"] for r in valid if r.get("review_count")]
    
    avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else None
    total_reviews = sum(counts) if counts else None
    
    # Determine competitive rating position
    rating_positions = {
        "excellent": avg_rating >= 4.5 if avg_rating else False,
        "good": 4.0 <= avg_rating < 4.5 if avg_rating else False,
        "average": 3.5 <= avg_rating < 4.0 if avg_rating else False,
        "below_average": avg_rating < 3.5 if avg_rating else False,
    }
    
    return {
        "status": "success",
        "sources_checked": len(review_data),
        "sources_with_data": len(valid),
        "average_rating": avg_rating,
        "total_reviews": total_reviews,
        "rating_position": next((k for k, v in rating_positions.items() if v), "unknown"),
        "competitive_context": f"The competitive landscape averages {avg_rating}/5 stars across {total_reviews} reviews" if avg_rating and total_reviews else None,
    }
