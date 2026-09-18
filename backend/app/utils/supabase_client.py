from functools import lru_cache
from supabase import create_client
from flask import current_app


@lru_cache(maxsize=1)
def get_supabase_admin():
    url = current_app.config["SUPABASE_URL"]
    key = current_app.config["SUPABASE_SERVICE_ROLE_KEY"]
    if not url or not key:
        raise RuntimeError("Supabase admin non configuré")
    return create_client(url, key)


def get_supabase_anon():
    url = current_app.config["SUPABASE_URL"]
    key = current_app.config["SUPABASE_ANON_KEY"]
    if not url or not key:
        raise RuntimeError("Supabase anon non configuré")
    return create_client(url, key)