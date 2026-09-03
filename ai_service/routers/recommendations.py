"""
GET /ai/products/{id}/similar   — Similar products via Qdrant recommend
GET /ai/personalized/{user_id}  — Personalised feed (Phase 5/7)
"""
import logging

from fastapi import APIRouter, HTTPException

import db
from services.rag import get_similar_products

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/products/{product_id}/similar")
def similar_products(product_id: int, top_k: int = 6):
    try:
        results = get_similar_products(product_id, top_k=top_k)

        # Enrich with full DB data if payload is sparse
        enriched = []
        for item in results:
            p = item.get("product", item)
            if not p.get("product_name"):
                row = db.query_one(
                    "SELECT p.*, c.category_name, b.brand_name "
                    "FROM products p "
                    "LEFT JOIN categories c ON p.category_id = c.category_id "
                    "LEFT JOIN brands b ON p.brand_id = b.brand_id "
                    "WHERE p.product_id = %s",
                    (p.get("product_id"),),
                )
                if row:
                    p = dict(row)
            enriched.append({"product": p, "score": item.get("score", 0)})

        return {
            "success":    True,
            "product_id": product_id,
            "results":    enriched,
        }

    except Exception as e:
        logger.warning(f"Similar products failed for {product_id} (Qdrant may be empty): {e}")
        # Fallback: same-category products from DB
        try:
            current = db.query_one("SELECT category_id FROM products WHERE product_id = %s", (product_id,))
            if current:
                rows = db.query_all(
                    "SELECT p.*, c.category_name, b.brand_name "
                    "FROM products p "
                    "LEFT JOIN categories c ON p.category_id = c.category_id "
                    "LEFT JOIN brands b ON p.brand_id = b.brand_id "
                    "WHERE p.category_id = %s AND p.product_id != %s LIMIT %s",
                    (current["category_id"], product_id, top_k),
                )
                return {
                    "success":    True,
                    "product_id": product_id,
                    "results":    [{"product": dict(r), "score": 0} for r in rows],
                }
        except Exception:
            pass
        return {"success": True, "product_id": product_id, "results": []}


@router.get("/personalized/{user_id}")
def personalized(user_id: int):
    return {
        "success": False,
        "phase":   5,
        "message": "Personalised recommendations will be available in Phase 5.",
    }
