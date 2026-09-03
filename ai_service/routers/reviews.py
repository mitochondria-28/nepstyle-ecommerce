"""
GET /ai/products/{id}/reviews/summary — AI Review Intelligence (Phase 6)

Fetches all reviews for a product, feeds them to Gemini, and returns
a structured sentiment summary with liked/disliked aspects.

In-memory TTL cache avoids re-calling the LLM on every page load.
"""
import json
import logging
import time

from fastapi import APIRouter

import db
from prompts.base import REVIEW_SUMMARY
from services.llm import generate as llm_generate

logger = logging.getLogger(__name__)
router = APIRouter()

# Simple in-memory cache  { product_id: (expires_at, payload) }
_cache: dict[int, tuple[float, dict]] = {}
_CACHE_TTL = 3600  # 1 hour

MIN_REVIEWS = 1  # Need at least this many reviews to bother calling the LLM


def _cached(product_id: int) -> dict | None:
    entry = _cache.get(product_id)
    if entry and time.time() < entry[0]:
        return entry[1]
    _cache.pop(product_id, None)
    return None


def _store(product_id: int, payload: dict) -> None:
    _cache[product_id] = (time.time() + _CACHE_TTL, payload)


def _avg_rating(reviews: list[dict]) -> float:
    if not reviews:
        return 0.0
    return round(sum(r["rating"] for r in reviews) / len(reviews), 1)


def _strip_fences(text: str) -> str:
    """Remove ```json … ``` or ``` … ``` wrapping."""
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```", 2)
        if len(parts) >= 3:
            inner = parts[1]
            if inner.startswith("json"):
                inner = inner[4:]
            return inner.strip()
    return text


def _build_review_text(reviews: list[dict]) -> str:
    lines = []
    for i, r in enumerate(reviews, 1):
        lines.append(
            f"Review {i} (rating {r['rating']}/5 by {r['user_name']}):\n"
            f"{r['comment']}"
        )
    return "\n\n".join(lines)


@router.get("/products/{product_id}/reviews/summary")
def review_summary(product_id: int):
    # ── Cache hit ──────────────────────────────────────────────────
    cached = _cached(product_id)
    if cached:
        return {**cached, "cached": True}

    # ── Fetch reviews from DB ──────────────────────────────────────
    try:
        reviews = db.query_all(
            "SELECT rating, user_name, comment, created_at "
            "FROM reviews WHERE product_id = %s ORDER BY created_at DESC",
            (product_id,),
        ) or []
    except Exception as e:
        logger.error(f"DB fetch failed for reviews/{product_id}: {e}")
        reviews = []

    avg = _avg_rating(reviews)
    total = len(reviews)

    # ── Not enough reviews → return stats-only ────────────────────
    if total < MIN_REVIEWS:
        payload = {
            "success": True,
            "product_id": product_id,
            "has_summary": False,
            "total_reviews": total,
            "average_rating": avg,
            "message": "Not enough reviews to generate an AI summary yet.",
        }
        return payload

    # ── Build prompt ───────────────────────────────────────────────
    review_text = _build_review_text(reviews)
    prompt = (
        f"Product has {total} customer reviews with an average rating of {avg}/5.\n\n"
        f"CUSTOMER REVIEWS:\n{review_text}\n\n"
        "Generate the JSON summary now."
    )

    # ── Call Gemini ────────────────────────────────────────────────
    try:
        raw = llm_generate(prompt, system_prompt=REVIEW_SUMMARY, temperature=0.2)
        clean = _strip_fences(raw)
        data = json.loads(clean)
    except json.JSONDecodeError:
        logger.warning(f"Gemini returned non-JSON for reviews/{product_id}: {raw[:200]}")
        # Return stats only if JSON parse fails
        payload = {
            "success": True,
            "product_id": product_id,
            "has_summary": False,
            "total_reviews": total,
            "average_rating": avg,
            "message": "Summary unavailable — please try again later.",
        }
        return payload
    except Exception as e:
        logger.error(f"LLM call failed for reviews/{product_id}: {e}")
        payload = {
            "success": True,
            "product_id": product_id,
            "has_summary": False,
            "total_reviews": total,
            "average_rating": avg,
            "message": "Summary temporarily unavailable.",
        }
        return payload

    # ── Build response ─────────────────────────────────────────────
    payload = {
        "success": True,
        "product_id": product_id,
        "has_summary": True,
        "total_reviews": total,
        "average_rating": float(data.get("average_rating", avg)),
        "overall_sentiment": data.get("overall_sentiment", "neutral"),
        "liked": data.get("liked", []),
        "disliked": data.get("disliked", []),
        "summary": data.get("summary", ""),
    }

    _store(product_id, payload)
    return payload
