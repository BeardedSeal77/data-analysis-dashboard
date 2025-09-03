// Reusable Task Component for HDPSA Task Management
class TaskComponent {
    constructor(task, assignment = null, currentUser = null) {
        this.task = task;
        this.assignment = assignment;
        this.currentUser = currentUser;
        this.element = null;
        this.callbacks = {
            onAssign: null,
            onStart: null,
            onUpdate: null,
            onComplete: null,
            onClick: null
        };
    }

    // Set callback functions for task actions
    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
        return this;
    }

    // Create the task card element
    createElement() {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.dataset.taskId = this.task.id;

        card.innerHTML = this.renderContent();
        this.addEventListeners(card);
        
        this.element = card;
        return card;
    }

    // Render the task card content
    renderContent() {
        return `
            <div class="task-header">
                <h4 class="task-title">${this.escapeHtml(this.task.title)}</h4>
            </div>
            
            <p class="task-description">${this.escapeHtml(this.task.description)}</p>
            
            <div class="task-meta">
                <span class="category" title="Category">${this.escapeHtml(this.task.category)}</span>
                <span class="hours" title="Estimated hours">${this.task.estimatedHours}h</span>
            </div>
            
            ${this.renderAssignment()}
            
            <div class="task-actions">
                ${this.renderActionButtons()}
            </div>
            
            ${this.renderProgressBar()}
        `;
    }


    // Render assignment information
    renderAssignment() {
        if (!this.assignment) {
            return '';
        }

        return `
            <div class="task-assignment">
                <div class="assignee">
                    <i class="fas fa-user" style="color: var(--color-muted);"></i>
                    <span>${this.escapeHtml(this.assignment.memberDisplayName)}</span>
                </div>
            </div>
        `;
    }

    // Render bottom progress bar
    renderProgressBar() {
        const statusColors = {
            'unassigned': '#E5E7EB',    // Light gray for unassigned
            'assigned': '#9CA3AF',      // Gray
            'in-progress': '#F59E0B',   // Gold
            'review': '#FB7185',        // Rose  
            'completed': '#10B981'      // Pine/Green
        };

        let status = 'unassigned';
        let progress = 0;

        if (this.assignment) {
            status = this.assignment.status;
            progress = this.assignment.progress || 0;
        }

        const color = statusColors[status] || statusColors['unassigned'];

        return `
            <div class="task-progress-bottom" style="
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 6px;
                background-color: ${color};
                border-radius: 0 0 0.5rem 0.5rem;
            ">
            </div>
        `;
    }



    // Render action buttons based on user permissions and task state
    renderActionButtons() {
        // Get current user from localStorage if not passed in
        if (!this.currentUser) {
            const storedUser = localStorage.getItem('selected_user');
            if (storedUser) {
                try {
                    this.currentUser = JSON.parse(storedUser);
                } catch (error) {
                    console.error('Error parsing stored user:', error);
                }
            }
        }
        
        if (!this.currentUser) {
            return `
                <button class="btn btn-sm btn-secondary" disabled title="Please select your profile">
                    <i class="fas fa-user mr-1"></i>Select Profile
                </button>
            `;
        }

        // Available task - can be assigned or started directly
        if (!this.assignment) {
            return `
                <button class="btn btn-sm task-action-btn" data-action="start" title="Start this task" style="background-color: var(--color-accent); color: black;">
                    <i class="fas fa-play mr-1"></i>Start Task
                </button>
            `;
        }

        // Task assigned to current user  
        if (this.assignment && this.assignment.memberId === this.currentUser.id) {
            switch (this.assignment.status) {
                case 'assigned':
                    return `
                        <button class="btn btn-sm task-action-btn" data-action="start" title="Start working on this task" style="background-color: var(--color-accent); color: black;">
                            <i class="fas fa-play mr-1"></i>Start Task
                        </button>
                    `;
                
                case 'in-progress':
                    return `
                        <button class="btn btn-sm task-action-btn" data-action="complete" title="Mark as completed" style="background-color: var(--color-success); color: black;">
                            <i class="fas fa-check mr-1"></i>Complete
                        </button>
                    `;
                
                case 'completed':
                    return `
                        <span class="completed-badge" style="background-color: var(--color-success); color: var(--color-base);">
                            <i class="fas fa-check-circle mr-1"></i>Completed
                        </span>
                    `;
            }
        }

        // Task assigned to someone else
        if (this.assignment) {
            return `
                <span class="assigned-badge" title="Assigned to ${this.assignment.memberDisplayName}" style="background-color: var(--color-overlay); color: var(--color-text);">
                    <i class="fas fa-user mr-1"></i>Assigned
                </span>
            `;
        }

        return '';
    }

    // Add event listeners to the card
    addEventListeners(card) {
        // Card click handler (for viewing details)
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.task-actions')) {
                this.handleCardClick(e);
            }
        });

        // Action button handlers
        const actionButtons = card.querySelectorAll('.task-action-btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleActionClick(e.target.closest('.task-action-btn').dataset.action);
            });
        });

        // Hover effects for card
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-2px)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    }

    // Handle card click (show details)
    handleCardClick(e) {
        if (this.callbacks.onClick) {
            this.callbacks.onClick(this.task, this.assignment);
        }
    }

    // Handle action button clicks
    handleActionClick(action) {
        switch (action) {
            case 'assign':
                if (this.callbacks.onAssign) {
                    this.callbacks.onAssign(this.task.id);
                }
                break;
            
            case 'start':
                if (this.callbacks.onStart) {
                    // Pass assignmentId if assigned, taskId if unassigned
                    const id = this.assignment ? this.assignment.assignmentId : this.task.id;
                    this.callbacks.onStart(id);
                }
                break;
            
            case 'update':
                if (this.callbacks.onUpdate && this.assignment) {
                    this.callbacks.onUpdate(this.assignment.assignmentId);
                }
                break;
            
            case 'complete':
                if (this.callbacks.onComplete && this.assignment) {
                    this.callbacks.onComplete(this.assignment.assignmentId);
                }
                break;
        }
    }

    // Update the component with new data
    update(task, assignment = null, currentUser = null) {
        this.task = task;
        this.assignment = assignment;
        this.currentUser = currentUser;

        if (this.element) {
            this.element.innerHTML = this.renderContent();
            this.addEventListeners(this.element);
        }
    }

    // Get the current task status for sorting/filtering
    getStatus() {
        if (!this.assignment) {
            return this.task.status;
        }

        switch (this.assignment.status) {
            case 'in-progress':
                return 'in-progress';
            case 'completed':
                if (this.assignment.reviewRequested) {
                    return 'review';
                }
                return 'completed';
            default:
                return this.assignment.status;
        }
    }

    // Check if task matches filter criteria
    matchesFilter(filters) {
        if (filters.complexity && this.task.complexity !== filters.complexity) {
            return false;
        }

        if (filters.category && this.task.category !== filters.category) {
            return false;
        }

        if (filters.skill && this.task.skills && !this.task.skills.includes(filters.skill)) {
            return false;
        }

        if (filters.assignee) {
            if (!this.assignment) {
                return filters.assignee === 'unassigned';
            }
            return this.assignment.memberId === filters.assignee;
        }

        return true;
    }

    // Utility function to escape HTML
    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Static method to create task component with fluent interface
    static create(task, assignment = null, currentUser = null) {
        return new TaskComponent(task, assignment, currentUser);
    }
}

