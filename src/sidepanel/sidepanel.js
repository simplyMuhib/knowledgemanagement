// LinkMind Premium Side Panel JavaScript - REAL CONTENT DISPLAY

// Real captured content storage
let capturedContent = [];

// Initialize side panel interface
document.addEventListener('DOMContentLoaded', async () => {
    
    // Initialize search functionality
    initializeSearch();
    
    // Initialize filters
    initializeFilters();
    
    // Add event listeners
    addEventListeners();
    
    // Load REAL captured content from storage
    await loadCapturedContent();
    
    // Listen for new captures from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'NEW_CAPTURE_SAVED') {
            console.log('🆕 New capture received in sidepanel:', message.data);
            addNewCaptureToDisplay(message.data);
            sendResponse({ received: true });
        }
    });
    
    // Listen for storage changes to refresh content
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            console.log('📦 Storage changed, reloading content...');
            loadCapturedContent();
        }
    });
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

// Load captured content from chrome storage
async function loadCapturedContent() {
    
    try {
        const allStorage = await chrome.storage.local.get();
        
        const captureItems = Object.entries(allStorage)
            .filter(([key]) => {
                const isCapture = key.startsWith('capture_');
                return isCapture;
            })
            .map(([key, data]) => {
                return { id: key, ...data };
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
        capturedContent = captureItems;
        
        if (capturedContent.length === 0) {
        }
        
        displayContent(capturedContent);
    } catch (error) {
        console.error('Failed to load content:', error);
        displayEmptyState();
    }
}

// Display real captured content in the UI
function displayContent(content) {
    console.log('🎨 DisplayContent with:', content?.length, 'items');
    const contentGrid = document.getElementById('contentGrid');
    if (!contentGrid) {
        console.log('❌ ContentGrid not found!');
        return;
    }
    
    if (!content || content.length === 0) {
        displayEmptyState();
        return;
    }
    
    // Clear existing content
    contentGrid.innerHTML = '';
    
    // Display real captured items
    content.forEach((item, i) => {
        console.log(`📋 Card ${i+1}:`, item.content?.substring(0, 30));
        const card = createContentCard(item);
        contentGrid.appendChild(card);
    });
    
    console.log('✅ Displayed', content.length, 'real items');
}

// Create a content card element for captured items
function createContentCard(item) {
    const card = document.createElement('div');
    card.className = 'content-card';
    card.dataset.id = item.id;
    card.dataset.type = item.type;
    
    // Determine card type and icon
    let typeIcon, typeLabel, cardContent = '';
    
    switch (item.type) {
        case 'text':
            typeIcon = getContentTypeIcon(item.intelligence?.contentType || 'text');
            typeLabel = getContentTypeLabel(item.intelligence?.contentType || 'text');
            cardContent = `
                <h4 class="card-title">${truncateText(item.content, 40) || 'Text Capture'}</h4>
                <p class="card-preview">${truncateText(item.content, 100)}</p>
            `;
            break;
        case 'link':
            typeIcon = '🔗';
            typeLabel = 'Bookmark';
            cardContent = `
                <h4 class="card-title">${item.title || item.url}</h4>
                <p class="card-preview">${item.url}</p>
                <div class="card-source">
                    <span class="source-icon">🌐</span>
                    <span class="source-url">${new URL(item.url).hostname}</span>
                </div>
            `;
            break;
        case 'image':
            typeIcon = '🖼️';
            typeLabel = 'Image';
            cardContent = `
                <h4 class="card-title">Image from ${new URL(item.pageUrl).hostname}</h4>
                <p class="card-preview">${item.alt || 'Captured image'}</p>
            `;
            break;
        case 'screenshot':
            typeIcon = '📸';
            typeLabel = 'Screenshot';
            cardContent = `
                <div class="card-image">
                    <div class="image-placeholder">
                        <span class="image-icon">🖼️</span>
                        <span class="image-text">Screenshot</span>
                    </div>
                </div>
                <h4 class="card-title">${item.title || 'Page Screenshot'}</h4>
            `;
            break;
        case 'page':
            typeIcon = '📄';
            typeLabel = 'Page';
            cardContent = `
                <h4 class="card-title">${item.title || 'Page Capture'}</h4>
                <p class="card-preview">${truncateText(item.selectedText, 100) || 'Full page captured'}</p>
            `;
            break;
        case 'research':
            typeIcon = '🔬';
            typeLabel = 'Research';
            cardContent = `
                <h4 class="card-title">Research: "${item.query}"</h4>
                <p class="card-preview">${truncateText(item.content, 100)}</p>
            `;
            break;
        default:
            typeIcon = '📄';
            typeLabel = 'Content';
            cardContent = `
                <h4 class="card-title">${item.title || 'Captured Content'}</h4>
                <p class="card-preview">${truncateText(item.content || '', 100)}</p>
            `;
    }
    
    const timeAgo = formatTimeAgo(new Date(item.timestamp));
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-type">
                <span class="type-icon">${typeIcon}</span>
                <span class="type-label">${typeLabel}</span>
            </div>
            <span class="card-time">${timeAgo}</span>
        </div>
        ${cardContent}
        <div class="card-tags">
            ${item.intelligence ? `<span class="tag">#${item.intelligence.contentType}</span>` : ''}
            ${item.source ? `<span class="tag">#${item.source}</span>` : ''}
        </div>
        <div class="card-actions">
            <button class="card-action" data-action="view" title="View details">👁️</button>
            <button class="card-action" data-action="edit" title="Edit">✏️</button>
            <button class="card-action" data-action="delete" title="Delete">🗑️</button>
        </div>
    `;
    
    // Add click handler for card
    card.addEventListener('click', () => openContentDetail(item));
    
    return card;
}

// Add new capture to display immediately
function addNewCaptureToDisplay(captureData) {
    capturedContent.unshift(captureData); // Add to beginning
    
    const contentGrid = document.getElementById('contentGrid');
    if (!contentGrid) return;
    
    // Remove empty state if present
    const emptyState = contentGrid.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    // Create and prepend new card
    const newCard = createContentCard(captureData);
    newCard.classList.add('new-capture'); // Add highlight class
    contentGrid.insertBefore(newCard, contentGrid.firstChild);
    
    // Remove highlight after animation
    setTimeout(() => newCard.classList.remove('new-capture'), 2000);
    
    console.log('✨ Added new capture to display:', captureData.type);
}

// Helper functions
function getContentTypeIcon(contentType) {
    const icons = {
        'code': '💻',
        'quote': '💬',
        'definition': '📚',
        'data': '📊',
        'text': '📝'
    };
    return icons[contentType] || '📝';
}

function getContentTypeLabel(contentType) {
    const labels = {
        'code': 'Code Snippet',
        'quote': 'Quote', 
        'definition': 'Definition',
        'data': 'Data',
        'text': 'Text'
    };
    return labels[contentType] || 'Text';
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

function displayEmptyState() {
    const contentGrid = document.getElementById('contentGrid');
    if (!contentGrid) return;
    
    contentGrid.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">🎯</div>
            <h3>No captures yet</h3>
            <p>Right-click on any webpage to start capturing knowledge with LinkMind!</p>
            <div class="empty-actions">
                <button class="quick-action primary" onclick="chrome.tabs.query({active: true}, (tabs) => chrome.tabs.reload(tabs[0].id))">
                    <span class="action-icon">🔄</span>
                    <span class="action-label">Refresh Page</span>
                </button>
            </div>
        </div>
    `;
}

function openContentDetail(item) {
    console.log('👁️ Opening content detail for:', item.id);
    // This will be implemented - for now show notification
    showNotification(`Opening: ${item.title || item.type}`, 'info');
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