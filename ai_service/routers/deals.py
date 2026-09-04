"""
GET /ai/smart-deals — AI Smart Deals Page (Phase 13)

Queries DB for discounted products, computes deal scores/tiers,
generates an AI headline, and returns new arrivals as a bonus section.
Headline is TTL-cached to avoid repeated LLM calls.
"""
import logging
import time
from collections import Counter

from fastapi import APIRouter

import db
from services.llm import generate

logger = logging.getLogger(__name__)
router = APIRouter()

# 30-minute headline cache  {cache_key: (timestamp, headline)}
_cache: dict[str, tuple[float, str]] = {}
_TTL = 1800


def _normalise(p: dict) -> dict:
    img = p.get("image_url") or p.get("product_thumbnail") or ""
    normal = float(p.get("normal_price") or 0)
    sell   = float(p.get("sell_price")   or 0)
    stock  = int(p.get("total_product_count") or 0)
    disc   = round((normal - sell) / normal * 100) if normal > sell and normal > 0 else 0
    score  = disc * (0.7 + 0.3 * min(1.0, stock / 10)) if disc > 0 else 0

    tier = "hot" if disc >= 30 else ("good" if disc >= 15 else "value")

    return {
        "product_id":          p.get("product_id"),
        "product_name":        p.get("product_name", "Unknown"),
        "sell_price":          sell,
        "normal_price":        normal,
        "discount_pct":        disc,
        "deal_score":          round(score, 1),
        "deal_tier":           tier,
        "image_url":           img,
        "product_thumbnail":   img,
        "brand_name":          p.get("brand_name", ""),
        "category_name":       p.get("category_name", ""),
        "total_product_count": stock,
        "product_description": str(p.get("product_description", ""))[:200],
    }


def _get_headline(deals: list[dict]) -> str:
    if not deals:
        return "Great deals on fashion — shop now at NepStyle!"

    top_cats = [n for n, _ in Counter(d["category_name"] for d in deals if d["category_name"]).most_common(3)]
    max_disc  = max((d["discount_pct"] for d in deals), default=0)
    hot_count = sum(1 for d in deals if d["deal_tier"] == "hot")

    cache_key = f"{','.join(top_cats)}_{max_disc}_{len(deals)}"
    now = time.time()
    if cache_key in _cache:
        ts, headline = _cache[cache_key]
        if now - ts < _TTL:
            return headline

    prompt = (
        "Write a short, exciting deals headline for a Nepali fashion e-commerce store.\n"
        f"Facts: {len(deals)} products on sale, up to {max_disc:.0f}% off"
        + (f", {hot_count} hot deals" if hot_count else "")
        + (f". Top categories: {', '.join(top_cats)}." if top_cats else ".")
        + "\nRequirements: under 12 words, energetic, no emojis, end with an exclamation mark."
    )
    try:
        headline = generate(prompt, temperature=0.6).strip().strip('"')
    except Exception as e:
        logger.warning(f"Deals headline LLM failed: {e}")
        headline = f"Up to {max_disc:.0f}% off — Shop the best deals at NepStyle!"

    _cache[cache_key] = (now, headline)
    return headline


@router.get("/smart-deals")
def smart_deals(limit: int = 24):
    # 1. Discounted products
    raw_deals = db.query_all(
        """
        SELECT *,
          ROUND((normal_price - sell_price) / normal_price * 100) AS computed_disc
        FROM products
        WHERE normal_price > sell_price
          AND normal_price > 0
          AND total_product_count > 0
        ORDER BY computed_disc DESC
        LIMIT %s
        """,
        (min(limit, 48),),
    ) or []

    deals = [_normalise(p) for p in raw_deals]
    deals.sort(key=lambda d: d["deal_score"], reverse=True)

    # 2. New arrivals (no active discount, newest first)
    raw_new = db.query_all(
        """
        SELECT * FROM products
        WHERE (normal_price IS NULL OR normal_price <= sell_price OR normal_price = 0)
          AND total_product_count > 0
        ORDER BY product_id DESC
        LIMIT 12
        """,
        (),
    ) or []

    new_arrivals = [_normalise(p) for p in raw_new]

    # 3. Stats
    hot   = [d for d in deals if d["deal_tier"] == "hot"]
    good  = [d for d in deals if d["deal_tier"] == "good"]
    max_d = max((d["discount_pct"] for d in deals), default=0)

    # 4. Headline
    headline = _get_headline(deals)

    return {
        "success":      True,
        "headline":     headline,
        "deals":        deals,
        "new_arrivals": new_arrivals,
        "stats": {
            "total_deals":      len(deals),
            "hot_deals":        len(hot),
            "good_deals":       len(good),
            "max_discount_pct": max_d,
            "new_arrivals":     len(new_arrivals),
        },
    }
