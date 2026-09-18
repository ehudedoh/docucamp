# institutions.py
from flask import Blueprint
from ..utils.supabase_client import get_supabase_admin
from ..utils.responses import success

bp = Blueprint("institutions", __name__)


@bp.get("")
def list_institutions():
    supabase = get_supabase_admin()
    res = supabase.table("institutions").select("id, name, city, country").order("name").execute()
    return success(res.data or [])