"""Stub temporaire — sera complété en Phase 4."""
from ..utils.errors import AppError


def list_documents(_args):
    raise AppError("Non implémenté.", 501)


def get_document(_doc_id):
    raise AppError("Non implémenté.", 501)


def create_document(_payload, _profile):
    raise AppError("Non implémenté.", 501)


def update_document(_doc_id, _payload, _profile):
    raise AppError("Non implémenté.", 501)


def delete_document(_doc_id, _profile):
    raise AppError("Non implémenté.", 501)


def download_document(_doc_id):
    raise AppError("Non implémenté.", 501)