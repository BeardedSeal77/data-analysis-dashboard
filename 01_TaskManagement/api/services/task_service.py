from typing import List, Optional, Dict, Any
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_manager import DatabaseManager
from models.task import Task, TaskComplexity
from models.assignment import Assignment

class TaskService:
    """
    Business logic service for task-related operations.
    Handles task management, assignment logic, and business rules.
    """
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
    
    def get_all_tasks(self) -> List[Task]:
        """Retrieve all tasks with prerequisite status"""
        tasks = self.db.get_all_tasks()
        return self._enrich_tasks_with_prerequisite_status(tasks)
    
    def get_task_by_id(self, task_id: int) -> Optional[Task]:
        """Get a specific task by ID"""
        return self.db.get_task_by_id(task_id)
    
    def get_tasks_by_milestone(self, milestone_id: int) -> List[Dict[str, Any]]:
        """Get all tasks for a specific milestone with prerequisite status"""
        tasks = self.db.get_tasks_by_milestone(milestone_id)
        return self._enrich_tasks_with_prerequisite_status(tasks)
    
    def get_available_tasks(self, milestone_id: Optional[int] = None) -> List[Task]:
        """
        Get tasks that are available for assignment (not currently assigned to active assignments)
        """
        if milestone_id:
            tasks = self.get_tasks_by_milestone(milestone_id)
        else:
            tasks = self.get_all_tasks()
        
        available_tasks = []
        for task in tasks:
            task_id = task.id if hasattr(task, 'id') else task['id']
            assignments = self.db.get_assignments_by_task(task_id)
            # Check if task has any active assignments
            has_active_assignment = any(assignment.is_active() for assignment in assignments)
            if not has_active_assignment:
                available_tasks.append(task)
        
        return available_tasks
    
    def get_assignable_tasks(self, completed_task_ids: List[int], milestone_id: Optional[int] = None) -> List[Task]:
        """
        Get tasks that can be assigned based on prerequisites being met
        """
        available_tasks = self.get_available_tasks(milestone_id)
        assignable_tasks = []
        
        for task in available_tasks:
            prerequisites = task.prerequisites if hasattr(task, 'prerequisites') else task.get('prerequisites', [])
            can_assign = all(prereq_id in completed_task_ids for prereq_id in prerequisites)
            if can_assign:
                assignable_tasks.append(task)
        
        return assignable_tasks
    
    def get_completed_task_ids(self, milestone_id: Optional[int] = None) -> List[int]:
        """Get IDs of all completed tasks"""
        completed_ids = []
        assignments = self.db.get_all_assignments()
        
        for assignment in assignments:
            if assignment.is_completed():
                # If milestone filter is specified, check if task belongs to that milestone
                if milestone_id:
                    task = self.get_task_by_id(assignment.task_id)
                    if task and task.milestone_id == milestone_id:
                        completed_ids.append(assignment.task_id)
                else:
                    completed_ids.append(assignment.task_id)
        
        return list(set(completed_ids))  # Remove duplicates
    
    def assign_task_to_member(self, task_id: int, member_id: int) -> Dict[str, Any]:
        """
        Assign a task to a member with business rule validation
        """
        # Check if task exists
        task = self.get_task_by_id(task_id)
        if not task:
            return {"success": False, "error": "Task not found"}
        
        # Check if member exists
        member = self.db.get_member_by_id(member_id)
        if not member:
            return {"success": False, "error": "Member not found"}
        
        if not member.is_active:
            return {"success": False, "error": "Member is not active"}
        
        # Check if task is already assigned
        existing_assignments = self.db.get_assignments_by_task(task_id)
        active_assignments = [a for a in existing_assignments if a.is_active()]
        if active_assignments:
            return {"success": False, "error": "Task is already assigned"}
        
        # Prerequisites validation removed - tasks can be assigned regardless of prerequisites
        
        # Create assignment
        assignment = Assignment.create_new(task_id, member_id)
        success = self.db.create_assignment(assignment)
        
        if success:
            return {
                "success": True,
                "message": "Task assigned successfully",
                "assignment": assignment.to_dict()
            }
        else:
            return {"success": False, "error": "Failed to create assignment"}
    
    def complete_task(self, assignment_id: str, notes: Optional[str] = None) -> Dict[str, Any]:
        """
        Complete a task assignment
        """
        assignment = self.db.get_assignment_by_id(assignment_id)
        if not assignment:
            return {"success": False, "error": "Assignment not found"}
        
        if not assignment.is_active():
            return {"success": False, "error": "Assignment is not active"}
        
        # Complete the assignment
        assignment.complete_work(notes)
        success = self.db.update_assignment(assignment)
        
        if success:
            return {
                "success": True,
                "message": "Task completed successfully",
                "assignment": assignment.to_dict()
            }
        else:
            return {"success": False, "error": "Failed to update assignment"}
    
    def get_task_complexity_distribution(self) -> Dict[str, int]:
        """Get distribution of tasks by complexity"""
        tasks = self.get_all_tasks()
        distribution = {"low": 0, "medium": 0, "high": 0}
        
        for task in tasks:
            distribution[task.complexity.value] += 1
        
        return distribution
    
    def get_task_category_distribution(self) -> Dict[str, int]:
        """Get distribution of tasks by category"""
        tasks = self.get_all_tasks()
        distribution = {}
        
        for task in tasks:
            if task.category in distribution:
                distribution[task.category] += 1
            else:
                distribution[task.category] = 1
        
        return distribution
    
    def get_milestone_task_summary(self, milestone_id: int) -> Dict[str, Any]:
        """Get comprehensive task summary for a milestone"""
        tasks = self.get_tasks_by_milestone(milestone_id)  # This returns dictionaries now
        completed_task_ids = self.get_completed_task_ids(milestone_id)
        
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t['id'] in completed_task_ids])
        available_tasks = len(self.get_available_tasks(milestone_id))
        assignable_tasks = len(self.get_assignable_tasks(completed_task_ids, milestone_id))
        
        complexity_dist = {"low": 0, "medium": 0, "high": 0}
        category_dist = {}
        
        for task in tasks:
            complexity_dist[task['complexity']] += 1
            if task['category'] in category_dist:
                category_dist[task['category']] += 1
            else:
                category_dist[task['category']] = 1
        
        progress_percentage = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        return {
            "milestone_id": milestone_id,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "available_tasks": available_tasks,
            "assignable_tasks": assignable_tasks,
            "progress_percentage": round(progress_percentage, 2),
            "complexity_distribution": complexity_dist,
            "category_distribution": category_dist
        }
    
    def create_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new task with validation"""
        try:
            task = Task.from_dict(task_data)
            success = self.db.create_task(task)
            
            if success:
                return {
                    "success": True,
                    "message": "Task created successfully",
                    "task": task.to_dict()
                }
            else:
                return {"success": False, "error": "Failed to create task"}
        except Exception as e:
            return {"success": False, "error": f"Invalid task data: {str(e)}"}
    
    def update_task(self, task_id: int, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a task with validation"""
        task = self.get_task_by_id(task_id)
        if not task:
            return {"success": False, "error": "Task not found"}
        
        try:
            # Update task fields
            for field, value in update_data.items():
                if hasattr(task, field):
                    if field == "complexity":
                        task.complexity = TaskComplexity(value)
                    else:
                        setattr(task, field, value)
            
            task.updated_date = task.updated_date  # This triggers update in the model
            success = self.db.update_task(task)
            
            if success:
                return {
                    "success": True,
                    "message": "Task updated successfully",
                    "task": task.to_dict()
                }
            else:
                return {"success": False, "error": "Failed to update task"}
        except Exception as e:
            return {"success": False, "error": f"Invalid update data: {str(e)}"}
    
    def delete_task(self, task_id: int) -> Dict[str, Any]:
        """Delete a task and its assignments"""
        task = self.get_task_by_id(task_id)
        if not task:
            return {"success": False, "error": "Task not found"}
        
        # Check if task has active assignments
        assignments = self.db.get_assignments_by_task(task_id)
        active_assignments = [a for a in assignments if a.is_active()]
        if active_assignments:
            return {"success": False, "error": "Cannot delete task with active assignments"}
        
        # Delete all assignments for this task
        for assignment in assignments:
            self.db.delete_assignment(assignment.assignment_id)
        
        # Delete the task
        success = self.db.delete_task(task_id)
        
        if success:
            return {"success": True, "message": "Task deleted successfully"}
        else:
            return {"success": False, "error": "Failed to delete task"}
    
    def _enrich_tasks_with_prerequisite_status(self, tasks: List[Task]) -> List[Dict[str, Any]]:
        """Add prerequisite status information to tasks"""
        # Get all assignments to determine task statuses
        all_assignments = []
        for task in tasks:
            task_id = task.id if hasattr(task, 'id') else task['id']
            assignments = self.db.get_assignments_by_task(task_id)
            all_assignments.extend(assignments)
        
        # Create a mapping of task_id -> status
        task_status_map = {}
        for assignment in all_assignments:
            task_id = assignment.task_id
            if assignment.status.value == 'completed':
                task_status_map[task_id] = 'completed'
            elif assignment.status.value in ['assigned', 'in-progress'] and task_id not in task_status_map:
                task_status_map[task_id] = 'assigned'
        
        # Enrich each task with prerequisite status
        enriched_tasks = []
        for task in tasks:
            task_dict = task.to_dict() if hasattr(task, 'to_dict') else task
            
            # Add prerequisite status for each prerequisite
            prerequisites = task.prerequisites if hasattr(task, 'prerequisites') else task_dict.get('prerequisites', [])
            if prerequisites:
                prerequisite_status = {}
                for prereq_id in prerequisites:
                    if prereq_id in task_status_map:
                        if task_status_map[prereq_id] == 'completed':
                            prerequisite_status[prereq_id] = 'completed'  # green
                        else:
                            prerequisite_status[prereq_id] = 'assigned'   # yellow
                    else:
                        prerequisite_status[prereq_id] = 'backlog'       # red
                
                task_dict['prerequisiteStatus'] = prerequisite_status
            else:
                task_dict['prerequisiteStatus'] = {}
            
            enriched_tasks.append(task_dict)
        
        return enriched_tasks