from flask import Blueprint, request, g
from ..middleware.auth import require_admin
from ..utils.supabase_client import get_supabase_admin
from ..utils.responses import success
from ..utils.errors import AppError

bp = Blueprint("admin", __name__)

ALLOWED_DOC_STATUS = {"PUBLISHED", "REJECTED"}
ALLOWED_MAT_STATUS = {"PUBLISHED", "REJECTED", "SOLD", "RENTED", "CLOSED"}
ALLOWED_REPORT_STATUS = {"OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"}


# -------------------------------------------------------------
# Audit
# -------------------------------------------------------------
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
        # Ne jamais bloquer une action à cause d'un log
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
        "published_documents": count("resources", status="PUBLISHED"),
        "materials_count": count("materials"),
        "pending_materials": count("materials", status="PENDING"),
        "published_materials": count("materials", status="PUBLISHED"),
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
        .select(
            "id, title, description, resource_type, level, academic_year, "
            "semester, file_name, file_size, status, created_at, uploaded_by, "
            "institution:institutions(name), "
            "program:programs(name), "
            "uploader:profiles(full_name, email)"
        )
        .eq("status", "PENDING")
        .order("created_at", desc=False)
        .execute()
    )
    items = res.data or []
    for it in items:
        it["institution_name"] = (it.pop("institution", None) or {}).get("name")
        it["program_name"] = (it.pop("program", None) or {}).get("name")
        uploader = it.pop("uploader", None) or {}
        it["uploader_name"] = uploader.get("full_name")
        it["uploader_email"] = uploader.get("email")
    return success(items)


@bp.get("/documents")
@require_admin
def all_documents():
    """Liste paginée de tous les documents (tous statuts) pour la vue admin."""
    args = request.args
    try:
        page = max(1, int(args.get("page", 1)))
        size = min(max(1, int(args.get("page_size", 20))), 100)
    except ValueError:
        raise AppError("Paramètres de pagination invalides.", 400)

    status = args.get("status")
    supabase = get_supabase_admin()
    query = (
        supabase.table("resources")
        .select(
            "id, title, resource_type, level, academic_year, status, created_at, "
            "uploader:profiles(full_name)",
            count="exact",
        )
    )
    if status:
        query = query.eq("status", status)
    query = query.order("created_at", desc=True).range((page - 1) * size, page * size - 1)
    res = query.execute()
    items = res.data or []
    for it in items:
        it["uploader_name"] = (it.pop("uploader", None) or {}).get("full_name")

    import math
    total = res.count or 0
    return success({
        "items": items,
        "page": page,
        "page_size": size,
        "total": total,
        "total_pages": max(1, math.ceil(total / size)),
    })


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

    _audit(g.profile["id"], f"DOC_{status}", "RESOURCE", doc_id,
           metadata={"previous_status": payload.get("previous_status")})
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
        .select(
            "id, title, description, category, transaction_type, price, "
            "rental_period, condition, status, created_at, seller_id, "
            "institution:institutions(name), "
            "seller:profiles(full_name, email), "
            "material_images(image_url, sort_order)"
        )
        .eq("status", "PENDING")
        .order("created_at", desc=False)
        .execute()
    )
    items = res.data or []
    for it in items:
        it["institution_name"] = (it.pop("institution", None) or {}).get("name")
        seller = it.pop("seller", None) or {}
        it["seller_name"] = seller.get("full_name")
        it["seller_email"] = seller.get("email")
        images = it.pop("material_images", []) or []
        images.sort(key=lambda i: i.get("sort_order", 0))
        it["images"] = images
    return success(items)


@bp.get("/materials")
@require_admin
def all_materials():
    args = request.args
    try:
        page = max(1, int(args.get("page", 1)))
        size = min(max(1, int(args.get("page_size", 20))), 100)
    except ValueError:
        raise AppError("Paramètres de pagination invalides.", 400)

    status = args.get("status")
    supabase = get_supabase_admin()
    query = (
        supabase.table("materials")
        .select(
            "id, title, category, transaction_type, price, status, created_at, "
            "seller:profiles(full_name)",
            count="exact",
        )
    )
    if status:
        query = query.eq("status", status)
    query = query.order("created_at", desc=True).range((page - 1) * size, page * size - 1)
    res = query.execute()
    items = res.data or []
    for it in items:
        it["seller_name"] = (it.pop("seller", None) or {}).get("full_name")

    import math
    total = res.count or 0
    return success({
        "items": items,
        "page": page,
        "page_size": size,
        "total": total,
        "total_pages": max(1, math.ceil(total / size)),
    })


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
    status = request.args.get("status")
    supabase = get_supabase_admin()
    query = (
        supabase.table("reports")
        .select(
            "id, reason, description, status, created_at, reported_by, "
            "resource_id, material_id, "
            "reporter:profiles!reports_reported_by_fkey(full_name, email), "
            "resource:resources(id, title, status), "
            "material:materials(id, title, status)"
        )
        .order("created_at", desc=True)
    )
    if status:
        query = query.eq("status", status)
    res = query.execute()

    items = res.data or []
    for it in items:
        reporter = it.pop("reporter", None) or {}
        it["reporter_name"] = reporter.get("full_name")
        it["reporter_email"] = reporter.get("email")
        resource = it.pop("resource", None)
        it["resource_title"] = (resource or {}).get("title")
        it["resource_status"] = (resource or {}).get("status")
        material = it.pop("material", None)
        it["material_title"] = (material or {}).get("title")
        it["material_status"] = (material or {}).get("status")
    return success(items)


@bp.patch("/reports/<report_id>/status")
@require_admin
def set_report_status(report_id):
    payload = request.get_json(silent=True) or {}
    status = payload.get("status")
    if status not in ALLOWED_REPORT_STATUS:
        raise AppError("Statut invalide.", 400)

    supabase = get_supabase_admin()
    res = supabase.table("reports").update({"status": status}).eq("id", report_id).execute()
    if not res.data:
        raise AppError("Signalement introuvable.", 404)

    _audit(g.profile["id"], f"REPORT_{status}", "REPORT", report_id)
    return success(res.data[0], message=f"Signalement {status}.")


# -------------------------------------------------------------
# Journal d'audit
# -------------------------------------------------------------
@bp.get("/audit")
@require_admin
def list_audit():
    args = request.args
    try:
        page = max(1, int(args.get("page", 1)))
        size = min(max(1, int(args.get("page_size", 50))), 200)
    except ValueError:
        raise AppError("Paramètres invalides.", 400)

    supabase = get_supabase_admin()
    query = (
        supabase.table("admin_audit_logs")
        .select(
            "id, action, target_type, target_id, metadata, created_at, "
            "admin:profiles(full_name, email)",
            count="exact",
        )
        .order("created_at", desc=True)
        .range((page - 1) * size, page * size - 1)
    )
    res = query.execute()
    items = res.data or []
    for it in items:
        admin = it.pop("admin", None) or {}
        it["admin_name"] = admin.get("full_name")
        it["admin_email"] = admin.get("email")

    import math
    total = res.count or 0
    return success({
        "items": items,
        "page": page,
        "page_size": size,
        "total": total,
        "total_pages": max(1, math.ceil(total / size)),
    })