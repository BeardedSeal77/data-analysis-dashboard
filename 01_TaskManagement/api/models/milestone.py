from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class MilestoneStatus(Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    PENDING = "pending"

class MilestoneSection:
    def __init__(self, title: str, icon: str, color: str, items: List[str]):
        self.title = title
        self.icon = icon
        self.color = color
        self.items = items
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MilestoneSection':
        return cls(
            title=data.get('title', ''),
            icon=data.get('icon', ''),
            color=data.get('color', ''),
            items=data.get('items', [])
        )
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'title': self.title,
            'icon': self.icon,
            'color': self.color,
            'items': self.items
        }

class MilestoneAbout:
    def __init__(self, description: str, sections: List[MilestoneSection]):
        self.description = description
        self.sections = sections
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MilestoneAbout':
        sections = [MilestoneSection.from_dict(section) for section in data.get('sections', [])]
        return cls(
            description=data.get('description', ''),
            sections=sections
        )
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'description': self.description,
            'sections': [section.to_dict() for section in self.sections]
        }

class Milestone:
    def __init__(self, id: int, name: str, subtitle: str, icon: str, color: str,
                 status: str, about: MilestoneAbout, deliverables: Optional[List[str]] = None,
                 due_date: Optional[str] = None, progress: int = 0,
                 estimated_duration: Optional[str] = None):
        self.id = id
        self.name = name
        self.subtitle = subtitle
        self.icon = icon
        self.color = color
        self.status = MilestoneStatus(status)
        self.about = about
        self.deliverables = deliverables or []
        self.due_date = due_date
        self.progress = progress
        self.estimated_duration = estimated_duration
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Milestone':
        """Create Milestone from dictionary (MongoDB document)"""
        about_data = data.get('about', {})
        about = MilestoneAbout.from_dict(about_data)
        
        return cls(
            id=data.get('id'),
            name=data.get('name'),
            subtitle=data.get('subtitle'),
            icon=data.get('icon'),
            color=data.get('color'),
            status=data.get('status'),
            about=about,
            deliverables=data.get('deliverables', []),
            due_date=data.get('dueDate'),
            progress=data.get('progress', 0),
            estimated_duration=data.get('estimatedDuration')
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert Milestone to dictionary for MongoDB storage"""
        result = {
            'id': self.id,
            'name': self.name,
            'subtitle': self.subtitle,
            'icon': self.icon,
            'color': self.color,
            'status': self.status.value,
            'about': self.about.to_dict(),
            'deliverables': self.deliverables,
            'progress': self.progress
        }
        
        if self.due_date:
            result['dueDate'] = self.due_date
        if self.estimated_duration:
            result['estimatedDuration'] = self.estimated_duration
            
        return result
    
    def update_progress(self, new_progress: int):
        """Update milestone progress (0-100)"""
        self.progress = max(0, min(100, new_progress))
        
        # Auto-update status based on progress
        if self.progress == 0:
            self.status = MilestoneStatus.PLANNING
        elif self.progress == 100:
            self.status = MilestoneStatus.COMPLETED
        else:
            self.status = MilestoneStatus.ACTIVE
    
    def start_milestone(self):
        """Mark milestone as active"""
        self.status = MilestoneStatus.ACTIVE
        if self.progress == 0:
            self.progress = 1
    
    def complete_milestone(self):
        """Mark milestone as completed"""
        self.status = MilestoneStatus.COMPLETED
        self.progress = 100
    
    def pause_milestone(self):
        """Pause milestone work"""
        if self.status == MilestoneStatus.ACTIVE:
            self.status = MilestoneStatus.PAUSED
    
    def resume_milestone(self):
        """Resume milestone work"""
        if self.status == MilestoneStatus.PAUSED:
            self.status = MilestoneStatus.ACTIVE
    
    def set_due_date(self, due_date: str):
        """Set milestone due date"""
        self.due_date = due_date
    
    def add_deliverable(self, deliverable: str):
        """Add a deliverable to the milestone"""
        if deliverable not in self.deliverables:
            self.deliverables.append(deliverable)
    
    def remove_deliverable(self, deliverable: str):
        """Remove a deliverable from the milestone"""
        if deliverable in self.deliverables:
            self.deliverables.remove(deliverable)
    
    def is_active(self) -> bool:
        """Check if milestone is currently active"""
        return self.status == MilestoneStatus.ACTIVE
    
    def is_completed(self) -> bool:
        """Check if milestone is completed"""
        return self.status == MilestoneStatus.COMPLETED
    
    def get_section_by_title(self, title: str) -> Optional[MilestoneSection]:
        """Get a section by its title"""
        for section in self.about.sections:
            if section.title.lower() == title.lower():
                return section
        return None
    
    def calculate_progress_from_tasks(self, completed_tasks: int, total_tasks: int) -> int:
        """Calculate progress based on completed tasks"""
        if total_tasks == 0:
            return 0
        return int((completed_tasks / total_tasks) * 100)
    
    def __str__(self) -> str:
        return f"Milestone({self.id}): {self.name} [{self.status.value} - {self.progress}%]"
    
    def __repr__(self) -> str:
        return self.__str__()