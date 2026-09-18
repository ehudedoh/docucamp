# programs.py
from flask import Blueprint, request
from ..utils.supabase_client import get_supabase_admin
from ..utils.responses import success

bp = Blueprint("programs", __name__)


@bp.get("")
def list_programs():
    institution_id = request.args.get("institution_id")
    supabase = get_supabase_admin()
    query = supabase.table("programs").select("id, name, institution_id").order("name")
    if institution_id:
        query = query.eq("institution_id", institution_id)
    res = query.execute()
    return success(res.data or [])