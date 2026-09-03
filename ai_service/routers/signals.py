"""
GET /ai/trending              — Top products by weighted engagement signals
GET /ai/recently-viewed/:uid  — Last N unique products a user viewed

Signal weights:
  purchase → 4   (strongest intent)
  wishlist → 3
  cart     → 2
  view     → 1   (weakest)
"""
import logging

from fastapi import APIRouter

import db

logger = logging.getLogger(__name__)
router = APIRouter()

# Weight each action type
SIGNAL_WEIGHTS = {
    "purchase": 4,
    "wishlist": 3,
    "cart":     2,
    "view":     1,
}

TRENDING_WINDOW_DAYS = 7


@router.get("/trending")
def trending(limit: int = 12):
    """
    Aggregate weighted signals from the past TRENDING_WINDOW_DAYS days
    across all users, rank products by total score, and return the top N
    with full product data.
    """
    try:
        rows = db.query_all(
            """
            SELECT
                ua.product_id,
                SUM(CASE ua.action_type
                    WHEN 'purchase' THEN 4
                    WHEN 'wishlist' THEN 3
                    WHEN 'cart'     THEN 2
                    ELSE 1
                END) AS score,
                COUNT(*) AS interactions
            FROM user_activity ua
            WHERE ua.timestamp >= NOW() - INTERVAL %s DAY
              AND ua.product_id IS NOT NULL
            GROUP BY ua.product_id
            ORDER BY score DESC
            LIMIT %s
            """,
            (TRENDING_WINDOW_DAYS, limit),
        ) or []

        if not rows:
            # Fallback: return random products if no activity yet
            rows_fb = db.query_all(
                "SELECT p.*, c.category_name, b.brand_name "
                "FROM products p "
                "LEFT JOIN categories c ON p.category_id = c.category_id "
                "LEFT JOIN brands b ON p.brand_id = b.brand_id "
                "ORDER BY p.product_id DESC LIMIT %s",
                (limit,),
            ) or []
            return {
                "success": True,
                "strategy": "fallback_latest",
                "results": [{"product": dict(r), "score": 0, "interactions": 0} for r in rows_fb],
            }

        product_ids = [r["product_id"] for r in rows]
        score_map   = {r["product_id"]: (r["score"], r["interactions"]) for r in rows}

        placeholders = ", ".join(["%s"] * len(product_ids))
        products = db.query_all(
            f"SELECT p.*, c.category_name, b.brand_name "
            f"FROM products p "
            f"LEFT JOIN categories c ON p.category_id = c.category_id "
            f"LEFT JOIN brands b ON p.brand_id = b.brand_id "
            f"WHERE p.product_id IN ({placeholders})",
            tuple(product_ids),
        ) or []

        # Re-sort by score (DB returned arbitrary order)
        products.sort(key=lambda p: score_map.get(p["product_id"], (0,))[0], reverse=True)

        return {
            "success":  True,
            "strategy": "weighted_signals",
            "window_days": TRENDING_WINDOW_DAYS,
            "results": [
                {
                    "product":      dict(p),
                    "score":        score_map[p["product_id"]][0],
                    "interactions": score_map[p["product_id"]][1],
                }
                for p in products
            ],
        }

    except Exception as e:
        logger.exception(f"Trending endpoint failed: {e}")
        return {"success": True, "strategy": "error_fallback", "results": []}


@router.get("/recently-viewed/{user_id}")
def recently_viewed(user_id: int, limit: int = 8):
    """
    Return the last N unique products the user viewed, most-recent first.
    Deduplication is done in Python (latest visit per product wins).
    """
    try:
        rows = db.query_all(
            """
            SELECT product_id, MAX(timestamp) AS last_seen
            FROM user_activity
            WHERE user_id = %s AND action_type = 'view' AND product_id IS NOT NULL
            GROUP BY product_id
            ORDER BY last_seen DESC
            LIMIT %s
            """,
            (user_id, limit),
        ) or []

        if not rows:
            return {"success": True, "user_id": user_id, "results": []}

        product_ids  = [r["product_id"] for r in rows]
        last_seen_map = {r["product_id"]: str(r["last_seen"]) for r in rows}

        placeholders = ", ".join(["%s"] * len(product_ids))
        products = db.query_all(
            f"SELECT p.*, c.category_name, b.brand_name "
            f"FROM products p "
            f"LEFT JOIN categories c ON p.category_id = c.category_id "
            f"LEFT JOIN brands b ON p.brand_id = b.brand_id "
            f"WHERE p.product_id IN ({placeholders})",
            tuple(product_ids),
        ) or []

        # Re-sort to preserve recency order
        order = {pid: i for i, pid in enumerate(product_ids)}
        products.sort(key=lambda p: order.get(p["product_id"], 999))

        return {
            "success":  True,
            "user_id":  user_id,
            "results":  [
                {"product": dict(p), "last_seen": last_seen_map.get(p["product_id"], "")}
                for p in products
            ],
        }

    except Exception as e:
        logger.exception(f"Recently-viewed failed for user {user_id}: {e}")
        return {"success": True, "user_id": user_id, "results": []}
