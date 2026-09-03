"""
Qdrant indexing service.

Responsible for embedding documents and upserting them into Qdrant.
Called:
  - By seed_vectors.py at initial setup
  - By admin reindex endpoints when products/reviews change

Point ID strategy — deterministic UUIDs derived from entity IDs
so the same entity always maps to the same vector slot (safe upsert/delete):
  product  → uuid5(NS, "nepstyle:product:<id>")
  review   → uuid5(NS, "nepstyle:review:<id>")
  category → uuid5(NS, "nepstyle:category:<id>")
  policy   → uuid5(NS, "nepstyle:policy:<slug>")
"""
import uuid
import logging

from qdrant_client.models import (
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    FilterSelector,
    PointIdsList,
)

from config import settings
from qdrant_setup import get_qdrant
from services.embeddings import embed_text, build_product_text

logger = logging.getLogger(__name__)

# Stable custom namespace UUID for this project
_NS = uuid.UUID("7c9e6679-7425-40de-944b-e07fc1f90ae7")


# ── ID helpers ────────────────────────────────────────────────────

def product_vid(product_id: int) -> str:
    return str(uuid.uuid5(_NS, f"nepstyle:product:{product_id}"))

def review_vid(review_id: int) -> str:
    return str(uuid.uuid5(_NS, f"nepstyle:review:{review_id}"))

def category_vid(category_id: int) -> str:
    return str(uuid.uuid5(_NS, f"nepstyle:category:{category_id}"))

def policy_vid(slug: str) -> str:
    return str(uuid.uuid5(_NS, f"nepstyle:policy:{slug}"))


# ── Core upsert ───────────────────────────────────────────────────

def _upsert(point_id: str, vector: list[float], payload: dict) -> None:
    get_qdrant().upsert(
        collection_name=settings.qdrant_collection,
        points=[PointStruct(id=point_id, vector=vector, payload=payload)],
    )


# ── Per-entity indexers ───────────────────────────────────────────

def index_product(product: dict) -> None:
    """Embed a product row and upsert it into Qdrant."""
    pid = int(product["product_id"])
    text = build_product_text(product)
    vector = embed_text(text, task_type="RETRIEVAL_DOCUMENT")

    _upsert(
        product_vid(pid),
        vector,
        {
            "type": "product",
            "product_id": pid,
            "product_name": str(product.get("product_name") or ""),
            "category_id": int(product.get("category_id") or 0),
            "category_name": str(product.get("category_name") or ""),
            "brand_id": int(product.get("brand_id") or 0),
            "brand_name": str(product.get("brand_name") or ""),
            "product_description": str(product.get("product_description") or ""),
            "product_thumbnail": str(product.get("product_thumbnail") or ""),
            "sell_price": float(product.get("sell_price") or 0),
            "normal_price": float(product.get("normal_price") or 0),
            "total_product_count": int(product.get("total_product_count") or 0),
            "in_stock": int(product.get("total_product_count") or 0) > 0,
            "source": "products",
        },
    )
    logger.debug(f"Indexed product {pid}: {product.get('product_name')}")


def index_review(review: dict, product_name: str = "") -> None:
    """Embed a review row and upsert it into Qdrant."""
    rid = int(review["review_id"])
    comment = str(review.get("comment") or "")
    rating = review.get("rating", 0)
    name = product_name or str(review.get("product_name") or "")

    text = (
        f"Customer review for {name}: {comment} "
        f"(Rating: {rating}/5 stars)"
    )
    vector = embed_text(text, task_type="RETRIEVAL_DOCUMENT")

    _upsert(
        review_vid(rid),
        vector,
        {
            "type": "review",
            "review_id": rid,
            "product_id": int(review.get("product_id") or 0),
            "product_name": name,
            "user_name": str(review.get("user_name") or ""),
            "comment": comment,
            "rating": float(rating),
            "source": "reviews",
        },
    )
    logger.debug(f"Indexed review {rid}")


def index_category(category: dict) -> None:
    """Embed a category and upsert it into Qdrant."""
    cid = int(category["category_id"])
    name = str(category.get("category_name") or "")
    desc = str(category.get("category_description") or "")
    text = f"Fashion category: {name}. {desc}".strip()
    vector = embed_text(text, task_type="RETRIEVAL_DOCUMENT")

    _upsert(
        category_vid(cid),
        vector,
        {
            "type": "category",
            "category_id": cid,
            "category_name": name,
            "category_description": desc,
            "category_thumbnail": str(category.get("category_thumbnail") or ""),
            "source": "categories",
        },
    )
    logger.debug(f"Indexed category {cid}: {name}")


def index_policy(slug: str, name: str, content: str) -> None:
    """Embed a store policy document and upsert it into Qdrant."""
    text = f"{name}: {content}"
    vector = embed_text(text, task_type="RETRIEVAL_DOCUMENT")

    _upsert(
        policy_vid(slug),
        vector,
        {
            "type": "policy",
            "policy_slug": slug,
            "policy_name": name,
            "content": content,
            "source": "policies",
        },
    )
    logger.debug(f"Indexed policy: {name}")


# ── Deletion helpers ──────────────────────────────────────────────

def delete_product_vectors(product_id: int) -> None:
    """Remove a product's vector AND all its review vectors from Qdrant."""
    client = get_qdrant()
    col = settings.qdrant_collection

    # Delete product vector by ID
    client.delete(
        collection_name=col,
        points_selector=PointIdsList(points=[product_vid(product_id)]),
    )

    # Delete all review vectors that belong to this product
    client.delete(
        collection_name=col,
        points_selector=FilterSelector(
            filter=Filter(
                must=[
                    FieldCondition(key="type",       match=MatchValue(value="review")),
                    FieldCondition(key="product_id", match=MatchValue(value=product_id)),
                ]
            )
        ),
    )
    logger.info(f"Deleted vectors for product {product_id} and its reviews")


def delete_review_vector(review_id: int) -> None:
    """Remove a single review's vector from Qdrant."""
    get_qdrant().delete(
        collection_name=settings.qdrant_collection,
        points_selector=PointIdsList(points=[review_vid(review_id)]),
    )
    logger.info(f"Deleted review vector {review_id}")
