from flask import Flask
from flask_cors import CORS
from database.db_manager import DatabaseManager
from routes.api_routes import create_api_routes
from config import get_mongodb_config, get_api_config

def create_app():
    """
    Application factory pattern for Flask app
    """
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes
    
    # Load configuration
    try:
        mongodb_config = get_mongodb_config()
        api_config = get_api_config()
        print(f"[SUCCESS] Configuration loaded from secrets.txt")
    except Exception as e:
        print(f"[ERROR] Failed to load configuration: {e}")
        print("Make sure secrets.txt exists in the root directory")
        exit(1)
    
    # Initialize database manager
    db_manager = DatabaseManager(
        mongodb_uri=mongodb_config['uri'],
        database_name=mongodb_config['database']
    )
    
    # Connect to database
    if not db_manager.connect():
        print("[ERROR] Failed to connect to MongoDB - exiting")
        exit(1)
    
    # Register API routes
    api_blueprint = create_api_routes(db_manager)
    app.register_blueprint(api_blueprint)
    
    # Store config and db_manager for access in routes
    app.config['DB_MANAGER'] = db_manager
    app.config['API_PORT'] = api_config['task_management_port']
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = app.config['API_PORT']
    
    print("=" * 60)
    print("HDPSA Task Management API - OOP Architecture")
    print("=" * 60)
    print(f"Server starting on: http://localhost:{port}")
    print(f"Health check: http://localhost:{port}/api/health")
    print(f"Project overview: http://localhost:{port}/api/project/overview")
    print("=" * 60)
    
    try:
        app.run(debug=True, host='0.0.0.0', port=port)
    except KeyboardInterrupt:
        print("\n[INFO] Server stopped by user")
    finally:
        # Clean up database connection
        if hasattr(app.config, 'DB_MANAGER'):
            app.config['DB_MANAGER'].disconnect()
        print("[INFO] Application shutdown complete")