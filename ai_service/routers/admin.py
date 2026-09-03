"""
POST /ai/admin/reindex/product/{id}  — reindex a single product + its reviews
POST /ai/admin/reindex/all           — reindex everything (runs synchronously)
GET  /ai/admin/collection/stats      — Qdrant collection stats

All endpoints require X-AI-Key header (enforced by APIKeyMiddleware in main.py).
Intended to be called by the Dart backend after product/review CRUD operations,
or by an admin manually triggering a full re-index.
"""
import logging
import threading

from fastapi import APIRouter, HTTPException

import db
from config import settings
from qdrant_setup import get_qdrant, ensure_collection
from services.indexer import (
    index_product,
    index_review,
    index_category,
    index_policy,
    delete_product_vectors,
    delete_review_vector,
)
from services.policies import get_all_policies

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])

# ── Single product reindex ────────────────────────────────────────

@router.post("/reindex/product/{product_id}")
def reindex_product(product_id: int):
    product = db.query_one(
        "SELECT * FROM products WHERE product_id = %s", (product_id,)
    )
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    try:
        index_product(dict(product))
        reviews = db.query_all(
            """
            SELECT r.*, p.product_name
            FROM reviews r
            JOIN products p ON r.product_id = p.product_id
            WHERE r.product_id = %s
            """,
            (product_id,),
        )
        for rev in reviews:
            d = dict(rev)
            index_review(d, product_name=d.get("product_name", ""))

        return {
            "success": True,
            "message": f"Product {product_id} reindexed with {len(reviews)} reviews",
        }
    except Exception as e:
        logger.exception(f"Reindex failed for product {product_id}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Delete product vectors ────────────────────────────────────────

@router.delete("/vectors/product/{product_id}")
def remove_product_vectors(product_id: int):
    try:
        delete_product_vectors(product_id)
        return {"success": True, "message": f"Vectors removed for product {product_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/vectors/review/{review_id}")
def remove_review_vector(review_id: int):
    try:
        delete_review_vector(review_id)
        return {"success": True, "message": f"Review vector {review_id} removed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Full reindex (runs in background thread) ──────────────────────

_reindex_running = False


@router.post("/reindex/all")
def reindex_all():
    global _reindex_running
    if _reindex_running:
        return {"success": False, "message": "A reindex is already running"}

    def _run():
        global _reindex_running
        _reindex_running = True
        try:
            ensure_collection()
            products = db.query_all("SELECT * FROM products")
            for p in products:
                try:
                    index_product(dict(p))
                except Exception as e:
                    logger.warning(f"Product {p.get('product_id')} failed: {e}")

            categories = db.query_all("SELECT * FROM categories")
            for c in categories:
                try:
                    index_category(dict(c))
                except Exception as e:
                    logger.warning(f"Category {c.get('category_id')} failed: {e}")

            reviews = db.query_all(
                "SELECT r.*, p.product_name FROM reviews r "
                "JOIN products p ON r.product_id = p.product_id"
            )
            for rev in reviews:
                try:
                    d = dict(rev)
                    index_review(d, product_name=d.get("product_name", ""))
                except Exception as e:
                    logger.warning(f"Review {rev.get('review_id')} failed: {e}")

            for pol in get_all_policies():
                try:
                    index_policy(pol["slug"], pol["name"], pol["content"])
                except Exception as e:
                    logger.warning(f"Policy '{pol['slug']}' failed: {e}")

            logger.info("Full reindex complete")
        finally:
            _reindex_running = False

    threading.Thread(target=_run, daemon=True).start()
    return {"success": True, "message": "Full reindex started in background"}


# ── Collection stats ──────────────────────────────────────────────

@router.get("/collection/stats")
def collection_stats():
    try:
        info = get_qdrant().get_collection(settings.qdrant_collection)
        return {
            "success": True,
            "collection": settings.qdrant_collection,
            "vectors_count": info.points_count,
            "indexed_vectors_count": info.indexed_vectors_count,
            "status": str(info.status),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
