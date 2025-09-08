from flask import Blueprint, request, jsonify
from typing import Dict, Any
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db_manager import DatabaseManager
from services.task_service import TaskService
from services.member_service import MemberService
from services.milestone_service import MilestoneService

def create_api_routes(db_manager: DatabaseManager) -> Blueprint:
    """
    Create API routes blueprint with dependency injection of database manager
    """
    api = Blueprint('api', __name__, url_prefix='/api')
    
    # Initialize services
    task_service = TaskService(db_manager)
    member_service = MemberService(db_manager)
    milestone_service = MilestoneService(db_manager)
    
    # ============================================================================
    # HEALTH CHECK & SYSTEM ROUTES
    # ============================================================================
    
    @api.route('/health', methods=['GET'])
    def health_check():
        """API health check endpoint"""
        try:
            db_status = db_manager.health_check()
            return jsonify({
                "status": "OK",
                "message": "Task Management API - OOP Architecture",
                "database": db_status,
                "version": "2.0.0"
            })
        except Exception as e:
            return jsonify({
                "status": "ERROR",
                "message": f"Health check failed: {str(e)}"
            }), 500
    
    # ============================================================================
    # TASK ROUTES
    # ============================================================================
    
    @api.route('/tasks', methods=['GET'])
    def get_all_tasks():
        """Get all tasks with prerequisite status"""
        try:
            tasks = task_service.get_all_tasks()
            return jsonify(tasks)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/tasks/<int:task_id>', methods=['GET'])
    def get_task(task_id: int):
        """Get specific task by ID"""
        try:
            task = task_service.get_task_by_id(task_id)
            if task:
                return jsonify(task.to_dict())
            return jsonify({"error": "Task not found"}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/tasks/milestone/<int:milestone_id>', methods=['GET'])
    def get_tasks_by_milestone(milestone_id: int):
        """Get all tasks for a specific milestone with prerequisite status"""
        try:
            tasks = task_service.get_tasks_by_milestone(milestone_id)
            return jsonify(tasks)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/tasks/available', methods=['GET'])
    def get_available_tasks():
        """Get tasks available for assignment"""
        try:
            milestone_id = request.args.get('milestone_id', type=int)
            tasks = task_service.get_available_tasks(milestone_id)
            return jsonify([task.to_dict() for task in tasks])
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/tasks/assignable', methods=['GET'])
    def get_assignable_tasks():
        """Get tasks that can be assigned (prerequisites met)"""
        try:
            milestone_id = request.args.get('milestone_id', type=int)
            completed_task_ids = task_service.get_completed_task_ids(milestone_id)
            tasks = task_service.get_assignable_tasks(completed_task_ids, milestone_id)
            return jsonify([task.to_dict() for task in tasks])
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/tasks', methods=['POST'])
    def create_task():
        """Create a new task"""
        try:
            task_data = request.get_json()
            if not task_data:
                return jsonify({"error": "No task data provided"}), 400
            
            result = task_service.create_task(task_data)
            if result.get("success"):
                return jsonify(result), 201
            else:
                return jsonify(result), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/tasks/<int:task_id>', methods=['PUT'])
    def update_task(task_id: int):
        """Update a task"""
        try:
            update_data = request.get_json()
            if not update_data:
                return jsonify({"error": "No update data provided"}), 400
            
            result = task_service.update_task(task_id, update_data)
            if result.get("success"):
                return jsonify(result)
            else:
                return jsonify(result), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/tasks/<int:task_id>/assign', methods=['POST'])
    def assign_task(task_id: int):
        """Assign a task to a member"""
        try:
            data = request.get_json()
            if not data or 'member_id' not in data:
                return jsonify({"error": "member_id is required"}), 400
            
            result = task_service.assign_task_to_member(task_id, data['member_id'])
            if result.get("success"):
                return jsonify(result), 201
            else:
                return jsonify(result), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/tasks/assignments/<assignment_id>/complete', methods=['POST'])
    def complete_task(assignment_id: str):
        """Complete a task assignment"""
        try:
            data = request.get_json() or {}
            notes = data.get('notes')
            
            result = task_service.complete_task(assignment_id, notes)
            if result.get("success"):
                return jsonify(result)
            else:
                return jsonify(result), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/tasks/analytics/complexity-distribution', methods=['GET'])
    def get_task_complexity_distribution():
        """Get task complexity distribution"""
        try:
            distribution = task_service.get_task_complexity_distribution()
            return jsonify(distribution)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/tasks/analytics/category-distribution', methods=['GET'])
    def get_task_category_distribution():
        """Get task category distribution"""
        try:
            distribution = task_service.get_task_category_distribution()
            return jsonify(distribution)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    # ============================================================================
    # MEMBER ROUTES
    # ============================================================================
    
    @api.route('/members', methods=['GET'])
    def get_all_members():
        """Get all members"""
        try:
            active_only = request.args.get('active_only', 'false').lower() == 'true'
            if active_only:
                members = member_service.get_active_members()
            else:
                members = member_service.get_all_members()
            return jsonify([member.to_dict() for member in members])
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/members/<int:member_id>', methods=['GET'])
    def get_member(member_id: int):
        """Get specific member by ID"""
        try:
            member = member_service.get_member_by_id(member_id)
            if member:
                return jsonify(member.to_dict())
            return jsonify({"error": "Member not found"}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/members/<int:member_id>/workload', methods=['GET'])
    def get_member_workload(member_id: int):
        """Get member workload analysis"""
        try:
            workload = member_service.get_member_workload(member_id)
            if "error" in workload:
                return jsonify(workload), 404
            return jsonify(workload)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/members/<int:member_id>/assignments', methods=['GET'])
    def get_member_assignments(member_id: int):
        """Get assignments for a member"""
        try:
            status_filter = request.args.get('status')
            assignments = member_service.get_member_assignments(member_id, status_filter)
            if isinstance(assignments, dict) and "error" in assignments:
                return jsonify(assignments), 400
            return jsonify(assignments)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/members/<int:member_id>/performance', methods=['GET'])
    def get_member_performance(member_id: int):
        """Get member performance metrics"""
        try:
            metrics = member_service.get_member_performance_metrics(member_id)
            if "error" in metrics:
                return jsonify(metrics), 404
            return jsonify(metrics)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/members/<int:member_id>/status', methods=['PUT'])
    def update_member_status(member_id: int):
        """Update member active status"""
        try:
            data = request.get_json()
            if not data or 'is_active' not in data:
                return jsonify({"error": "is_active is required"}), 400
            
            result = member_service.update_member_status(member_id, data['is_active'])
            if result.get("success"):
                return jsonify(result)
            else:
                return jsonify(result), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    
    @api.route('/members/analytics/workload-distribution', methods=['GET'])
    def get_team_workload_distribution():
        """Get team workload distribution"""
        try:
            distribution = member_service.get_team_workload_distribution()
            return jsonify(distribution)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/members/recommend-for-task/<int:task_id>', methods=['GET'])
    def recommend_member_for_task(task_id: int):
        """Get member recommendation for a task"""
        try:
            recommendation = member_service.find_best_member_for_task(task_id)
            if "error" in recommendation:
                return jsonify(recommendation), 404
            return jsonify(recommendation)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    # ============================================================================
    # MILESTONE ROUTES
    # ============================================================================
    
    @api.route('/milestones', methods=['GET'])
    def get_all_milestones():
        """Get all milestones"""
        try:
            milestones = milestone_service.get_all_milestones()
            return jsonify([milestone.to_dict() for milestone in milestones])
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/milestones/<int:milestone_id>', methods=['GET'])
    def get_milestone(milestone_id: int):
        """Get specific milestone by ID"""
        try:
            milestone = milestone_service.get_milestone_by_id(milestone_id)
            if milestone:
                return jsonify(milestone.to_dict())
            return jsonify({"error": "Milestone not found"}), 404
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/milestones/<int:milestone_id>/progress', methods=['GET'])
    def get_milestone_progress(milestone_id: int):
        """Get milestone progress details"""
        try:
            progress = milestone_service.get_milestone_progress(milestone_id)
            if "error" in progress:
                return jsonify(progress), 404
            return jsonify(progress)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/milestones/<int:milestone_id>/progress', methods=['PUT'])
    def update_milestone_progress(milestone_id: int):
        """Update milestone progress"""
        try:
            data = request.get_json() or {}
            auto_calculate = data.get('auto_calculate', True)
            
            result = milestone_service.update_milestone_progress(milestone_id, auto_calculate)
            if result.get("success"):
                return jsonify(result)
            else:
                return jsonify(result), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/milestones/<int:milestone_id>/start', methods=['POST'])
    def start_milestone(milestone_id: int):
        """Start a milestone"""
        try:
            result = milestone_service.start_milestone(milestone_id)
            if result.get("success"):
                return jsonify(result)
            else:
                return jsonify(result), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/milestones/<int:milestone_id>/complete', methods=['POST'])
    def complete_milestone(milestone_id: int):
        """Complete a milestone"""
        try:
            result = milestone_service.complete_milestone(milestone_id)
            if result.get("success"):
                return jsonify(result)
            else:
                return jsonify(result), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/milestones/<int:milestone_id>/pause', methods=['POST'])
    def pause_milestone(milestone_id: int):
        """Pause a milestone"""
        try:
            result = milestone_service.pause_milestone(milestone_id)
            if result.get("success"):
                return jsonify(result)
            else:
                return jsonify(result), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/milestones/<int:milestone_id>/resume', methods=['POST'])
    def resume_milestone(milestone_id: int):
        """Resume a paused milestone"""
        try:
            result = milestone_service.resume_milestone(milestone_id)
            if result.get("success"):
                return jsonify(result)
            else:
                return jsonify(result), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/milestones/<int:milestone_id>/deliverables', methods=['POST'])
    def add_milestone_deliverable(milestone_id: int):
        """Add deliverable to milestone"""
        try:
            data = request.get_json()
            if not data or 'deliverable' not in data:
                return jsonify({"error": "deliverable is required"}), 400
            
            result = milestone_service.add_deliverable(milestone_id, data['deliverable'])
            if result.get("success"):
                return jsonify(result)
            else:
                return jsonify(result), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/milestones/<int:milestone_id>/deliverables/<deliverable>', methods=['DELETE'])
    def remove_milestone_deliverable(milestone_id: int, deliverable: str):
        """Remove deliverable from milestone"""
        try:
            result = milestone_service.remove_deliverable(milestone_id, deliverable)
            if result.get("success"):
                return jsonify(result)
            else:
                return jsonify(result), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/milestones/active', methods=['GET'])
    def get_active_milestones():
        """Get all active milestones"""
        try:
            milestones = milestone_service.get_active_milestones()
            return jsonify([milestone.to_dict() for milestone in milestones])
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    # ============================================================================
    # PROJECT & ANALYTICS ROUTES
    # ============================================================================
    
    @api.route('/project/overview', methods=['GET'])
    def get_project_overview():
        """Get comprehensive project overview"""
        try:
            overview = milestone_service.get_project_overview()
            return jsonify(overview)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/analytics/dashboard', methods=['GET'])
    def get_dashboard_analytics():
        """Get analytics data for dashboard"""
        try:
            # Combine various analytics
            project_overview = milestone_service.get_project_overview()
            team_workload = member_service.get_team_workload_distribution()
            task_complexity = task_service.get_task_complexity_distribution()
            task_categories = task_service.get_task_category_distribution()
            
            return jsonify({
                "project_overview": project_overview,
                "team_workload": team_workload,
                "task_complexity": task_complexity,
                "task_categories": task_categories
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    # ============================================================================
    # ASSIGNMENT ROUTES
    # ============================================================================
    
    @api.route('/assignments', methods=['GET'])
    def get_all_assignments():
        """Get all assignments"""
        try:
            assignments = []
            # Get all tasks first (these are now dictionaries)
            tasks = task_service.get_all_tasks()
            for task_dict in tasks:
                task_id = task_dict['id']
                task_assignments = db_manager.get_assignments_by_task(task_id)
                for assignment in task_assignments:
                    assignment_dict = assignment.to_dict()
                    assignment_dict["task"] = task_dict
                    assignments.append(assignment_dict)
            return jsonify(assignments)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @api.route('/assignments/assign-task', methods=['POST'])
    def assign_task_endpoint():
        """Assign a task to a member - frontend compatibility"""
        try:
            data = request.get_json()
            if not data or 'taskId' not in data or 'memberId' not in data:
                return jsonify({"error": "taskId and memberId are required"}), 400
            
            result = task_service.assign_task_to_member(data['taskId'], data['memberId'])
            if result.get("success"):
                return jsonify(result), 201
            else:
                return jsonify(result), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    # ============================================================================
    # LEGACY COMPATIBILITY ROUTES (for existing frontend)
    # ============================================================================
    
    @api.route('/tasks/by-milestone/<int:milestone_id>', methods=['GET'])
    def legacy_get_tasks_by_milestone(milestone_id: int):
        """Legacy route for existing frontend compatibility"""
        return get_tasks_by_milestone(milestone_id)
    
    @api.route('/assignments/by-member/<int:member_id>', methods=['GET'])
    def legacy_get_assignments_by_member(member_id: int):
        """Legacy route for existing frontend compatibility"""
        return get_member_assignments(member_id)
    
    @api.route('/assignments/assign-task', methods=['POST'])
    def legacy_assign_task():
        """Legacy route for task assignment"""
        try:
            data = request.get_json()
            if not data or 'taskId' not in data or 'memberId' not in data:
                return jsonify({"error": "taskId and memberId are required"}), 400
            
            return assign_task(data['taskId']).get_json(), assign_task(data['taskId']).status_code
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    return api