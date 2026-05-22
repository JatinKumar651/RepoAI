"""
Node 4: Token Analyzer

Uses tiktoken (cl100k_base) to:
  1. Count tokens for each downloaded file.
  2. Truncate files that exceed MAX_TOKENS_PER_FILE.
  3. Extract key information (dependencies, scripts, config) from file contents.
  4. Build aggregate token metrics.
"""

from __future__ import annotations

import json
import logging

import tiktoken
from agents.state import AgentState
from config import settings

logger = logging.getLogger(__name__)

# Load the tokenizer once at module level
_enc = tiktoken.get_encoding("cl100k_base")


def _count_tokens(text: str) -> int:
    """Count tokens using cl100k_base encoding."""
    return len(_enc.encode(text, disallowed_special=()))


def _truncate_to_tokens(text: str, max_tokens: int) -> str:
    """Truncate text to fit within max_tokens."""
    tokens = _enc.encode(text, disallowed_special=())
    if len(tokens) <= max_tokens:
        return text
    truncated_tokens = tokens[:max_tokens]
    return _enc.decode(truncated_tokens) + "\n\n... [TRUNCATED] ..."


def _extract_info_from_file(path: str, content: str) -> dict:
    """
    Parse a whitelisted file and extract structured information.
    Returns a dict of extracted data.
    """
    filename = path.split("/")[-1]
    info: dict = {"file": path, "type": filename}

    try:
        if filename == "package.json":
            data = json.loads(content)
            info["name"] = data.get("name", "")
            info["version"] = data.get("version", "")
            info["description"] = data.get("description", "")
            info["scripts"] = data.get("scripts", {})
            info["dependencies"] = list(data.get("dependencies", {}).keys())
            info["devDependencies"] = list(
                data.get("devDependencies", {}).keys()
            )
            info["engines"] = data.get("engines", {})

        elif filename == "requirements.txt":
            deps = []
            for line in content.splitlines():
                line = line.strip()
                if line and not line.startswith("#") and not line.startswith("-"):
                    # Extract package name (before any version specifier)
                    pkg = line.split("==")[0].split(">=")[0].split("<=")[0]
                    pkg = pkg.split("[")[0].strip()
                    if pkg:
                        deps.append(pkg)
            info["dependencies"] = deps

        elif filename == "pyproject.toml":
            # Basic extraction — look for key sections
            info["raw_content"] = content[:2000]

        elif filename in ("Dockerfile", "docker-compose.yml", "docker-compose.yaml"):
            info["raw_content"] = content[:2000]

        elif filename == "README.md":
            # Extract first 3000 chars of README for context
            info["content_preview"] = content[:3000]

        elif filename in ("tsconfig.json", "angular.json"):
            try:
                data = json.loads(content)
                info["compiler_options"] = data.get("compilerOptions", {})
            except json.JSONDecodeError:
                info["raw_content"] = content[:1000]

        elif filename in (
            "next.config.js", "next.config.mjs",
            "vite.config.ts", "vite.config.js",
            "webpack.config.js",
            "tailwind.config.js", "tailwind.config.ts",
        ):
            info["raw_content"] = content[:2000]

        elif filename in (".eslintrc.json", ".prettierrc"):
            try:
                data = json.loads(content)
                info["config"] = data
            except json.JSONDecodeError:
                info["raw_content"] = content[:1000]

        else:
            info["raw_content"] = content[:2000]

    except Exception as e:
        logger.warning(f"Failed to extract info from {path}: {e}")
        info["extraction_error"] = str(e)

    return info


async def token_analyzer(state: AgentState) -> AgentState:
    """
    Analyze token counts, truncate oversized files, and extract
    structured information from each downloaded file.
    """
    whitelisted_files = state.get("whitelisted_files", {})
    max_per_file = settings.MAX_TOKENS_PER_FILE
    max_total = settings.MAX_TOTAL_TOKENS

    analyzed_files: dict[str, str] = {}
    per_file_tokens: dict[str, int] = {}
    truncated_files: list[str] = []
    extracted_info: dict[str, dict] = {}
    total_tokens = 0

    for path, content in whitelisted_files.items():
        token_count = _count_tokens(content)

        # Truncate if file exceeds per-file limit
        if token_count > max_per_file:
            content = _truncate_to_tokens(content, max_per_file)
            token_count = max_per_file
            truncated_files.append(path)
            logger.info(f"Truncated {path} to {max_per_file} tokens")

        # Check total budget
        if total_tokens + token_count > max_total:
            remaining = max_total - total_tokens
            if remaining > 100:
                content = _truncate_to_tokens(content, remaining)
                token_count = remaining
                truncated_files.append(path)
            else:
                logger.warning(
                    f"Skipping {path} — total token budget exhausted"
                )
                continue

        analyzed_files[path] = content
        per_file_tokens[path] = token_count
        total_tokens += token_count

        # Extract structured info
        extracted_info[path] = _extract_info_from_file(path, content)

    token_metrics = {
        "per_file": per_file_tokens,
        "total_tokens": total_tokens,
        "truncated_files": truncated_files,
        "files_analyzed": len(analyzed_files),
    }

    logger.info(
        f"Token analysis complete: {total_tokens} total tokens across "
        f"{len(analyzed_files)} files, {len(truncated_files)} truncated"
    )

    return {
        **state,
        "analyzed_files": analyzed_files,
        "token_metrics": token_metrics,
        "extracted_info": extracted_info,
    }
