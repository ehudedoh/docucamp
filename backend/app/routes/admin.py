from flask import Blueprint, request, g
from ..middleware.auth import require_admin
from ..services.report_service import get_supabase_admin  # non, voir ci-dessous
from ..utils.supabase_client import get_supabase_admin
from ..utils.responses import success
from ..utils.errors import AppError

bp = Blueprint("admin", __name__)

ALLOWED_DOC_STATUS = {"PUBLISHED", "REJECTED"}
ALLOWED_MAT_STATUS = {"PUBLISHED", "REJECTED", "SOLD", "RENTED", "CLOSED"}


def _audit(admin_id, action, target_type, target_id, metadata=None):
    supabase = get_supabase_admin()
    try:
        supabase.table("admin_audit_logs").insert({
            "admin_id": admin_id,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "metadata": metadata or {},
        }).execute()
    except Exception:
        # Le logging ne doit jamais casser l'action principale
        pass


# -------------------------------------------------------------
# Dashboard
# -------------------------------------------------------------
@bp.get("/dashboard")
@require_admin
def dashboard():
    supabase = get_supabase_admin()
    def count(table, **filters):
        q = supabase.table(table).select("id", count="exact")
        for k, v in filters.items():
            q = q.eq(k, v)
        return q.execute().count or 0

    return success({
        "users_count": count("profiles"),
        "documents_count": count("resources"),
        "pending_documents": count("resources", status="PENDING"),
        "materials_count": count("materials"),
        "pending_materials": count("materials", status="PENDING"),
        "open_reports": count("reports", status="OPEN"),
    })


# -------------------------------------------------------------
# Modération documents
# -------------------------------------------------------------
@bp.get("/documents/pending")
@require_admin
def pending_documents():
    supabase = get_supabase_admin()
    res = (
        supabase.table("resources")
        .select("id, title, resource_type, level, academic_year, status, created_at")
        .eq("status", "PENDING")
        .order("created_at", desc=False)
        .execute()
    )
    return success(res.data or [])


@bp.patch("/documents/<doc_id>/status")
@require_admin
def set_document_status(doc_id):
    payload = request.get_json(silent=True) or {}
    status = payload.get("status")
    if status not in ALLOWED_DOC_STATUS:
        raise AppError("Statut invalide.", 400)

    supabase = get_supabase_admin()
    res = supabase.table("resources").update({"status": status}).eq("id", doc_id).execute()
    if not res.data:
        raise AppError("Document introuvable.", 404)

    _audit(g.profile["id"], f"DOC_{status}", "RESOURCE", doc_id)
    return success(res.data[0], message=f"Document {status}.")


@bp.delete("/documents/<doc_id>")
@require_admin
def delete_document_admin(doc_id):
    supabase = get_supabase_admin()
    supabase.table("resources").delete().eq("id", doc_id).execute()
    _audit(g.profile["id"], "DOC_DELETE", "RESOURCE", doc_id)
    return success(message="Document supprimé.")


# -------------------------------------------------------------
# Modération matériel
# -------------------------------------------------------------
@bp.get("/materials/pending")
@require_admin
def pending_materials():
    supabase = get_supabase_admin()
    res = (
        supabase.table("materials")
        .select("id, title, category, transaction_type, price, status, created_at")
        .eq("status", "PENDING")
        .order("created_at", desc=False)
        .execute()
    )
    return success(res.data or [])


@bp.patch("/materials/<mat_id>/status")
@require_admin
def set_material_status(mat_id):
    payload = request.get_json(silent=True) or {}
    status = payload.get("status")
    if status not in ALLOWED_MAT_STATUS:
        raise AppError("Statut invalide.", 400)

    supabase = get_supabase_admin()
    res = supabase.table("materials").update({"status": status}).eq("id", mat_id).execute()
    if not res.data:
        raise AppError("Annonce introuvable.", 404)

    _audit(g.profile["id"], f"MAT_{status}", "MATERIAL", mat_id)
    return success(res.data[0], message=f"Annonce {status}.")


@bp.delete("/materials/<mat_id>")
@require_admin
def delete_material_admin(mat_id):
    supabase = get_supabase_admin()
    supabase.table("materials").delete().eq("id", mat_id).execute()
    _audit(g.profile["id"], "MAT_DELETE", "MATERIAL", mat_id)
    return success(message="Annonce supprimée.")


# -------------------------------------------------------------
# Signalements
# -------------------------------------------------------------
@bp.get("/reports")
@require_admin
def list_reports():
    supabase = get_supabase_admin()
    res = (
        supabase.table("reports")
        .select("id, reason, description, status, created_at, reported_by, resource_id, material_id")
        .order("created_at", desc=True)
        .execute()
    )
    return success(res.data or [])