import math
from flask import current_app
from ..utils.supabase_client import get_supabase_admin
from ..utils.errors import AppError


PAGE_SIZE_DEFAULT = 12
PAGE_SIZE_MAX = 50

ALLOWED_CATEGORIES = {
    "CALCULATOR", "BOOK", "ELECTRONICS", "TP_KIT",
    "STATIONERY", "COMPUTER_ACCESSORY", "OTHER"
}
ALLOWED_TRANSACTIONS = {"SALE", "RENT", "DONATION"}
ALLOWED_CONDITIONS = {"NEW", "VERY_GOOD", "GOOD", "ACCEPTABLE", "TO_REPAIR"}


# -------------------------------------------------------------
# Helpers
# -------------------------------------------------------------
def _int_arg(args, key, default=None):
    try:
        v = args.get(key)
        return int(v) if v not in (None, "") else default
    except (TypeError, ValueError):
        return default


def _float_arg(args, key, default=None):
    try:
        v = args.get(key)
        return float(v) if v not in (None, "") else default
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
# Lecture
# -------------------------------------------------------------
def list_materials(args):
    page, size, start, end = _paginate(args)

    supabase = get_supabase_admin()
    query = (
        supabase.table("materials")
        .select(
            "id, title, description, category, transaction_type, price, "
            "rental_period, condition, status, created_at, seller_id, "
            "institution:institutions(name), "
            "material_images(image_url, sort_order)",
            count="exact",
        )
        .in_("status", ["PUBLISHED", "SOLD", "RENTED", "CLOSED"])
    )

    # Recherche
    search = _sanitize_str(args.get("search"), 100)
    if search:
        query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%")

    # Filtres
    if (v := args.get("category")):
        if v not in ALLOWED_CATEGORIES:
            raise AppError("Catégorie invalide.", 400)
        query = query.eq("category", v)
    if (v := args.get("transaction_type")):
        if v not in ALLOWED_TRANSACTIONS:
            raise AppError("Type de transaction invalide.", 400)
        query = query.eq("transaction_type", v)
    if (v := args.get("condition")):
        if v not in ALLOWED_CONDITIONS:
            raise AppError("État invalide.", 400)
        query = query.eq("condition", v)
    if (v := args.get("institution_id")):
        query = query.eq("institution_id", v)
    if (v := _float_arg(args, "price_min")):
        query = query.gte("price", v)
    if (v := _float_arg(args, "price_max")):
        query = query.lte("price", v)

    query = query.order("created_at", desc=True).range(start, end)

    res = query.execute()
    items = res.data or []
    total = res.count or 0
    total_pages = max(1, math.ceil(total / size))

    # Normalisation des jointures
    for item in items:
        item["institution_name"] = (item.pop("institution", None) or {}).get("name")
        images = item.pop("material_images", []) or []
        images.sort(key=lambda i: i.get("sort_order", 0))
        item["images"] = images

    return {
        "items": items,
        "page": page,
        "page_size": size,
        "total": total,
        "total_pages": total_pages,
    }


def get_material(mat_id):
    if not mat_id or len(mat_id) > 64:
        raise AppError("Identifiant invalide.", 400)

    supabase = get_supabase_admin()
    res = (
        supabase.table("materials")
        .select(
            "id, title, description, category, transaction_type, price, "
            "rental_period, condition, status, created_at, seller_id, "
            "institution:institutions(name), "
            "seller:profiles(full_name, phone), "
            "material_images(image_url, sort_order)"
        )
        .eq("id", mat_id)
        .single()
        .execute()
    )

    if not res.data:
        raise AppError("Annonce introuvable.", 404)

    mat = res.data
    mat["institution_name"] = (mat.pop("institution", None) or {}).get("name")
    seller = mat.pop("seller", None) or {}
    mat["seller_name"] = seller.get("full_name")
    mat["seller_phone"] = seller.get("phone")
    images = mat.pop("material_images", []) or []
    images.sort(key=lambda i: i.get("sort_order", 0))
    mat["images"] = images

    return mat


# -------------------------------------------------------------
# Écriture
# -------------------------------------------------------------
REQUIRED_FIELDS = {"title", "category", "transaction_type", "condition"}


