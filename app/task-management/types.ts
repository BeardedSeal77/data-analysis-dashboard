export interface Task {
  id: string
  title: string
  description: string
  milestoneId: number
  complexity: 'low' | 'medium' | 'high'
  category: string
  skills: string[]
  estimatedHours?: number
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
  createdDate: string
  updatedDate: string
}

export interface Assignment {
  assignmentId: string
  taskId: string
  memberId: number
  memberDisplayName: string
  assigneeId: number
  status: 'assigned' | 'in-progress' | 'completed' | 'review' | 'reassigned'
  progress: number
  assignedDate: string
  startedDate: string | null
  completedDate: string | null
  timeSpent: number
  notes: string | null
  reviewRequested: boolean
  reviewCompletedBy: string | null
  reviewDate: string | null
}

export interface Member {
  id: number
  displayName: string
  role: string
  githubUsername?: string
  memberColor: string
  avatar?: string
  skills?: string[]
  isActive: boolean
}

export interface Milestone {
  id: number
  name: string
  subtitle: string
  description: string
  dueDate: string
  status: 'planning' | 'active' | 'completed' | 'paused'
  progress: number
  color: string
  about: {
    description: string
    sections: Array<{
      title: string
      icon: string
      color: string
      items: string[]
    }>
  }
  deliverables?: string[]
  estimatedDuration?: string
}