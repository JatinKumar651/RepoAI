"""
Pydantic models for request / response validation.
"""

from __future__ import annotations

import re
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ── Request ─────────────────────────────────────────────────

class RepoAnalysisRequest(BaseModel):
    """Incoming request — accepts a GitHub repo URL."""

    repo_url: str = Field(
        ...,
        description="Full GitHub repository URL",
        examples=["https://github.com/tiangolo/fastapi"],
    )

    @field_validator("repo_url")
    @classmethod
    def validate_github_url(cls, v: str) -> str:
        pattern = r"^https?://github\.com/[\w\-\.]+/[\w\-\.]+/?$"
        if not re.match(pattern, v.strip()):
            raise ValueError(
                "Must be a valid GitHub URL like https://github.com/owner/repo"
            )
        return v.strip().rstrip("/")


# ── Response sub-models ─────────────────────────────────────

class TokenMetrics(BaseModel):
    """Per-file and aggregate token metrics."""

    per_file: dict[str, int] = Field(default_factory=dict)
    total_tokens: int = 0
    truncated_files: list[str] = Field(default_factory=list)


class RepoCard(BaseModel):
    """Structured summary card for the repository."""

    owner: str
    repo: str
    repo_url: str
    default_branch: str = "main"
    project_type: str = "unknown"
    frameworks: list[str] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    dependencies: dict[str, list[str]] = Field(default_factory=dict)
    build_tools: list[str] = Field(default_factory=list)
    directory_summary: str = ""
    file_count: int = 0
    total_dirs: int = 0


class RepoAnalysisResponse(BaseModel):
    """Full response from the analyze-repo endpoint."""

    repo_card: RepoCard
    directory_tree: list[str] = Field(default_factory=list)
    whitelisted_files: dict[str, str] = Field(default_factory=dict)
    token_metrics: TokenMetrics = Field(default_factory=TokenMetrics)
    generated_prompt: str = ""


# ── Auth models ─────────────────────────────────────────────

class OAuthURLResponse(BaseModel):
    """Response containing the Google OAuth redirect URL."""

    url: str


class AuthCallbackRequest(BaseModel):
    """Request body for the auth callback — receives access_token + refresh_token."""

    access_token: str
    refresh_token: str


class EmailSignupRequest(BaseModel):
    """Request body for email/password signup."""
    
    email: str
    password: str
    full_name: str


class EmailLoginRequest(BaseModel):
    """Request body for email/password login."""
    
    email: str
    password: str


class AuthSessionResponse(BaseModel):
    """Response containing tokens and user data upon successful login/signup."""
    
    access_token: str
    refresh_token: str
    user: "UserResponse"


class UserResponse(BaseModel):
    """Authenticated user info."""

    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    provider: Optional[str] = None


# ── History models ───────────────────────────────────────────

class HistorySaveRequest(BaseModel):
    """Payload the frontend sends to save a completed analysis."""

    repo_url: str
    repo_card: dict = Field(default_factory=dict)
    directory_tree: list[str] = Field(default_factory=list)
    token_metrics: dict = Field(default_factory=dict)
    generated_prompt: str = ""


class HistoryEntry(BaseModel):
    """A single row from the analysis_history Supabase table."""

    id: str
    user_id: str
    repo_url: str
    repo_owner: str = ""
    repo_name: str = ""
    repo_card: dict = Field(default_factory=dict)
    directory_tree: list[str] = Field(default_factory=list)
    token_metrics: dict = Field(default_factory=dict)
    generated_prompt: str = ""
    created_at: Optional[str] = None


class HistoryListResponse(BaseModel):
    """Paginated list of history entries."""

    entries: list[HistoryEntry] = Field(default_factory=list)
    total: int = 0
