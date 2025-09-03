'use client'

import { useState, useEffect } from 'react'
import TaskBoard from './TaskBoard'

interface Task {
  id: string
  title: string
  description: string
  milestoneId: number
  complexity: 'low' | 'medium' | 'high'
  category: string
  skills: string[]
}

interface Assignment {
  assignmentId: string
  taskId: string
  memberId: number
  status: 'assigned' | 'in-progress' | 'completed' | 'review'
  progress: number
  assignedDate: string
  startedDate?: string
  completedDate?: string
}

interface Member {
  id: number
  displayName: string
  role: string
  githubUsername?: string
  memberColor: string
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [tasksRes, assignmentsRes, membersRes] = await Promise.all([
        fetch('/api/task/tasks'),
        fetch('/api/task/assignments'), 
        fetch('/api/task/members')
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
    const inProgress = assignments.filter(a => a.status === 'in-progress').length
    const completed = assignments.filter(a => a.status === 'completed').length
    const teamMembers = members.length

    return { total, inProgress, completed, teamMembers }
  }

  const getMilestoneProgress = () => {
    const milestones = [1, 2, 3, 4, 5, 6].map(id => {
      const milestoneTasks = tasks.filter(t => t.milestoneId === id)
      const completedTasks = assignments.filter(a => 
        milestoneTasks.some(t => t.id === a.taskId) && a.status === 'completed'
      ).length

      const progress = milestoneTasks.length > 0 
        ? Math.round((completedTasks / milestoneTasks.length) * 100)
        : 0

      return {
        id,
        name: getMilestoneName(id),
        progress,
        completed: completedTasks,
        total: milestoneTasks.length
      }
    })

    return milestones
  }

  const getMilestoneName = (id: number) => {
    const names = {
      1: 'Business & Data Understanding',
      2: 'Data Preparation', 
      3: 'Modeling',
      4: 'Evaluation',
      5: 'Deployment',
      6: 'Final Report'
    }
    return names[id as keyof typeof names] || `Milestone ${id}`
  }

  const getRecentTasks = () => {
    return assignments
      .filter(a => a.startedDate || a.completedDate)
      .sort((a, b) => {
        const dateA = new Date(a.completedDate || a.startedDate || a.assignedDate)
        const dateB = new Date(b.completedDate || b.startedDate || b.assignedDate)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 5)
      .map(assignment => {
        const task = tasks.find(t => t.id === assignment.taskId)
        const member = members.find(m => m.id === assignment.memberId)
        return { assignment, task, member }
      })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const counts = getTaskCounts()
  const milestoneProgress = getMilestoneProgress()
  const recentTasks = getRecentTasks()

  return (
    <div className="space-y-8">
      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <h3 className="text-lg font-semibold text-gray-900">In Progress</h3>
              <p className="text-3xl font-bold text-yellow-600">{counts.inProgress}</p>
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Milestone Progress</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {milestoneProgress.map(milestone => (
              <div key={milestone.id} className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      Milestone {milestone.id}: {milestone.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {milestone.completed}/{milestone.total} tasks ({milestone.progress}%)
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill bg-blue-600"
                      style={{ width: `${milestone.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Activity & Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Tasks</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentTasks.length > 0 ? (
                recentTasks.map(({ assignment, task, member }) => (
                  <div key={assignment.assignmentId} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 status-${assignment.status}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {task?.title || 'Unknown Task'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member?.displayName || 'Unknown Member'} • {assignment.status}
                        {assignment.completedDate && (
                          <span className="ml-2">
                            Completed {new Date(assignment.completedDate).toLocaleDateString()}
                          </span>
                        )}
                      </p>
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
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <i className="fas fa-plus text-blue-600 mr-3"></i>
                  <span className="font-medium">Create New Task</span>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <i className="fas fa-chart-bar text-green-600 mr-3"></i>
                  <span className="font-medium">View Analytics</span>
                </div>
              </button>
              
              <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <i className="fas fa-download text-purple-600 mr-3"></i>
                  <span className="font-medium">Export Report</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task Board Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Task Board Overview</h2>
          <p className="text-sm text-gray-600 mt-1">All tasks organized by team member</p>
        </div>
        <div className="p-6">
          <TaskBoard />
        </div>
      </div>
    </div>
  )
}