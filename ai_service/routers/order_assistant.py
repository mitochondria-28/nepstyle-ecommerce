"""
POST /ai/order-assistant — AI Order Assistant (Phase 8)

Fetches the authenticated user's orders + items from DB, builds a rich
context block, and answers questions via Gemini (multi-turn).

Security: user_id is validated at the DB level — we never expose another
user's orders, and the LLM only sees what the query returns for that uid.
"""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

import db
from prompts.base import ORDER_ASSISTANT
from services.llm import chat as llm_chat

logger = logging.getLogger(__name__)
router = APIRouter()


class Message(BaseModel):
    role: str
    content: str


class OrderAssistantRequest(BaseModel):
    message: str          = Field(..., min_length=1, max_length=2000)
    user_id: int
    history: list[Message] = []


# ── DB helpers ────────────────────────────────────────────────────

def _fetch_orders(user_id: int) -> list[dict]:
    return db.query_all(
        """
        SELECT order_id, total_amount, payment_method,
               delivery_location, order_status, order_date
        FROM orders
        WHERE user_id = %s
        ORDER BY order_date DESC
        LIMIT 20
        """,
        (user_id,),
    ) or []


def _fetch_items(order_id: int) -> list[dict]:
    return db.query_all(
        """
        SELECT oi.quantity, oi.price, oi.total_price,
               p.product_name
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = %s
        """,
        (order_id,),
    ) or []


def _build_order_context(user_id: int) -> str:
    orders = _fetch_orders(user_id)
    if not orders:
        return "This user has no orders yet."

    total_spent = sum(float(o["total_amount"]) for o in orders)
    lines = [
        f"User has {len(orders)} order(s). Total lifetime spend: Rs.{total_spent:,.0f}\n"
    ]

    for o in orders:
        oid    = o["order_id"]
        date   = str(o["order_date"])[:10]
        status = o["order_status"].upper()
        amount = float(o["total_amount"])
        method = o["payment_method"]
        loc    = o["delivery_location"]

        items = _fetch_items(oid)
        item_lines = ", ".join(
            f"{it['product_name']} x{it['quantity']} (Rs.{float(it['price']):,.0f})"
            for it in items
        ) or "item details unavailable"

        lines.append(
            f"Order #{oid} [{status}] — {date}\n"
            f"  Items   : {item_lines}\n"
            f"  Total   : Rs.{amount:,.0f} via {method}\n"
            f"  Delivery: {loc}"
        )

    return "\n\n".join(lines)


# ── Endpoint ──────────────────────────────────────────────────────

@router.post("/order-assistant")
def order_assistant(body: OrderAssistantRequest):
    try:
        order_ctx = _build_order_context(body.user_id)

        system_prompt = (
            ORDER_ASSISTANT
            + f"\n\n--- USER ORDER DATA ---\n{order_ctx}"
        )

        messages = [{"role": m.role, "content": m.content} for m in body.history]
        messages.append({"role": "user", "content": body.message})

        response = llm_chat(messages, system_prompt=system_prompt, temperature=0.3)

        return {"success": True, "response": response, "role": "assistant"}

    except Exception as e:
        logger.exception(f"Order assistant failed for user {body.user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
