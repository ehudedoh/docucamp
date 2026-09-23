from flask import Flask, jsonify
from flask_cors import CORS
from .config import Config


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # CORS restrictif
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=False,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
    )

    # Rate limiting
    from .middleware.rate_limit import limiter
    limiter.init_app(app)

    # Sécurité (headers)
    from .middleware.security import register_security_headers
    register_security_headers(app)

    # Blueprints
    from .routes.auth import bp as auth_bp
    from .routes.profiles import bp as profiles_bp
    from .routes.institutions import bp as institutions_bp
    from .routes.programs import bp as programs_bp
    from .routes.subjects import bp as subjects_bp
    from .routes.documents import bp as documents_bp
    from .routes.materials import bp as materials_bp
    from .routes.uploads import bp as uploads_bp
    from .routes.admin import bp as admin_bp
    from .routes.favorites import bp as favorites_bp
    from .routes.notifications import bp as notifications_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(profiles_bp, url_prefix="/api/profiles")
    app.register_blueprint(institutions_bp, url_prefix="/api/institutions")
    app.register_blueprint(programs_bp, url_prefix="/api/programs")
    app.register_blueprint(subjects_bp, url_prefix="/api/subjects")
    app.register_blueprint(documents_bp, url_prefix="/api/documents")
    app.register_blueprint(materials_bp, url_prefix="/api/materials")
    app.register_blueprint(uploads_bp, url_prefix="/api/uploads")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(favorites_bp, url_prefix="/api/favorites")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")

    # Gestion d'erreurs globale
    from .utils.errors import register_error_handlers
    register_error_handlers(app)

    @app.route("/api/health")
    def health():
        return jsonify({"success": True, "message": "DocuCamp API is running"}), 200

    return app