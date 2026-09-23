from flask import Blueprint, request, g
from ..middleware.auth import require_auth
from ..middleware.rate_limit import limiter
from ..services.document_service import (
    list_documents, get_document, create_document,
    update_document, delete_document, download_document,
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

@bp.get("/me/downloads")
@require_auth
def my_downloads():
    from ..utils.supabase_client import get_supabase_admin
    supabase = get_supabase_admin()
    res = (
        supabase.table("download_history")
        .select(
            "id, created_at, "
            "resource:resources(id, title, resource_type, level, academic_year)"
        )
        .eq("user_id", g.profile["id"])
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    items = []
    for row in res.data or []:
        r = row.get("resource")
        if r:
            r["downloaded_at"] = row["created_at"]
            items.append(r)
    return success(items)


@bp.get("/me/uploaded")
@require_auth
def my_uploaded():
    from ..utils.supabase_client import get_supabase_admin
    supabase = get_supabase_admin()
    res = (
        supabase.table("resources")
        .select("id, title, resource_type, level, academic_year, status, download_count, created_at")
        .eq("uploaded_by", g.profile["id"])
        .order("created_at", desc=True)
        .execute()
    )
    return success(res.data or [])


@bp.post("/<doc_id>/report")
@require_auth
@limiter.limit("30 per hour")
def report(doc_id):
    payload = request.get_json(silent=True) or {}
    return success(create_report("RESOURCE", doc_id, payload, g.profile), status=201, message="Signalement enregistré.")