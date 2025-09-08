from typing import List, Optional, Dict, Any
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_manager import DatabaseManager
from models.member import Member
from models.assignment import Assignment, AssignmentStatus

class MemberService:
    """
    Business logic service for member-related operations.
    Handles member management, workload analysis, and skill matching.
    """
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def get_all_members(self) -> List[Member]:
        """Retrieve all members"""
        return self.db.get_all_members()
    
    def get_member_by_id(self, member_id: int) -> Optional[Member]:
        """Get a specific member by ID"""
        return self.db.get_member_by_id(member_id)
    
    def get_active_members(self) -> List[Member]:
        """Get all active members"""
        return self.db.get_active_members()
    
    def get_member_workload(self, member_id: int) -> Dict[str, Any]:
        """Get comprehensive workload analysis for a member"""
        member = self.get_member_by_id(member_id)
        if not member:
            return {"error": "Member not found"}
        
        assignments = self.db.get_assignments_by_member(member_id)
        
        # Categorize assignments by status
        assigned_tasks = [a for a in assignments if a.status == AssignmentStatus.ASSIGNED]
        in_progress_tasks = [a for a in assignments if a.status == AssignmentStatus.IN_PROGRESS]
        completed_tasks = [a for a in assignments if a.status == AssignmentStatus.COMPLETED]
        review_tasks = [a for a in assignments if a.status == AssignmentStatus.REVIEW]
        
        # Calculate workload metrics
        active_tasks = len(assigned_tasks) + len(in_progress_tasks)
        total_time_spent = sum(a.time_spent for a in assignments)
        completion_rate = (len(completed_tasks) / len(assignments) * 100) if assignments else 0
        
        # Get task complexity breakdown for active tasks
        complexity_breakdown = {"low": 0, "medium": 0, "high": 0}
        for assignment in assigned_tasks + in_progress_tasks:
            task = self.db.get_task_by_id(assignment.task_id)
            if task:
                complexity_breakdown[task.complexity.value] += 1
        
        return {
            "member_id": member_id,
            "member_name": member.display_name,
            "is_active": member.is_active,
            "total_assignments": len(assignments),
            "active_tasks": active_tasks,
            "assigned_tasks": len(assigned_tasks),
            "in_progress_tasks": len(in_progress_tasks),
            "completed_tasks": len(completed_tasks),
            "review_tasks": len(review_tasks),
            "total_time_spent": total_time_spent,
            "completion_rate": round(completion_rate, 2),
            "complexity_breakdown": complexity_breakdown
        }
    
    def get_member_assignments(self, member_id: int, status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get assignments for a member with optional status filtering"""
        assignments = self.db.get_assignments_by_member(member_id)
        
        if status_filter:
            try:
                status_enum = AssignmentStatus(status_filter)
                assignments = [a for a in assignments if a.status == status_enum]
            except ValueError:
                return {"error": f"Invalid status filter: {status_filter}"}
        
        # Enrich assignments with task details
        enriched_assignments = []
        for assignment in assignments:
            task = self.db.get_task_by_id(assignment.task_id)
            assignment_dict = assignment.to_dict()
            if task:
                assignment_dict["task"] = task.to_dict()
            enriched_assignments.append(assignment_dict)
        
        return enriched_assignments
    
    def find_best_member_for_task(self, task_id: int) -> Dict[str, Any]:
        """
        Find the best member to assign a task to based on workload
        """
        task = self.db.get_task_by_id(task_id)
        if not task:
            return {"error": "Task not found"}
        
        active_members = self.get_active_members()
        if not active_members:
            return {"error": "No active members available"}
        
        member_scores = []
        
        for member in active_members:
            # Calculate workload score (lower is better)
            workload = self.get_member_workload(member.id)
            workload_score = workload.get("active_tasks", 0)
            
            member_scores.append({
                "member": member.to_dict(),
                "workload_score": workload_score,
                "workload_details": workload
            })
        
        # Sort by workload score (lower is better)
        member_scores.sort(key=lambda x: x["workload_score"])
        
        return {
            "task_id": task_id,
            "task": task.to_dict(),
            "recommended_member": member_scores[0] if member_scores else None,
            "all_candidates": member_scores
        }
    
    def get_team_workload_distribution(self) -> Dict[str, Any]:
        """Get workload distribution across all team members"""
        active_members = self.get_active_members()
        
        workload_data = []
        total_active_tasks = 0
        total_completed_tasks = 0
        
        for member in active_members:
            workload = self.get_member_workload(member.id)
            workload_data.append(workload)
            total_active_tasks += workload.get("active_tasks", 0)
            total_completed_tasks += workload.get("completed_tasks", 0)
        
        # Calculate balance metrics
        if workload_data:
            active_task_counts = [w.get("active_tasks", 0) for w in workload_data]
            max_workload = max(active_task_counts)
            min_workload = min(active_task_counts)
            avg_workload = sum(active_task_counts) / len(active_task_counts)
            workload_variance = sum((x - avg_workload) ** 2 for x in active_task_counts) / len(active_task_counts)
        else:
            max_workload = min_workload = avg_workload = workload_variance = 0
        
        return {
            "team_size": len(active_members),
            "total_active_tasks": total_active_tasks,
            "total_completed_tasks": total_completed_tasks,
            "average_workload": round(avg_workload, 2),
            "max_workload": max_workload,
            "min_workload": min_workload,
            "workload_variance": round(workload_variance, 2),
            "is_balanced": workload_variance < 2.0,  # Arbitrary threshold for "balanced"
            "member_workloads": workload_data
        }
    
    def update_member_status(self, member_id: int, is_active: bool) -> Dict[str, Any]:
        """Update member's active status"""
        member = self.get_member_by_id(member_id)
        if not member:
            return {"success": False, "error": "Member not found"}
        
        # If deactivating member, check for active assignments
        if not is_active:
            assignments = self.db.get_assignments_by_member(member_id)
            active_assignments = [a for a in assignments if a.is_active()]
            if active_assignments:
                return {
                    "success": False, 
                    "error": f"Cannot deactivate member with {len(active_assignments)} active assignments"
                }
        
        member.set_active(is_active)
        success = self.db.update_member(member)
        
        if success:
            return {
                "success": True,
                "message": f"Member {'activated' if is_active else 'deactivated'} successfully",
                "member": member.to_dict()
            }
        else:
            return {"success": False, "error": "Failed to update member status"}
    
    
    def update_member_role(self, member_id: int, new_role: str) -> Dict[str, Any]:
        """Update a member's role"""
        member = self.get_member_by_id(member_id)
        if not member:
            return {"success": False, "error": "Member not found"}
        
        old_role = member.role
        member.update_role(new_role)
        success = self.db.update_member(member)
        
        if success:
            return {
                "success": True,
                "message": f"Role updated from '{old_role}' to '{new_role}'",
                "member": member.to_dict()
            }
        else:
            return {"success": False, "error": "Failed to update role"}
    
    def get_member_performance_metrics(self, member_id: int) -> Dict[str, Any]:
        """Get comprehensive performance metrics for a member"""
        workload = self.get_member_workload(member_id)
        if "error" in workload:
            return workload
        
        assignments = self.db.get_assignments_by_member(member_id)
        
        # Calculate average completion time
        completed_assignments = [a for a in assignments if a.is_completed()]
        total_completion_time = 0
        completion_count = 0
        
        for assignment in completed_assignments:
            duration = assignment.get_duration_days()
            if duration is not None:
                total_completion_time += duration
                completion_count += 1
        
        avg_completion_time = (total_completion_time / completion_count) if completion_count > 0 else 0
        
        return {
            **workload,
            "average_completion_time_days": round(avg_completion_time, 2),
            "total_time_logged": workload.get("total_time_spent", 0),
            "assignments_with_notes": len([a for a in assignments if a.notes])
        }