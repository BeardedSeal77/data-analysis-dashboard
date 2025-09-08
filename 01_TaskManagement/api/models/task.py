from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class TaskComplexity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Task:
    def __init__(self, id: int, title: str, description: str, milestone_id: int, 
                 complexity: str, category: str, prerequisites: Optional[List[int]] = None,
                 deliverables: Optional[List[str]] = None, due_date: Optional[str] = None,
                 priority: Optional[str] = None, created_date: Optional[str] = None,
                 updated_date: Optional[str] = None):
        self.id = id
        self.title = title
        self.description = description
        self.milestone_id = milestone_id
        self.complexity = TaskComplexity(complexity)
        self.category = category
        self.prerequisites = prerequisites or []
        self.deliverables = deliverables or []
        self.due_date = due_date
        self.priority = priority
        self.created_date = created_date or datetime.now().isoformat()
        self.updated_date = updated_date or datetime.now().isoformat()
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Task':
        """Create Task from dictionary (MongoDB document)"""
        return cls(
            id=data.get('id'),
            title=data.get('title'),
            description=data.get('description'),
            milestone_id=data.get('milestoneId'),
            complexity=data.get('complexity'),
            category=data.get('category'),
            prerequisites=data.get('prerequisites', []),
            deliverables=data.get('deliverables', []),
            due_date=data.get('dueDate'),
            priority=data.get('priority'),
            created_date=data.get('createdDate'),
            updated_date=data.get('updatedDate')
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert Task to dictionary for MongoDB storage"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'milestoneId': self.milestone_id,
            'complexity': self.complexity.value,
            'category': self.category,
            'prerequisites': self.prerequisites,
            'deliverables': self.deliverables,
            'dueDate': self.due_date,
            'priority': self.priority,
            'createdDate': self.created_date,
            'updatedDate': self.updated_date
        }
    
    def update_title(self, new_title: str):
        """Update task title and timestamp"""
        self.title = new_title
        self.updated_date = datetime.now().isoformat()
    
    def update_description(self, new_description: str):
        """Update task description and timestamp"""
        self.description = new_description
        self.updated_date = datetime.now().isoformat()
    
    def set_due_date(self, due_date: str):
        """Set task due date"""
        self.due_date = due_date
        self.updated_date = datetime.now().isoformat()
    
    def add_prerequisite(self, task_id: int):
        """Add a prerequisite task"""
        if task_id not in self.prerequisites:
            self.prerequisites.append(task_id)
            self.updated_date = datetime.now().isoformat()
    
    def remove_prerequisite(self, task_id: int):
        """Remove a prerequisite task"""
        if task_id in self.prerequisites:
            self.prerequisites.remove(task_id)
            self.updated_date = datetime.now().isoformat()
    
    def can_be_assigned(self, completed_task_ids: List[int]) -> bool:
        """Check if task prerequisites are met"""
        return all(prereq_id in completed_task_ids for prereq_id in self.prerequisites)
    
    def get_complexity_weight(self) -> int:
        """Get numeric weight for complexity"""
        weights = {
            TaskComplexity.LOW: 1,
            TaskComplexity.MEDIUM: 3,
            TaskComplexity.HIGH: 5
        }
        return weights.get(self.complexity, 3)
    
    def __str__(self) -> str:
        return f"Task({self.id}): {self.title} [{self.complexity.value}]"
    
    def __repr__(self) -> str:
        return self.__str__()