/**
 * Quaeli Premium Sidepanel Controller
 * Enterprise-grade progressive disclosure with behavioral psychology
 */

class QuaeliPremium {
    constructor() {
        this.currentLevel = 0;
        this.engagementMetrics = {
            savesCount: 0,
            streakDays: 0,
            totalProjects: 0,
            weeklyActivity: 0,
            lastActiveDate: null
        };
        this.aiSuggestions = {
            enabled: true,
            confidence: 0.8,
            lastSuggestion: null
        };
        this.duplicateDetection = {
            enabled: true,
            threshold: 0.9
        };
        
        this.init();
    }

    async init() {
        await this.loadEngagementData();
        await this.determineDisclosureLevel();
        this.bindEvents();
        this.setupAnimations();
        this.initializeAI();
    }

    async loadEngagementData() {
        try {
            const result = await chrome.storage.local.get(['engagementMetrics', 'capturedContent']);
            
            if (result.engagementMetrics) {
                this.engagementMetrics = { ...this.engagementMetrics, ...result.engagementMetrics };
            }

            if (result.capturedContent) {
                this.engagementMetrics.savesCount = result.capturedContent.length;
                this.engagementMetrics.totalProjects = this.calculateProjectCount(result.capturedContent);
            }

            this.calculateWeeklyActivity();
            this.updateStreak();
        } catch (error) {
            console.error('Failed to load engagement data:', error);
        }
    }

    calculateProjectCount(content) {
        const projects = new Set();
        content.forEach(item => {
            if (item.project) {
                projects.add(item.project);
            }
        });
        return projects.size || 1; // Default to 1 if no projects detected
    }

    calculateWeeklyActivity() {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        chrome.storage.local.get('capturedContent').then(result => {
            if (result.capturedContent) {
                this.engagementMetrics.weeklyActivity = result.capturedContent.filter(
                    item => new Date(item.timestamp).getTime() > oneWeekAgo
                ).length;
            }
        });
    }

    updateStreak() {
        const today = new Date().toDateString();
        const lastActive = this.engagementMetrics.lastActiveDate;
        
        if (lastActive === today) {
            return; // Already counted today
        }

        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        
        if (lastActive === yesterday) {
            this.engagementMetrics.streakDays += 1;
        } else if (lastActive !== today) {
            this.engagementMetrics.streakDays = 1; // Start new streak
        }

        this.engagementMetrics.lastActiveDate = today;
        this.saveEngagementData();
    }

    async saveEngagementData() {
        await chrome.storage.local.set({ engagementMetrics: this.engagementMetrics });
    }

    async determineDisclosureLevel() {
        const { savesCount, streakDays, totalProjects } = this.engagementMetrics;
        
        // Level 0: First-time or very low engagement
        if (savesCount === 0) {
            this.currentLevel = 0;
        }
        // Level 1: First success celebration
        else if (savesCount === 1) {
            this.currentLevel = 1;
        }
        // Level 2-4: Organized intelligence
        else if (savesCount >= 2 && savesCount < 25) {
            this.currentLevel = 2;
        }
        // Level 3+: Power user interface
        else if (savesCount >= 25 || streakDays >= 7 || totalProjects >= 3) {
            this.currentLevel = 3;
        }

        this.showDisclosureLevel(this.currentLevel);
        this.trackLevelProgression();
    }

    showDisclosureLevel(level) {
        // Hide all levels
        document.querySelectorAll('.disclosure-level').forEach(el => {
            el.classList.remove('active');
        });

        // Show appropriate level
        let targetElement;
        switch (level) {
            case 0:
                targetElement = document.getElementById('level-0');
                break;
            case 1:
                targetElement = document.getElementById('level-1');
                this.celebrateFirstSave();
                break;
            case 2:
                targetElement = document.getElementById('level-2-4');
                this.setupOrganizedIntelligence();
                break;
            case 3:
            default:
                targetElement = document.getElementById('level-3-plus');
                this.setupPowerUserInterface();
                break;
        }

        if (targetElement) {
            targetElement.classList.add('active');
            this.animateEntrance(targetElement);
        }
    }

    animateEntrance(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateX(20px)';
        
        requestAnimationFrame(() => {
            element.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            element.style.opacity = '1';
            element.style.transform = 'translateX(0)';
        });
    }

