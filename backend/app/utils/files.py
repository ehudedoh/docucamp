import os
import uuid
from werkzeug.utils import secure_filename


# Signatures magic bytes pour validation MIME réelle
MAGIC_BYTES = {
    "application/pdf": [b"%PDF"],
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/webp": [b"RIFF"],  # + "WEBP" à l'offset 8
}


def is_allowed_mime(mime, allowed):
    return mime in allowed


def file_size_mb(size_bytes):
    return size_bytes / (1024 * 1024)


def check_magic_bytes(header: bytes, mime: str) -> bool:
    """Vérifie que les premiers octets du fichier correspondent au MIME déclaré."""
    if mime not in MAGIC_BYTES:
        return False
    signatures = MAGIC_BYTES[mime]
    if mime == "image/webp":
        return header[:4] == b"RIFF" and header[8:12] == b"WEBP"
    return any(header.startswith(sig) for sig in signatures)


def generate_storage_name(original_filename: str, user_id: str) -> str:
    """
    Génère un nom de stockage sûr :
    <user_id>/<uuid>.<ext>
    Empêche path traversal et collisions.
    """
    _, ext = os.path.splitext(secure_filename(original_filename or ""))
    ext = ext.lower()
    if ext not in {".pdf", ".jpg", ".jpeg", ".png", ".webp"}:
        ext = ".bin"
    return f"{user_id}/{uuid.uuid4().hex}{ext}"