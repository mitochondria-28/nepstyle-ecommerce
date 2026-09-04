"""
AI Curated Collections — Phase 15

GET /ai/collections → 6 editorially themed product collections
                       refreshed every 4 hours (TTL-cached)

Process:
  1. Gemini generates 6 collection themes (name, emoji, description, search_query)
  2. hybrid_product_search is called for each theme (top-k=5)
  3. Results are normalised and returned with embedded products
"""
import json
import logging
import re
import time
from datetime import datetime

from fastapi import APIRouter

import db
from prompts.base import COLLECTION_CURATOR
from services.llm import generate
from services.rag import hybrid_product_search

logger = logging.getLogger(__name__)
router = APIRouter()

_cache: dict[str, tuple[float, list]] = {}
_TTL = 14400  # 4 hours
_CACHE_KEY = "collections"

_DEFAULT_THEMES = [
    {"name": "Casual Everyday",  "description": "Comfortable picks for daily wear",               "search_query": "casual t-shirt",      "emoji": "👕"},
    {"name": "Work Ready",       "description": "Professional looks for the office",               "search_query": "formal shirt men",    "emoji": "👔"},
    {"name": "Street Style",     "description": "Urban fashion for city life",                     "search_query": "streetwear jacket",   "emoji": "🧥"},
    {"name": "Sport & Active",   "description": "Performance gear for active lifestyles",          "search_query": "sports activewear",   "emoji": "⚡"},
    {"name": "Festival Vibes",   "description": "Bright and festive looks for celebrations",       "search_query": "ethnic kurta women",  "emoji": "🎉"},
    {"name": "Budget Steals",    "description": "Great style that won't break the bank",           "search_query": "affordable polo",     "emoji": "💚"},
]


def _strip_json(raw: str) -> str:
    return re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()


def _normalise(p: dict) -> dict:
    img = p.get("image_url") or p.get("product_thumbnail") or ""
    return {
        "product_id":          p.get("product_id"),
        "product_name":        p.get("product_name", ""),
        "sell_price":          float(p.get("sell_price") or 0),
        "normal_price":        float(p.get("normal_price") or 0),
        "image_url":           img,
        "product_thumbnail":   img,
        "brand_name":          p.get("brand_name", ""),
        "category_name":       p.get("category_name", ""),
        "total_product_count": int(p.get("total_product_count") or 0),
        "product_description": str(p.get("product_description", ""))[:200],
    }


def _fetch_themes() -> list[dict]:
    cats = db.query_all(
        "SELECT DISTINCT category_name FROM products WHERE total_product_count > 0 LIMIT 12",
        (),
    )
    cat_names = [r["category_name"] for r in cats if r.get("category_name")]
    month = datetime.now().strftime("%B %Y")

    prompt = (
        f"Context: {month}, Nepal.\n"
        f"Available product categories: {', '.join(cat_names)}.\n"
        "Generate 6 collection themes."
    )

    try:
        raw = generate(prompt, system_prompt=COLLECTION_CURATOR, temperature=0.8)
        themes = json.loads(_strip_json(raw))
        if isinstance(themes, list) and len(themes) >= 4:
            return themes[:6]
    except Exception as e:
        logger.warning("collections: theme generation failed: %s", e)

    return _DEFAULT_THEMES


def _build_collections(themes: list[dict]) -> list[dict]:
    collections = []
    seen_ids: set[int] = set()

    for theme in themes:
        query = theme.get("search_query", "fashion")
        try:
            raw_products = hybrid_product_search(query, top_k=6)
        except Exception as e:
            logger.warning("collections: search failed for '%s': %s", query, e)
            raw_products = []

        products = []
        for p in raw_products:
            pid = p.get("product_id")
            if pid and pid not in seen_ids:
                products.append(_normalise(p))
                seen_ids.add(pid)
            if len(products) >= 4:
                break

        if len(products) < 2:
            continue

        collections.append({
            "name":         theme.get("name", "Collection"),
            "description":  theme.get("description", ""),
            "emoji":        theme.get("emoji", "✨"),
            "search_query": query,
            "products":     products,
        })

    return collections


@router.get("/collections")
def get_collections():
    entry = _cache.get(_CACHE_KEY)
    if entry and (time.time() - entry[0]) < _TTL:
        return {
            "collections":    entry[1],
            "generated_at":   entry[2],
            "cached":         True,
            "next_refresh_in": max(0, int(_TTL - (time.time() - entry[0]))),
        }

    themes      = _fetch_themes()
    collections = _build_collections(themes)
    generated_at = datetime.utcnow().isoformat() + "Z"

    _cache[_CACHE_KEY] = (time.time(), collections, generated_at)

    return {
        "collections":    collections,
        "generated_at":   generated_at,
        "cached":         False,
        "next_refresh_in": _TTL,
    }
