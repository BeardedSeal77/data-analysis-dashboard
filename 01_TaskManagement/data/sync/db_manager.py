from pymongo import MongoClient
from typing import List, Dict, Any, Union
from bson import ObjectId

class DatabaseManager:
    """Simple database manager for MongoDB sync operations"""
    
    def __init__(self, mongodb_uri: str, database_name: str):
        self.mongodb_uri = mongodb_uri
        self.database_name = database_name
        self.client = None
        self.db = None
    
    def connect(self) -> bool:
        """Establish connection to MongoDB Atlas"""
        try:
            self.client = MongoClient(self.mongodb_uri)
            self.db = self.client[self.database_name]
            self.client.admin.command('ismaster')
            print(f"[SUCCESS] Connected to MongoDB Atlas - Database: {self.database_name}")
            return True
        except Exception as e:
            print(f"[ERROR] MongoDB connection failed: {e}")
            return False
    
    def disconnect(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            print("[INFO] MongoDB connection closed")
    
    def _convert_objectid(self, doc: Union[Dict, List]) -> Union[Dict, List]:
        """Convert MongoDB ObjectId to string for JSON serialization"""
        if isinstance(doc, list):
            return [self._convert_objectid(item) for item in doc]
        elif isinstance(doc, dict):
            for key, value in doc.items():
                if isinstance(value, ObjectId):
                    doc[key] = str(value)
                elif isinstance(value, dict):
                    doc[key] = self._convert_objectid(value)
                elif isinstance(value, list):
                    doc[key] = self._convert_objectid(value)
            return doc
        return doc
    
    def get_all_tasks(self) -> List[Dict[str, Any]]:
        """Retrieve all tasks from database"""
        try:
            task_docs = list(self.db.tasks.find({}))
            return [self._convert_objectid(doc) for doc in task_docs]
        except Exception as e:
            print(f"[ERROR] Failed to fetch tasks: {e}")
            return []
    
    def get_all_members(self) -> List[Dict[str, Any]]:
        """Retrieve all members from database"""
        try:
            member_docs = list(self.db.members.find({}))
            return [self._convert_objectid(doc) for doc in member_docs]
        except Exception as e:
            print(f"[ERROR] Failed to fetch members: {e}")
            return []
    
    def get_all_milestones(self) -> List[Dict[str, Any]]:
        """Retrieve all milestones from database"""
        try:
            milestone_docs = list(self.db.milestones.find({}))
            return [self._convert_objectid(doc) for doc in milestone_docs]
        except Exception as e:
            print(f"[ERROR] Failed to fetch milestones: {e}")
            return []
    
    def get_all_assignments(self) -> List[Dict[str, Any]]:
        """Retrieve all assignments from database"""
        try:
            assignment_docs = list(self.db.assignments.find({}))
            return [self._convert_objectid(doc) for doc in assignment_docs]
        except Exception as e:
            print(f"[ERROR] Failed to fetch assignments: {e}")
            return []