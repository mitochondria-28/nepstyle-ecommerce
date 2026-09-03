"""
GET /ai/products/{id}/reviews/summary — AI Review Summary (Phase 6)
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/products/{product_id}/reviews/summary")
def review_summary(product_id: int):
    return {
        "success": False,
        "phase": 6,
        "message": "AI review summaries will be available in Phase 6.",
    }
