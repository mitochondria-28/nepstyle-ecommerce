"""
POST /ai/products/{product_id}/size-advice — AI Size & Fit Advisor (Phase 12)

Takes user measurements (height, weight, usual size, gender), fetches the
product + sizing-relevant reviews from DB, and asks Gemini to recommend
the best size with a confidence level and community insight.
"""
import json
import logging
import re
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

import db
from prompts.base import SIZE_ADVISOR
from services.llm import generate

logger = logging.getLogger(__name__)
router = APIRouter()

SIZING_KEYWORDS = {
    "size", "small", "large", "big", "fit", "tight", "loose",
    "true to size", "runs", "chart", "length", "short", "long",
    "narrow", "wide", "snug", "roomy", "oversized", "slim",
}


def _strip_json(raw: str) -> str:
    return re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()


def _get_sizing_reviews(product_id: int) -> list[str]:
    rows = db.query_all(
        "SELECT comment FROM reviews WHERE product_id = %s ORDER BY created_at DESC LIMIT 60",
        (product_id,),
    ) or []
    relevant = []
    for r in rows:
        comment = (r.get("comment") or "").lower()
        if any(kw in comment for kw in SIZING_KEYWORDS):
            relevant.append(r["comment"])
    return relevant[:12]


# ── Models ────────────────────────────────────────────────────────────

class SizeRequest(BaseModel):
    height_cm:  int = Field(..., ge=100, le=250, description="Height in cm")
    weight_kg:  int = Field(..., ge=30,  le=200, description="Weight in kg")
    usual_size: str = Field(..., max_length=10,  description="e.g. S, M, L, 38")
    gender:     Literal["male", "female", "unspecified"] = "unspecified"


# ── Endpoint ──────────────────────────────────────────────────────────

@router.post("/products/{product_id}/size-advice")
def size_advice(product_id: int, body: SizeRequest):
    # 1. Fetch product
    product = db.query_one(
        "SELECT product_name, category_name, brand_name, product_description "
        "FROM products WHERE product_id = %s",
        (product_id,),
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 2. Fetch sizing reviews
    sizing_reviews = _get_sizing_reviews(product_id)
    reviews_block = (
        "\n".join(f"- {r}" for r in sizing_reviews)
        if sizing_reviews
        else "No customer reviews mentioning sizing available yet."
    )

    # 3. Build prompt
    prompt = (
        f"{SIZE_ADVISOR}\n\n"
        f"PRODUCT:\n"
        f"  Name     : {product['product_name']}\n"
        f"  Category : {product.get('category_name', 'clothing')}\n"
        f"  Brand    : {product.get('brand_name', 'N/A')}\n"
        f"  Desc     : {str(product.get('product_description', ''))[:300]}\n\n"
        f"USER MEASUREMENTS:\n"
        f"  Gender   : {body.gender}\n"
        f"  Height   : {body.height_cm} cm\n"
        f"  Weight   : {body.weight_kg} kg\n"
        f"  Usual sz : {body.usual_size}\n\n"
        f"CUSTOMER REVIEWS ABOUT SIZING ({len(sizing_reviews)} found):\n"
        f"{reviews_block}"
    )

    try:
        raw  = generate(prompt, temperature=0.3)
        data = json.loads(_strip_json(raw))
    except Exception as e:
        logger.warning(f"Size advisor LLM failed for pid={product_id}: {e}")
        data = {
            "recommended_size": body.usual_size,
            "confidence":       "low",
            "fit_note":         "We couldn't generate a personalised recommendation right now. Based on your usual size, try your normal fit.",
            "sizing_trend":     "insufficient_data",
            "community_says":   "No sizing community data available for this product yet.",
        }

    logger.info(
        f"size-advice pid={product_id} → {data.get('recommended_size')} "
        f"({data.get('confidence')}, trend={data.get('sizing_trend')})"
    )
    return {
        "success":          True,
        "product_name":     product["product_name"],
        "sizing_review_count": len(sizing_reviews),
        **data,
    }
