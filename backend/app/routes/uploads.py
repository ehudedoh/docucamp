from flask import Blueprint, request, g
from ..middleware.auth import require_auth
from ..middleware.rate_limit import limiter
from ..services.storage_service import upload_document, upload_material_image
from ..utils.responses import success
from ..utils.errors import AppError

bp = Blueprint("uploads", __name__)


@bp.post("/document")
@require_auth
@limiter.limit("20 per hour")
def upload_doc():
    if "file" not in request.files:
        raise AppError("Aucun fichier reçu.", 400)
    file = request.files["file"]
    data = upload_document(file, g.profile["id"])
    return success(data, message="Fichier enregistré.", status=201)


@bp.post("/material-image")
@require_auth
@limiter.limit("30 per hour")
def upload_img():
    if "file" not in request.files:
        raise AppError("Aucun fichier reçu.", 400)
    file = request.files["file"]
    data = upload_material_image(file, g.profile["id"])
    return success(data, message="Image enregistrée.", status=201)