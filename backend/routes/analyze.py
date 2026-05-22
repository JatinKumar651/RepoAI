"""
API router — Repository Analysis Pipeline.

POST /api/analyze-repo
  Accepts a GitHub repo URL, runs the full LangGraph analysis pipeline,
  and returns the repo card + generated Cursor/Antigravity prompt.
"""

from __future__ import annotations

import logging
import re

from fastapi import APIRouter, Depends, HTTPException, status
from agents.graph import analysis_graph
from auth.dependencies import get_current_user
from models.schemas import RepoAnalysisRequest, RepoAnalysisResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Repository Analysis"])


def _parse_github_url(url: str) -> tuple[str, str]:
    """Extract owner and repo from a GitHub URL."""
    match = re.match(
        r"https?://github\.com/([\w\-\.]+)/([\w\-\.]+)/?$", url
    )
    if not match:
        raise ValueError(f"Invalid GitHub URL: {url}")
    return match.group(1), match.group(2)


@router.post("/analyze-repo", response_model=RepoAnalysisResponse)
async def analyze_repo(
    body: RepoAnalysisRequest,
    user: dict = Depends(get_current_user),
):
    """
    Run the full repo analysis pipeline.

    1. Fetch the repo tree via GitHub Git Trees API
    2. Filter directories and identify whitelisted files
    3. Download whitelisted file contents
    4. Analyze token counts and extract info
    5. Build a repo summary card
    6. Generate a Cursor/Antigravity-ready rebuild prompt via LLM

    Requires authentication (Supabase JWT in Authorization header).
    """
    try:
        owner, repo = _parse_github_url(body.repo_url)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    logger.info(
        f"User {user.get('email', 'unknown')} analyzing repo: "
        f"{owner}/{repo}"
    )

    # ── Build initial state ─────────────────────────────────
    initial_state = {
        "owner": owner,
        "repo": repo,
        "repo_url": body.repo_url,
    }

    # ── Run the LangGraph pipeline ──────────────────────────
    try:
        result = await analysis_graph.ainvoke(initial_state)
    except Exception as e:
        logger.error(f"Pipeline execution failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Pipeline execution failed: {str(e)}",
        )

    # ── Check for pipeline errors ───────────────────────────
    if result.get("error"):
        error_msg = result["error"]
        if "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg,
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=error_msg,
        )

    # ── Build response ──────────────────────────────────────
    return RepoAnalysisResponse(
        repo_card=result.get("repo_card", {}),
        directory_tree=result.get("filtered_tree", []),
        whitelisted_files=result.get("analyzed_files", {}),
        token_metrics=result.get("token_metrics", {}),
        generated_prompt=result.get("generated_prompt", ""),
    )
