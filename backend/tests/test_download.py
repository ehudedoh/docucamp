"""
Tests du téléchargement de documents (Supabase simulé).
Vérifie notamment la régression : download_document doit RETOURNER l'URL.
"""
from unittest.mock import MagicMock, patch
import pytest

from app import create_app
from app.utils.errors import AppError
from app.services import document_service, storage_service


@pytest.fixture
def app():
    app = create_app()
    app.config.update(TESTING=True, SUPABASE_URL="https://proj.supabase.co")
    return app


def _fake_supabase(doc):
    sb = MagicMock()
    sb.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = \
        MagicMock(data=[doc] if doc else [])
    return sb


DOC = {"id": "d1", "status": "PUBLISHED", "file_url": "u/abc.pdf",
       "file_name": "Examen L3.pdf", "file_size": 1234, "download_count": 2}


def test_download_returns_url_and_filename(app):
    sb = _fake_supabase(DOC)
    with app.app_context(), \
         patch.object(document_service, "get_supabase_admin", return_value=sb), \
         patch.object(document_service, "create_signed_url", return_value="https://x/y?token=t&download=a") as csu:
        out = document_service.download_document("d1", {"id": "user-1"})
    assert out["url"].startswith("https://")
    assert out["file_name"] == "Examen L3.pdf"
    assert out["file_size"] == 1234
    csu.assert_called_once()
    # historique + compteur tentés
    sb.rpc.assert_called_once_with("increment_download_count", {"p_resource_id": "d1"})
    sb.table.return_value.insert.assert_called_once_with({"user_id": "user-1", "resource_id": "d1"})


def test_download_anonymous_skips_history(app):
    sb = _fake_supabase(DOC)
    with app.app_context(), \
         patch.object(document_service, "get_supabase_admin", return_value=sb), \
         patch.object(document_service, "create_signed_url", return_value="https://x/y"):
        document_service.download_document("d1", None)
    sb.table.return_value.insert.assert_not_called()


def test_download_survives_missing_history_table(app):
    sb = _fake_supabase(DOC)
    sb.table.return_value.insert.return_value.execute.side_effect = Exception("relation does not exist")
    sb.rpc.return_value.execute.side_effect = Exception("function does not exist")
    with app.app_context(), \
         patch.object(document_service, "get_supabase_admin", return_value=sb), \
         patch.object(document_service, "create_signed_url", return_value="https://x/y"):
        out = document_service.download_document("d1", {"id": "u"})
    assert out["url"] == "https://x/y"     # le téléchargement n'est jamais bloqué


def test_download_unpublished_forbidden(app):
    sb = _fake_supabase({**DOC, "status": "PENDING"})
    with app.app_context(), patch.object(document_service, "get_supabase_admin", return_value=sb):
        with pytest.raises(AppError) as e:
            document_service.download_document("d1")
    assert e.value.status == 403


def test_download_not_found(app):
    sb = _fake_supabase(None)
    with app.app_context(), patch.object(document_service, "get_supabase_admin", return_value=sb):
        with pytest.raises(AppError) as e:
            document_service.download_document("nope")
    assert e.value.status == 404


@pytest.mark.parametrize("sdk_value,expected_prefix", [
    ("https://proj.supabase.co/storage/v1/object/sign/documents/a.pdf?token=t",
     "https://proj.supabase.co/storage/v1/object/sign/documents/a.pdf?token=t"),
    ("/object/sign/documents/a.pdf?token=t",
     "https://proj.supabase.co/storage/v1/object/sign/documents/a.pdf?token=t"),
    ("/storage/v1/object/sign/documents/a.pdf?token=t",
     "https://proj.supabase.co/storage/v1/object/sign/documents/a.pdf?token=t"),
])
def test_signed_url_is_absolute_and_forces_download(app, sdk_value, expected_prefix):
    sb = MagicMock()
    sb.storage.from_.return_value.create_signed_url.return_value = {"signedURL": sdk_value}
    with app.app_context(), patch.object(storage_service, "get_supabase_admin", return_value=sb):
        url = storage_service.create_signed_url("documents", "a.pdf", 60, download_name="Examen L3.pdf")
    assert url.startswith(expected_prefix)
    assert url.endswith("&download=Examen%20L3.pdf")


def test_download_route_is_public_and_returns_data(app):
    client = app.test_client()
    with patch.object(document_service, "get_supabase_admin", return_value=_fake_supabase(DOC)), \
         patch.object(document_service, "create_signed_url", return_value="https://x/y"):
        r = client.post("/api/documents/d1/download")   # sans token
    assert r.status_code == 200
    body = r.get_json()
    assert body["success"] is True
    assert body["data"]["url"] == "https://x/y"
