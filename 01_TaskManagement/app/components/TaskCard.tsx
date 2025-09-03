'use client';

import { Task, Assignment, Member } from '../types';

interface TaskCardProps {
  task: Task
  assignment: Assignment | null
  currentUser: Member | null
  onAssign: () => void
  onStart: () => void
  onComplete: () => void
}

export default function TaskCard({ 
  task, 
  assignment, 
  currentUser, 
  onAssign, 
  onStart, 
  onComplete 
}: TaskCardProps) {
  const getComplexityStyle = (complexity: string) => {
    const styles = {
      low: 'complexity-low',
      medium: 'complexity-medium', 
      high: 'complexity-high'
    };
    return styles[complexity as keyof typeof styles] || styles.medium;
  };

  const getStatusColor = (status?: string) => {
    const colors = {
      'assigned': 'status-assigned',
      'in-progress': 'status-in-progress', 
      'review': 'status-review',
      'completed': 'status-completed'
    };
    return colors[status as keyof typeof colors] || colors.assigned;
  };

  const canAssign = !assignment && currentUser;
  const canStart = assignment && assignment.status === 'assigned' && currentUser?.id === assignment.memberId;
  const canComplete = assignment && assignment.status === 'in-progress' && currentUser?.id === assignment.memberId;

  return (
    <div className="task-card relative">
      {/* Status indicator */}
      {assignment && (
        <div className={`task-status-indicator ${getStatusColor(assignment.status)}`}></div>
      )}
      
      {/* Task header */}
      <div className="task-header">
        <h4 className="task-title">{task.title}</h4>
        <span className={getComplexityStyle(task.complexity)}>
          {task.complexity}
        </span>
      </div>

      {/* Task description */}
      <p className="task-description">{task.description}</p>

      {/* Task metadata */}
      <div className="task-meta">
        <span className="category">{task.category}</span>
        {task.estimatedHours && (
          <span className="hours">{task.estimatedHours}h</span>
        )}
      </div>

      {/* Skills */}
      {task.skills && task.skills.length > 0 && (
        <div className="task-skills">
          {task.skills.map((skill, index) => (
            <span key={index} className="skill-badge">
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Progress bar for assigned tasks */}
      {assignment && assignment.progress > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-subtle mb-1">
            <span>Progress</span>
            <span>{assignment.progress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${assignment.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="task-actions">
        {canAssign && (
          <button 
            onClick={onAssign}
            className="btn btn-sm btn-primary"
            title="Assign to me"
          >
            <i className="fas fa-user-plus mr-1"></i>
            Assign
          </button>
        )}
        
        {canStart && (
          <button 
            onClick={onStart}
            className="btn btn-sm btn-info"
            title="Start working on this task"
          >
            <i className="fas fa-play mr-1"></i>
            Start
          </button>
        )}
        
        {canComplete && (
          <button 
            onClick={onComplete}
            className="btn btn-sm btn-success"
            title="Mark as completed"
          >
            <i className="fas fa-check mr-1"></i>
            Complete
          </button>
        )}

        {assignment && (
          <div className="text-xs text-subtle mt-2">
            <div>Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}</div>
            {assignment.startedDate && (
              <div>Started: {new Date(assignment.startedDate).toLocaleDateString()}</div>
            )}
            {assignment.completedDate && (
              <div>Completed: {new Date(assignment.completedDate).toLocaleDateString()}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}