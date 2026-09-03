"""
Google Gemini text-embedding-004 wrapper using the current google-genai SDK.

Produces 768-dimensional float vectors.
Task types matter for retrieval quality:
  - "RETRIEVAL_DOCUMENT" → use when indexing content into Qdrant
  - "RETRIEVAL_QUERY"    → use when embedding a user search query
  - "SEMANTIC_SIMILARITY"→ use for comparing two texts directly

Results are cached in memory (LRU TTL cache) to avoid redundant API calls.
"""
import hashlib
import logging
from typing import Literal

from google import genai
from google.genai import types
from cachetools import TTLCache
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from config import settings

logger = logging.getLogger(__name__)

TaskType = Literal[
    "RETRIEVAL_DOCUMENT",
    "RETRIEVAL_QUERY",
    "SEMANTIC_SIMILARITY",
    "CLASSIFICATION",
    "CLUSTERING",
    "QUESTION_ANSWERING",
    "FACT_VERIFICATION",
]

# In-memory cache: up to 2048 embeddings, TTL from config (default 24h)
_cache: TTLCache = TTLCache(maxsize=2048, ttl=settings.embedding_cache_ttl)

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


def _cache_key(text: str, task_type: str) -> str:
    return hashlib.md5(f"{task_type}::{text}".encode()).hexdigest()


@retry(
    retry=retry_if_exception_type(Exception),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    reraise=True,
)
def embed_text(
    text: str,
    task_type: TaskType = "RETRIEVAL_DOCUMENT",
) -> list[float]:
    """Embed a single text string. Returns 768-dim float list."""
    key = _cache_key(text, task_type)
    if key in _cache:
        return _cache[key]

    client = _get_client()
    result = client.models.embed_content(
        model=settings.gemini_embedding_model,
        contents=text,
        config=types.EmbedContentConfig(task_type=task_type),
    )
    vector = result.embeddings[0].values
    _cache[key] = vector
    return vector


def embed_texts(
    texts: list[str],
    task_type: TaskType = "RETRIEVAL_DOCUMENT",
) -> list[list[float]]:
    """
    Embed a batch of texts. Returns list of 768-dim vectors.
    Checks cache per-item; calls API only for cache misses.
    """
    return [embed_text(t, task_type) for t in texts]


def build_product_text(product: dict) -> str:
    """
    Combine product fields into a single embeddable string.
    Structured so the embedding captures all relevant semantics.
    """
    parts = [
        f"Product: {product.get('product_name', '')}",
        f"Category: {product.get('category_name', '')}",
        f"Brand: {product.get('brand_name', '')}",
        f"Description: {product.get('product_description', '')}",
        f"Price: Rs.{product.get('sell_price', '')}",
    ]
    return " | ".join(p for p in parts if p.split(": ", 1)[1])
