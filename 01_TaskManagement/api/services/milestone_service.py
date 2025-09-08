from typing import List, Optional, Dict, Any
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_manager import DatabaseManager
from models.milestone import Milestone, MilestoneStatus
from services.task_service import TaskService

class MilestoneService:
    """
    Business logic service for milestone-related operations.
    Handles milestone management, progress tracking, and deliverable management.
    """
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
        self.task_service = TaskService(db_manager)
    
    def get_all_milestones(self) -> List[Milestone]:
        """Retrieve all milestones"""
        return self.db.get_all_milestones()
    
    def get_milestone_by_id(self, milestone_id: int) -> Optional[Milestone]:
        """Get a specific milestone by ID"""
        return self.db.get_milestone_by_id(milestone_id)
    
    def get_active_milestones(self) -> List[Milestone]:
        """Get all active milestones"""
        milestones = self.get_all_milestones()
        return [m for m in milestones if m.is_active()]
    
    def get_milestone_progress(self, milestone_id: int) -> Dict[str, Any]:
        """Get comprehensive progress information for a milestone"""
        milestone = self.get_milestone_by_id(milestone_id)
        if not milestone:
            return {"error": "Milestone not found"}
        
        # Get task summary from task service
        task_summary = self.task_service.get_milestone_task_summary(milestone_id)
        
        # Get assignment details
        tasks = self.task_service.get_tasks_by_milestone(milestone_id)
        all_assignments = []
        for task in tasks:
            assignments = self.db.get_assignments_by_task(task['id'])
            all_assignments.extend(assignments)
        
        # Calculate time metrics
        total_time_spent = sum(a.time_spent for a in all_assignments)
        active_assignments = [a for a in all_assignments if a.is_active()]
        completed_assignments = [a for a in all_assignments if a.is_completed()]
        
        # Calculate deliverable completion
        deliverable_progress = self._calculate_deliverable_progress(milestone, task_summary)
        
        return {
            "milestone": milestone.to_dict(),
            "task_summary": task_summary,
            "total_assignments": len(all_assignments),
            "active_assignments": len(active_assignments),
            "completed_assignments": len(completed_assignments),
            "total_time_spent": total_time_spent,
            "deliverable_progress": deliverable_progress,
            "estimated_completion": self._estimate_completion_date(milestone, task_summary)
        }
    
    def update_milestone_progress(self, milestone_id: int, auto_calculate: bool = True) -> Dict[str, Any]:
        """Update milestone progress based on task completion"""
        milestone = self.get_milestone_by_id(milestone_id)
        if not milestone:
            return {"success": False, "error": "Milestone not found"}
        
        if auto_calculate:
            task_summary = self.task_service.get_milestone_task_summary(milestone_id)
            new_progress = int(task_summary.get("progress_percentage", 0))
            milestone.update_progress(new_progress)
        
        success = self.db.update_milestone(milestone)
        
        if success:
            return {
                "success": True,
                "message": "Milestone progress updated",
                "milestone": milestone.to_dict(),
                "progress": milestone.progress
            }
        else:
            return {"success": False, "error": "Failed to update milestone progress"}
    
    def start_milestone(self, milestone_id: int) -> Dict[str, Any]:
        """Start a milestone and ensure prerequisites are met"""
        milestone = self.get_milestone_by_id(milestone_id)
        if not milestone:
            return {"success": False, "error": "Milestone not found"}
        
        if milestone.is_active():
            return {"success": False, "error": "Milestone is already active"}
        
        if milestone.is_completed():
            return {"success": False, "error": "Milestone is already completed"}
        
        # Check if previous milestones are completed (simple sequential check)
        if milestone_id > 1:
            previous_milestone = self.get_milestone_by_id(milestone_id - 1)
            if previous_milestone and not previous_milestone.is_completed():
                return {
                    "success": False, 
                    "error": f"Previous milestone '{previous_milestone.name}' must be completed first"
                }
        
        milestone.start_milestone()
        success = self.db.update_milestone(milestone)
        
        if success:
            return {
                "success": True,
                "message": f"Milestone '{milestone.name}' started successfully",
                "milestone": milestone.to_dict()
            }
        else:
            return {"success": False, "error": "Failed to start milestone"}
    
    def complete_milestone(self, milestone_id: int) -> Dict[str, Any]:
        """Complete a milestone with validation"""
        milestone = self.get_milestone_by_id(milestone_id)
        if not milestone:
            return {"success": False, "error": "Milestone not found"}
        
        if milestone.is_completed():
            return {"success": False, "error": "Milestone is already completed"}
        
        # Check if all tasks are completed
        task_summary = self.task_service.get_milestone_task_summary(milestone_id)
        if task_summary.get("progress_percentage", 0) < 100:
            return {
                "success": False,
                "error": f"Cannot complete milestone with {task_summary.get('total_tasks', 0) - task_summary.get('completed_tasks', 0)} incomplete tasks"
            }
        
        milestone.complete_milestone()
        success = self.db.update_milestone(milestone)
        
        if success:
            return {
                "success": True,
                "message": f"Milestone '{milestone.name}' completed successfully",
                "milestone": milestone.to_dict()
            }
        else:
            return {"success": False, "error": "Failed to complete milestone"}
    
    def pause_milestone(self, milestone_id: int) -> Dict[str, Any]:
        """Pause a milestone"""
        milestone = self.get_milestone_by_id(milestone_id)
        if not milestone:
            return {"success": False, "error": "Milestone not found"}
        
        if not milestone.is_active():
            return {"success": False, "error": "Can only pause active milestones"}
        
        milestone.pause_milestone()
        success = self.db.update_milestone(milestone)
        
        if success:
            return {
                "success": True,
                "message": f"Milestone '{milestone.name}' paused",
                "milestone": milestone.to_dict()
            }
        else:
            return {"success": False, "error": "Failed to pause milestone"}
    
    def resume_milestone(self, milestone_id: int) -> Dict[str, Any]:
        """Resume a paused milestone"""
        milestone = self.get_milestone_by_id(milestone_id)
        if not milestone:
            return {"success": False, "error": "Milestone not found"}
        
        if milestone.status != MilestoneStatus.PAUSED:
            return {"success": False, "error": "Can only resume paused milestones"}
        
        milestone.resume_milestone()
        success = self.db.update_milestone(milestone)
        
        if success:
            return {
                "success": True,
                "message": f"Milestone '{milestone.name}' resumed",
                "milestone": milestone.to_dict()
            }
        else:
            return {"success": False, "error": "Failed to resume milestone"}
    
    def add_deliverable(self, milestone_id: int, deliverable: str) -> Dict[str, Any]:
        """Add a deliverable to a milestone"""
        milestone = self.get_milestone_by_id(milestone_id)
        if not milestone:
            return {"success": False, "error": "Milestone not found"}
        
        milestone.add_deliverable(deliverable)
        success = self.db.update_milestone(milestone)
        
        if success:
            return {
                "success": True,
                "message": f"Deliverable '{deliverable}' added",
                "milestone": milestone.to_dict()
            }
        else:
            return {"success": False, "error": "Failed to add deliverable"}
    
    def remove_deliverable(self, milestone_id: int, deliverable: str) -> Dict[str, Any]:
        """Remove a deliverable from a milestone"""
        milestone = self.get_milestone_by_id(milestone_id)
        if not milestone:
            return {"success": False, "error": "Milestone not found"}
        
        if deliverable not in milestone.deliverables:
            return {"success": False, "error": "Deliverable not found"}
        
        milestone.remove_deliverable(deliverable)
        success = self.db.update_milestone(milestone)
        
        if success:
            return {
                "success": True,
                "message": f"Deliverable '{deliverable}' removed",
                "milestone": milestone.to_dict()
            }
        else:
            return {"success": False, "error": "Failed to remove deliverable"}
    
    def get_project_overview(self) -> Dict[str, Any]:
        """Get comprehensive project overview across all milestones"""
        milestones = self.get_all_milestones()
        
        total_milestones = len(milestones)
        completed_milestones = len([m for m in milestones if m.is_completed()])
        active_milestones = len([m for m in milestones if m.is_active()])
        
        # Overall project progress (weighted by milestone)
        total_progress = sum(m.progress for m in milestones)
        overall_progress = (total_progress / (total_milestones * 100)) * 100 if total_milestones > 0 else 0
        
        # Get current milestone (first milestone that isn't completed)
        current_milestone = None
        for milestone in sorted(milestones, key=lambda x: x.id):
            if not milestone.is_completed():
                current_milestone = milestone
                break
        
        # Aggregate task statistics
        total_tasks = 0
        completed_tasks = 0
        active_assignments = 0
        total_time_spent = 0
        
        for milestone in milestones:
            # Update milestone progress based on task completion
            task_summary = self.task_service.get_milestone_task_summary(milestone.id)
            progress_percentage = task_summary.get("progress_percentage", 0)
            if milestone.progress != progress_percentage:
                milestone.update_progress(int(progress_percentage))
                self.db.update_milestone(milestone)
            
            total_tasks += task_summary.get("total_tasks", 0)
            completed_tasks += task_summary.get("completed_tasks", 0)
            
            # Get assignments for time tracking
            tasks = self.task_service.get_tasks_by_milestone(milestone.id)
            for task_dict in tasks:
                task_id = task_dict['id']
                assignments = self.db.get_assignments_by_task(task_id)
                active_assignments += len([a for a in assignments if a.is_active()])
                total_time_spent += sum(a.time_spent for a in assignments)
        
        return {
            "project_name": "HDPSA Task Management System",
            "total_milestones": total_milestones,
            "completed_milestones": completed_milestones,
            "active_milestones": active_milestones,
            "overall_progress": round(overall_progress, 2),
            "current_milestone": current_milestone.to_dict() if current_milestone else None,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "task_completion_rate": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2),
            "active_assignments": active_assignments,
            "total_time_spent": total_time_spent,
            "milestones": [m.to_dict() for m in milestones]
        }
    
    def _calculate_deliverable_progress(self, milestone: Milestone, task_summary: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate deliverable completion progress"""
        if not milestone.deliverables:
            return {"total_deliverables": 0, "completed_deliverables": 0, "completion_rate": 100}
        
        # Simple mapping: each completed task contributes to deliverable completion
        # In a more sophisticated system, tasks would be explicitly linked to deliverables
        total_deliverables = len(milestone.deliverables)
        completion_ratio = task_summary.get("progress_percentage", 0) / 100
        completed_deliverables = int(total_deliverables * completion_ratio)
        
        return {
            "total_deliverables": total_deliverables,
            "completed_deliverables": completed_deliverables,
            "completion_rate": round(completion_ratio * 100, 2),
            "deliverables": milestone.deliverables
        }
    
    def _estimate_completion_date(self, milestone: Milestone, task_summary: Dict[str, Any]) -> Optional[str]:
        """Estimate milestone completion date based on current progress"""
        if milestone.is_completed():
            return "Already completed"
        
        if not milestone.due_date:
            return "No due date set"
        
        progress = task_summary.get("progress_percentage", 0)
        if progress == 0:
            return "Cannot estimate - no progress made"
        
        # Simple linear estimation based on current progress rate
        # In reality, this would be more sophisticated
        remaining_progress = 100 - progress
        if remaining_progress <= 0:
            return "Ready for completion"
        
        return f"Estimated based on {progress}% completion"