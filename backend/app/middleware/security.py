def apply_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    return response
