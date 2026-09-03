from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Database ────────────────────────────────────────────────
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = "password"
    db_name: str = "nepstyle"

    # ── Qdrant ──────────────────────────────────────────────────
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""
    qdrant_collection: str = "nepstyle_products"

    # ── Gemini ──────────────────────────────────────────────────
    gemini_api_key: str
    gemini_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    # gemini-embedding-001 produces 3072-dimensional vectors
    embedding_dim: int = 3072

    # ── AI Service auth ─────────────────────────────────────────
    ai_api_key: str = ""

    # ── Dart backend ────────────────────────────────────────────
    dart_backend_url: str = "http://localhost:8080"

    # ── Generation defaults ─────────────────────────────────────
    llm_temperature: float = 0.4
    llm_max_tokens: int = 2048

    # ── Cache TTLs (seconds) ────────────────────────────────────
    review_summary_ttl: int = 3600       # 1 hour
    recommendation_ttl: int = 600        # 10 minutes
    embedding_cache_ttl: int = 86400     # 24 hours


settings = Settings()
