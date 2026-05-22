"""
Node 2: Tree Filter

Filters the raw tree in-memory:
  1. Excludes paths containing any IGNORED_DIRS segment.
  2. For directories deeper than MAX_TREE_DEPTH, only shows structure (no file contents).
  3. Identifies whitelisted config files for download.
"""

from __future__ import annotations

import logging

from agents.state import AgentState
from config import settings

logger = logging.getLogger(__name__)

# ── Directories to always skip ──────────────────────────────

IGNORED_DIRS: set[str] = {
    "node_modules", ".git", "dist", "build", "venv",
    ".expo", "__pycache__", ".next", ".nuxt", ".cache",
    ".vscode", ".idea", "coverage", ".tox", "egg-info",
}

# ── Config files worth downloading ──────────────────────────

WHITELISTED_FILES: set[str] = {
    "package.json",
    "requirements.txt",
    "README.md",
    "tsconfig.json",
    "pyproject.toml",
    "setup.py",
    "setup.cfg",
    "Makefile",
    "Dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
    ".env.example",
    "Cargo.toml",
    "go.mod",
    "pom.xml",
    "build.gradle",
    "Gemfile",
    "composer.json",
    "angular.json",
    "next.config.js",
    "next.config.mjs",
    "vite.config.ts",
    "vite.config.js",
    "webpack.config.js",
    "tailwind.config.js",
    "tailwind.config.ts",
    ".eslintrc.json",
    ".prettierrc",
}


def _is_ignored(path: str) -> bool:
    """Return True if any segment of the path is in IGNORED_DIRS."""
    parts = path.split("/")
    return any(part in IGNORED_DIRS for part in parts)


def _depth(path: str) -> int:
    """Return the depth of a path (number of '/' separators)."""
    return path.count("/")


async def tree_filter(state: AgentState) -> AgentState:
    """
    Filter the raw tree:
      - Remove items under ignored directories
      - Keep structure for items deeper than MAX_TREE_DEPTH but
        don't mark them for content download
      - Identify whitelisted files for download
    """
    raw_tree = state.get("raw_tree", [])
    max_depth = settings.MAX_TREE_DEPTH

    filtered_paths: list[str] = []
    whitelisted_paths: list[str] = []
    file_count = 0
    dir_count = 0

    for item in raw_tree:
        path: str = item.get("path", "")
        item_type: str = item.get("type", "")  # "blob" or "tree"

        # Skip ignored directories and all their contents
        if _is_ignored(path):
            continue

        depth = _depth(path)

        if item_type == "tree":
            # Always include directory in the structure
            filtered_paths.append(f"📁 {path}/")
            dir_count += 1
        elif item_type == "blob":
            file_count += 1

            # Always include in the visual tree
            if depth > max_depth:
                # Show the file in the tree but with a depth indicator
                filtered_paths.append(f"   {'  ' * depth}📄 {path}")
            else:
                filtered_paths.append(f"📄 {path}")

            # Check if it's a whitelisted file to download
            filename = path.split("/")[-1]
            if filename in WHITELISTED_FILES:
                whitelisted_paths.append(path)

    logger.info(
        f"Filtered tree: {file_count} files, {dir_count} dirs, "
        f"{len(whitelisted_paths)} whitelisted files to download"
    )

    return {
        **state,
        "filtered_tree": filtered_paths,
        "whitelisted_paths": whitelisted_paths,
        "file_count": file_count,
        "dir_count": dir_count,
    }
