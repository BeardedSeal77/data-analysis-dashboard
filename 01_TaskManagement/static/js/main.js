// HDPSA Task Management System - Main Application
class TaskManager {
    constructor() {
        this.tasks = [];
        this.assignments = [];
        this.currentUser = null;
        this.filters = {
            complexity: '',
            category: '',
            skill: '',
            assignee: ''
        };
        
        this.init();
    }

    async init() {
        await this.loadTasks();
        await this.loadAssignments();
        this.setupEventListeners();
        this.renderKanbanBoard();
        this.updateTaskCounts();
    }

    async loadTasks() {
        try {
            const response = await GitHubAPI.getFile('tasks.json');
            this.tasks = JSON.parse(response);
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
        }
    }

    async loadAssignments() {
        try {
            const response = await GitHubAPI.getFile('task_assignments.json');
            this.assignments = JSON.parse(response);
        } catch (error) {
            console.error('Error loading assignments:', error);
            this.assignments = [];
        }
    }

    setupEventListeners() {
        // Filter controls
        document.getElementById('complexityFilter').addEventListener('change', (e) => {
            this.filters.complexity = e.target.value;
            this.applyFilters();
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.applyFilters();
        });

        document.getElementById('skillFilter').addEventListener('change', (e) => {
            this.filters.skill = e.target.value;
            this.applyFilters();
        });

        // Action buttons
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refresh();
        });

        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.showAddTaskModal();
        });

        // Modal controls
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeModal(e.target.closest('.modal'));
            });
        });

        // Add task form
        document.getElementById('addTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTask();
        });

        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target);
            }
        });
    }

    renderKanbanBoard() {
        const columns = {
            'available': document.getElementById('backlogTasks'),
            'in-progress': document.getElementById('progressTasks'),
            'review': document.getElementById('reviewTasks'),
            'completed': document.getElementById('completedTasks')
        };

        // Clear existing content
        Object.values(columns).forEach(column => {
            column.innerHTML = '';
        });

        // Group tasks by status
        const tasksByStatus = this.getTasksByStatus();

        Object.entries(tasksByStatus).forEach(([status, tasks]) => {
            const column = columns[status];
            if (column) {
                tasks.forEach(task => {
                    const taskCard = this.createTaskCard(task);
                    column.appendChild(taskCard);
                });
            }
        });

        this.updateTaskCounts();
    }

    createTaskCard(task) {
        const assignment = this.getTaskAssignment(task.id);
        const card = document.createElement('div');
        card.className = 'task-card';
        card.dataset.taskId = task.id;

        const complexityColors = {
            low: 'bg-green-100 text-green-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-red-100 text-red-800'
        };

        card.innerHTML = `
            <div class="task-header">
                <h4 class="task-title">${task.title}</h4>
                <span class="complexity-badge ${complexityColors[task.complexity]}">${task.complexity}</span>
            </div>
            <p class="task-description">${task.description}</p>
            <div class="task-meta">
                <span class="category">${task.category}</span>
                <span class="hours">${task.estimatedHours}h</span>
            </div>
            ${task.skills && task.skills.length > 0 ? `
                <div class="task-skills">
                    ${task.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            ` : ''}
            ${assignment ? `
                <div class="task-assignment">
                    <div class="assignee">
                        <i class="fas fa-user"></i>
                        ${assignment.memberDisplayName}
                    </div>
                    ${assignment.progress > 0 ? `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${assignment.progress}%"></div>
                            <span class="progress-text">${assignment.progress}%</span>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            <div class="task-actions">
                ${this.getTaskActionButtons(task, assignment)}
            </div>
        `;

        card.addEventListener('click', () => {
            this.showTaskDetails(task, assignment);
        });

        return card;
    }

    getTaskActionButtons(task, assignment) {
        if (!this.currentUser) {
            return '<button class="btn btn-sm btn-secondary" disabled>Login Required</button>';
        }

        if (!assignment && task.status === 'available') {
            return '<button class="btn btn-sm btn-primary assign-btn">Assign to Me</button>';
        }

        if (assignment && assignment.memberId === this.currentUser.id) {
            if (assignment.status === 'assigned') {
                return '<button class="btn btn-sm btn-success start-btn">Start Task</button>';
            } else if (assignment.status === 'in-progress') {
                return `
                    <button class="btn btn-sm btn-info update-btn">Update Progress</button>
                    <button class="btn btn-sm btn-success complete-btn">Mark Complete</button>
                `;
            }
        }

        return '';
    }

    getTasksByStatus() {
        const filtered = this.applyFilters();
        const tasksByStatus = {
            'available': [],
            'in-progress': [],
            'review': [],
            'completed': []
        };

        filtered.forEach(task => {
            const assignment = this.getTaskAssignment(task.id);
            let status = task.status;

            if (assignment) {
                if (assignment.status === 'in-progress') {
                    status = 'in-progress';
                } else if (assignment.status === 'completed' && assignment.reviewRequested) {
                    status = 'review';
                } else if (assignment.status === 'completed') {
                    status = 'completed';
                }
            }

            tasksByStatus[status].push(task);
        });

        return tasksByStatus;
    }

    getTaskAssignment(taskId) {
        return this.assignments.find(assignment => 
            assignment.taskId === taskId && 
            assignment.status !== 'reassigned'
        );
    }

    applyFilters() {
        let filtered = [...this.tasks];

        if (this.filters.complexity) {
            filtered = filtered.filter(task => task.complexity === this.filters.complexity);
        }

        if (this.filters.category) {
            filtered = filtered.filter(task => task.category === this.filters.category);
        }

        if (this.filters.skill) {
            filtered = filtered.filter(task => 
                task.skills && task.skills.includes(this.filters.skill)
            );
        }

        this.renderKanbanBoard();
        return filtered;
    }

    updateTaskCounts() {
        const tasksByStatus = this.getTasksByStatus();
        
        document.getElementById('backlogCount').textContent = tasksByStatus['available'].length;
        document.getElementById('progressCount').textContent = tasksByStatus['in-progress'].length;
        document.getElementById('reviewCount').textContent = tasksByStatus['review'].length;
        document.getElementById('completedCount').textContent = tasksByStatus['completed'].length;
    }

    showTaskDetails(task, assignment) {
        const modal = document.getElementById('taskModal');
        const details = document.getElementById('taskDetails');
        
        details.innerHTML = `
            <div class="task-detail-content">
                <h3>${task.title}</h3>
                <p><strong>Description:</strong> ${task.description}</p>
                <p><strong>Category:</strong> ${task.category}</p>
                <p><strong>Complexity:</strong> ${task.complexity}</p>
                <p><strong>Estimated Hours:</strong> ${task.estimatedHours}</p>
                ${task.skills ? `<p><strong>Skills:</strong> ${task.skills.join(', ')}</p>` : ''}
                ${task.deliverables ? `<p><strong>Deliverables:</strong> ${task.deliverables.join(', ')}</p>` : ''}
                ${task.dueDate ? `<p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
                ${assignment ? `
                    <hr>
                    <h4>Assignment Details</h4>
                    <p><strong>Assignee:</strong> ${assignment.memberDisplayName}</p>
                    <p><strong>Status:</strong> ${assignment.status}</p>
                    <p><strong>Progress:</strong> ${assignment.progress}%</p>
                    <p><strong>Time Spent:</strong> ${assignment.timeSpent} hours</p>
                    ${assignment.notes ? `<p><strong>Notes:</strong> ${assignment.notes}</p>` : ''}
                ` : ''}
            </div>
        `;

        this.showModal(modal);
    }

    showAddTaskModal() {
        const modal = document.getElementById('addTaskModal');
        this.showModal(modal);
    }

    showModal(modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    async handleAddTask() {
        const form = document.getElementById('addTaskForm');
        const formData = new FormData(form);
        
        const newTask = {
            id: Math.max(...this.tasks.map(t => t.id), 0) + 1,
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            category: document.getElementById('taskCategory').value,
            complexity: document.getElementById('taskComplexity').value,
            estimatedHours: parseInt(document.getElementById('taskHours').value),
            skills: document.getElementById('taskSkills').value.split(',').map(s => s.trim()).filter(s => s),
            deliverables: document.getElementById('taskDeliverables').value.split(',').map(s => s.trim()).filter(s => s),
            createdDate: new Date().toISOString(),
            dueDate: document.getElementById('taskDueDate').value ? new Date(document.getElementById('taskDueDate').value).toISOString() : null,
            status: 'available',
            prerequisites: []
        };

        try {
            this.tasks.push(newTask);
            await GitHubAPI.updateFile('tasks.json', JSON.stringify(this.tasks, null, 2));
            this.closeModal(document.getElementById('addTaskModal'));
            form.reset();
            this.renderKanbanBoard();
            this.showNotification('Task created successfully!', 'success');
        } catch (error) {
            console.error('Error creating task:', error);
            this.showNotification('Error creating task', 'error');
        }
    }

    async refresh() {
        document.getElementById('loadingSpinner').classList.remove('hidden');
        try {
            await this.loadTasks();
            await this.loadAssignments();
            this.renderKanbanBoard();
            this.showNotification('Data refreshed successfully!', 'success');
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.showNotification('Error refreshing data', 'error');
        } finally {
            document.getElementById('loadingSpinner').classList.add('hidden');
        }
    }

    showNotification(message, type = 'info') {
        // Simple notification system - can be enhanced later
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    setCurrentUser(user) {
        this.currentUser = user;
        this.renderKanbanBoard();
    }
}

// Initialize the application
let taskManager;
document.addEventListener('DOMContentLoaded', function() {
    taskManager = new TaskManager();
});