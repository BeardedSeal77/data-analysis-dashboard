'use client'

import { useState, useEffect } from 'react'
import TaskCard from './TaskCard'
import { Task, Assignment, Member } from '../types'

interface TaskBoardProps {
  milestoneId?: number
}

export default function TaskBoard({ milestoneId }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [currentUser, setCurrentUser] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    loadCurrentUser()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [tasksRes, assignmentsRes, membersRes] = await Promise.all([
        fetch('http://localhost:5000/api/tasks'),
        fetch('http://localhost:5000/api/assignments'),
        fetch('http://localhost:5000/api/members')
      ])

      const [tasksData, assignmentsData, membersData] = await Promise.all([
        tasksRes.json(),
        assignmentsRes.json(),
        membersRes.json()
      ])

      setTasks(tasksData)
      setAssignments(assignmentsData)
      setMembers(membersData)
    } catch (error) {
      console.error('Error loading task board data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCurrentUser = () => {
    const saved = localStorage.getItem('selected_user')
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved))
      } catch (error) {
        console.error('Error parsing stored user:', error)
      }
    }
  }

  const handleRefresh = () => {
    loadData()
  }

  const handleAssignTask = async (compositeTaskId: string) => {
    if (!currentUser) {
      showNotification('Please select your profile first', 'error')
      return
    }

    try {
      const response = await fetch('http://localhost:5000/api/assignments/assign-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compositeTaskId: compositeTaskId,
          memberId: currentUser.id
        })
      })

      if (response.ok) {
        const result = await response.json()
        const newAssignment = result.assignment
        setAssignments([...assignments, newAssignment])
        showNotification('Task assigned successfully!', 'success')
      } else {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        try {
          const error = JSON.parse(errorText)
          showNotification(error.error || 'Error assigning task', 'error')
        } catch {
          showNotification(`API Error: ${response.status} - ${errorText.substring(0, 100)}`, 'error')
        }
      }
    } catch (error) {
      console.error('Error assigning task:', error)
      showNotification('Error assigning task', 'error')
    }
  }


  const handleCompleteTask = async (assignmentId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/tasks/assignments/${assignmentId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: null })
      })

      if (response.ok) {
        const result = await response.json()
        const updatedAssignments = assignments.map(a =>
          a.assignmentId === assignmentId ? result.assignment : a
        )
        setAssignments(updatedAssignments)
        showNotification('Task completed!', 'success')
      } else {
        const error = await response.json()
        showNotification(error.error || 'Error completing task', 'error')
      }
    } catch (error) {
      console.error('Error completing task:', error)
      showNotification('Error completing task', 'error')
    }
  }


  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Create toast notification
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message
    document.body.appendChild(toast)
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 3000)
  }

  const getTasksByAssignment = () => {
    const filteredTasks = milestoneId 
      ? tasks.filter(task => task.milestoneId === milestoneId)
      : tasks

    const result = {
      backlog: [] as Task[],
      members: {} as Record<number, Array<{task: Task, assignment: Assignment}>>
    }

    // Initialize member arrays
    members.forEach(member => {
      result.members[member.id] = []
    })

    filteredTasks.forEach(task => {
      const assignment = Array.isArray(assignments) ? assignments.find(a => 
        a.compositeTaskId === task.compositeId && a.status !== 'reassigned'
      ) : null

      if (!assignment) {
        result.backlog.push(task)
      } else {
        const member = members.find(m => m.id === assignment.memberId)
        if (member) {
          result.members[member.id].push({ task, assignment })
        } else {
          result.backlog.push(task)
        }
      }
    })

    return result
  }

  const getMemberColorStyles = (color: string) => {
    const colorMap: Record<string, any> = {
      blue: { 
        headerStyle: { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' },
        badgeStyle: { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
        textColor: '#1e40af'
      },
      purple: { 
        headerStyle: { backgroundColor: '#e9d5ff', borderColor: '#c4b5fd' },
        badgeStyle: { backgroundColor: 'rgba(147, 51, 234, 0.1)' },
        textColor: '#7c2d12'
      },
      green: { 
        headerStyle: { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' },
        badgeStyle: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
        textColor: '#166534'
      },
      orange: { 
        headerStyle: { backgroundColor: '#fed7aa', borderColor: '#fdba74' },
        badgeStyle: { backgroundColor: 'rgba(249, 115, 22, 0.1)' },
        textColor: '#9a3412'
      },
      cyan: { 
        headerStyle: { backgroundColor: '#cffafe', borderColor: '#a5f3fc' },
        badgeStyle: { backgroundColor: 'rgba(6, 182, 212, 0.1)' },
        textColor: '#155e75'
      },
      red: { 
        headerStyle: { backgroundColor: '#fecaca', borderColor: '#fca5a5' },
        badgeStyle: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
        textColor: '#991b1b'
      },
      yellow: { 
        headerStyle: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
        badgeStyle: { backgroundColor: 'rgba(245, 158, 11, 0.1)' },
        textColor: '#92400e'
      },
      indigo: { 
        headerStyle: { backgroundColor: '#e0e7ff', borderColor: '#c7d2fe' },
        badgeStyle: { backgroundColor: 'rgba(99, 102, 241, 0.1)' },
        textColor: '#3730a3'
      }
    }
    return colorMap[color] || colorMap.blue
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-primary-500 mb-2"></i>
          <p className="text-muted">Loading task board...</p>
        </div>
      </div>
    )
  }

  const tasksByAssignment = getTasksByAssignment()

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 rounded-md bg-overlay text-text hover:bg-highlight-med transition-colors"
          >
            <i className="fas fa-sync mr-2"></i> Refresh
          </button>
          {milestoneId && (
            <span className="text-sm text-muted">
              Showing tasks for Milestone {milestoneId}
            </span>
          )}
        </div>
      </div>

      {/* Task Board */}
      <div className="space-y-8">
        {/* Backlog */}
        <div className="transition-shadow duration-200 bg-surface rounded-lg shadow-sm border border-highlight-med hover:shadow-md">
          <div className="member-header px-4 py-3 rounded-t-lg bg-overlay border-b border-highlight-med">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center text-text">
                <i className="fas fa-inbox mr-2 text-muted"></i>
                <span>Backlog</span>
              </h3>
              <span className="inline-flex items-center justify-center w-6 h-6 text-xs rounded-full bg-highlight-med text-text">
                {tasksByAssignment.backlog.length}
              </span>
            </div>
            <p className="text-xs mt-1 text-subtle">Available tasks waiting to be assigned</p>
          </div>
          <div className="p-4 space-y-3 min-h-32">
            {tasksByAssignment.backlog
              .sort((a, b) => {
              // Sort by numeric ID first (ensure IDs are treated as numbers)
              const aId = Number(a.id) || 0
              const bId = Number(b.id) || 0
              return aId - bId
              })
              .map(task => (
              <TaskCard
                key={task.id}
                task={task}
                assignment={null}
                currentUser={currentUser}
                onAssign={() => handleAssignTask(task.compositeId)}
                onComplete={() => {}}
              />
            ))}
          </div>
        </div>

        {/* Member Blocks */}
        {members.sort((a, b) => a.displayName.localeCompare(b.displayName)).map(member => {
          const colorStyles = getMemberColorStyles(member.memberColor)
          const memberTasks = tasksByAssignment.members[member.id] || []

          return (
            <div key={member.id} className="transition-shadow duration-200 bg-surface rounded-lg shadow-sm border border-highlight-med hover:shadow-md">
              <div className="member-header px-4 py-3 rounded-t-lg border-b" style={colorStyles.headerStyle}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img 
                      src={member.avatar || `https://github.com/identicons/${member.githubUsername || 'default'}.png`}
                      alt={member.displayName}
                      className="w-8 h-8 rounded-full mr-3"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://github.com/identicons/default.png'
                      }}
                    />
                    <div>
                      <h3 className="text-base font-medium">{member.displayName}</h3>
                      <p className="text-xs text-surface">
                        {member.role} {member.githubUsername && `• @${member.githubUsername}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs rounded-full text-text" style={colorStyles.badgeStyle}>
                      {memberTasks.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3 min-h-32">
                {memberTasks.map(({ task, assignment }) => (
                  <TaskCard
                    key={`${task.id}-${assignment.assignmentId}`}
                    task={task}
                    assignment={assignment}
                    currentUser={currentUser}
                    onAssign={() => {}}
                    onComplete={() => handleCompleteTask(assignment.assignmentId)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {members.length === 0 && (
        <div className="transition-shadow duration-200 bg-surface rounded-lg shadow-sm border border-danger mt-6">
          <div className="member-header px-4 py-3 rounded-t-lg bg-danger/10 border-b border-danger">
            <h3 className="text-sm font-medium text-danger">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              No Members Loaded
            </h3>
            <p className="text-xs mt-1 text-danger/80">Check MongoDB Atlas connection</p>
          </div>
        </div>
      )}
    </div>
  )
}