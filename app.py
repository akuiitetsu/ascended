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

@app.route('/api/admin/reports/<report_type>', methods=['POST'])
@login_required
@admin_required
def generate_report(report_type):
    """Generate specific report type"""
    try:
        config = request.get_json() or {}
        report_data = generate_report_data(report_type, config)
        
        if config.get('format') == 'csv':
            csv_response = generate_csv_response(report_data, f'{report_type}-report')
            # Save to history
            save_report_to_history(report_type, config, csv_response.get_data(), 'csv')
            return csv_response
        elif config.get('format') == 'excel':
            excel_response = generate_excel_response(report_data, f'{report_type}-report')
            # Save to history  
            save_report_to_history(report_type, config, excel_response.get_data(), 'excel')
            return excel_response
        elif config.get('format') == 'pdf':
            pdf_response = generate_pdf_response(report_data, f'{report_type}-report')
            # Save to history
            save_report_to_history(report_type, config, pdf_response.get_data(), 'pdf')
            return pdf_response
        else:
            # Save JSON to history
            json_data = json.dumps(report_data, indent=2).encode('utf-8')
            save_report_to_history(report_type, config, json_data, 'json')
            return jsonify({'status': 'success', 'data': report_data})
            
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/reports/bulk', methods=['POST'])
@login_required
@admin_required
def generate_bulk_reports():
    """Generate multiple reports as a ZIP package"""
    try:
        config = request.get_json() or {}
        report_types = config.get('reports', ['user-performance', 'challenge-completion', 'engagement-trends', 'system-effectiveness'])
        
        import zipfile
        import io
        from datetime import datetime
        
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for report_type in report_types:
                try:
                    report_data = generate_report_data(report_type, config)
                    
                    # Add JSON version
                    json_content = json.dumps(report_data, indent=2)
                    zip_file.writestr(f'{report_type}-report.json', json_content)
                    
                    # Add CSV version if possible
                    try:
                        csv_content = generate_csv_content(report_data)
                        zip_file.writestr(f'{report_type}-report.csv', csv_content)
                    except:
                        pass  # Skip CSV if data structure doesn't support it
                        
                except Exception as e:
                    # Add error file for failed reports
                    zip_file.writestr(f'{report_type}-ERROR.txt', f'Failed to generate report: {str(e)}')
            
            # Add metadata
            metadata = {
                'generated_at': datetime.now().isoformat(),
                'config': config,
                'reports_included': report_types
            }
            zip_file.writestr('metadata.json', json.dumps(metadata, indent=2))
        
        zip_buffer.seek(0)
        zip_data = zip_buffer.getvalue()
        
        # Save to report history
        save_report_to_history('bulk-reports', config, zip_data, 'zip')
        
        from flask import make_response
        response = make_response(zip_data)
        response.headers['Content-Type'] = 'application/zip'
        response.headers['Content-Disposition'] = f'attachment; filename=ascended-reports-{datetime.now().strftime("%Y%m%d")}.zip'
        
        return response
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/reports/history')
@login_required
@admin_required
def get_report_history():
    """Get report history"""
    try:
        conn = db_manager.get_connection()
        
        # Ensure report_history table exists
        conn.execute('''
            CREATE TABLE IF NOT EXISTS report_history (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                format TEXT NOT NULL,
                config TEXT,
                file_data BLOB,
                size INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                description TEXT,
                metadata TEXT
            )
        ''')
        
        reports = conn.execute('''
            SELECT id, type, format, config, size, created_at, description, metadata
            FROM report_history 
            ORDER BY created_at DESC
            LIMIT 100
        ''').fetchall()
        
        conn.close()
        
        reports_data = []
        for report in reports:
            reports_data.append({
                'id': report['id'],
                'type': report['type'],
                'format': report['format'],
                'config': json.loads(report['config']) if report['config'] else {},
                'size': report['size'],
                'created_at': report['created_at'],
                'description': report['description'],
                'metadata': json.loads(report['metadata']) if report['metadata'] else {}
            })
        
        return jsonify({'status': 'success', 'reports': reports_data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/reports/history/<report_id>')
@login_required
@admin_required
def get_report_details(report_id):
    """Get detailed information about a specific report"""
    try:
        conn = db_manager.get_connection()
        
        report = conn.execute('''
            SELECT * FROM report_history WHERE id = ?
        ''', (report_id,)).fetchone()
        
        conn.close()
        
        if not report:
            return jsonify({'status': 'error', 'message': 'Report not found'}), 404
        
        report_data = {
            'id': report['id'],
            'type': report['type'],
            'format': report['format'],
            'config': json.loads(report['config']) if report['config'] else {},
            'size': report['size'],
            'created_at': report['created_at'],
            'description': report['description'],
            'metadata': json.loads(report['metadata']) if report['metadata'] else {}
        }
        
        return jsonify({'status': 'success', 'report': report_data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/reports/history/<report_id>/download')
@login_required
@admin_required
def download_report_from_history(report_id):
    """Download a report from history"""
    try:
        conn = db_manager.get_connection()
        
        report = conn.execute('''
            SELECT * FROM report_history WHERE id = ?
        ''', (report_id,)).fetchone()
        
        conn.close()
        
        if not report:
            return jsonify({'status': 'error', 'message': 'Report not found'}), 404
        
        # Get file data
        file_data = report['file_data']
        if not file_data:
            return jsonify({'status': 'error', 'message': 'Report file not available'}), 404
        
        from flask import make_response
        response = make_response(file_data)
        
        # Set appropriate content type
        content_types = {
            'csv': 'text/csv',
            'json': 'application/json',
            'pdf': 'application/pdf',
            'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'zip': 'application/zip'
        }
        
        response.headers['Content-Type'] = content_types.get(report['format'], 'application/octet-stream')
        response.headers['Content-Disposition'] = f'attachment; filename={report["type"]}-{report_id}.{report["format"]}'
        
        return response
        
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/reports/history/<report_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_report_from_history(report_id):
    """Delete a specific report from history"""
    try:
        conn = db_manager.get_connection()
        
        # Check if report exists
        report = conn.execute('SELECT id FROM report_history WHERE id = ?', (report_id,)).fetchone()
        if not report:
            conn.close()
            return jsonify({'status': 'error', 'message': 'Report not found'}), 404
        
        # Delete the report
        conn.execute('DELETE FROM report_history WHERE id = ?', (report_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'status': 'success', 'message': 'Report deleted successfully'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/admin/reports/history', methods=['DELETE'])
@login_required
@admin_required
def clear_report_history():
    """Clear all report history"""
    try:
        conn = db_manager.get_connection()
        
        # Delete all reports
        cursor = conn.execute('DELETE FROM report_history')
        rows_deleted = cursor.rowcount
        conn.commit()
        conn.close()
        
        return jsonify({
            'status': 'success', 
            'message': f'Cleared {rows_deleted} reports from history'
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
        
        # Get badge count (if badges table exists)
        try:
            badge_count = conn.execute(
                "SELECT COUNT(*) FROM user_badges WHERE user_id = ?",
                (current_user.id,)
            ).fetchone()[0]
        except:
            badge_count = 0
        
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
        conn = db_manager.get_connection()
        
        # Ensure badges table exists
        conn.execute('''
            CREATE TABLE IF NOT EXISTS badges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                icon TEXT
            )
        ''')
        
        conn.execute('''
            CREATE TABLE IF NOT EXISTS user_badges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                badge_id INTEGER NOT NULL,
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (badge_id) REFERENCES badges (id)
            )
        ''')
        
        # Get all available badges with user's earned status
        badges = conn.execute('''
            SELECT b.*, ub.earned_at
            FROM badges b
            LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
            ORDER BY b.id
        ''', (current_user.id,)).fetchall()
        
        conn.close()
        
        badges_data = []
        for badge in badges:
            badges_data.append({
                'id': badge['id'],
                'name': badge['name'],
                'description': badge['description'],
                'icon': badge['icon'],
                'earned': badge['earned_at'] is not None,
                'earned_at': badge['earned_at']
            })
        
        return jsonify({'status': 'success', 'badges': badges_data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/game/levels/<int:room_id>')
def get_game_levels(room_id):
    """Get levels for game play (public endpoint)"""
    try:
        conn = db_manager.get_connection()
        
        # Ensure level_data table exists
        conn.execute('''
            CREATE TABLE IF NOT EXISTS level_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_id INTEGER NOT NULL,
                level_number INTEGER NOT NULL,
                name TEXT NOT NULL,
                data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        levels = conn.execute('''
            SELECT level_number, name, data FROM level_data 
            WHERE room_id = ?
            ORDER BY level_number
        ''', (room_id,)).fetchall()
        conn.close()
        
        levels_data = []
        for level in levels:
            level_data = json.loads(level['data']) if level['data'] else {}
            levels_data.append({
                'level_number': level['level_number'],
                'name': level['name'],
                **level_data  # Merge level data into response
            })
        
        return jsonify({'status': 'success', 'levels': levels_data})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

def generate_report_data(report_type, config):
    """Generate report data based on type and configuration"""
    try:
        conn = db_manager.get_connection()
        
        if report_type == 'user-performance':
            # User performance report
            data = conn.execute('''
                SELECT u.username, u.email, u.created_at,
                       COUNT(gs.session_id) as total_sessions,
                       MAX(gs.current_level) as max_level,
                       AVG(gs.current_level) as avg_level
                FROM users u
                LEFT JOIN game_state gs ON gs.session_id LIKE 'user_' || u.id || '_%'
                GROUP BY u.id
                ORDER BY max_level DESC
            ''').fetchall()
            
            return [dict(row) for row in data]
            
        elif report_type == 'challenge-completion':
            # Challenge completion report
            data = conn.execute('''
                SELECT current_level as level, 
                       COUNT(*) as completions,
                       COUNT(DISTINCT session_id) as unique_users
                FROM game_state 
                GROUP BY current_level 
                ORDER BY current_level
            ''').fetchall()
            
            return [dict(row) for row in data]
            
        elif report_type == 'engagement-trends':
            # Engagement trends report
            data = conn.execute('''
                SELECT DATE(updated_at) as date,
                       COUNT(DISTINCT session_id) as active_users,
                       COUNT(*) as total_activities
                FROM game_state 
                WHERE updated_at >= datetime('now', '-30 days')
                GROUP BY DATE(updated_at)
                ORDER BY date DESC
            ''').fetchall()
            
            return [dict(row) for row in data]
            
        elif report_type == 'system-effectiveness':
            # System effectiveness report
            total_users = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
            active_users = conn.execute(
                "SELECT COUNT(DISTINCT session_id) FROM game_state WHERE updated_at > datetime('now', '-7 days')"
            ).fetchone()[0]
            
            level_distribution = conn.execute('''
                SELECT current_level as level, COUNT(*) as users
                FROM game_state 
                GROUP BY current_level 
                ORDER BY current_level
            ''').fetchall()
            
            return {
                'total_users': total_users,
                'active_users': active_users,
                'engagement_rate': (active_users / total_users * 100) if total_users > 0 else 0,
                'level_distribution': [dict(row) for row in level_distribution]
            }
            
        else:
            raise ValueError(f"Unknown report type: {report_type}")
            
    except Exception as e:
        raise Exception(f"Failed to generate {report_type} report: {str(e)}")
    finally:
        if 'conn' in locals():
            conn.close()

def generate_csv_response(data, filename):
    """Generate CSV response from data"""
    import csv
    import io
    from flask import make_response
    
    output = io.StringIO()
    
    if isinstance(data, list) and data:
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    elif isinstance(data, dict):
        # Handle dictionary data by flattening it
        flattened_data = []
        for key, value in data.items():
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        item['category'] = key
                        flattened_data.append(item)
            else:
                flattened_data.append({'metric': key, 'value': value})
        
        if flattened_data:
            writer = csv.DictWriter(output, fieldnames=flattened_data[0].keys())
            writer.writeheader()
            writer.writerows(flattened_data)
    
    csv_content = output.getvalue()
    output.close()
    
    response = make_response(csv_content)
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = f'attachment; filename={filename}.csv'
    
    return response

def generate_excel_response(data, filename):
    """Generate Excel response from data"""
    try:
        # Check if pandas and openpyxl are available
        import importlib.util
        if importlib.util.find_spec("pandas") is None or importlib.util.find_spec("openpyxl") is None:
            raise ImportError("pandas or openpyxl not available")
            
        import pandas as pd
        import io
        from flask import make_response
        
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            if isinstance(data, list) and data:
                df = pd.DataFrame(data)
                df.to_excel(writer, sheet_name='Report', index=False)
            elif isinstance(data, dict):
                # Create multiple sheets for complex data
                for key, value in data.items():
                    if isinstance(value, list) and value:
                        df = pd.DataFrame(value)
                        sheet_name = key.replace('_', ' ').title()[:31]  # Excel sheet name limit
                        df.to_excel(writer, sheet_name=sheet_name, index=False)
                    else:
                        # Single value metrics
                        df = pd.DataFrame([{key: value}])
                        df.to_excel(writer, sheet_name='Metrics', index=False)
        
        excel_content = output.getvalue()
        output.close()
        
        response = make_response(excel_content)
        response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        response.headers['Content-Disposition'] = f'attachment; filename={filename}.xlsx'
        
        return response
    except (ImportError, Exception):
        # Fallback to CSV if pandas/openpyxl not available
        return generate_csv_response(data, filename)

def generate_pdf_response(data, filename):
    """Generate PDF response from data"""
    try:
        # Check if reportlab is available
        import importlib.util
        if importlib.util.find_spec("reportlab") is None:
            raise ImportError("reportlab not available")
        
        # Import reportlab components only if available
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.lib import colors
        except ImportError:
            raise ImportError("reportlab components not available")
            
        import io
        from flask import make_response
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title = Paragraph(f"Ascended Game Report: {filename.replace('-', ' ').title()}", styles['Title'])
        elements.append(title)
        
        # Convert data to table
        if isinstance(data, list) and data:
            # Create table from list of dictionaries
            headers = list(data[0].keys())
            table_data = [headers]
            for row in data:
                table_data.append([str(row.get(key, '')) for key in headers])
            
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(table)
        
        elif isinstance(data, dict):
            # Create paragraphs for dictionary data
            for key, value in data.items():
                if isinstance(value, (str, int, float)):
                    text = f"{key.replace('_', ' ').title()}: {value}"
                    elements.append(Paragraph(text, styles['Normal']))
        
        doc.build(elements)
        pdf_content = buffer.getvalue()
        buffer.close()
        
        response = make_response(pdf_content)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename={filename}.pdf'
        
        return response
    except (ImportError, Exception):
        # Fallback to JSON if reportlab not available or other error occurs
        from flask import make_response
        json_content = json.dumps(data, indent=2)
        response = make_response(json_content)
        response.headers['Content-Type'] = 'application/json'
        response.headers['Content-Disposition'] = f'attachment; filename={filename}.json'
        return response

def generate_csv_content(data):
    """Generate CSV content string from data"""
    import csv
    import io
    
    output = io.StringIO()
    
    if isinstance(data, list) and data:
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)
    elif isinstance(data, dict):
        # Handle dictionary data by flattening it
        flattened_data = []
        for key, value in data.items():
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        item['category'] = key
                        flattened_data.append(item)
            else:
                flattened_data.append({'metric': key, 'value': value})
        
        if flattened_data:
            writer = csv.DictWriter(output, fieldnames=flattened_data[0].keys())
            writer.writeheader()
            writer.writerows(flattened_data)
    
    csv_content = output.getvalue()
    output.close()
    
    return csv_content

def save_report_to_history(report_type, config, file_data, file_format, description=None):
    """Save a generated report to history"""
    try:
        conn = db_manager.get_connection()
        
        # Ensure report_history table exists
        conn.execute('''
            CREATE TABLE IF NOT EXISTS report_history (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                format TEXT NOT NULL,
                config TEXT,
                file_data BLOB,
                size INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                description TEXT,
                metadata TEXT
            )
        ''')
        
        # Generate unique ID
        import uuid
        report_id = str(uuid.uuid4())
        
        # Calculate file size
        file_size = len(file_data) if file_data else 0
        
        # Create metadata
        metadata = {
            'generated_by': current_user.username if current_user.is_authenticated else 'system',
            'user_id': current_user.id if current_user.is_authenticated else None,
            'file_size': file_size,
            'timestamp': datetime.now().isoformat()
        }
        
        # Insert into database
        conn.execute('''
            INSERT INTO report_history (
                id, type, format, config, file_data, size, 
                created_at, description, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
        ''', (
            report_id,
            report_type,
            file_format,
            json.dumps(config),
            file_data,
            file_size,
            description,
            json.dumps(metadata)
        ))
        
        conn.commit()
        
        # Clean up old reports (keep only last 50)
        conn.execute('''
            DELETE FROM report_history 
            WHERE id NOT IN (
                SELECT id FROM report_history 
                ORDER BY created_at DESC 
                LIMIT 50
            )
        ''')
        
        conn.commit()
        conn.close()
        
        return report_id
    except Exception as e:
        print(f"Failed to save report to history: {str(e)}")
        return None

if __name__ == '__main__':
    config_obj = config[config_name]
    app.run(
        debug=config_obj.DEBUG,
        host=config_obj.HOST,
        port=config_obj.PORT
    )