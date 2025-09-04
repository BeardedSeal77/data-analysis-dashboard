'use client';

import { Task, Assignment, Member } from '../types';

interface TaskCardProps {
  task: Task
  assignment: Assignment | null
  currentUser: Member | null
  onAssign: () => void
  onComplete: () => void
}

export default function TaskCard({ 
  task, 
  assignment, 
  currentUser, 
  onAssign, 
  onComplete 
}: TaskCardProps) {
  const getComplexityStyle = (complexity: string) => {
    const styles = {
      low: 'bg-green-100 text-green-800 px-2 py-1 text-xs font-medium rounded-full',
      medium: 'bg-yellow-100 text-yellow-800 px-2 py-1 text-xs font-medium rounded-full', 
      high: 'bg-red-100 text-red-800 px-2 py-1 text-xs font-medium rounded-full'
    };
    return styles[complexity as keyof typeof styles] || styles.medium;
  };

  const getStatusColor = (status?: string) => {
    const colors = {
      'assigned': 'bg-gray-400',
      'completed': 'bg-green-500'
    };
    return colors[status as keyof typeof colors] || colors.assigned;
  };

  const canAssign = !assignment && currentUser;
  const canComplete = assignment && assignment.status === 'assigned' && currentUser?.id === assignment.memberId;

  return (
    <div className="bg-overlay rounded-lg border border-highlight-med p-4 cursor-pointer transition-all duration-200 relative hover:shadow-md hover:-translate-y-0.5">
      {/* Status indicator */}
      {assignment && (
        <div className={`w-2 h-2 rounded-full absolute top-2 right-2 ${getStatusColor(assignment.status)}`}></div>
      )}
      
      {/* Task header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-semibold flex-1 mr-2 text-text">{task.title}</h4>
        <span className={getComplexityStyle(task.complexity)}>
          {task.complexity}
        </span>
      </div>

      {/* Task description */}
      <p className="text-xs mb-3 text-muted">{task.description}</p>

      {/* Task metadata */}
      <div className="flex items-center justify-between mb-3 text-xs text-subtle">
        <span className="px-2 py-1 rounded bg-highlight-med text-text text-xs">{task.category}</span>
        {task.estimatedHours && (
          <span className="px-2 py-1 rounded bg-blue-600 text-white text-xs">{task.estimatedHours}h</span>
        )}
      </div>

      {/* Skills */}
      {task.skills && task.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.skills.map((skill, index) => (
            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {skill}
            </span>
          ))}
        </div>
      )}


      {/* Action buttons */}
      <div className="flex gap-2">
        {canAssign && (
          <button 
            onClick={onAssign}
            className="px-2 py-1 text-xs rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors border border-transparent"
            title="Assign to me (starts work immediately)"
          >
            <i className="fas fa-user-plus mr-1"></i>
            Assign & Start
          </button>
        )}
        
        {canComplete && (
          <button 
            onClick={onComplete}
            className="px-2 py-1 text-xs rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors border border-transparent"
            title="Mark as completed"
          >
            <i className="fas fa-check mr-1"></i>
            Complete
          </button>
        )}

        {assignment && (
          <div className="text-xs text-subtle mt-2">
            <div>Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}</div>
            {assignment.completedDate && (
              <div>Completed: {new Date(assignment.completedDate).toLocaleDateString()}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}