// Dashboard Logic for HDPSA Task Management
class Dashboard {
    constructor() {
        this.tasks = [];
        this.assignments = [];
        this.members = [];
        this.currentUser = null;
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.renderOverviewCards();
        this.renderMilestoneProgress();
        this.renderTeamActivity();
        this.renderRecentTasks();
        this.setupEventListeners();
    }

    async loadData() {
        try {
            const [tasksContent, assignmentsContent, membersContent] = await Promise.all([
                this.loadTasks(),
                this.loadAssignments(),
                this.loadMembers()
            ]);
            
            this.tasks = tasksContent;
            this.assignments = assignmentsContent;
            this.members = membersContent;
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadTasks() {
        return window.dataLoader.loadTasks();
    }

    async loadAssignments() {
        return window.dataLoader.loadAssignments();
    }

    async loadMembers() {
        return window.dataLoader.loadMembers();
    }

    renderOverviewCards() {
        // Total Tasks
        const totalTasksElement = document.getElementById('totalTasks');
        if (totalTasksElement) {
            totalTasksElement.textContent = this.tasks.length;
        }

        // In Progress Tasks
        const inProgressTasksElement = document.getElementById('inProgressTasks');
        if (inProgressTasksElement) {
            const inProgressCount = this.assignments.filter(a => a.status === 'in-progress').length;
            inProgressTasksElement.textContent = inProgressCount;
        }

        // Completed Tasks
        const completedTasksElement = document.getElementById('completedTasks');
        if (completedTasksElement) {
            const completedCount = this.assignments.filter(a => a.status === 'completed').length;
            completedTasksElement.textContent = completedCount;
        }

        // Team Members
        const teamMembersElement = document.getElementById('teamMembers');
        if (teamMembersElement) {
            const activeMembers = this.members.filter(m => m.isActive).length;
            teamMembersElement.textContent = activeMembers;
        }
    }

    renderMilestoneProgress() {
        const milestoneProgressElement = document.getElementById('milestoneProgress');
        if (!milestoneProgressElement) return;

        const milestones = [
            { id: 1, name: 'Business & Data Understanding' },
            { id: 2, name: 'Data Preparation' },
            { id: 3, name: 'Modeling' },
            { id: 4, name: 'Evaluation' },
            { id: 5, name: 'Deployment' },
            { id: 6, name: 'Final Report' }
        ];

        const progressHTML = milestones.map(milestone => {
            const progress = this.calculateMilestoneProgress(milestone.id);
            const progressColor = this.getProgressColor(progress.percentage);
            
            return `
                <div class="milestone-progress-item">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-3">
                            <span class="text-sm font-medium text-gray-900">Milestone ${milestone.id}</span>
                            <span class="text-xs text-gray-500">${milestone.name}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-sm font-medium text-gray-900">${progress.percentage}%</span>
                            <span class="text-xs text-gray-500">(${progress.completed}/${progress.total})</span>
                        </div>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="h-2 rounded-full transition-all duration-300 ${progressColor}" style="width: ${progress.percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        milestoneProgressElement.innerHTML = progressHTML;
    }

    calculateMilestoneProgress(milestoneId) {
        const milestoneTasks = this.tasks.filter(task => task.milestoneId === milestoneId);
        const totalTasks = milestoneTasks.length;
        
        if (totalTasks === 0) {
            return { completed: 0, total: 0, percentage: 0 };
        }

        let completedTasks = 0;
        milestoneTasks.forEach(task => {
            const assignment = this.assignments.find(a => 
                a.taskId === task.id && a.status === 'completed'
            );
            if (assignment) {
                completedTasks++;
            }
        });

        const percentage = Math.round((completedTasks / totalTasks) * 100);
        return { completed: completedTasks, total: totalTasks, percentage };
    }

    getProgressColor(percentage) {
        if (percentage === 100) return 'bg-green-500';
        if (percentage >= 75) return 'bg-blue-500';
        if (percentage >= 50) return 'bg-yellow-500';
        if (percentage >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    }

    renderTeamActivity() {
        const teamActivityElement = document.getElementById('teamActivity');
        if (!teamActivityElement) return;

        // Get recent activity from assignments
        const recentActivity = this.assignments
            .filter(a => a.assignedDate || a.startedDate || a.completedDate)
            .sort((a, b) => {
                const dateA = new Date(a.completedDate || a.startedDate || a.assignedDate);
                const dateB = new Date(b.completedDate || b.startedDate || b.assignedDate);
                return dateB - dateA;
            })
            .slice(0, 5);

        if (recentActivity.length === 0) {
            teamActivityElement.innerHTML = '<p class="text-gray-500 text-sm">No recent activity</p>';
            return;
        }

        const activityHTML = recentActivity.map(assignment => {
            const task = this.tasks.find(t => t.id === assignment.taskId);
            const member = this.members.find(m => m.githubUsername === assignment.assigneeUsername);
            
            let actionText = 'assigned';
            let actionColor = 'text-blue-600';
            let actionDate = assignment.assignedDate;

            if (assignment.completedDate) {
                actionText = 'completed';
                actionColor = 'text-green-600';
                actionDate = assignment.completedDate;
            } else if (assignment.startedDate) {
                actionText = 'started';
                actionColor = 'text-yellow-600';
                actionDate = assignment.startedDate;
            }

            const timeAgo = this.timeAgo(new Date(actionDate));

            return `
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span class="text-xs font-medium text-gray-600">
                                ${(member?.name || assignment.assigneeDisplayName || 'Unknown').split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </span>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-gray-900">
                            <span class="font-medium">${member?.name || assignment.assigneeDisplayName}</span>
                            <span class="${actionColor}"> ${actionText}</span>
                            <span class="font-medium"> ${task?.title || 'Unknown Task'}</span>
                        </p>
                        <p class="text-xs text-gray-500">${timeAgo}</p>
                    </div>
                </div>
            `;
        }).join('');

        teamActivityElement.innerHTML = activityHTML;
    }

    renderRecentTasks() {
        const recentTasksElement = document.getElementById('recentTasks');
        if (!recentTasksElement) return;

        // Get recently created or updated tasks
        const recentTasks = this.tasks
            .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
            .slice(0, 5);

        if (recentTasks.length === 0) {
            recentTasksElement.innerHTML = '<p class="text-gray-500 text-sm">No recent tasks</p>';
            return;
        }

        const tasksHTML = recentTasks.map(task => {
            const assignment = this.assignments.find(a => a.taskId === task.id && a.status !== 'reassigned');
            const statusColor = this.getTaskStatusColor(task, assignment);
            const statusText = this.getTaskStatusText(task, assignment);

            return `
                <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-medium text-gray-900 truncate">${task.title}</h4>
                        <p class="text-xs text-gray-500 mt-1">
                            <span class="complexity-badge complexity-${task.complexity}">${task.complexity}</span>
                            <span class="ml-2">${task.estimatedHours}h</span>
                            ${assignment ? `<span class="ml-2">• ${assignment.assigneeDisplayName}</span>` : ''}
                        </p>
                    </div>
                    <div class="flex-shrink-0 ml-4">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}">
                            ${statusText}
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        recentTasksElement.innerHTML = tasksHTML;
    }

    getTaskStatusColor(task, assignment) {
        if (!assignment) return 'bg-gray-100 text-gray-800';
        
        switch (assignment.status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in-progress': return 'bg-yellow-100 text-yellow-800';
            case 'assigned': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    getTaskStatusText(task, assignment) {
        if (!assignment) return 'Available';
        
        switch (assignment.status) {
            case 'completed': return 'Completed';
            case 'in-progress': return 'In Progress';
            case 'assigned': return 'Assigned';
            default: return 'Available';
        }
    }

    timeAgo(date) {
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hours ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} days ago`;
        
        return date.toLocaleDateString();
    }

    setupEventListeners() {
        // Auto-refresh every 30 seconds
        setInterval(() => {
            this.refresh();
        }, 30000);
    }

    async refresh() {
        try {
            await this.loadData();
            this.renderOverviewCards();
            this.renderMilestoneProgress();
            this.renderTeamActivity();
            this.renderRecentTasks();
            
            // Update navbar milestone statuses
            if (window.navbar) {
                window.navbar.refresh();
            }
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
        }
    }

    setCurrentUser(user) {
        this.currentUser = user;
        // Dashboard doesn't need to re-render for user changes
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for auth to be available
    setTimeout(() => {
        window.dashboard = new Dashboard();
        
        // Connect to auth system
        if (window.githubAuth) {
            window.githubAuth.onUserChange = (user) => {
                window.dashboard.setCurrentUser(user);
            };
        }
    }, 100);
});