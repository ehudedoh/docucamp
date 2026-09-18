import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    FLASK_ENV = os.getenv("FLASK_ENV", "development")

    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    MAX_DOCUMENT_SIZE_MB = int(os.getenv("MAX_DOCUMENT_SIZE_MB", "20"))
    MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", "5"))

    ALLOWED_DOCUMENT_MIME = [m.strip() for m in os.getenv("ALLOWED_DOCUMENT_MIME", "application/pdf").split(",")]
    ALLOWED_IMAGE_MIME = [m.strip() for m in os.getenv("ALLOWED_IMAGE_MIME", "image/jpeg,image/png,image/webp").split(",")]

    RATE_LIMIT_AUTH = os.getenv("RATE_LIMIT_AUTH", "10 per minute")
    RATE_LIMIT_UPLOAD = os.getenv("RATE_LIMIT_UPLOAD", "20 per hour")
    RATE_LIMIT_REPORT = os.getenv("RATE_LIMIT_REPORT", "30 per hour")
    RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "200 per hour")

    @property
    def is_production(self):
        return self.FLASK_ENV == "production"