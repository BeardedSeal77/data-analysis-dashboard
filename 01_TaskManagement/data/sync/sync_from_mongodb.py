#!/usr/bin/env python3
"""
MongoDB to JSON Sync Script

This script pulls all data from the MongoDB Atlas database and overwrites
the corresponding JSON files in the current directory.

Usage: python sync_from_mongodb.py
"""

import json
import os
import sys
from typing import Dict, Any, List

from db_manager import DatabaseManager
from config import get_mongodb_config

def write_json_file(filepath: str, data: List[Dict[str, Any]]) -> bool:
    """Write data to JSON file with proper formatting"""
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        print(f"[SUCCESS] Updated {os.path.basename(filepath)} with {len(data)} records")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to write {filepath}: {e}")
        return False

def sync_all_collections():
    """Sync all collections from MongoDB to JSON files"""
    # Get MongoDB configuration
    try:
        config = get_mongodb_config()
        mongodb_uri = config['uri']
        database_name = config['database']
        
        if not mongodb_uri:
            print("[ERROR] MongoDB URI not found in secrets.txt")
            return False
            
    except Exception as e:
        print(f"[ERROR] Failed to load MongoDB config: {e}")
        return False

    # Initialize database manager
    db_manager = DatabaseManager(mongodb_uri, database_name)
    
    # Connect to database
    if not db_manager.connect():
        print("[ERROR] Failed to connect to MongoDB")
        return False

    try:
        # Get the parent data directory path (one level up from sync)
        data_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Sync Tasks
        print("[INFO] Syncing tasks...")
        tasks = db_manager.get_all_tasks()
        write_json_file(os.path.join(data_dir, "hdpsa_tasks.tasks.json"), tasks)

        # Sync Members  
        print("[INFO] Syncing members...")
        members = db_manager.get_all_members()
        write_json_file(os.path.join(data_dir, "hdpsa_tasks.members.json"), members)

        # Sync Milestones
        print("[INFO] Syncing milestones...")
        milestones = db_manager.get_all_milestones()
        write_json_file(os.path.join(data_dir, "hdpsa_tasks.milestones.json"), milestones)

        # Sync Assignments
        print("[INFO] Syncing assignments...")
        assignments = db_manager.get_all_assignments()
        write_json_file(os.path.join(data_dir, "hdpsa_tasks.assignments.json"), assignments)

        print("[SUCCESS] All collections synchronized successfully!")
        return True

    except Exception as e:
        print(f"[ERROR] Synchronization failed: {e}")
        return False
    
    finally:
        # Always close the database connection
        db_manager.disconnect()

def main():
    """Main function"""
    print("=" * 50)
    print("MongoDB to JSON Synchronization Script")
    print("=" * 50)
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"[INFO] Script location: {script_dir}")
    
    # Perform synchronization
    success = sync_all_collections()
    
    if success:
        print("\n[COMPLETE] Synchronization finished successfully!")
        sys.exit(0)
    else:
        print("\n[FAILED] Synchronization encountered errors!")
        sys.exit(1)

if __name__ == "__main__":
    main()