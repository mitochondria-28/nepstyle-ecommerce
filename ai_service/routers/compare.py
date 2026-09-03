"""
POST /ai/compare — AI Product Comparison (Phase 4)

Accepts 2-4 product IDs, fetches their full details, and asks
the LLM to produce a structured comparison with a recommendation.
"""
import json
import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

import db
from prompts.base import PRODUCT_COMPARISON
from services.llm import generate as llm_generate

logger = logging.getLogger(__name__)
router = APIRouter()


class CompareRequest(BaseModel):
    product_ids: list[int] = Field(..., min_length=2, max_length=4)


def _product_block(product: dict) -> str:
    in_stock = (product.get("total_product_count") or 0) > 0
    normal_p = float(product.get("normal_price") or 0)
    sell_p   = float(product.get("sell_price") or 0)
    discount = round(((normal_p - sell_p) / normal_p) * 100) if normal_p > sell_p else 0

    lines = [
        f"=== {product['product_name']} ===",
        f"Brand    : {product.get('brand_name', 'N/A')}",
        f"Category : {product.get('category_name', 'N/A')}",
        f"Price    : Rs.{sell_p:,.0f}" + (f" ({discount}% off from Rs.{normal_p:,.0f})" if discount else ""),
        f"Stock    : {'In Stock' if in_stock else 'Out of Stock'}",
        f"Desc     : {str(product.get('product_description') or 'N/A')[:300]}",
    ]
    return "\n".join(lines)


@router.post("/compare")
def compare(body: CompareRequest):
    if len(set(body.product_ids)) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 distinct product IDs")

    try:
        products = []
        for pid in body.product_ids:
            row = db.query_one(
                "SELECT p.*, c.category_name, b.brand_name "
                "FROM products p "
                "LEFT JOIN categories c ON p.category_id = c.category_id "
                "LEFT JOIN brands b ON p.brand_id = b.brand_id "
                "WHERE p.product_id = %s",
                (pid,),
            )
            if not row:
                raise HTTPException(status_code=404, detail=f"Product {pid} not found")
            products.append(dict(row))

        context = "\n\n".join(_product_block(p) for p in products)
        prompt   = f"Compare these {len(products)} products:\n\n{context}"

        raw = llm_generate(prompt, system_prompt=PRODUCT_COMPARISON, temperature=0.2)

        # Try to parse the JSON output; if it fails, return raw text
        try:
            # Strip markdown code fences if present
            clean = raw.strip()
            if clean.startswith("```"):
                clean = clean.split("```", 2)[1]
                if clean.startswith("json"):
                    clean = clean[4:]
                clean = clean.rsplit("```", 1)[0].strip()
            comparison = json.loads(clean)
        except json.JSONDecodeError:
            comparison = {"raw": raw}

        return {
            "success":    True,
            "products":   [
                {
                    "product_id":   p["product_id"],
                    "product_name": p["product_name"],
                    "sell_price":   p["sell_price"],
                    "brand_name":   p.get("brand_name"),
                    "thumbnail":    p.get("product_thumbnail"),
                }
                for p in products
            ],
            "comparison": comparison,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Compare failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
