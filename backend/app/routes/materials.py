from flask import Blueprint, request, g
from ..middleware.auth import require_auth
from ..middleware.rate_limit import limiter
from ..services.material_service import (
    list_materials, get_material, create_material, update_material, delete_material
)
from ..services.report_service import create_report
from ..utils.responses import success

bp = Blueprint("materials", __name__)


@bp.get("")
def list_():
    return success(list_materials(request.args))


@bp.get("/<mat_id>")
def get_(mat_id):
    return success(get_material(mat_id))


@bp.post("")
@require_auth
@limiter.limit("30 per hour")
def create():
    payload = request.get_json(silent=True) or {}
    return success(create_material(payload, g.profile), status=201, message="Annonce soumise pour modération.")


@bp.patch("/<mat_id>")
@require_auth
def patch(mat_id):
    payload = request.get_json(silent=True) or {}
    return success(update_material(mat_id, payload, g.profile), message="Annonce mise à jour.")


@bp.delete("/<mat_id>")
@require_auth
def delete(mat_id):
    delete_material(mat_id, g.profile)
    return success(message="Annonce supprimée.")


@bp.post("/<mat_id>/report")
@require_auth
@limiter.limit("30 per hour")
def report(mat_id):
    payload = request.get_json(silent=True) or {}
    return success(create_report("MATERIAL", mat_id, payload, g.profile), status=201, message="Signalement enregistré.")