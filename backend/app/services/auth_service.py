from flask import current_app, g
from ..utils.supabase_client import get_supabase_admin, get_supabase_anon
from ..utils.errors import AppError


# -------------------------------------------------------------
# Validation minimale (le reste est fait par validators/)
# -------------------------------------------------------------
REQUIRED_FIELDS = ["full_name", "email", "password", "phone"]


def _validate_register_payload(payload):
    if not isinstance(payload, dict):
        raise AppError("Données invalides.", 400)

    for field in REQUIRED_FIELDS:
        if not payload.get(field) or not str(payload[field]).strip():
            raise AppError(f"Le champ '{field}' est requis.", 400)

    email = str(payload["email"]).strip().lower()
    if "@" not in email or len(email) > 254:
        raise AppError("Adresse email invalide.", 400)

    password = str(payload["password"])
    if len(password) < 8:
        raise AppError("Le mot de passe doit contenir au moins 8 caractères.", 400)

    phone = str(payload["phone"]).strip()
    if len(phone) < 7 or len(phone) > 20:
        raise AppError("Numéro WhatsApp invalide.", 400)

    full_name = str(payload["full_name"]).strip()
    if len(full_name) < 2 or len(full_name) > 120:
        raise AppError("Nom complet invalide.", 400)

    return {
        "full_name": full_name,
        "email": email,
        "password": password,
        "phone": phone,
        "institution_id": payload.get("institution_id"),
        "program_id": payload.get("program_id"),
        "level": (str(payload["level"]).strip() if payload.get("level") else None),
    }


# -------------------------------------------------------------
# Inscription
# -------------------------------------------------------------
def register_user(payload):
    data = _validate_register_payload(payload)
    supabase = get_supabase_admin()

    # 1. Créer l'utilisateur via Supabase Auth (admin)
    #    -> le trigger handle_new_user crée automatiquement le profil STUDENT
    try:
        user_res = supabase.auth.admin.create_user({
            "email": data["email"],
            "password": data["password"],
            "email_confirm": True,  # MVP : pas de flow de confirmation email
            "user_metadata": {
                "full_name": data["full_name"],
                "phone": data["phone"],
            },
        })
    except Exception as e:
        msg = str(e).lower()
        # Ne pas révéler si l'email existe déjà (anti-énumération)
        if "already" in msg or "duplicate" in msg or "exists" in msg:
            raise AppError("Impossible de créer le compte avec ces informations.", 400)
        raise AppError("Impossible de créer le compte.", 500)

    user = user_res.user
    if not user:
        raise AppError("Impossible de créer le compte.", 500)

    # 2. Compléter le profil avec les infos académiques
    update_fields = {
        "institution_id": data["institution_id"],
        "program_id": data["program_id"],
        "level": data["level"],
    }
    update_fields = {k: v for k, v in update_fields.items() if v is not None}

    if update_fields:
        try:
            supabase.table("profiles").update(update_fields).eq("id", user.id).execute()
        except Exception:
            # Le compte existe déjà, on ne fait pas échouer l'inscription
            current_app.logger.warning("Impossible de compléter le profil %s", user.id)

    # 3. Récupérer le profil final
    profile_res = (
        supabase.table("profiles")
        .select("id, full_name, email, phone, avatar_url, institution_id, program_id, level, role")
        .eq("id", user.id)
        .single()
        .execute()
    )

    # 4. Créer une session (connexion automatique après inscription)
    anon = get_supabase_anon()
    session_res = anon.auth.sign_in_with_password({
        "email": data["email"],
        "password": data["password"],
    })

    if not session_res.session:
        # Cas rare : on renvoie au moins le profil, l'utilisateur devra se connecter
        return {
            "token": None,
            "user": {"id": user.id, "email": user.email},
            "profile": profile_res.data,
        }

    return {
        "token": session_res.session.access_token,
        "refresh_token": session_res.session.refresh_token,
        "user": {"id": user.id, "email": user.email},
        "profile": profile_res.data,
    }


# -------------------------------------------------------------
# Connexion
# -------------------------------------------------------------
def login_user(payload):
    if not isinstance(payload, dict):
        raise AppError("Données invalides.", 400)

    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    if not email or not password:
        # Message générique : anti-énumération
        raise AppError("Identifiants invalides.", 401)

    anon = get_supabase_anon()
    try:
        res = anon.auth.sign_in_with_password({"email": email, "password": password})
    except Exception:
        # Ne jamais dire si l'email existe
        raise AppError("Identifiants invalides.", 401)

    if not res.session or not res.user:
        raise AppError("Identifiants invalides.", 401)

    admin = get_supabase_admin()
    profile_res = (
        admin.table("profiles")
        .select("id, full_name, email, phone, avatar_url, institution_id, program_id, level, role")
        .eq("id", res.user.id)
        .single()
        .execute()
    )

    return {
        "token": res.session.access_token,
        "refresh_token": res.session.refresh_token,
        "user": {"id": res.user.id, "email": res.user.email},
        "profile": profile_res.data,
    }


# -------------------------------------------------------------
# Déconnexion
# -------------------------------------------------------------
def logout_user(token):
    # Supabase gère la révocation côté client ; on peut aussi invalider
    # côté admin si nécessaire. Pour le MVP, on se contente de ne rien faire
    # de bloquant : le frontend supprime le token.
    try:
        anon = get_supabase_anon()
        anon.auth.sign_out()
    except Exception:
        pass
    return True