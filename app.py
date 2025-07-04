from flask import Flask, render_template_string, render_template, jsonify, request, session, redirect
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
import os
from datetime import datetime
from functools import wraps
from config import config
from database import DatabaseManager
import json

app = Flask(__name__)

# Load configuration
config_name = os.environ.get('FLASK_CONFIG', 'default')
app.config.from_object(config[config_name])

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'

# Initialize database manager
db_manager = DatabaseManager(
    database_path=app.config['DATABASE'],
    database_dir=app.config.get('DATABASE_DIR', 'database')
)

# Auto-initialize database on startup
def init_app_database():
    """Initialize database automatically on app startup"""
    try:
        # Check if database exists
        if not os.path.exists(app.config['DATABASE']):
            print("Database not found. Creating new database...")
            result = db_manager.init_database()
            if result is True:
                print("✓ Database created successfully!")
                # Create default admin account after initial database creation
                create_default_admin()
            else:
                print(f"✗ Database creation failed: {result[1]}")
                return False
        else:
            # Database exists, check for schema updates
            print("Database found. Checking for schema updates...")
            result = db_manager.migrate_schema()
            if result is True:
                print("✓ Database schema is up to date!")
            else:
                print(f"✓ Database schema updated: {result}")
            # Check if admin exists, create if not
            create_default_admin()
        
        # Ensure database directory exists
        os.makedirs(app.config.get('DATABASE_DIR', 'database'), exist_ok=True)
        return True
    except Exception as e:
        print(f"✗ Database initialization failed: {str(e)}")
        return False

def create_default_admin():
    """Create default admin account if none exists"""
    try:
        # Check if admin already exists
        conn = db_manager.get_connection()
        admin_exists = conn.execute('SELECT id FROM users WHERE is_admin = 1').fetchone()
        conn.close()
        
        if not admin_exists:
            print("No admin account found. Creating default admin...")
            # Get admin credentials from environment or use defaults
            admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
            admin_email = os.environ.get('ADMIN_EMAIL', 'admin@ascended.local')
            admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
            
            result = db_manager.create_admin(admin_username, admin_email, admin_password)
            if result['success']:
                print(f"✓ Default admin account created:")
                print(f"  Username: {admin_username}")
                print(f"  Email: {admin_email}")
                print(f"  Password: {admin_password}")
                print("  ⚠️  Please change the default password after first login!")
            else:
                print(f"✗ Failed to create admin account: {result['error']}")
        else:
            print("✓ Admin account already exists")
    except Exception as e:
        print(f"✗ Error checking/creating admin account: {str(e)}")

# Initialize database on startup
with app.app_context():
    init_app_database()

@login_manager.user_loader
def load_user(user_id):
    """Load user for Flask-Login"""
    return db_manager.get_user_by_id(user_id)

def check_file_exists(filepath):
    """Check if a file exists"""
    return os.path.exists(filepath)

@app.route('/')
def root():
    """Serve the actual game index.html"""
    return render_template('index.html')

# Add a catch-all route for static files in root directory
@app.route('/<path:filename>')
def serve_static_files(filename):
    """Serve static files from root directory"""
    if check_file_exists(filename):
        from flask import send_from_directory
        return send_from_directory('.', filename)
    else:
        # Return 404 for missing files
        from flask import abort
        abort(404)
