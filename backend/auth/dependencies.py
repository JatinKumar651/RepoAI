"""
FastAPI authentication dependencies.

Provides a reusable `get_current_user` dependency that extracts the
Bearer token from the Authorization header and validates it against
Supabase Auth.
"""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth.supabase_client import supabase_client

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Validate the Supabase JWT and return the user object.

    Raises 401 if the token is invalid or expired.
    """
    token = credentials.credentials
    try:
        user_response = supabase_client.auth.get_user(token)
        user = user_response.user
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.user_metadata.get("full_name"),
            "avatar_url": user.user_metadata.get("avatar_url"),
            "provider": user.app_metadata.get("provider"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )
