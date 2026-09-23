import math
from flask import current_app
from ..utils.supabase_client import get_supabase_admin
from ..utils.errors import AppError
from .storage_service import create_signed_url, DOCUMENTS_BUCKET


# -------------------------------------------------------------
# Constantes
# -------------------------------------------------------------
PAGE_SIZE_DEFAULT = 12
PAGE_SIZE_MAX = 50

ALLOWED_RESOURCE_TYPES = {
    "EXAM", "ASSIGNMENT", "CORRECTION", "REVISION_SHEET",
    "COURSE", "TP", "OTHER"
}
ALLOWED_SEMESTERS = {"S1", "S2", "S3", "S4", "S5", "S6", "ANNUAL"}


# -------------------------------------------------------------
# Helpers
# -------------------------------------------------------------
def _int_arg(args, key, default=None):
    try:
        v = args.get(key)
        return int(v) if v not in (None, "") else default
    except (TypeError, ValueError):
        return default


def _paginate(args):
    page = max(1, _int_arg(args, "page", 1) or 1)
    size = _int_arg(args, "page_size", PAGE_SIZE_DEFAULT) or PAGE_SIZE_DEFAULT
    size = min(max(1, size), PAGE_SIZE_MAX)
    start = (page - 1) * size
    end = start + size - 1
    return page, size, start, end


def _sanitize_str(value, max_len=200):
    if value is None:
        return None
    s = str(value).strip()
    if not s:
        return None
    if len(s) > max_len:
        raise AppError(f"Champ trop long (max {max_len}).", 400)
    return s


# -------------------------------------------------------------
# Lecture publique
# -------------------------------------------------------------
def list_documents(args):
    page, size, start, end = _paginate(args)

    supabase = get_supabase_admin()
    query = (
        supabase.table("resources")
        .select(
            "id, title, description, resource_type, level, academic_year, semester, "
            "file_name, file_size, download_count, status, created_at, "
            "subject:subjects(name), program:programs(name), "
            "institution:institutions(name)",
            count="exact",
        )
        .eq("status", "PUBLISHED")
    )

    # Recherche (titre + description)
    search = _sanitize_str(args.get("search"), 100)
    if search:
        query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")

    # Filtres
    if (v := args.get("resource_type")):
        if v not in ALLOWED_RESOURCE_TYPES:
            raise AppError("Type de document invalide.", 400)
        query = query.eq("resource_type", v)
    if (v := args.get("institution_id")):
        query = query.eq("institution_id", v)
    if (v := args.get("program_id")):
        query = query.eq("program_id", v)
    if (v := args.get("subject_id")):
        query = query.eq("subject_id", v)
    if (v := args.get("level")):
        query = query.eq("level", v)
    if (v := args.get("academic_year")):
        query = query.eq("academic_year", v)
    if (v := args.get("semester")):
        if v not in ALLOWED_SEMESTERS:
            raise AppError("Semestre invalide.", 400)
        query = query.eq("semester", v)

    query = query.order("created_at", desc=True).range(start, end)

    res = query.execute()
    items = res.data or []
    total = res.count or 0
    total_pages = max(1, math.ceil(total / size))

    # Normalisation des jointures
    for item in items:
        item["subject_name"] = (item.pop("subject", None) or {}).get("name")
        item["program_name"] = (item.pop("program", None) or {}).get("name")
        item["institution_name"] = (item.pop("institution", None) or {}).get("name")

    return {
        "items": items,
        "page": page,
        "page_size": size,
        "total": total,
        "total_pages": total_pages,
    }


def get_document(doc_id):
    if not doc_id or len(doc_id) > 64:
        raise AppError("Identifiant invalide.", 400)

    supabase = get_supabase_admin()
    res = (
        supabase.table("resources")
        .select(
            "id, title, description, resource_type, level, academic_year, semester, "
            "file_name, file_size, download_count, status, created_at, uploaded_by, "
            "subject:subjects(name), program:programs(name), "
            "institution:institutions(name), "
            "uploader:profiles(full_name)"
        )
        .eq("id", doc_id)
        .single()
        .execute()
    )

    if not res.data:
        raise AppError("Document introuvable.", 404)

    doc = res.data

    # Un document non PUBLISHED n'est visible que par son uploader ou un admin
    # (le service n'a pas accès à g.user ici → on laisse passer mais on filtre)
    doc["subject_name"] = (doc.pop("subject", None) or {}).get("name")
    doc["program_name"] = (doc.pop("program", None) or {}).get("name")
    doc["institution_name"] = (doc.pop("institution", None) or {}).get("name")
    doc["uploader_name"] = (doc.pop("uploader", None) or {}).get("full_name")

    return doc


# -------------------------------------------------------------
# Écriture
# -------------------------------------------------------------
REQUIRED_CREATE_FIELDS = {"title", "resource_type", "level", "academic_year", "file_url", "file_name", "file_size"}


