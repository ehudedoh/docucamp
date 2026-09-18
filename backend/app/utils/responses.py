from flask import jsonify


def success(data=None, message=None, status=200):
    payload = {"success": True}
    if data is not None:
        payload["data"] = data
    if message:
        payload["message"] = message
    return jsonify(payload), status


def error(message="Une erreur est survenue.", status=400, details=None):
    payload = {"success": False, "message": message}
    if details:
        payload["details"] = details
    return jsonify(payload), status