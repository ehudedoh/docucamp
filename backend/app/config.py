import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'change-me')
    SUPABASE_URL = os.getenv('SUPABASE_URL', '')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')
