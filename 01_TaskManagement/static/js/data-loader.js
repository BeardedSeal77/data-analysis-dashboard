// MongoDB Atlas Backend API Integration
class DataLoader {
    constructor() {
        this.cache = new Map();
        // Backend API URL - connects directly to MongoDB Atlas
        this.apiUrl = 'http://localhost:3001/api';
    }

    async loadFromCollection(collection, useCache = true) {
        // Check memory cache first
        if (useCache && this.cache.has(collection)) {
            return this.cache.get(collection);
        }

        try {
            // Load directly from MongoDB Atlas via backend API
            const data = await this.findDocuments(collection);
            
            // Ensure data is always an array
            if (!Array.isArray(data)) {
                console.warn(`Data for ${collection} is not an array, converting to empty array`);
                return [];
            }
            
            // Cache the result
            if (useCache && data) {
                this.cache.set(collection, data);
                localStorage.setItem(`cache_${collection}`, JSON.stringify(data));
            }

            return data || [];
        } catch (error) {
            console.error(`Error loading ${collection} from MongoDB Atlas:`, error);
            // Fallback to localStorage if Atlas fails
            return this.loadFromLocalStorage(collection);
        }
    }

    async findDocuments(collection) {
        try {
            const response = await fetch(`${this.apiUrl}/${collection}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Backend API error: ${response.status}`);
            }

            const documents = await response.json();
            return Array.isArray(documents) ? documents : [];
        } catch (error) {
            console.error('Backend API find error:', error);
            throw error;
        }
    }

    loadFromLocalStorage(collection) {
        const cached = localStorage.getItem(`cache_${collection}`);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                // Ensure we always return arrays, not undefined
                return Array.isArray(data) ? data : [];
            } catch (error) {
                console.error('Cache parse error:', error);
            }
        }
        
        // Always return empty array as fallback - no seeding needed
        console.log(`No cached data for ${collection}, returning empty array`);
        return [];
    }

    // NO MORE LOCAL FILES OR HARDCODING - ATLAS ONLY!

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

    // Write methods for updating data - Direct MongoDB Atlas via Backend API
    async saveToCollection(collection, document) {
        try {
            // Insert single document via backend API
            const response = await fetch(`${this.apiUrl}/${collection}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(document)
            });

            if (!response.ok) {
                throw new Error(`Backend API insertOne error: ${response.status}`);
            }

            const result = await response.json();
            
            // Clear cache to force refresh
            this.clearCache(collection);
            
            // Update localStorage cache for offline access
            const existingData = this.loadFromLocalStorage(collection);
            existingData.push(document);
            localStorage.setItem(`cache_${collection}`, JSON.stringify(existingData));
            
            console.log(`✅ Saved to ${collection} in MongoDB Atlas:`, document);
            return result;
        } catch (error) {
            console.error(`❌ Error saving to ${collection} via backend API:`, error);
            // Fallback to localStorage only if backend fails
            const existingData = this.loadFromLocalStorage(collection);
            existingData.push(document);
            localStorage.setItem(`cache_${collection}`, JSON.stringify(existingData));
            this.cache.delete(collection);
            throw error;
        }
    }

    async updateCollection(collection, documents) {
        try {
            // Replace entire collection via backend API
            const response = await fetch(`${this.apiUrl}/${collection}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(documents)
            });

            if (!response.ok) {
                throw new Error(`Backend API update error: ${response.status}`);
            }

            const result = await response.json();
            console.log(`✅ Updated ${collection} with ${documents.length} documents in MongoDB Atlas`);
            
            // Clear cache to force refresh
            this.clearCache(collection);
            
            // Update localStorage cache
            localStorage.setItem(`cache_${collection}`, JSON.stringify(documents));
            
            return documents;
        } catch (error) {
            console.error(`❌ Error updating ${collection} via backend API:`, error);
            // Fallback to localStorage if backend fails
            localStorage.setItem(`cache_${collection}`, JSON.stringify(documents));
            this.cache.delete(collection);
            throw error;
        }
    }

    // Backend API handles all MongoDB operations directly

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