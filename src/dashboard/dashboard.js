// LinkMind Premium Dashboard JavaScript
// Real IndexedDB integration with live data

console.log('📊 LinkMind Premium Dashboard Loaded');

// Initialize storage
let storage = null;

// Real analytics and workspace data
let analyticsData = null;
let workspacesData = null;

// Initialize dashboard interface
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Dashboard initialized with premium UI');
    
    // Initialize storage first
    await initializeStorage();
    
    // Initialize components
    initializeNavigation();
    initializeGlobalSearch();
    initializeFAB();
    
    // Load real data
    await loadDashboardData();
    
    // Add event listeners
    addEventListeners();
});

// Initialize storage service
async function initializeStorage() {
    try {
        storage = window.LinkMindStorage;
        await storage.initialize();
        console.log('✅ Storage initialized');
        
        // Create sample data if none exists
        await createSampleDataIfEmpty();
    } catch (error) {
        console.error('❌ Storage initialization failed:', error);
    }
}

// Create sample data for demonstration
async function createSampleDataIfEmpty() {
    try {
        const existingItems = await storage.getItems({ limit: 1 });
        
        if (existingItems.length === 0) {
            console.log('📝 Creating sample data...');
            
            // Create sample projects
            const frontendProject = await storage.saveProject({
                name: 'Frontend Development',
                description: 'React, TypeScript, and modern web development resources',
                icon: '🚀',
                tags: ['#react', '#typescript'],
                featured: true
            });
            
            const designProject = await storage.saveProject({
                name: 'Design System',
                description: 'UI/UX patterns, components, and design resources',
                icon: '🎨',
                tags: ['#design', '#ui']
            });
            
            // Create sample knowledge items
            const sampleItems = [
                {
                    title: 'React Hooks Best Practices',
                    content: 'Key principles for using React hooks effectively in modern applications...',
                    type: 'note',
                    projectId: frontendProject,
                    tags: ['react', 'hooks', 'best-practices'],
                    url: 'https://react.dev/learn/reusing-logic-with-custom-hooks'
                },
                {
                    title: 'CSS Grid Layout Patterns',
                    content: 'Advanced CSS Grid techniques for modern responsive layouts...',
                    type: 'snippet',
                    projectId: frontendProject,
                    tags: ['css', 'grid', 'responsive']
                },
                {
                    title: 'TypeScript Documentation',
                    content: 'Official TypeScript handbook and reference documentation...',
                    type: 'bookmark',
                    projectId: frontendProject,
                    tags: ['typescript', 'documentation'],
                    url: 'https://www.typescriptlang.org/docs/'
                },
                {
                    title: 'Analytics Dashboard UI',
                    content: 'Dashboard design patterns and best practices...',
                    type: 'screenshot',
                    projectId: designProject,
                    tags: ['design', 'ui', 'dashboard']
                },
                {
                    title: 'Component Library Architecture',
                    content: 'How to structure and organize component libraries for scalability...',
                    type: 'note',
                    projectId: designProject,
                    tags: ['components', 'architecture', 'design-system']
                }
            ];
            
            for (const item of sampleItems) {
                await storage.saveItem(item);
            }
            
            console.log('✅ Sample data created');
        }
    } catch (error) {
        console.error('❌ Failed to create sample data:', error);
    }
}

// Load dashboard data from IndexedDB
async function loadDashboardData() {
    try {
        // Load analytics
        analyticsData = await storage.getAnalytics();
        displayAnalytics(analyticsData);
        
        // Load projects as workspaces
        const projects = await storage.getProjects();
        workspacesData = await enrichProjectsWithStats(projects);
        displayWorkspaces(workspacesData);
        
        console.log('✅ Dashboard data loaded');
    } catch (error) {
        console.error('❌ Failed to load dashboard data:', error);
    }
}

// Enrich projects with item counts and stats
async function enrichProjectsWithStats(projects) {
    const enrichedProjects = [];
    
    for (const project of projects) {
        try {
            const items = await storage.getItems({ projectId: project.id });
            const enriched = {
                ...project,
                itemCount: items.length,
                memberCount: 1, // Placeholder for future collaboration
                lastActivity: items.length > 0 ? 
                    Math.max(...items.map(item => new Date(item.updatedAt || item.createdAt).getTime())) :
                    new Date(project.createdAt).getTime()
            };
            enrichedProjects.push(enriched);
        } catch (error) {
            console.error(`Failed to enrich project ${project.id}:`, error);
        }
    }
    
    return enrichedProjects;
}

