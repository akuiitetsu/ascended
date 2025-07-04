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
            
            # Check if user_room_progress table exists
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_room_progress'")
            if not cursor.fetchone():
                conn.execute('''
                    CREATE TABLE user_room_progress (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        room_number INTEGER NOT NULL,
                        room_name TEXT,
                        completion_status TEXT DEFAULT 'not_started',
                        completion_percentage INTEGER DEFAULT 0,
                        time_spent INTEGER DEFAULT 0,
                        best_score INTEGER DEFAULT 0,
                        attempts INTEGER DEFAULT 0,
                        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        completed_at TIMESTAMP NULL,
                        room_data TEXT DEFAULT '{}',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id),
                        UNIQUE(user_id, room_number)
                    )
                ''')
                migrations_applied.append('Created user_room_progress table')
            
            # Check if user_achievements table exists
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_achievements'")
            if not cursor.fetchone():
                conn.execute('''
                    CREATE TABLE user_achievements (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        achievement_type TEXT NOT NULL,
                        achievement_name TEXT NOT NULL,
                        description TEXT,
                        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        room_number INTEGER,
                        metadata TEXT DEFAULT '{}',
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                ''')
                migrations_applied.append('Created user_achievements table')
            
            # Check if user_sessions table exists
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_sessions'")
            if not cursor.fetchone():
                conn.execute('''
                    CREATE TABLE user_sessions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        session_end TIMESTAMP NULL,
                        total_time INTEGER DEFAULT 0,
                        rooms_visited TEXT DEFAULT '[]',
                        actions_count INTEGER DEFAULT 0,
                        ip_address TEXT,
                        user_agent TEXT,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                ''')
                migrations_applied.append('Created user_sessions table')
            
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
    
    def save_user_room_progress(self, user_id, room_number, progress_data):
        """Save or update user progress for a specific room"""
        try:
            conn = self.get_connection()
            
            # Extract progress details
            completion_status = progress_data.get('status', 'in_progress')
            completion_percentage = min(100, max(0, progress_data.get('completion_percentage', 0)))
            time_spent = progress_data.get('time_spent', 0)
            score = progress_data.get('score', 0)
            room_name = progress_data.get('room_name', f'Room {room_number}')
            room_data = json.dumps(progress_data.get('room_data', {}))
            
            # Check if progress already exists
            existing = conn.execute(
                'SELECT id, attempts, best_score FROM user_room_progress WHERE user_id = ? AND room_number = ?',
                (user_id, room_number)
            ).fetchone()
            
            if existing:
                # Update existing progress
                new_attempts = existing['attempts'] + (1 if completion_status == 'completed' else 0)
                new_best_score = max(existing['best_score'], score)
                completed_at = 'CURRENT_TIMESTAMP' if completion_status == 'completed' else None
                
                if completed_at:
                    conn.execute('''
                        UPDATE user_room_progress 
                        SET completion_status = ?, completion_percentage = ?, time_spent = time_spent + ?, 
                            best_score = ?, attempts = ?, room_data = ?, last_accessed = CURRENT_TIMESTAMP,
                            completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = ? AND room_number = ?
                    ''', (completion_status, completion_percentage, time_spent, new_best_score, 
                          new_attempts, room_data, user_id, room_number))
                else:
                    conn.execute('''
                        UPDATE user_room_progress 
                        SET completion_status = ?, completion_percentage = ?, time_spent = time_spent + ?, 
                            best_score = ?, room_data = ?, last_accessed = CURRENT_TIMESTAMP,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = ? AND room_number = ?
                    ''', (completion_status, completion_percentage, time_spent, new_best_score, 
                          room_data, user_id, room_number))
            else:
                # Insert new progress
                attempts = 1 if completion_status == 'completed' else 0
                completed_at_value = 'CURRENT_TIMESTAMP' if completion_status == 'completed' else None
                
                if completed_at_value:
                    conn.execute('''
                        INSERT INTO user_room_progress 
                        (user_id, room_number, room_name, completion_status, completion_percentage, 
                         time_spent, best_score, attempts, room_data, completed_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ''', (user_id, room_number, room_name, completion_status, completion_percentage,
                          time_spent, score, attempts, room_data))
                else:
                    conn.execute('''
                        INSERT INTO user_room_progress 
                        (user_id, room_number, room_name, completion_status, completion_percentage, 
                         time_spent, best_score, attempts, room_data)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (user_id, room_number, room_name, completion_status, completion_percentage,
                          time_spent, score, attempts, room_data))
            
            conn.commit()
            conn.close()
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_user_room_progress(self, user_id, room_number=None):
        """Get user progress for specific room or all rooms"""
        try:
            conn = self.get_connection()
            
            if room_number:
                progress = conn.execute(
                    'SELECT * FROM user_room_progress WHERE user_id = ? AND room_number = ?',
                    (user_id, room_number)
                ).fetchone()
                conn.close()
                
                if progress:
                    return {
                        'success': True,
                        'progress': dict(progress)
                    }
                else:
                    return {'success': True, 'progress': None}
            else:
                # Get all room progress for user
                progress_list = conn.execute(
                    'SELECT * FROM user_room_progress WHERE user_id = ? ORDER BY room_number',
                    (user_id,)
                ).fetchall()
                conn.close()
                
                return {
                    'success': True,
                    'progress': [dict(row) for row in progress_list]
                }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def save_user_achievement(self, user_id, achievement_type, achievement_name, description="", room_number=None, metadata=None):
        """Save a new achievement for user"""
        try:
            conn = self.get_connection()
            
            # Check if achievement already exists
            existing = conn.execute(
                'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_type = ? AND achievement_name = ?',
                (user_id, achievement_type, achievement_name)
            ).fetchone()
            
            if existing:
                return {'success': True, 'message': 'Achievement already exists'}
            
            metadata_json = json.dumps(metadata or {})
            
            conn.execute('''
                INSERT INTO user_achievements 
                (user_id, achievement_type, achievement_name, description, room_number, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_id, achievement_type, achievement_name, description, room_number, metadata_json))
            
            conn.commit()
            conn.close()
            return {'success': True, 'message': 'Achievement saved'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_user_achievements(self, user_id):
        """Get all achievements for a user"""
        try:
            conn = self.get_connection()
            achievements = conn.execute(
                'SELECT * FROM user_achievements WHERE user_id = ? ORDER BY earned_at DESC',
                (user_id,)
            ).fetchall()
            conn.close()
            
            return {
                'success': True,
                'achievements': [dict(row) for row in achievements]
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def start_user_session(self, user_id, ip_address=None, user_agent=None):
        """Start a new user session"""
        try:
            conn = self.get_connection()
            
            cursor = conn.execute('''
                INSERT INTO user_sessions (user_id, ip_address, user_agent)
                VALUES (?, ?, ?)
            ''', (user_id, ip_address, user_agent))
            
            session_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return {'success': True, 'session_id': session_id}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def update_user_session(self, session_id, rooms_visited=None, actions_count=None):
        """Update user session with activity data"""
        try:
            conn = self.get_connection()
            
            updates = []
            params = []
            
            if rooms_visited is not None:
                updates.append('rooms_visited = ?')
                params.append(json.dumps(rooms_visited))
            
            if actions_count is not None:
                updates.append('actions_count = ?')
                params.append(actions_count)
            
            if updates:
                params.append(session_id)
                conn.execute(f'''
                    UPDATE user_sessions 
                    SET {', '.join(updates)}
                    WHERE id = ?
                ''', params)
                
                conn.commit()
            
            conn.close()
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def end_user_session(self, session_id):
        """End a user session"""
        try:
            conn = self.get_connection()
            
            # Calculate total time
            conn.execute('''
                UPDATE user_sessions 
                SET session_end = CURRENT_TIMESTAMP,
                    total_time = (strftime('%s', 'now') - strftime('%s', session_start))
                WHERE id = ?
            ''', (session_id,))
            
            conn.commit()
            conn.close()
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_user_statistics(self, user_id):
        """Get comprehensive user statistics"""
        try:
            conn = self.get_connection()
            
            # Basic progress stats
            progress_stats = conn.execute('''
                SELECT 
                    COUNT(*) as rooms_attempted,
                    COUNT(CASE WHEN completion_status = 'completed' THEN 1 END) as rooms_completed,
                    AVG(completion_percentage) as avg_completion,
                    SUM(time_spent) as total_time,
                    MAX(best_score) as highest_score,
                    SUM(attempts) as total_attempts
                FROM user_room_progress 
                WHERE user_id = ?
            ''', (user_id,)).fetchone()
            
            # Achievement stats
            achievement_stats = conn.execute('''
                SELECT 
                    COUNT(*) as total_achievements,
                    COUNT(CASE WHEN achievement_type = 'room_completion' THEN 1 END) as room_achievements,
                    COUNT(CASE WHEN achievement_type = 'score_milestone' THEN 1 END) as score_achievements
                FROM user_achievements 
                WHERE user_id = ?
            ''', (user_id,)).fetchone()
            
            # Session stats
            session_stats = conn.execute('''
                SELECT 
                    COUNT(*) as total_sessions,
                    AVG(total_time) as avg_session_time,
                    SUM(total_time) as total_session_time,
                    MAX(actions_count) as max_actions_per_session
                FROM user_sessions 
                WHERE user_id = ? AND session_end IS NOT NULL
            ''', (user_id,)).fetchone()
            
            conn.close()
            
            return {
                'success': True,
                'statistics': {
                    'progress': dict(progress_stats) if progress_stats else {},
                    'achievements': dict(achievement_stats) if achievement_stats else {},
                    'sessions': dict(session_stats) if session_stats else {}
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
