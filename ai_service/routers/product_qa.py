"""
POST /ai/product/{id}/ask — Ask AI about a specific product (Phase 4)
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class AskRequest(BaseModel):
    question: str
    user_id: int | None = None


@router.post("/product/{product_id}/ask")
def ask(product_id: int, body: AskRequest):
    return {
        "success": False,
        "phase": 4,
        "message": "Product Q&A will be available in Phase 4.",
    }
