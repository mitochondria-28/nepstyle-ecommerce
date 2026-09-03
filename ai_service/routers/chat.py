"""
POST /ai/chat — AI Shopping Assistant (Phase 4)
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    user_id: int | None = None


@router.post("/chat")
def chat(body: ChatRequest):
    return {
        "success": False,
        "phase": 4,
        "message": "AI Shopping Assistant will be available in Phase 4.",
    }
