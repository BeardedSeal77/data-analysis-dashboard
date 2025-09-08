'use client'

import { useState, useEffect } from 'react'
import { apiService } from '../services/api'

export default function Dashboard() {
  const [projectOverview, setProjectOverview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      setError(null)
      
      // All business logic is now in the backend API
      const overview = await apiService.getProjectOverview()
      setProjectOverview(overview)
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">Loading project overview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-600 mb-4"></i>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!projectOverview) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No project data available</p>
      </div>
    )
  }

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
              <p className="text-3xl font-bold text-blue-600">{projectOverview.total_tasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-clock text-yellow-600 text-2xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Assignments</h3>
              <p className="text-3xl font-bold text-yellow-600">{projectOverview.active_assignments}</p>
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
              <p className="text-3xl font-bold text-green-600">{projectOverview.completed_tasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <i className="fas fa-chart-line text-purple-600 text-2xl"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
              <p className="text-3xl font-bold text-purple-600">{projectOverview.overall_progress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Milestone */}
      {projectOverview.current_milestone && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Current Milestone</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {projectOverview.current_milestone.name}
                </h3>
                <p className="text-sm text-gray-600">{projectOverview.current_milestone.subtitle}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {projectOverview.current_milestone.progress}%
                </p>
                <p className="text-xs text-gray-500">complete</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-blue-500 transition-all duration-300" 
                style={{ width: `${projectOverview.current_milestone.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Milestones Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">All Milestones</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectOverview.milestones?.map((milestone: any) => (
              <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{milestone.name}</h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                    milestone.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {milestone.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      milestone.status === 'completed' ? 'bg-green-500' :
                      milestone.status === 'active' ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${milestone.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">{milestone.progress}% complete</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Project Statistics</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{projectOverview.total_milestones}</p>
              <p className="text-sm text-gray-600">Total Milestones</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{projectOverview.completed_milestones}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{projectOverview.active_milestones}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{projectOverview.total_time_spent}h</p>
              <p className="text-sm text-gray-600">Time Logged</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}