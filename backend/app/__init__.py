from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)
    @app.get('/api/health')
    def health():
        return {'status': 'ok'}
    return app
