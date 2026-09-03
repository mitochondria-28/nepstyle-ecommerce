"""
POST /ai/support — AI Customer Support via RAG (Phase 8)
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class SupportRequest(BaseModel):
    message: str
    user_id: int | None = None
    history: list[dict] = []


@router.post("/support")
def support(body: SupportRequest):
    return {
        "success": False,
        "phase": 8,
        "message": "Customer support assistant will be available in Phase 8.",
    }
