from typing import Optional, Dict, Any
from datetime import datetime

class Member:
    def __init__(self, id: int, name: str, student_number: str, display_name: str, 
                 role: str, github_username: Optional[str] = None, email: Optional[str] = None,
                 joined_date: Optional[str] = None, is_active: bool = True,
                 member_color: str = "blue"):
        self.id = id
        self.name = name
        self.student_number = student_number
        self.display_name = display_name
        self.role = role
        self.github_username = github_username
        self.email = email
        self.joined_date = joined_date or datetime.now().isoformat()
        self.is_active = is_active
        self.member_color = member_color
        self.github_id = None
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Member':
        """Create Member from dictionary (MongoDB document)"""
        member = cls(
            id=data.get('id'),
            name=data.get('name'),
            student_number=data.get('studentNumber'),
            display_name=data.get('displayName'),
            role=data.get('role'),
            github_username=data.get('githubUsername'),
            email=data.get('email'),
            joined_date=data.get('joinedDate'),
            is_active=data.get('isActive', True),
            member_color=data.get('memberColor', 'blue')
        )
        member.github_id = data.get('githubId')
        return member
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert Member to dictionary for MongoDB storage"""
        return {
            'id': self.id,
            'name': self.name,
            'studentNumber': self.student_number,
            'displayName': self.display_name,
            'role': self.role,
            'githubUsername': self.github_username,
            'email': self.email,
            'joinedDate': self.joined_date,
            'isActive': self.is_active,
            'memberColor': self.member_color,
            'githubId': self.github_id
        }
    
    def update_role(self, new_role: str):
        """Update member's role"""
        self.role = new_role
    
    def set_active(self, is_active: bool):
        """Set member's active status"""
        self.is_active = is_active
    
    def __str__(self) -> str:
        return f"Member({self.id}): {self.display_name} - {self.role}"
    
    def __repr__(self) -> str:
        return self.__str__()