"""
Application configuration loaded from environment variables.
Uses pydantic-settings for typed, validated config with .env support.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Typed application settings — auto-loaded from .env."""

    # ── GitHub ──────────────────────────────────────────────
    GITHUB_ACCESS_TOKEN: str

    # ── Supabase ────────────────────────────────────────────
    SUPABASE_PROJECT_URL: str
    ANON_PUBLIC_KEY: str
    SERVICE_ROLE_KEY: str

    # ── LLM (Groq) ─────────────────────────────────────────
    GROQ_API_KEY: str

    # ── Pipeline tunables ───────────────────────────────────
    MAX_TREE_DEPTH: int = 2
    MAX_TOKENS_PER_FILE: int = 2000
    MAX_TOTAL_TOKENS: int = 5000
    MAX_FILE_LINES: int = 300
    DOWNLOAD_CONCURRENCY: int = 5

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
