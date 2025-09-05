// LinkMind Enterprise-Standard Side Panel JavaScript

// Progressive disclosure state management
let userEngagementLevel = 0; // 0: First visit, 1: After first save, 2: After 3 saves, 3: Advanced user (5+ saves)
let capturedContent = [];
let currentPageInfo = { title: '', url: '', domain: '' };

// Initialize enterprise-standard interface
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing enterprise-standard LinkMind sidepanel...');
    
    // Get current page context
    await getCurrentPageContext();
    
    // Initialize progressive disclosure system
    await initializeProgressiveDisclosure();
    
    // Initialize primary CTA functionality
    initializePrimaryCTA();
    
    // Load captured content
    await loadCapturedContent();
    
    // Initialize advanced features based on engagement level
    if (userEngagementLevel >= 2) {
        initializeAdvancedFeatures();
    }
    
    // Listen for new captures from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'NEW_CAPTURE_SAVED') {
            console.log('🆕 New capture received in sidepanel:', message.data);
            handleSuccessfulSave(message.data);
            sendResponse({ received: true });
        }
    });
    
    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            console.log('📦 Storage changed, reloading content...');
            loadCapturedContent();
        }
    });
    
    // ENTERPRISE: Listen for tab changes to update page context
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
        console.log('🔄 Tab changed, updating page context...');
        await getCurrentPageContext();
        
        // Update context tab counts if advanced features are available
        if (userEngagementLevel >= 2) {
            updateContextTabCounts();
            
            // Refresh current context view
            const activeTab = document.querySelector('.context-tab.active');
            if (activeTab) {
                const context = activeTab.dataset.context;
                applyContextFilter(context);
            }
        }
    });
    
    // Listen for tab URL updates (same tab, new page)
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
        if (changeInfo.status === 'complete' && tab.active) {
            console.log('🔄 Active tab updated, refreshing page context...');
            await getCurrentPageContext();
            
            // Update context tab counts if advanced features are available
            if (userEngagementLevel >= 2) {
                updateContextTabCounts();
                
                // Refresh current context view
                const activeTab = document.querySelector('.context-tab.active');
                if (activeTab) {
                    const context = activeTab.dataset.context;
                    applyContextFilter(context);
                }
            }
        }
    });
});

// ENTERPRISE CRITICAL: Get current page context for smart organization
async function getCurrentPageContext() {
    try {
        // Get active tab information
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            currentPageInfo = {
                title: tab.title || 'Untitled Page',
                url: tab.url || '',
                domain: new URL(tab.url || 'https://example.com').hostname
            };
            
            // Update page context display
            const pageTitle = document.getElementById('currentPageTitle');
            if (pageTitle) {
                pageTitle.textContent = currentPageInfo.title;
            }
            
            console.log('🌐 Current page context:', currentPageInfo);
        }
    } catch (error) {
        console.log('⚠️ Could not get current page context:', error);
        currentPageInfo = {
            title: 'Current Page',
            url: '',
            domain: ''
        };
    }
}

// ENTERPRISE: Progressive Disclosure System
async function initializeProgressiveDisclosure() {
    // Get user engagement level from storage
    const result = await chrome.storage.local.get(['userEngagementLevel', 'saveCount']);
    const saveCount = result.saveCount || 0;
    
    // Determine engagement level based on saves
    if (saveCount === 0) {
        userEngagementLevel = 0; // First visit
    } else if (saveCount < 3) {
        userEngagementLevel = 1; // After first save
    } else if (saveCount < 5) {
        userEngagementLevel = 2; // Regular user
    } else {
        userEngagementLevel = 3; // Advanced user
    }
    
    console.log(`👤 User engagement level: ${userEngagementLevel} (${saveCount} saves)`);
    
    // Show appropriate interface elements
    updateInterfaceVisibility();
}

