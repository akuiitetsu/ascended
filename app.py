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
        
        # Create default badges if they don't exist
        create_default_badges(conn)
        conn.close()
    except Exception as e:
        print(f"✗ Error checking/creating admin account: {str(e)}")

def create_default_badges(conn):
    """Create default badges for the game"""
    try:
        # Ensure badges table exists
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
        
        # Check if badges already exist
        existing_badges = conn.execute('SELECT COUNT(*) FROM badges').fetchone()[0]
        if existing_badges > 0:
            print("✓ Default badges already exist")
            return
        
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
        
        # Insert badges
        for room_id, name, description, icon, req_type, req_value in default_badges:
            conn.execute('''
                INSERT INTO badges (room_id, name, description, icon, requirement_type, requirement_value)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (room_id, name, description, icon, req_type, req_value))
        
        conn.commit()
        print(f"✓ Created {len(default_badges)} default badges")
        
    except Exception as e:
        print(f"✗ Error creating default badges: {str(e)}")

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
    # Clear session data
    session.clear()
    return jsonify({'status': 'success', 'redirect': '/'})

@app.route('/logout', methods=['POST'])
def logout_post():
    """Alternative logout endpoint for POST requests"""
    if current_user.is_authenticated:
        logout_user()
    session.clear()
    return redirect('/')

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

def generate_report_data(report_type, config):
    """Generate report data based on type and configuration"""
    try:
        conn = db_manager.get_connection()
        
        if report_type == 'user-performance':
            # Get user performance metrics
            data = conn.execute('''
                SELECT u.username, u.email, u.created_at,
                       COUNT(DISTINCT gs.session_id) as sessions,
                       MAX(gs.current_level) as max_level,
                       AVG(CAST(gs.current_level as FLOAT)) as avg_level
                FROM users u
                LEFT JOIN game_state gs ON gs.session_id LIKE 'user_' || u.id || '_%'
                GROUP BY u.id
                ORDER BY max_level DESC
            ''').fetchall()
            
            return {
                'report_type': report_type,
                'generated_at': datetime.now().isoformat(),
                'data': [dict(row) for row in data]
            }
            
        elif report_type == 'challenge-completion':
            # Get challenge completion statistics
            data = conn.execute('''
                SELECT current_level as level, 
                       COUNT(*) as completions,
                       AVG(CASE WHEN progress_data LIKE '%score%' 
                           THEN CAST(json_extract(progress_data, '$.score') as INTEGER) 
                           ELSE 0 END) as avg_score
                FROM game_state
                GROUP BY current_level
                ORDER BY current_level
            ''').fetchall()
            
            return {
                'report_type': report_type,
                'generated_at': datetime.now().isoformat(),
                'data': [dict(row) for row in data]
            }
            
        elif report_type == 'engagement-trends':
            # Get engagement trends over time
            data = conn.execute('''
                SELECT DATE(updated_at) as date,
                       COUNT(DISTINCT session_id) as active_sessions,
                       COUNT(*) as total_actions
                FROM game_state
                WHERE updated_at > datetime('now', '-30 days')
                GROUP BY DATE(updated_at)
                ORDER BY date DESC
            ''').fetchall()
            
            return {
                'report_type': report_type,
                'generated_at': datetime.now().isoformat(),
                'data': [dict(row) for row in data]
            }
            
        elif report_type == 'system-effectiveness':
            # Get system effectiveness metrics
            total_users = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
            active_users = conn.execute(
                "SELECT COUNT(DISTINCT session_id) FROM game_state WHERE updated_at > datetime('now', '-7 days')"
            ).fetchone()[0]
            
            level_distribution = conn.execute('''
                SELECT current_level, COUNT(*) as user_count
                FROM game_state
                GROUP BY current_level
                ORDER BY current_level
            ''').fetchall()
            
            return {
                'report_type': report_type,
                'generated_at': datetime.now().isoformat(),
                'summary': {
                    'total_users': total_users,
                    'active_users': active_users,
                    'engagement_rate': (active_users / max(total_users, 1)) * 100
                },
                'level_distribution': [dict(row) for row in level_distribution]
            }
            
        else:
            return {
                'report_type': report_type,
                'generated_at': datetime.now().isoformat(),
                'error': f'Unknown report type: {report_type}'
            }
            
    except Exception as e:
        return {
            'report_type': report_type,
            'generated_at': datetime.now().isoformat(),
            'error': str(e)
        }
    finally:
        if 'conn' in locals():
            conn.close()

def generate_csv_response(data, filename):
    """Generate CSV response from report data"""
    import csv
    import io
    from flask import make_response
    
    output = io.StringIO()
    
    if 'data' in data and data['data']:
        # Get column headers from first row
        headers = list(data['data'][0].keys())
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        writer.writerows(data['data'])
    else:
        # Handle summary-style reports
        writer = csv.writer(output)
        writer.writerow(['Report Type', data.get('report_type', 'Unknown')])
        writer.writerow(['Generated At', data.get('generated_at', '')])
        if 'summary' in data:
            writer.writerow([''])
            writer.writerow(['Summary'])
            for key, value in data['summary'].items():
                writer.writerow([key, value])
    
    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = f'attachment; filename={filename}.csv'
    
    return response

def generate_excel_response(data, filename):
    """Generate Excel response from report data"""
    try:
        import openpyxl
        from openpyxl.utils.dataframe import dataframe_to_rows
        import pandas as pd
        from flask import make_response
        import io
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Report Data"
        
        if 'data' in data and data['data']:
            # Convert to DataFrame for easier Excel handling
            df = pd.DataFrame(data['data'])
            for r in dataframe_to_rows(df, index=False, header=True):
                ws.append(r)
        else:
            # Handle summary-style reports
            ws.append(['Report Type', data.get('report_type', 'Unknown')])
            ws.append(['Generated At', data.get('generated_at', '')])
            if 'summary' in data:
                ws.append([''])
                ws.append(['Summary'])
                for key, value in data['summary'].items():
                    ws.append([key, value])
        
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        response = make_response(output.getvalue())
        response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        response.headers['Content-Disposition'] = f'attachment; filename={filename}.xlsx'
        
        return response
        
    except ImportError:
        # Fallback to CSV if Excel libraries not available
        return generate_csv_response(data, filename)

def generate_pdf_response(data, filename):
    """Generate PDF response from report data"""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib import colors
        from flask import make_response
        import io
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title = Paragraph(f"Report: {data.get('report_type', 'Unknown')}", styles['Title'])
        elements.append(title)
        
        # Generated date
        date_para = Paragraph(f"Generated: {data.get('generated_at', '')}", styles['Normal'])
        elements.append(date_para)
        
        if 'data' in data and data['data']:
            # Create table from data
            table_data = []
            if data['data']:
                headers = list(data['data'][0].keys())
                table_data.append(headers)
                for row in data['data']:
                    table_data.append([str(row.get(h, '')) for h in headers])
                
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
        
        doc.build(elements)
        buffer.seek(0)
        
        response = make_response(buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename={filename}.pdf'
        
        return response
        
    except ImportError:
        # Fallback to CSV if PDF libraries not available
        return generate_csv_response(data, filename)

def generate_csv_content(data):
    """Generate CSV content string from report data"""
    import csv
    import io
    
    output = io.StringIO()
    
    if 'data' in data and data['data']:
        headers = list(data['data'][0].keys())
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        writer.writerows(data['data'])
    else:
        writer = csv.writer(output)
        writer.writerow(['Report Type', data.get('report_type', 'Unknown')])
        writer.writerow(['Generated At', data.get('generated_at', '')])
        if 'summary' in data:
            writer.writerow([''])
            writer.writerow(['Summary'])
            for key, value in data['summary'].items():
                writer.writerow([key, value])
    
    return output.getvalue()

def save_report_to_history(report_type, config, file_data, format_type):
    """Save generated report to history"""
    try:
        import uuid
        
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
        
        report_id = str(uuid.uuid4())
        config_json = json.dumps(config) if config else None
        file_size = len(file_data) if file_data else 0
        description = f"{report_type} report in {format_type} format"
        
        conn.execute('''
            INSERT INTO report_history (id, type, format, config, file_data, size, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (report_id, report_type, format_type, config_json, file_data, file_size, description))
        
        conn.commit()
        conn.close()
        
        return {'success': True, 'report_id': report_id}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

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
    """Get user's game progress with detailed metrics for dashboard"""
    try:
        # Get comprehensive progress summary
        progress_summary = db_manager.get_overall_progress_summary(current_user.id)
        
        if not progress_summary['success']:
            return jsonify({'status': 'error', 'message': progress_summary.get('error', 'Failed to load progress')}), 500
        
        # If no progress data yet, return default structure
        if not progress_summary['summary']:
            return jsonify({
                'status': 'success',
                'stats': {
                    'completed_rooms': 0,
                    'current_room': 1,
                    'current_level': 1,
                    'badge_count': 0,
                    'session_count': 0,
                    'last_played': None,
                    'total_score': 0,
                    'completion_rate': 0
                },
                'rooms': []
            })
        
        # Get room-specific progress
        rooms = []
        for room_id in range(1, 6):  # 5 game rooms
            room_progress = db_manager.get_detailed_progress(current_user.id, room_id)
            if room_progress['success'] and room_progress['progress']:
                rooms.append(room_progress['progress'])
            else:
                # Add placeholder for rooms not started yet
                rooms.append({
                    'room_number': room_id,
                    'room_name': f"Room {room_id}",
                    'completion_status': 'not_started',
                    'completion_percentage': 0,
                    'time_spent': 0,
                    'best_score': 0,
                    'attempts': 0
                })
        
        # Get badge count
        conn = db_manager.get_connection()
        badge_count = 0
        try:
            badge_count = conn.execute(
                "SELECT COUNT(*) FROM user_badges WHERE user_id = ?",
                (current_user.id,)
            ).fetchone()[0]
        except:
            pass
        
        # Get session count
        session_count = 0
        try:
            session_count = conn.execute(
                "SELECT COUNT(*) FROM user_sessions WHERE user_id = ?",
                (current_user.id,)
            ).fetchone()[0]
        except:
            pass
        
        conn.close()
        
        # Get current position
        current_room = 1
        current_level = 1
        # Use the room with highest percentage that's not completed, or the first one
        for room in rooms:
            if room['completion_status'] != 'completed' and room['completion_percentage'] > 0:
                current_room = room['room_number']
                break
            elif room['completion_status'] == 'completed':
                current_room = room['room_number'] + 1
                if current_room > 5:
                    current_room = 5  # Cap at max room
        
        summary = progress_summary['summary']
        return jsonify({
            'status': 'success',
            'stats': {
                'completed_rooms': summary['completed_rooms'],
                'total_rooms': summary['total_rooms'],
                'current_room': current_room,
                'current_level': current_level,
                'badge_count': badge_count,
                'session_count': session_count,
                'last_played': rooms[0].get('last_accessed') if rooms else None,
                'total_score': summary['total_score'],
                'total_time_spent': summary['total_time_spent'],
                'completion_rate': round(summary['completion_rate'], 1),
                'performance': summary['performance_metrics']
            },
            'rooms': rooms
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/user/room-progress/<int:room_id>')
@login_required
def get_room_progress(room_id):
    """Get detailed progress for a specific room"""
    try:
        result = db_manager.get_detailed_progress(current_user.id, room_id)
        if result['success']:
            return jsonify({'status': 'success', 'progress': result['progress']})
        else:
            return jsonify({'status': 'error', 'message': result.get('error', 'Failed to load room progress')}), 500
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/user/track-progress', methods=['POST'])
@login_required
def track_user_progress():
    """Update user's progress for a room"""
    try:
        data = request.get_json()
        room_id = data.get('room_id')
        progress_data = data.get('progress_data', {})
        
        if not room_id:
            return jsonify({'status': 'error', 'message': 'Room ID is required'}), 400
            
        result = db_manager.save_user_room_progress(current_user.id, room_id, progress_data)
        
        if not result['success']:
            return jsonify({'status': 'error', 'message': result.get('error', 'Failed to save progress')}), 500
            
        # Return updated completion percentage
        return jsonify({
            'status': 'success', 
            'completion_percentage': result.get('completion_percentage', 0)
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/user/track-event', methods=['POST'])
@login_required
def track_user_event():
    """Track a game event for progress tracking"""
    try:
        data = request.get_json()
        room_id = data.get('room_id')
        event_type = data.get('event_type')
        event_data = data.get('event_data', {})
        
        if not all([room_id, event_type]):
            return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
            
        result = db_manager.track_game_event(current_user.id, room_id, event_type, event_data)
        
        if not result['success']:
            return jsonify({'status': 'error', 'message': result.get('error', 'Failed to track event')}), 500
            
        return jsonify({
            'status': 'success',
            'room_data': result.get('room_data', {})
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/user/all-room-progress')
@login_required
def get_all_room_progress():
    """Get progress for all rooms for dashboard display"""
    try:
        rooms = []
        for room_id in range(1, 6):  # 5 game rooms
            room_progress = db_manager.get_detailed_progress(current_user.id, room_id)
            if room_progress['success'] and room_progress['progress']:
                rooms.append(room_progress['progress'])
            else:
                # Add placeholder for rooms not started yet
                rooms.append({
                    'room_number': room_id,
                    'room_name': get_room_name(room_id),
                    'completion_status': 'not_started',
                    'completion_percentage': 0,
                    'time_spent': 0,
                    'best_score': 0,
                    'attempts': 0
                })
                
        return jsonify({'status': 'success', 'rooms': rooms})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

def get_room_name(room_id):
    """Get standard room name by ID"""
    room_names = {
        1: 'Flowchart Lab',
        2: 'Network Nexus',
        3: 'AI Systems',
        4: 'Database Crisis',
        5: 'Programming Crisis'
    }
    return room_names.get(room_id, f'Room {room_id}')

# Add utility function to database manager class
def get_all_room_progress(self, user_id):
    """Get progress for all rooms"""
    try:
        rooms = []
        for room_id in range(1, 6):  # 5 game rooms
            room_progress = self.get_detailed_progress(user_id, room_id)
            if room_progress['success'] and room_progress['progress']:
                rooms.append(room_progress['progress'])
            else:
                # Add placeholder for rooms not started yet
                rooms.append({
                    'room_number': room_id,
                    'room_name': get_room_name(room_id),
                    'completion_status': 'not_started',
                    'completion_percentage': 0,
                    'time_spent': 0,
                    'best_score': 0,
                    'attempts': 0
                })
        return {'success': True, 'rooms': rooms}
    except Exception as e:
        return {'success': False, 'error': str(e)}

# Add the method to the DatabaseManager class
DatabaseManager.get_all_room_progress = get_all_room_progress

if __name__ == '__main__':
    config_obj = config[config_name]
    app.run(
        debug=config_obj.DEBUG,
        host=config_obj.HOST,
        port=config_obj.PORT
    )