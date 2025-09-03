// Simple MongoDB Atlas Data Loading Utility  
// For now, we'll use a simple backend-less approach with localStorage fallback
class DataLoader {
    constructor() {
        this.cache = new Map();
        this.serverUrl = 'http://localhost:3000/api'; // We'll create a simple Node.js server
        this.useLocalServer = false; // Set to true when server is ready
    }

    async loadFromCollection(collection, useCache = true) {
        // Check memory cache first
        if (useCache && this.cache.has(collection)) {
            return this.cache.get(collection);
        }

        try {
            let data;
            
            if (this.useLocalServer) {
                // Use local Node.js server to connect to MongoDB
                const response = await fetch(`${this.serverUrl}/${collection}`);
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                data = await response.json();
            } else {
                // Try to load from original JSON files first, then localStorage
                data = await this.loadFromOriginalFiles(collection);
                if (!data || data.length === 0) {
                    data = this.loadFromLocalStorage(collection);
                }
            }
            
            // Cache the result
            if (useCache && data) {
                this.cache.set(collection, data);
                localStorage.setItem(`cache_${collection}`, JSON.stringify(data));
            }

            return data || [];
        } catch (error) {
            console.error(`Error loading ${collection}:`, error);
            return this.loadFromLocalStorage(collection);
        }
    }

    loadFromLocalStorage(collection) {
        const cached = localStorage.getItem(`cache_${collection}`);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (error) {
                console.error('Cache parse error:', error);
            }
        }
        
        // Seed initial data if nothing is cached
        return this.seedInitialData(collection);
    }

    seedInitialData(collection) {
        console.log(`Seeding initial data for ${collection} from original JSON files`);
        
        // Instead of hardcoded data, let's try to load from the original JSON files first
        const initialData = this.loadFromOriginalFiles(collection);
        if (initialData) {
            localStorage.setItem(`cache_${collection}`, JSON.stringify(initialData));
            return initialData;
        }
        
        // Fallback to minimal data if JSON files can't be loaded
        const fallbackData = {
            tasks: [],
            assignments: [],
            members: [
                {
                    id: 1,
                    name: "Erin Cullen",
                    displayName: "Erin Cullen", 
                    githubUsername: "BeardedSeal77",
                    role: "Project Lead",
                    memberColor: "blue",
                    isActive: true
                }
            ],
            milestones: []
        };

        const data = fallbackData[collection] || [];
        localStorage.setItem(`cache_${collection}`, JSON.stringify(data));
        return data;
    }

    async loadFromOriginalFiles(collection) {
        try {
            const fileMap = {
                'tasks': '../data/tasks.json',
                'assignments': '../data/task_assignments.json', 
                'members': '../data/members.json',
                'milestones': '../data/milestones.json'
            };

            const filename = fileMap[collection];
            if (!filename) return null;

            const response = await fetch(filename);
            if (!response.ok) return null;

            return await response.json();
        } catch (error) {
            console.warn(`Could not load original ${collection} file:`, error);
            return null;
        }
    }

    // Convenience methods for collections
    async loadTasks() {
        return this.loadFromCollection('tasks');
    }

    async loadAssignments() {
        return this.loadFromCollection('assignments');
    }

    async loadMembers() {
        return this.loadFromCollection('members');
    }

    async loadMilestones() {
        return this.loadFromCollection('milestones');
    }

    // Write methods for updating data
    async saveToCollection(collection, document) {
        try {
            if (this.useLocalServer) {
                const response = await fetch(`${this.serverUrl}/${collection}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(document)
                });
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                const result = await response.json();
                this.clearCache(collection);
                return result;
            } else {
                // Update localStorage
                const existingData = this.loadFromLocalStorage(collection);
                existingData.push(document);
                localStorage.setItem(`cache_${collection}`, JSON.stringify(existingData));
                this.cache.delete(collection);
                return document;
            }
        } catch (error) {
            console.error(`Error saving to ${collection}:`, error);
            throw error;
        }
    }

    async updateCollection(collection, documents) {
        try {
            if (this.useLocalServer) {
                const response = await fetch(`${this.serverUrl}/${collection}/replace`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(documents)
                });
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                const result = await response.json();
                this.clearCache(collection);
                return result;
            } else {
                // Update localStorage
                localStorage.setItem(`cache_${collection}`, JSON.stringify(documents));
                this.cache.delete(collection);
                return documents;
            }
        } catch (error) {
            console.error(`Error updating ${collection}:`, error);
            throw error;
        }
    }

    // Clear cache method
    clearCache(collection = null) {
        if (collection) {
            this.cache.delete(collection);
        } else {
            this.cache.clear();
        }
    }

    // Force refresh data
    async refreshData(collection) {
        this.clearCache(collection);
        return this.loadFromCollection(collection, false);
    }
}

// Create global instance
window.dataLoader = new DataLoader();