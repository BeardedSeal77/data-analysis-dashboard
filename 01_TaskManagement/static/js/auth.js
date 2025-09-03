// GitHub OAuth Authentication with Member Management
class GitHubAuth {
    constructor() {
        this.clientId = CONFIG.GITHUB_CLIENT_ID;
        this.redirectUri = CONFIG.REDIRECT_URI;
        this.currentUser = null;
        this.accessToken = null;
        this.members = [];
        
        this.init();
    }

    async init() {
        // Load members data first
        await this.loadMembers();
        
        // Check if we're in development mode (local file system)
        if (this.isDevMode()) {
            console.log('🔧 Development mode detected - enabling dev auth');
            this.enableDevMode();
            return;
        }
        
        // Check if we're returning from OAuth
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            this.handleOAuthCallback(code);
        } else {
            // Check for existing session
            this.checkExistingSession();
        }
        
        this.setupEventListeners();
    }
    
    isDevMode() {
        // Check if we're running locally (file:// protocol or localhost)
        return window.location.protocol === 'file:' || 
               window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname === '';
    }
    
    enableDevMode() {
        // In dev mode, show a simple member selector instead of OAuth
        this.setupDevModeUI();
        this.setupEventListeners();
    }
    
    setupDevModeUI() {
        // Create dev mode controls that will be inserted into navbar
        this.devModeActive = true;
        
        // Notify navbar to enable dev mode UI
        setTimeout(() => {
            if (window.navbar && window.navbar.enableDevModeUI) {
                window.navbar.enableDevModeUI();
            }
        }, 100);
        
        // Auto-select first member for convenience in dev mode
        if (this.members && this.members.length > 0 && this.members[0].githubUsername) {
            setTimeout(() => {
                this.simulateLogin(this.members[0].githubUsername);
            }, 200);
        }
    }

    async loadMembers() {
        try {
            // Load members.json directly without authentication (for GitHub Pages)
            const response = await fetch('../data/members.json');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            this.members = await response.json();
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
        const scope = 'repo user:email';
        const state = this.generateState();
        
        // Store state for verification
        sessionStorage.setItem('github_oauth_state', state);
        
        const authUrl = `https://github.com/login/oauth/authorize?` +
            `client_id=${this.clientId}&` +
            `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
            `scope=${encodeURIComponent(scope)}&` +
            `state=${state}`;
        
        window.location.href = authUrl;
    }

    async handleOAuthCallback(code) {
        const state = new URLSearchParams(window.location.search).get('state');
        const storedState = sessionStorage.getItem('github_oauth_state');
        
        // Verify state parameter
        if (state !== storedState) {
            console.error('OAuth state mismatch');
            this.showError('Authentication failed: Invalid state parameter');
            return;
        }
        
        try {
            // For development/demo - simulate GitHub OAuth
            // In production, this would exchange code for real access token
            this.showNotification('Authenticating with GitHub...', 'info');
            
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // For demo purposes, use the first member with a GitHub username
            const memberWithGithub = this.members.find(m => m.githubUsername);
            
            if (memberWithGithub) {
                // Create mock GitHub user data
                const mockGithubUser = {
                    id: Math.floor(Math.random() * 1000000),
                    login: memberWithGithub.githubUsername,
                    name: memberWithGithub.name,
                    email: memberWithGithub.email || `${memberWithGithub.githubUsername}@example.com`,
                    avatar_url: `https://github.com/identicons/${memberWithGithub.githubUsername}.png`
                };
                
                // Create mock token
                const mockToken = 'mock_github_token_' + Date.now();
                
                // Store token and authenticate
                this.accessToken = mockToken;
                sessionStorage.setItem('github_access_token', mockToken);
                
                // Create combined user object
                this.currentUser = {
                    ...memberWithGithub,
                    githubId: mockGithubUser.id,
                    email: mockGithubUser.email,
                    avatar: mockGithubUser.avatar_url,
                    githubProfile: mockGithubUser
                };
                
                // Store user info
                sessionStorage.setItem('github_user', JSON.stringify(this.currentUser));
                
                // Update last login
                await this.updateMemberLastLogin();
                
                // Update UI
                this.updateUserInterface();
                
                // Notify other components
                this.notifyAuthChange();
                
                this.showNotification(`Welcome, ${this.currentUser.displayName}!`, 'success');
                
            } else {
                throw new Error('No GitHub users configured in members.json');
            }
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
        } catch (error) {
            console.error('OAuth callback error:', error);
            this.showError('Authentication failed: ' + error.message);
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
        const token = sessionStorage.getItem('github_access_token');
        const userInfo = sessionStorage.getItem('github_user');
        
        if (token && userInfo) {
            try {
                this.currentUser = JSON.parse(userInfo);
                this.accessToken = token;
                this.updateUserInterface();
                
                // Verify token is still valid (skip for mock tokens)
                if (!token.startsWith('mock_')) {
                    this.verifyToken(token);
                }
                
                // Notify other components
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
        sessionStorage.removeItem('github_access_token');
        sessionStorage.removeItem('github_user');
        sessionStorage.removeItem('github_oauth_state');
        
        // Reset current user
        this.currentUser = null;
        this.accessToken = null;
        
        // Update UI
        this.updateUserInterface();
        
        // Notify other components
        this.notifyAuthChange();
        
        this.showNotification('Logged out successfully', 'success');
        
        // Refresh page after short delay
        setTimeout(() => {
            window.location.reload();
        }, 1000);
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
    
    // Development helper - simulate login for testing
    simulateLogin(githubUsername) {
        const member = this.members.find(m => 
            m.githubUsername && 
            m.githubUsername.toLowerCase() === githubUsername.toLowerCase()
        );
        
        if (member) {
            const mockUser = {
                ...member,
                githubId: Math.floor(Math.random() * 1000000),
                email: member.email || `${githubUsername}@example.com`,
                avatar: `https://github.com/identicons/${githubUsername}.png`,
                githubProfile: {
                    login: githubUsername,
                    id: Math.floor(Math.random() * 1000000),
                    name: member.name
                }
            };
            
            const mockToken = 'mock_github_token_' + Date.now();
            this.accessToken = mockToken;
            this.currentUser = mockUser;
            
            // Store session data
            sessionStorage.setItem('github_access_token', mockToken);
            sessionStorage.setItem('github_user', JSON.stringify(mockUser));
            
            this.updateUserInterface();
            this.notifyAuthChange();
            this.showNotification(`Welcome, ${mockUser.displayName}!`, 'success');
            
            return true;
        }
        
        return false;
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