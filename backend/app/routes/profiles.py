from flask import Blueprint, request, g
from ..middleware.auth import require_auth
from ..services.profile_service import get_me, update_me
from ..utils.responses import success

bp = Blueprint("profiles", __name__)


@bp.get("/me")
@require_auth
def get_profile():
    return success(get_me(g.profile["id"]))


@bp.patch("/me")
@require_auth
def patch_profile():
    payload = request.get_json(silent=True) or {}
    return success(update_me(g.profile["id"], payload), message="Profil mis à jour.")