@app.route('/api/test')
def api_test():
    """Test API endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'API is working', 
        'timestamp': datetime.now().isoformat(),
        'database': 'connected'
    })

@app.route('/verify')
def verify():
    """System verification page replacing verify.php"""
    # Check database connection
    db_info = db_manager.test_connection()
    
    # Check required files
    required_files = app.config.get('REQUIRED_FILES', [
        'index.html',
        'static/js/main.js', 
        'static/css/main.css',
        'database/schema.sql'
    ])
    
    file_status = {}
    for file in required_files:
        file_status[file] = check_file_exists(file)
    
    return render_template('verify.html', db_info=db_info, file_status=file_status)

@app.route('/setup')
def setup():
    """Database setup page"""
    setup_result = None
    if request.args.get('action') == 'init':
        result = db_manager.init_database()
        if result is True:
            setup_result = {'success': True, 'message': 'Database initialized successfully!'}
        else:
            setup_result = {'success': False, 'message': f'Setup failed: {result[1]}'}
    elif request.args.get('action') == 'migrate':
        result = db_manager.migrate_schema()
        if result is True:
            setup_result = {'success': True, 'message': 'Database schema is already up to date!'}
        else:
            setup_result = {'success': True, 'message': f'Database schema updated: {result}'}
    
    return render_template('setup.html', setup_result=setup_result, config=app.config)

# API endpoints for game functionality
@app.route('/api/save_progress', methods=['POST'])
@login_required
def save_progress():
    """Save game progress"""
    try:
        data = request.get_json()
        session_id = f"user_{current_user.id}_{data.get('session_id', 'default')}"
        level = data.get('level', 1)
        progress = data.get('progress', {})
        
        db_manager.save_progress(session_id, level, progress)
        return jsonify({'status': 'success', 'message': 'Progress saved'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/load_progress/<session_id>')
@login_required
def load_progress(session_id):
    """Load game progress"""
    try:
        # Prefix session_id with user ID for security
        user_session_id = f"user_{current_user.id}_{session_id}"
        result = db_manager.load_progress(user_session_id)
        
        if result['found']:
            return jsonify({
                'status': 'success',
                'level': result['level'],
                'progress': result['progress']
            })
        else:
            return jsonify({'status': 'not_found', 'message': 'No saved progress'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Add new routes for authentication
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not all([username, email, password]):
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
        
        result = db_manager.register_user(username, email, password)
        
        if result['success']:
            return jsonify({'status': 'success', 'message': 'Registration successful'})
        else:
            status_code = 409 if 'already exists' in result['error'] else 500
            return jsonify({'status': 'error', 'message': result['error']}), status_code
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        identifier = data.get('email')  # This can be email or username from frontend
        password = data.get('password')
        remember = data.get('remember', False)

        print(f"Login attempt for: {identifier}")  # Debug logging
        
        user = db_manager.verify_password(identifier, password)
        
        if user:
            print(f"User authenticated: {user.username}, is_admin: {user.is_admin}")  # Debug logging
            login_user(user, remember=remember)
            return jsonify({
                'status': 'success',
                'user': {
                    'username': user.username,
                    'email': user.email,
                    'is_admin': user.is_admin
                }
            })
        else:
            print(f"Authentication failed for: {identifier}")  # Debug logging
            return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401
    except Exception as e:
        print(f"Login error: {str(e)}")  # Debug logging
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/auth/logout')
@login_required
def logout():
    logout_user()
    return jsonify({'status': 'success'})

def admin_required(f):
    """Decorator to require admin access"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({'status': 'error', 'message': 'Authentication required'}), 401
        
        # Use the is_admin property from the User model
        if not current_user.is_admin:
            return jsonify({'status': 'error', 'message': 'Admin access required'}), 403
            
        return f(*args, **kwargs)
    return decorated_function

@app.route('/admin')
@login_required
@admin_required
def admin_dashboard():
    """Admin dashboard"""
    return render_template('admin/dashboard.html')

