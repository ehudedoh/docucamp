import os
import uuid
from urllib.parse import quote
from flask import current_app
from werkzeug.utils import secure_filename

from ..utils.supabase_client import get_supabase_admin
from ..utils.errors import AppError
from ..utils.files import check_magic_bytes, generate_storage_name


DOCUMENTS_BUCKET = "documents"
IMAGES_BUCKET = "material-images"


def _read_header(file_stream, n=16):
    pos = file_stream.tell()
    header = file_stream.read(n)
    file_stream.seek(pos)
    return header


def upload_document(file, user_id: str) -> dict:
    """
    Upload sécurisé d'un document PDF.
    Retourne : { file_url, file_name, file_size, storage_path }
    """
    if not file or not file.filename:
        raise AppError("Aucun fichier fourni.", 400)

    # 1. Vérifier la taille AVANT lecture complète
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)

    max_bytes = current_app.config["MAX_DOCUMENT_SIZE_MB"] * 1024 * 1024
    if size <= 0:
        raise AppError("Fichier vide.", 400)
    if size > max_bytes:
        raise AppError(
            f"Fichier trop volumineux (max {current_app.config['MAX_DOCUMENT_SIZE_MB']} Mo).",
            413,
        )

    # 2. Vérifier le MIME déclaré
    mime = (file.mimetype or "").lower()
    if mime not in current_app.config["ALLOWED_DOCUMENT_MIME"]:
        raise AppError("Type de fichier non autorisé (PDF uniquement).", 415)

    # 3. Vérifier les magic bytes (anti-spoofing)
    header = _read_header(file, 8)
    if not check_magic_bytes(header, mime):
        raise AppError("Le contenu du fichier ne correspond pas au type déclaré.", 415)

    # 4. Nom de stockage généré côté serveur
    original_name = secure_filename(file.filename)
    storage_path = generate_storage_name(original_name, user_id)

    # 5. Upload via Supabase Storage (service_role)
    supabase = get_supabase_admin()
    try:
        file.seek(0)
        content = file.read()
        supabase.storage.from_(DOCUMENTS_BUCKET).upload(
            path=storage_path,
            file=content,
            file_options={
                "content-type": mime,
                "cache-control": "3600",
                "upsert": "false",
            },
        )
    except Exception as e:
        current_app.logger.exception("Erreur upload Supabase")
        raise AppError("Impossible d'enregistrer le fichier.", 500)

    return {
        "file_url": storage_path,   # on stocke le path, pas l'URL signée
        "file_name": original_name,
        "file_size": size,
        "storage_path": storage_path,
    }


def upload_material_image(file, user_id: str) -> dict:
    """Upload sécurisé d'une image d'annonce."""
    if not file or not file.filename:
        raise AppError("Aucun fichier fourni.", 400)

    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)

    max_bytes = current_app.config["MAX_IMAGE_SIZE_MB"] * 1024 * 1024
    if size <= 0:
        raise AppError("Fichier vide.", 400)
    if size > max_bytes:
        raise AppError(
            f"Image trop volumineuse (max {current_app.config['MAX_IMAGE_SIZE_MB']} Mo).",
            413,
        )

    mime = (file.mimetype or "").lower()
    if mime not in current_app.config["ALLOWED_IMAGE_MIME"]:
        raise AppError("Format d'image non autorisé (JPEG, PNG, WEBP).", 415)

    header = _read_header(file, 16)
    if not check_magic_bytes(header, mime):
        raise AppError("Contenu de l'image invalide.", 415)

    original_name = secure_filename(file.filename)
    storage_path = generate_storage_name(original_name, user_id)

    supabase = get_supabase_admin()
    try:
        file.seek(0)
        content = file.read()
        supabase.storage.from_(IMAGES_BUCKET).upload(
            path=storage_path,
            file=content,
            file_options={"content-type": mime, "upsert": "false"},
        )
    except Exception:
        current_app.logger.exception("Erreur upload image")
        raise AppError("Impossible d'enregistrer l'image.", 500)

    # Bucket public → URL directe
    public_url = supabase.storage.from_(IMAGES_BUCKET).get_public_url(storage_path)

    return {
        "image_url": public_url,
        "storage_path": storage_path,
    }


def create_signed_url(bucket: str, path: str, expires_in: int = 3600,
                      download_name: str | None = None) -> str:
    """
    Génère une URL signée temporaire pour un fichier privé.
    - Retourne toujours une URL ABSOLUE (certaines versions du SDK renvoient
      un chemin relatif « /object/sign/... »).
    - Si `download_name` est fourni, Supabase répond avec
      Content-Disposition: attachment → le navigateur télécharge au lieu
      d'ouvrir le PDF dans l'onglet.
    """
    supabase = get_supabase_admin()
    try:
        res = supabase.storage.from_(bucket).create_signed_url(path, expires_in)
        # Selon la version : {"signedURL": ...} / {"signedUrl": ...} / {"signed_url": ...}
        url = res.get("signedURL") or res.get("signedUrl") or res.get("signed_url")
    except Exception:
        current_app.logger.exception("Erreur signed URL (bucket=%s, path=%s)", bucket, path)
        raise AppError("Fichier introuvable ou URL de téléchargement indisponible.", 500)

    if not url:
        raise AppError("Impossible de générer l'URL de téléchargement.", 500)

    # URL relative → absolue
    if not url.startswith("http"):
        base = (current_app.config.get("SUPABASE_URL") or "").rstrip("/")
        if not url.startswith("/"):
            url = "/" + url
        if not url.startswith("/storage/v1"):
            url = "/storage/v1" + url
        url = base + url

    if download_name:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}download={quote(download_name)}"

    return url
