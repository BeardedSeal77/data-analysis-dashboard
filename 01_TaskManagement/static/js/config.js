// Configuration for HDPSA Task Management System
const CONFIG = {
    // MongoDB Atlas Configuration
    MONGODB_CONNECTION_STRING: 'mongodb+srv://hdpsa-admin:IPlaySmashWithABlanketOnMyLap@hdpsa-task-management.pazpdmo.mongodb.net/hdpsa_tasks',
    MONGODB_DATABASE: 'hdpsa_tasks',
    MONGODB_API_KEY: 'YOUR_DATA_API_KEY', // We'll set this up if needed
    
    // Legacy GitHub OAuth Configuration (for compatibility)
    GITHUB_CLIENT_ID: 'not-needed-for-local',
    REDIRECT_URI: window.location.origin + '/01_TaskManagement/dashboard.html',
    
    // Collections
    COLLECTIONS: {
        TASKS: 'tasks',
        ASSIGNMENTS: 'assignments', 
        MEMBERS: 'members',
        MILESTONES: 'milestones'
    },
    
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
    GITHUB_PAGES_URL: 'https://YOUR_USERNAME.github.io/data-analysis-dashboard/01_TaskManagement/public/', // Replace with your GitHub Pages URL
    
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
    CONFIG.REDIRECT_URI = window.location.origin + '/01_TaskManagement/public/';
    CONFIG.REFRESH_INTERVAL = 10000; // 10 seconds for development
}

// Configuration is now localStorage-based, no GitHub setup required
console.log('✅ HDPSA Task Management System loaded - using localStorage with MongoDB Atlas integration ready');

// Make CONFIG globally available
window.CONFIG = CONFIG;