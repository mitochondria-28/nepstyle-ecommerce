"""
POST /ai/chat — AI Shopping Assistant (Phase 4)

Accepts a conversation history + current message, retrieves relevant
product/policy context via hybrid search, and responds using Gemini.
"""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

import db
from prompts.base import SHOPPING_ASSISTANT
from services.llm import chat as llm_chat
from services.rag import (
    hybrid_product_search,
    search_policies,
    format_products_context,
    format_reviews_context,
)

logger = logging.getLogger(__name__)
router = APIRouter()


class Message(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    message:  str                  = Field(..., min_length=1, max_length=2000)
    history:  list[Message]        = []
    user_id:  Optional[int]        = None


def _build_context(query: str) -> str:
    """RAG: fetch relevant products + policies for the current message."""
    parts = []

    try:
        products = hybrid_product_search(query, top_k=5)
        if products:
            parts.append("RELEVANT PRODUCTS:\n" + format_products_context(products, include_score=False))
    except Exception as e:
        logger.warning(f"Product search failed for chat context: {e}")

    try:
        policies = search_policies(query, top_k=2)
        if policies:
            policy_text = "\n".join(
                f"[{p['payload'].get('name','Policy')}]: {p['payload'].get('content','')[:500]}"
                for p in policies
            )
            parts.append("STORE POLICIES:\n" + policy_text)
    except Exception as e:
        logger.warning(f"Policy search failed for chat context: {e}")

    return "\n\n".join(parts) if parts else ""


def _user_order_context(user_id: int) -> str:
    """Fetch basic order summary for authenticated users."""
    try:
        orders = db.query_all(
            "SELECT order_id, total_amount, order_status, created_at "
            "FROM orders WHERE user_id = %s ORDER BY created_at DESC LIMIT 5",
            (user_id,),
        )
        if not orders:
            return ""
        lines = [f"USER ORDER HISTORY (last {len(orders)}):"]
        for o in orders:
            lines.append(
                f"  Order #{o['order_id']} — Rs.{o['total_amount']:,.0f} "
                f"({o['order_status']}) on {str(o['created_at'])[:10]}"
            )
        return "\n".join(lines)
    except Exception:
        return ""


@router.post("/chat")
def chat(body: ChatRequest):
    try:
        # Build RAG context from query
        context = _build_context(body.message)
        order_ctx = _user_order_context(body.user_id) if body.user_id else ""

        # Combine contexts into system injection
        system_extra = ""
        if context:
            system_extra += f"\n\n--- RETRIEVED CONTEXT ---\n{context}"
        if order_ctx:
            system_extra += f"\n\n{order_ctx}"

        system_prompt = SHOPPING_ASSISTANT + system_extra

        # Build message list for multi-turn
        messages = [
            {"role": m.role, "content": m.content}
            for m in body.history
        ]
        messages.append({"role": "user", "content": body.message})

        response = llm_chat(messages, system_prompt=system_prompt, temperature=0.5)

        return {
            "success":  True,
            "response": response,
            "role":     "assistant",
        }

    except Exception as e:
        logger.exception(f"Chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
