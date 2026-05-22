"""
LangGraph workflow assembly.

Assembles the 6-node linear pipeline:
  tree_fetcher → tree_filter → content_downloader →
  token_analyzer → repo_card_builder → prompt_generator

Each node reads from and writes to the shared AgentState.
"""

from __future__ import annotations

import logging

from langgraph.graph import StateGraph, END
from agents.state import AgentState
from agents.nodes.tree_fetcher import tree_fetcher
from agents.nodes.tree_filter import tree_filter
from agents.nodes.content_downloader import content_downloader
from agents.nodes.token_analyzer import token_analyzer
from agents.nodes.repo_card_builder import repo_card_builder
from agents.nodes.prompt_generator import prompt_generator

logger = logging.getLogger(__name__)


def _should_continue(state: AgentState) -> str:
    """
    Conditional edge: if an error occurred in any node,
    skip to END instead of continuing the pipeline.
    """
    if state.get("error"):
        logger.error(f"Pipeline error — halting: {state['error']}")
        return "end"
    return "continue"


def build_graph() -> StateGraph:
    """
    Build and compile the LangGraph analysis pipeline.

    Returns a compiled graph ready to be invoked with:
        result = await graph.ainvoke(initial_state)
    """
    workflow = StateGraph(AgentState)

    # ── Add nodes ───────────────────────────────────────────
    workflow.add_node("tree_fetcher", tree_fetcher)
    workflow.add_node("tree_filter", tree_filter)
    workflow.add_node("content_downloader", content_downloader)
    workflow.add_node("token_analyzer", token_analyzer)
    workflow.add_node("repo_card_builder", repo_card_builder)
    workflow.add_node("prompt_generator", prompt_generator)

    # ── Set entry point ─────────────────────────────────────
    workflow.set_entry_point("tree_fetcher")

    # ── Add conditional edges (error-checking after each node)
    workflow.add_conditional_edges(
        "tree_fetcher",
        _should_continue,
        {"continue": "tree_filter", "end": END},
    )
    workflow.add_conditional_edges(
        "tree_filter",
        _should_continue,
        {"continue": "content_downloader", "end": END},
    )
    workflow.add_conditional_edges(
        "content_downloader",
        _should_continue,
        {"continue": "token_analyzer", "end": END},
    )
    workflow.add_conditional_edges(
        "token_analyzer",
        _should_continue,
        {"continue": "repo_card_builder", "end": END},
    )
    workflow.add_conditional_edges(
        "repo_card_builder",
        _should_continue,
        {"continue": "prompt_generator", "end": END},
    )

    # ── Finish after prompt generator ───────────────────────
    workflow.add_edge("prompt_generator", END)

    return workflow.compile()


# Module-level compiled graph for import convenience
analysis_graph = build_graph()
