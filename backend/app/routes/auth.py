from flask import Blueprint, request, g
from ..middleware.auth import require_auth
from ..middleware.rate_limit import limiter
from ..services.auth_service import register_user, login_user, logout_user
from ..utils.responses import success

bp = Blueprint("auth", __name__)


@bp.post("/register")
@limiter.limit("10 per minute")
def register():
    payload = request.get_json(silent=True) or {}
    data = register_user(payload)
    return success(data, message="Compte créé avec succès.", status=201)


@bp.post("/login")
@limiter.limit("10 per minute")
def login():
    payload = request.get_json(silent=True) or {}
    data = login_user(payload)
    return success(data, message="Connexion réussie.")


@bp.post("/logout")
@require_auth
def logout():
    logout_user(g.token)
    return success(message="Déconnexion réussie.")


@bp.get("/me")
@require_auth
def me():
    return success({"user": {"id": g.user.id, "email": g.user.email}, "profile": g.profile})