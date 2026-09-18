from functools import wraps
from flask import request, g
from ..utils.responses import error
from ..utils.supabase_client import get_supabase_admin
import jwt


def _extract_token():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    return auth[7:].strip()


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = _extract_token()
        if not token:
            return error("Authentification requise.", status=401)
        try:
            supabase = get_supabase_admin()
            user_res = supabase.auth.get_user(token)
            if not user_res or not user_res.user:
                return error("Token invalide ou expiré.", status=401)
            g.user = user_res.user
            g.token = token
            # Charge le profil + rôle
            profile = (
                supabase.table("profiles")
                .select("id, role, full_name, email, phone, institution_id, program_id, level, avatar_url")
                .eq("id", user_res.user.id)
                .single()
                .execute()
            )
            g.profile = profile.data if profile else None
            return fn(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return error("Token expiré.", status=401)
        except Exception:
            return error("Token invalide ou expiré.", status=401)

    return wrapper


def require_admin(fn):
    @wraps(fn)
    @require_auth
    def wrapper(*args, **kwargs):
        profile = getattr(g, "profile", None)
        if not profile or profile.get("role") != "ADMIN":
            return error("Accès refusé.", status=403)
        return fn(*args, **kwargs)

    return wrapper