from flask import Flask, render_template_string, jsonify, request, session
import os
from datetime import datetime
from functools import wraps
from config import config
from database import DatabaseManager

app = Flask(__name__)

# Load configuration
config_name = os.environ.get('FLASK_CONFIG', 'default')
app.config.from_object(config[config_name])

# Initialize database manager
db_manager = DatabaseManager(
    database_path=app.config['DATABASE'],
    database_dir=app.config.get('DATABASE_DIR', 'database')
)

def check_file_exists(filepath):
    """Check if a file exists"""
    return os.path.exists(filepath)

@app.route('/')
def root():
    """Serve the actual game index.html"""
    # Try different locations for index.html
    possible_paths = app.config.get('STATIC_FILE_PATHS', [
        'index.html',
        'static/index.html',
        'templates/index.html'
    ])
    
    for path in possible_paths:
        if check_file_exists(path):
            try:
                if path.startswith('static/'):
                    return app.send_static_file(path.replace('static/', ''))
                else:
                    # Serve file from root directory
                    from flask import send_from_directory
                    return send_from_directory('.', path)
            except:
                continue
    
    # If no index.html found, show the Flask status page
    return index()

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
    
    template = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>System Verification - Ascended Prototype</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: #fff; }
            .check { color: #00ff00; }
            .error { color: #ff0000; }
            .warning { color: #ffaa00; }
            .section { margin: 20px 0; padding: 15px; background: #333; border-radius: 5px; }
            .code { background: #222; padding: 10px; margin: 10px 0; border-radius: 3px; }
        </style>
    </head>
    <body>
        <h1>🔧 Ascended Prototype - System Verification</h1>
        
        <div class="section">
            <h2>Python Environment</h2>
            <p>Flask Application: Running</p>
            <p>Database: SQLite</p>
        </div>

        <div class="section">
            <h2>Database Connection</h2>
            {% if db_info.connected %}
                <p class="check">✓ Database connection successful</p>
                <p>Tables found: {{ db_info.count }}</p>
                {% for table in db_info.tables %}
                    <p>→ {{ table }}</p>
                {% endfor %}
            {% else %}
                <p class="error">✗ Database connection failed: {{ db_info.error }}</p>
                <p>Run database setup: <a href="/setup">setup</a></p>
            {% endif %}
        </div>

        <div class="section">
            <h2>File Structure</h2>
            {% for file, exists in file_status.items() %}
                {% if exists %}
                    <p class="check">✓ {{ file }}</p>
                {% else %}
                    <p class="error">✗ {{ file }} (missing)</p>
                {% endif %}
            {% endfor %}
        </div>

        <div class="section">
            <h2>Quick Links</h2>
            <p><a href="index.html" style="color: #00ff00;">🎮 Start Game</a></p>
            <p><a href="/api/test" style="color: #00aaff;">🔗 Test API</a></p>
            <p><a href="/setup" style="color: #ffaa00;">🗄️ Database Setup</a></p>
        </div>
    </body>
    </html>
    """
    return render_template_string(template, db_info=db_info, file_status=file_status)

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
    
    template = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Database Setup - Ascended Prototype</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: #fff; }
            .container { max-width: 600px; margin: 0 auto; }
            .btn { display: inline-block; padding: 12px 24px; margin: 10px; background: #007acc; color: white; text-decoration: none; border-radius: 5px; border: none; cursor: pointer; }
            .btn:hover { background: #005a99; }
            .btn.danger { background: #cc0000; }
            .btn.danger:hover { background: #990000; }
            .result { padding: 15px; margin: 15px 0; border-radius: 5px; }
            .success { background: #004400; border: 1px solid #00aa00; }
            .error { background: #440000; border: 1px solid #aa0000; }
            .code { background: #222; padding: 10px; margin: 10px 0; border-radius: 3px; font-family: monospace; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🗄️ Database Setup</h1>
            
            {% if setup_result %}
                <div class="result {{ 'success' if setup_result.success else 'error' }}">
                    {{ setup_result.message }}
                </div>
            {% endif %}
            
            <p>This will create the SQLite database and required tables for the game.</p>
            
            <div class="code">
                Database: {{ config.DATABASE }}<br>
                Tables: game_state, user_progress
            </div>
            
            <a href="/setup?action=init" class="btn">Initialize Database</a>
            <a href="/verify" class="btn">Verify System</a>
            <a href="/" class="btn">Back to Game</a>
            
            <h3>Manual Setup (if needed):</h3>
            <div class="code">
                # Create database directory<br>
                mkdir database<br><br>
                # The Flask app will automatically create tables
            </div>
        </div>
    </body>
    </html>
    """
    return render_template_string(template, setup_result=setup_result, config=app.config)

# Add authentication middleware for protected routes
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'status': 'error', 'message': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

# API endpoints for game functionality
@app.route('/api/save_progress', methods=['POST'])
@login_required
def save_progress():
    """Save game progress"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
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
        result = db_manager.load_progress(session_id)
        
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

        result = db_manager.authenticate_user(identifier, password)
        
        if result['success']:
            user = result['user']
            session['user_id'] = user['id']
            session['username'] = user['username']
            return jsonify({
                'status': 'success',
                'user': {
                    'username': user['username'],
                    'email': user['email']
                }
            })
        else:
            return jsonify({'status': 'error', 'message': result['error']}), 401
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/auth/logout')
def logout():
    session.clear()
    return jsonify({'status': 'success'})

@app.route('/api/auth/user')
def get_current_user():
    if 'user_id' in session:
        return jsonify({
            'status': 'success',
            'user': {
                'username': session.get('username')
            }
        })
    else:
        return jsonify({'status': 'error', 'message': 'Not authenticated'}), 401

if __name__ == '__main__':
    config_obj = config[config_name]
    app.run(
        debug=config_obj.DEBUG,
        host=config_obj.HOST,
        port=config_obj.PORT
    )
