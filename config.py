import os
import secrets

class Config:
    """Base configuration class"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(16)
    DATABASE = os.environ.get('DATABASE_URL') or 'database/ascended_prototype.db'
    
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
    SECRET_KEY = os.environ.get('SECRET_KEY')
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
