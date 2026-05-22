"""
Node 6: Prompt Generator

Takes the repo card, extracted info, and filtered tree, then calls
Groq LLM (llama-3.3-70b-versatile) via LangChain to generate a
detailed Cursor/Antigravity-ready prompt for rebuilding the project.
"""

from __future__ import annotations

import json
import logging

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from agents.state import AgentState
from config import settings

logger = logging.getLogger(__name__)

# ── System prompt template ──────────────────────────────────

SYSTEM_PROMPT = """You are an expert prompt engineer. Your task is to write a highly detailed PROMPT that will be fed into another AI coding assistant (like Cursor or Antigravity) to completely rebuild a specific GitHub repository from scratch.

You will be provided with the repository's metadata, directory structure, and configuration files.

CRITICAL INSTRUCTION:
Your entire output MUST be the prompt itself. Do not include introductory text like "Here is the prompt". The very first line of your output should be the beginning of the prompt you are writing.

The prompt you write MUST follow this exact structure:

# Role
You are an expert full-stack software engineer. Your task is to rebuild this project from scratch.

# Project Overview
[Write a detailed description of what the project is based on the provided data]

# Tech Stack
[List the frameworks, languages, and core libraries]

# Architecture & Directory Structure
[Outline the directory structure and explain where different parts of the application live]

# Build Instructions
Provide a sequential, step-by-step checklist for the AI to execute. Break it down into phases:
1. **Initialization:** Commands to scaffold the project (e.g. `npx create-vite`, `python -m venv`).
2. **Dependencies:** Exact packages to install based on the provided package.json/requirements.txt.
3. **Configuration:** Instructions to recreate the config files (tailwind, vite, etc.) using the EXACT contents provided. 
4. **Core Implementation:** File-by-file instructions on what components/modules to create and what logic they should contain.

DO NOT JUST DUMP THE CONFIG FILES. You must write explicit INSTRUCTIONS for the AI on how to use them.
Example: "Create `frontend/tailwind.config.js` and populate it with the following configuration: [insert content]"
"""


def _build_context(state: AgentState) -> str:
    """Build the context string to send to the LLM."""
    repo_card = state.get("repo_card", {})
    extracted_info = state.get("extracted_info", {})
    analyzed_files = state.get("analyzed_files", {})
    filtered_tree = state.get("filtered_tree", [])

    sections = []

    # ── Repo Card ───────────────────────────────────────────
    sections.append("## Repository Information")
    sections.append(f"- **Owner**: {repo_card.get('owner', 'N/A')}")
    sections.append(f"- **Repo**: {repo_card.get('repo', 'N/A')}")
    sections.append(f"- **URL**: {repo_card.get('repo_url', 'N/A')}")
    sections.append(f"- **Default Branch**: {repo_card.get('default_branch', 'main')}")
    sections.append(f"- **Project Type**: {repo_card.get('project_type', 'Unknown')}")
    sections.append(f"- **Frameworks**: {', '.join(repo_card.get('frameworks', []))}")
    sections.append(f"- **Languages**: {', '.join(repo_card.get('languages', []))}")
    sections.append(f"- **Build Tools**: {', '.join(repo_card.get('build_tools', []))}")
    sections.append(f"- **Total Files**: {repo_card.get('file_count', 0)}")
    sections.append(f"- **Total Directories**: {repo_card.get('total_dirs', 0)}")

    # ── Directory Tree ──────────────────────────────────────
    sections.append("\n## Directory Structure")
    tree_display = filtered_tree[:100]
    sections.append("```")
    sections.extend(tree_display)
    if len(filtered_tree) > 100:
        sections.append(f"... and {len(filtered_tree) - 100} more items")
    sections.append("```")

    # ── File Contents ───────────────────────────────────────
    sections.append("\n## Configuration File Contents")
    for path, content in analyzed_files.items():
        sections.append(f"\n### {path}")
        sections.append(f"```")
        sections.append(content)
        sections.append(f"```")

    # ── Extracted Info ──────────────────────────────────────
    sections.append("\n## Extracted Metadata")
    for path, info in extracted_info.items():
        # Only include meaningful extracted data, not raw content
        filtered_info = {
            k: v for k, v in info.items()
            if k not in ("raw_content", "content_preview") and v
        }
        if filtered_info:
            sections.append(f"\n### {path}")
            sections.append(f"```json\n{json.dumps(filtered_info, indent=2)}\n```")

    return "\n".join(sections)


async def prompt_generator(state: AgentState) -> AgentState:
    """
    Call the Groq LLM to generate a Cursor/Antigravity-ready prompt
    for rebuilding the analyzed repository.
    """
    context = _build_context(state)

    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        max_tokens=4000,
    )

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"Analyze the following GitHub repository and generate a "
                f"comprehensive Cursor/Antigravity-ready prompt to rebuild it.\n\n"
                f"{context}"
            )
        ),
    ]

    try:
        response = await llm.ainvoke(messages)
        generated_prompt = response.content

        logger.info(
            f"Generated prompt: {len(generated_prompt)} chars"
        )

        return {**state, "generated_prompt": generated_prompt}

    except Exception as e:
        logger.error(f"Prompt generation failed: {e}")
        return {
            **state,
            "generated_prompt": f"Error generating prompt: {str(e)}",
            "error": f"LLM call failed: {str(e)}",
        }
