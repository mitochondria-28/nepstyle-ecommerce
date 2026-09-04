"""
AI Brand & Category Intelligence — Phase 14

GET /ai/brands/{brand_id}/profile   → AI-generated brand bio, specialty, style tags
GET /ai/categories/{cat_id}/insights → AI-generated category blurb, trending styles, price range

Both responses are TTL-cached (2 hours) to avoid repeated LLM calls.
"""
import json
import logging
import re
import time
from collections import Counter

from fastapi import APIRouter

import db
from prompts.base import BRAND_PROFILER, CATEGORY_ANALYST
from services.llm import generate

logger = logging.getLogger(__name__)
router = APIRouter()

_cache: dict[str, tuple[float, dict]] = {}
_TTL = 7200  # 2 hours


def _cached(key: str) -> dict | None:
    entry = _cache.get(key)
    if entry and (time.time() - entry[0]) < _TTL:
        return entry[1]
    return None


def _store(key: str, val: dict) -> None:
    _cache[key] = (time.time(), val)


def _strip_json(raw: str) -> str:
    return re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()


def _price_tier(avg: float) -> str:
    if avg < 1000:
        return "Budget"
    if avg < 3000:
        return "Mid-range"
    return "Premium"


# ── Brand profile ────────────────────────────────────────────────────────────

@router.get("/brands/{brand_id}/profile")
def brand_profile(brand_id: int):
    key = f"brand:{brand_id}"
    if cached := _cached(key):
        return {**cached, "cached": True}

    rows = db.query_all(
        """
        SELECT p.product_name, p.category_name, p.brand_name,
               p.sell_price, p.normal_price, p.total_product_count,
               COALESCE(AVG(r.rating), 0)        AS avg_rating,
               COUNT(DISTINCT r.review_id)        AS review_count
        FROM   products p
        LEFT JOIN reviews r ON r.product_id = p.product_id
        WHERE  p.brand_id = %s AND p.total_product_count > 0
        GROUP BY p.product_id, p.product_name, p.category_name,
                 p.brand_name, p.sell_price, p.normal_price,
                 p.total_product_count
        """,
        (brand_id,),
    )

    if not rows:
        return {
            "brand_name": None,
            "ai_bio": "This brand is new to NepStyle. Check back soon for a full profile.",
            "specialty": "Fashion",
            "style_tags": ["Fashion", "Style"],
            "price_tier": "Mid-range",
            "avg_price": 0,
            "avg_rating": 0.0,
            "total_reviews": 0,
            "top_category": None,
            "total_products": 0,
            "cached": False,
        }

    brand_name  = rows[0]["brand_name"]
    prices      = [float(r["sell_price"] or 0) for r in rows if r["sell_price"]]
    avg_price   = round(sum(prices) / len(prices)) if prices else 0
    categories  = [r["category_name"] for r in rows if r["category_name"]]
    cat_counts  = Counter(categories)
    top_cat     = cat_counts.most_common(1)[0][0] if cat_counts else "Fashion"
    unique_cats = list(cat_counts.keys())

    total_reviews = int(sum(r["review_count"] for r in rows))
    weighted_sum  = sum(float(r["avg_rating"]) * int(r["review_count"]) for r in rows)
    avg_rating    = round(weighted_sum / total_reviews, 1) if total_reviews else 0.0

    prompt = (
        f"Brand: {brand_name}\n"
        f"Products: {len(rows)} items\n"
        f"Top Category: {top_cat}\n"
        f"All Categories: {', '.join(unique_cats[:6])}\n"
        f"Avg Price: Rs {avg_price:,}\n"
        f"Price Tier: {_price_tier(avg_price)}\n"
        f"Avg Rating: {avg_rating}/5 from {total_reviews} reviews"
    )

    llm_data: dict = {}
    try:
        raw = generate(prompt, system_prompt=BRAND_PROFILER)
        llm_data = json.loads(_strip_json(raw))
    except Exception:
        logger.warning("brand_intel: LLM parse failed for brand_id=%s", brand_id)
        llm_data = {
            "ai_bio": f"{brand_name} brings you a curated collection of {top_cat.lower()} and more at NepStyle, Nepal's top fashion destination.",
            "specialty": top_cat,
            "style_tags": ["Fashion", "Style", _price_tier(avg_price)],
        }

    result = {
        "brand_name":    brand_name,
        "ai_bio":        llm_data.get("ai_bio", ""),
        "specialty":     llm_data.get("specialty", top_cat),
        "style_tags":    llm_data.get("style_tags", [])[:5],
        "price_tier":    _price_tier(avg_price),
        "avg_price":     avg_price,
        "avg_rating":    avg_rating,
        "total_reviews": total_reviews,
        "top_category":  top_cat,
        "total_products": len(rows),
        "cached":        False,
    }
    _store(key, result)
    return result


