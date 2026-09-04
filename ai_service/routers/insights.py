"""
AI Insights — Phase 11

POST /ai/wishlist-insights
  Computes savings/sale data server-side; Gemini generates a style tip
  and best-buy recommendation from the wishlist collection.

POST /ai/search-suggest
  Given a search query, returns 4 AI-generated refinement chips.
"""
import json
import logging
import re
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services.llm import generate

logger = logging.getLogger(__name__)
router = APIRouter()


def _strip_json(raw: str) -> str:
    return re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("`").strip()


# ── Wishlist Insights ─────────────────────────────────────────────────

class WishlistItem(BaseModel):
    product_id:   int
    product_name: str
    sell_price:   float
    normal_price: float
    category_name: str = ""


class WishlistInsightsRequest(BaseModel):
    items:   list[WishlistItem]
    user_id: Optional[int] = None


@router.post("/wishlist-insights")
def wishlist_insights(body: WishlistInsightsRequest):
    if not body.items:
        return {"success": True, "insights": None}

    on_sale       = [i for i in body.items if i.normal_price > i.sell_price]
    total_savings = sum(i.normal_price - i.sell_price for i in on_sale)
    total_value   = sum(i.sell_price for i in body.items)

    items_str = "\n".join(
        f"- {i.product_name} (Rs.{i.sell_price:,.0f}, category: {i.category_name or 'fashion'})"
        for i in body.items[:12]
    )

    prompt = (
        "You are a personal fashion stylist.\n"
        "A customer's wishlist contains:\n"
        f"{items_str}\n\n"
        "Generate a JSON object with exactly these two fields:\n"
        '{\n'
        '  "style_tip": "1-2 sentence insight or compliment about the taste/style shown in this wishlist",\n'
        '  "best_buy": "name of the single item from the list above that gives the best value or versatility"\n'
        '}\n'
        "Output ONLY valid JSON, no markdown."
    )

    try:
        raw  = generate(prompt, temperature=0.5)
        data = json.loads(_strip_json(raw))
    except Exception as e:
        logger.warning(f"Wishlist insights LLM failed: {e}")
        data = {
            "style_tip": "You have a great eye for fashion — this is a well-curated wishlist!",
            "best_buy":  body.items[0].product_name,
        }

    return {
        "success": True,
        "insights": {
            "total_items":         len(body.items),
            "on_sale_count":       len(on_sale),
            "total_savings":       round(total_savings, 2),
            "total_wishlist_value": round(total_value, 2),
            "on_sale_names":       [i.product_name for i in on_sale],
            "style_tip":           data.get("style_tip", ""),
            "best_buy":            data.get("best_buy", ""),
        },
    }


# ── Search Suggest ────────────────────────────────────────────────────

class SearchSuggestRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=200)


@router.post("/search-suggest")
def search_suggest(body: SearchSuggestRequest):
    prompt = (
        f'For the fashion e-commerce search query: "{body.query}"\n'
        "Generate exactly 4 more specific refinement searches that narrow the query.\n"
        "Keep each to 3–6 words. Make them distinct and relevant to a Nepali fashion store.\n"
        "Output ONLY a JSON array of 4 strings. No markdown.\n"
        'Example: ["men\'s slim fit jeans", "women\'s high waist jeans", "budget denim under Rs.2000", "stretch comfort jeans"]'
    )

    try:
        raw         = generate(prompt, temperature=0.4)
        suggestions = json.loads(_strip_json(raw))
        if isinstance(suggestions, list):
            suggestions = [s for s in suggestions if isinstance(s, str)][:4]
        else:
            suggestions = []
    except Exception as e:
        logger.warning(f"Search suggest LLM failed: {e}")
        suggestions = []

    return {"success": True, "suggestions": suggestions}
