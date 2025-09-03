// Configuration for HDPSA Task Management System
const CONFIG = {
    // GitHub OAuth Configuration
    GITHUB_CLIENT_ID: 'Ov23liVYz4U4Ik2BhZvQ', // GitHub App Client ID
    REDIRECT_URI: 'https://beardedseal77.github.io/data-analysis-dashboard/01_TaskManagement/pages/dashboard.html', // GitHub Pages URL
    
    // Repository Configuration
    GITHUB_OWNER: 'BeardedSeal77', // GitHub username
    GITHUB_REPO: 'data-analysis-dashboard', // Repository name
    TASK_BRANCH: 'taskAssignment', // Branch for live task data
    
    // API Configuration
    API_BASE_URL: 'https://api.github.com',
    
    // UI Configuration
    REFRESH_INTERVAL: 30000, // 30 seconds
    NOTIFICATION_TIMEOUT: 5000, // 5 seconds
    
    // Task Configuration
    COMPLEXITY_LEVELS: {
        low: { hours: [1, 4], color: '#10B981' },
        medium: { hours: [4, 8], color: '#F59E0B' },
        high: { hours: [8, 40], color: '#EF4444' }
    },
    
    CATEGORIES: [
        'Data Preparation',
        'Analysis', 
        'Modeling',
        'Visualization',
        'Documentation',
        'Testing'
    ],
    
    SKILLS: [
        'R',
        'Python',
        'Power BI',
        'Shiny',
        'Machine Learning',
        'Statistics',
        'Data Cleaning',
        'Data Visualization',
        'ggplot2',
        'dplyr',
        'tidyverse',
        'CRISP-DM'
    ],
    
    // Status Configuration
    TASK_STATUSES: {
        available: { label: 'Available', color: '#6B7280' },
        assigned: { label: 'Assigned', color: '#3B82F6' },
        'in-progress': { label: 'In Progress', color: '#F59E0B' },
        review: { label: 'In Review', color: '#8B5CF6' },
        completed: { label: 'Completed', color: '#10B981' },
        blocked: { label: 'Blocked', color: '#EF4444' }
    },
    
    // GitHub Pages Configuration
    GITHUB_PAGES_URL: 'https://beardedseal77.github.io/data-analysis-dashboard/01_TaskManagement/', // GitHub Pages URL
    
    // Development Configuration
    DEV_MODE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    // Feature Flags
    FEATURES: {
        AUTO_REFRESH: true,
        TASK_COMMENTS: true,
        TIME_TRACKING: true,
        SKILL_MATCHING: true,
        WORKLOAD_BALANCING: true,
        EMAIL_NOTIFICATIONS: false // Requires backend service
    }
};

// Environment-specific overrides
if (CONFIG.DEV_MODE) {
    CONFIG.REDIRECT_URI = window.location.origin + '/01_TaskManagement/pages/dashboard.html';
    CONFIG.REFRESH_INTERVAL = 10000; // 10 seconds for development
} else {
    // Production mode - use hardcoded GitHub Pages URL
    CONFIG.REDIRECT_URI = 'https://beardedseal77.github.io/data-analysis-dashboard/01_TaskManagement/pages/dashboard.html';
}

// Validate required configuration
const requiredConfig = ['GITHUB_CLIENT_ID', 'GITHUB_OWNER', 'GITHUB_REPO'];
const missingConfig = requiredConfig.filter(key => 
    !CONFIG[key] || CONFIG[key].startsWith('YOUR_')
);

if (missingConfig.length > 0) {
    console.warn('⚠️ Missing required configuration:', missingConfig);
    console.warn('Please update config.js with your GitHub App details');
    
    // Show configuration warning in UI
    document.addEventListener('DOMContentLoaded', function() {
        const warning = document.createElement('div');
        warning.className = 'config-warning';
        warning.innerHTML = `
            <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-yellow-800">Configuration Required</h3>
                        <div class="mt-2 text-sm text-yellow-700">
                            <p>Please update the following in <code>config.js</code>:</p>
                            <ul class="list-disc list-inside mt-1">
                                ${missingConfig.map(key => `<li>${key}</li>`).join('')}
                            </ul>
                            <p class="mt-2">
                                <a href="https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app" 
                                   target="_blank" class="underline">
                                   Create a GitHub OAuth App
                                </a> to get started.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const main = document.querySelector('.main-content');
        if (main) {
            main.insertBefore(warning, main.firstChild);
        }
    });
}

// Make CONFIG globally available
window.CONFIG = CONFIG;