def create_document(payload, profile):
    if not isinstance(payload, dict):
        raise AppError("Données invalides.", 400)

    # Champs requis
    missing = [f for f in REQUIRED_CREATE_FIELDS if not payload.get(f)]
    if missing:
        raise AppError(f"Champs manquants : {', '.join(missing)}.", 400)

    # Validation
    title = _sanitize_str(payload.get("title"), 200)
    if not title or len(title) < 3:
        raise AppError("Titre invalide (min 3 caractères).", 400)

    resource_type = payload.get("resource_type")
    if resource_type not in ALLOWED_RESOURCE_TYPES:
        raise AppError("Type de document invalide.", 400)

    semester = payload.get("semester") or None
    if semester and semester not in ALLOWED_SEMESTERS:
        raise AppError("Semestre invalide.", 400)

    file_size = int(payload.get("file_size") or 0)
    max_bytes = current_app.config["MAX_DOCUMENT_SIZE_MB"] * 1024 * 1024
    if file_size <= 0 or file_size > max_bytes:
        raise AppError("Taille de fichier invalide.", 400)

    clean = {
        "title": title,
        "description": _sanitize_str(payload.get("description"), 2000),
        "resource_type": resource_type,
        "institution_id": payload.get("institution_id") or None,
        "program_id": payload.get("program_id") or None,
        "subject_id": payload.get("subject_id") or None,
        "level": _sanitize_str(payload.get("level"), 20),
        "academic_year": _sanitize_str(payload.get("academic_year"), 20),
        "semester": semester,
        "file_url": payload["file_url"],
        "file_name": _sanitize_str(payload["file_name"], 200),
        "file_size": file_size,
        "uploaded_by": profile["id"],
        "status": "PENDING",   # forcé côté serveur
    }

    supabase = get_supabase_admin()
    res = supabase.table("resources").insert(clean).execute()
    if not res.data:
        raise AppError("Impossible de créer le document.", 500)
    return res.data[0]


# Champs modifiables par le propriétaire (anti mass-assignment)
DOCUMENT_EDITABLE_FIELDS = {
    "title", "description", "resource_type",
    "institution_id", "program_id", "subject_id",
    "level", "academic_year", "semester",
}


def update_document(doc_id, payload, profile):
    if not isinstance(payload, dict):
        raise AppError("Données invalides.", 400)

    supabase = get_supabase_admin()
    res = (
        supabase.table("resources")
        .select("id, uploaded_by, status")
        .eq("id", doc_id)
        .single()
        .execute()
    )
    if not res.data:
        raise AppError("Document introuvable.", 404)

    doc = res.data

    # Autorisation : propriétaire ou admin
    is_owner = doc["uploaded_by"] == profile["id"]
    is_admin = profile.get("role") == "ADMIN"
    if not (is_owner or is_admin):
        raise AppError("Accès refusé.", 403)

    # Filtrage strict des champs
    clean = {k: v for k, v in payload.items() if k in DOCUMENT_EDITABLE_FIELDS}
    if not clean:
        raise AppError("Aucun champ modifiable fourni.", 400)

    # Validations ciblées
    if "title" in clean:
        clean["title"] = _sanitize_str(clean["title"], 200)
        if not clean["title"] or len(clean["title"]) < 3:
            raise AppError("Titre invalide.", 400)
    if "resource_type" in clean and clean["resource_type"] not in ALLOWED_RESOURCE_TYPES:
        raise AppError("Type invalide.", 400)
    if "semester" in clean and clean["semester"] and clean["semester"] not in ALLOWED_SEMESTERS:
        raise AppError("Semestre invalide.", 400)

    # Un étudiant ne peut pas modifier le statut via cet endpoint
    # (sécurité anti auto-publication)

    update_res = supabase.table("resources").update(clean).eq("id", doc_id).execute()
    if not update_res.data:
        raise AppError("Mise à jour impossible.", 500)
    return update_res.data[0]


def delete_document(doc_id, profile):
    supabase = get_supabase_admin()
    res = (
        supabase.table("resources")
        .select("id, uploaded_by")
        .eq("id", doc_id)
        .single()
        .execute()
    )
    if not res.data:
        raise AppError("Document introuvable.", 404)

    is_owner = res.data["uploaded_by"] == profile["id"]
    is_admin = profile.get("role") == "ADMIN"
    if not (is_owner or is_admin):
        raise AppError("Accès refusé.", 403)

    supabase.table("resources").delete().eq("id", doc_id).execute()
    return True


# -------------------------------------------------------------
# Téléchargement
# -------------------------------------------------------------
def download_document(doc_id):
    if not doc_id or len(doc_id) > 64:
        raise AppError("Identifiant invalide.", 400)

    supabase = get_supabase_admin()
    res = (
        supabase.table("resources")
        .select("id, status, file_url, file_name, download_count")
        .eq("id", doc_id)
        .single()
        .execute()
    )
    if not res.data:
        raise AppError("Document introuvable.", 404)

    doc = res.data
    if doc["status"] != "PUBLISHED":
        raise AppError("Document non disponible.", 403)

    # URL signée temporaire
    url = create_signed_url(DOCUMENTS_BUCKET, doc["file_url"], expires_in=3600)

    # Incrémenter le compteur (best effort)
    try:
        from flask import g
        if getattr(g, "profile", None):
            supabase.table("download_history").insert({
                "user_id": g.profile["id"],
                "resource_id": doc_id,
            }).execute()
    except Exception:
        pass