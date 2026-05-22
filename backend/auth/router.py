"""
Authentication router — Supabase Google OAuth endpoints.

Endpoints:
  GET  /auth/google   → Returns the Google OAuth redirect URL
  POST /auth/callback → Exchanges code for session via access/refresh tokens
  GET  /auth/me       → Returns current authenticated user info
  POST /auth/logout   → Signs out the user
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from auth.supabase_client import supabase_client
from auth.dependencies import get_current_user
from models.schemas import (
    OAuthURLResponse,
    AuthCallbackRequest,
    EmailSignupRequest,
    EmailLoginRequest,
    AuthSessionResponse,
    UserResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthSessionResponse)
async def signup(body: EmailSignupRequest):
    """Sign up a new user with email and password."""
    try:
        response = supabase_client.auth.sign_up({
            "email": body.email,
            "password": body.password,
            "options": {
                "data": {"full_name": body.full_name}
            }
        })
        
        session = response.session
        user = response.user
        
        if not session or not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Signup successful but email confirmation required. Please check your email.",
            )

        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.user_metadata.get("full_name"),
                "avatar_url": user.user_metadata.get("avatar_url"),
                "provider": user.app_metadata.get("provider", "email"),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signup failed: {str(e)}",
        )


@router.post("/login", response_model=AuthSessionResponse)
async def login(body: EmailLoginRequest):
    """Log in a user with email and password."""
    try:
        response = supabase_client.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
        
        session = response.session
        user = response.user
        
        if not session or not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials or email not confirmed.",
            )

        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.user_metadata.get("full_name"),
                "avatar_url": user.user_metadata.get("avatar_url"),
                "provider": user.app_metadata.get("provider", "email"),
            },
        }
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid email or password",
        )


@router.get("/google", response_model=OAuthURLResponse)
async def google_sign_in():
    """
    Generate the Google OAuth redirect URL via Supabase.

    The frontend should redirect the user to this URL to initiate
    the Google Sign-In flow. After authentication, Supabase will
    redirect back to the configured callback URL with tokens.
    """
    try:
        response = supabase_client.auth.sign_in_with_oauth(
            {
                "provider": "google",
                "options": {
                    "redirect_to": "http://localhost:5173/auth/callback",
                },
            }
        )
        logger.info("Generated Google OAuth URL")
        return OAuthURLResponse(url=response.url)
    except Exception as e:
        logger.error(f"Failed to generate OAuth URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate Google sign-in: {str(e)}",
        )


@router.post("/callback")
async def auth_callback(body: AuthCallbackRequest):
    """
    Exchange access + refresh tokens for a Supabase session.

    The frontend calls this after receiving tokens from the OAuth redirect.
    Returns the full session (access_token, refresh_token, user info).
    """
    try:
        session_response = supabase_client.auth.set_session(
            body.access_token,
            body.refresh_token,
        )
        session = session_response.session
        user = session_response.user

        if not session or not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to establish session",
            )

        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "token_type": "bearer",
            "expires_in": session.expires_in,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.user_metadata.get("full_name"),
                "avatar_url": user.user_metadata.get("avatar_url"),
                "provider": user.app_metadata.get("provider"),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth callback failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication callback failed: {str(e)}",
        )


@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    """Return the currently authenticated user's info."""
    return UserResponse(**user)


@router.post("/logout")
async def logout():
    """Sign out the current user from Supabase."""
    try:
        supabase_client.auth.sign_out()
        return {"message": "Successfully logged out"}
    except Exception as e:
        logger.error(f"Logout failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}",
        )


@router.get("/callback-page")
async def callback_page():
    """
    Simple HTML page that extracts tokens from the URL hash
    fragment and displays them for Postman/manual testing.
    """
    html = """
    <!DOCTYPE html>
    <html>
    <head><title>Auth Callback</title></head>
    <body>
        <h2>Authentication Successful!</h2>
        <p>Extracting tokens from URL...</p>
        <pre id="tokens"></pre>
        <script>
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const data = {
                access_token: params.get('access_token'),
                refresh_token: params.get('refresh_token'),
                token_type: params.get('token_type'),
                expires_in: params.get('expires_in'),
            };
            document.getElementById('tokens').textContent = JSON.stringify(data, null, 2);
        </script>
    </body>
    </html>
    """
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=html)