@app.route('/api/admin/stats')
@login_required
@admin_required
def admin_stats():
    """Get admin statistics"""
    try:
        conn = db_manager.get_connection()
        
        # Get total users
        total_users = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
        
        # Get active sessions (sessions updated in last 24 hours)
        active_sessions = conn.execute(
            "SELECT COUNT(*) FROM game_state WHERE updated_at > datetime('now', '-1 day')"
        ).fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'stats': {
                'total_users': total_users,
                'active_sessions': active_sessions,
                'db_size': 'Unknown'  # Could implement actual DB size calculation
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/users')
@login_required
@admin_required
def admin_users():
    """Get all users for admin with optional filtering"""
    try:
        filter_type = request.args.get('filter', 'all')
        
        conn = db_manager.get_connection()
        
        if filter_type == 'admins':
            users = conn.execute(
                'SELECT id, username, email, is_admin, created_at FROM users WHERE is_admin = 1 ORDER BY created_at DESC'
            ).fetchall()
        elif filter_type == 'users':
            users = conn.execute(
                'SELECT id, username, email, is_admin, created_at FROM users WHERE is_admin = 0 ORDER BY created_at DESC'
            ).fetchall()
        else:  # 'all' or default
            users = conn.execute(
                'SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC'
            ).fetchall()
        
        conn.close()
        
        users_list = []
        for user in users:
            users_list.append({
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'is_admin': bool(user['is_admin']),
                'created_at': user['created_at']
            })
        
        return jsonify({'status': 'success', 'users': users_list})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/user-stats')
@login_required
@admin_required
def admin_user_stats():
    """Get user statistics by type"""
    try:
        conn = db_manager.get_connection()
        
        # Get counts by user type
        total_users = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
        admin_count = conn.execute('SELECT COUNT(*) FROM users WHERE is_admin = 1').fetchone()[0]
        regular_count = total_users - admin_count
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'stats': {
                'total_users': total_users,
                'admin_users': admin_count,
                'regular_users': regular_count
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/game-stats')
@login_required
@admin_required
def admin_game_stats():
    """Get game statistics"""
    try:
        conn = db_manager.get_connection()
        
        # Level completion stats
        level_stats = conn.execute('''
            SELECT current_level as level, COUNT(*) as completions 
            FROM game_state 
            GROUP BY current_level 
            ORDER BY current_level
        ''').fetchall()
        
        # Recent activity
        recent_activity = conn.execute('''
            SELECT u.username, gs.current_level as level, gs.updated_at as timestamp
            FROM game_state gs
            JOIN users u ON gs.session_id LIKE 'user_' || u.id || '_%'
            ORDER BY gs.updated_at DESC
            LIMIT 10
        ''').fetchall()
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'stats': {
                'level_completion': [{'level': row['level'], 'completions': row['completions']} for row in level_stats],
                'recent_activity': [{'username': row['username'], 'level': row['level'], 'timestamp': row['timestamp']} for row in recent_activity]
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/auth/user')
def get_current_user():
    if current_user.is_authenticated:
        return jsonify({
            'status': 'success',
            'user': {
                'username': current_user.username,
                'email': current_user.email,
                'is_admin': current_user.is_admin
            }
        })
    else:
        return jsonify({'status': 'error', 'message': 'Not authenticated'}), 401

@app.route('/setup_admin', methods=['POST'])
def setup_admin():
    """
    Create an admin account if it does not exist.
    Expects JSON: { "username": "...", "email": "...", "password": "..." }
    """
    data = request.get_json()
    username = data.get('username', 'admin')
    email = data.get('email', 'admin@example.com')
    password = data.get('password', 'admin123')

    result = db_manager.create_admin(username, email, password)
    if result['success']:
        return jsonify({'status': 'success', 'message': 'Admin account created'})
    else:
        return jsonify({'status': 'error', 'message': result['error']}), 400

@app.route('/api/admin/toggle-admin', methods=['POST'])
@login_required
@admin_required
def toggle_admin():
    """Toggle admin status for a user"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        is_admin = data.get('is_admin')
        
        if user_id is None or is_admin is None:
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
        
        # Prevent removing admin status from yourself
        if user_id == current_user.id and not is_admin:
            return jsonify({'status': 'error', 'message': 'Cannot remove admin status from yourself'}), 400
        
        conn = db_manager.get_connection()
        conn.execute(
            'UPDATE users SET is_admin = ? WHERE id = ?',
            (1 if is_admin else 0, user_id)
        )
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'message': 'User admin status updated'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/delete-user', methods=['POST'])
@login_required
@admin_required
def delete_user():
    """Delete a user"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        if not user_id:
            return jsonify({'status': 'error', 'message': 'Missing user_id'}), 400
        
        # Prevent deleting yourself
        if user_id == current_user.id:
            return jsonify({'status': 'error', 'message': 'Cannot delete yourself'}), 400
        
        conn = db_manager.get_connection()
        
        # Delete user's game progress first (foreign key constraint)
        conn.execute('DELETE FROM game_state WHERE session_id LIKE ?', (f'user_{user_id}_%',))
        conn.execute('DELETE FROM user_progress WHERE username = (SELECT username FROM users WHERE id = ?)', (user_id,))
        
        # Delete the user
        conn.execute('DELETE FROM users WHERE id = ?', (user_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'message': 'User deleted successfully'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/backup-db')
@login_required
@admin_required
def backup_database():
    """Create a database backup"""
    try:
        import shutil
        from datetime import datetime
        
        # Create backup filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'backup_ascended_{timestamp}.db'
        backup_path = os.path.join(app.config.get('DATABASE_DIR', 'database'), backup_filename)
        
        # Copy the database file
        shutil.copy2(app.config['DATABASE'], backup_path)
        
        # Send the backup file as download
        from flask import send_file
        return send_file(backup_path, as_attachment=True, download_name=backup_filename)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/clear-sessions', methods=['POST'])
@login_required
@admin_required
def clear_old_sessions():
    """Clear old game sessions"""
    try:
        conn = db_manager.get_connection()
        
        # Delete sessions older than 7 days
        conn.execute(
            "DELETE FROM game_state WHERE updated_at < datetime('now', '-7 days')"
        )
        
        rows_deleted = conn.total_changes
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success', 
            'message': f'Cleared {rows_deleted} old sessions'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/admin/level-editor')
@login_required
@admin_required
def level_editor():
    """Admin level editor interface"""
    return render_template('admin/level-editor.html')

@app.route('/api/admin/levels')
@login_required
@admin_required
def get_all_levels():
    """Get all levels for all rooms"""
    try:
        conn = db_manager.get_connection()
        levels = conn.execute('''
            SELECT * FROM level_data 
            ORDER BY room_id, level_number
        ''').fetchall()
        conn.close()
        
        levels_data = []
        for level in levels:
            levels_data.append({
                'id': level['id'],
                'room_id': level['room_id'],
                'level_number': level['level_number'],
                'name': level['name'],
                'data': json.loads(level['data']) if level['data'] else {},
                'created_at': level['created_at'],
                'updated_at': level['updated_at']
            })
        
        return jsonify({'status': 'success', 'levels': levels_data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/levels/<int:room_id>')
@login_required
@admin_required
def get_room_levels(room_id):
    """Get levels for a specific room"""
    try:
        conn = db_manager.get_connection()
        levels = conn.execute('''
            SELECT * FROM level_data 
            WHERE room_id = ?
            ORDER BY level_number
        ''', (room_id,)).fetchall()
        conn.close()
        
        levels_data = []
        for level in levels:
            levels_data.append({
                'id': level['id'],
                'room_id': level['room_id'],
                'level_number': level['level_number'],
                'name': level['name'],
                'data': json.loads(level['data']) if level['data'] else {},
                'created_at': level['created_at'],
                'updated_at': level['updated_at']
            })
        
        return jsonify({'status': 'success', 'levels': levels_data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/levels', methods=['POST'])
@login_required
@admin_required
def create_level():
    """Create a new level"""
    try:
        data = request.get_json()
        room_id = data.get('room_id')
        level_number = data.get('level_number')
        name = data.get('name')
        level_data = data.get('data', {})
        
        if not all([room_id, level_number, name]):
            return jsonify({'status': 'error', 'message': 'Missing required fields: room_id, level_number, and name are required'}), 400
        
        # Validate room_id
        if not (1 <= room_id <= 5):
            return jsonify({'status': 'error', 'message': 'Invalid room_id. Must be between 1 and 5'}), 400
        
        # Validate level_number
        if not (1 <= level_number <= 100):
            return jsonify({'status': 'error', 'message': 'Invalid level_number. Must be between 1 and 100'}), 400
        
        conn = db_manager.get_connection()
        
        # Check if level already exists
        existing = conn.execute(
            'SELECT id FROM level_data WHERE room_id = ? AND level_number = ?',
            (room_id, level_number)
        ).fetchone()
        
        if existing:
            conn.close()
            return jsonify({'status': 'error', 'message': f'Level {level_number} already exists in room {room_id}'}), 409
        
        # Create new level
        cursor = conn.execute('''
            INSERT INTO level_data (room_id, level_number, name, data, created_at, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ''', (room_id, level_number, name, json.dumps(level_data)))
        
        level_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success', 
            'level_id': level_id, 
            'message': f'Level "{name}" created successfully'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/levels/<int:level_id>', methods=['PUT'])
@login_required
@admin_required
def update_level(level_id):
    """Update an existing level"""
    try:
        data = request.get_json()
        name = data.get('name')
        level_data = data.get('data', {})
        level_number = data.get('level_number')
        
        if not name:
            return jsonify({'status': 'error', 'message': 'Name is required'}), 400
        
        conn = db_manager.get_connection()
        
        # Check if level exists
        existing_level = conn.execute('SELECT * FROM level_data WHERE id = ?', (level_id,)).fetchone()
        if not existing_level:
            conn.close()
            return jsonify({'status': 'error', 'message': 'Level not found'}), 404
        
        # Check for duplicate level number in same room (excluding current level)
        if level_number:
            duplicate = conn.execute(
                'SELECT id FROM level_data WHERE room_id = ? AND level_number = ? AND id != ?',
                (existing_level['room_id'], level_number, level_id)
            ).fetchone()
            
            if duplicate:
                conn.close()
                return jsonify({'status': 'error', 'message': f'Level number {level_number} already exists in this room'}), 409
        
        # Update level
        if level_number:
            conn.execute('''
                UPDATE level_data 
                SET name = ?, level_number = ?, data = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (name, level_number, json.dumps(level_data), level_id))
        else:
            conn.execute('''
                UPDATE level_data 
                SET name = ?, data = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (name, json.dumps(level_data), level_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'message': 'Level updated successfully'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/levels/<int:level_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_level(level_id):
    """Delete a level"""
    try:
        conn = db_manager.get_connection()
        
        # Check if level exists
        level = conn.execute('SELECT * FROM level_data WHERE id = ?', (level_id,)).fetchone()
        if not level:
            conn.close()
            return jsonify({'status': 'error', 'message': 'Level not found'}), 404
        
        level_name = level['name']
        level_number = level['level_number']
        room_id = level['room_id']
        
        # Delete level
        conn.execute('DELETE FROM level_data WHERE id = ?', (level_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success', 
            'message': f'Level {level_number}: "{level_name}" deleted successfully'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/export-levels/<int:room_id>')
@login_required
@admin_required
def export_room_levels(room_id):
    """Export levels for a room as JSON"""
    try:
        conn = db_manager.get_connection()
        levels = conn.execute('''
            SELECT * FROM level_data 
            WHERE room_id = ?
            ORDER BY level_number
        ''', (room_id,)).fetchall()
        conn.close()
        
        export_data = {
            'room_id': room_id,
            'export_date': datetime.now().isoformat(),
            'levels': []
        }
        
        for level in levels:
            export_data['levels'].append({
                'level_number': level['level_number'],
                'name': level['name'],
                'data': json.loads(level['data']) if level['data'] else {}
            })
        
        from flask import make_response
        response = make_response(json.dumps(export_data, indent=2))
        response.headers['Content-Type'] = 'application/json'
        response.headers['Content-Disposition'] = f'attachment; filename=room_{room_id}_levels.json'
        
        return response
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/import-levels', methods=['POST'])
@login_required
@admin_required
def import_levels():
    """Import levels from JSON file"""
    try:
        data = request.get_json()
        room_id = data.get('room_id')
        levels_data = data.get('levels', [])
        overwrite = data.get('overwrite', False)
        
        if not room_id:
            return jsonify({'status': 'error', 'message': 'Room ID is required'}), 400
        
        conn = db_manager.get_connection()
        imported_count = 0
        
        for level_data in levels_data:
            level_number = level_data.get('level_number')
            name = level_data.get('name')
            data_content = level_data.get('data', {})
            
            if not all([level_number, name]):
                continue
            
            # Check if level exists
            existing = conn.execute(
                'SELECT id FROM level_data WHERE room_id = ? AND level_number = ?',
                (room_id, level_number)
            ).fetchone()
            
            if existing and not overwrite:
                continue
            elif existing and overwrite:
                # Update existing level
                conn.execute('''
                    UPDATE level_data 
                    SET name = ?, data = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE room_id = ? AND level_number = ?
                ''', (name, json.dumps(data_content), room_id, level_number))
                imported_count += 1
            else:
                # Create new level
                conn.execute('''
                    INSERT INTO level_data (room_id, level_number, name, data, created_at, updated_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ''', (room_id, level_number, name, json.dumps(data_content)))
                imported_count += 1
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success', 
            'message': f'Imported {imported_count} levels successfully'
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/levels/populate-defaults', methods=['POST'])
@login_required
@admin_required
def populate_default_levels():
    """Populate database with default levels from codebase"""
    try:
        data = request.get_json() or {}
        room_id = data.get('room_id', 1)
        
        conn = db_manager.get_connection()
        
        # Check if levels already exist for this room
        existing_count = conn.execute(
            'SELECT COUNT(*) FROM level_data WHERE room_id = ?', (room_id,)
        ).fetchone()[0]
        
        if existing_count > 0:
            conn.close()
            return jsonify({
                'status': 'info', 
                'message': f'Room {room_id} already has {existing_count} levels'
            })
        
        # Room-specific default levels
        default_levels = {
            1: [  # Flowchart Lab
                {
                    'level_number': 1,
                    'name': 'Basic Start-End Flow',
                    'data': {
                        'description': 'Create a simple flowchart with START and END nodes',
                        'difficulty': 'easy',
                        'objectives': ['Place START node', 'Place END node', 'Connect with arrow'],
                        'hints': ['Use oval shapes for start and end', 'Connect nodes with arrows'],
                        'validation': {'requiredNodes': ['oval', 'oval'], 'minConnections': 1}
                    }
                },
                {
                    'level_number': 2,
                    'name': 'Process Flow',
                    'data': {
                        'description': 'Add process steps between start and end',
                        'difficulty': 'easy',
                        'objectives': ['Create multi-step process', 'Use proper symbols'],
                        'hints': ['Rectangles for processes', 'Logical flow order'],
                        'validation': {'requiredNodes': ['oval', 'rectangle', 'oval'], 'minConnections': 2}
                    }
                }
            ],
            2: [  # Network Nexus
                {
                    'level_number': 1,
                    'name': 'Basic Network Topology',
                    'data': {
                        'description': 'Build a simple network with PCs and router',
                        'difficulty': 'easy',
                        'objectives': ['Place network devices', 'Connect with cables'],
                        'hints': ['Start with end devices', 'Connect to central router'],
                        'validation': {'requiredDevices': ['pc', 'router'], 'minConnections': 2}
                    }
                }
            ],
            3: [  # AI Systems
                {
                    'level_number': 1,
                    'name': 'AI Ethics Training',
                    'data': {
                        'description': 'Train AI to make ethical decisions',
                        'difficulty': 'medium',
                        'objectives': ['Complete ethics scenarios', 'Achieve high accuracy'],
                        'hints': ['Consider human impact', 'Privacy is important'],
                        'validation': {'minAccuracy': 75, 'categoriesCompleted': 5}
                    }
                }
            ],
            4: [  # Database Emergency
                {
                    'level_number': 1,
                    'name': 'Basic SQL Queries',
                    'data': {
                        'description': 'Learn fundamental SQL SELECT statements',
                        'difficulty': 'easy',
                        'objectives': ['Execute SELECT queries', 'Use WHERE clauses'],
                        'hints': ['SELECT * FROM table', 'Use WHERE for filtering'],
                        'validation': {'correctQueries': 3, 'syntax': 'valid'}
                    }
                }
            ],
            5: [  # Programming Crisis
                {
                    'level_number': 1,
                    'name': 'Debug Basic Code',
                    'data': {
                        'description': 'Find and fix common programming errors',
                        'difficulty': 'medium',
                        'objectives': ['Identify bugs', 'Fix syntax errors', 'Test solutions'],
                        'hints': ['Check variable names', 'Look for missing semicolons'],
                        'validation': {'bugsFixed': 3, 'testsPass': True}
                    }
                }
            ]
        }
        
        room_levels = default_levels.get(room_id, [])
        imported_count = 0
        
        for level_data in room_levels:
            conn.execute('''
                INSERT INTO level_data (room_id, level_number, name, data, created_at, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ''', (room_id, level_data['level_number'], level_data['name'], 
                  json.dumps(level_data['data'])))
            imported_count += 1
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success', 
            'message': f'Populated {imported_count} default levels for room {room_id}'
        })
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/dashboard')
@login_required
def user_dashboard():
    """User dashboard"""
    # Redirect admins to admin dashboard
    if current_user.is_admin:
        return redirect('/admin')
    return render_template('user-dashboard.html')

@app.route('/api/user/progress')
@login_required
def get_user_progress():
    """Get user's game progress"""
    try:
        conn = db_manager.get_connection()
        
        # Get user's overall stats
        user_sessions = conn.execute(
            "SELECT COUNT(*) FROM game_state WHERE session_id LIKE ?",
            (f'user_{current_user.id}_%',)
        ).fetchone()[0]
        
        # Get current level
        current_level_row = conn.execute(
            "SELECT MAX(current_level) FROM game_state WHERE session_id LIKE ?",
            (f'user_{current_user.id}_%',)
        ).fetchone()
        current_level = current_level_row[0] if current_level_row[0] else 1
        
        # Get last played
        last_played_row = conn.execute(
            "SELECT MAX(updated_at) FROM game_state WHERE session_id LIKE ?",
            (f'user_{current_user.id}_%',)
        ).fetchone()
        last_played = last_played_row[0] if last_played_row[0] else None
        
        # Get badge count
        badge_count = conn.execute(
            "SELECT COUNT(*) FROM user_badges WHERE user_id = ?",
            (current_user.id,)
        ).fetchone()[0]
        
        # Calculate completed rooms (assuming 10 levels per room)
        completed_rooms = max(0, (current_level - 1) // 10)
        
        # Get room-specific progress
        rooms_progress = []
        for room_id in range(1, 6):  # 5 rooms
            start_level = (room_id - 1) * 10 + 1
            end_level = room_id * 10
            
            completed_levels = 0
            if current_level > start_level:
                completed_levels = min(10, current_level - start_level + 1)
            
            rooms_progress.append({
                'room_id': room_id,
                'completed_levels': completed_levels,
                'total_levels': 10
            })
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'stats': {
                'completed_rooms': completed_rooms,
                'current_level': current_level,
                'badge_count': badge_count,
                'session_count': user_sessions,
                'last_played': last_played
            },
            'rooms': rooms_progress
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/user/badges')
@login_required
def get_user_badges():
    """Get user's badges"""
    try:
        # Check for new badge eligibility first
        badge_check = db_manager.check_badge_eligibility(current_user.id)
        
        # Get all available badges with user's earned status
        all_badges_result = db_manager.get_all_badges()
        user_badges_result = db_manager.get_user_badges(current_user.id)
        
        if all_badges_result['success'] and user_badges_result['success']:
            all_badges = all_badges_result['badges']
            earned_badges = {badge['id']: badge for badge in user_badges_result['badges']}
            
            # Combine data
            badges_data = []
            for badge in all_badges:
                badge_info = {
                    'id': badge['id'],
                    'name': badge['name'],
                    'description': badge['description'],
                    'icon': badge['icon'],
                    'earned': badge['id'] in earned_badges,
                    'earned_at': earned_badges[badge['id']]['earned_at'] if badge['id'] in earned_badges else None
                }
                badges_data.append(badge_info)
            
            response_data = {
                'status': 'success',
                'badges': badges_data
            }
            
            # Include new badges if any were awarded
            if badge_check['success'] and badge_check['new_badges']:
                response_data['new_badges'] = badge_check['new_badges']
            
            return jsonify(response_data)
        else:
            return jsonify({'status': 'error', 'message': 'Failed to fetch badges'}), 500
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/progress/save', methods=['POST'])
@login_required
def save_user_progress():
    """Enhanced progress saving with badge checking"""
    try:
        data = request.get_json()
        room_number = data.get('room_number')
        progress_data = data.get('progress_data', {})
        
        if not room_number:
            return jsonify({'status': 'error', 'message': 'Room number required'}), 400
        
        # Save progress
        result = db_manager.save_user_room_progress(current_user.id, room_number, progress_data)
        
        if result['success']:
            # Check for new badges
            badge_result = db_manager.check_badge_eligibility(current_user.id)
            
            response = {'status': 'success', 'message': 'Progress saved'}
            
            if badge_result['success'] and badge_result['new_badges']:
                response['new_badges'] = badge_result['new_badges']
            
            return jsonify(response)
        else:
            return jsonify({'status': 'error', 'message': result['error']}), 500
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/badges')
@login_required
@admin_required
def admin_get_badges():
    """Get all badges for admin management"""
    try:
        result = db_manager.get_all_badges()
        
        if result['success']:
            return jsonify({'status': 'success', 'badges': result['badges']})
        else:
            return jsonify({'status': 'error', 'message': result['error']}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/award-badge', methods=['POST'])
@login_required
@admin_required
def admin_award_badge():
    """Award a badge to a user (admin only)"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        badge_name = data.get('badge_name')
        
        if not all([user_id, badge_name]):
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
        
        result = db_manager.award_badge(user_id, badge_name)
        
        if result['success']:
            return jsonify({'status': 'success', 'message': result['message']})
        else:
            return jsonify({'status': 'error', 'message': result['error']}), 400
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/badge-stats')
@login_required
@admin_required  
def admin_badge_stats():
    """Get badge statistics for admin dashboard"""
    try:
        conn = db_manager.get_connection()
        
        # Get badge award statistics
        badge_stats = conn.execute('''
            SELECT b.name, b.icon, COUNT(ub.id) as award_count
            FROM badges b
            LEFT JOIN user_badges ub ON b.id = ub.badge_id
            GROUP BY b.id, b.name, b.icon
            ORDER BY award_count DESC
        ''').fetchall()
        
        # Get recent badge awards
        recent_awards = conn.execute('''
            SELECT u.username, b.name as badge_name, b.icon, ub.earned_at
            FROM user_badges ub
            JOIN users u ON ub.user_id = u.id
            JOIN badges b ON ub.badge_id = b.id
            ORDER BY ub.earned_at DESC
            LIMIT 10
        ''').fetchall()
        
        conn.close()
        
        return jsonify({
            'status': 'success',
            'stats': {
                'badge_stats': [dict(row) for row in badge_stats],
                'recent_awards': [dict(row) for row in recent_awards]
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    config_obj = config[config_name]
    app.run(
        debug=config_obj.DEBUG,
        host=config_obj.HOST,
        port=config_obj.PORT
    )