function initializeNavigation() {
    // Navigation item click handlers
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active state
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            e.target.closest('.nav-item')?.classList.add('active');
            
            const href = e.target.getAttribute('href');
            console.log('📍 Navigation:', href);
            
            // Will implement actual navigation in later chunks
        });
    });
    
    // Mobile nav toggle
    document.getElementById('navToggle')?.addEventListener('click', () => {
        const nav = document.querySelector('.dashboard-nav');
        nav?.classList.toggle('open');
    });
}

function initializeGlobalSearch() {
    const searchInput = document.querySelector('.global-search-input');
    
    let searchTimeout;
    
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Debounce search
        searchTimeout = setTimeout(async () => {
            if (query.length > 0) {
                await performGlobalSearch(query);
            } else {
                // Clear search results if query is empty
                displaySearchResults([]);
            }
        }, 300);
    });
    
    // Keyboard shortcut for search (Cmd/Ctrl + K)
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            searchInput?.focus();
        }
    });
}

// Perform global search across all knowledge items
async function performGlobalSearch(query) {
    try {
        console.log('🔍 Global search:', query);
        
        if (!storage) {
            console.warn('Storage not initialized');
            return;
        }
        
        const results = await storage.searchItems(query, { limit: 20 });
        displaySearchResults(results);
        
        console.log(`Found ${results.length} results for "${query}"`);
    } catch (error) {
        console.error('Search failed:', error);
    }
}

// Display search results (placeholder for now)
function displaySearchResults(results) {
    // This will be enhanced when we implement the actual search UI
    console.log('Search results:', results.length);
    
    // For now, just log the results
    if (results.length > 0) {
        console.log('Top results:', results.slice(0, 5).map(r => r.title));
    }
}

function initializeFAB() {
    const fabMain = document.getElementById('fabMain');
    const fabMenu = document.getElementById('fabMenu');
    
    fabMain?.addEventListener('click', () => {
        fabMenu?.classList.toggle('active');
        console.log('🎯 FAB toggled');
    });
    
    // Close FAB menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.floating-actions')) {
            fabMenu?.classList.remove('active');
        }
    });
    
    // FAB item handlers
    document.querySelectorAll('.fab-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            console.log(`⚡ FAB action: ${action}`);
            fabMenu?.classList.remove('active');
        });
    });
}

function displayAnalytics(analytics) {
    console.log('📈 Analytics data:', analytics);
    
    // Update stat numbers in the HTML
    updateStatElement('.total-items .stat-number', analytics.totalItems);
    updateStatElement('.weekly-growth .stat-number', analytics.weeklyGrowth + '%');
    updateStatElement('.week-items .stat-number', analytics.thisWeekItems);
    updateStatElement('.avg-search .stat-number', analytics.avgSearchTime + 's');
    
    // Update top tags if there's a container for them
    updateTopTags(analytics.topTags);
    
    // Animate numbers on load
    setTimeout(() => animateNumbers(), 100);
}

// Helper function to update stat elements
function updateStatElement(selector, value) {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = value;
    }
}

// Update top tags display
function updateTopTags(tags) {
    const tagsContainer = document.querySelector('.top-tags');
    if (tagsContainer && tags.length > 0) {
        tagsContainer.innerHTML = tags.map(tag => 
            `<span class="tag">#${tag}</span>`
        ).join('');
    }
}

function displayWorkspaces(workspaces) {
    console.log('📁 Workspaces data:', workspaces);
    
    const workspaceContainer = document.querySelector('.workspace-grid, .workspaces-container');
    if (!workspaceContainer || !workspaces.length) {
        return;
    }
    
    // Clear existing content
    workspaceContainer.innerHTML = '';
    
    // Create workspace cards
    workspaces.forEach(workspace => {
        const card = createWorkspaceCard(workspace);
        workspaceContainer.appendChild(card);
    });
}

