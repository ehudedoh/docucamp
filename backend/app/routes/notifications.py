from flask import Blueprint, request, g
from ..middleware.auth import require_auth
from ..services.notification_service import (
    list_notifications, mark_read, unread_count
)
from ..utils.responses import success

bp = Blueprint("notifications", __name__)


@bp.get("")
@require_auth
def list_():
    only_unread = request.args.get("unread") == "1"
    return success(list_notifications(g.profile, only_unread))


@bp.get("/unread-count")
@require_auth
def count_():
    return success({"count": unread_count(g.profile)})


@bp.patch("/<notification_id>/read")
@require_auth
def mark_one(notification_id):
    mark_read(g.profile, notification_id)
    return success(message="Notification lue.")


@bp.patch("/read-all")
@require_auth
def mark_all():
    mark_read(g.profile, mark_all=True)
    return success(message="Toutes les notifications sont lues.")