import sqlite3
import os
from flask import Flask, render_template_string

app = Flask(__name__)

def setup_database():
    """Setup SQLite database and tables"""
    try:
        # Ensure database directory exists
        os.makedirs('database', exist_ok=True)
        
        # Connect to SQLite database (creates if doesn't exist)
        conn = sqlite3.connect('database/ascended_prototype.db')
        cursor = conn.cursor()
        
        # Read and execute schema
        if os.path.exists('database/schema.sql'):
            with open('database/schema.sql', 'r') as f:
                schema = f.read()
            cursor.executescript(schema)
        else:
            # Fallback schema if file doesn't exist
            cursor.executescript("""
                -- Users table
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE
                );

                -- Sessions table for user authentication
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    session_token TEXT UNIQUE NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                -- Application data table
                CREATE TABLE IF NOT EXISTS app_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    data_type TEXT NOT NULL,
                    data_content TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                -- Create indexes for better performance
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
                CREATE INDEX IF NOT EXISTS idx_app_data_user ON app_data(user_id);
            """)
        
        conn.commit()
        conn.close()
        
        return {
            'success': True,
            'message': "Database 'ascended_prototype.db' has been created successfully."
        }
        
    except Exception as e:
        return {
            'success': False,
            'message': f"Database setup failed: {str(e)}"
        }

@app.route('/setup')
def setup_page():
    """Database setup page"""
    result = setup_database()
    
    template = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Database Setup - Ascended Prototype</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: #fff; }
            .success { color: #00ff00; }
            .error { color: #ff0000; }
        </style>
    </head>
    <body>
        {% if result.success %}
            <h2 class="success">Database Setup Complete!</h2>
            <p>{{ result.message }}</p>
            <p><a href="/">Return to Home</a></p>
            <p><a href="/verify">Verify System</a></p>
        {% else %}
            <h2 class="error">Database Setup Failed!</h2>
            <p>Error: {{ result.message }}</p>
        {% endif %}
    </body>
    </html>
    """
    return render_template_string(template, result=result)

if __name__ == '__main__':
    result = setup_database()
    print(f"Setup result: {result}")
