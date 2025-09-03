// GitHub OAuth Authentication with Member Management
class GitHubAuth {
    constructor() {
        this.clientId = CONFIG.GITHUB_CLIENT_ID || 'not-needed';
        this.redirectUri = CONFIG.REDIRECT_URI || window.location.origin;
        this.currentUser = null;
        this.accessToken = null;
        this.members = [];
        
        this.init();
    }

    async init() {
        // Load members data first
        await this.loadMembers();
        
        // Check for existing session
        this.checkExistingSession();
        
        this.setupEventListeners();
    }

    async loadMembers() {
        try {
            this.members = await window.dataLoader.loadMembers();
        } catch (error) {
            console.error('Error loading members:', error);
            this.members = [];
        }
    }

    setupEventListeners() {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.login();
            });
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    login() {
        // For local development, show member selection directly
        this.showMemberSelection();
    }

    showMemberSelection() {
        // Create modal for member selection
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <h3 class="text-lg font-semibold mb-4 text-gray-800">Select Your Profile</h3>
                <p class="text-sm text-gray-600 mb-4">Choose your profile to start working on tasks:</p>
                <div class="space-y-2">
                    ${this.members.map(member => `
                        <button onclick="githubAuth.selectMember('${member.githubUsername}')" 
                                class="w-full text-left p-3 rounded border hover:bg-gray-50 flex items-center transition">
                            <div class="w-8 h-8 rounded-full mr-3" style="background-color: var(--color-${member.memberColor})"></div>
                            <div>
                                <div class="font-medium">${member.displayName}</div>
                                <div class="text-sm text-gray-500">${member.role}</div>
                            </div>
                        </button>
                    `).join('')}
                </div>
                <button onclick="githubAuth.closeModal()" 
                        class="mt-4 w-full py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition">Cancel</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    closeModal() {
        const modal = document.querySelector('.fixed.inset-0');
        if (modal) {
            modal.remove();
        }
    }


    selectMember(githubUsername) {
        this.closeModal();
        
        const member = this.members.find(m => m.githubUsername === githubUsername);
        if (member) {
            this.currentUser = {
                ...member,
                githubId: member.id,
                avatar: `https://github.com/identicons/${githubUsername}.png`,
                githubProfile: { login: githubUsername }
            };
            
            // Store in localStorage for persistence across browser sessions
            localStorage.setItem('selected_user', JSON.stringify(this.currentUser));
            
            this.updateUserInterface();
            this.notifyAuthChange();
            this.showNotification(`Logged in as ${this.currentUser.displayName}!`, 'success');
        }
    }


    async fetchUserInfo(token) {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch user info');
            }
            
            this.currentUser = await response.json();
            
            // Store user info
            sessionStorage.setItem('github_user', JSON.stringify(this.currentUser));
            
            // Update UI
            this.updateUserInterface();
            
            // Notify task manager
            if (window.taskManager) {
                window.taskManager.setCurrentUser(this.currentUser);
            }
            
        } catch (error) {
            console.error('Error fetching user info:', error);
            this.showError('Failed to get user information');
        }
    }

    checkExistingSession() {
        const userInfo = localStorage.getItem('selected_user');
        
        if (userInfo) {
            try {
                this.currentUser = JSON.parse(userInfo);
                this.updateUserInterface();
                this.notifyAuthChange();
                
            } catch (error) {
                console.error('Error restoring session:', error);
                this.logout();
            }
        }
    }

    async verifyToken(token) {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                // Token is invalid, logout
                this.logout();
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            this.logout();
        }
    }

    updateUserInterface() {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInfo = document.getElementById('userInfo');
        
        if (this.currentUser) {
            // Hide login button, show logout
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            
            // Show user info
            if (userInfo) {
                userInfo.style.display = 'flex';
                userInfo.innerHTML = `
                    <img src="${this.currentUser.avatar || 'https://github.com/identicons/default.png'}" 
                         alt="${this.currentUser.displayName}" 
                         class="w-8 h-8 rounded-full mr-2">
                    <div>
                        <div class="text-sm font-medium" style="color: var(--color-text);">${this.currentUser.displayName}</div>
                        <div class="text-xs" style="color: var(--color-muted);">${this.currentUser.role}</div>
                    </div>
                `;
            }
        } else {
            // Show login button, hide logout
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            
            // Hide user info
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    logout() {
        // Clear stored data
        localStorage.removeItem('selected_user');
        
        // Reset current user
        this.currentUser = null;
        this.accessToken = null;
        
        // Update UI
        this.updateUserInterface();
        
        // Notify other components
        this.notifyAuthChange();
        
        this.showNotification('Logged out successfully', 'success');
    }

    generateState() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    showError(message) {
        console.error(message);
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type = 'info') {
        // Create notification
        const notification = document.createElement('div');
        notification.className = `toast toast-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Auto-remove after timeout
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, CONFIG.NOTIFICATION_TIMEOUT || 5000);
    }
    
    async updateMemberLastLogin() {
        if (!this.currentUser) return;
        
        try {
            // Update member's last login time
            const memberIndex = this.members.findIndex(m => m.id === this.currentUser.id);
            if (memberIndex >= 0) {
                this.members[memberIndex].lastLogin = new Date().toISOString();
                console.log('Updated last login for:', this.currentUser.name);
            }
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }
    
    notifyAuthChange() {
        // Notify other components about auth state change
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: {
                user: this.currentUser,
                isAuthenticated: !!this.currentUser
            }
        }));
        
        // Notify task manager
        if (window.taskManager) {
            window.taskManager.setCurrentUser(this.currentUser);
        }
    }
    
    // Public methods
    getMemberByGithubUsername(username) {
        return this.members.find(m => 
            m.githubUsername && 
            m.githubUsername.toLowerCase() === username.toLowerCase()
        );
    }
    
    getAllMembers() {
        return this.members;
    }

    getAccessToken() {
        return sessionStorage.getItem('github_access_token');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser && !!this.getAccessToken();
    }
}

// Initialize authentication
let githubAuth;
document.addEventListener('DOMContentLoaded', function() {
    githubAuth = new GitHubAuth();
    
    // Make it globally available
    window.githubAuth = githubAuth;
});