// Task Modal Component for detailed view/editing
class TaskModal {
    constructor() {
        this.modalElement = null;
        this.currentTask = null;
        this.currentAssignment = null;
        this.callbacks = {
            onSave: null,
            onDelete: null,
            onAssign: null
        };
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
        return this;
    }

    show(task, assignment = null) {
        this.currentTask = task;
        this.currentAssignment = assignment;
        this.createModal();
        this.showModal();
    }

    hide() {
        if (this.modalElement) {
            this.modalElement.remove();
            this.modalElement = null;
        }
        document.body.style.overflow = 'auto';
    }

    createModal() {
        this.modalElement = document.createElement('div');
        this.modalElement.className = 'modal fixed inset-0 z-50 flex items-center justify-center';
        this.modalElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        
        this.modalElement.innerHTML = `
            <div class="modal-content max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4 rounded-lg shadow-xl" 
                 style="background-color: var(--color-surface); border: 1px solid var(--color-highlight-med);">
                <div class="modal-header p-6 border-b" style="border-color: var(--color-highlight-med);">
                    <div class="flex justify-between items-start">
                        <div>
                            <h2 class="text-xl font-bold mb-2" style="color: var(--color-text);">${this.escapeHtml(this.currentTask.title)}</h2>
                            <div class="flex items-center space-x-4">
                                <span class="complexity-badge ${this.currentTask.complexity}">${this.currentTask.complexity}</span>
                                <span class="category">${this.currentTask.category}</span>
                                <span class="hours">${this.currentTask.estimatedHours}h</span>
                            </div>
                        </div>
                        <button class="modal-close text-xl" style="color: var(--color-muted);" title="Close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="modal-body p-6">
                    ${this.renderModalContent()}
                </div>
                
                <div class="modal-footer p-6 border-t" style="border-color: var(--color-highlight-med);">
                    <div class="flex justify-end space-x-3">
                        <button class="btn btn-secondary modal-close">Close</button>
                        ${this.renderModalActions()}
                    </div>
                </div>
            </div>
        `;

        this.addModalEventListeners();
        document.body.appendChild(this.modalElement);
    }

