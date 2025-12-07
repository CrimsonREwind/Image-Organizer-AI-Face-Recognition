"""Flask application factory."""
import os
from flask import Flask
from flask_cors import CORS
from flask_pymongo import PyMongo

from config import config

mongo = PyMongo()


def create_app(config_name=None):
    """Create and configure the Flask application."""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Get allowed origins from environment or use defaults
    allowed_origins = os.environ.get('ALLOWED_ORIGINS', '').split(',')
    default_origins = ["http://localhost:3000", "http://localhost:5173"]
    
    # Filter out empty strings and combine with defaults
    allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]
    all_origins = list(set(default_origins + allowed_origins))
    
    # Initialize extensions
    CORS(app, resources={
        r"/api/*": {
            "origins": all_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    
    mongo.init_app(app)
    
    # Initialize Cloudinary
    from app.services.cloudinary_service import init_cloudinary
    init_cloudinary(app.config)
    
    # Register blueprints
    from app.routes.people import people_bp
    from app.routes.images import images_bp
    from app.routes.stats import stats_bp
    
    app.register_blueprint(people_bp, url_prefix='/api/people')
    app.register_blueprint(images_bp, url_prefix='/api/images')
    app.register_blueprint(stats_bp, url_prefix='/api/stats')
    
    # Health check route
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'message': 'Image Organizer API is running'}
    
    return app
