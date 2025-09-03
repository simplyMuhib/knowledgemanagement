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
        
        // Load recent activity
        await loadRecentActivity();
        
        // Update navigation counters
        await updateNavigationCounters();
        
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

// Load and display recent activity
async function loadRecentActivity() {
    try {
        const recentItems = await storage.getItems({ limit: 10, sortBy: 'updatedAt' });
        displayRecentActivity(recentItems);
        console.log('✅ Recent activity loaded');
    } catch (error) {
        console.error('❌ Failed to load recent activity:', error);
    }
}

// Display recent activity in the activity feed
function displayRecentActivity(items) {
    const activityFeed = document.querySelector('.activity-feed');
    if (!activityFeed || !items.length) {
        return;
    }
    
    // Clear existing content
    activityFeed.innerHTML = '';
    
    // Create activity items
    items.forEach(item => {
        const activityItem = createActivityItem(item);
        activityFeed.appendChild(activityItem);
    });
}

// Create an activity item element
function createActivityItem(item) {
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.dataset.itemId = item.id;
    
    const timeAgo = formatTime(new Date(item.updatedAt || item.createdAt));
    const actionText = getActivityActionText(item);
    
    activityItem.innerHTML = `
        <div class="activity-icon ${item.type}">
            ${getActivityIcon(item.type)}
        </div>
        <div class="activity-content">
            <p class="activity-text">${actionText} <strong>"${item.title}"</strong> ${item.url ? `from ${new URL(item.url).hostname}` : ''}</p>
            <span class="activity-time">${timeAgo}</span>
        </div>
    `;
    
    // Add click handler
    activityItem.addEventListener('click', () => {
        console.log('📈 Activity item clicked:', item.title);
        // Future: Open item detail view
    });
    
    return activityItem;
}

// Get activity action text based on item type
function getActivityActionText(item) {
    const actions = {
        'note': 'Created note',
        'snippet': 'Captured',
        'screenshot': 'Screenshot saved from',
        'bookmark': 'Bookmarked',
        'text': 'Saved text from'
    };
    return actions[item.type] || 'Saved';
}

// Get SVG icon for activity type
function getActivityIcon(type) {
    const icons = {
        'note': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                 </svg>`,
        'snippet': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                       <line x1="8" y1="21" x2="16" y2="21"/>
                       <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>`,
        'screenshot': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                         <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                         <circle cx="12" cy="13" r="4"/>
                       </svg>`,
        'bookmark': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                     </svg>`,
        'text': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                 </svg>`
    };
    return icons[type] || icons['text'];
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

// Display search results in dropdown
function displaySearchResults(results) {
    console.log('Search results:', results.length);
    
    let searchDropdown = document.querySelector('.search-dropdown');
    
    // Create dropdown if it doesn't exist
    if (!searchDropdown) {
        searchDropdown = document.createElement('div');
        searchDropdown.className = 'search-dropdown';
        const searchContainer = document.querySelector('.search-global');
        searchContainer.appendChild(searchDropdown);
    }
    
    // Clear previous results
    searchDropdown.innerHTML = '';
    
    if (results.length === 0) {
        searchDropdown.style.display = 'none';
        return;
    }
    
    // Show dropdown
    searchDropdown.style.display = 'block';
    
    // Add results
    results.slice(0, 8).forEach(result => {
        const resultItem = createSearchResultItem(result);
        searchDropdown.appendChild(resultItem);
    });
    
    // Add "View all results" if there are more
    if (results.length > 8) {
        const viewAll = document.createElement('div');
        viewAll.className = 'search-result-item view-all';
        viewAll.innerHTML = `
            <div class="result-content">
                <div class="result-title">View all ${results.length} results</div>
            </div>
        `;
        viewAll.addEventListener('click', () => {
            console.log('🔍 View all search results');
            searchDropdown.style.display = 'none';
        });
        searchDropdown.appendChild(viewAll);
    }
}

// Create a search result item
function createSearchResultItem(result) {
    const resultItem = document.createElement('div');
    resultItem.className = 'search-result-item';
    resultItem.dataset.itemId = result.id;
    
    const timeAgo = formatTime(new Date(result.updatedAt || result.createdAt));
    const domain = result.url ? new URL(result.url).hostname : '';
    
    resultItem.innerHTML = `
        <div class="result-icon">
            ${getActivityIcon(result.type)}
        </div>
        <div class="result-content">
            <div class="result-title">${result.title}</div>
            <div class="result-meta">
                <span class="result-type">${result.type}</span>
                ${domain ? `<span class="result-domain">${domain}</span>` : ''}
                <span class="result-time">${timeAgo}</span>
            </div>
        </div>
    `;
    
    // Add click handler
    resultItem.addEventListener('click', () => {
        console.log('🔍 Search result clicked:', result.title);
        document.querySelector('.search-dropdown').style.display = 'none';
        document.querySelector('.global-search-input').value = '';
        // Future: Open item detail view
    });
    
    return resultItem;
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
        
        // Close search dropdown when clicking outside
        if (!e.target.closest('.search-global')) {
            const searchDropdown = document.querySelector('.search-dropdown');
            if (searchDropdown) {
                searchDropdown.style.display = 'none';
            }
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

// Update navigation counters with real data
async function updateNavigationCounters() {
    try {
        const counters = await storage.getItemCountsByType();
        
        // Update navigation item counts
        updateNavCounter('notes', counters.note || 0);
        updateNavCounter('snippets', counters.snippet || 0);
        updateNavCounter('screenshots', counters.screenshot || 0);
        updateNavCounter('bookmarks', counters.bookmark || 0);
        
        const projects = await storage.getProjects();
        updateNavCounter('workspaces', projects.length || 0);
        
    } catch (error) {
        console.error('❌ Failed to update navigation counters:', error);
    }
}

// Helper to update individual nav counter
function updateNavCounter(type, count) {
    const navItem = document.querySelector(`[href="#${type}"] .nav-count`);
    if (navItem) {
        navItem.textContent = count;
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