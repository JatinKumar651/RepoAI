"""
Node 3: Content Downloader

Downloads the content of all whitelisted files via the GitHub
Contents API, with concurrency limiting.
"""

from __future__ import annotations

import asyncio
import base64
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


async def _download_file(
    client: httpx.AsyncClient,
    owner: str,
    repo: str,
    path: str,
    semaphore: asyncio.Semaphore,
) -> tuple[str, str | None, str | None]:
    """
    Download a single file from GitHub Contents API.
    Returns (path, content, error).
    """
    async with semaphore:
        try:
            resp = await client.get(
                f"{GITHUB_API}/repos/{owner}/{repo}/contents/{path}",
                headers=GITHUB_HEADERS,
            )

            if resp.status_code != 200:
                return path, None, f"HTTP {resp.status_code}"

            data = resp.json()

            # Handle file content (base64 encoded)
            if data.get("encoding") == "base64" and data.get("content"):
                content = base64.b64decode(data["content"]).decode(
                    "utf-8", errors="replace"
                )
                return path, content, None

            # If content is not base64, try direct content
            if data.get("content"):
                return path, data["content"], None

            return path, None, "No content in response"

        except Exception as e:
            logger.error(f"Failed to download {path}: {e}")
            return path, None, str(e)


async def content_downloader(state: AgentState) -> AgentState:
    """
    Download all whitelisted files concurrently, with a semaphore
    to limit parallel requests.
    """
    owner = state["owner"]
    repo = state["repo"]
    whitelisted_paths = state.get("whitelisted_paths", [])

    if not whitelisted_paths:
        logger.info("No whitelisted files to download")
        return {
            **state,
            "whitelisted_files": {},
            "download_errors": [],
        }

    semaphore = asyncio.Semaphore(settings.DOWNLOAD_CONCURRENCY)
    whitelisted_files: dict[str, str] = {}
    download_errors: list[str] = []

    async with httpx.AsyncClient(
        timeout=30.0, follow_redirects=True
    ) as client:
        tasks = [
            _download_file(client, owner, repo, path, semaphore)
            for path in whitelisted_paths
        ]
        results = await asyncio.gather(*tasks)

    for path, content, error in results:
        if content is not None:
            whitelisted_files[path] = content
            logger.info(f"Downloaded: {path} ({len(content)} chars)")
        else:
            download_errors.append(f"{path}: {error}")
            logger.warning(f"Failed to download {path}: {error}")

    logger.info(
        f"Downloaded {len(whitelisted_files)}/{len(whitelisted_paths)} files"
    )

    return {
        **state,
        "whitelisted_files": whitelisted_files,
        "download_errors": download_errors,
    }
