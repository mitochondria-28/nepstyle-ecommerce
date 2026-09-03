"""
Qdrant client singleton and collection helpers.
"""
import logging
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
)

from config import settings

logger = logging.getLogger(__name__)

_client: QdrantClient | None = None


def get_qdrant() -> QdrantClient:
    global _client
    if _client is None:
        kwargs = {"url": settings.qdrant_url}
        if settings.qdrant_api_key:
            kwargs["api_key"] = settings.qdrant_api_key
        _client = QdrantClient(**kwargs)
        logger.info(f"Qdrant client initialised → {settings.qdrant_url}")
    return _client


def ping() -> bool:
    """Verify Qdrant is reachable. Used by /health."""
    try:
        get_qdrant().get_collections()
        return True
    except Exception as e:
        logger.error(f"Qdrant ping failed: {e}")
        return False


def ensure_collection(collection_name: str | None = None) -> None:
    """
    Create the products collection if it doesn't exist or has wrong vector size.
    Called during reindex — NOT at startup, so boot works without a seeded DB.
    """
    name = collection_name or settings.qdrant_collection
    client = get_qdrant()
    existing = {c.name for c in client.get_collections().collections}

    # If collection exists but has wrong vector size, delete and recreate
    if name in existing:
        info = client.get_collection(name)
        actual_size = info.config.params.vectors.size
        if actual_size != settings.embedding_dim:
            logger.warning(
                f"Collection '{name}' has size {actual_size}, expected "
                f"{settings.embedding_dim}. Recreating."
            )
            client.delete_collection(name)
            existing.discard(name)

    if name not in existing:
        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(
                size=settings.embedding_dim,   # 768 for text-embedding-004
                distance=Distance.COSINE,
            ),
        )
        # Payload indexes for fast metadata filtering
        for field, schema in [
            ("type",        "keyword"),
            ("category_id", "integer"),
            ("brand_id",    "integer"),
            ("product_id",  "integer"),
            ("sell_price",  "float"),
            ("in_stock",    "bool"),
        ]:
            client.create_payload_index(name, field, schema)
        logger.info(f"Qdrant collection '{name}' created with indexes.")
    else:
        logger.info(f"Qdrant collection '{name}' already exists.")