// ENTERPRISE: Update interface based on engagement level
function updateInterfaceVisibility() {
    const primarySection = document.getElementById('primaryActionSection');
    const successFeedback = document.getElementById('successFeedback');
    const advancedInterface = document.getElementById('advancedInterface');
    const contextTabs = document.getElementById('contextTabs');
    const sectionHeader = document.getElementById('sectionHeader');
    const projectSection = document.getElementById('projectSection');
    
    // Level 0: Only show primary CTA
    if (userEngagementLevel === 0) {
        primarySection.style.display = 'block';
        successFeedback.style.display = 'none';
        advancedInterface.style.display = 'none';
        contextTabs.style.display = 'none';
        sectionHeader.style.display = 'none';
        projectSection.style.display = 'none';
    }
    // Level 1: Show success feedback after first save
    else if (userEngagementLevel === 1) {
        primarySection.style.display = 'block';
        advancedInterface.style.display = 'none';
        contextTabs.style.display = 'none';
        sectionHeader.style.display = 'block';
        projectSection.style.display = 'none';
    }
    // Level 2: Show context tabs and basic content management
    else if (userEngagementLevel === 2) {
        primarySection.style.display = 'block';
        advancedInterface.style.display = 'block';
        contextTabs.style.display = 'flex';
        sectionHeader.style.display = 'block';
        projectSection.style.display = 'none';
    }
    // Level 3: Show full interface with project management
    else {
        primarySection.style.display = 'block';
        advancedInterface.style.display = 'block';
        contextTabs.style.display = 'flex';
        sectionHeader.style.display = 'block';
        projectSection.style.display = 'block';
    }
}

// ENTERPRISE CRITICAL: Primary CTA functionality
function initializePrimaryCTA() {
    const saveCTA = document.getElementById('savePrimaryCTA');
    
    saveCTA?.addEventListener('click', async () => {
        console.log('💾 Primary save CTA clicked');
        
        // Disable button during save
        saveCTA.disabled = true;
        saveCTA.style.opacity = '0.6';
        
        try {
            // Capture current page
            await captureCurrentPage();
            
        } catch (error) {
            console.error('❌ Save failed:', error);
            // Re-enable button
            saveCTA.disabled = false;
            saveCTA.style.opacity = '1';
        }
    });
}

