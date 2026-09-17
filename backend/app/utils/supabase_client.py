import os

def get_client():
    try:
        from supabase import create_client
        return create_client(os.getenv('SUPABASE_URL', ''), os.getenv('SUPABASE_KEY', ''))
    except ImportError:
        return None
