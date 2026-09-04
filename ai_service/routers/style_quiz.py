"""
AI Style Quiz — Phase 16

POST /ai/style-quiz  →  personalized style profile + product picks

Flow:
  1. Receive user's style preference, budget tier, and category interests
  2. Gemini generates: profile_name, profile_bio, style_emoji, 3 search_queries
  3. hybrid_product_search for each query, then filter by price range
  4. Return deduplicated profile + up to 12 products
"""
import json
import logging
import re

from fastapi import APIRouter
from pydantic import BaseModel

from prompts.base import STYLE_QUIZ_PROFILER
from services.llm import generate
from services.rag import hybrid_product_search

logger = logging.getLogger(__name__)
router = APIRouter()

_BUDGET_RANGES = {
    "budget":  (0,    1000),
    "mid":     (500,  3500),
    "premium": (2000, 99999),
}

_BUDGET_LABELS = {
    "budget":  "under Rs 1,000",
    "mid":     "Rs 1,000–3,000",
    "premium": "Rs 3,000+",
}

_CATEGORY_LABELS = {
    "tops":        "tops and shirts",
    "bottoms":     "trousers and jeans",
    "outerwear":   "jackets and coats",
    "footwear":    "shoes and sneakers",
    "accessories": "belts, bags, and accessories",
}

_DEFAULT_QUERIES = {
    "casual":  ["casual t-shirt", "denim jeans", "comfortable hoodie"],
    "formal":  ["formal shirt", "blazer", "dress trousers"],
    "sporty":  ["sports jersey", "track pants", "running shoes"],
    "trendy":  ["trendy top", "fashion jacket", "streetwear"],
}


class StyleQuizRequest(BaseModel):
    style:      str        # casual | formal | sporty | trendy
    budget:     str        # budget | mid | premium
    categories: list[str]  # tops | bottoms | outerwear | footwear | accessories
    user_id:    int | None = None


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


@router.post("/style-quiz")
def style_quiz(body: StyleQuizRequest):
    style      = body.style.lower()      if body.style in ("casual", "formal", "sporty", "trendy") else "casual"
    budget     = body.budget.lower()     if body.budget in _BUDGET_RANGES else "mid"
    categories = [c for c in body.categories if c in _CATEGORY_LABELS] or ["tops"]

    price_min, price_max = _BUDGET_RANGES[budget]
    budget_label  = _BUDGET_LABELS[budget]
    cat_labels    = [_CATEGORY_LABELS[c] for c in categories]

    prompt = (
        f"Style preference: {style}\n"
        f"Budget: {budget_label}\n"
        f"Shopping for: {', '.join(cat_labels)}"
    )

    llm_data: dict = {}
    try:
        raw = generate(prompt, system_prompt=STYLE_QUIZ_PROFILER, temperature=0.75)
        llm_data = json.loads(_strip_json(raw))
    except Exception as e:
        logger.warning("style_quiz: LLM failed: %s", e)

    profile_name  = llm_data.get("profile_name",  "The Style Seeker")
    profile_bio   = llm_data.get("profile_bio",   "You have a great eye for fashion. These picks were chosen just for you.")
    style_emoji   = llm_data.get("style_emoji",   "✨")
    search_queries = llm_data.get("search_queries", _DEFAULT_QUERIES.get(style, ["casual wear"]))
    if not isinstance(search_queries, list):
        search_queries = _DEFAULT_QUERIES.get(style, ["casual wear"])
    search_queries = search_queries[:3]

    products: list[dict] = []
    seen_ids: set[int]   = set()

    for query in search_queries:
        try:
            raw_results = hybrid_product_search(query, top_k=8)
        except Exception as e:
            logger.warning("style_quiz: search failed for '%s': %s", query, e)
            continue

        for p in raw_results:
            pid   = p.get("product_id")
            price = float(p.get("sell_price") or 0)
            if pid and pid not in seen_ids and price_min <= price <= price_max:
                products.append(_normalise(p))
                seen_ids.add(pid)
            if len(products) >= 12:
                break
        if len(products) >= 12:
            break

    # If price filter is too strict, fall back without it
    if len(products) < 4:
        for query in search_queries:
            try:
                raw_results = hybrid_product_search(query, top_k=6)
            except Exception:
                continue
            for p in raw_results:
                pid = p.get("product_id")
                if pid and pid not in seen_ids:
                    products.append(_normalise(p))
                    seen_ids.add(pid)
                if len(products) >= 12:
                    break
            if len(products) >= 12:
                break

    return {
        "profile_name":    profile_name,
        "profile_bio":     profile_bio,
        "style_emoji":     style_emoji,
        "style":           style,
        "budget":          budget,
        "budget_label":    budget_label,
        "categories":      categories,
        "products":        products,
        "queries_used":    search_queries,
    }
