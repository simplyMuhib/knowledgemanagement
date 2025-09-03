// LinkMind Storage Service - IndexedDB Integration
// Handles all data persistence for knowledge items

class LinkMindStorage {
    constructor() {
        this.dbName = 'LinkMindDB';
        this.dbVersion = 1;
        this.db = null;
        this.stores = {
            items: 'knowledge_items',
            projects: 'projects',
            connections: 'connections',
            analytics: 'analytics'
        };
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Knowledge items store
                if (!db.objectStoreNames.contains(this.stores.items)) {
                    const itemsStore = db.createObjectStore(this.stores.items, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    itemsStore.createIndex('type', 'type', { unique: false });
                    itemsStore.createIndex('projectId', 'projectId', { unique: false });
                    itemsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                    itemsStore.createIndex('created', 'createdAt', { unique: false });
                    itemsStore.createIndex('url', 'url', { unique: false });
                }
                
                // Projects store
                if (!db.objectStoreNames.contains(this.stores.projects)) {
                    const projectsStore = db.createObjectStore(this.stores.projects, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    projectsStore.createIndex('name', 'name', { unique: false });
                    projectsStore.createIndex('created', 'createdAt', { unique: false });
                }
                
                // Connections store
                if (!db.objectStoreNames.contains(this.stores.connections)) {
                    const connectionsStore = db.createObjectStore(this.stores.connections, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    connectionsStore.createIndex('fromId', 'fromId', { unique: false });
                    connectionsStore.createIndex('toId', 'toId', { unique: false });
                    connectionsStore.createIndex('type', 'type', { unique: false });
                }
                
                // Analytics store
                if (!db.objectStoreNames.contains(this.stores.analytics)) {
                    db.createObjectStore(this.stores.analytics, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                }
            };
        });
    }

    // Knowledge Items CRUD
    async saveItem(itemData) {
        const item = {
            ...itemData,
            id: itemData.id || undefined,
            createdAt: itemData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const transaction = this.db.transaction([this.stores.items], 'readwrite');
        const store = transaction.objectStore(this.stores.items);
        
        return new Promise((resolve, reject) => {
            const request = store.put(item);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getItemCountsByType() {
        const transaction = this.db.transaction([this.stores.items], 'readonly');
        const store = transaction.objectStore(this.stores.items);
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const items = request.result;
                const counts = {};
                items.forEach(item => {
                    counts[item.type] = (counts[item.type] || 0) + 1;
                });
                resolve(counts);
            };
        });
    }

    async getItem(id) {
        const transaction = this.db.transaction([this.stores.items], 'readonly');
        const store = transaction.objectStore(this.stores.items);
        
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getItems(options = {}) {
        const transaction = this.db.transaction([this.stores.items], 'readonly');
        const store = transaction.objectStore(this.stores.items);
        
        let request;
        if (options.projectId) {
            const index = store.index('projectId');
            request = index.getAll(options.projectId);
        } else if (options.type) {
            const index = store.index('type');
            request = index.getAll(options.type);
        } else {
            request = store.getAll();
        }
        
        return new Promise((resolve, reject) => {
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                let results = request.result;
                
                // Apply additional filters
                if (options.limit) {
                    results = results.slice(0, options.limit);
                }
                
                if (options.sortBy === 'created') {
                    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                }
                
                resolve(results);
            };
        });
    }

    async deleteItem(id) {
        const transaction = this.db.transaction([this.stores.items], 'readwrite');
        const store = transaction.objectStore(this.stores.items);
        
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(true);
        });
    }

    // Projects CRUD
    async saveProject(projectData) {
        const project = {
            ...projectData,
            id: projectData.id || undefined,
            createdAt: projectData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const transaction = this.db.transaction([this.stores.projects], 'readwrite');
        const store = transaction.objectStore(this.stores.projects);
        
        return new Promise((resolve, reject) => {
            const request = store.put(project);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getProjects() {
        const transaction = this.db.transaction([this.stores.projects], 'readonly');
        const store = transaction.objectStore(this.stores.projects);
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const results = request.result.sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                resolve(results);
            };
        });
    }

    // Analytics
    async getAnalytics() {
        const items = await this.getItems();
        const projects = await this.getProjects();
        
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const recentItems = items.filter(item => 
            new Date(item.createdAt) > weekAgo
        );
        
        const tagCounts = {};
        items.forEach(item => {
            if (item.tags) {
                item.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        
        const topTags = Object.entries(tagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([tag]) => tag);

        return {
            totalItems: items.length,
            totalProjects: projects.length,
            thisWeekItems: recentItems.length,
            weeklyGrowth: recentItems.length > 0 ? 
                Math.round((recentItems.length / Math.max(items.length - recentItems.length, 1)) * 100) : 0,
            topTags: topTags,
            avgSearchTime: 7.2 // Placeholder for future search analytics
        };
    }

    // Search functionality
    async searchItems(query, options = {}) {
        const items = await this.getItems();
        const searchTerms = query.toLowerCase().split(' ');
        
        const results = items.filter(item => {
            const searchableText = [
                item.title,
                item.content,
                item.description,
                ...(item.tags || [])
            ].join(' ').toLowerCase();
            
            return searchTerms.every(term => searchableText.includes(term));
        });
        
        // Sort by relevance (simple match count for now)
        results.sort((a, b) => {
            const aText = [a.title, a.content, a.description, ...(a.tags || [])].join(' ').toLowerCase();
            const bText = [b.title, b.content, b.description, ...(b.tags || [])].join(' ').toLowerCase();
            
            const aMatches = searchTerms.reduce((count, term) => 
                count + (aText.split(term).length - 1), 0);
            const bMatches = searchTerms.reduce((count, term) => 
                count + (bText.split(term).length - 1), 0);
            
            return bMatches - aMatches;
        });
        
        return results.slice(0, options.limit || 50);
    }

    // Connection management
    async saveConnection(fromId, toId, type = 'related') {
        const connection = {
            fromId,
            toId,
            type,
            createdAt: new Date().toISOString()
        };

        const transaction = this.db.transaction([this.stores.connections], 'readwrite');
        const store = transaction.objectStore(this.stores.connections);
        
        return new Promise((resolve, reject) => {
            const request = store.put(connection);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getConnections(itemId) {
        const transaction = this.db.transaction([this.stores.connections], 'readonly');
        const store = transaction.objectStore(this.stores.connections);
        
        const fromIndex = store.index('fromId');
        const toIndex = store.index('toId');
        
        const fromPromise = new Promise((resolve, reject) => {
            const request = fromIndex.getAll(itemId);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
        
        const toPromise = new Promise((resolve, reject) => {
            const request = toIndex.getAll(itemId);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
        
        const [fromConnections, toConnections] = await Promise.all([fromPromise, toPromise]);
        return [...fromConnections, ...toConnections];
    }
}

// Singleton instance
const storage = new LinkMindStorage();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = storage;
} else {
    window.LinkMindStorage = storage;
}