# ── Category insights ─────────────────────────────────────────────────────────

@router.get("/categories/{cat_id}/insights")
def category_insights(cat_id: int):
    key = f"cat:{cat_id}"
    if cached := _cached(key):
        return {**cached, "cached": True}

    rows = db.query_all(
        """
        SELECT p.product_name, p.brand_name, p.category_name,
               p.sell_price, p.normal_price,
               COALESCE(AVG(r.rating), 0)        AS avg_rating,
               COUNT(DISTINCT r.review_id)        AS review_count
        FROM   products p
        LEFT JOIN reviews r ON r.product_id = p.product_id
        WHERE  p.category_id = %s AND p.total_product_count > 0
        GROUP BY p.product_id, p.product_name, p.brand_name,
                 p.category_name, p.sell_price, p.normal_price
        """,
        (cat_id,),
    )

    if not rows:
        return {
            "category_name": None,
            "ai_blurb": "This category is growing at NepStyle. New products are on their way!",
            "trending_styles": ["Casual", "Modern", "Comfortable"],
            "price_range": {"min": 0, "max": 0, "avg": 0},
            "top_brands": [],
            "total_products": 0,
            "avg_rating": 0.0,
            "cached": False,
        }

    cat_name  = rows[0]["category_name"]
    prices    = [float(r["sell_price"] or 0) for r in rows if r["sell_price"]]
    min_price = int(min(prices)) if prices else 0
    max_price = int(max(prices)) if prices else 0
    avg_price = int(sum(prices) / len(prices)) if prices else 0

    brand_counts = Counter(r["brand_name"] for r in rows if r["brand_name"])
    top_brands   = [b for b, _ in brand_counts.most_common(3)]

    total_reviews = int(sum(r["review_count"] for r in rows))
    weighted_sum  = sum(float(r["avg_rating"]) * int(r["review_count"]) for r in rows)
    avg_rating    = round(weighted_sum / total_reviews, 1) if total_reviews else 0.0

    prompt = (
        f"Category: {cat_name}\n"
        f"Total Products: {len(rows)}\n"
        f"Top Brands: {', '.join(top_brands)}\n"
        f"Price Range: Rs {min_price:,} – Rs {max_price:,} (avg Rs {avg_price:,})\n"
        f"Avg Rating: {avg_rating}/5 from {total_reviews} reviews"
    )

    llm_data: dict = {}
    try:
        raw = generate(prompt, system_prompt=CATEGORY_ANALYST)
        llm_data = json.loads(_strip_json(raw))
    except Exception:
        logger.warning("brand_intel: LLM parse failed for cat_id=%s", cat_id)
        llm_data = {
            "ai_blurb": f"NepStyle's {cat_name} collection spans Rs {min_price:,}–Rs {max_price:,}, with options from top Nepali brands.",
            "trending_styles": ["Casual", "Modern", "Comfortable"],
        }

    result = {
        "category_name":   cat_name,
        "ai_blurb":        llm_data.get("ai_blurb", ""),
        "trending_styles": llm_data.get("trending_styles", [])[:4],
        "price_range":     {"min": min_price, "max": max_price, "avg": avg_price},
        "top_brands":      top_brands,
        "total_products":  len(rows),
        "avg_rating":      avg_rating,
        "cached":          False,
    }
    _store(key, result)
    return result
