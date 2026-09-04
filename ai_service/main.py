"""
NepStyle AI Service — Phase 2: RAG pipeline + vector indexing.

Architecture:
  React Frontend  →  POST /ai/*  →  This FastAPI service
                                         │
                              ┌──────────┼──────────┐
                              │          │          │
                           MariaDB    Qdrant    Gemini API
                         (read-only) (vectors)   (LLM + embed)
"""
import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from middleware.auth import APIKeyMiddleware
from routers import (
    health,
    chat,
    search,
    recommendations,
    reviews,
    signals,
    compare,
    product_qa,
    order_assistant,
    support,
    agent,
    stylist,
    insights,
    size_advisor,
    deals,
    brand_intel,
    collections,
    style_quiz,
    admin,
)

# ── Logging ────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ai_service")


# ── Lifespan ───────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("═══ NepStyle AI Service starting (Phase 16) ═══")
    logger.info(f"  LLM model  : {settings.gemini_model}")
    logger.info(f"  Embed model: {settings.gemini_embedding_model}")
    logger.info(f"  Vector dims: {settings.embedding_dim}")
    logger.info(f"  Qdrant     : {settings.qdrant_url}")
    logger.info(f"  Auth guard : {'enabled' if settings.ai_api_key else 'DISABLED (dev mode)'}")
    yield
    logger.info("═══ NepStyle AI Service stopped ═══")


# ── App ────────────────────────────────────────────────────────────
app = FastAPI(
    title="NepStyle AI Service",
    description=(
        "AI-powered shopping intelligence for NepStyle e-commerce.\n\n"
        "Provides: semantic search, recommendations, review summaries, "
        "shopping assistant, order assistant, and customer support."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ── Middleware stack ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to Vercel domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(APIKeyMiddleware)


# ── Request logging middleware ─────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    t0 = time.perf_counter()
    response = await call_next(request)
    ms = round((time.perf_counter() - t0) * 1000, 1)
    logger.info(
        f"[{request_id}] {request.method} {request.url.path} "
        f"→ {response.status_code} ({ms}ms)"
    )
    response.headers["X-Request-Id"] = request_id
    response.headers["X-Response-Time"] = f"{ms}ms"
    return response


# ── Global error handler ───────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc),
        },
    )


# ── Routers ────────────────────────────────────────────────────────
app.include_router(health.router)                                   # GET  /health
app.include_router(chat.router,             prefix="/ai")           # POST /ai/chat
app.include_router(search.router,           prefix="/ai")           # POST /ai/search
app.include_router(recommendations.router,  prefix="/ai")           # GET  /ai/products/:id/similar + /ai/personalized/:uid
app.include_router(reviews.router,          prefix="/ai")           # GET  /ai/products/:id/reviews/summary
app.include_router(signals.router,          prefix="/ai")           # GET  /ai/trending + /ai/recently-viewed/:uid
app.include_router(compare.router,          prefix="/ai")           # POST /ai/compare
app.include_router(product_qa.router,       prefix="/ai")           # POST /ai/product/:id/ask
app.include_router(order_assistant.router,  prefix="/ai")           # POST /ai/order-assistant
app.include_router(support.router,          prefix="/ai")           # POST /ai/support
app.include_router(agent.router,            prefix="/ai")           # POST /ai/agent (Phase 9)
app.include_router(stylist.router,          prefix="/ai")           # GET  /ai/products/:id/complete-look + POST /ai/cart-recommendations (Phase 10)
app.include_router(insights.router,         prefix="/ai")           # POST /ai/wishlist-insights + POST /ai/search-suggest (Phase 11)
app.include_router(size_advisor.router,     prefix="/ai")           # POST /ai/products/:id/size-advice (Phase 12)
app.include_router(deals.router,            prefix="/ai")           # GET  /ai/smart-deals (Phase 13)
app.include_router(brand_intel.router,      prefix="/ai")           # GET  /ai/brands/:id/profile + /ai/categories/:id/insights (Phase 14)
app.include_router(collections.router,      prefix="/ai")           # GET  /ai/collections (Phase 15)
app.include_router(style_quiz.router,       prefix="/ai")           # POST /ai/style-quiz (Phase 16)
app.include_router(admin.router,            prefix="/ai")           # POST /ai/admin/*


# ── Root ───────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
def root():
    return {
        "service": "NepStyle AI Service",
        "version": "1.0.0",
        "status": "running",
        "phase": 4,
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "chat":             "POST /ai/chat           (Phase 4)",
            "search":           "POST /ai/search         (Phase 3)",
            "similar":          "GET  /ai/products/:id/similar (Phase 5)",
            "personalized":     "GET  /ai/personalized/:uid   (Phase 5)",
            "review_summary":   "GET  /ai/products/:id/reviews/summary (Phase 6)",
            "compare":          "POST /ai/compare        (Phase 4)",
            "product_qa":       "POST /ai/product/:id/ask (Phase 4)",
            "order_assistant":  "POST /ai/order-assistant (Phase 8)",
            "support":          "POST /ai/support        (Phase 8)",
        },
    }
