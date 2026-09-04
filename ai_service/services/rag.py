"""
RAG retrieval pipeline.

Retrieval functions used by all AI features:
  - search_products()       → semantic product search with metadata filters
  - get_similar_products()  → find products similar to a given product
  - get_product_reviews()   → retrieve reviews for a specific product
  - search_policies()       → retrieve store policy documents
  - hybrid_product_search() → fuse vector + SQL FULLTEXT results

Context formatters:
  - format_products_context()  → LLM-ready product context string
  - format_reviews_context()   → LLM-ready reviews context string
"""
import logging

from qdrant_client.models import Filter, FieldCondition, MatchValue, Range, RecommendQuery, RecommendInput

from config import settings
from qdrant_setup import get_qdrant
from services.embeddings import embed_text
from services.indexer import product_vid
import db

logger = logging.getLogger(__name__)


# ── Core search ───────────────────────────────────────────────────

def search_products(
    query: str,
    filters: dict | None = None,
    top_k: int = 10,
    score_threshold: float = 0.30,
) -> list[dict]:
    """
    Semantic product search with optional metadata filters.

    filters keys (all optional):
      category_id  : int
      brand_id     : int
      max_price    : float
      min_price    : float
      in_stock     : bool
    """
    query_vector = embed_text(query, task_type="RETRIEVAL_QUERY")

    must = [FieldCondition(key="type", match=MatchValue(value="product"))]

    if filters:
        if cid := filters.get("category_id"):
            must.append(FieldCondition(key="category_id", match=MatchValue(value=int(cid))))
        if bid := filters.get("brand_id"):
            must.append(FieldCondition(key="brand_id", match=MatchValue(value=int(bid))))
        if filters.get("in_stock"):
            must.append(FieldCondition(key="in_stock", match=MatchValue(value=True)))

        price_range: dict = {}
        if max_p := filters.get("max_price"):
            price_range["lte"] = float(max_p)
        if min_p := filters.get("min_price"):
            price_range["gte"] = float(min_p)
        if price_range:
            must.append(FieldCondition(key="sell_price", range=Range(**price_range)))

    results = get_qdrant().search(
        collection_name=settings.qdrant_collection,
        query_vector=query_vector,
        query_filter=Filter(must=must),
        limit=top_k,
        score_threshold=score_threshold,
        with_payload=True,
    )

    return [{"product": r.payload, "score": round(r.score, 3)} for r in results]


def get_similar_products(product_id: int, top_k: int = 6) -> list[dict]:
    """
    Find products similar to a given product using its stored vector.
    Excludes the product itself.
    """
    vid = product_vid(product_id)
    result = get_qdrant().query_points(
        collection_name=settings.qdrant_collection,
        query=RecommendQuery(recommend=RecommendInput(positive=[vid], negative=[])),
        query_filter=Filter(
            must=[FieldCondition(key="type", match=MatchValue(value="product"))],
            must_not=[FieldCondition(key="product_id", match=MatchValue(value=product_id))],
        ),
        limit=top_k,
        with_payload=True,
    )
    return [{"product": r.payload, "score": round(r.score, 3)} for r in result.points]


def get_product_reviews(product_id: int, top_k: int = 20) -> list[dict]:
    """
    Retrieve all review vectors for a specific product.
    Used for review summary generation.
    """
    results = get_qdrant().scroll(
        collection_name=settings.qdrant_collection,
        scroll_filter=Filter(
            must=[
                FieldCondition(key="type",       match=MatchValue(value="review")),
                FieldCondition(key="product_id", match=MatchValue(value=product_id)),
            ]
        ),
        limit=top_k,
        with_payload=True,
        with_vectors=False,
    )
    return [{"review": point.payload} for point in results[0]]


def search_reviews_for_query(
    query: str,
    product_id: int | None = None,
    top_k: int = 10,
    score_threshold: float = 0.30,
) -> list[dict]:
    """
    Semantic search within reviews.
    Optionally scoped to a specific product.
    """
    query_vector = embed_text(query, task_type="RETRIEVAL_QUERY")
    must = [FieldCondition(key="type", match=MatchValue(value="review"))]
    if product_id is not None:
        must.append(FieldCondition(key="product_id", match=MatchValue(value=product_id)))

    results = get_qdrant().search(
        collection_name=settings.qdrant_collection,
        query_vector=query_vector,
        query_filter=Filter(must=must),
        limit=top_k,
        score_threshold=score_threshold,
        with_payload=True,
    )
    return [{"review": r.payload, "score": round(r.score, 3)} for r in results]


