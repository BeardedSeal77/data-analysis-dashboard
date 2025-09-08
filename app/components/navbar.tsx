'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Member {
  id: number
  name: string
  displayName: string
  role: string
  githubUsername?: string
  memberColor: string
  avatar?: string
}

interface Task {
  id: string
  milestoneId: number
}

interface Assignment {
  taskId: string
  status: 'assigned' | 'in-progress' | 'completed' | 'reassigned'
}

export default function Navbar() {
  const pathname = usePathname()
  const [selectedUser, setSelectedUser] = useState<Member | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [milestoneStatuses, setMilestoneStatuses] = useState<{[key: number]: {status: string, progress: number}}>({})
  
  const isTaskManagement = pathname.startsWith('/task-management')
  
  const milestones = [
    { id: 1, name: 'Business & Data Understanding', path: '/task-management/milestone/1' },
    { id: 2, name: 'Data Preparation', path: '/task-management/milestone/2' },
    { id: 3, name: 'Modeling', path: '/task-management/milestone/3' },
    { id: 4, name: 'Evaluation', path: '/task-management/milestone/4' },
    { id: 5, name: 'Deployment', path: '/task-management/milestone/5' },
    { id: 6, name: 'Final Report', path: '/task-management/milestone/6' }
  ]

  useEffect(() => {
    if (isTaskManagement) {
      loadMembers()
      loadSelectedUser()
      updateMilestoneStatuses()
      
      // Set up auto-refresh every 30 seconds for task management
      const interval = setInterval(() => {
        updateMilestoneStatuses()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [isTaskManagement])

  const loadMembers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/members')
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }

  const loadSelectedUser = () => {
    const saved = localStorage.getItem('selected_user')
    if (saved) {
      try {
        setSelectedUser(JSON.parse(saved))
      } catch (error) {
        console.error('Error parsing stored user:', error)
      }
    }
  }

  const updateMilestoneStatuses = async () => {
    try {
      const [tasksRes, assignmentsRes] = await Promise.all([
        fetch('http://localhost:5000/api/tasks'),
        fetch('http://localhost:5000/api/assignments')
      ])

      const tasks: Task[] = await tasksRes.json()
      const assignments: Assignment[] = await assignmentsRes.json()
      
      const statuses: {[key: number]: {status: string, progress: number}} = {}
      
      milestones.forEach(milestone => {
        const milestoneTasks = tasks.filter(task => task.milestoneId === milestone.id)
        
        if (milestoneTasks.length === 0) {
          statuses[milestone.id] = { status: 'not-started', progress: 0 }
          return
        }

        let completedTasks = 0
        let inProgressTasks = 0
        
        milestoneTasks.forEach(task => {
          const assignment = Array.isArray(assignments) ? assignments.find(a => 
            a.taskId === task.id && a.status !== 'reassigned'
          ) : null
          
          if (assignment) {
            if (assignment.status === 'completed') {
              completedTasks++
            } else if (assignment.status === 'in-progress') {
              inProgressTasks++
            }
          }
        })

        const progress = Math.round((completedTasks / milestoneTasks.length) * 100)
        
        if (completedTasks === milestoneTasks.length) {
          statuses[milestone.id] = { status: 'completed', progress: 100 }
        } else if (inProgressTasks > 0 || completedTasks > 0) {
          statuses[milestone.id] = { status: 'in-progress', progress }
        } else {
          statuses[milestone.id] = { status: 'not-started', progress: 0 }
        }
      })
      
      setMilestoneStatuses(statuses)
    } catch (error) {
      console.error('Error updating milestone statuses:', error)
    }
  }

  const handleProfileSelect = (memberId: string) => {
    if (!memberId) {
      setSelectedUser(null)
      localStorage.removeItem('selected_user')
      
      window.dispatchEvent(new CustomEvent('profileSelected', {
        detail: { user: null }
      }))
      return
    }

    const member = members.find(m => m.id === parseInt(memberId))
    if (member) {
      const user = {
        ...member,
        avatar: `https://github.com/identicons/${member.githubUsername}.png`
      }
      setSelectedUser(user)
      localStorage.setItem('selected_user', JSON.stringify(user))
      
      window.dispatchEvent(new CustomEvent('profileSelected', {
        detail: { user }
      }))
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('selected_user')
    setSelectedUser(null)
    
    window.dispatchEvent(new CustomEvent('profileSelected', {
      detail: { user: null }
    }))
  }

  const getCurrentPage = () => {
    if (pathname === '/') return 'home'
    if (pathname === '/task-management') return 'task-dashboard'
    if (pathname.startsWith('/task-management/milestone/')) {
      const milestoneNum = pathname.split('/')[3]
      return `milestone${milestoneNum}`
    }
    if (pathname === '/project') return 'project'
    return 'home'
  }

  const getMilestoneStatusDisplay = (milestoneId: number) => {
    const status = milestoneStatuses[milestoneId]
    if (!status) return <i className="fas fa-circle" style={{ color: 'var(--color-muted)' }}></i>
    
    switch (status.status) {
      case 'completed':
        return <i className="fas fa-check-circle" style={{ color: 'var(--color-success)' }}></i>
      case 'in-progress':
        return <i className="fas fa-play-circle" style={{ color: 'var(--color-primary)' }}></i>
      default:
        return <i className="fas fa-circle" style={{ color: 'var(--color-muted)' }}></i>
    }
  }

  const currentPage = getCurrentPage()

  // Basic navbar for main app
  if (!isTaskManagement) {
    return (
      <nav className="bg-surface shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-xl font-bold text-text">BIN381 Dashboard</span>
              </div>
              <div className="ml-6 flex space-x-8">
                <Link
                  href="/"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    currentPage === 'home'
                      ? 'border-b-2 border-primary text-text'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/task-management"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    currentPage === 'task-management'
                      ? 'border-b-2 border-primary text-text'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  Task Management
                </Link>
                <Link
                  href="/project"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    currentPage === 'project'
                      ? 'border-b-2 border-primary text-text'
                      : 'text-muted hover:text-text'
                  }`}
                >
                  Data Project
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Task management navbar based on the original navbar.js
  return (
    <nav style={{ backgroundColor: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--color-highlight-med)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Back Button, Brand and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Back to Main App Button */}
            <Link
              href="/"
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: 'var(--color-text)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-overlay)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              title="Back to Main App"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              <span className="hidden sm:inline">Main App</span>
            </Link>
            
            <div className="flex items-center space-x-3">
              <i className="fas fa-chart-line" style={{ color: 'var(--color-primary)', fontSize: '1.5rem' }}></i>
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>HDPSA Project</h1>
            </div>
            
            {/* Navigation Links */}
            <div className="flex flex-wrap items-center gap-2">
              <Link 
                href="/task-management" 
                className="nav-link flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={currentPage === 'task-dashboard' ? 
                  { backgroundColor: 'var(--color-primary)', color: 'var(--color-base)' } : 
                  { color: 'var(--color-text)' }
                }
                onMouseEnter={(e) => {
                  if (currentPage !== 'task-dashboard') {
                    e.currentTarget.style.backgroundColor = 'var(--color-overlay)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 'task-dashboard') {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <i className="fas fa-tachometer-alt mr-2"></i>Dashboard
              </Link>
              
              {/* Milestone Links */}
              {milestones.map(milestone => (
                <Link 
                  key={milestone.id}
                  href={milestone.path}
                  className="nav-link flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={currentPage === `milestone${milestone.id}` ? 
                    { backgroundColor: 'var(--color-primary)', color: 'var(--color-base)' } : 
                    { color: 'var(--color-text)' }
                  }
                  onMouseEnter={(e) => {
                    if (currentPage !== `milestone${milestone.id}`) {
                      e.currentTarget.style.backgroundColor = 'var(--color-overlay)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== `milestone${milestone.id}`) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <span 
                    className="milestone-status text-xs mr-2" 
                    title={milestoneStatuses[milestone.id]?.status === 'completed' ? 'Completed' :
                           milestoneStatuses[milestone.id]?.status === 'in-progress' ? `${milestoneStatuses[milestone.id]?.progress}% Complete` :
                           'Not Started'}
                  >
                    {getMilestoneStatusDisplay(milestone.id)}
                  </span>
                  <span className="hidden sm:inline">Milestone {milestone.id}</span>
                  <span className="sm:hidden">M{milestone.id}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - User Authentication */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {!selectedUser ? (
                <select 
                  onChange={(e) => handleProfileSelect(e.target.value)}
                  className="px-3 py-2 rounded-md text-sm font-medium"
                  style={{ 
                    backgroundColor: 'var(--color-surface)', 
                    color: 'var(--color-text)', 
                    border: '1px solid var(--color-highlight-med)' 
                  }}
                  value=""
                >
                  <option value="">Select Your Profile</option>
                  {members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.displayName} ({member.role})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: `var(--color-${selectedUser.memberColor})` }}
                  ></div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {selectedUser.displayName}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                      {selectedUser.role}
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="ml-3 px-2 py-1 text-xs rounded"
                    style={{ 
                      backgroundColor: 'var(--color-overlay)', 
                      color: 'var(--color-text)' 
                    }}
                    title="Logout"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}