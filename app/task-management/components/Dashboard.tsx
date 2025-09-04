'use client'

import { useState, useEffect } from 'react'

interface Task {
  id: string
  title: string
  description: string
  milestoneId: number
  complexity: 'low' | 'medium' | 'high'
  category: string
  skills: string[]
  estimatedHours: number
  createdDate: string
}

interface Assignment {
  assignmentId: string
  taskId: string
  memberId: number
  memberDisplayName?: string
  status: 'assigned' | 'in-progress' | 'completed' | 'reassigned'
  progress: number
  assignedDate: string
  startedDate?: string
  completedDate?: string
}

interface Member {
  id: number
  name: string
  displayName: string
  role: string
  githubUsername?: string
  memberColor: string
  isActive?: boolean
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    
    const interval = setInterval(() => {
      loadData()
    }, 30000)
    
    return () => clearInterval(interval)
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
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTaskCounts = () => {
    const total = tasks.length
    const assigned = assignments.filter(a => a.status === 'assigned').length
    const completed = assignments.filter(a => a.status === 'completed').length
    const activeMembers = members.filter(m => m.isActive !== false).length

    return { total, assigned, completed, teamMembers: activeMembers }
  }

  const getMilestoneProgress = () => {
    const milestoneNames = {
      1: 'Business & Data Understanding',
      2: 'Data Preparation',
      3: 'Modeling',
      4: 'Evaluation',
      5: 'Deployment',
      6: 'Final Report'
    }

    return [1, 2, 3, 4, 5, 6].map(id => {
      const milestoneTasks = tasks.filter(task => task.milestoneId === id)
      const totalTasks = milestoneTasks.length
      
      if (totalTasks === 0) {
        return { id, name: milestoneNames[id as keyof typeof milestoneNames], completed: 0, total: 0, percentage: 0 }
      }

      let completedTasks = 0
      milestoneTasks.forEach(task => {
        const assignment = assignments.find(a => 
          a.taskId === task.id && a.status === 'completed'
        )
        if (assignment) {
          completedTasks++
        }
      })

      const percentage = Math.round((completedTasks / totalTasks) * 100)
      return { id, name: milestoneNames[id as keyof typeof milestoneNames], completed: completedTasks, total: totalTasks, percentage }
    })
  }

  const getProgressColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    if (percentage >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getTeamActivity = () => {
    return assignments
      .filter(a => a.assignedDate || a.completedDate)
      .sort((a, b) => {
        const dateA = new Date(a.completedDate || a.assignedDate)
        const dateB = new Date(b.completedDate || b.assignedDate)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 5)
      .map(assignment => {
        const task = tasks.find(t => t.id === assignment.taskId)
        const member = members.find(m => m.id === assignment.memberId)
        
        let actionText = 'assigned'
        let actionColor = 'text-blue-600'
        let actionDate = assignment.assignedDate

        if (assignment.completedDate) {
          actionText = 'completed'
          actionColor = 'text-green-600'
          actionDate = assignment.completedDate
        }

        const timeAgo = getTimeAgo(new Date(actionDate))

        return {
          assignment,
          task,
          member,
          actionText,
          actionColor,
          timeAgo
        }
      })
  }

  const getRecentTasks = () => {
    return tasks
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .slice(0, 5)
      .map(task => {
        const assignment = assignments.find(a => a.taskId === task.id && a.status !== 'reassigned')
        return { task, assignment }
      })
  }

  const getTaskStatusColor = (task: Task, assignment?: Assignment) => {
    if (!assignment) return 'bg-gray-100 text-gray-800'
    
    switch (assignment.status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTaskStatusText = (task: Task, assignment?: Assignment) => {
    if (!assignment) return 'Available'
    
    switch (assignment.status) {
      case 'completed': return 'Completed'
      case 'in-progress': return 'In Progress'
      case 'assigned': return 'Assigned'
      default: return 'Available'
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Redirecting to dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">
            If you are not redirected, <a href="pages/dashboard.html" className="text-blue-600 hover:underline">click here</a>
          </p>
        </div>
      </div>
    )
  }

  const counts = getTaskCounts()
  const milestoneProgress = getMilestoneProgress()
  const teamActivity = getTeamActivity()
  const recentTasks = getRecentTasks()

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-tasks text-blue-600 text-2xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Tasks</h3>
              <p className="text-3xl font-bold text-blue-600">{counts.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-clock text-yellow-600 text-2xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Assigned</h3>
              <p className="text-3xl font-bold text-yellow-600">{counts.assigned}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-check-circle text-green-600 text-2xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
              <p className="text-3xl font-bold text-green-600">{counts.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-users text-purple-600 text-2xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              <p className="text-3xl font-bold text-purple-600">{counts.teamMembers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Milestone Progress</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {milestoneProgress.map(milestone => (
              <div key={milestone.id} className="milestone-progress-item">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">Milestone {milestone.id}</span>
                    <span className="text-xs text-gray-500">{milestone.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{milestone.percentage}%</span>
                    <span className="text-xs text-gray-500">({milestone.completed}/{milestone.total})</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(milestone.percentage)}`} style={{ width: `${milestone.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Team Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {teamActivity.length > 0 ? (
                teamActivity.map(({ assignment, task, member, actionText, actionColor, timeAgo }, index) => (
                  <div key={assignment.assignmentId || index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {(member?.name || assignment.memberDisplayName || 'Unknown').split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{member?.name || assignment.memberDisplayName}</span>
                        <span className={actionColor}> {actionText}</span>
                        <span className="font-medium"> {task?.title || 'Unknown Task'}</span>
                      </p>
                      <p className="text-xs text-gray-500">{timeAgo}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Tasks</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentTasks.length > 0 ? (
                recentTasks.map(({ task, assignment }) => (
                  <div key={task.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{task.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          task.complexity === 'low' ? 'bg-green-100 text-green-800' :
                          task.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>{task.complexity}</span>
                        <span className="ml-2">{task.estimatedHours}h</span>
                        {assignment && <span className="ml-2">• {assignment.memberDisplayName}</span>}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task, assignment)}`}>
                        {getTaskStatusText(task, assignment)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No recent tasks</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}