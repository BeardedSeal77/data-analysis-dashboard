import os
from dotenv import load_dotenv

# Load environment variables from .env file in the root directory
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
dotenv_path = os.path.join(root_dir, '.env')
load_dotenv(dotenv_path)

def get_mongodb_config():
    """Get MongoDB configuration from environment variables"""
    return {
        'uri': os.getenv('MONGODB_URI'),
        'database': os.getenv('DATABASE_NAME', 'hdpsa_tasks')
    }

def get_api_config():
    """Get API configuration from environment variables"""
    return {
        'task_management_port': int(os.getenv('TASK_MANAGEMENT_PORT', 5000)),
        'project_api_port': int(os.getenv('PROJECT_API_PORT', 5001))
    }