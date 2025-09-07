/**
 * Quaeli 2025 PRD-Compliant Sidepanel Controller
 * Progressive disclosure, micro-interactions, and behavioral psychology
 */

class Quaeli2025Sidepanel {
    constructor() {
        this.userEngagementLevel = 0; // 0-1: Giant CTA only, 2+: Tabs, 3+: Power features
        this.saveCount = 0;
        this.currentTab = 'recent';
        this.panelWidth = 'default'; // compact, default, wide
        this.theme = 'light';
        this.isInitialized = false;
        
        // Element references
        this.elements = {};
        
        // Data
        this.capturedContent = [];
        this.projects = [];
        this.currentPageInfo = { title: '', url: '', domain: '' };
        
        // Features
        this.contextEngine = null;
        this.knowledgeDigest = null;
        this.workflowAutomation = null;
        
        // State management
        this.state = {
            activeLevel: 0,
            currentTab: 'recent',
            searchQuery: '',
            selectedFilter: 'all',
            showingOverlay: null
        };
    }

    /**
     * Initialize the 2025 sidepanel
     */
    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Initializing Quaeli 2025 PRD-compliant sidepanel...');
        
        try {
            // Cache DOM elements
            this.cacheElements();
            
            // Load user data and determine engagement level
            await this.loadUserData();
            
            // Initialize features based on availability
            this.initializeFeatures();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Apply progressive disclosure
            this.applyProgressiveDisclosure();
            
            // Get current page context
            await this.updateCurrentPageContext();
            
            // Load content
            await this.loadContent();
            
            // Apply saved preferences
            this.applyUserPreferences();
            
            this.isInitialized = true;
            console.log('✅ Quaeli 2025 sidepanel initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing sidepanel:', error);
        }
    }

    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        this.elements = {
            // Header elements
            statusChip: document.getElementById('statusChip'),
            projectAvatar: document.getElementById('projectAvatar'),
            
            // Main sections
            level01Section: document.getElementById('level01Section'),
            level2PlusSection: document.getElementById('level2PlusSection'),
            level3PlusSection: document.getElementById('level3PlusSection'),
            
            // Giant CTA
            giantCTA: document.getElementById('giantCTA'),
            
            // Navigation
            navTabs: document.getElementById('navTabs'),
            tabContents: {
                recent: document.getElementById('recentContent'),
                projects: document.getElementById('projectsContent'),
                search: document.getElementById('searchContent')
            },
            
            // Content areas
            recentGrid: document.getElementById('recentGrid'),
            projectsGrid: document.getElementById('projectsGrid'),
            searchResults: document.getElementById('searchResults'),
            
            // Footer
            ctaFooter: document.getElementById('ctaFooter'),
            footerCTA: document.getElementById('footerCTA'),
            currentPageTitle: document.getElementById('currentPageTitle'),
            pageFavicon: document.getElementById('pageFavicon'),
            domainChip: document.getElementById('domainChip'),
            
            // Overlays
            overlayContainer: document.getElementById('overlayContainer'),
            successOverlay: document.getElementById('successOverlay'),
            duplicatePopup: document.getElementById('duplicatePopup'),
            projectPopup: document.getElementById('projectPopup'),
            
            // Search
            searchInput: document.getElementById('searchInput'),
            searchClear: document.getElementById('searchClear'),
            
            // Badges
            recentBadge: document.getElementById('recentBadge'),
            projectsBadge: document.getElementById('projectsBadge')
        };
    }

    /**
     * Load user data and determine engagement level
     */
    async loadUserData() {
        try {
            // Load captured content count
            const result = await chrome.storage.local.get(null);
            this.saveCount = Object.keys(result).filter(key => key.startsWith('capture_')).length;
            
            // Determine engagement level based on 2025 PRD specifications
            if (this.saveCount === 0) {
                this.userEngagementLevel = 0; // First-time user
            } else if (this.saveCount === 1) {
                this.userEngagementLevel = 1; // Just made first save
            } else if (this.saveCount < 5) {
                this.userEngagementLevel = 2; // Activated user - show tabs
            } else {
                this.userEngagementLevel = 3; // Power user - show all features
            }
            
            // Load user preferences
            const prefs = await chrome.storage.local.get(['userPreferences']);
            if (prefs.userPreferences) {
                this.panelWidth = prefs.userPreferences.panelWidth || 'default';
                this.theme = prefs.userPreferences.theme || 'light';
            }
            
            console.log(`📊 User engagement level: ${this.userEngagementLevel} (${this.saveCount} saves)`);
            
        } catch (error) {
            console.error('Error loading user data:', error);
            this.userEngagementLevel = 0; // Safe default
        }
    }

    /**
     * Initialize features based on availability
     */
    initializeFeatures() {
        // Context Engine for smart suggestions
        if (typeof ContextEngine !== 'undefined') {
            this.contextEngine = new ContextEngine();
            console.log('✅ Context Engine initialized');
        }
        
        // Knowledge Digest for AI summaries
        if (typeof KnowledgeDigest !== 'undefined') {
            this.knowledgeDigest = new KnowledgeDigest();
            console.log('✅ Knowledge Digest initialized');
        }
        
        // Workflow Automation
        if (typeof WorkflowAutomation !== 'undefined') {
            this.workflowAutomation = new WorkflowAutomation();
            this.workflowAutomation.loadRulesFromStorage();
            console.log('✅ Workflow Automation initialized');
        }
    }

    /**
     * Set up event listeners for 2025 PRD interactions
     */
    setupEventListeners() {
        // Giant CTA (Level 0-1)
        this.elements.giantCTA?.addEventListener('click', this.handleGiantCTAClick.bind(this));
        
        // Footer CTA (persistent)
        this.elements.footerCTA?.addEventListener('click', this.handleFooterCTAClick.bind(this));
        
        // Navigation tabs (Level 2+)
        this.elements.navTabs?.addEventListener('click', this.handleNavTabClick.bind(this));
        
        // Header actions
        document.querySelectorAll('.header-btn').forEach(btn => {
            btn.addEventListener('click', this.handleHeaderAction.bind(this));
        });
        
        // Search functionality
        this.elements.searchInput?.addEventListener('input', this.handleSearchInput.bind(this));
        this.elements.searchClear?.addEventListener('click', this.handleSearchClear.bind(this));
        
        // Filter chips
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', this.handleFilterClick.bind(this));
        });
        
        // Customization controls (Level 3+)
        document.querySelectorAll('.width-btn').forEach(btn => {
            btn.addEventListener('click', this.handleWidthChange.bind(this));
        });
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', this.handleThemeChange.bind(this));
        });
        
        // Power user tabs (Level 3+)
        document.querySelectorAll('.power-tab').forEach(tab => {
            tab.addEventListener('click', this.handlePowerTabClick.bind(this));
        });
        
        // Success overlay actions
        document.getElementById('viewRelatedBtn')?.addEventListener('click', this.handleViewRelated.bind(this));
        document.getElementById('continueBtn')?.addEventListener('click', this.handleContinueSaving.bind(this));
        
        // Listen for Chrome extension messages
        if (chrome.runtime?.onMessage) {
            chrome.runtime.onMessage.addListener(this.handleRuntimeMessage.bind(this));
        }
    }

    /**
     * Apply progressive disclosure based on engagement level
     * Core 2025 PRD requirement
     */
    applyProgressiveDisclosure() {
        const { level01Section, level2PlusSection, level3PlusSection, ctaFooter } = this.elements;
        
        console.log(`🔄 Applying progressive disclosure for level ${this.userEngagementLevel}`);
        
        // Reset all sections
        level01Section?.classList.remove('active');
        level2PlusSection?.classList.remove('active', 'progressive-reveal');
        level3PlusSection?.classList.remove('active', 'progressive-reveal');
        
        if (this.userEngagementLevel <= 1) {
            // LEVEL 0-1: Show ONLY giant CTA, hide footer CTA to avoid confusion
            level01Section.style.display = 'flex';
            level2PlusSection.style.display = 'none';
            level3PlusSection.style.display = 'none';
            
            // Hide footer CTA - giant CTA is the only action
            if (ctaFooter) {
                ctaFooter.style.display = 'none';
            }
            
            // Update CTA text based on level
            if (this.userEngagementLevel === 1) {
                this.showSuccessFeedback();
            }
            
        } else if (this.userEngagementLevel === 2) {
            // LEVEL 2: Show tabs, show footer CTA (giant CTA is gone)
            level01Section.style.display = 'none';
            level2PlusSection.style.display = 'flex';
            level3PlusSection.style.display = 'none';
            
            // Show footer CTA now that giant CTA is hidden
            if (ctaFooter) {
                ctaFooter.style.display = 'flex';
            }
            
            // Animate tabs in
            setTimeout(() => {
                level2PlusSection.classList.add('progressive-reveal', 'active');
            }, 100);
            
        } else {
            // LEVEL 3+: Show all features with footer CTA
            level01Section.style.display = 'none';
            level2PlusSection.style.display = 'flex';
            level3PlusSection.style.display = 'block';
            
            // Show footer CTA for quick access
            if (ctaFooter) {
                ctaFooter.style.display = 'flex';
            }
            
            // Animate sections in
            setTimeout(() => {
                level2PlusSection.classList.add('progressive-reveal', 'active');
                level3PlusSection.classList.add('progressive-reveal', 'active');
            }, 100);
        }
        
        this.state.activeLevel = this.userEngagementLevel;
    }

    /**
     * Handle giant CTA click (Level 0-1)
     */
    async handleGiantCTAClick(event) {
        event.preventDefault();
        console.log('🎯 Giant CTA clicked');
        
        // Add micro-interaction
        this.elements.giantCTA.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.elements.giantCTA.style.transform = '';
        }, 150);
        
        await this.saveCurrentPage();
    }

    /**
     * Handle footer CTA click (persistent)
     */
    async handleFooterCTAClick(event) {
        event.preventDefault();
        console.log('💾 Footer CTA clicked');
        
        await this.saveCurrentPage();
    }

    /**
     * Save current page with 2025 PRD feedback
     */
    async saveCurrentPage() {
        try {
            // Get current tab info
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) return;
            
            // Create capture data
            const captureData = {
                id: `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'page',
                title: tab.title,
                url: tab.url,
                content: tab.title,
                timestamp: new Date().toISOString(),
                intelligence: {
                    contentType: 'page',
                    project: this.detectSmartProject(tab),
                    domain: this.extractDomain(tab.url)
                }
            };
            
            // Save to storage
            await chrome.storage.local.set({ [captureData.id]: captureData });
            
            // Update save count and engagement level
            this.saveCount++;
            const previousLevel = this.userEngagementLevel;
            this.updateEngagementLevel();
            
            // Trigger workflow automation
            if (this.workflowAutomation) {
                await this.workflowAutomation.processTrigger('content_saved', { content: captureData });
            }
            
            // Show success feedback with animation
            this.showSuccessOverlay(captureData);
            
            // If engagement level changed, apply new disclosure
            if (this.userEngagementLevel !== previousLevel) {
                setTimeout(() => {
                    this.applyProgressiveDisclosure();
                }, 1500); // After success overlay
            }
            
            // Reload content
            await this.loadContent();
            
            console.log('✅ Page saved successfully:', captureData.title);
            
        } catch (error) {
            console.error('❌ Error saving page:', error);
            this.showErrorFeedback('Failed to save page');
        }
    }

    /**
     * Update engagement level based on save count
     */
    updateEngagementLevel() {
        const previousLevel = this.userEngagementLevel;
        
        if (this.saveCount === 1) {
            this.userEngagementLevel = 1;
        } else if (this.saveCount < 5) {
            this.userEngagementLevel = 2;
        } else {
            this.userEngagementLevel = 3;
        }
        
        // Log level changes
        if (this.userEngagementLevel !== previousLevel) {
            console.log(`📈 Engagement level upgraded: ${previousLevel} → ${this.userEngagementLevel}`);
        }
    }

    /**
     * Show success overlay with celebration animation
     */
    showSuccessOverlay(captureData) {
        const overlay = this.elements.successOverlay;
        if (!overlay) return;
        
        // Update success message
        const projectName = captureData.intelligence?.project || 'General';
        const successMessage = document.getElementById('successMessage');
        if (successMessage) {
            successMessage.textContent = `Auto-organized in ${projectName}`;
        }
        
        // Show overlay with animation
        overlay.style.display = 'block';
        overlay.classList.add('show');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideSuccessOverlay();
        }, 3000);
    }

    /**
     * Hide success overlay
     */
    hideSuccessOverlay() {
        const overlay = this.elements.successOverlay;
        if (!overlay) return;
        
        overlay.classList.remove('show');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }

    /**
     * Handle navigation tab clicks (Level 2+)
     */
    handleNavTabClick(event) {
        const tab = event.target.closest('.nav-tab');
        if (!tab) return;
        
        const tabName = tab.dataset.tab;
        if (!tabName || tabName === this.currentTab) return;
        
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Switch tab content with animation
        this.switchTabContent(tabName);
        
        this.currentTab = tabName;
    }

    /**
     * Switch tab content with smooth animation
     */
    switchTabContent(newTab) {
        const currentContent = document.querySelector('.tab-content.active');
        const newContent = this.elements.tabContents[newTab];
        
        if (!newContent) return;
        
        // Fade out current content
        if (currentContent) {
            currentContent.classList.remove('active');
        }
        
        // Fade in new content
        setTimeout(() => {
            newContent.classList.add('active');
        }, 150);
        
        // Load content for the new tab
        this.loadTabContent(newTab);
    }

    /**
     * Load content for specific tab
     */
    async loadTabContent(tabName) {
        switch (tabName) {
            case 'recent':
                await this.loadRecentContent();
                break;
            case 'projects':
                await this.loadProjectsContent();
                break;
            case 'search':
                this.focusSearch();
                break;
        }
    }

    /**
     * Load recent content
     */
    async loadRecentContent() {
        try {
            const result = await chrome.storage.local.get(null);
            const content = Object.keys(result)
                .filter(key => key.startsWith('capture_'))
                .map(key => result[key])
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10); // Show latest 10
            
            this.renderContentGrid(content, this.elements.recentGrid);
            
            // Update badge
            if (this.elements.recentBadge) {
                this.elements.recentBadge.textContent = Math.min(content.length, 99).toString();
            }
            
        } catch (error) {
            console.error('Error loading recent content:', error);
        }
    }

    /**
     * Load projects content
     */
    async loadProjectsContent() {
        try {
            const result = await chrome.storage.local.get(null);
            const content = Object.keys(result)
                .filter(key => key.startsWith('capture_'))
                .map(key => result[key]);
            
            // Group by project
            const projects = {};
            content.forEach(item => {
                const project = item.intelligence?.project || 'General';
                if (!projects[project]) {
                    projects[project] = { name: project, items: [], lastUpdated: item.timestamp };
                }
                projects[project].items.push(item);
                if (new Date(item.timestamp) > new Date(projects[project].lastUpdated)) {
                    projects[project].lastUpdated = item.timestamp;
                }
            });
            
            this.renderProjectsGrid(Object.values(projects), this.elements.projectsGrid);
            
            // Update badge
            if (this.elements.projectsBadge) {
                this.elements.projectsBadge.textContent = Object.keys(projects).length.toString();
            }
            
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }

    /**
     * Render content grid with cards
     */
    renderContentGrid(items, container) {
        if (!container) return;
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📄</div>
                    <h3 class="empty-title">No content yet</h3>
                    <p class="empty-description">Save your first piece of content to get started!</p>
                </div>
            `;
            return;
        }
        
        const cardsHTML = items.map((item, index) => `
            <div class="content-card" style="animation-delay: ${index * 50}ms" data-id="${item.id}">
                <div class="card-header">
                    <div class="card-type">
                        <span class="type-icon">${this.getTypeIcon(item.type)}</span>
                        <span class="type-label">${this.getTypeName(item.type)}</span>
                    </div>
                    <div class="card-meta">
                        <span class="card-time">${this.formatTime(item.timestamp)}</span>
                    </div>
                </div>
                <h4 class="card-title">${item.title || 'Untitled'}</h4>
                <p class="card-preview">${(item.content || '').substring(0, 100)}...</p>
                <div class="card-footer">
                    <span class="card-project">${item.intelligence?.project || 'General'}</span>
                    <div class="card-actions">
                        <button class="card-action button-micro" data-action="view" title="View">👁️</button>
                        <button class="card-action button-micro" data-action="edit" title="Edit">✏️</button>
                        <button class="card-action button-micro" data-action="delete" title="Delete">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = cardsHTML;
        
        // Set up card action handlers
        container.querySelectorAll('.card-action').forEach(btn => {
            btn.addEventListener('click', this.handleCardAction.bind(this));
        });
    }

    /**
     * Render projects grid
     */
    renderProjectsGrid(projects, container) {
        if (!container) return;
        
        if (projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🚀</div>
                    <h3 class="empty-title">No projects yet</h3>
                    <p class="empty-description">Projects are automatically created as you save related content</p>
                </div>
            `;
            return;
        }
        
        const projectsHTML = projects.map(project => `
            <div class="project-card">
                <div class="project-header">
                    <div class="project-icon">${this.getProjectIcon(project.name)}</div>
                    <h4 class="project-title">${project.name}</h4>
                </div>
                <div class="project-stats">
                    <span class="project-count">${project.items.length} items</span>
                    <span class="project-updated">${this.formatTime(project.lastUpdated)}</span>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = projectsHTML;
    }

    /**
     * Handle card actions
     */
    handleCardAction(event) {
        event.stopPropagation();
        const action = event.target.dataset.action;
        const cardElement = event.target.closest('.content-card');
        const itemId = cardElement?.dataset.id;
        
        if (!itemId) return;
        
        switch (action) {
            case 'view':
                this.viewContentItem(itemId);
                break;
            case 'edit':
                this.editContentItem(itemId);
                break;
            case 'delete':
                this.deleteContentItem(itemId);
                break;
        }
    }

    /**
     * Update current page context in footer
     */
    async updateCurrentPageContext() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) return;
            
            this.currentPageInfo = {
                title: tab.title || '',
                url: tab.url || '',
                domain: this.extractDomain(tab.url || '')
            };
            
            // Update footer elements
            if (this.elements.currentPageTitle) {
                this.elements.currentPageTitle.textContent = tab.title || 'Ready to save';
            }
            
            if (this.elements.pageFavicon) {
                this.elements.pageFavicon.src = `chrome://favicon/${tab.url}`;
                this.elements.pageFavicon.style.display = 'inline-block';
            }
            
            if (this.elements.domainChip && this.currentPageInfo.domain) {
                this.elements.domainChip.textContent = this.currentPageInfo.domain;
                this.elements.domainChip.style.display = 'inline-flex';
            }
            
        } catch (error) {
            console.error('Error updating page context:', error);
        }
    }

    /**
     * Load all content data
     */
    async loadContent() {
        await this.loadRecentContent();
        await this.loadProjectsContent();
    }

    /**
     * Apply user preferences
     */
    applyUserPreferences() {
        // Apply panel width
        const container = document.querySelector('.sidepanel-container');
        if (container) {
            container.classList.remove('compact', 'wide');
            if (this.panelWidth !== 'default') {
                container.classList.add(this.panelWidth);
            }
        }
        
        // Apply theme
        if (this.theme === 'dark') {
            document.body.classList.add('dark-theme');
        }
        
        // Update UI controls
        document.querySelectorAll('.width-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.width === (this.panelWidth === 'default' ? '380' : this.panelWidth === 'compact' ? '320' : '520'));
        });
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.theme);
        });
    }

    // Utility methods
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return '';
        }
    }

    detectSmartProject(tab) {
        const domain = this.extractDomain(tab.url || '');
        const title = (tab.title || '').toLowerCase();
        
        if (domain.includes('github.com')) {
            const match = tab.url.match(/github\.com\/[^\/]+\/([^\/]+)/);
            return match ? `${match[1]} Project` : 'GitHub Project';
        }
        
        if (title.includes('react')) return 'React Development';
        if (title.includes('vue')) return 'Vue Development';
        if (title.includes('angular')) return 'Angular Development';
        if (domain.includes('docs.')) return 'Documentation';
        if (domain.includes('stackoverflow')) return 'Problem Solving';
        
        return 'General Research';
    }

    getTypeIcon(type) {
        const icons = {
            page: '📄',
            text: '📝',
            link: '🔗',
            image: '🖼️',
            screenshot: '📸',
            code: '💻'
        };
        return icons[type] || '📄';
    }

    getTypeName(type) {
        const names = {
            page: 'Page',
            text: 'Note',
            link: 'Link',
            image: 'Image',
            screenshot: 'Screenshot',
            code: 'Code'
        };
        return names[type] || 'Content';
    }

    getProjectIcon(projectName) {
        if (projectName.includes('React')) return '⚛️';
        if (projectName.includes('Vue')) return '💚';
        if (projectName.includes('Angular')) return '🔺';
        if (projectName.includes('GitHub')) return '🐙';
        if (projectName.includes('Documentation')) return '📚';
        return '🚀';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    }

    // Placeholder methods for future implementation
    handleHeaderAction(event) {
        const action = event.target.dataset.action;
        console.log(`Header action: ${action}`);
    }

    handleSearchInput(event) {
        const query = event.target.value;
        console.log(`Search: ${query}`);
        // Implement search functionality
    }

    handleSearchClear() {
        this.elements.searchInput.value = '';
        console.log('Search cleared');
    }

    handleFilterClick(event) {
        const filter = event.target.dataset.filter;
        console.log(`Filter: ${filter}`);
        // Implement filter functionality
    }

    handleWidthChange(event) {
        const width = event.target.dataset.width;
        console.log(`Width change: ${width}`);
        // Implement width change
    }

    handleThemeChange(event) {
        const theme = event.target.dataset.theme;
        console.log(`Theme change: ${theme}`);
        // Implement theme change
    }

    handlePowerTabClick(event) {
        const tab = event.target.closest('.power-tab');
        const tabName = tab?.dataset.tab;
        console.log(`Power tab: ${tabName}`);
    }

    handleViewRelated() {
        console.log('View related clicked');
        this.hideSuccessOverlay();
    }

    handleContinueSaving() {
        console.log('Continue saving clicked');
        this.hideSuccessOverlay();
    }

    handleRuntimeMessage(message, sender, sendResponse) {
        console.log('Runtime message received:', message);
    }

    viewContentItem(itemId) {
        console.log(`View content: ${itemId}`);
    }

    editContentItem(itemId) {
        console.log(`Edit content: ${itemId}`);
    }

    deleteContentItem(itemId) {
        console.log(`Delete content: ${itemId}`);
    }

    focusSearch() {
        this.elements.searchInput?.focus();
    }

    showErrorFeedback(message) {
        console.error('Error feedback:', message);
    }

    showSuccessFeedback() {
        // Update giant CTA for level 1 users
        const headline = document.querySelector('.cta-headline');
        const subtext = document.querySelector('.cta-subtext');
        
        if (headline && this.userEngagementLevel === 1) {
            headline.textContent = 'Great! Keep going';
            subtext.textContent = 'Build your knowledge base';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const sidepanel = new Quaeli2025Sidepanel();
    await sidepanel.init();
    
    // Make available globally for debugging
    window.Quaeli2025 = sidepanel;
});