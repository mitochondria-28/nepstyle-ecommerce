"""
POST /ai/product/{id}/ask — Ask AI about a specific product (Phase 4)

Fetches full product data + reviews from DB/Qdrant and answers
the user's question grounded in real data.
"""
import json
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

import db
from prompts.base import PRODUCT_QA
from services.llm import generate as llm_generate
from services.rag import get_product_reviews, format_reviews_context

logger = logging.getLogger(__name__)
router = APIRouter()


class AskRequest(BaseModel):
    question: str           = Field(..., min_length=1, max_length=500)
    user_id:  Optional[int] = None


@router.post("/product/{product_id}/ask")
def ask(product_id: int, body: AskRequest):
    try:
        product = db.query_one(
            "SELECT p.*, c.category_name, b.brand_name "
            "FROM products p "
            "LEFT JOIN categories c ON p.category_id = c.category_id "
            "LEFT JOIN brands b ON p.brand_id = b.brand_id "
            "WHERE p.product_id = %s",
            (product_id,),
        )
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

        product = dict(product)

        # Fetch reviews (try Qdrant, fallback to DB)
        review_context = ""
        try:
            rev_results = get_product_reviews(product_id, top_k=15)
            review_context = format_reviews_context(rev_results) if rev_results else ""
        except Exception:
            try:
                db_reviews = db.query_all(
                    "SELECT user_name, rating, comment FROM reviews WHERE product_id = %s LIMIT 15",
                    (product_id,),
                )
                if db_reviews:
                    review_context = "\n".join(
                        f"- {r['user_name']} rated {r['rating']}/5: {r['comment']}"
                        for r in db_reviews
                    )
            except Exception:
                pass

        in_stock = (product.get("total_product_count") or 0) > 0
        product_context = (
            f"Product: {product.get('product_name')}\n"
            f"Brand: {product.get('brand_name', 'N/A')}\n"
            f"Category: {product.get('category_name', 'N/A')}\n"
            f"Price: Rs.{product.get('sell_price', 0):,.0f}"
            + (f" (was Rs.{product.get('normal_price', 0):,.0f})" if float(product.get('normal_price', 0)) > float(product.get('sell_price', 0)) else "")
            + f"\nStock: {'In Stock' if in_stock else 'Out of Stock'}\n"
            f"Description: {product.get('product_description', 'N/A')}"
        )

        prompt = (
            f"PRODUCT DATA:\n{product_context}\n\n"
            + (f"CUSTOMER REVIEWS:\n{review_context}\n\n" if review_context else "")
            + f"USER QUESTION: {body.question}"
        )

        answer = llm_generate(prompt, system_prompt=PRODUCT_QA, temperature=0.3)

        return {
            "success":    True,
            "product_id": product_id,
            "question":   body.question,
            "answer":     answer,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Product Q&A failed for product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
