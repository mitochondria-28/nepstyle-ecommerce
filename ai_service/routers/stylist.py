"""
AI Stylist — Phase 10: "Complete the Look" + Cart Recommendations

GET  /ai/products/{product_id}/complete-look
  → Gemini suggests 3 complementary search queries → hybrid search → top-1 per query

POST /ai/cart-recommendations
  → Gemini reads cart item names → suggests 3 missing category queries → hybrid search
"""
import json
import logging
import re
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

import db
from prompts.base import CART_ADVISOR, STYLE_COORDINATOR
from services.llm import generate
from services.rag import hybrid_product_search

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Product normaliser ────────────────────────────────────────────────

def _normalise(p_or_item: dict) -> dict:
    p = p_or_item.get("product", p_or_item)
    img = p.get("image_url") or p.get("product_thumbnail") or ""
    return {
        "product_id":          p.get("product_id"),
        "product_name":        p.get("product_name", "Unknown"),
        "sell_price":          float(p.get("sell_price", 0)),
        "normal_price":        float(p.get("normal_price", 0)),
        "image_url":           img,
        "product_thumbnail":   img,
        "brand_name":          p.get("brand_name", ""),
        "category_name":       p.get("category_name", ""),
        "product_description": str(p.get("product_description", ""))[:300],
        "total_product_count": int(p.get("total_product_count", 99)),
    }


def _parse_queries(raw: str) -> list[str]:
    """Strip markdown fences and parse a JSON array of strings."""
    clean = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()
    try:
        data = json.loads(clean)
        if isinstance(data, list):
            return [q for q in data if isinstance(q, str)][:3]
    except Exception:
        pass
    return []


def _search_one(query: str, exclude_ids: set[int]) -> Optional[dict]:
    """Run hybrid search and return the first result not in exclude_ids."""
    try:
        results = hybrid_product_search(query, top_k=6)
        for item in results:
            p = item.get("product", item)
            pid = p.get("product_id")
            if pid and pid not in exclude_ids:
                return _normalise(p)
    except Exception as e:
        logger.warning(f"Search failed for query '{query}': {e}")
    return None


# ── Endpoints ─────────────────────────────────────────────────────────

@router.get("/products/{product_id}/complete-look")
def complete_look(product_id: int):
    product = db.query_one(
        "SELECT product_name, category_name, product_description FROM products WHERE product_id = %s",
        (product_id,),
    )
    if not product:
        return {"success": True, "products": []}

    prompt = (
        f"{STYLE_COORDINATOR}\n\n"
        f"Product: {product['product_name']}\n"
        f"Category: {product.get('category_name', 'clothing')}\n"
        f"Description: {str(product.get('product_description', ''))[:250]}"
    )

    try:
        raw = generate(prompt, temperature=0.4)
        queries = _parse_queries(raw)
    except Exception as e:
        logger.warning(f"Style coordinator LLM failed: {e}")
        queries = []

    if not queries:
        return {"success": True, "products": []}

    exclude = {product_id}
    results = []
    for q in queries:
        item = _search_one(q, exclude)
        if item:
            exclude.add(item["product_id"])
            results.append(item)

    logger.info(f"complete-look pid={product_id}: queries={queries}, found={len(results)}")
    return {"success": True, "products": results, "queries": queries}


class CartRecommendRequest(BaseModel):
    product_names: list[str]
    exclude_ids:   list[int] = []


@router.post("/cart-recommendations")
def cart_recommendations(body: CartRecommendRequest):
    if not body.product_names:
        return {"success": True, "products": []}

    names_str = ", ".join(body.product_names[:10])
    prompt = (
        f"{CART_ADVISOR}\n\n"
        f"Cart items: {names_str}"
    )

    try:
        raw = generate(prompt, temperature=0.4)
        queries = _parse_queries(raw)
    except Exception as e:
        logger.warning(f"Cart advisor LLM failed: {e}")
        queries = []

    if not queries:
        return {"success": True, "products": []}

    exclude = set(body.exclude_ids)
    results = []
    for q in queries:
        item = _search_one(q, exclude)
        if item:
            exclude.add(item["product_id"])
            results.append(item)

    logger.info(f"cart-recs: queries={queries}, found={len(results)}")
    return {"success": True, "products": results}
