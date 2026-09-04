"""
POST /ai/support — AI Customer Support via Policy RAG (Phase 8)

Retrieves relevant policy documents from Qdrant, then uses Gemini to
answer the user's support question. Works for both guest and logged-in users.
Falls back to hardcoded policy knowledge if Qdrant returns nothing.
"""
import logging
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from prompts.base import CUSTOMER_SUPPORT
from services.llm import chat as llm_chat
from services.rag import search_policies

logger = logging.getLogger(__name__)
router = APIRouter()

FALLBACK_POLICIES = """
NEPSTYLE STORE POLICIES (ground truth):

Returns: Items must be returned within 7 days of delivery. Items must be unused,
in original packaging with tags intact.

Refunds: Processed within 5-7 business days after the return is approved and
received at our warehouse.

Delivery: Standard delivery is 2-5 business days across Nepal. Free delivery
on orders above Rs. 2,000.

Payment methods accepted: Cash on Delivery (COD), eSewa, Khalti.

Order cancellations: Orders can be cancelled within 24 hours of placement if
they have not yet been shipped.

Warranty: Varies by brand. Please check the individual product page for details.

Exchanges: We offer size or colour exchanges within 7 days. Customer bears
return shipping cost for exchanges.

Contact: For further assistance email support@nepstyle.com or call +977-01-XXXXXX.
"""


class Message(BaseModel):
    role: str
    content: str


class SupportRequest(BaseModel):
    message: str           = Field(..., min_length=1, max_length=2000)
    user_id: Optional[int] = None
    history: list[Message] = []


@router.post("/support")
def support(body: SupportRequest):
    try:
        # RAG: retrieve relevant policy docs
        policy_ctx = ""
        try:
            policies = search_policies(body.message, top_k=3)
            if policies:
                policy_ctx = "RETRIEVED POLICY DOCUMENTS:\n" + "\n\n".join(
                    f"[{p['payload'].get('name', 'Policy')}]:\n{p['payload'].get('content', '')[:800]}"
                    for p in policies
                )
        except Exception as e:
            logger.warning(f"Policy RAG failed, using fallback: {e}")

        context = policy_ctx if policy_ctx else FALLBACK_POLICIES
        system_prompt = CUSTOMER_SUPPORT + f"\n\n{context}"

        messages = [{"role": m.role, "content": m.content} for m in body.history]
        messages.append({"role": "user", "content": body.message})

        response = llm_chat(messages, system_prompt=system_prompt, temperature=0.4)

        return {"success": True, "response": response, "role": "assistant"}

    except Exception as e:
        logger.exception(f"Support endpoint failed: {e}")
        return {
            "success":  True,
            "response": (
                "I'm sorry, I'm having trouble right now. "
                "Please email support@nepstyle.com or call us directly for immediate help."
            ),
            "role": "assistant",
        }
