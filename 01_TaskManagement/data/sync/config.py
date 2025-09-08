import os

def load_secrets():
    """Load secrets from secrets.txt file"""
    secrets = {}
    
    # Look for secrets.txt in the root directory (4 levels up from sync folder)
    secrets_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'secrets.txt')
    
    if not os.path.exists(secrets_path):
        raise FileNotFoundError(f"secrets.txt not found at {secrets_path}")
    
    with open(secrets_path, 'r') as file:
        for line in file:
            line = line.strip()
            # Skip comments and empty lines
            if not line or line.startswith('#'):
                continue
                
            # Parse KEY=VALUE format
            if '=' in line:
                key, value = line.split('=', 1)
                secrets[key.strip()] = value.strip()
    
    return secrets

def get_mongodb_config():
    """Get MongoDB configuration from secrets"""
    secrets = load_secrets()
    
    return {
        'uri': secrets.get('MONGODB_URI'),
        'database': secrets.get('DATABASE_NAME', 'hdpsa_tasks')
    }

def get_api_config():
    """Get API configuration from secrets"""
    secrets = load_secrets()
    
    return {
        'task_management_port': int(secrets.get('TASK_MANAGEMENT_PORT', 5000)),
        'project_api_port': int(secrets.get('PROJECT_API_PORT', 5001))
    }