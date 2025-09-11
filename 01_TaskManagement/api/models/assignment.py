from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class AssignmentStatus(Enum):
    ASSIGNED = "assigned"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    REVIEW = "review"
    REASSIGNED = "reassigned"

class Assignment:
    def __init__(self, assignment_id: str, composite_task_id: str, member_id: int,
                 status: str = "assigned", assigned_date: Optional[str] = None,
                 completed_date: Optional[str] = None, time_spent: int = 0,
                 notes: Optional[str] = None):
        self.assignment_id = assignment_id
        self.composite_task_id = composite_task_id
        self.member_id = member_id
        self.status = AssignmentStatus(status)
        self.assigned_date = assigned_date or datetime.now().isoformat() + "Z"
        self.completed_date = completed_date
        self.time_spent = time_spent
        self.notes = notes
        self.progress = 0 if status == "assigned" else 100 if status == "completed" else 50
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Assignment':
        """Create Assignment from dictionary (MongoDB document)"""
        assignment = cls(
            assignment_id=data.get('assignmentId'),
            composite_task_id=data.get('compositeTaskId'),
            member_id=data.get('memberId'),
            status=data.get('status', 'assigned'),
            assigned_date=data.get('assignedDate'),
            completed_date=data.get('completedDate'),
            time_spent=data.get('timeSpent', 0),
            notes=data.get('notes')
        )
        return assignment
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert Assignment to dictionary for MongoDB storage"""
        return {
            'assignmentId': self.assignment_id,
            'compositeTaskId': self.composite_task_id,
            'memberId': self.member_id,
            'status': self.status.value,
            'assignedDate': self.assigned_date,
            'completedDate': self.completed_date,
            'timeSpent': self.time_spent,
            'notes': self.notes
        }
    
    @classmethod
    def create_new(cls, composite_task_id: str, member_id: int) -> 'Assignment':
        """Create a new assignment with auto-generated ID"""
        timestamp = int(datetime.now().timestamp() * 1000)
        assignment_id = f"a{timestamp}"
        return cls(assignment_id=assignment_id, composite_task_id=composite_task_id, member_id=member_id)
    
    def start_work(self):
        """Mark assignment as in progress"""
        if self.status == AssignmentStatus.ASSIGNED:
            self.status = AssignmentStatus.IN_PROGRESS
            self.progress = 50
    
    def complete_work(self, notes: Optional[str] = None):
        """Mark assignment as completed"""
        self.status = AssignmentStatus.COMPLETED
        self.completed_date = datetime.now().isoformat() + "Z"
        self.progress = 100
        if notes:
            self.notes = notes
    
    def add_time(self, hours: int):
        """Add time spent on the task"""
        self.time_spent += hours
    
    def add_notes(self, notes: str):
        """Add or update notes"""
        if self.notes:
            self.notes += f"\n{notes}"
        else:
            self.notes = notes
    
    def reassign(self, new_member_id: int):
        """Reassign to a different member"""
        self.status = AssignmentStatus.REASSIGNED
        # Note: This would typically create a new assignment for the new member
        # but we're just updating the status here for tracking
    
    def request_review(self):
        """Request review of completed work"""
        if self.status == AssignmentStatus.COMPLETED:
            self.status = AssignmentStatus.REVIEW
    
    def is_active(self) -> bool:
        """Check if assignment is currently active"""
        return self.status in [AssignmentStatus.ASSIGNED, AssignmentStatus.IN_PROGRESS]
    
    def is_completed(self) -> bool:
        """Check if assignment is completed"""
        return self.status == AssignmentStatus.COMPLETED
    
    def get_duration_days(self) -> Optional[int]:
        """Get duration of assignment in days"""
        if not self.completed_date:
            return None
        
        assigned = datetime.fromisoformat(self.assigned_date.replace('Z', '+00:00'))
        completed = datetime.fromisoformat(self.completed_date.replace('Z', '+00:00'))
        return (completed - assigned).days
    
    def __str__(self) -> str:
        return f"Assignment({self.assignment_id}): Task {self.composite_task_id} -> Member {self.member_id} [{self.status.value}]"
    
    def __repr__(self) -> str:
        return self.__str__()