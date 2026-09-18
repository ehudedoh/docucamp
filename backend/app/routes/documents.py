from flask import Blueprint, request, g
from ..middleware.auth import require_auth
from ..middleware.rate_limit import limiter
from ..services.document_service import (
    list_documents, get_document, create_document, update_document, delete_document, download_document
)
from ..services.report_service import create_report
from ..utils.responses import success

bp = Blueprint("documents", __name__)


@bp.get("")
def list_():
    return success(list_documents(request.args))


@bp.get("/<doc_id>")
def get_(doc_id):
    return success(get_document(doc_id))


@bp.post("")
@require_auth
@limiter.limit("30 per hour")
def create():
    payload = request.get_json(silent=True) or {}
    return success(create_document(payload, g.profile), status=201, message="Document soumis pour modération.")


@bp.patch("/<doc_id>")
@require_auth
def patch(doc_id):
    payload = request.get_json(silent=True) or {}
    return success(update_document(doc_id, payload, g.profile), message="Document mis à jour.")


@bp.delete("/<doc_id>")
@require_auth
def delete(doc_id):
    delete_document(doc_id, g.profile)
    return success(message="Document supprimé.")


@bp.post("/<doc_id>/download")
def download(doc_id):
    return success(download_document(doc_id))


@bp.post("/<doc_id>/report")
@require_auth
@limiter.limit("30 per hour")
def report(doc_id):
    payload = request.get_json(silent=True) or {}
    return success(create_report("RESOURCE", doc_id, payload, g.profile), status=201, message="Signalement enregistré.")