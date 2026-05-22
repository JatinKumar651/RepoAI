"""
Node 1: Tree Fetcher

Resolves the default branch and fetches the FULL repository tree
in a single request via the Git Trees API (?recursive=1).
"""

from __future__ import annotations

import logging

import httpx
from agents.state import AgentState
from config import settings

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"
GITHUB_HEADERS = {
    "Authorization": f"Bearer {settings.GITHUB_ACCESS_TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}


async def tree_fetcher(state: AgentState) -> AgentState:
    """
    Resolve the default branch, then fetch the entire repo tree
    in one request using `GET /repos/{owner}/{repo}/git/trees/{branch}?recursive=1`.
    """
    owner = state["owner"]
    repo = state["repo"]

    async with httpx.AsyncClient(
        timeout=30.0, follow_redirects=True
    ) as client:
        # ── Step 1: Resolve default branch ──────────────────
        repo_resp = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}",
            headers=GITHUB_HEADERS,
        )

        if repo_resp.status_code == 404:
            return {**state, "error": f"Repository {owner}/{repo} not found"}
        if repo_resp.status_code == 401:
            return {**state, "error": "GitHub token is invalid or expired"}

        repo_resp.raise_for_status()
        repo_data = repo_resp.json()
        default_branch = repo_data.get("default_branch", "main")

        logger.info(f"Resolved default branch: {default_branch}")

        # ── Step 2: Fetch full tree recursively ─────────────
        tree_resp = await client.get(
            f"{GITHUB_API}/repos/{owner}/{repo}/git/trees/{default_branch}",
            params={"recursive": "1"},
            headers=GITHUB_HEADERS,
        )

        if tree_resp.status_code != 200:
            return {
                **state,
                "error": f"Failed to fetch tree: HTTP {tree_resp.status_code}",
            }

        tree_data = tree_resp.json()
        raw_tree = tree_data.get("tree", [])
        truncated = tree_data.get("truncated", False)

        logger.info(
            f"Fetched tree: {len(raw_tree)} items, truncated={truncated}"
        )

        return {
            **state,
            "default_branch": default_branch,
            "raw_tree": raw_tree,
            "truncated": truncated,
        }
