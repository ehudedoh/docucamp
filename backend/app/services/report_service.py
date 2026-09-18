from ..utils.supabase_client import get_supabase_admin
from ..utils.errors import AppError

ALLOWED_REASONS = {
    "INAPPROPRIATE", "SPAM", "FRAUD", "INCORRECT",
    "ILLEGAL", "MISLEADING", "OTHER"
}


def create_report(target_type: str, target_id: str, payload: dict, profile: dict):
    if target_type not in ("RESOURCE", "MATERIAL"):
        raise AppError("Type de cible invalide.", 400)
    if not target_id or len(target_id) > 64:
        raise AppError("Identifiant invalide.", 400)

    reason = payload.get("reason")
    if reason not in ALLOWED_REASONS:
        raise AppError("Raison de signalement invalide.", 400)

    description = payload.get("description")
    if description and len(str(description)) > 2000:
        raise AppError("Description trop longue.", 400)

    row = {
        "reported_by": profile["id"],
        "reason": reason,
        "description": (str(description).strip() if description else None),
        "status": "OPEN",
    }
    if target_type == "RESOURCE":
        row["resource_id"] = target_id
    else:
        row["material_id"] = target_id

    supabase = get_supabase_admin()
    res = supabase.table("reports").insert(row).execute()
    if not res.data:
        raise AppError("Impossible d'enregistrer le signalement.", 500)
    return res.data[0]