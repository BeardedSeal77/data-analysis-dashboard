// Centralized Data Loading Utility
class DataLoader {
    constructor() {
        this.cache = new Map();
        this.isDevMode = this.detectDevMode();
    }

    detectDevMode() {
        // Check if we're running locally (file:// protocol or localhost)
        return window.location.protocol === 'file:' || 
               window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname === '';
    }

    async loadData(filename, useCache = true) {
        // Check cache first
        if (useCache && this.cache.has(filename)) {
            return this.cache.get(filename);
        }

        try {
            let data;
            
            const storedPAT = sessionStorage.getItem('github_pat');
            if (this.isDevMode || !storedPAT) {
                // Development mode - use local fetch
                const response = await fetch(`../data/${filename}`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                data = await response.json();
            } else {
                // Production mode - use GitHub API
                const content = await window.GitHubAPI.getFile(filename);
                data = JSON.parse(content);
            }

            // Cache the result
            if (useCache) {
                this.cache.set(filename, data);
            }

            return data;
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            return [];
        }
    }

    // Convenience methods for common data files
    async loadTasks() {
        return this.loadData('tasks.json');
    }

    async loadAssignments() {
        return this.loadData('task_assignments.json');
    }

    async loadMembers() {
        return this.loadData('members.json');
    }

    async loadMilestones() {
        return this.loadData('milestones.json');
    }

    // Clear cache method for when data needs to be refreshed
    clearCache(filename = null) {
        if (filename) {
            this.cache.delete(filename);
        } else {
            this.cache.clear();
        }
    }

    // Force refresh data
    async refreshData(filename) {
        this.clearCache(filename);
        return this.loadData(filename, false);
    }
}

// Create global instance
window.dataLoader = new DataLoader();