    bindEvents() {
        // Level 0 Events
        const savePageCta = document.getElementById('save-page-cta');
        if (savePageCta) {
            savePageCta.addEventListener('click', () => this.handleQuickSave());
        }

        // Level 1 Events
        const continueSaving = document.getElementById('continue-saving');
        if (continueSaving) {
            continueSaving.addEventListener('click', () => this.advanceToLevel2());
        }

        // Level 2-4 Events
        this.bindTabNavigation();
        this.bindSmartSuggestions();

        // Level 3+ Events
        this.bindAdvancedFeatures();

        // Global Events
        this.bindModalEvents();
        this.bindKeyboardShortcuts();
    }

    bindTabNavigation() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Show/hide content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });

        const targetSection = document.getElementById(`${tabName}-tab`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // Load content for active tab
        this.loadTabContent(tabName);
    }

    async loadTabContent(tabName) {
        switch (tabName) {
            case 'recent':
                await this.loadRecentContent();
                break;
            case 'search':
                this.focusSearch();
                break;
            case 'analytics':
                await this.loadAnalytics();
                break;
            default:
                break;
        }
    }

    async loadRecentContent() {
        try {
            const result = await chrome.storage.local.get('capturedContent');
            const content = result.capturedContent || [];
            
            const recentList = document.getElementById('recent-content');
            if (recentList) {
                recentList.innerHTML = this.renderRecentItems(
                    content.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10)
                );
            }
        } catch (error) {
            console.error('Failed to load recent content:', error);
        }
    }

    renderRecentItems(items) {
        return items.map(item => `
            <div class="content-card premium" data-id="${item.id}">
                <div class="card-content">
                    <div class="content-icon">${this.getContentIcon(item.type)}</div>
                    <div class="content-info">
                        <h4 class="content-title text-body-lg">${this.truncateText(item.title || item.pageTitle || 'Untitled', 40)}</h4>
                        <p class="content-preview text-body">${this.truncateText(item.content || '', 60)}</p>
                        <div class="content-meta">
                            <span class="text-caption">${this.formatTimestamp(item.timestamp)}</span>
                            ${item.project ? `<span class="project-badge">${item.project}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="action-btn view" data-action="view" title="View Details">👁️</button>
                    <button class="action-btn edit" data-action="edit" title="Edit">✏️</button>
                    <button class="action-btn delete" data-action="delete" title="Delete">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    getContentIcon(type) {
        const icons = {
            'text': '📝',
            'link': '🔗',
            'image': '📸',
            'screenshot': '📷',
            'page': '📄',
            'research': '🔬'
        };
        return icons[type] || '📄';
    }

    bindSmartSuggestions() {
        const acceptBtn = document.querySelector('.suggestion-btn.accept');
        const chooseBtn = document.querySelector('.suggestion-btn.choose');

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => this.acceptAISuggestion());
        }
        
        if (chooseBtn) {
            chooseBtn.addEventListener('click', () => this.showProjectSelector());
        }
    }

    async acceptAISuggestion() {
        const suggestion = this.aiSuggestions.lastSuggestion;
        if (suggestion) {
            await this.applyAISuggestion(suggestion);
            this.hideSmartSuggestion();
            this.showSuccessFeedback('Applied to Frontend Learning! 🎉');
        }
    }

    async applyAISuggestion(suggestion) {
        // Implementation would integrate with actual content management
        console.log('Applying AI suggestion:', suggestion);
        
        // Update engagement metrics
        this.engagementMetrics.aiAcceptanceRate = 
            (this.engagementMetrics.aiAcceptanceRate || 0) + 0.1;
        
        await this.saveEngagementData();
    }

    hideSmartSuggestion() {
        const suggestionEl = document.getElementById('smart-suggestion');
        if (suggestionEl) {
            suggestionEl.style.opacity = '0';
            suggestionEl.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                suggestionEl.style.display = 'none';
            }, 300);
        }
    }

    showSuccessFeedback(message) {
        const feedback = document.createElement('div');
        feedback.className = 'success-feedback';
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #059669, #34d399);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(5, 150, 105, 0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => feedback.remove(), 300);
        }, 3000);
    }

    bindAdvancedFeatures() {
        // Bulk selection
        const selectAll = document.getElementById('select-all');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                this.toggleBulkSelection(e.target.checked);
            });
        }

        // Advanced search
        const advancedSearch = document.getElementById('advanced-search');
        if (advancedSearch) {
            advancedSearch.addEventListener('input', (e) => {
                this.performAdvancedSearch(e.target.value);
            });
        }
    }

    bindModalEvents() {
        const modalClose = document.getElementById('modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        // Close modal on backdrop click
        document.getElementById('content-modal')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault();
                        this.focusSearch();
                        break;
                    case 's':
                        e.preventDefault();
                        this.handleQuickSave();
                        break;
                    case 'f':
                        e.preventDefault();
                        this.focusSearch();
                        break;
                }
            }

            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    async handleQuickSave() {
        try {
            // Get current tab info
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                this.showErrorFeedback('Unable to access current tab');
                return;
            }

            // Check for duplicates
            if (this.duplicateDetection.enabled) {
                const isDuplicate = await this.checkForDuplicate(tab.url);
                if (isDuplicate) {
                    this.showDuplicateModal(tab);
                    return;
                }
            }

            // Proceed with save
            await this.saveCurrentPage(tab);
            
            // Update engagement and advance level if appropriate
            this.engagementMetrics.savesCount += 1;
            await this.saveEngagementData();
            
            if (this.currentLevel === 0) {
                this.advanceToLevel1(tab);
            } else {
                this.showSuccessFeedback('Page saved successfully! ✨');
            }

            // Trigger AI suggestions for level 2+
            if (this.currentLevel >= 2) {
                this.generateAISuggestion(tab);
            }

        } catch (error) {
            console.error('Save failed:', error);
            this.showErrorFeedback('Failed to save page');
        }
    }

    async checkForDuplicate(url) {
        const result = await chrome.storage.local.get('capturedContent');
        const content = result.capturedContent || [];
        
        return content.some(item => 
            item.url === url || 
            item.pageUrl === url
        );
    }

    showDuplicateModal(tab) {
        const modal = document.getElementById('duplicate-modal');
        if (modal) {
            modal.classList.add('active');
            this.animateModal(modal);
        }
    }

    async saveCurrentPage(tab) {
        const capture = {
            id: `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'page',
            title: tab.title,
            pageTitle: tab.title,
            url: tab.url,
            pageUrl: tab.url,
            content: `Saved: ${tab.title}`,
            timestamp: new Date().toISOString(),
            intelligence: {
                contentType: this.detectContentType(tab.url, tab.title),
                domain: new URL(tab.url).hostname,
                saveContext: 'quick_save'
            },
            project: this.suggestProject(tab.url, tab.title)
        };

        const result = await chrome.storage.local.get('capturedContent');
        const content = result.capturedContent || [];
        content.push(capture);
        
        await chrome.storage.local.set({ capturedContent: content });
        return capture;
    }

    detectContentType(url, title) {
        const domain = new URL(url).hostname.toLowerCase();
        
        if (domain.includes('github.com')) return 'code';
        if (domain.includes('stackoverflow.com')) return 'code';
        if (domain.includes('documentation') || domain.includes('docs')) return 'docs';
        if (title.toLowerCase().includes('tutorial')) return 'tutorial';
        if (title.toLowerCase().includes('example')) return 'example';
        
        return 'reference';
    }

    suggestProject(url, title) {
        const domain = new URL(url).hostname.toLowerCase();
        const titleLower = title.toLowerCase();
        
        if (domain.includes('react') || titleLower.includes('react')) return 'React Project';
        if (domain.includes('vue') || titleLower.includes('vue')) return 'Vue Project';
        if (domain.includes('node') || titleLower.includes('node')) return 'Node.js Backend';
        if (titleLower.includes('design') || titleLower.includes('ui')) return 'Design System';
        
        return 'General';
    }

    advanceToLevel1(savedItem) {
        this.currentLevel = 1;
        this.showDisclosureLevel(1);
        this.updateFirstCaptureDisplay(savedItem);
        this.celebrateFirstSave();
    }

    updateFirstCaptureDisplay(item) {
        const preview = document.getElementById('first-capture');
        if (preview) {
            const icon = this.getContentIcon(item.type);
            const title = this.truncateText(item.title || 'Untitled', 30);
            
            preview.innerHTML = `
                <div class="capture-icon">${icon}</div>
                <div class="capture-meta">
                    <div class="capture-title">${title}</div>
                    <div class="capture-time text-caption">Just now</div>
                </div>
            `;
        }
    }

    celebrateFirstSave() {
        // Add celebration animation
        const celebration = document.querySelector('.celebration');
        if (celebration) {
            celebration.style.animation = 'bounce 0.6s ease-in-out';
        }

        // Show confetti effect (simplified)
        this.showConfettiEffect();
    }

    showConfettiEffect() {
        // Create simple confetti effect
        for (let i = 0; i < 20; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${['#3b82f6', '#059669', '#d97706', '#dc2626'][Math.floor(Math.random() * 4)]};
                pointer-events: none;
                z-index: 1000;
                border-radius: 50%;
                top: 20%;
                left: ${Math.random() * 100}%;
                animation: confettiFall 2s linear forwards;
            `;
            
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 2000);
        }
    }

    advanceToLevel2() {
        this.currentLevel = 2;
        this.showDisclosureLevel(2);
        this.setupOrganizedIntelligence();
    }

    setupOrganizedIntelligence() {
        this.generateAISuggestion();
        this.loadTabContent('projects');
    }

    setupPowerUserInterface() {
        this.loadAnalytics();
        this.setupAdvancedSearch();
    }

    async loadAnalytics() {
        const analytics = document.querySelector('.analytics-summary');
        if (analytics) {
            analytics.innerHTML = `
                <div class="analytics-item">
                    <span class="text-caption">📊 This week:</span>
                    <span class="text-body">${this.engagementMetrics.weeklyActivity} saves, ${this.engagementMetrics.totalProjects} projects</span>
                </div>
                <div class="analytics-item">
                    <span class="text-caption">⭐ Streak:</span>
                    <span class="text-body">${this.engagementMetrics.streakDays} days</span>
                </div>
            `;
        }
    }

    generateAISuggestion(tab) {
        if (!this.aiSuggestions.enabled) return;

        const suggestions = [
            'Add to "Frontend Learning"',
            'Tag as "Components"',
            'Link to existing React docs',
            'Create new project for this domain'
        ];

        const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        this.aiSuggestions.lastSuggestion = {
            text: suggestion,
            confidence: 0.8,
            timestamp: Date.now()
        };

        this.updateSuggestionDisplay(suggestion);
    }

    updateSuggestionDisplay(suggestion) {
        const suggestionEl = document.querySelector('.suggestion-text');
        if (suggestionEl) {
            suggestionEl.textContent = suggestion + '?';
        }
    }

    initializeAI() {
        // Initialize AI components
        this.setupSmartSuggestions();
    }

    setupSmartSuggestions() {
        // Setup periodic suggestion generation
        if (this.currentLevel >= 2) {
            this.generateAISuggestion();
        }
    }

    setupAnimations() {
        // Add CSS animations dynamically
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
            
            @keyframes confettiFall {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
        `;
        document.head.appendChild(style);
    }

    focusSearch() {
        const searchInputs = document.querySelectorAll('.search-input');
        const visibleSearch = Array.from(searchInputs).find(input => 
            input.offsetParent !== null
        );
        
        if (visibleSearch) {
            visibleSearch.focus();
        }
    }

    performAdvancedSearch(query) {
        // Implementation would perform sophisticated search
        console.log('Advanced search:', query);
    }

    toggleBulkSelection(selectAll) {
        const checkboxes = document.querySelectorAll('.content-card input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll;
        });
    }

    closeModal() {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    animateModal(modal) {
        modal.style.opacity = '0';
        requestAnimationFrame(() => {
            modal.style.transition = 'opacity 0.3s ease';
            modal.style.opacity = '1';
        });
    }

    showErrorFeedback(message) {
        const feedback = document.createElement('div');
        feedback.className = 'error-feedback';
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #dc2626, #ef4444);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(220, 38, 38, 0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => feedback.remove(), 300);
        }, 3000);
    }

    trackLevelProgression() {
        // Analytics tracking for level progression
        const event = {
            action: 'level_progression',
            level: this.currentLevel,
            timestamp: Date.now(),
            metrics: this.engagementMetrics
        };
        
        console.log('Level progression tracked:', event);
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quaeliPremium = new QuaeliPremium();
});

// Handle Chrome extension context
if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'refresh_content') {
            window.quaeliPremium?.loadRecentContent();
        }
        return true;
    });
}