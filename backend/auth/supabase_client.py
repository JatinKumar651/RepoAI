"""
Supabase client singleton.

Initializes the Supabase Python client once and exposes it for
reuse across auth dependencies and routes.
"""

from supabase import create_client, Client
from config import settings


def get_supabase_client() -> Client:
    """Create and return a Supabase client using project credentials."""
    return create_client(
        settings.SUPABASE_PROJECT_URL,
        settings.ANON_PUBLIC_KEY,
    )


# Module-level singleton for import convenience
supabase_client: Client = get_supabase_client()
