"""
LangGraph shared state schema.

This TypedDict flows through every node in the pipeline.
Each node reads what it needs and writes its outputs back
into the state dict.
"""

from __future__ import annotations

from typing import TypedDict, Optional


class AgentState(TypedDict, total=False):
    """Shared state flowing through the LangGraph pipeline."""

    # ── Input ───────────────────────────────────────────────
    owner: str
    repo: str
    repo_url: str

    # ── Tree Fetcher output ─────────────────────────────────
    default_branch: str
    raw_tree: list[dict]           # full tree from Git Trees API
    truncated: bool                # whether GitHub truncated the tree

    # ── Tree Filter output ──────────────────────────────────
    filtered_tree: list[str]       # display-ready tree paths
    whitelisted_paths: list[str]   # paths of files to download
    file_count: int
    dir_count: int

    # ── Content Downloader output ───────────────────────────
    whitelisted_files: dict[str, str]  # {path: decoded_content}
    download_errors: list[str]

    # ── Token Analyzer output ───────────────────────────────
    analyzed_files: dict[str, str]     # {path: possibly-truncated content}
    token_metrics: dict                # per_file counts, total, truncated list
    extracted_info: dict[str, dict]    # parsed info from each file

    # ── Repo Card Builder output ────────────────────────────
    repo_card: dict                    # structured summary

    # ── Prompt Generator output ─────────────────────────────
    generated_prompt: str              # final Cursor/Antigravity prompt

    # ── Error handling ──────────────────────────────────────
    error: Optional[str]
