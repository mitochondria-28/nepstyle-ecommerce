"""
POST /ai/agent — Unified Intent-Routing AI Agent (Phase 9)

Classifies the user's message into one of four intents, then routes
to the appropriate specialized pipeline:

  shopping → hybrid product search  + AGENT_SHOPPING prompt + product cards
  order    → DB order lookup        + ORDER_ASSISTANT prompt
  support  → policy RAG             + CUSTOMER_SUPPORT prompt
  general  → no extra context       + AGENT_GENERAL prompt

Returns a unified response envelope:
  { success, intent, tool_activity, response, products? }
"""
import logging
from typing import Optional

from fastapi import APIRouter
from google.genai import types
from pydantic import BaseModel, Field

import db
from config import settings
from prompts.base import AGENT_GENERAL, AGENT_SHOPPING, CUSTOMER_SUPPORT, ORDER_ASSISTANT
from services.llm import _get_client, chat as llm_chat
from services.rag import format_products_context, hybrid_product_search, search_policies

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Intent detection ─────────────────────────────────────────────────

_ORDER_KEYWORDS = {
    "my order", "order #", "order status", "where is my order", "track my order",
    "cancel my order", "my purchase", "how much did i spend", "my orders",
    "my spending", "delivery address", "order history", "return my order",
}
_SUPPORT_KEYWORDS = {
    "return policy", "refund policy", "how do i return", "exchange policy",
    "payment method", "delivery time", "delivery charge", "free delivery",
    "how long does delivery", "warranty", "customer service", "contact you",
    "business days", "return a product", "can i cancel",
}
_SHOPPING_KEYWORDS = {
    "show me", "find me", "search for", "looking for", "recommend", "suggest",
    "i want", "i need", "buy a", "looking to buy", "best jacket", "best dress",
    "best shoes", "best shirt", "options for", "something for",
}


def _classify_intent(message: str) -> str:
    msg = message.lower()

    if any(k in msg for k in _ORDER_KEYWORDS):
        return "order"
    if any(k in msg for k in _SUPPORT_KEYWORDS):
        return "support"
    if any(k in msg for k in _SHOPPING_KEYWORDS):
        return "shopping"

    # Fallback: fast Gemini classification (single-word, 10 tokens max)
    try:
        client = _get_client()
        resp = client.models.generate_content(
            model=settings.gemini_model,
            contents=(
                "Classify this e-commerce chatbot message into exactly one word.\n"
                "Valid values: shopping | order | support | general\n\n"
                f"Message: {message[:300]}\n\n"
                "Respond with ONLY one of the four words, nothing else."
            ),
            config=types.GenerateContentConfig(temperature=0.0, max_output_tokens=10),
        )
        word = resp.text.strip().lower().split()[0]
        if word in ("shopping", "order", "support", "general"):
            return word
    except Exception as e:
        logger.warning(f"Intent classification failed: {e}")

    return "general"


TOOL_LABELS = {
    "shopping": "Searching catalog…",
    "order":    "Checking your orders…",
    "support":  "Looking up policies…",
    "general":  "Thinking…",
}


# ── DB helpers (order context, same as order_assistant.py) ────────────

def _fetch_orders(user_id: int) -> list[dict]:
    return db.query_all(
        """
        SELECT order_id, total_amount, payment_method,
               delivery_location, order_status, order_date
        FROM orders WHERE user_id = %s ORDER BY order_date DESC LIMIT 20
        """,
        (user_id,),
    ) or []


def _fetch_items(order_id: int) -> list[dict]:
    return db.query_all(
        """
        SELECT oi.quantity, oi.price, oi.total_price, p.product_name
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
    lines = [f"User has {len(orders)} order(s). Total lifetime spend: Rs.{total_spent:,.0f}\n"]
    for o in orders:
        oid    = o["order_id"]
        date   = str(o["order_date"])[:10]
        status = o["order_status"].upper()
        amount = float(o["total_amount"])
        method = o["payment_method"]
        loc    = o["delivery_location"]
        items  = _fetch_items(oid)
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


# ── Product normaliser ────────────────────────────────────────────────

def _normalise(item: dict) -> dict:
    p = item.get("product", item)
    return {
        "product_id":    p.get("product_id"),
        "product_name":  p.get("product_name", "Unknown"),
        "sell_price":    float(p.get("sell_price", 0)),
        "normal_price":  float(p.get("normal_price", 0)),
        "image_url":     p.get("image_url") or p.get("image") or "",
        "brand_name":    p.get("brand_name", ""),
        "category_name": p.get("category_name", ""),
    }


# ── Request / Response models ─────────────────────────────────────────

class Message(BaseModel):
    role: str
    content: str


class AgentRequest(BaseModel):
    message:  str           = Field(..., min_length=1, max_length=2000)
    user_id:  Optional[int] = None
    history:  list[Message] = []


# ── Endpoint ──────────────────────────────────────────────────────────

@router.post("/agent")
def agent(body: AgentRequest):
    intent = _classify_intent(body.message)
    logger.info(f"Agent intent={intent!r} for: {body.message[:80]!r}")

    history = [{"role": m.role, "content": m.content} for m in body.history]
    history.append({"role": "user", "content": body.message})

    products_out: list[dict] = []

    try:
        # ── Shopping ──────────────────────────────────────────────
        if intent == "shopping":
            results = hybrid_product_search(body.message, top_k=6)
            ctx = format_products_context(results)
            system = AGENT_SHOPPING + f"\n\n--- CATALOG RESULTS ---\n{ctx}"
            response = llm_chat(history, system_prompt=system, temperature=0.5)
            products_out = [_normalise(r) for r in results[:4]]

        # ── Order ─────────────────────────────────────────────────
        elif intent == "order":
            if not body.user_id:
                response = "Please log in to check your orders. I can help you track your order status, spending history, and more once you're signed in."
            else:
                ctx = _build_order_context(body.user_id)
                system = ORDER_ASSISTANT + f"\n\n--- USER ORDER DATA ---\n{ctx}"
                response = llm_chat(history, system_prompt=system, temperature=0.3)

        # ── Support ───────────────────────────────────────────────
        elif intent == "support":
            policy_ctx = ""
            try:
                policies = search_policies(body.message, top_k=3)
                if policies:
                    policy_ctx = "RETRIEVED POLICY DOCUMENTS:\n" + "\n\n".join(
                        f"[{p['payload'].get('name', 'Policy')}]:\n{p['payload'].get('content', '')[:600]}"
                        for p in policies
                    )
            except Exception as e:
                logger.warning(f"Policy RAG failed in agent: {e}")
            system = CUSTOMER_SUPPORT + (f"\n\n{policy_ctx}" if policy_ctx else "")
            response = llm_chat(history, system_prompt=system, temperature=0.4)

        # ── General ───────────────────────────────────────────────
        else:
            response = llm_chat(history, system_prompt=AGENT_GENERAL, temperature=0.6)

        return {
            "success":       True,
            "intent":        intent,
            "tool_activity": TOOL_LABELS[intent],
            "response":      response,
            "products":      products_out if products_out else None,
        }

    except Exception as e:
        logger.exception(f"Agent error (intent={intent}): {e}")
        return {
            "success":       True,
            "intent":        intent,
            "tool_activity": TOOL_LABELS.get(intent, "Thinking…"),
            "response":      "Sorry, I'm having trouble right now. Please try again in a moment.",
            "products":      None,
        }
