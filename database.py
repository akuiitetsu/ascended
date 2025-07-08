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
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS badges (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    icon TEXT,
                    room_id INTEGER DEFAULT 0,
                    requirement_type TEXT DEFAULT 'completion',
                    requirement_value TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS user_room_progress (
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
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS user_achievements (
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
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS user_sessions (
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
            
            # Check if badges table exists and has required columns
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='badges'")
            if cursor.fetchone():
                # Check if room_id column exists in badges table
                cursor = conn.execute("PRAGMA table_info(badges)")
                badge_columns = [column[1] for column in cursor.fetchall()]
                
                if 'room_id' not in badge_columns:
                    conn.execute('ALTER TABLE badges ADD COLUMN room_id INTEGER DEFAULT 0')
                    migrations_applied.append('Added room_id column to badges table')
                
                if 'requirement_type' not in badge_columns:
                    conn.execute('ALTER TABLE badges ADD COLUMN requirement_type TEXT DEFAULT \'completion\'')
                    migrations_applied.append('Added requirement_type column to badges table')
                
                if 'requirement_value' not in badge_columns:
                    conn.execute('ALTER TABLE badges ADD COLUMN requirement_value TEXT')
                    migrations_applied.append('Added requirement_value column to badges table')
            
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
        """Save or update user progress for a specific room with detailed tracking"""
        try:
            conn = self.get_connection()
            
            # Extract detailed progress information
            completion_status = progress_data.get('status', 'in_progress')
            
            # Calculate weighted completion percentage
            completion_percentage = self._calculate_completion_percentage(progress_data)
            
            time_spent = progress_data.get('time_spent', 0)
            score = progress_data.get('score', 0)
            room_name = progress_data.get('room_name', f'Room {room_number}')
            
            # Enhanced room data tracking
            room_data = {
                'puzzles_completed': progress_data.get('puzzles_completed', []),
                'challenges_solved': progress_data.get('challenges_solved', []),
                'secrets_found': progress_data.get('secrets_found', []),
                'items_collected': progress_data.get('items_collected', []),
                'deaths': progress_data.get('deaths', 0),
                'hints_used': progress_data.get('hints_used', 0),
                'current_checkpoint': progress_data.get('current_checkpoint', 0),
                'exploration_percentage': progress_data.get('exploration_percentage', 0),
                'skill_points_earned': progress_data.get('skill_points_earned', 0),
                'objectives_completed': progress_data.get('objectives_completed', []),
                'last_position': progress_data.get('last_position', {}),
                'game_state': progress_data.get('game_state', {}),
                **progress_data.get('room_data', {})
            }
            room_data_json = json.dumps(room_data)
            
            # Check if progress already exists
            existing = conn.execute(
                'SELECT id, attempts, best_score, time_spent as existing_time FROM user_room_progress WHERE user_id = ? AND room_number = ?',
                (user_id, room_number)
            ).fetchone()
            
            if existing:
                # Update existing progress
                new_attempts = existing['attempts'] + (1 if completion_status == 'completed' else 0)
                new_best_score = max(existing['best_score'], score)
                total_time_spent = existing['existing_time'] + time_spent
                
                if completion_status == 'completed':
                    conn.execute('''
                        UPDATE user_room_progress 
                        SET completion_status = ?, completion_percentage = ?, time_spent = ?, 
                            best_score = ?, attempts = ?, room_data = ?, last_accessed = CURRENT_TIMESTAMP,
                            completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = ? AND room_number = ?
                    ''', (completion_status, completion_percentage, total_time_spent, new_best_score, 
                          new_attempts, room_data_json, user_id, room_number))
                else:
                    conn.execute('''
                        UPDATE user_room_progress 
                        SET completion_status = ?, completion_percentage = ?, time_spent = ?, 
                            best_score = ?, room_data = ?, last_accessed = CURRENT_TIMESTAMP,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE user_id = ? AND room_number = ?
                    ''', (completion_status, completion_percentage, total_time_spent, new_best_score, 
                          room_data_json, user_id, room_number))
            else:
                # Insert new progress
                attempts = 1 if completion_status == 'completed' else 0
                
                if completion_status == 'completed':
                    conn.execute('''
                        INSERT INTO user_room_progress 
                        (user_id, room_number, room_name, completion_status, completion_percentage, 
                         time_spent, best_score, attempts, room_data, completed_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ''', (user_id, room_number, room_name, completion_status, completion_percentage,
                          time_spent, score, attempts, room_data_json))
                else:
                    conn.execute('''
                        INSERT INTO user_room_progress 
                        (user_id, room_number, room_name, completion_status, completion_percentage, 
                         time_spent, best_score, attempts, room_data)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (user_id, room_number, room_name, completion_status, completion_percentage,
                          time_spent, score, attempts, room_data_json))
            
            conn.commit()
            conn.close()
            return {'success': True, 'completion_percentage': completion_percentage}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _calculate_completion_percentage(self, progress_data):
        """Calculate weighted completion percentage based on multiple factors"""
        weights = {
            'exploration': 25,      # 25% for exploring the room
            'puzzles': 35,          # 35% for solving puzzles
            'challenges': 20,       # 20% for completing challenges
            'objectives': 15,       # 15% for main objectives
            'secrets': 5            # 5% bonus for finding secrets
        }
        
        # Get progress metrics
        exploration_pct = min(100, progress_data.get('exploration_percentage', 0))
        
        # Calculate puzzle completion
        total_puzzles = progress_data.get('total_puzzles', 1)
        completed_puzzles = len(progress_data.get('puzzles_completed', []))
        puzzle_pct = min(100, (completed_puzzles / total_puzzles) * 100) if total_puzzles > 0 else 0
        
        # Calculate challenge completion
        total_challenges = progress_data.get('total_challenges', 1)
        completed_challenges = len(progress_data.get('challenges_solved', []))
        challenge_pct = min(100, (completed_challenges / total_challenges) * 100) if total_challenges > 0 else 0
        
        # Calculate objective completion
        total_objectives = progress_data.get('total_objectives', 1)
        completed_objectives = len(progress_data.get('objectives_completed', []))
        objective_pct = min(100, (completed_objectives / total_objectives) * 100) if total_objectives > 0 else 0
        
        # Calculate secrets bonus
        total_secrets = progress_data.get('total_secrets', 0)
        found_secrets = len(progress_data.get('secrets_found', []))
        secret_bonus = min(100, (found_secrets / total_secrets) * 100) if total_secrets > 0 else 0
        
        # Calculate weighted average
        total_percentage = (
            (exploration_pct * weights['exploration'] / 100) +
            (puzzle_pct * weights['puzzles'] / 100) +
            (challenge_pct * weights['challenges'] / 100) +
            (objective_pct * weights['objectives'] / 100) +
            (secret_bonus * weights['secrets'] / 100)
        )
        
        return min(100, max(0, round(total_percentage)))
    
    def track_game_event(self, user_id, room_number, event_type, event_data=None):
        """Track specific game events for detailed progress analysis"""
        try:
            conn = self.get_connection()
            
            # Get current room data
            current_progress = conn.execute(
                'SELECT room_data FROM user_room_progress WHERE user_id = ? AND room_number = ?',
                (user_id, room_number)
            ).fetchone()
            
            if current_progress:
                room_data = json.loads(current_progress['room_data'])
            else:
                room_data = {}
            
            # Update room data based on event type
            if event_type == 'puzzle_solved':
                puzzles = room_data.get('puzzles_completed', [])
                puzzle_id = event_data.get('puzzle_id')
                if puzzle_id not in puzzles:
                    puzzles.append(puzzle_id)
                    room_data['puzzles_completed'] = puzzles
            
            elif event_type == 'challenge_completed':
                challenges = room_data.get('challenges_solved', [])
                challenge_id = event_data.get('challenge_id')
                if challenge_id not in challenges:
                    challenges.append(challenge_id)
                    room_data['challenges_solved'] = challenges
            
            elif event_type == 'secret_found':
                secrets = room_data.get('secrets_found', [])
                secret_id = event_data.get('secret_id')
                if secret_id not in secrets:
                    secrets.append(secret_id)
                    room_data['secrets_found'] = secrets
            
            elif event_type == 'item_collected':
                items = room_data.get('items_collected', [])
                item_id = event_data.get('item_id')
                if item_id not in items:
                    items.append(item_id)
                    room_data['items_collected'] = items
            
            elif event_type == 'checkpoint_reached':
                room_data['current_checkpoint'] = event_data.get('checkpoint_id', 0)
            
            elif event_type == 'death':
                room_data['deaths'] = room_data.get('deaths', 0) + 1
            
            elif event_type == 'hint_used':
                room_data['hints_used'] = room_data.get('hints_used', 0) + 1
            
            elif event_type == 'exploration_update':
                room_data['exploration_percentage'] = event_data.get('percentage', 0)
            
            elif event_type == 'position_update':
                room_data['last_position'] = event_data.get('position', {})
            
            elif event_type == 'objective_completed':
                objectives = room_data.get('objectives_completed', [])
                objective_id = event_data.get('objective_id')
                if objective_id not in objectives:
                    objectives.append(objective_id)
                    room_data['objectives_completed'] = objectives
            
            # Update the database
            room_data_json = json.dumps(room_data)
            if current_progress:
                conn.execute('''
                    UPDATE user_room_progress 
                    SET room_data = ?, last_accessed = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ? AND room_number = ?
                ''', (room_data_json, user_id, room_number))
            else:
                # Create initial progress entry
                conn.execute('''
                    INSERT INTO user_room_progress 
                    (user_id, room_number, room_name, room_data)
                    VALUES (?, ?, ?, ?)
                ''', (user_id, room_number, f'Room {room_number}', room_data_json))
            
            conn.commit()
            conn.close()
            return {'success': True, 'room_data': room_data}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_detailed_progress(self, user_id, room_number):
        """Get detailed progress breakdown for a specific room"""
        try:
            conn = self.get_connection()
            
            progress = conn.execute(
                'SELECT * FROM user_room_progress WHERE user_id = ? AND room_number = ?',
                (user_id, room_number)
            ).fetchone()
            
            if not progress:
                conn.close()
                return {'success': True, 'progress': None}
            
            room_data = json.loads(progress['room_data']) if progress['room_data'] else {}
            
            # Calculate detailed metrics
            detailed_progress = {
                'room_number': room_number,
                'completion_status': progress['completion_status'],
                'completion_percentage': progress['completion_percentage'],
                'time_spent': progress['time_spent'],
                'best_score': progress['best_score'],
                'attempts': progress['attempts'],
                'last_accessed': progress['last_accessed'],
                'completed_at': progress['completed_at'],
                'metrics': {
                    'puzzles_completed': len(room_data.get('puzzles_completed', [])),
                    'challenges_solved': len(room_data.get('challenges_solved', [])),
                    'secrets_found': len(room_data.get('secrets_found', [])),
                    'items_collected': len(room_data.get('items_collected', [])),
                    'objectives_completed': len(room_data.get('objectives_completed', [])),
                    'deaths': room_data.get('deaths', 0),
                    'hints_used': room_data.get('hints_used', 0),
                    'current_checkpoint': room_data.get('current_checkpoint', 0),
                    'exploration_percentage': room_data.get('exploration_percentage', 0),
                    'skill_points_earned': room_data.get('skill_points_earned', 0)
                },
                'raw_data': room_data
            }
            
            conn.close()
            return {'success': True, 'progress': detailed_progress}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_overall_progress_summary(self, user_id):
        """Get comprehensive progress summary across all rooms"""
        try:
            conn = self.get_connection()
            
            # Get all room progress
            all_progress = conn.execute(
                'SELECT * FROM user_room_progress WHERE user_id = ? ORDER BY room_number',
                (user_id,)
            ).fetchall()
            
            if not all_progress:
                conn.close()
                return {'success': True, 'summary': None}
            
            # Calculate overall statistics
            total_rooms = len(all_progress)
            completed_rooms = sum(1 for p in all_progress if p['completion_status'] == 'completed')
            avg_completion = sum(p['completion_percentage'] for p in all_progress) / total_rooms
            total_time = sum(p['time_spent'] for p in all_progress)
            total_score = sum(p['best_score'] for p in all_progress)
            
            # Aggregate detailed metrics
            total_puzzles = 0
            total_challenges = 0
            total_secrets = 0
            total_items = 0
            total_objectives = 0
            total_deaths = 0
            total_hints = 0
            
            for progress in all_progress:
                room_data = json.loads(progress['room_data']) if progress['room_data'] else {}
                total_puzzles += len(room_data.get('puzzles_completed', []))
                total_challenges += len(room_data.get('challenges_solved', []))
                total_secrets += len(room_data.get('secrets_found', []))
                total_items += len(room_data.get('items_collected', []))
                total_objectives += len(room_data.get('objectives_completed', []))
                total_deaths += room_data.get('deaths', 0)
                total_hints += room_data.get('hints_used', 0)
            
            summary = {
                'total_rooms': total_rooms,
                'completed_rooms': completed_rooms,
                'completion_rate': (completed_rooms / total_rooms) * 100 if total_rooms > 0 else 0,
                'average_completion': avg_completion,
                'total_time_spent': total_time,
                'total_score': total_score,
                'aggregate_metrics': {
                    'puzzles_solved': total_puzzles,
                    'challenges_completed': total_challenges,
                    'secrets_discovered': total_secrets,
                    'items_collected': total_items,
                    'objectives_completed': total_objectives,
                    'total_deaths': total_deaths,
                    'total_hints_used': total_hints
                },
                'performance_metrics': {
                    'average_time_per_room': total_time / total_rooms if total_rooms > 0 else 0,
                    'average_score_per_room': total_score / total_rooms if total_rooms > 0 else 0,
                    'efficiency_rating': self._calculate_efficiency_rating(all_progress)
                }
            }
            
            conn.close()
            return {'success': True, 'summary': summary}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _calculate_efficiency_rating(self, progress_list):
        """Calculate player efficiency rating based on performance metrics"""
        if not progress_list:
            return 0
        
        total_score = 0
        for progress in progress_list:
            room_data = json.loads(progress['room_data']) if progress['room_data'] else {}
            
            # Factors that improve efficiency
            completion_bonus = progress['completion_percentage']
            speed_bonus = max(0, 100 - (progress['time_spent'] / 60))  # Bonus for completing quickly
            
            # Factors that reduce efficiency
            death_penalty = room_data.get('deaths', 0) * 5
            hint_penalty = room_data.get('hints_used', 0) * 2
            
            room_efficiency = max(0, completion_bonus + speed_bonus - death_penalty - hint_penalty)
            total_score += room_efficiency
        
        return min(100, total_score / len(progress_list))
    
    def ensure_badges_table(self, conn=None):
        """Ensure badges table exists with all required columns"""
        try:
            close_connection = False
            if conn is None:
                conn = self.get_connection()
                close_connection = True
                
            # First check if the table exists
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='badges'")
            
            if not cursor.fetchone():
                # Create badges table with all required columns
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS badges (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        description TEXT,
                        icon TEXT,
                        room_id INTEGER DEFAULT 0,
                        requirement_type TEXT DEFAULT 'completion',
                        requirement_value TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                conn.execute('''
                    CREATE TABLE IF NOT EXISTS user_badges (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        badge_id INTEGER NOT NULL,
                        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id),
                        FOREIGN KEY (badge_id) REFERENCES badges (id),
                        UNIQUE(user_id, badge_id)
                    )
                ''')
                
                if close_connection:
                    conn.commit()
                
                return True, "Badges tables created successfully"
            else:
                # Check if all required columns exist
                cursor = conn.execute("PRAGMA table_info(badges)")
                columns = {column[1] for column in cursor.fetchall()}
                
                missing_columns = []
                required_columns = {
                    'id', 'name', 'description', 'icon', 'room_id', 
                    'requirement_type', 'requirement_value', 'created_at'
                }
                
                for col in required_columns:
                    if col not in columns:
                        missing_columns.append(col)
                
                # Add any missing columns
                for col in missing_columns:
                    if col == 'room_id':
                        conn.execute('ALTER TABLE badges ADD COLUMN room_id INTEGER DEFAULT 0')
                    elif col == 'requirement_type':
                        conn.execute('ALTER TABLE badges ADD COLUMN requirement_type TEXT DEFAULT \'completion\'')
                    elif col == 'requirement_value':
                        conn.execute('ALTER TABLE badges ADD COLUMN requirement_value TEXT')
                    elif col == 'description':
                        conn.execute('ALTER TABLE badges ADD COLUMN description TEXT')
                    elif col == 'icon':
                        conn.execute('ALTER TABLE badges ADD COLUMN icon TEXT')
                    elif col == 'created_at':
                        conn.execute('ALTER TABLE badges ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
                
                if missing_columns and close_connection:
                    conn.commit()
                
                return True, f"Added missing columns to badges table: {', '.join(missing_columns)}" if missing_columns else "Badges table is up to date"
                
        except Exception as e:
            return False, f"Error ensuring badges table: {str(e)}"
        finally:
            if close_connection and 'conn' in locals():
                conn.close()

    def create_default_badges(self, conn=None):
        """Create default badges for the game with proper error handling"""
        try:
            close_connection = False
            if conn is None:
                conn = self.get_connection()
                close_connection = True
            
            # First ensure badges table has correct schema
            badges_result, message = self.ensure_badges_table(conn)
            if not badges_result:
                print(f"⚠️ {message}")
                return False
            else:
                print(f"✓ {message}")
            
            # Check if badges already exist
            existing_badges = conn.execute('SELECT COUNT(*) FROM badges').fetchone()[0]
            if existing_badges > 0:
                print("✓ Default badges already exist")
                return True
            
            print("Creating default badges...")
            
            # Default badges for each room
            default_badges = [
                # Room 1 - Flowchart Lab
                (1, 'Flowchart Novice', 'Complete your first flowchart challenge', '📊', 'level_completion', '1'),
                (1, 'Logic Master', 'Complete all flowchart levels', '🧠', 'room_completion', '1'),
                (1, 'Quick Thinker', 'Complete a flowchart level in under 2 minutes', '⚡', 'time_based', '120'),
                
                # Room 2 - Network Nexus
                (2, 'Network Explorer', 'Complete your first network challenge', '🌐', 'level_completion', '1'),
                (2, 'Connection Expert', 'Complete all network levels', '🔗', 'room_completion', '2'),
                (2, 'Network Architect', 'Perfect score on a network challenge', '🏗️', 'score_based', '100'),
                
                # Room 3 - AI Systems
                (3, 'AI Apprentice', 'Complete your first AI challenge', '🤖', 'level_completion', '1'),
                (3, 'Machine Learning Master', 'Complete all AI levels', '🎯', 'room_completion', '3'),
                (3, 'Neural Network Ninja', 'Solve an AI puzzle without hints', '🥷', 'no_hints', '1'),
                
                # Room 4 - Database Crisis
                (4, 'Data Detective', 'Complete your first database challenge', '🗄️', 'level_completion', '1'),
                (4, 'SQL Specialist', 'Complete all database levels', '💾', 'room_completion', '4'),
                (4, 'Query Optimizer', 'Write an efficient database query', '⚡', 'efficiency', '1'),
                
                # Room 5 - Programming Crisis
                (5, 'Code Rookie', 'Complete your first programming challenge', '💻', 'level_completion', '1'),
                (5, 'Debug Champion', 'Complete all programming levels', '🐛', 'room_completion', '5'),
                (5, 'Code Perfectionist', 'Write bug-free code on first try', '✨', 'perfect_code', '1'),
                
                # General Achievement Badges
                (0, 'First Steps', 'Complete your very first level', '👶', 'any_completion', '1'),
                (0, 'Persistent Learner', 'Complete 10 levels total', '📚', 'total_levels', '10'),
                (0, 'Tech Savvy', 'Complete levels in 3 different rooms', '🔧', 'room_diversity', '3'),
                (0, 'Speed Runner', 'Complete any level in under 1 minute', '🏃', 'speed', '60'),
                (0, 'Problem Solver', 'Complete 5 levels without using hints', '💡', 'no_hints_total', '5'),
                (0, 'Lab Escapee', 'Complete all rooms and escape the lab!', '🏆', 'all_rooms', '5'),
            ]
            
            # Insert badges with proper error handling
            try:
                for room_id, name, description, icon, req_type, req_value in default_badges:
                    conn.execute('''
                        INSERT INTO badges (room_id, name, description, icon, requirement_type, requirement_value)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (room_id, name, description, icon, req_type, req_value))
                
                if close_connection:
                    conn.commit()
                print(f"✓ Created {len(default_badges)} default badges")
                return True
            except sqlite3.Error as e:
                if close_connection:
                    conn.rollback()
                print(f"✗ Error creating default badges: {str(e)}")
                return False
                
        except Exception as e:
            print(f"✗ Error creating default badges: {str(e)}")
            return False
        finally:
            if close_connection and 'conn' in locals():
                conn.close()