def create_material(payload, profile):
    if not isinstance(payload, dict):
        raise AppError("Données invalides.", 400)

    missing = [f for f in REQUIRED_FIELDS if not payload.get(f)]
    if missing:
        raise AppError(f"Champs manquants : {', '.join(missing)}.", 400)

    title = _sanitize_str(payload.get("title"), 200)
    if not title or len(title) < 3:
        raise AppError("Titre invalide (min 3 caractères).", 400)

    category = payload.get("category")
    if category not in ALLOWED_CATEGORIES:
        raise AppError("Catégorie invalide.", 400)

    transaction_type = payload.get("transaction_type")
    if transaction_type not in ALLOWED_TRANSACTIONS:
        raise AppError("Type de transaction invalide.", 400)

    condition = payload.get("condition")
    if condition not in ALLOWED_CONDITIONS:
        raise AppError("État invalide.", 400)

    # Règles métier
    price = payload.get("price")
    rental_period = payload.get("rental_period")

    if transaction_type == "SALE":
        if price is None:
            raise AppError("Le prix est requis pour une vente.", 400)
    elif transaction_type == "RENT":
        if not rental_period:
            raise AppError("La période de location est requise.", 400)
        if price is None:
            raise AppError("Le prix est requis pour une location.", 400)
    else:  # DONATION
        price = None
        rental_period = None

    if price is not None:
        try:
            price = float(price)
            if price < 0:
                raise ValueError
            if price > 100_000_000:
                raise ValueError
        except (TypeError, ValueError):
            raise AppError("Prix invalide.", 400)

    clean = {
        "title": title,
        "description": _sanitize_str(payload.get("description"), 2000),
        "category": category,
        "transaction_type": transaction_type,
        "price": price,
        "rental_period": _sanitize_str(rental_period, 100),
        "condition": condition,
        "institution_id": payload.get("institution_id") or None,
        "seller_id": profile["id"],
        "status": "PENDING",
    }

    supabase = get_supabase_admin()
    res = supabase.table("materials").insert(clean).execute()
    if not res.data:
        raise AppError("Impossible de créer l'annonce.", 500)

    material = res.data[0]

    # Images (optionnel)
    images = payload.get("images") or []
    if isinstance(images, list) and images:
        rows = []
        for idx, img in enumerate(images[:5]):  # max 5 images
            url = _sanitize_str(img.get("image_url") if isinstance(img, dict) else img, 500)
            if url:
                rows.append({
                    "material_id": material["id"],
                    "image_url": url,
                    "sort_order": idx,
                })
        if rows:
            supabase.table("material_images").insert(rows).execute()
            material["images"] = rows

    return material


MATERIAL_EDITABLE_FIELDS = {
    "title", "description", "category", "transaction_type",
    "price", "rental_period", "condition", "institution_id",
    "status",  # autorisé pour seller : SOLD, RENTED, CLOSED uniquement
}

SELLER_ALLOWED_STATUS = {"SOLD", "RENTED", "CLOSED", "PENDING"}


def update_material(mat_id, payload, profile):
    if not isinstance(payload, dict):
        raise AppError("Données invalides.", 400)

    supabase = get_supabase_admin()
    res = (
        supabase.table("materials")
        .select("id, seller_id, status")
        .eq("id", mat_id)
        .single()
        .execute()
    )
    if not res.data:
        raise AppError("Annonce introuvable.", 404)

    mat = res.data
    is_owner = mat["seller_id"] == profile["id"]
    is_admin = profile.get("role") == "ADMIN"
    if not (is_owner or is_admin):
        raise AppError("Accès refusé.", 403)

    clean = {k: v for k, v in payload.items() if k in MATERIAL_EDITABLE_FIELDS}
    if not clean:
        raise AppError("Aucun champ modifiable fourni.", 400)

    # Statut : un étudiant ne peut pas passer à PUBLISHED
    if "status" in clean:
        if not is_admin:
            if clean["status"] not in SELLER_ALLOWED_STATUS:
                raise AppError("Statut non autorisé.", 403)
            if clean["status"] == "PENDING" and mat["status"] != "PENDING":
                raise AppError("Transition de statut invalide.", 400)

    # Validations ciblées
    if "title" in clean:
        clean["title"] = _sanitize_str(clean["title"], 200)
        if not clean["title"] or len(clean["title"]) < 3:
            raise AppError("Titre invalide.", 400)

    if "category" in clean and clean["category"] not in ALLOWED_CATEGORIES:
        raise AppError("Catégorie invalide.", 400)
    if "transaction_type" in clean and clean["transaction_type"] not in ALLOWED_TRANSACTIONS:
        raise AppError("Type invalide.", 400)
    if "condition" in clean and clean["condition"] not in ALLOWED_CONDITIONS:
        raise AppError("État invalide.", 400)

    if "price" in clean and clean["price"] is not None:
        try:
            clean["price"] = float(clean["price"])
            if clean["price"] < 0:
                raise ValueError
        except (TypeError, ValueError):
            raise AppError("Prix invalide.", 400)

    update_res = supabase.table("materials").update(clean).eq("id", mat_id).execute()
    if not update_res.data:
        raise AppError("Mise à jour impossible.", 500)
    return update_res.data[0]


def delete_material(mat_id, profile):
    supabase = get_supabase_admin()
    res = (
        supabase.table("materials")
        .select("id, seller_id")
        .eq("id", mat_id)
        .single()
        .execute()
    )
    if not res.data:
        raise AppError("Annonce introuvable.", 404)

    is_owner = res.data["seller_id"] == profile["id"]
    is_admin = profile.get("role") == "ADMIN"
    if not (is_owner or is_admin):
        raise AppError("Accès refusé.", 403)

    # Suppression en cascade via FK pour material_images
    supabase.table("materials").delete().eq("id", mat_id).execute()
    return True