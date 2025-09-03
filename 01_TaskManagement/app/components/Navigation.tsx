'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Member {
  id: number
  displayName: string
  role: string
  githubUsername?: string
  memberColor: string
  avatar?: string
}

const milestones = [
  { id: 1, name: 'Business & Data Understanding', path: '/milestone/1' },
  { id: 2, name: 'Data Preparation', path: '/milestone/2' },
  { id: 3, name: 'Modeling', path: '/milestone/3' },
  { id: 4, name: 'Evaluation', path: '/milestone/4' },
  { id: 5, name: 'Deployment', path: '/milestone/5' },
  { id: 6, name: 'Final Report', path: '/milestone/6' }
]

export default function Navigation() {
  const pathname = usePathname()
  const [selectedUser, setSelectedUser] = useState<Member | null>(null)
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    loadMembers()
    loadSelectedUser()
  }, [])

  const loadMembers = async () => {
    try {
      const response = await fetch('/api/task/members')
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

  const handleProfileSelect = (memberId: string) => {
    if (!memberId) {
      setSelectedUser(null)
      localStorage.removeItem('selected_user')
      return
    }

    const member = members.find(m => m.id === parseInt(memberId))
    if (member) {
      const user = {
        ...member,
        avatar: member.avatar || `https://github.com/identicons/${member.githubUsername || 'default'}.png`
      }
      setSelectedUser(user)
      localStorage.setItem('selected_user', JSON.stringify(user))
    }
  }

  const handleLogout = () => {
    setSelectedUser(null)
    localStorage.removeItem('selected_user')
  }

  const getCurrentPage = () => {
    if (pathname === '/') return 'dashboard'
    if (pathname.startsWith('/milestone/')) {
      const milestoneNum = pathname.split('/')[2]
      return `milestone${milestoneNum}`
    }
    return 'dashboard'
  }

  const currentPage = getCurrentPage()

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Brand and Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <i className="fas fa-chart-line text-blue-600 text-xl"></i>
              <h1 className="text-xl font-bold text-gray-900">HDPSA Project</h1>
            </div>
            
            {/* Navigation Links */}
            <div className="flex flex-wrap items-center gap-2">
              <Link 
                href="/" 
                className={`nav-link flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className="fas fa-tachometer-alt mr-2"></i>Dashboard
              </Link>
              
              {/* Milestone Links */}
              {milestones.map(milestone => (
                <Link 
                  key={milestone.id}
                  href={milestone.path}
                  className={`nav-link flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === `milestone${milestone.id}` 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="milestone-status text-xs mr-2">
                    <i className="fas fa-circle text-gray-400"></i>
                  </span>
                  <span className="hidden sm:inline">Milestone {milestone.id}</span>
                  <span className="sm:hidden">M{milestone.id}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - User Authentication */}
          <div className="flex items-center space-x-4">
            {!selectedUser ? (
              <select 
                onChange={(e) => handleProfileSelect(e.target.value)}
                className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="flex items-center space-x-3">
                <img 
                  src={selectedUser.avatar}
                  alt={selectedUser.displayName}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://github.com/identicons/default.png'
                  }}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{selectedUser.displayName}</div>
                  <div className="text-xs text-gray-500">{selectedUser.role}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="ml-3 px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  title="Logout"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}