// Create a workspace card element
function createWorkspaceCard(workspace) {
    const card = document.createElement('div');
    card.className = `workspace-card ${workspace.featured ? 'featured' : ''}`;
    card.dataset.workspaceId = workspace.id;
    
    const lastActivity = workspace.lastActivity ? 
        formatTime(new Date(workspace.lastActivity)) : 
        'No activity';
    
    card.innerHTML = `
        <div class="workspace-header">
            <div class="workspace-icon">${workspace.icon || '📁'}</div>
            <div class="workspace-menu">
                <button class="menu-btn" data-action="workspace-menu">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z" fill="currentColor"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="workspace-content">
            <h3 class="workspace-name">${workspace.name}</h3>
            <p class="workspace-description">${workspace.description}</p>
            <div class="workspace-stats">
                <span class="stat">
                    <span class="stat-icon">📄</span>
                    <span class="stat-value">${workspace.itemCount}</span>
                </span>
                <span class="stat">
                    <span class="stat-icon">👥</span>
                    <span class="stat-value">${workspace.memberCount}</span>
                </span>
            </div>
            <div class="workspace-meta">
                <span class="last-activity">${lastActivity}</span>
            </div>
        </div>
        <div class="workspace-tags">
            ${(workspace.tags || []).map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('')}
        </div>
    `;
    
    return card;
}

function animateNumbers() {
    // Animate stat numbers on page load
    document.querySelectorAll('.stat-number').forEach(element => {
        const finalValue = element.textContent;
        const numericValue = parseFloat(finalValue.replace(/[^0-9.]/g, ''));
        
        if (!isNaN(numericValue)) {
            let current = 0;
            const increment = numericValue / 30; // 30 frame animation
            const timer = setInterval(() => {
                current += increment;
                if (current >= numericValue) {
                    current = numericValue;
                    clearInterval(timer);
                }
                
                // Format the number appropriately
                let displayValue = Math.floor(current).toString();
                if (finalValue.includes('.')) {
                    displayValue = current.toFixed(1);
                }
                if (finalValue.includes(',')) {
                    displayValue = displayValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                }
                if (finalValue.includes('s')) {
                    displayValue += 's';
                }
                
                element.textContent = displayValue;
            }, 16); // ~60fps
        }
    });
}

function addEventListeners() {
    // Header button handlers
    document.querySelectorAll('.header-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            console.log(`🔧 Header action: ${action}`);
            
            // Handle local-first actions
            if (action === 'sync') {
                showLocalSyncMessage();
            }
        });
    });
    
    // Profile menu handler
    const profileMenuBtn = document.getElementById('profileMenuBtn');
    if (profileMenuBtn) {
        profileMenuBtn.addEventListener('click', () => {
            showProfileMenu();
        });
    }
    
    // Section action handlers
    document.querySelectorAll('.section-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            console.log('📊 Section action clicked');
        });
    });
    
    // Graph control handlers
    document.querySelectorAll('.graph-control').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            document.querySelectorAll('.graph-control').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const view = e.target.dataset.view;
            console.log('🕸️ Graph view:', view);
        });
    });
    
    // Workspace card handlers
    document.querySelectorAll('.workspace-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.workspace-menu')) {
                console.log('📁 Workspace clicked');
            }
        });
    });
    
    // Workspace menu handlers
    document.querySelectorAll('.workspace-menu').forEach(menu => {
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('⚙️ Workspace menu clicked');
        });
    });
    
    // Activity item handlers
    document.querySelectorAll('.activity-item').forEach(item => {
        item.addEventListener('click', (e) => {
            console.log('📈 Activity item clicked');
        });
    });
}

// Utility function for formatting time
function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

// Local-first helper functions
function showLocalSyncMessage() {
    const notification = document.createElement('div');
    notification.className = 'local-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">💾</span>
            <div class="notification-text">
                <strong>Local Mode Active</strong>
                <p>All data stored securely on your device</p>
            </div>
        </div>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.2);
        color: #10b981;
        padding: 16px;
        border-radius: 12px;
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

function showProfileMenu() {
    console.log('🎯 Profile menu: Local mode options');
    // Future: Show export options, privacy settings, etc.
}

// Export for use in other modules
window.LinkMindDashboard = {
    formatTime,
    displayAnalytics,
    displayWorkspaces,
    showLocalSyncMessage,
    showProfileMenu
};