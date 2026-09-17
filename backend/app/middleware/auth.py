from functools import wraps
from flask import jsonify

def require_auth(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        return view(*args, **kwargs)
    return wrapped
