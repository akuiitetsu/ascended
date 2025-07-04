#!/usr/bin/env python3
"""
Database reset script for AscendEd
This script will recreate the database with the complete schema
"""

import os
import sqlite3
from database import DatabaseManager
from config import config

def reset_database():
    """Reset and recreate the database with complete schema"""
    
    # Configuration
    config_obj = config['development']
    db_path = config_obj.DATABASE
    db_dir = config_obj.DATABASE_DIR
    
    print(f"Resetting database: {db_path}")
    
    # Remove existing database
    if os.path.exists(db_path):
        os.remove(db_path)
        print("✓ Removed existing database")
    
    # Ensure directory exists
    os.makedirs(db_dir, exist_ok=True)
    print(f"✓ Created directory: {db_dir}")
    
    # Initialize database manager
    db_manager = DatabaseManager(db_path, db_dir)
    
    # Initialize database
    result = db_manager.init_database()
    
    if result is True:
        print("✓ Database initialized successfully")
        
        # Create default admin
        admin_result = db_manager.create_admin('admin', 'admin@ascended.local', 'admin123')
        if admin_result['success']:
            print("✓ Default admin account created")
            print("  Username: admin")
            print("  Email: admin@ascended.local") 
            print("  Password: admin123")
        else:
            print(f"⚠ Failed to create admin: {admin_result['error']}")
        
        # Verify database structure
        conn = db_manager.get_connection()
        
        # List all tables
        tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
        print(f"✓ Created {len(tables)} tables:")
        for table in tables:
            count = conn.execute(f"SELECT COUNT(*) FROM {table['name']}").fetchone()[0]
            print(f"  - {table['name']}: {count} records")
        
        conn.close()
        
    else:
        print(f"✗ Database initialization failed: {result[1]}")
        return False
    
    print("\n🎉 Database reset complete!")
    print("You can now run the application with: python app.py")
    return True

if __name__ == '__main__':
    reset_database()
