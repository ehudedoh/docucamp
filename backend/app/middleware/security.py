def register_security_headers(app):
    @app.after_request
    def set_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["X-Frame-Options"] = "DENY"
        if app.config.get("FLASK_ENV") == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        return response