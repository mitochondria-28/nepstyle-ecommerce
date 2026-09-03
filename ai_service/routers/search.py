"""
POST /ai/search — Hybrid semantic + keyword search (Phase 3).

Uses RRF fusion of Qdrant vector search and MariaDB FULLTEXT.
Supports metadata filters, pagination, and natural-language queries.
"""
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.rag import hybrid_product_search

logger = logging.getLogger(__name__)
router = APIRouter()


class SearchFilters(BaseModel):
    category_id: Optional[int] = None
    brand_id:    Optional[int] = None
    min_price:   Optional[float] = None
    max_price:   Optional[float] = None
    in_stock:    Optional[bool] = None


class SearchRequest(BaseModel):
    query:     str           = Field(..., min_length=1, max_length=500)
    page:      int           = Field(1,  ge=1)
    page_size: int           = Field(20, ge=1, le=50)
    filters:   SearchFilters = SearchFilters()


@router.post("/search")
def search(body: SearchRequest):
    try:
        filters_dict = {
            k: v for k, v in body.filters.model_dump().items() if v is not None
        }

        # Fetch enough for pagination (vector search doesn't do DB-style OFFSET)
        fetch_k = min(body.page * body.page_size + body.page_size, 50)
        all_results = hybrid_product_search(
            query=body.query,
            filters=filters_dict or None,
            top_k=fetch_k,
        )

        total = len(all_results)
        start = (body.page - 1) * body.page_size
        page_results = all_results[start : start + body.page_size]

        return {
            "success":     True,
            "query":       body.query,
            "total":       total,
            "page":        body.page,
            "page_size":   body.page_size,
            "total_pages": max(1, -(-total // body.page_size)),
            "search_type": "hybrid",
            "results":     page_results,
        }

    except Exception as e:
        logger.exception(f"AI search failed for query '{body.query}': {e}")
        raise HTTPException(status_code=500, detail=str(e))
