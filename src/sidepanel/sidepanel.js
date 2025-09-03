// LinkMind Premium Side Panel JavaScript  
// Placeholder for demonstration - will be implemented in later chunks

console.log('📋 LinkMind Premium Side Panel Loaded');

// Mock content data for demo
const mockContent = [
    {
        id: 1,
        type: 'note',
        title: 'React Hooks Best Practices',
        preview: 'Key principles for using React hooks effectively in modern applications...',
        tags: ['#react', '#hooks', '#javascript'],
        time: '2 min ago',
        recent: true
    },
    {
        id: 2,
        type: 'snippet', 
        title: 'CSS Grid Layout Patterns',
        preview: 'Advanced CSS Grid techniques for modern responsive layouts...',
        tags: ['#css', '#grid', '#responsive'],
        time: '5 min ago'
    },
    {
        id: 3,
        type: 'screenshot',
        title: 'Analytics Dashboard UI',
        tags: ['#design', '#ui', '#dashboard'],
        time: '1 hour ago'
    }
];

// Initialize side panel interface
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Side Panel initialized with premium UI');
    
    // Initialize search functionality (placeholder)
    initializeSearch();
    
    // Initialize filters (placeholder)
    initializeFilters();
    
    // Add event listeners (placeholder)
    addEventListeners();
    
    // Load mock content
    displayContent(mockContent);
});

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    
    searchInput?.addEventListener('input', (e) => {
        const query = e.target.value;
        console.log('🔍 Search query:', query);
        
        // Show/hide clear button
        if (searchClear) {
            searchClear.style.display = query ? 'flex' : 'none';
        }
        
        // Will implement actual search in later chunks
        performSearch(query);
    });
    
    searchClear?.addEventListener('click', () => {
        if (searchInput) {
            searchInput.value = '';
            searchClear.style.display = 'none';
            performSearch('');
        }
    });
}

function initializeFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const filter = e.target.dataset.filter;
            console.log('📊 Filter applied:', filter);
            
            // Will implement actual filtering in later chunks
            applyFilter(filter);
        });
    });
}

function displayContent(content) {
    // This will be implemented with real content cards in later chunks
    console.log('📚 Displaying content:', content);
}

function performSearch(query) {
    // This will be implemented with real search logic in later chunks
    console.log('🔍 Performing search:', query);
}

function applyFilter(filter) {
    // This will be implemented with real filtering logic in later chunks
    console.log('📊 Applying filter:', filter);
}

function addEventListeners() {
    // Sync button animation
    document.querySelector('[data-action="sync"]')?.addEventListener('click', (e) => {
        const icon = e.target.querySelector('.sync-icon');
        if (icon) {
            icon.style.animation = 'spin 1s linear infinite';
            setTimeout(() => {
                icon.style.animation = 'none';
            }, 2000);
        }
    });
    
    // Intelligence panel interactions - Hook Model triggers
    document.querySelector('[data-action="knowledge-map"]')?.addEventListener('click', (e) => {
        console.log('🕸️ Opening knowledge graph visualization');
        // Will implement knowledge graph in Day 3-4
        showNotification('Knowledge graph visualization coming soon!', 'info');
    });

    // Discovery alert interactions - Variable rewards
    document.querySelectorAll('.discovery-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            console.log(`💡 Discovery action: ${action}`);
            
            switch(action) {
                case 'explore-connections':
                    showConnectionExplorer();
                    break;
                case 'research-suggestion':
                    showResearchSuggestions();
                    break;
            }
        });
    });

    // Project context toggle (replaces domain context)
    document.querySelector('[data-action="toggle-project"]')?.addEventListener('click', (e) => {
        const projectItems = document.getElementById('projectItems');
        const toggleIcon = e.target.querySelector('.toggle-icon');
        
        if (projectItems && toggleIcon) {
            const isExpanded = projectItems.style.display !== 'none';
            projectItems.style.display = isExpanded ? 'none' : 'block';
            toggleIcon.textContent = isExpanded ? '▶' : '▼';
        }
    });
    
    // Card action handlers
    document.querySelectorAll('.card-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = e.currentTarget.dataset.action;
            console.log(`🎯 Card action: ${action}`);
        });
    });
    
    // Quick action handlers
    document.querySelectorAll('.quick-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.currentTarget.dataset.action;
            console.log(`⚡ Quick action: ${action}`);
        });
    });
}

// Hook Model Helper Functions
function showConnectionExplorer() {
    console.log('🔗 Opening connection explorer');
    // Temporary notification - will be replaced with actual UI
    showNotification('Found 3 connections to your React research!', 'success');
    
    // Hook Model: Investment - user explores connections between their content
    // This creates value and increases switching costs
}

function showResearchSuggestions() {
    console.log('🎯 Showing research suggestions');
    // Temporary notification - will implement real suggestions later
    showNotification('Suggested: "React Performance Optimization Patterns"', 'info');
    
    // Hook Model: Trigger - suggesting next actions based on knowledge gaps
}

function showNotification(message, type = 'info') {
    // Simple notification system (will enhance in Day 7)
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        background: ${type === 'success' ? '#10b981' : type === 'info' ? '#3b82f6' : '#6b7280'};
        color: white;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Export for use in other modules
window.LinkMindSidepanel = {
    displayContent,
    performSearch,
    applyFilter,
    showConnectionExplorer,
    showResearchSuggestions,
    showNotification
};