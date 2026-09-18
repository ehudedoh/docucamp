from ..utils.supabase_client import get_supabase_admin
from ..utils.errors import AppError

# Champs explicitement modifiables par l'utilisateur (anti mass-assignment)
EDITABLE_FIELDS = {"full_name", "phone", "avatar_url", "institution_id", "program_id", "level"}


def get_me(user_id):
    supabase = get_supabase_admin()
    res = (
        supabase.table("profiles")
        .select("id, full_name, email, phone, avatar_url, institution_id, program_id, level, role, created_at")
        .eq("id", user_id)
        .single()
        .execute()
    )
    if not res.data:
        raise AppError("Profil introuvable.", 404)
    return res.data


def update_me(user_id, payload):
    if not isinstance(payload, dict):
        raise AppError("Données invalides.", 400)

    clean = {k: v for k, v in payload.items() if k in EDITABLE_FIELDS}

    if not clean:
        raise AppError("Aucun champ modifiable fourni.", 400)

    # Validation basique
    if "full_name" in clean:
        full_name = str(clean["full_name"]).strip()
        if len(full_name) < 2 or len(full_name) > 120:
            raise AppError("Nom complet invalide.", 400)
        clean["full_name"] = full_name

    if "phone" in clean:
        phone = str(clean["phone"]).strip()
        if len(phone) < 7 or len(phone) > 20:
            raise AppError("Numéro WhatsApp invalide.", 400)
        clean["phone"] = phone

    supabase = get_supabase_admin()
    res = supabase.table("profiles").update(clean).eq("id", user_id).execute()

    if not res.data:
        raise AppError("Profil introuvable.", 404)

    return res.data[0]