def search_policies(query: str, top_k: int = 3, score_threshold: float = 0.25) -> list[dict]:
    """Retrieve store policy documents relevant to the query."""
    query_vector = embed_text(query, task_type="RETRIEVAL_QUERY")
    results = get_qdrant().search(
        collection_name=settings.qdrant_collection,
        query_vector=query_vector,
        query_filter=Filter(
            must=[FieldCondition(key="type", match=MatchValue(value="policy"))]
        ),
        limit=top_k,
        score_threshold=score_threshold,
        with_payload=True,
    )
    return [{"payload": r.payload, "score": round(r.score, 3)} for r in results]


# ── Hybrid search (vector + SQL FULLTEXT fusion) ──────────────────

def hybrid_product_search(
    query: str,
    filters: dict | None = None,
    top_k: int = 12,
) -> list[dict]:
    """
    Fuse semantic (Qdrant) and keyword (MariaDB FULLTEXT) results.
    Returns deduplicated, ranked products.

    Strategy: Reciprocal Rank Fusion (RRF) with k=60.
    """
    # 1. Vector search results (graceful fallback if Qdrant/embed unavailable)
    try:
        vector_results = search_products(query, filters, top_k=top_k, score_threshold=0.20)
    except Exception as e:
        logger.warning(f"Vector search failed, using SQL-only: {e}")
        vector_results = []

    # 2. SQL FULLTEXT results
    sql_results = _sql_fulltext_search(query, filters, limit=top_k)

    # 3. Reciprocal Rank Fusion
    scores: dict[int, float] = {}
    products_map: dict[int, dict] = {}

    k = 60  # RRF constant
    for rank, item in enumerate(vector_results):
        pid = item["product"]["product_id"]
        scores[pid] = scores.get(pid, 0) + 1.0 / (k + rank + 1)
        products_map[pid] = item["product"]

    for rank, item in enumerate(sql_results):
        pid = item["product_id"]
        scores[pid] = scores.get(pid, 0) + 1.0 / (k + rank + 1)
        if pid not in products_map:
            products_map[pid] = item

    # 4. Sort by fused score
    sorted_pids = sorted(scores, key=lambda pid: scores[pid], reverse=True)

    return [
        {"product": products_map[pid], "score": round(scores[pid], 4)}
        for pid in sorted_pids[:top_k]
    ]


def _sql_fulltext_search(query: str, filters: dict | None, limit: int) -> list[dict]:
    """MariaDB FULLTEXT search — keyword fallback for hybrid retrieval."""
    try:
        where = ["MATCH(product_name, product_description) AGAINST(%s IN NATURAL LANGUAGE MODE)"]
        params: list = [query]

        if filters:
            if cid := filters.get("category_id"):
                where.append("category_id = %s")
                params.append(int(cid))
            if bid := filters.get("brand_id"):
                where.append("brand_id = %s")
                params.append(int(bid))
            if max_p := filters.get("max_price"):
                where.append("sell_price <= %s")
                params.append(float(max_p))
            if min_p := filters.get("min_price"):
                where.append("sell_price >= %s")
                params.append(float(min_p))
            if filters.get("in_stock"):
                where.append("total_product_count > 0")

        sql = f"SELECT * FROM products WHERE {' AND '.join(where)} LIMIT %s"
        params.append(limit)
        rows = db.query_all(sql, tuple(params))
        return [dict(r) for r in rows]
    except Exception as e:
        logger.warning(f"FULLTEXT search failed (skipping): {e}")
        return []


# ── Context formatters for LLM ────────────────────────────────────

def format_products_context(results: list[dict], include_score: bool = False) -> str:
    """Format retrieved products into a readable context block for the LLM."""
    if not results:
        return "No matching products found."

    lines = []
    for i, item in enumerate(results, 1):
        p = item.get("product", item)  # handle both {product: ...} and flat dict
        score_str = f" (relevance: {item.get('score', 0):.2f})" if include_score else ""
        in_stock = "In Stock" if p.get("in_stock", p.get("total_product_count", 0) > 0) else "Out of Stock"
        lines.append(
            f"[{i}] {p.get('product_name', 'Unknown')}{score_str}\n"
            f"    Brand: {p.get('brand_name', 'N/A')} | Category: {p.get('category_name', 'N/A')}\n"
            f"    Price: Rs.{p.get('sell_price', 0):,.0f}"
            + (f" (was Rs.{p.get('normal_price', 0):,.0f})" if float(p.get('normal_price', 0)) > float(p.get('sell_price', 0)) else "")
            + f"\n    Status: {in_stock}\n"
            f"    Description: {str(p.get('product_description', '') or 'N/A')[:200]}"
        )
    return "\n\n".join(lines)


def format_reviews_context(results: list[dict]) -> str:
    """Format retrieved reviews into a readable context block for the LLM."""
    if not results:
        return "No reviews available for this product."

    lines = []
    for item in results:
        r = item.get("review", item)
        lines.append(
            f"- {r.get('user_name', 'Customer')} rated {r.get('rating', 0)}/5: "
            f"{r.get('comment', '')}"
        )
    return "\n".join(lines)
