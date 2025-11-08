import os

class Config:
    """Configuration class for Flask application"""
    SECRET_KEY = '46d77a9ec3a06af27bcdd45169cc203c'
    
    # sql connextion
    SQLALCHEMY_DATABASE_URI = '--'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False  
    
    # folder path to save pharmacy and manufacturer's uploaded files
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  
