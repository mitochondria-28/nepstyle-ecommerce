"""
POST /ai/order-assistant — AI Order Assistant (Phase 8)

Requires authenticated user context. The user_id in the request body
is validated against the DB — we never trust the LLM to scope queries.
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class OrderAssistantRequest(BaseModel):
    message: str
    user_id: int
    history: list[dict] = []


@router.post("/order-assistant")
def order_assistant(body: OrderAssistantRequest):
    return {
        "success": False,
        "phase": 8,
        "message": "Order assistant will be available in Phase 8.",
    }
