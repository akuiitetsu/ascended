import os
import secrets

class Config:
    """Base configuration class"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(16)
    DATABASE = os.environ.get('DATABASE_URL') or 'database/ascended_prototype.db'
    
    # Flask-Login configuration
    LOGIN_VIEW = 'login'
    LOGIN_MESSAGE = 'Please log in to access this page.'
    REMEMBER_COOKIE_DURATION = 86400  # 24 hours
    
    # Admin account defaults (can be overridden by environment variables)
    DEFAULT_ADMIN_USERNAME = 'admin'
    DEFAULT_ADMIN_EMAIL = 'admin@ascended.local'
    DEFAULT_ADMIN_PASSWORD = 'admin123'
    
    # Database configuration
    DATABASE_DIR = 'database'
    
    # File paths for verification
    REQUIRED_FILES = [
        'index.html',
        'static/js/main.js', 
        'static/css/main.css',
        'database/schema.sql'
    ]
    
    # Static file locations
    STATIC_FILE_PATHS = [
        'index.html',           # Root directory
        'static/index.html',    # Static directory
        'templates/index.html'  # Templates directory
    ]

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    HOST = 'localhost'
    PORT = 5000

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    HOST = '0.0.0.0'
    PORT = int(os.environ.get('PORT', 5000))
    SECRET_KEY = os.urandom(24)
    if not SECRET_KEY:
        raise ValueError("No SECRET_KEY set for production environment")

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DATABASE = ':memory:'  # Use in-memory database for testing

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
