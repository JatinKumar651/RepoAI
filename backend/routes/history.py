"""
API router — Analysis History (Supabase-backed).

Endpoints:
  POST   /api/history        → Save a completed analysis to Supabase
  GET    /api/history        → List all analyses for the current user
  GET    /api/history/{id}   → Get a single analysis by ID
  DELETE /api/history/{id}   → Delete a single analysis by ID
"""

from __future__ import annotations

import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import create_client, Client

from auth.dependencies import get_current_user
from config import settings
from models.schemas import (
    HistorySaveRequest,
    HistoryEntry,
    HistoryListResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["History"])

# Use service-role key so we can bypass RLS for server-side writes.
# RLS policies on the table still protect client-direct requests.
def _service_client() -> Client:
    return create_client(
        settings.SUPABASE_PROJECT_URL,
        settings.SERVICE_ROLE_KEY,
    )


TABLE = "analysis_history"


@router.post("/history", response_model=HistoryEntry, status_code=status.HTTP_201_CREATED)
async def save_history(
    body: HistorySaveRequest,
    user: dict = Depends(get_current_user),
):
    """
    Persist a completed repo analysis to the analysis_history table.
    Called by the frontend right after a successful /api/analyze-repo response.
    """
    client = _service_client()
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "repo_url": body.repo_url,
        "repo_owner": body.repo_card.get("owner", ""),
        "repo_name": body.repo_card.get("repo", ""),
        "repo_card": body.repo_card,
        "directory_tree": body.directory_tree,
        "token_metrics": body.token_metrics,
        "generated_prompt": body.generated_prompt,
    }

    try:
        response = client.table(TABLE).insert(record).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to save history — Supabase returned empty response",
            )
        logger.info(f"Saved history for user={user['id']} repo={body.repo_url}")
        return HistoryEntry(**response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"History save failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to save history: {str(e)}",
        )


@router.get("/history", response_model=HistoryListResponse)
async def list_history(
    user: dict = Depends(get_current_user),
    limit: int = 20,
    offset: int = 0,
):
    """Return all analyses for the authenticated user, newest first."""
    client = _service_client()
    try:
        response = (
            client.table(TABLE)
            .select("*")
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )
        entries = [HistoryEntry(**row) for row in (response.data or [])]

        # Total count for pagination
        count_resp = (
            client.table(TABLE)
            .select("id", count="exact")
            .eq("user_id", user["id"])
            .execute()
        )
        total = count_resp.count or len(entries)

        return HistoryListResponse(entries=entries, total=total)
    except Exception as e:
        logger.error(f"History list failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch history: {str(e)}",
        )


@router.get("/history/{entry_id}", response_model=HistoryEntry)
async def get_history_entry(
    entry_id: str,
    user: dict = Depends(get_current_user),
):
    """Return a single history entry (must belong to the requesting user)."""
    client = _service_client()
    try:
        response = (
            client.table(TABLE)
            .select("*")
            .eq("id", entry_id)
            .eq("user_id", user["id"])
            .single()
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
        return HistoryEntry(**response.data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"History get failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch entry: {str(e)}",
        )


@router.delete("/history/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_history_entry(
    entry_id: str,
    user: dict = Depends(get_current_user),
):
    """Delete a history entry (must belong to the requesting user)."""
    client = _service_client()
    try:
        client.table(TABLE).delete().eq("id", entry_id).eq("user_id", user["id"]).execute()
        logger.info(f"Deleted history entry {entry_id} for user={user['id']}")
    except Exception as e:
        logger.error(f"History delete failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to delete entry: {str(e)}",
        )