    renderModalContent() {
        return `
            <div class="space-y-6">
                <div>
                    <h3 class="font-medium mb-2" style="color: var(--color-text);">Description</h3>
                    <p style="color: var(--color-muted);">${this.escapeHtml(this.currentTask.description)}</p>
                </div>
                
                ${this.currentTask.skills ? `
                <div>
                    <h3 class="font-medium mb-2" style="color: var(--color-text);">Required Skills</h3>
                    <div class="flex flex-wrap gap-2">
                        ${this.currentTask.skills.map(skill => `<span class="skill-tag">${this.escapeHtml(skill)}</span>`).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${this.currentTask.deliverables ? `
                <div>
                    <h3 class="font-medium mb-2" style="color: var(--color-text);">Deliverables</h3>
                    <ul class="list-disc list-inside space-y-1" style="color: var(--color-muted);">
                        ${this.currentTask.deliverables.map(deliverable => `<li>${this.escapeHtml(deliverable)}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${this.currentAssignment ? this.renderAssignmentDetails() : ''}
            </div>
        `;
    }

    renderAssignmentDetails() {
        return `
            <div class="border-t pt-6" style="border-color: var(--color-highlight-med);">
                <h3 class="font-medium mb-4" style="color: var(--color-text);">Assignment Details</h3>
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm"><strong>Assignee:</strong> ${this.escapeHtml(this.currentAssignment.memberDisplayName)}</p>
                        <p class="text-sm"><strong>Status:</strong> ${this.escapeHtml(this.currentAssignment.status)}</p>
                        <p class="text-sm"><strong>Progress:</strong> ${this.currentAssignment.progress}%</p>
                    </div>
                    <div>
                        <p class="text-sm"><strong>Assigned:</strong> ${new Date(this.currentAssignment.assignedDate).toLocaleDateString()}</p>
                        ${this.currentAssignment.startedDate ? `<p class="text-sm"><strong>Started:</strong> ${new Date(this.currentAssignment.startedDate).toLocaleDateString()}</p>` : ''}
                        ${this.currentAssignment.completedDate ? `<p class="text-sm"><strong>Completed:</strong> ${new Date(this.currentAssignment.completedDate).toLocaleDateString()}</p>` : ''}
                    </div>
                </div>
                ${this.currentAssignment.notes ? `
                <div class="mt-4">
                    <p class="text-sm"><strong>Notes:</strong></p>
                    <p class="text-sm mt-1" style="color: var(--color-muted);">${this.escapeHtml(this.currentAssignment.notes)}</p>
                </div>
                ` : ''}
            </div>
        `;
    }

    renderModalActions() {
        // Add specific actions based on task/assignment state
        return ''; // Can be extended for edit/delete functionality
    }

    addModalEventListeners() {
        // Close modal listeners
        this.modalElement.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.hide());
        });

        // Click outside to close
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.hide();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalElement) {
                this.hide();
            }
        });
    }

    showModal() {
        document.body.style.overflow = 'hidden';
        this.modalElement.style.display = 'flex';
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Make components globally available
window.TaskComponent = TaskComponent;
window.TaskModal = TaskModal;