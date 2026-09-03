"""
POST /ai/compare — AI Product Comparison (Phase 4)
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class CompareRequest(BaseModel):
    product_ids: list[int]


@router.post("/compare")
def compare(body: CompareRequest):
    return {
        "success": False,
        "phase": 4,
        "message": "Product comparison will be available in Phase 4.",
    }
