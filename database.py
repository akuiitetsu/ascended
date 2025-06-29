import sqlite3
import json
import os
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

class User(UserMixin):
    """User model for Flask-Login"""
    
    def __init__(self, id, username, email):
        self.id = id
        self.username = username
        self.email = email
    
    def get_id(self):
        return str(self.id)
    
    @staticmethod
    def get(user_id, db_manager):
        """Get user by ID"""
        try:
            conn = db_manager.get_connection()
            user_data = conn.execute(
                'SELECT * FROM users WHERE id = ?', (user_id,)
            ).fetchone()
            conn.close()
            
            if user_data:
                return User(user_data['id'], user_data['username'], user_data['email'])
            return None
        except Exception:
            return None

class DatabaseManager:
    """Database manager for the Ascended game"""
    
    def __init__(self, database_path, database_dir='database'):
        self.database_path = database_path
        self.database_dir = database_dir
    
    def get_connection(self):
        """Get database connection"""
        try:
            conn = sqlite3.connect(self.database_path)
            conn.row_factory = sqlite3.Row
            return conn
        except Exception as e:
            raise Exception(f"Database connection failed: {str(e)}")
    
    def init_database(self):
        """Initialize the database with required tables"""
        try:
            # Ensure database directory exists
            os.makedirs(self.database_dir, exist_ok=True)
            
            conn = self.get_connection()
            
            # Create tables
            conn.execute('''
                CREATE TABLE IF NOT EXISTS game_state (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT UNIQUE,
                    current_level INTEGER DEFAULT 1,
                    progress TEXT DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS user_progress (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT,
                    level_completed INTEGER,
                    completion_time REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE,
                    email TEXT UNIQUE,
                    password_hash TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            return False, str(e)
    
    def test_connection(self):
        """Test database connection and return status info"""
        try:
            conn = self.get_connection()
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            conn.close()
            return {
                'connected': True,
                'tables': tables,
                'count': len(tables)
            }
        except Exception as e:
            return {
                'connected': False,
                'error': str(e)
            }
    
    def save_progress(self, session_id, level, progress):
        """Save game progress"""
        try:
            progress_json = json.dumps(progress)
            conn = self.get_connection()
            conn.execute('''
                INSERT OR REPLACE INTO game_state (session_id, current_level, progress, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ''', (session_id, level, progress_json))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            raise Exception(f"Failed to save progress: {str(e)}")
    
    def load_progress(self, session_id):
        """Load game progress"""
        try:
            conn = self.get_connection()
            cursor = conn.execute(
                'SELECT current_level, progress FROM game_state WHERE session_id = ?',
                (session_id,)
            )
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return {
                    'found': True,
                    'level': row[0],
                    'progress': json.loads(row[1])
                }
            else:
                return {'found': False}
        except Exception as e:
            raise Exception(f"Failed to load progress: {str(e)}")
    
    def register_user(self, username, email, password):
        """Register a new user"""
        try:
            password_hash = generate_password_hash(password)
            conn = self.get_connection()
            try:
                conn.execute(
                    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                    (username, email, password_hash)
                )
                conn.commit()
                return {'success': True}
            except sqlite3.IntegrityError:
                return {'success': False, 'error': 'Username or email already exists'}
            finally:
                conn.close()
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def authenticate_user(self, identifier, password):
        """Authenticate user by email or username"""
        try:
            conn = self.get_connection()
            user = conn.execute(
                'SELECT * FROM users WHERE email = ? OR username = ?', 
                (identifier, identifier)
            ).fetchone()
            conn.close()
            
            if user and check_password_hash(user['password_hash'], password):
                return {
                    'success': True,
                    'user': {
                        'id': user['id'],
                        'username': user['username'],
                        'email': user['email']
                    }
                }
            return {'success': False, 'error': 'Invalid credentials'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_user_by_id(self, user_id):
        """Get user by ID for Flask-Login"""
        return User.get(user_id, self)
    
    def get_user_by_email_or_username(self, identifier):
        """Get user by email or username"""
        try:
            conn = self.get_connection()
            user_data = conn.execute(
                'SELECT * FROM users WHERE email = ? OR username = ?', 
                (identifier, identifier)
            ).fetchone()
            conn.close()
            
            if user_data:
                return User(user_data['id'], user_data['username'], user_data['email'])
            return None
        except Exception:
            return None
    
    def verify_password(self, identifier, password):
        """Verify user password"""
        try:
            conn = self.get_connection()
            user_data = conn.execute(
                'SELECT * FROM users WHERE email = ? OR username = ?', 
                (identifier, identifier)
            ).fetchone()
            conn.close()
            
            if user_data and check_password_hash(user_data['password_hash'], password):
                return User(user_data['id'], user_data['username'], user_data['email'])
            return None
        except Exception:
            return None
