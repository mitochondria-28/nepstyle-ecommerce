"""
Lightweight API-key guard for the AI service.

The React frontend sends the key as:
  X-AI-Key: <AI_API_KEY>

Public endpoints (/health, /docs) bypass this check.
Set AI_API_KEY="" in config to disable auth entirely (dev mode).
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from config import settings

UNGUARDED = {"/health", "/docs", "/openapi.json", "/redoc"}


class APIKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in UNGUARDED or not settings.ai_api_key:
            return await call_next(request)

        key = request.headers.get("X-AI-Key", "")
        if key != settings.ai_api_key:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"success": False, "error": "Invalid or missing API key"},
            )
        return await call_next(request)
