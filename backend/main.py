"""
FastAPI application entry point.

Registers auth and analysis routers, configures CORS, logging,
and a root health-check endpoint.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth.router import router as auth_router
from routes.analyze import router as analyze_router
from routes.history import router as history_router

# ── Logging setup ───────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(name)s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── FastAPI app ─────────────────────────────────────────────
app = FastAPI(
    title="GitHub Repo Analyzer",
    description=(
        "Analyze any GitHub repository and generate a "
        "Cursor/Antigravity-ready prompt to rebuild it."
    ),
    version="1.0.0",
)

import os

# ── CORS ────────────────────────────────────────────────────
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    frontend_url,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount routers ───────────────────────────────────────────
app.include_router(auth_router)
app.include_router(analyze_router)
app.include_router(history_router)


# ── Health check ────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def health_check():
    """Root health check endpoint."""
    return {
        "status": "healthy",
        "service": "GitHub Repo Analyzer",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/auth/google",
            "analyze": "/api/analyze-repo",
            "docs": "/docs",
        },
    }
