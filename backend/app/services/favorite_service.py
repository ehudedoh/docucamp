from ..utils.supabase_client import get_supabase_admin
from ..utils.errors import AppError


def _target_filter(query, target_type, target_id):
    if target_type == "RESOURCE":
        return query.eq("resource_id", target_id)
    elif target_type == "MATERIAL":
        return query.eq("material_id", target_id)
    raise AppError("Type de cible invalide.", 400)


def add_favorite(target_type, target_id, profile):
    if target_type not in ("RESOURCE", "MATERIAL"):
        raise AppError("Type de cible invalide.", 400)
    if not target_id or len(target_id) > 64:
        raise AppError("Identifiant invalide.", 400)

    supabase = get_supabase_admin()

    # Vérifier que la cible existe
    table = "resources" if target_type == "RESOURCE" else "materials"
    exists = supabase.table(table).select("id").eq("id", target_id).execute()
    if not exists.data:
        raise AppError("Contenu introuvable.", 404)

    row = {"user_id": profile["id"]}
    if target_type == "RESOURCE":
        row["resource_id"] = target_id
    else:
        row["material_id"] = target_id

    # Upsert silencieux : si déjà favori, on renvoie l'existant
    try:
        res = supabase.table("favorites").insert(row).execute()
        return res.data[0] if res.data else {"ok": True}
    except Exception:
        # Déjà favori (violation d'unicité)
        return {"ok": True, "already": True}


def remove_favorite(target_type, target_id, profile):
    supabase = get_supabase_admin()
    q = supabase.table("favorites").delete().eq("user_id", profile["id"])
    q = _target_filter(q, target_type, target_id)
    q.execute()
    return True


def list_favorites(target_type, profile):
    supabase = get_supabase_admin()

    if target_type == "RESOURCE":
        res = (
            supabase.table("favorites")
            .select(
                "id, created_at, "
                "resource:resources(id, title, resource_type, level, academic_year, "
                "file_name, file_size, download_count, created_at)"
            )
            .eq("user_id", profile["id"])
            .not_.is_("resource_id", "null")
            .order("created_at", desc=True)
            .execute()
        )
        items = []
        for row in res.data or []:
            r = row.get("resource")
            if r:
                r["favorited_at"] = row["created_at"]
                items.append(r)
        return items

    elif target_type == "MATERIAL":
        res = (
            supabase.table("favorites")
            .select(
                "id, created_at, "
                "material:materials(id, title, category, transaction_type, price, "
                "condition, status, created_at)"
            )
            .eq("user_id", profile["id"])
            .not_.is_("material_id", "null")
            .order("created_at", desc=True)
            .execute()
        )
        items = []
        for row in res.data or []:
            m = row.get("material")
            if m:
                m["favorited_at"] = row["created_at"]
                items.append(m)
        return items

    raise AppError("Type de cible invalide.", 400)