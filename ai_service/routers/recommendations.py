"""
GET /ai/products/{id}/similar   — Similar products via Qdrant recommend
GET /ai/personalized/{user_id}  — Personalised feed from user activity
"""
import logging
from collections import Counter

from fastapi import APIRouter, HTTPException

import db
from services.rag import get_similar_products
from services.indexer import product_vid
from qdrant_setup import get_qdrant
from qdrant_client.models import Filter, FieldCondition, MatchValue, RecommendQuery, RecommendInput
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Similar products ──────────────────────────────────────────────

@router.get("/products/{product_id}/similar")
def similar_products(product_id: int, top_k: int = 8):
    try:
        results = get_similar_products(product_id, top_k=top_k)

        enriched = []
        for item in results:
            p = item.get("product", item)
            # If payload is sparse, enrich from DB
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
            enriched.append({"product": p, "score": round(item.get("score", 0), 4)})

        if enriched:
            return {"success": True, "product_id": product_id, "results": enriched}

    except Exception as e:
        logger.warning(f"Qdrant similar failed for {product_id}: {e}")

    # DB fallback: same category, excluding self
    try:
        current = db.query_one(
            "SELECT category_id FROM products WHERE product_id = %s", (product_id,)
        )
        if current:
            rows = db.query_all(
                "SELECT p.*, c.category_name, b.brand_name "
                "FROM products p "
                "LEFT JOIN categories c ON p.category_id = c.category_id "
                "LEFT JOIN brands b ON p.brand_id = b.brand_id "
                "WHERE p.category_id = %s AND p.product_id != %s "
                "ORDER BY RAND() LIMIT %s",
                (current["category_id"], product_id, top_k),
            )
            return {
                "success":    True,
                "product_id": product_id,
                "results":    [{"product": dict(r), "score": 0} for r in rows],
            }
    except Exception as e:
        logger.error(f"DB fallback failed for similar products: {e}")

    return {"success": True, "product_id": product_id, "results": []}


# ── Personalised feed ─────────────────────────────────────────────

@router.get("/personalized/{user_id}")
def personalized(user_id: int, top_k: int = 12):
    """
    Build a personalised product feed from the user's activity log.

    Strategy:
    1. Fetch recently viewed / wishlisted product IDs
    2. Find the most-viewed categories/brands
    3. Use Qdrant recommend() seeded with viewed product vectors
    4. Deduplicate and enrich from DB
    5. Fallback to popular-in-favourite-category if Qdrant is empty
    """
    # Signal weights: purchase > wishlist > cart > view
    WEIGHTS = {"purchase": 4, "wishlist": 3, "cart": 2, "view": 1}

    try:
        # Weighted activity signals — aggregate per product
        activity = db.query_all(
            "SELECT product_id, action_type "
            "FROM user_activity "
            "WHERE user_id = %s AND product_id IS NOT NULL "
            "ORDER BY timestamp DESC LIMIT 50",
            (user_id,),
        ) or []
    except Exception:
        activity = []

    wishlist_pids = []
    try:
        wl = db.query_all(
            "SELECT product_id FROM wishlist WHERE user_id = %s LIMIT 10", (user_id,)
        ) or []
        wishlist_pids = [r["product_id"] for r in wl]
    except Exception:
        pass

    # Build weighted score per product and pick top seeds
    scores: dict[int, int] = {}
    for row in activity:
        pid = row.get("product_id")
        if pid:
            scores[pid] = scores.get(pid, 0) + WEIGHTS.get(row.get("action_type", "view"), 1)
    for pid in wishlist_pids:
        scores[pid] = scores.get(pid, 0) + WEIGHTS["wishlist"]

    # Sort by score desc, take top 8 as seeds
    seed_pids = [pid for pid, _ in sorted(scores.items(), key=lambda x: x[1], reverse=True)][:8]

    already_seen = set(seed_pids)

    # ── Try Qdrant recommend ───────────────────────────────────────
    if seed_pids:
        try:
            positive_ids = [product_vid(pid) for pid in seed_pids[:4]]
            qdrant_result = get_qdrant().query_points(
                collection_name=settings.qdrant_collection,
                query=RecommendQuery(recommend=RecommendInput(positive=positive_ids, negative=[])),
                query_filter=Filter(
                    must=[FieldCondition(key="type", match=MatchValue(value="product"))],
                ),
                limit=top_k + len(already_seen),
                with_payload=True,
            )
            recs = []
            for r in qdrant_result.points:
                pid = r.payload.get("product_id")
                if pid and pid not in already_seen:
                    already_seen.add(pid)
                    recs.append({"product": r.payload, "score": round(r.score, 4), "reason": "based_on_history"})
                    if len(recs) >= top_k:
                        break

            if recs:
                return {
                    "success": True,
                    "user_id": user_id,
                    "strategy": "qdrant_recommend",
                    "results": recs,
                }
        except Exception as e:
            logger.warning(f"Qdrant personalised failed for user {user_id}: {e}")

    # ── DB fallback: most-viewed category ─────────────────────────
    try:
        if seed_pids:
            rows = db.query_all(
                "SELECT category_id FROM products WHERE product_id IN %s",
                (tuple(seed_pids),),
            )
            if rows:
                cat_counts = Counter(r["category_id"] for r in rows)
                top_cat    = cat_counts.most_common(1)[0][0]

                products = db.query_all(
                    "SELECT p.*, c.category_name, b.brand_name "
                    "FROM products p "
                    "LEFT JOIN categories c ON p.category_id = c.category_id "
                    "LEFT JOIN brands b ON p.brand_id = b.brand_id "
                    "WHERE p.category_id = %s "
                    "AND p.product_id NOT IN %s "
                    "ORDER BY RAND() LIMIT %s",
                    (top_cat, tuple(already_seen) if already_seen else (0,), top_k),
                )
                if products:
                    return {
                        "success":  True,
                        "user_id":  user_id,
                        "strategy": "category_fallback",
                        "results":  [{"product": dict(p), "score": 0, "reason": "similar_to_interests"} for p in products],
                    }

        # Ultimate fallback: featured / sale products
        products = db.query_all(
            "SELECT p.*, c.category_name, b.brand_name "
            "FROM products p "
            "LEFT JOIN categories c ON p.category_id = c.category_id "
            "LEFT JOIN brands b ON p.brand_id = b.brand_id "
            "ORDER BY RAND() LIMIT %s",
            (top_k,),
        )
        return {
            "success":  True,
            "user_id":  user_id,
            "strategy": "popular",
            "results":  [{"product": dict(p), "score": 0, "reason": "popular"} for p in products],
        }

    except Exception as e:
        logger.exception(f"Personalised fallback failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
