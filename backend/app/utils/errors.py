import logging
from werkzeug.exceptions import HTTPException
from .responses import error

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Erreur métier contrôlée, à exposer au client."""
    def __init__(self, message, status=400, details=None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.details = details


def register_error_handlers(app):
    @app.errorhandler(AppError)
    def handle_app_error(e):
        return error(e.message, status=e.status, details=e.details)

    @app.errorhandler(HTTPException)
    def handle_http(e):
        return error(e.description or "Erreur HTTP", status=e.code)

    @app.errorhandler(Exception)
    def handle_unexpected(e):
        logger.exception("Unhandled exception")
        return error("Une erreur interne est survenue.", status=500)