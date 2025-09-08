// API service layer - all business logic moved to backend
import { Task, Assignment, Member, Milestone } from '../types'

const API_BASE_URL = 'http://localhost:5000/api'

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Task endpoints
  async getAllTasks(): Promise<Task[]> {
    return this.request<Task[]>('/tasks')
  }

  async getTasksByMilestone(milestoneId: number): Promise<Task[]> {
    return this.request<Task[]>(`/tasks/milestone/${milestoneId}`)
  }

  async assignTask(taskId: number, memberId: number): Promise<any> {
    return this.request(`/tasks/${taskId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ member_id: memberId })
    })
  }

  async completeTask(assignmentId: string, notes?: string): Promise<any> {
    return this.request(`/tasks/assignments/${assignmentId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    })
  }

  // Member endpoints
  async getAllMembers(): Promise<Member[]> {
    return this.request<Member[]>('/members?active_only=true')
  }

  async getMemberWorkload(memberId: number): Promise<any> {
    return this.request(`/members/${memberId}/workload`)
  }

  async getMemberAssignments(memberId: number): Promise<Assignment[]> {
    return this.request<Assignment[]>(`/members/${memberId}/assignments`)
  }

  // Milestone endpoints
  async getAllMilestones(): Promise<Milestone[]> {
    return this.request<Milestone[]>('/milestones')
  }

  async getMilestoneProgress(milestoneId: number): Promise<any> {
    return this.request(`/milestones/${milestoneId}/progress`)
  }

  // Analytics endpoints
  async getProjectOverview(): Promise<any> {
    return this.request('/project/overview')
  }

  async getDashboardAnalytics(): Promise<any> {
    return this.request('/analytics/dashboard')
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request('/health')
  }
}

export const apiService = new ApiService()