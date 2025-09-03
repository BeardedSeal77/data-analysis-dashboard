// Navigation Bar Component for HDPSA Task Management
class NavBar {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.milestones = [
            { id: 1, name: 'Business & Data Understanding', path: 'milestone1.html' },
            { id: 2, name: 'Data Preparation', path: 'milestone2.html' },
            { id: 3, name: 'Modeling', path: 'milestone3.html' },
            { id: 4, name: 'Evaluation', path: 'milestone4.html' },
            { id: 5, name: 'Deployment', path: 'milestone5.html' },
            { id: 6, name: 'Final Report', path: 'milestone6.html' }
        ];
        
        this.init();
    }

    async init() {
        this.render();
        this.setupEventListeners();
        this.setupAuthListeners();
        await this.setupProfileDropdown();
    }
    
    async setupProfileDropdown() {
        try {
            // Load members data
            const members = await window.dataLoader.loadMembers();
            const profileSelect = document.getElementById('profileSelect');
            
            // Populate dropdown
            members.forEach(member => {
                const option = document.createElement('option');
                option.value = member.id;
                option.textContent = `${member.displayName} (${member.role})`;
                profileSelect.appendChild(option);
            });
            
            // Check for saved profile
            const savedProfile = localStorage.getItem('selected_user');
            if (savedProfile) {
                const user = JSON.parse(savedProfile);
                profileSelect.value = user.id;
                this.showSelectedUser(user);
            }
            
            // Handle profile selection
            profileSelect.addEventListener('change', (e) => {
                const selectedId = parseInt(e.target.value);
                if (selectedId) {
                    const selectedMember = members.find(m => m.id === selectedId);
                    if (selectedMember) {
                        const user = {
                            ...selectedMember,
                            avatar: `https://github.com/identicons/${selectedMember.githubUsername}.png`
                        };
                        localStorage.setItem('selected_user', JSON.stringify(user));
                        this.showSelectedUser(user);
                        
                        // Notify other components
                        window.dispatchEvent(new CustomEvent('profileSelected', {
                            detail: { user }
                        }));
                    }
                } else {
                    localStorage.removeItem('selected_user');
                    this.hideSelectedUser();
                }
            });
            
            // Handle logout button (use event delegation since button is created dynamically)
            document.addEventListener('click', (e) => {
                if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
                    this.logout();
                }
            });
            
        } catch (error) {
            console.error('Error setting up profile dropdown:', error);
        }
    }

    showSelectedUser(user) {
        const dropdown = document.getElementById('profileSelect');
        const userInfo = document.getElementById('selectedUserInfo');
        const avatar = document.getElementById('selectedUserAvatar');
        const name = document.getElementById('selectedUserName');
        const role = document.getElementById('selectedUserRole');
        
        dropdown.style.display = 'none';
        userInfo.style.display = 'flex';
        
        avatar.style.backgroundColor = `var(--color-${user.memberColor})`;
        name.textContent = user.displayName;
        role.textContent = user.role;
    }

    hideSelectedUser() {
        const dropdown = document.getElementById('profileSelect');
        const userInfo = document.getElementById('selectedUserInfo');
        
        dropdown.style.display = 'block';
        userInfo.style.display = 'none';
        dropdown.value = '';
    }
    
    logout() {
        // Clear stored user data
        localStorage.removeItem('selected_user');
        
        // Reset UI
        this.hideSelectedUser();
        
        // Notify other components that user logged out
        window.dispatchEvent(new CustomEvent('profileSelected', {
            detail: { user: null }
        }));
        
        // Optional: show notification
        if (window.githubAuth && window.githubAuth.showNotification) {
            window.githubAuth.showNotification('Logged out successfully', 'success');
        }
    }

    setupAuthListeners() {
        // Listen for auth state changes (kept for compatibility)
        window.addEventListener('authStateChanged', (event) => {
            this.updateAuthUI(event.detail.user, event.detail.isAuthenticated);
        });
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        if (filename === 'dashboard.html' || filename === '' || filename === 'index.html') {
            return 'dashboard';
        } else if (filename.startsWith('milestone')) {
            const milestoneNum = filename.match(/milestone(\d+)\.html/);
            return milestoneNum ? `milestone${milestoneNum[1]}` : 'dashboard';
        }
        return 'dashboard';
    }

    render() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        navbar.innerHTML = `
            <nav style="background-color: var(--color-surface); box-shadow: var(--shadow-sm); border-bottom: 1px solid var(--color-highlight-med);">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center py-4">
                        <!-- Left side - Brand and Navigation -->
                        <div class="flex items-center space-x-8">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-chart-line" style="color: var(--color-primary); font-size: 1.5rem;"></i>
                                <h1 class="text-xl font-bold" style="color: var(--color-text);">HDPSA Project</h1>
                            </div>
                            
                            <!-- Navigation Links -->
                            <div class="flex flex-wrap items-center gap-2">
                                <a href="dashboard.html" class="nav-link flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${this.currentPage === 'dashboard' ? 'nav-active' : ''}"
                                   style="${this.currentPage === 'dashboard' ? 
                                       'background-color: var(--color-primary); color: var(--color-base);' : 
                                       'color: var(--color-text);'}"
                                   ${this.currentPage !== 'dashboard' ? `onmouseover="this.style.backgroundColor='var(--color-overlay)'" onmouseout="this.style.backgroundColor='transparent'"` : ''}>
                                    <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
                                </a>
                                
                                <!-- Milestone Links -->
                                ${this.milestones.map(milestone => `
                                    <a href="${milestone.path}" class="nav-link flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${this.currentPage === `milestone${milestone.id}` ? 'nav-active' : ''}"
                                       style="${this.currentPage === `milestone${milestone.id}` ? 
                                           'background-color: var(--color-primary); color: var(--color-base);' : 
                                           'color: var(--color-text);'}"
                                       ${this.currentPage !== `milestone${milestone.id}` ? `onmouseover="this.style.backgroundColor='var(--color-overlay)'" onmouseout="this.style.backgroundColor='transparent'"` : ''}>
                                        <span class="milestone-status text-xs mr-2" data-milestone="${milestone.id}">
                                            <i class="fas fa-circle" style="color: var(--color-muted);"></i>
                                        </span>
                                        <span class="hidden sm:inline">Milestone ${milestone.id}</span>
                                        <span class="sm:hidden">M${milestone.id}</span>
                                    </a>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Right side - User Authentication -->
                        <div id="navUser" class="flex items-center space-x-4">
                            <div class="flex items-center space-x-3">
                                <select id="profileSelect" class="px-3 py-2 rounded-md text-sm font-medium" 
                                        style="background-color: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-highlight-med);">
                                    <option value="">Select Your Profile</option>
                                </select>
                                
                                <div id="selectedUserInfo" class="hidden flex items-center space-x-2">
                                    <div class="w-8 h-8 rounded-full" id="selectedUserAvatar"></div>
                                    <div>
                                        <div class="text-sm font-medium" id="selectedUserName" style="color: var(--color-text);"></div>
                                        <div class="text-xs" id="selectedUserRole" style="color: var(--color-muted);"></div>
                                    </div>
                                    <button id="logoutBtn" class="ml-3 px-2 py-1 text-xs rounded" 
                                            style="background-color: var(--color-overlay); color: var(--color-text);" 
                                            title="Logout">
                                        <i class="fas fa-sign-out-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        `;

        this.updateMilestoneStatuses();
    }

    setupEventListeners() {
        // No mobile dropdown needed - all links are visible in horizontal layout
        
        // Set up auth button listeners
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const memberSelect = document.getElementById('memberSelect');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (window.githubAuth) {
                    window.githubAuth.login();
                } else {
                    // Development mode - simulate login
                    this.simulateLogin();
                }
            });
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (window.githubAuth) {
                    window.githubAuth.logout();
                }
            });
        }
        
        if (memberSelect) {
            memberSelect.addEventListener('change', (e) => {
                const githubUsername = e.target.value;
                if (githubUsername && window.githubAuth) {
                    window.githubAuth.simulateLogin(githubUsername);
                }
            });
        }
        
        // Check if we should enable dev mode UI
        this.checkDevMode();
    }
    
    checkDevMode() {
        // Check if we're in dev mode and have auth system
        if (window.githubAuth && window.githubAuth.devModeActive) {
            this.enableDevModeUI();
        }
    }
    
    enableDevModeUI() {
        const devSelector = document.getElementById('devMemberSelector');
        const loginBtn = document.getElementById('loginBtn');
        const memberSelect = document.getElementById('memberSelect');
        
        if (devSelector && loginBtn && memberSelect) {
            // Hide login button, show member selector
            loginBtn.style.display = 'none';
            devSelector.style.display = 'flex';
            
            // Populate member selector
            if (window.githubAuth && window.githubAuth.getAllMembers) {
                const members = window.githubAuth.getAllMembers();
                memberSelect.innerHTML = '<option value="">Select Member</option>';
                
                members.forEach(member => {
                    if (member.githubUsername) {
                        const option = document.createElement('option');
                        option.value = member.githubUsername;
                        option.textContent = `${member.displayName} (@${member.githubUsername})`;
                        memberSelect.appendChild(option);
                    }
                });
                
                // Auto-select first member
                if (members.length > 0 && members[0].githubUsername) {
                    memberSelect.value = members[0].githubUsername;
                }
            }
        }
    }
    
    // Development helper
    simulateLogin() {
        if (window.githubAuth) {
            const success = window.githubAuth.simulateLogin('BeardedSeal77');
            if (!success) {
                alert('Simulation failed - check MongoDB Atlas members collection');
            }
        }
    }
    
    updateAuthUI(user, isAuthenticated) {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInfo = document.getElementById('userInfo');
        
        if (isAuthenticated && user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            
            if (userInfo) {
                userInfo.style.display = 'flex';
                userInfo.innerHTML = `
                    <img src="${user.avatar || 'https://github.com/identicons/default.png'}" 
                         alt="${user.displayName}" 
                         class="w-8 h-8 rounded-full">
                    <div>
                        <div class="text-sm font-medium" style="color: var(--color-text);">${user.displayName}</div>
                        <div class="text-xs" style="color: var(--color-muted);">${user.role}</div>
                    </div>
                `;
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'inline-flex';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    async updateMilestoneStatuses() {
        try {
            // Load task data to calculate milestone completion
            const tasks = await this.loadTasks();
            const assignments = await this.loadAssignments();
            
            this.milestones.forEach(milestone => {
                const milestoneStatusElement = document.querySelector(`[data-milestone="${milestone.id}"]`);
                if (milestoneStatusElement) {
                    const status = this.calculateMilestoneStatus(milestone.id, tasks, assignments);
                    this.updateMilestoneStatusDisplay(milestoneStatusElement, status);
                }
            });
        } catch (error) {
            console.error('Error updating milestone statuses:', error);
        }
    }

    async loadTasks() {
        return window.dataLoader.loadTasks();
    }

    async loadAssignments() {
        return window.dataLoader.loadAssignments();
    }

    calculateMilestoneStatus(milestoneId, tasks, assignments) {
        // Filter tasks for this milestone
        const milestoneTasks = tasks.filter(task => task.milestoneId === milestoneId);
        
        if (milestoneTasks.length === 0) {
            return { status: 'not-started', progress: 0 };
        }

        let completedTasks = 0;
        let inProgressTasks = 0;
        
        milestoneTasks.forEach(task => {
            const assignment = assignments.find(a => 
                a.taskId === task.id && a.status !== 'reassigned'
            );
            
            if (assignment) {
                if (assignment.status === 'completed') {
                    completedTasks++;
                } else if (assignment.status === 'in-progress') {
                    inProgressTasks++;
                }
            }
        });

        const progress = Math.round((completedTasks / milestoneTasks.length) * 100);
        
        if (completedTasks === milestoneTasks.length) {
            return { status: 'completed', progress: 100 };
        } else if (inProgressTasks > 0 || completedTasks > 0) {
            return { status: 'in-progress', progress };
        } else {
            return { status: 'not-started', progress: 0 };
        }
    }

    updateMilestoneStatusDisplay(element, status) {
        const { status: statusType, progress } = status;
        
        // Clear previous content
        element.innerHTML = '';
        
        switch (statusType) {
            case 'completed':
                element.innerHTML = '<i class="fas fa-check-circle" style="color: var(--color-success);"></i>';
                element.title = 'Completed';
                break;
            case 'in-progress':
                element.innerHTML = `<span style="color: var(--color-primary);">${progress}%</span>`;
                element.title = `${progress}% Complete`;
                break;
            default:
                element.innerHTML = '<i class="fas fa-circle" style="color: var(--color-muted);"></i>';
                element.title = 'Not Started';
        }
    }

    // Method to refresh milestone statuses (called from other components)
    refresh() {
        this.updateMilestoneStatuses();
    }
}

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.navbar = new NavBar();
});