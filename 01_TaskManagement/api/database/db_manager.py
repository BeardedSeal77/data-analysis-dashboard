from pymongo import MongoClient
from typing import List, Optional, Dict, Any, Union
from bson import ObjectId
import json
from datetime import datetime

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.task import Task
from models.member import Member  
from models.milestone import Milestone
from models.assignment import Assignment

class DatabaseManager:
    """
    Centralized database manager for all MongoDB operations.
    Handles connections, CRUD operations, and data transformations.
    """
    
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
            # Test the connection
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
    
    # TASK OPERATIONS
    def get_all_tasks(self) -> List[Task]:
        """Retrieve all tasks from database"""
        try:
            task_docs = list(self.db.tasks.find({}))
            return [Task.from_dict(self._convert_objectid(doc)) for doc in task_docs]
        except Exception as e:
            print(f"[ERROR] Failed to fetch tasks: {e}")
            return []
    
    def get_task_by_id(self, task_id: int) -> Optional[Task]:
        """Retrieve a specific task by ID"""
        try:
            task_doc = self.db.tasks.find_one({"id": task_id})
            if task_doc:
                return Task.from_dict(self._convert_objectid(task_doc))
            return None
        except Exception as e:
            print(f"[ERROR] Failed to fetch task {task_id}: {e}")
            return None
    
    def get_tasks_by_milestone(self, milestone_id: int) -> List[Task]:
        """Retrieve all tasks for a specific milestone"""
        try:
            task_docs = list(self.db.tasks.find({"milestoneId": milestone_id}))
            return [Task.from_dict(self._convert_objectid(doc)) for doc in task_docs]
        except Exception as e:
            print(f"[ERROR] Failed to fetch tasks for milestone {milestone_id}: {e}")
            return []
    
    def create_task(self, task: Task) -> bool:
        """Insert a new task"""
        try:
            result = self.db.tasks.insert_one(task.to_dict())
            return result.acknowledged
        except Exception as e:
            print(f"[ERROR] Failed to create task: {e}")
            return False
    
    def update_task(self, task: Task) -> bool:
        """Update an existing task"""
        try:
            task_id = task.id if hasattr(task, 'id') else task['id']
            task_dict = task.to_dict() if hasattr(task, 'to_dict') else task
            result = self.db.tasks.update_one(
                {"id": task_id},
                {"$set": task_dict}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"[ERROR] Failed to update task {task_id}: {e}")
            return False
    
    def delete_task(self, task_id: int) -> bool:
        """Delete a task"""
        try:
            result = self.db.tasks.delete_one({"id": task_id})
            return result.deleted_count > 0
        except Exception as e:
            print(f"[ERROR] Failed to delete task {task_id}: {e}")
            return False
    
    # MEMBER OPERATIONS
    def get_all_members(self) -> List[Member]:
        """Retrieve all members from database"""
        try:
            member_docs = list(self.db.members.find({}))
            return [Member.from_dict(self._convert_objectid(doc)) for doc in member_docs]
        except Exception as e:
            print(f"[ERROR] Failed to fetch members: {e}")
            return []
    
    def get_member_by_id(self, member_id: int) -> Optional[Member]:
        """Retrieve a specific member by ID"""
        try:
            member_doc = self.db.members.find_one({"id": member_id})
            if member_doc:
                return Member.from_dict(self._convert_objectid(member_doc))
            return None
        except Exception as e:
            print(f"[ERROR] Failed to fetch member {member_id}: {e}")
            return None
    
    def get_active_members(self) -> List[Member]:
        """Retrieve all active members"""
        try:
            member_docs = list(self.db.members.find({"isActive": True}))
            return [Member.from_dict(self._convert_objectid(doc)) for doc in member_docs]
        except Exception as e:
            print(f"[ERROR] Failed to fetch active members: {e}")
            return []
    
    def create_member(self, member: Member) -> bool:
        """Insert a new member"""
        try:
            result = self.db.members.insert_one(member.to_dict())
            return result.acknowledged
        except Exception as e:
            print(f"[ERROR] Failed to create member: {e}")
            return False
    
    def update_member(self, member: Member) -> bool:
        """Update an existing member"""
        try:
            result = self.db.members.update_one(
                {"id": member.id},
                {"$set": member.to_dict()}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"[ERROR] Failed to update member {member.id}: {e}")
            return False
    
    # MILESTONE OPERATIONS
    def get_all_milestones(self) -> List[Milestone]:
        """Retrieve all milestones from database"""
        try:
            milestone_docs = list(self.db.milestones.find({}))
            return [Milestone.from_dict(self._convert_objectid(doc)) for doc in milestone_docs]
        except Exception as e:
            print(f"[ERROR] Failed to fetch milestones: {e}")
            return []
    
    def get_milestone_by_id(self, milestone_id: int) -> Optional[Milestone]:
        """Retrieve a specific milestone by ID"""
        try:
            milestone_doc = self.db.milestones.find_one({"id": milestone_id})
            if milestone_doc:
                return Milestone.from_dict(self._convert_objectid(milestone_doc))
            return None
        except Exception as e:
            print(f"[ERROR] Failed to fetch milestone {milestone_id}: {e}")
            return None
    
    def update_milestone(self, milestone: Milestone) -> bool:
        """Update an existing milestone"""
        try:
            result = self.db.milestones.update_one(
                {"id": milestone.id},
                {"$set": milestone.to_dict()}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"[ERROR] Failed to update milestone {milestone.id}: {e}")
            return False
    
    # ASSIGNMENT OPERATIONS
    def get_all_assignments(self) -> List[Assignment]:
        """Retrieve all assignments from database"""
        try:
            assignment_docs = list(self.db.assignments.find({}))
            return [Assignment.from_dict(self._convert_objectid(doc)) for doc in assignment_docs]
        except Exception as e:
            print(f"[ERROR] Failed to fetch assignments: {e}")
            return []
    
    def get_assignments_by_member(self, member_id: int) -> List[Assignment]:
        """Retrieve assignments for a specific member"""
        try:
            assignment_docs = list(self.db.assignments.find({"memberId": member_id}))
            return [Assignment.from_dict(self._convert_objectid(doc)) for doc in assignment_docs]
        except Exception as e:
            print(f"[ERROR] Failed to fetch assignments for member {member_id}: {e}")
            return []
    
    def get_assignments_by_task(self, task_id: int) -> List[Assignment]:
        """Retrieve assignments for a specific task"""
        try:
            assignment_docs = list(self.db.assignments.find({"taskId": task_id}))
            return [Assignment.from_dict(self._convert_objectid(doc)) for doc in assignment_docs]
        except Exception as e:
            print(f"[ERROR] Failed to fetch assignments for task {task_id}: {e}")
            return []
    
    def get_assignment_by_id(self, assignment_id: str) -> Optional[Assignment]:
        """Retrieve a specific assignment by ID"""
        try:
            assignment_doc = self.db.assignments.find_one({"assignmentId": assignment_id})
            if assignment_doc:
                return Assignment.from_dict(self._convert_objectid(assignment_doc))
            return None
        except Exception as e:
            print(f"[ERROR] Failed to fetch assignment {assignment_id}: {e}")
            return None
    
    def create_assignment(self, assignment: Assignment) -> bool:
        """Insert a new assignment"""
        try:
            result = self.db.assignments.insert_one(assignment.to_dict())
            return result.acknowledged
        except Exception as e:
            print(f"[ERROR] Failed to create assignment: {e}")
            return False
    
    def update_assignment(self, assignment: Assignment) -> bool:
        """Update an existing assignment"""
        try:
            result = self.db.assignments.update_one(
                {"assignmentId": assignment.assignment_id},
                {"$set": assignment.to_dict()}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"[ERROR] Failed to update assignment {assignment.assignment_id}: {e}")
            return False
    
    def delete_assignment(self, assignment_id: str) -> bool:
        """Delete an assignment"""
        try:
            result = self.db.assignments.delete_one({"assignmentId": assignment_id})
            return result.deleted_count > 0
        except Exception as e:
            print(f"[ERROR] Failed to delete assignment {assignment_id}: {e}")
            return False
    
    # ANALYTICS OPERATIONS
    def get_task_distribution_stats(self) -> List[Dict[str, Any]]:
        """Get task distribution statistics by member"""
        try:
            pipeline = [
                {
                    "$group": {
                        "_id": "$memberId",
                        "taskCount": {"$sum": 1},
                        "completedTasks": {
                            "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
                        }
                    }
                }
            ]
            result = list(self.db.assignments.aggregate(pipeline))
            return self._convert_objectid(result)
        except Exception as e:
            print(f"[ERROR] Failed to get task distribution stats: {e}")
            return []
    
    def get_milestone_progress_stats(self) -> List[Dict[str, Any]]:
        """Get milestone progress statistics"""
        try:
            pipeline = [
                {
                    "$lookup": {
                        "from": "tasks",
                        "localField": "taskId",
                        "foreignField": "id", 
                        "as": "task"
                    }
                },
                {
                    "$unwind": "$task"
                },
                {
                    "$group": {
                        "_id": "$task.milestoneId",
                        "totalTasks": {"$sum": 1},
                        "completedTasks": {
                            "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
                        }
                    }
                }
            ]
            result = list(self.db.assignments.aggregate(pipeline))
            return self._convert_objectid(result)
        except Exception as e:
            print(f"[ERROR] Failed to get milestone progress stats: {e}")
            return []
    
    def health_check(self) -> Dict[str, Any]:
        """Check database connection and return status"""
        try:
            self.client.admin.command('ismaster')
            return {
                "status": "OK",
                "database": self.database_name,
                "timestamp": datetime.now().isoformat(),
                "collections": {
                    "tasks": self.db.tasks.count_documents({}),
                    "members": self.db.members.count_documents({}),
                    "milestones": self.db.milestones.count_documents({}),
                    "assignments": self.db.assignments.count_documents({})
                }
            }
        except Exception as e:
            return {
                "status": "ERROR",
                "message": str(e),
                "timestamp": datetime.now().isoformat()
            }