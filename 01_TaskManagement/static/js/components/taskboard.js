// Member-Based Taskboard Component for HDPSA Task Management
class TaskBoard {
    constructor(containerId, milestoneId = null) {
        console.log('TaskBoard constructor called with:', { containerId, milestoneId });
        this.containerId = containerId;
        this.milestoneId = milestoneId;
        this.tasks = [];
        this.assignments = [];
        this.members = [];
        this.currentUser = null;
        this.taskModal = null;
        this.filters = {
            complexity: '',
            category: '',
            skill: ''
        };
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.render();
        this.setupEventListeners();
        this.setupAuthListeners();
        this.updateTaskCounts();
    }
    
    setupAuthListeners() {
        // Listen for auth state changes (legacy)
        window.addEventListener('authStateChanged', (event) => {
            this.setCurrentUser(event.detail.user);
        });
        
        // Listen for profile selection (new dropdown system)
        window.addEventListener('profileSelected', (event) => {
            this.setCurrentUser(event.detail.user);
        });
        
        // Set initial user from localStorage if available
        const storedUser = localStorage.getItem('selected_user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                this.setCurrentUser(user);
            } catch (error) {
                console.error('Error parsing stored user:', error);
            }
        }
        
        // Fallback to old auth system
        if (window.githubAuth && window.githubAuth.isAuthenticated()) {
            this.setCurrentUser(window.githubAuth.getCurrentUser());
        }
    }

    async loadData() {
        try {
            console.log('Loading taskboard data...');
            // Load all data in parallel
            const [tasksContent, assignmentsContent, membersContent] = await Promise.all([
                this.loadTasks(),
                this.loadAssignments(), 
                this.loadMembers()
            ]);
            
            this.tasks = tasksContent;
            this.assignments = assignmentsContent;
            this.members = membersContent;
            
            console.log('Data loaded successfully:');
            console.log('- Tasks:', this.tasks.length);
            console.log('- Assignments:', this.assignments.length);
            console.log('- Members:', this.members.length, this.members);
        } catch (error) {
            console.error('Error loading taskboard data:', error);
            this.members = []; // Ensure members is empty array if load fails
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

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Taskboard container ${this.containerId} not found`);
            return;
        }

        container.innerHTML = `
            <div class="taskboard-container">
                <!-- Filters -->
                <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div class="flex items-center space-x-3">
                        <button id="refreshBtn" class="inline-flex items-center px-4 py-2 rounded-md transition-colors" style="background-color: var(--color-overlay); color: var(--color-text);">
                            <i class="fas fa-sync mr-2"></i> Refresh
                        </button>
                    </div>
                </div>

                <!-- Member-Based Task Board -->
                <div class="space-y-8">
                    ${this.renderMemberBlocks()}
                </div>
            </div>
        `;

        this.renderMemberBoard();
    }
    
    renderMemberBlocks() {
        console.log('Rendering member blocks. Members loaded:', this.members.length, this.members);
        
        // Backlog block first
        let html = `
            <div class="member-block rounded-lg shadow-sm" style="background-color: var(--color-surface); border: 1px solid var(--color-highlight-med);" id="backlogBlock">
                <div class="member-header px-4 py-3 rounded-t-lg" style="background-color: var(--color-overlay); border-bottom: 1px solid var(--color-highlight-med);">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-medium flex items-center" style="color: var(--color-text);">
                            <i class="fas fa-inbox mr-2" style="color: var(--color-muted);"></i>
                            <span>Backlog</span>
                        </h3>
                        <span id="backlogCount" class="inline-flex items-center justify-center w-6 h-6 text-xs rounded-full" style="background-color: var(--color-highlight-med); color: var(--color-text);">0</span>
                    </div>
                    <p class="text-xs mt-1" style="color: var(--color-subtle);">Available tasks waiting to be assigned</p>
                </div>
                <div id="backlogTasks" class="member-tasks min-h-32"></div>
            </div>
        `;

        // Check if members data loaded
        if (!this.members || this.members.length === 0) {
            html += `
                <div class="member-block rounded-lg shadow-sm" style="background-color: var(--color-surface); border: 1px solid var(--color-danger);">
                    <div class="member-header px-4 py-3 rounded-t-lg" style="background-color: var(--color-overlay); border-bottom: 1px solid var(--color-highlight-med);">
                        <h3 class="text-sm font-medium" style="color: var(--color-danger);">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            No Members Loaded
                        </h3>
                        <p class="text-xs mt-1" style="color: var(--color-muted);">Check MongoDB Atlas connection</p>
                    </div>
                </div>
            `;
            return html;
        }

        // Member blocks
        this.members.forEach((member, index) => {
            console.log(`Rendering member ${index + 1}:`, member);
            const colorStyles = this.getMemberColorStyles(member.memberColor);
            html += `
                <div class="member-block rounded-lg shadow-sm" style="background-color: var(--color-surface); border: 1px solid var(--color-highlight-med);" id="member-${member.id}">
                    <div class="member-header px-4 py-3 rounded-t-lg" style="background: ${colorStyles.headerBg}; border-bottom: 1px solid var(--color-highlight-med);">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <img src="${member.avatar || `https://github.com/identicons/${member.githubUsername || 'default'}.png`}" 
                                     alt="${member.displayName}" 
                                     class="w-8 h-8 rounded-full mr-3"
                                     onerror="this.src='https://github.com/identicons/default.png'">
                                <div>
                                    <h3 class="text-sm font-medium" style="color: var(--color-text);">${this.escapeHtml(member.displayName)}</h3>
                                    <p class="text-xs" style="color: var(--color-muted);">${this.escapeHtml(member.role)} ${member.githubUsername ? `• @${member.githubUsername}` : ''}</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span id="member-${member.id}-count" class="inline-flex items-center justify-center w-6 h-6 text-xs rounded-full" style="background: ${colorStyles.badgeBg}; color: var(--color-text);">0</span>
                            </div>
                        </div>
                    </div>
                    <div id="member-${member.id}-tasks" class="member-tasks min-h-32"></div>
                </div>
            `;
        });

        return html;
    }
    
    getMemberColorStyles(color) {
        const colorMap = {
            blue: {
                headerBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                badgeBg: 'rgba(59, 130, 246, 0.2)',
                skillBg: 'rgba(59, 130, 246, 0.15)'
            },
            purple: {
                headerBg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                badgeBg: 'rgba(139, 92, 246, 0.2)',
                skillBg: 'rgba(139, 92, 246, 0.15)'
            },
            green: {
                headerBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                badgeBg: 'rgba(16, 185, 129, 0.2)',
                skillBg: 'rgba(16, 185, 129, 0.15)'
            },
            orange: {
                headerBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                badgeBg: 'rgba(245, 158, 11, 0.2)',
                skillBg: 'rgba(245, 158, 11, 0.15)'
            },
            cyan: {
                headerBg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
                badgeBg: 'rgba(6, 182, 212, 0.2)',
                skillBg: 'rgba(6, 182, 212, 0.15)'
            }
        };
        
        return colorMap[color] || colorMap.blue;
    }

    renderMemberBoard() {
        console.log('renderMemberBoard called. Members:', this.members.length);
        
        // Clear existing content
        const backlogContainer = document.getElementById('backlogTasks');
        if (backlogContainer) {
            backlogContainer.innerHTML = '';
        } else {
            console.error('Backlog container not found');
        }
        
        this.members.forEach(member => {
            const memberContainer = document.getElementById(`member-${member.id}-tasks`);
            if (memberContainer) {
                memberContainer.innerHTML = '';
            } else {
                console.log(`Member container not found for member ${member.id}: ${member.displayName}`);
            }
        });

        // Filter tasks based on milestone
        const filteredTasks = this.milestoneId 
            ? this.tasks.filter(task => task.milestoneId === this.milestoneId)
            : this.tasks;

        // Apply additional filters
        const tasksToShow = this.applyFilters(filteredTasks);

        // Separate tasks into backlog and assigned
        const tasksByAssignment = this.getTasksByAssignment(tasksToShow);

        // Render backlog tasks
        const backlogTasksContainer = document.getElementById('backlogTasks');
        tasksByAssignment.backlog.forEach(task => {
            const taskCard = this.createTaskCard(task, null);
            backlogTasksContainer.appendChild(taskCard);
        });

        // Render member tasks
        this.members.forEach(member => {
            const memberContainer = document.getElementById(`member-${member.id}-tasks`);
            if (memberContainer && tasksByAssignment.members[member.id]) {
                tasksByAssignment.members[member.id].forEach(({task, assignment}) => {
                    const taskCard = this.createTaskCard(task, assignment);
                    memberContainer.appendChild(taskCard);
                });
            }
        });

        this.updateTaskCounts();
    }

    getTasksByAssignment(filteredTasks) {
        const result = {
            backlog: [],
            members: {}
        };

        // Initialize member arrays
        this.members.forEach(member => {
            result.members[member.id] = [];
        });

        filteredTasks.forEach(task => {
            const assignment = this.getTaskAssignment(task.id);
            
            if (!assignment) {
                // Unassigned tasks go to backlog
                result.backlog.push(task);
            } else {
                // Find member by GitHub username
                const member = this.members.find(m => 
                    m.id === assignment.memberId
                );
                
                if (member) {
                    result.members[member.id].push({task, assignment});
                } else {
                    // If member not found, put in backlog
                    result.backlog.push(task);
                }
            }
        });

        return result;
    }

    addTaskStatusStyling(taskCard, assignment) {
        if (!assignment) return;

        // Add status indicator based on assignment status and progress
        const statusColors = {
            'assigned': 'var(--color-muted)',        // Gray for just assigned
            'in-progress': 'var(--color-gold)',      // Gold for in progress  
            'review': 'var(--color-rose)',           // Rose for review
            'completed': 'var(--color-pine)'        // Pine for completed
        };

        let status = assignment.status;
        if (assignment.status === 'completed' && assignment.reviewRequested) {
            status = 'review';
        }

        // Add status indicator to task card
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'task-status-indicator';
        statusIndicator.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: ${statusColors[status] || statusColors.assigned};
        `;
        
        taskCard.style.position = 'relative';
        taskCard.appendChild(statusIndicator);

        // Add subtle border color
        taskCard.style.borderLeft = `3px solid ${statusColors[status] || statusColors.assigned}`;
    }

    createTaskCard(task, assignment = null) {
        // Create task component
        const taskComponent = TaskComponent
            .create(task, assignment, this.currentUser)
            .setCallbacks({
                onAssign: (taskId) => this.assignTask(taskId),
                onStart: (assignmentId) => this.startTask(assignmentId),
                onUpdate: (assignmentId) => this.updateProgress(assignmentId),
                onComplete: (assignmentId) => this.completeTask(assignmentId),
                onClick: (task, assignment) => this.showTaskDetails(task, assignment)
            });
        
        return taskComponent.createElement();
    }

    getTaskAssignment(taskId) {
        return this.assignments.find(assignment => 
            assignment.taskId === taskId && 
            assignment.status !== 'reassigned'
        );
    }

    applyFilters(tasks) {
        return tasks.filter(task => {
            if (this.filters.complexity && task.complexity !== this.filters.complexity) {
                return false;
            }
            if (this.filters.category && task.category !== this.filters.category) {
                return false;
            }
            if (this.filters.skill && task.skills && !task.skills.includes(this.filters.skill)) {
                return false;
            }
            return true;
        });
    }

    updateTaskCounts() {
        // Update backlog count
        const backlogTasks = document.querySelectorAll('#backlogTasks .task-card');
        document.getElementById('backlogCount').textContent = backlogTasks.length;

        // Update member counts
        this.members.forEach(member => {
            const memberTasks = document.querySelectorAll(`#member-${member.id}-tasks .task-card`);
            document.getElementById(`member-${member.id}-count`).textContent = memberTasks.length;
        });
    }

    setupEventListeners() {
        // Filter controls
        const complexityFilter = document.getElementById('complexityFilter');
        const categoryFilter = document.getElementById('categoryFilter');
        const skillFilter = document.getElementById('skillFilter');
        const refreshBtn = document.getElementById('refreshBtn');

        if (complexityFilter) {
            complexityFilter.addEventListener('change', (e) => {
                this.filters.complexity = e.target.value;
                this.renderMemberBoard();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.renderMemberBoard();
            });
        }

        if (skillFilter) {
            skillFilter.addEventListener('change', (e) => {
                this.filters.skill = e.target.value;
                this.renderMemberBoard();
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refresh();
            });
        }
    }

    showTaskDetails(task, assignment) {
        // Create and show task modal
        if (!this.taskModal) {
            this.taskModal = new TaskModal();
        }
        this.taskModal.show(task, assignment);
    }

    async assignTask(taskId) {
        if (!this.currentUser) return;

        try {
            const assignmentId = 'a' + Date.now();
            const newAssignment = {
                assignmentId: assignmentId,
                taskId: taskId,
                memberId: this.currentUser.id,
                memberDisplayName: this.currentUser.displayName,
                assigneeId: this.currentUser.id,
                status: 'assigned',
                assignedDate: new Date().toISOString(),
                startedDate: null,
                completedDate: null,
                progress: 0,
                timeSpent: 0,
                notes: null,
                reviewRequested: false,
                reviewCompletedBy: null,
                reviewDate: null
            };
            
            this.assignments.push(newAssignment);
            
            // Update assignments file if GitHub API is available
            if (window.GitHubAPI) {
                try {
                    await window.GitHubAPI.updateAssignments(this.assignments);
                } catch (apiError) {
                    console.warn('Could not save assignments:', apiError);
                }
            }
            
            this.renderMemberBoard();
            this.showNotification('Task assigned successfully!', 'success');
        } catch (error) {
            console.error('Error assigning task:', error);
            this.showNotification('Error assigning task', 'error');
        }
    }

    async startTask(assignmentIdOrTaskId) {
        if (!this.currentUser) return;

        try {
            // Check if this is an existing assignment or a new task
            let assignment = this.assignments.find(a => a.assignmentId === assignmentIdOrTaskId);
            
            if (assignment) {
                // Update existing assignment to in-progress
                const index = this.assignments.findIndex(a => a.assignmentId === assignmentIdOrTaskId);
                this.assignments[index].status = 'in-progress';
                this.assignments[index].startedDate = new Date().toISOString();
            } else {
                // Create new assignment and start it (for unassigned tasks from backlog)
                const taskId = assignmentIdOrTaskId;
                const newAssignmentId = 'a' + Date.now();
                const newAssignment = {
                    assignmentId: newAssignmentId,
                    taskId: taskId,
                    memberId: this.currentUser.id,
                    memberDisplayName: this.currentUser.displayName,
                    assigneeId: this.currentUser.id,
                    status: 'in-progress',
                    assignedDate: new Date().toISOString(),
                    startedDate: new Date().toISOString(),
                    completedDate: null,
                    progress: 10, // Start with 10% progress
                    timeSpent: 0,
                    notes: null,
                    reviewRequested: false,
                    reviewCompletedBy: null,
                    reviewDate: null
                };
                
                this.assignments.push(newAssignment);
            }
            
            if (window.GitHubAPI) {
                try {
                    await window.GitHubAPI.updateAssignments(this.assignments);
                } catch (apiError) {
                    console.warn('Could not save assignments:', apiError);
                }
            }
            
            this.renderMemberBoard();
            this.showNotification('Task started!', 'success');
        } catch (error) {
            console.error('Error starting task:', error);
            this.showNotification('Error starting task', 'error');
        }
    }

    async completeTask(assignmentId) {
        try {
            const index = this.assignments.findIndex(a => a.assignmentId === assignmentId);
            if (index !== -1) {
                this.assignments[index].status = 'completed';
                this.assignments[index].completedDate = new Date().toISOString();
                this.assignments[index].progress = 100;
                
                if (window.GitHubAPI) {
                    try {
                        await window.GitHubAPI.updateAssignments(this.assignments);
                    } catch (apiError) {
                        console.warn('Could not save assignments:', apiError);
                    }
                }
            }
            
            this.renderMemberBoard();
            this.showNotification('Task completed!', 'success');
        } catch (error) {
            console.error('Error completing task:', error);
            this.showNotification('Error completing task', 'error');
        }
    }
    
    async updateProgress(assignmentId) {
        const progress = prompt('Enter progress percentage (0-100):');
        const progressNum = parseInt(progress);
        
        if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
            this.showNotification('Please enter a valid percentage (0-100)', 'error');
            return;
        }
        
        try {
            const index = this.assignments.findIndex(a => a.assignmentId === assignmentId);
            if (index !== -1) {
                this.assignments[index].progress = progressNum;
                
                if (window.GitHubAPI) {
                    try {
                        await window.GitHubAPI.updateAssignments(this.assignments);
                    } catch (apiError) {
                        console.warn('Could not save assignments:', apiError);
                    }
                }
            }
            
            this.renderMemberBoard();
            this.showNotification(`Progress updated to ${progressNum}%!`, 'success');
        } catch (error) {
            console.error('Error updating progress:', error);
            this.showNotification('Error updating progress', 'error');
        }
    }

    async refresh() {
        await this.loadData();
        this.renderMemberBoard();
        this.showNotification('Data refreshed!', 'success');
    }

    showNotification(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    setCurrentUser(user) {
        this.currentUser = user;
        this.renderMemberBoard();
    }

    setMilestoneFilter(milestoneId) {
        this.milestoneId = milestoneId;
        this.renderMemberBoard();
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Make TaskBoard globally available
window.TaskBoard = TaskBoard;