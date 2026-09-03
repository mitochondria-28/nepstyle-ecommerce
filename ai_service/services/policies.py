"""
Store policies as structured text documents.
These are indexed into Qdrant so the support assistant can retrieve them via RAG.
Managed here in code rather than a DB table — easy to edit without a migration.
"""

STORE_POLICIES: dict[str, dict] = {
    "return_policy": {
        "name": "Return Policy",
        "content": (
            "NepStyle accepts returns within 7 days of delivery. "
            "Items must be unused, unwashed, and in their original packaging with all tags attached. "
            "Defective or damaged items are eligible for return regardless of condition. "
            "Flash sale and clearance items follow the same 7-day return window. "
            "To initiate a return, contact NepStyle support with your order ID and a photo of the item. "
            "Return shipping costs are covered by NepStyle for defective items; "
            "customer pays return shipping for change-of-mind returns."
        ),
    },
    "refund_policy": {
        "name": "Refund Policy",
        "content": (
            "Refunds are processed within 5–7 business days after the returned item is received and inspected. "
            "Refunds are issued to the original payment method. "
            "Cash-on-delivery orders receive refunds via bank transfer or eSewa/Khalti wallet. "
            "Partial refunds may be issued if only part of the order is returned. "
            "Shipping fees are non-refundable unless the return is due to a NepStyle error or defective product."
        ),
    },
    "delivery_policy": {
        "name": "Delivery Policy",
        "content": (
            "NepStyle delivers across Nepal in 2–5 business days. "
            "Delivery to Kathmandu Valley typically takes 1–2 business days. "
            "Remote areas may take up to 7 business days. "
            "Orders placed before 12:00 PM are processed the same day. "
            "Tracking information is provided via SMS or email after dispatch. "
            "Free delivery is available on orders above Rs. 2,000. "
            "Standard delivery charge is Rs. 100–200 depending on location."
        ),
    },
    "payment_policy": {
        "name": "Payment Methods",
        "content": (
            "NepStyle accepts the following payment methods: "
            "Cash on Delivery (COD) — pay when you receive your order. "
            "eSewa — Nepal's leading digital wallet. "
            "Khalti — digital payment platform. "
            "All digital payments are processed securely. "
            "COD is available for all locations across Nepal. "
            "For international orders, please contact support directly."
        ),
    },
    "cancellation_policy": {
        "name": "Order Cancellation Policy",
        "content": (
            "Orders can be cancelled before they are dispatched (usually within 12 hours of placement). "
            "To cancel, contact NepStyle support immediately with your order ID. "
            "Once an order is dispatched, it cannot be cancelled — you may return it after delivery. "
            "Cancelled orders receive a full refund within 3–5 business days. "
            "Repeat cancellations may affect your ability to use Cash on Delivery."
        ),
    },
    "warranty_policy": {
        "name": "Warranty Policy",
        "content": (
            "Warranty coverage depends on the brand and product type. "
            "Most branded clothing and footwear (Nike, Adidas, Puma, etc.) come with a manufacturer's warranty "
            "covering manufacturing defects for 3–6 months. "
            "Electronics and accessories may have different warranty periods — check the product page. "
            "Warranty does not cover normal wear and tear, accidental damage, or improper use. "
            "To make a warranty claim, contact NepStyle support with proof of purchase."
        ),
    },
    "store_faq": {
        "name": "Store FAQ",
        "content": (
            "Q: Are products on NepStyle authentic? "
            "A: Yes, all products are 100% authentic and sourced directly from official brand distributors. "
            "Q: Can I exchange a product for a different size? "
            "A: Yes, size exchanges are accepted within 7 days if the correct size is in stock. "
            "Q: Do you ship internationally? "
            "A: Currently NepStyle ships only within Nepal. International shipping is coming soon. "
            "Q: How do I track my order? "
            "A: You will receive an SMS/email with tracking details after your order is dispatched. "
            "Q: Can I place an order without creating an account? "
            "A: Yes, guest checkout is available. You will need to provide your name and phone number. "
            "Q: What if I receive a wrong product? "
            "A: Contact support immediately with a photo. We will arrange an exchange or full refund at no cost."
        ),
    },
}


def get_all_policies() -> list[dict]:
    """Return all policies as a flat list for indexing."""
    return [
        {"slug": slug, "name": meta["name"], "content": meta["content"]}
        for slug, meta in STORE_POLICIES.items()
    ]


def format_policies_for_llm(policies: list[dict]) -> str:
    """Format retrieved policy documents into a context block for the LLM."""
    lines = []
    for p in policies:
        lines.append(f"[{p['payload']['policy_name']}]\n{p['payload']['content']}")
    return "\n\n".join(lines)
