import sqlite3
import json
import os
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

class User(UserMixin):
    """User model for Flask-Login"""
    
    def __init__(self, id, username, email, is_admin=False):
        self.id = id
        self.username = username
        self.email = email
        self.is_admin = is_admin
    
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
                # Fix: Access is_admin column directly, with fallback
                is_admin = user_data['is_admin'] if 'is_admin' in user_data.keys() else 0
                return User(
                    user_data['id'], 
                    user_data['username'], 
                    user_data['email'],
                    bool(is_admin)
                )
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
            
            # Create tables with all current columns
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
                    is_admin INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS level_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    room_id INTEGER NOT NULL,
                    level_number INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    data TEXT DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(room_id, level_number)
                )
            ''')
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            return False, str(e)
    
    def migrate_schema(self):
        """Handle database schema migrations for existing databases"""
        try:
            conn = self.get_connection()
            migrations_applied = []
            
            # Check if is_admin column exists in users table
            cursor = conn.execute("PRAGMA table_info(users)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'is_admin' not in columns:
                conn.execute('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0')
                migrations_applied.append('Added is_admin column to users table')
            
            # Check if level_data table exists
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='level_data'")
            if not cursor.fetchone():
                conn.execute('''
                    CREATE TABLE level_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        room_id INTEGER NOT NULL,
                        level_number INTEGER NOT NULL,
                        name TEXT NOT NULL,
                        data TEXT DEFAULT '{}',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(room_id, level_number)
                    )
                ''')
                migrations_applied.append('Created level_data table')
            
            conn.commit()
            conn.close()
            
            if migrations_applied:
                return f"Applied migrations: {', '.join(migrations_applied)}"
            else:
                return True  # No migrations needed
        except Exception as e:
            return False, str(e)
    
    def check_database_exists(self):
        """Check if database file exists and is accessible"""
        try:
            if not os.path.exists(self.database_path):
                return False
            
            # Try to connect and run a simple query
            conn = self.get_connection()
            conn.execute("SELECT 1")
            conn.close()
            return True
        except Exception:
            return False
    
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
            
            print(f"Looking for user: {identifier}")  # Debug logging
            
            if user_data:
                print(f"Found user: {user_data['username']}, checking password...")  # Debug logging
                if check_password_hash(user_data['password_hash'], password):
                    print(f"Password verified for user: {user_data['username']}")  # Debug logging
                    # Fix: Access is_admin column directly, with fallback
                    is_admin = user_data['is_admin'] if 'is_admin' in user_data.keys() else 0
                    conn.close()
                    return User(
                        user_data['id'], 
                        user_data['username'], 
                        user_data['email'],
                        bool(is_admin)
                    )
                else:
                    print(f"Password verification failed for user: {user_data['username']}")  # Debug logging
            else:
                print(f"No user found with identifier: {identifier}")  # Debug logging
            
            conn.close()
            return None
        except Exception as e:
            print(f"Database error in verify_password: {str(e)}")  # Debug logging
            return None
    
    def create_admin(self, username, email, password):
        """Create an admin account if it does not exist"""
        try:
            conn = self.get_connection()
            # Check if any admin exists
            admin = conn.execute(
                'SELECT * FROM users WHERE is_admin = 1'
            ).fetchone()
            if admin:
                conn.close()
                return {'success': False, 'error': 'Admin account already exists'}
            password_hash = generate_password_hash(password)
            conn.execute(
                'INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, 1)',
                (username, email, password_hash)
            )
            conn.commit()
            conn.close()
            return {'success': True}
        except sqlite3.IntegrityError:
            return {'success': False, 'error': 'Username or email already exists'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
