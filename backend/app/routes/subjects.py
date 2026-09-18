"""Stub temporaire — sera complété si nécessaire."""
from flask import Blueprint, request
from ..utils.supabase_client import get_supabase_admin
from ..utils.responses import success

bp = Blueprint("subjects", __name__)


@bp.get("")
def list_subjects():
    program_id = request.args.get("program_id")
    supabase = get_supabase_admin()
    query = supabase.table("subjects").select("id, name, code, program_id").order("name")
    if program_id:
        query = query.eq("program_id", program_id)
    res = query.execute()
    return success(res.data or [])