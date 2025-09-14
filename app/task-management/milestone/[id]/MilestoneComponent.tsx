'use client'

import { useState, useEffect } from 'react'
import TaskBoard from '../../components/TaskBoard'
import { Milestone } from '../../types'

interface MilestoneStats {
  total: number
  assigned: number
  inProgress: number
  completed: number
}

interface MilestoneComponentProps {
  milestoneId: number
}

export default function MilestoneComponent({ milestoneId }: MilestoneComponentProps) {
  const [milestoneData, setMilestoneData] = useState<Milestone | null>(null)
  const [stats, setStats] = useState<MilestoneStats>({
    total: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMilestoneData()
    const interval = setInterval(updateMilestoneStats, 10000)
    return () => clearInterval(interval)
  }, [milestoneId])

  const loadMilestoneData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('http://localhost:5000/api/milestones')
      if (!response.ok) {
        throw new Error('Failed to load milestones')
      }

      const milestones = await response.json()
      const milestone = milestones.find((m: Milestone) => m.id === milestoneId)

      if (!milestone) {
        throw new Error(`Milestone ${milestoneId} not found`)
      }

      setMilestoneData(milestone)
      await updateMilestoneStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load milestone data')
      console.error('Error loading milestone data:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateMilestoneStats = async () => {
    try {
      const [tasksRes, assignmentsRes] = await Promise.all([
        fetch('http://localhost:5000/api/tasks'),
        fetch('http://localhost:5000/api/assignments')
      ])

      const [tasks, assignments] = await Promise.all([
        tasksRes.json(),
        assignmentsRes.json()
      ])

      const milestoneTasks = tasks.filter((task: any) => task.milestoneId === milestoneId)
      const milestoneAssignments = Array.isArray(assignments) ? assignments.filter((assignment: any) => {
        return milestoneTasks.some((task: any) => task.compositeId === assignment.compositeTaskId) &&
               assignment.status !== 'reassigned'
      }) : []

      setStats({
        total: milestoneTasks.length,
        assigned: milestoneAssignments.filter((a: any) => a.status === 'assigned').length,
        inProgress: milestoneAssignments.filter((a: any) => a.status === 'in-progress').length,
        completed: milestoneAssignments.filter((a: any) => a.status === 'completed').length
      })
    } catch (error) {
      console.error('Error updating milestone stats:', error)
    }
  }

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-600',
      purple: 'bg-purple-600',
      orange: 'bg-orange-600',
      green: 'bg-green-600',
      red: 'bg-red-600',
      indigo: 'bg-indigo-600',
      cyan: 'bg-cyan-600',
      yellow: 'bg-yellow-600'
    }
    return colorMap[color] || 'bg-blue-600'
  }

  const getSectionColorStyle = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      green: 'text-green-600',
      red: 'text-red-600',
      indigo: 'text-indigo-600',
      cyan: 'text-cyan-600',
      yellow: 'text-yellow-600'
    }
    return colorMap[color] || 'text-blue-600'
  }

  const progressPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-muted">Loading milestone...</p>
        </div>
      </div>
    )
  }

  if (error || !milestoneData) {
    return (
      <div className="bg-surface rounded-lg shadow-sm border border-danger p-6 text-center">
        <i className="fas fa-exclamation-triangle text-4xl text-danger mb-4"></i>
        <h2 className="text-xl font-semibold text-text mb-2">Milestone Not Found</h2>
        <p className="text-text">
          {error || `Could not load data for milestone ${milestoneId}. Please check the milestone configuration.`}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 ${getColorClass(milestoneData.color)} rounded-lg flex items-center justify-center`}>
              <span className="text-white font-bold text-lg">M{milestoneData.id}</span>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Milestone {milestoneData.id}: {milestoneData.name}
            </h1>
            <p className="mt-1 text-secondary">
              {milestoneData.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-surface rounded-lg shadow-sm border border-highlight-med p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">Progress Overview</h2>
          <span className="text-2xl font-bold text-primary">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-highlight-med rounded-full h-3">
          <div 
            className="h-3 bg-primary rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-text">{stats.total}</div>
            <div className="text-sm text-muted">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.assigned}</div>
            <div className="text-sm text-muted">Assigned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{stats.inProgress}</div>
            <div className="text-sm text-muted">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{stats.completed}</div>
            <div className="text-sm text-muted">Completed</div>
          </div>
        </div>

        {/* Deliverables */}
        {milestoneData.deliverables && milestoneData.deliverables.length > 0 && (
          <div className="mt-6 pt-4 border-t border-highlight-med">
            <h3 className="text-sm font-medium text-secondary mb-3">
              <i className="fas fa-clipboard-list mr-2"></i>Key Deliverables
            </h3>
            <div className="grid md:grid-cols-2 gap-2">
              {milestoneData.deliverables.map((deliverable, index) => (
                <div key={index} className="flex items-center text-sm text-text">
                  <i className="fas fa-check-circle mr-2 text-success"></i>
                  {deliverable}
                </div>
              ))}
            </div>
            {milestoneData.estimatedDuration && (
              <div className="mt-3 text-sm text-muted">
                <i className="fas fa-clock mr-1"></i>
                Estimated Duration: {milestoneData.estimatedDuration}
              </div>
            )}
          </div>
        )}
      </div>

      {/* About Section */}
      <div className="bg-surface rounded-lg shadow-sm border border-highlight-med p-6 mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">About This Milestone</h2>
        
        <p className="text-text mb-6">
          {milestoneData.about.description}
        </p>
        
        <div className={`grid md:grid-cols-${milestoneData.about.sections.length} gap-6`}>
          {milestoneData.about.sections.map((section, index) => (
            <div key={index}>
              <h3 className="font-medium text-secondary mb-2">
                <i className={`${section.icon} mr-2 ${getSectionColorStyle(section.color)}`}></i>
                {section.title}
              </h3>
              <ul className="text-sm text-text space-y-1">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Task Board */}
      <TaskBoard milestoneId={milestoneId} />
    </div>
  )
}