// ENTERPRISE: Capture current page functionality
async function captureCurrentPage() {
    const captureData = {
        id: `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'page',
        title: currentPageInfo.title,
        content: `Saved from: ${currentPageInfo.title}`,
        url: currentPageInfo.url,
        pageTitle: currentPageInfo.title,
        pageUrl: currentPageInfo.url,
        timestamp: new Date().toISOString(),
        intelligence: {
            contentType: 'page',
            domain: currentPageInfo.domain,
            project: detectSmartProject(currentPageInfo)
        }
    };
    
    // Save to storage
    const existingData = await chrome.storage.local.get(['capturedContent']);
    const updatedContent = [captureData, ...(existingData.capturedContent || [])];
    
    await chrome.storage.local.set({ capturedContent: updatedContent });
    
    // Update save count for engagement level
    const result = await chrome.storage.local.get(['saveCount']);
    const newSaveCount = (result.saveCount || 0) + 1;
    await chrome.storage.local.set({ saveCount: newSaveCount });
    
    console.log('✅ Page saved successfully:', captureData);
    
    // Trigger success feedback
    handleSuccessfulSave(captureData);
}

// ENTERPRISE: Smart project detection
function detectSmartProject(pageInfo) {
    const domain = pageInfo.domain.toLowerCase();
    const title = pageInfo.title.toLowerCase();
    const url = pageInfo.url.toLowerCase();
    
    // GitHub project detection
    if (domain.includes('github.com')) {
        const match = url.match(/github\.com\/[^\/]+\/([^\/]+)/);
        return match ? match[1].replace(/[-_]/g, ' ') + ' Project' : 'GitHub Project';
    }
    
    // Documentation sites
    if (domain.includes('docs.') || title.includes('documentation')) {
        return 'Documentation';
    }
    
    // Development sites
    if (domain.includes('stackoverflow') || domain.includes('medium.com') || domain.includes('dev.to')) {
        return 'Development';
    }
    
    // React-related
    if (title.includes('react') || url.includes('react')) {
        return 'React Project';
    }
    
    // Default project based on domain
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + ' Research';
}

// ENTERPRISE: Success feedback system
function handleSuccessfulSave(captureData) {
    const primarySection = document.getElementById('primaryActionSection');
    const successFeedback = document.getElementById('successFeedback');
    const successProject = document.getElementById('successProject');
    const viewRelatedBtn = document.getElementById('viewRelatedBtn');
    
    // Update success message
    if (successProject) {
        successProject.textContent = `Organized in ${captureData.intelligence.project}`;
    }
    
    // Show success feedback
    if (successFeedback) {
        successFeedback.style.display = 'block';
        setTimeout(() => {
            successFeedback.style.display = 'none';
            
            // Update engagement level and show next interface elements
            updateUserEngagement();
        }, 3000);
    }
    
    // Handle related items button
    if (viewRelatedBtn) {
        viewRelatedBtn.onclick = () => {
            console.log('👀 View related items clicked');
            showRelatedItems(captureData);
        };
    }
    
    // Re-enable save button
    const saveCTA = document.getElementById('savePrimaryCTA');
    if (saveCTA) {
        saveCTA.disabled = false;
        saveCTA.style.opacity = '1';
    }
    
    // Reload content to show new item
    loadCapturedContent();
}

// ENTERPRISE: Update user engagement and interface
async function updateUserEngagement() {
    // Recalculate engagement level
    await initializeProgressiveDisclosure();
    
    // Update interface visibility
    updateInterfaceVisibility();
    
    // Initialize advanced features if newly unlocked
    if (userEngagementLevel >= 2) {
        initializeAdvancedFeatures();
    }
}

// ENTERPRISE: Initialize advanced features for engaged users
function initializeAdvancedFeatures() {
    console.log('🎯 Initializing advanced features...');
    
    // Initialize search functionality
    initializeSearch();
    
    // Initialize filters  
    initializeFilters();
    
    // Initialize context tabs
    initializeContextTabs();
    
    // Add event listeners for advanced actions
    addAdvancedEventListeners();
}

// ENTERPRISE: Context-aware tabs functionality
function initializeContextTabs() {
    const contextTabs = document.querySelectorAll('.context-tab');
    
    contextTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Update active state
            contextTabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            const context = e.target.dataset.context;
            console.log('📍 Context switched to:', context);
            
            // Apply context-based filtering
            applyContextFilter(context);
        });
    });
}

// ENTERPRISE: Context-based content filtering
function applyContextFilter(context) {
    let filteredContent = capturedContent;
    
    if (context === 'page') {
        // Show items from same URL
        filteredContent = capturedContent.filter(item => 
            item.url === currentPageInfo.url || 
            item.pageUrl === currentPageInfo.url
        );
    } else if (context === 'domain') {
        // Show items from same domain
        filteredContent = capturedContent.filter(item => {
            const itemDomain = item.intelligence?.domain || 
                               (item.url ? new URL(item.url).hostname : '') ||
                               (item.pageUrl ? new URL(item.pageUrl).hostname : '');
            return itemDomain === currentPageInfo.domain;
        });
    }
    // context === 'all' shows everything (no filtering)
    
    // Update tab counts
    updateContextTabCounts();
    
    // Display filtered content
    displayContent(filteredContent);
}

// ENTERPRISE: Update context tab counts
function updateContextTabCounts() {
    const pageCount = document.getElementById('pageCount');
    const domainCount = document.getElementById('domainCount');
    const allCount = document.getElementById('allCount');
    
    // Count items for each context
    const pageItems = capturedContent.filter(item => 
        item.url === currentPageInfo.url || item.pageUrl === currentPageInfo.url
    ).length;
    
    const domainItems = capturedContent.filter(item => {
        const itemDomain = item.intelligence?.domain || 
                          (item.url ? new URL(item.url).hostname : '') ||
                          (item.pageUrl ? new URL(item.pageUrl).hostname : '');
        return itemDomain === currentPageInfo.domain;
    }).length;
    
    if (pageCount) pageCount.textContent = pageItems;
    if (domainCount) domainCount.textContent = domainItems;
    if (allCount) allCount.textContent = capturedContent.length;
}

// ENTERPRISE: Show related items functionality
function showRelatedItems(captureData) {
    const relatedItems = capturedContent.filter(item => 
        item.id !== captureData.id && (
            item.intelligence?.project === captureData.intelligence?.project ||
            item.intelligence?.domain === captureData.intelligence?.domain
        )
    ).slice(0, 3);
    
    console.log('🔗 Found related items:', relatedItems);
    
    // Switch to appropriate context and display
    if (relatedItems.length > 0) {
        // Show domain context
        const domainTab = document.getElementById('domainTab');
        if (domainTab) {
            domainTab.click();
        }
    }
}

// ENTERPRISE: Advanced event listeners
function addAdvancedEventListeners() {
    // View all button
    const viewAllBtn = document.getElementById('viewAllBtn');
    viewAllBtn?.addEventListener('click', () => {
        console.log('📚 View all clicked');
        // Switch to all context
        const allTab = document.getElementById('allTab');
        if (allTab) {
            allTab.click();
        }
    });
}

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

// ENTERPRISE: Load captured content from unified storage
async function loadCapturedContent() {
    try {
        const result = await chrome.storage.local.get(['capturedContent']);
        capturedContent = result.capturedContent || [];
        
        console.log(`📦 Loaded ${capturedContent.length} captured items`);
        
        // Update context tab counts if advanced features are available
        if (userEngagementLevel >= 2) {
            updateContextTabCounts();
        }
        
        // Display content based on current interface level
        if (userEngagementLevel === 0) {
            // First visit - don't show content, just the CTA
            return;
        } else {
            displayContent(capturedContent);
        }
        
    } catch (error) {
        console.error('❌ Failed to load content:', error);
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
    try {
        console.log('🔨 Creating card for:', item.type, item.id);
        const card = document.createElement('div');
        card.className = 'content-card';
        card.dataset.id = item.id || 'unknown';
        card.dataset.type = item.type || 'unknown';
    
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
                ${item.imageData ? 
                    `<div class="screenshot-thumbnail">
                        <img src="${item.imageData}" alt="Screenshot" />
                    </div>` : 
                    `<div class="image-placeholder">
                        <span class="image-icon">🖼️</span>
                        <span class="image-text">Screenshot</span>
                    </div>`
                }
                <h4 class="card-title">${item.title || 'Page Screenshot'}</h4>
                <p class="card-source">From: ${item.url ? new URL(item.url).hostname : 'Unknown'}</p>
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
    } catch (error) {
        console.error('❌ Error creating card:', error);
        // Return simple error card
        const errorCard = document.createElement('div');
        errorCard.className = 'content-card error-card';
        errorCard.innerHTML = `
            <div class="card-header">
                <div class="card-type">
                    <span class="type-icon">⚠️</span>
                    <span class="type-label">Error</span>
                </div>
            </div>
            <p class="card-preview">Error loading item: ${item.id}</p>
        `;
        return errorCard;
    }
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
    
    // Create modal content
    const modalContent = `
        <div class="content-detail-modal">
            <div class="detail-header">
                <h2>${item.title || item.pageTitle || 'Captured Content'}</h2>
                <button class="close-modal">✕</button>
            </div>
            <div class="detail-body">
                <div class="detail-meta">
                    <span class="detail-type">${item.type}</span>
                    <span class="detail-time">${formatTimeAgo(new Date(item.timestamp))}</span>
                    <span class="detail-source">${item.url || item.pageUrl}</span>
                </div>
                ${item.type === 'screenshot' && item.imageData ? 
                    `<div class="detail-image"><img src="${item.imageData}" alt="Screenshot" /></div>` : ''}
                <div class="detail-content">
                    <pre>${item.content || 'No content'}</pre>
                </div>
                ${item.intelligence ? `
                    <div class="detail-tags">
                        <span class="tag">#${item.intelligence.contentType}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeContentDetail();
    });
    
    // Close on close button click
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeContentDetail);
    }
}

function closeContentDetail() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        document.body.removeChild(modal);
    }
}

async function deleteCapture(itemId) {
    if (!confirm('Delete this capture? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Remove from chrome storage
        await chrome.storage.local.remove(itemId);
        
        // Remove from current content array
        capturedContent = capturedContent.filter(item => item.id !== itemId);
        
        // Refresh display
        displayContent(capturedContent);
        
        showNotification('Capture deleted successfully', 'success');
        console.log('✅ Deleted capture:', itemId);
        
    } catch (error) {
        console.error('❌ Failed to delete capture:', error);
        showNotification('Failed to delete capture', 'error');
    }
}

function editCapture(item) {
    console.log('✏️ Editing capture:', item.id);
    
    // Simple inline editing - create editable content
    const card = document.querySelector(`[data-id="${item.id}"]`);
    if (!card) return;
    
    const titleElement = card.querySelector('.card-title');
    const previewElement = card.querySelector('.card-preview');
    
    if (titleElement) {
        const currentTitle = titleElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.className = 'edit-title-input';
        input.style.cssText = `
            width: 100%;
            border: 1px solid #ddd;
            padding: 4px;
            font-size: 13px;
            border-radius: 3px;
        `;
        
        input.addEventListener('blur', () => saveEdit(item.id, 'title', input.value));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveEdit(item.id, 'title', input.value);
            } else if (e.key === 'Escape') {
                titleElement.textContent = currentTitle;
                titleElement.style.display = 'block';
                input.remove();
            }
        });
        
        titleElement.style.display = 'none';
        titleElement.parentNode.insertBefore(input, titleElement);
        input.focus();
        input.select();
    }
}

async function saveEdit(itemId, field, newValue) {
    try {
        // Get current item from storage
        const result = await chrome.storage.local.get(itemId);
        const item = result[itemId];
        
        if (item) {
            // Update the field
            item[field] = newValue;
            
            // Save back to storage
            await chrome.storage.local.set({ [itemId]: item });
            
            // Update local array
            const index = capturedContent.findIndex(c => c.id === itemId);
            if (index !== -1) {
                capturedContent[index][field] = newValue;
            }
            
            // Refresh display
            displayContent(capturedContent);
            
            showNotification('Changes saved', 'success');
        }
    } catch (error) {
        console.error('❌ Failed to save edit:', error);
        showNotification('Failed to save changes', 'error');
    }
}

function handleCardAction(action, item, event) {
    console.log(`🎯 Card action: ${action} for item:`, item.id);
    
    switch(action) {
        case 'view':
            openContentDetail(item);
            break;
        case 'edit':
            editCapture(item);
            break;
        case 'delete':
            deleteCapture(item.id);
            break;
        default:
            console.warn('Unknown card action:', action);
    }
}

function performSearch(query) {
    console.log('🔍 Performing search:', query);
    
    if (!query || query.trim() === '') {
        // If no query, show all content
        displayContent(capturedContent);
        return;
    }
    
    const searchTerm = query.toLowerCase().trim();
    
    const searchResults = capturedContent.filter(item => {
        // Search across multiple fields
        const searchText = [
            item.title || '',
            item.pageTitle || '',
            item.content || '',
            item.url || '',
            item.pageUrl || '',
            item.intelligence?.contentType || '',
            item.type || ''
        ].join(' ').toLowerCase();
        
        return searchText.includes(searchTerm);
    });
    
    // Display search results
    displayContent(searchResults);
    
    // Show search status
    if (searchResults.length === 0) {
        showNotification(`No results found for "${query}"`, 'info');
    } else {
        showNotification(`Found ${searchResults.length} results for "${query}"`, 'success');
    }
}

function applyFilter(filter) {
    console.log('📊 Applying filter:', filter);
    
    let filteredContent;
    
    switch(filter) {
        case 'all':
            filteredContent = capturedContent;
            break;
        case 'notes':
            filteredContent = capturedContent.filter(item => 
                ['text', 'page', 'research'].includes(item.type)
            );
            break;
        case 'snippets':
            filteredContent = capturedContent.filter(item => 
                item.type === 'text' && item.intelligence?.contentType === 'code'
            );
            break;
        case 'images':
            filteredContent = capturedContent.filter(item => 
                ['image', 'screenshot'].includes(item.type)
            );
            break;
        default:
            filteredContent = capturedContent;
    }
    
    // Update filter button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    // Display filtered content
    displayContent(filteredContent);
    
    // Show filter status
    const count = filteredContent.length;
    const filterLabel = filter.charAt(0).toUpperCase() + filter.slice(1);
    showNotification(`${filterLabel}: ${count} items`, 'info');
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
    
    // Card action handlers (delegated event handling for dynamic content)
    document.addEventListener('click', (e) => {
        if (e.target.matches('.card-action')) {
            e.stopPropagation();
            const action = e.target.dataset.action;
            const card = e.target.closest('.content-card');
            const itemId = card?.dataset.id;
            
            if (itemId) {
                const item = capturedContent.find(item => item.id === itemId);
                if (item) {
                    handleCardAction(action, item, e);
                }
            }
        }
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