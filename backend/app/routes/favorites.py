from flask import Blueprint, request, g
from ..middleware.auth import require_auth
from ..services.favorite_service import add_favorite, remove_favorite, list_favorites
from ..utils.responses import success

bp = Blueprint("favorites", __name__)


@bp.get("")
@require_auth
def list_():
    target_type = request.args.get("type", "RESOURCE")
    return success(list_favorites(target_type, g.profile))


@bp.post("/<target_type>/<target_id>")
@require_auth
def add(target_type, target_id):
    target_type = target_type.upper()
    return success(add_favorite(target_type, target_id, g.profile), status=201)


@bp.delete("/<target_type>/<target_id>")
@require_auth
def remove(target_type, target_id):
    target_type = target_type.upper()
    remove_favorite(target_type, target_id, g.profile)
    return success(message="Retiré des favoris.")