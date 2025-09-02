// Milestone Component for HDPSA Task Management
class MilestoneComponent {
    constructor(milestoneId, containerId) {
        this.milestoneId = milestoneId;
        this.containerId = containerId;
        this.milestoneData = null;
        this.taskboard = null;
        this.stats = {
            total: 0,
            assigned: 0,
            inProgress: 0,
            completed: 0
        };
    }

    async init() {
        // Wait for dataLoader to be available
        while (!window.dataLoader) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Wait for auth to be ready in development mode
        while (!window.githubAuth) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        await this.loadMilestoneData();
        if (this.milestoneData) {
            this.render();
            // Use setTimeout to ensure DOM is ready before initializing taskboard
            setTimeout(() => {
                this.initializeTaskboard();
            }, 200);
            this.setupStatsUpdates();
        } else {
            this.renderError();
        }
    }

    async loadMilestoneData() {
        try {
            const milestones = await window.dataLoader.loadMilestones();
            this.milestoneData = milestones.find(m => m.id === this.milestoneId);
        } catch (error) {
            console.error('Error loading milestone data:', error);
        }
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container ${this.containerId} not found`);
            return;
        }

        container.innerHTML = `
            ${this.renderHeader()}
            ${this.renderProgressOverview()}
            ${this.renderAboutSection()}
            ${this.renderTaskboard()}
        `;
    }

    renderHeader() {
        const colorMap = {
            blue: 'bg-blue-600',
            purple: 'bg-purple-600',
            orange: 'bg-orange-600',
            green: 'bg-green-600',
            red: 'bg-red-600',
            indigo: 'bg-indigo-600'
        };

        const bgColor = colorMap[this.milestoneData.color] || 'bg-blue-600';

        return `
            <div class="mb-8">
                <div class="flex items-center space-x-4 mb-4">
                    <div class="flex-shrink-0">
                        <div class="w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold text-lg">M${this.milestoneData.id}</span>
                        </div>
                    </div>
                    <div>
                        <h1 class="text-3xl font-bold" style="color: var(--color-text);">
                            Milestone ${this.milestoneData.id}: ${this.escapeHtml(this.milestoneData.name)}
                        </h1>
                        <p class="mt-1" style="color: var(--color-muted);">
                            ${this.escapeHtml(this.milestoneData.subtitle)}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    renderProgressOverview() {
        return `
            <div style="background-color: var(--color-surface); border: 1px solid var(--color-highlight-med);" class="rounded-lg shadow-sm p-6 mb-8">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-semibold" style="color: var(--color-text);">Progress Overview</h2>
                    <span id="milestoneProgress" class="text-2xl font-bold" style="color: var(--color-primary);">0%</span>
                </div>
                <div class="w-full rounded-full h-3" style="background-color: var(--color-overlay);">
                    <div id="progressBar" class="h-3 rounded-full transition-all duration-300" 
                         style="width: 0%; background-color: var(--color-primary);"></div>
                </div>
                <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold" style="color: var(--color-muted);" id="totalTasks">0</div>
                        <div class="text-sm" style="color: var(--color-subtle);">Total Tasks</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold" style="color: var(--color-primary);" id="assignedTasks">0</div>
                        <div class="text-sm" style="color: var(--color-subtle);">Assigned</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold" style="color: var(--color-warning);" id="inProgressTasks">0</div>
                        <div class="text-sm" style="color: var(--color-subtle);">In Progress</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold" style="color: var(--color-success);" id="completedTasks">0</div>
                        <div class="text-sm" style="color: var(--color-subtle);">Completed</div>
                    </div>
                </div>
                
                ${this.renderDeliverables()}
            </div>
        `;
    }

    renderDeliverables() {
        if (!this.milestoneData.deliverables || this.milestoneData.deliverables.length === 0) {
            return '';
        }

        return `
            <div class="mt-6 pt-4" style="border-top: 1px solid var(--color-highlight-med);">
                <h3 class="text-sm font-medium mb-3" style="color: var(--color-text);">
                    <i class="fas fa-clipboard-list mr-2"></i>Key Deliverables
                </h3>
                <div class="grid md:grid-cols-2 gap-2">
                    ${this.milestoneData.deliverables.map(deliverable => `
                        <div class="flex items-center text-sm" style="color: var(--color-muted);">
                            <i class="fas fa-check-circle mr-2" style="color: var(--color-success);"></i>
                            ${this.escapeHtml(deliverable)}
                        </div>
                    `).join('')}
                </div>
                <div class="mt-3 text-sm" style="color: var(--color-subtle);">
                    <i class="fas fa-clock mr-1"></i>
                    Estimated Duration: ${this.milestoneData.estimatedDuration}
                </div>
            </div>
        `;
    }

    renderAboutSection() {
        const colorMap = {
            blue: 'var(--color-primary)',
            purple: 'var(--color-secondary)',
            orange: 'var(--color-warning)',
            green: 'var(--color-success)',
            red: 'var(--color-danger)',
            indigo: 'var(--color-accent)',
            cyan: 'var(--color-accent)',
            yellow: 'var(--color-warning)',
            gray: 'var(--color-muted)'
        };

        return `
            <div style="background-color: var(--color-surface); border: 1px solid var(--color-highlight-med);" class="rounded-lg shadow-sm p-6 mb-8">
                <h2 class="text-lg font-semibold mb-4" style="color: var(--color-text);">About This Milestone</h2>
                
                <p class="mb-6" style="color: var(--color-muted);">
                    ${this.escapeHtml(this.milestoneData.about.description)}
                </p>
                
                <div class="grid md:grid-cols-${this.milestoneData.about.sections.length} gap-6">
                    ${this.milestoneData.about.sections.map(section => `
                        <div>
                            <h3 class="font-medium mb-2" style="color: var(--color-text);">
                                <i class="${section.icon} mr-2" style="color: ${colorMap[section.color] || 'var(--color-primary)'};"></i>
                                ${this.escapeHtml(section.title)}
                            </h3>
                            <ul class="text-sm space-y-1" style="color: var(--color-muted);">
                                ${section.items.map(item => `
                                    <li class="flex items-start">
                                        <span class="mr-2">•</span>
                                        <span>${this.escapeHtml(item)}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderTaskboard() {
        return `<div id="taskboard"></div>`;
    }

    renderError() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = `
                <div style="background-color: var(--color-surface); border: 1px solid var(--color-danger);" class="rounded-lg p-6 text-center">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4" style="color: var(--color-danger);"></i>
                    <h2 class="text-xl font-semibold mb-2" style="color: var(--color-text);">Milestone Not Found</h2>
                    <p style="color: var(--color-muted);">
                        Could not load data for milestone ${this.milestoneId}. Please check the milestone configuration.
                    </p>
                </div>
            `;
        }
    }

    initializeTaskboard() {
        console.log('Initializing taskboard. TaskBoard available:', !!window.TaskBoard);
        if (window.TaskBoard) {
            console.log('Creating TaskBoard for milestone:', this.milestoneId);
            this.taskboard = new TaskBoard('taskboard', this.milestoneId);
        } else {
            console.error('TaskBoard not available on window object');
        }
    }

    setupStatsUpdates() {
        this.updateMilestoneStats();
        setInterval(() => this.updateMilestoneStats(), 10000); // Update every 10 seconds
        
        // Listen for auth changes to update taskboard
        window.addEventListener('authStateChanged', (event) => {
            if (this.taskboard) {
                this.taskboard.setCurrentUser(event.detail.user);
            }
        });
    }

    async updateMilestoneStats() {
        try {
            const tasks = await this.loadTasks();
            const assignments = await this.loadAssignments();
            
            const milestoneTasks = tasks.filter(task => task.milestoneId === this.milestoneId);
            const milestoneAssignments = assignments.filter(assignment => {
                return milestoneTasks.some(task => task.id === assignment.taskId) && 
                       assignment.status !== 'reassigned';
            });
            
            this.stats.total = milestoneTasks.length;
            this.stats.assigned = milestoneAssignments.filter(a => a.status === 'assigned').length;
            this.stats.inProgress = milestoneAssignments.filter(a => a.status === 'in-progress').length;
            this.stats.completed = milestoneAssignments.filter(a => a.status === 'completed').length;
            
            this.updateStatsUI();
        } catch (error) {
            console.error('Error updating milestone stats:', error);
        }
    }

    updateStatsUI() {
        const elements = {
            totalTasks: document.getElementById('totalTasks'),
            assignedTasks: document.getElementById('assignedTasks'),
            inProgressTasks: document.getElementById('inProgressTasks'),
            completedTasks: document.getElementById('completedTasks'),
            milestoneProgress: document.getElementById('milestoneProgress'),
            progressBar: document.getElementById('progressBar')
        };
        
        if (elements.totalTasks) elements.totalTasks.textContent = this.stats.total;
        if (elements.assignedTasks) elements.assignedTasks.textContent = this.stats.assigned;
        if (elements.inProgressTasks) elements.inProgressTasks.textContent = this.stats.inProgress;
        if (elements.completedTasks) elements.completedTasks.textContent = this.stats.completed;
        
        // Update progress
        const progressPercentage = this.stats.total > 0 ? 
            Math.round((this.stats.completed / this.stats.total) * 100) : 0;
        
        if (elements.milestoneProgress) elements.milestoneProgress.textContent = progressPercentage + '%';
        if (elements.progressBar) elements.progressBar.style.width = progressPercentage + '%';
    }

    async loadTasks() {
        return window.dataLoader.loadTasks();
    }

    async loadAssignments() {
        return window.dataLoader.loadAssignments();
    }

    isDevMode() {
        // Check if we're running locally (file:// protocol or localhost)
        return window.location.protocol === 'file:' || 
               window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname === '';
    }

    escapeHtml(text) {
        if (typeof text !== 'string') return text;
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Static method for easy initialization
    static async create(milestoneId, containerId) {
        const milestone = new MilestoneComponent(milestoneId, containerId);
        await milestone.init();
        return milestone;
    }
}

// Make component globally available
window.MilestoneComponent = MilestoneComponent;