"""
Node 5: Repo Card Builder

Parses extracted file information and the directory tree to build
a structured repository summary card:
  - Project type (Node.js, Python, Rust, Go, etc.)
  - Framework (Next.js, FastAPI, Django, Express, etc.)
  - Languages
  - Dependencies
  - Build tools
  - Directory structure summary
"""

from __future__ import annotations

import logging

from agents.state import AgentState

logger = logging.getLogger(__name__)

# ── Detection maps ──────────────────────────────────────────

FRAMEWORK_INDICATORS: dict[str, list[str]] = {
    "Next.js": ["next", "next.config.js", "next.config.mjs"],
    "React": ["react", "react-dom"],
    "Vue.js": ["vue", "nuxt"],
    "Angular": ["@angular/core", "angular.json"],
    "Svelte": ["svelte", "@sveltejs/kit"],
    "Express": ["express"],
    "FastAPI": ["fastapi"],
    "Django": ["django"],
    "Flask": ["flask"],
    "Spring Boot": ["spring-boot", "pom.xml", "build.gradle"],
    "Rails": ["rails", "Gemfile"],
    "Laravel": ["laravel", "composer.json"],
    "Vite": ["vite", "vite.config.ts", "vite.config.js"],
    "Webpack": ["webpack", "webpack.config.js"],
    "Tailwind CSS": ["tailwindcss", "tailwind.config.js", "tailwind.config.ts"],
}

BUILD_TOOL_INDICATORS: dict[str, list[str]] = {
    "Docker": ["Dockerfile", "docker-compose.yml", "docker-compose.yaml"],
    "Webpack": ["webpack.config.js"],
    "Vite": ["vite.config.ts", "vite.config.js"],
    "Make": ["Makefile"],
    "npm": ["package.json"],
    "pip": ["requirements.txt"],
    "Poetry": ["pyproject.toml"],
    "Cargo": ["Cargo.toml"],
    "Go Modules": ["go.mod"],
    "Gradle": ["build.gradle"],
    "Maven": ["pom.xml"],
}


def _detect_languages(extracted_info: dict, filtered_tree: list[str]) -> list[str]:
    """Detect programming languages from file extensions in the tree."""
    lang_map = {
        ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript",
        ".jsx": "JavaScript (JSX)", ".tsx": "TypeScript (TSX)",
        ".rs": "Rust", ".go": "Go", ".java": "Java",
        ".rb": "Ruby", ".php": "PHP", ".cs": "C#",
        ".cpp": "C++", ".c": "C", ".swift": "Swift",
        ".kt": "Kotlin", ".scala": "Scala", ".dart": "Dart",
    }
    languages: set[str] = set()
    for line in filtered_tree:
        clean_line = line.strip()
        for ext, lang in lang_map.items():
            if clean_line.endswith(ext):
                languages.add(lang)
    return sorted(languages)


def _detect_frameworks(
    extracted_info: dict, whitelisted_paths: list[str]
) -> list[str]:
    """Detect frameworks from dependencies and config files."""
    frameworks: set[str] = set()

    # Collect all dependency names
    all_deps: set[str] = set()
    for path, info in extracted_info.items():
        deps = info.get("dependencies", [])
        dev_deps = info.get("devDependencies", [])
        if isinstance(deps, list):
            all_deps.update(deps)
        if isinstance(dev_deps, list):
            all_deps.update(dev_deps)

    # Also check filenames
    all_filenames = {p.split("/")[-1] for p in whitelisted_paths}

    for framework, indicators in FRAMEWORK_INDICATORS.items():
        for indicator in indicators:
            if indicator in all_deps or indicator in all_filenames:
                frameworks.add(framework)
                break

    return sorted(frameworks)


def _detect_build_tools(whitelisted_paths: list[str]) -> list[str]:
    """Detect build tools from the presence of config files."""
    tools: set[str] = set()
    filenames = {p.split("/")[-1] for p in whitelisted_paths}

    for tool, indicators in BUILD_TOOL_INDICATORS.items():
        for indicator in indicators:
            if indicator in filenames:
                tools.add(tool)
                break

    return sorted(tools)


def _detect_project_type(
    extracted_info: dict, whitelisted_paths: list[str]
) -> str:
    """Infer the primary project type."""
    filenames = {p.split("/")[-1] for p in whitelisted_paths}

    if "package.json" in filenames and "requirements.txt" in filenames:
        return "Full-Stack (Node.js + Python)"
    elif "package.json" in filenames:
        return "Node.js"
    elif "requirements.txt" in filenames or "pyproject.toml" in filenames:
        return "Python"
    elif "Cargo.toml" in filenames:
        return "Rust"
    elif "go.mod" in filenames:
        return "Go"
    elif "pom.xml" in filenames or "build.gradle" in filenames:
        return "Java/JVM"
    elif "Gemfile" in filenames:
        return "Ruby"
    elif "composer.json" in filenames:
        return "PHP"
    return "Unknown"


def _collect_dependencies(extracted_info: dict) -> dict[str, list[str]]:
    """Collect dependencies grouped by source file."""
    deps: dict[str, list[str]] = {}
    for path, info in extracted_info.items():
        file_deps = info.get("dependencies", [])
        if file_deps:
            deps[path] = file_deps
    return deps


async def repo_card_builder(state: AgentState) -> AgentState:
    """Build a structured repo summary card from extracted info."""
    extracted_info = state.get("extracted_info", {})
    filtered_tree = state.get("filtered_tree", [])
    whitelisted_paths = state.get("whitelisted_paths", [])

    # Build the tree summary (first 50 lines)
    tree_lines = filtered_tree[:50]
    if len(filtered_tree) > 50:
        tree_lines.append(f"  ... and {len(filtered_tree) - 50} more items")
    directory_summary = "\n".join(tree_lines)

    repo_card = {
        "owner": state["owner"],
        "repo": state["repo"],
        "repo_url": state["repo_url"],
        "default_branch": state.get("default_branch", "main"),
        "project_type": _detect_project_type(extracted_info, whitelisted_paths),
        "frameworks": _detect_frameworks(extracted_info, whitelisted_paths),
        "languages": _detect_languages(extracted_info, filtered_tree),
        "dependencies": _collect_dependencies(extracted_info),
        "build_tools": _detect_build_tools(whitelisted_paths),
        "directory_summary": directory_summary,
        "file_count": state.get("file_count", 0),
        "total_dirs": state.get("dir_count", 0),
    }

    logger.info(
        f"Repo card built: type={repo_card['project_type']}, "
        f"frameworks={repo_card['frameworks']}"
    )

    return {**state, "repo_card": repo_card}
