"""
GET /health — checks DB, Qdrant, and Gemini configuration.
Railway uses this path as its healthcheck.
"""
import time
import logging
from fastapi import APIRouter
from pydantic import BaseModel

import db
import qdrant_setup
from config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class HealthStatus(BaseModel):
    status: str          # "ok" | "degraded" | "error"
    version: str
    phase: int
    checks: dict
    collection: dict | None
    latency_ms: float


@router.get("/health", response_model=HealthStatus, tags=["Health"])
def health():
    t0 = time.perf_counter()
    checks: dict = {}
    collection_info: dict | None = None

    # 1. Database
    checks["database"] = "ok" if db.ping() else "error"

    # 2. Qdrant reachability
    qdrant_ok = qdrant_setup.ping()
    checks["qdrant"] = "ok" if qdrant_ok else "error"

    # 3. Qdrant collection stats (if reachable)
    if qdrant_ok:
        try:
            info = qdrant_setup.get_qdrant().get_collection(settings.qdrant_collection)
            collection_info = {
                "name": settings.qdrant_collection,
                "vectors": info.points_count,
                "status": str(info.status),
            }
            checks["qdrant_collection"] = "ok" if info.points_count > 0 else "empty"
        except Exception:
            checks["qdrant_collection"] = "not_found"

    # 4. Gemini — verify key is configured
    checks["gemini"] = "ok" if settings.gemini_api_key else "not_configured"

    overall = (
        "ok" if all(v in ("ok",) for k, v in checks.items() if k != "qdrant_collection")
        else "degraded" if "ok" in checks.values()
        else "error"
    )

    return HealthStatus(
        status=overall,
        version="1.0.0",
        phase=4,
        checks=checks,
        collection=collection_info,
        latency_ms=round((time.perf_counter() - t0) * 1000, 2),
    )
