from ..utils.supabase_client import get_supabase_admin


def create_notification(user_id, type_, title, message=None, link=None, reason=None):
    supabase = get_supabase_admin()
    try:
        supabase.table("notifications").insert({
            "user_id": user_id,
            "type": type_,
            "title": title,
            "message": message,
            "link": link,
            "reason": reason,
        }).execute()
    except Exception:
        # Ne jamais casser l'action principale
        pass


def list_notifications(profile, only_unread=False):
    supabase = get_supabase_admin()
    q = (
        supabase.table("notifications")
        .select("id, type, title, message, link, reason, read, created_at")
        .eq("user_id", profile["id"])
        .order("created_at", desc=True)
        .limit(50)
    )
    if only_unread:
        q = q.eq("read", False)
    return q.execute().data or []


def mark_read(profile, notification_id=None, mark_all=False):
    supabase = get_supabase_admin()
    q = supabase.table("notifications").update({"read": True}).eq("user_id", profile["id"])
    if not mark_all:
        q = q.eq("id", notification_id)
    q.execute()
    return True


def unread_count(profile):
    supabase = get_supabase_admin()
    res = (
        supabase.table("notifications")
        .select("id", count="exact")
        .eq("user_id", profile["id"])
        .eq("read", False)
        .execute()
    )
    return res.count or 0