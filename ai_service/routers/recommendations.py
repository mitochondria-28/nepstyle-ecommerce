"""
GET /ai/products/{id}/similar   — Similar products  (Phase 5)
GET /ai/personalized/{user_id}  — Personalized feed (Phase 5/7)
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/products/{product_id}/similar")
def similar_products(product_id: int):
    return {
        "success": False,
        "phase": 5,
        "message": "Similar products will be available in Phase 5.",
    }


@router.get("/personalized/{user_id}")
def personalized(user_id: int):
    return {
        "success": False,
        "phase": 5,
        "message": "Personalised recommendations will be available in Phase 5.",
    }
