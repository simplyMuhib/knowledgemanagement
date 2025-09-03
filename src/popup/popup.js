// LinkMind Local-First Popup JavaScript
console.log('💾 LinkMind Local-First Popup Loaded');

// Local-first interface with bookmark acquisition hook
class PopupInterface {
    constructor() {
        this.bookmarkService = null;
        this.isFirstTime = true; // Will check from storage
        this.selectedBookmarks = new Set();
        this.curatedBookmarks = [];
        this.init();
    }
    
    async init() {
        console.log('🚀 Initializing Local-First Knowledge Capture');
        
        // Initialize bookmark service
        await this.initializeServices();
        
        // Check if first-time user for acquisition hook
        await this.checkFirstTimeUser();
        
        // Initialize context
        await this.initializeIntelligenceContext();
        
        // Add capture handlers
        this.addCaptureHandlers();
        
        // Add navigation handlers
        this.addNavigationHandlers();
        
        // Add bookmark acquisition handlers
        this.addBookmarkHookHandlers();
    }
    
    async initializeServices() {
        try {
            // Initialize bookmark import service
            this.bookmarkService = new window.BookmarkImportService();
            
            // Initialize storage if available
            if (window.LinkMindStorage) {
                await window.LinkMindStorage.initialize();
                await this.bookmarkService.initialize(window.LinkMindStorage);
            }
            
            console.log('✅ Services initialized');
        } catch (error) {
            console.error('❌ Service initialization failed:', error);
        }
    }
    
    async checkFirstTimeUser() {
        try {
            // First, check if onboarding was completed (most reliable)
            const result = await chrome.storage.local.get(['onboardingCompleted']);
            const onboardingCompleted = result.onboardingCompleted || false;
            
            if (onboardingCompleted) {
                // User has completed onboarding - check for existing data
                if (window.LinkMindStorage) {
                    const items = await window.LinkMindStorage.getItems({ limit: 5 });
                    if (items.length > 0) {
                        this.showReturningUserWelcome(items.length);
                    } else {
                        // Onboarding done but no items - show ready state
                        this.showReadyState();
                    }
                }
                this.isFirstTime = false;
                console.log('👋 User status: Returning (onboarding completed)');
                return;
            }
            
            // Check if user has existing items (backup check)
            if (window.LinkMindStorage) {
                const items = await window.LinkMindStorage.getItems({ limit: 1 });
                if (items.length > 0) {
                    // Has items but onboarding flag missing - fix the flag
                    await chrome.storage.local.set({ onboardingCompleted: true });
                    this.showReturningUserWelcome(items.length);
                    this.isFirstTime = false;
                    console.log('👋 User status: Returning (fixed missing flag)');
                    return;
                }
            }
            
            // True first-time user
            this.isFirstTime = true;
            this.showAcquisitionHook();
            console.log('👋 User status: First-time');
            
        } catch (error) {
            console.error('First-time check failed:', error);
            this.isFirstTime = true;
            this.showAcquisitionHook();
        }
    }
    
    showReadyState() {
        const pageTitleElement = document.getElementById('pageTitle');
        const projectContextElement = document.getElementById('projectContext');
        const connectionHintElement = document.getElementById('connectionHint');
        
        if (pageTitleElement && projectContextElement && connectionHintElement) {
            pageTitleElement.textContent = 'Ready to capture';
            projectContextElement.textContent = 'LinkMind initialized';
            connectionHintElement.textContent = 'All systems ready ✨';
        }
    }
    
    showReturningUserWelcome(itemCount) {
        const pageTitleElement = document.getElementById('pageTitle');
        const projectContextElement = document.getElementById('projectContext');
        const connectionHintElement = document.getElementById('connectionHint');
        
        if (pageTitleElement && projectContextElement && connectionHintElement) {
            pageTitleElement.textContent = 'Welcome back!';
            projectContextElement.textContent = `${itemCount} items preserved`;
            connectionHintElement.textContent = 'Data intact ✨';
            
            // Show brief celebration notification
            setTimeout(() => {
                this.showNotification(`🎉 Found your ${itemCount} saved items! Data persisted across reinstall.`, 'success');
            }, 1000);
        }
        
        console.log(`🎉 Returning user: ${itemCount} items found`);
    }
    
    showAcquisitionHook() {
        const hook = document.getElementById('acquisitionHook');
        const captureGrid = document.querySelector('.capture-grid');
        
        if (hook && captureGrid) {
            hook.style.display = 'block';
            captureGrid.style.opacity = '0.6'; // Dim capture grid to focus on hook
            console.log('🎯 Acquisition hook shown');
        }
    }
    
    hideAcquisitionHook() {
        const hook = document.getElementById('acquisitionHook');
        const captureGrid = document.querySelector('.capture-grid');
        
        if (hook && captureGrid) {
            hook.style.display = 'none';
            captureGrid.style.opacity = '1';
            console.log('✅ Acquisition hook hidden');
        }
    }
    
    
    addCaptureHandlers() {
        document.querySelectorAll('.capture-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const action = e.currentTarget.dataset.action;
                await this.performCapture(action, e.currentTarget);
            });
        });
    }
    
    async performCapture(action, button) {
        console.log(`📝 Performing capture: ${action}`);
        
        // Show loading state
        button.classList.add('loading');
        
        try {
            // Simulate capture process (will be implemented in later chunks)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Show success state
            button.classList.remove('loading');
            button.classList.add('success');
            
            // Reset after animation
            setTimeout(() => {
                button.classList.remove('success');
            }, 2000);
            
            console.log(`✅ Capture completed: ${action}`);
            
        } catch (error) {
            console.error(`❌ Capture failed: ${action}`, error);
            button.classList.remove('loading');
        }
    }
    
    addNavigationHandlers() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleNavigation(action, e.currentTarget);
            });
        });
    }
    
    async handleNavigation(action, button) {
        console.log(`🔧 Navigation: ${action}`);
        
        switch (action) {
            case 'sync':
                button.classList.add('loading');
                setTimeout(() => button.classList.remove('loading'), 2000);
                break;
                
            case 'panel':
                await this.openSidepanel();
                break;
                
            case 'search':
                await this.openDashboard();
                break;
                
            case 'settings':
                await this.openSettings();
                break;
        }
    }
    
    async openSidepanel() {
        try {
            console.log('📋 Opening sidepanel...');
            
            // Get current tab to open sidepanel for
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (activeTab) {
                // Use Chrome's built-in sidepanel API
                await chrome.sidePanel.open({ tabId: activeTab.id });
                console.log('✅ Sidepanel opened');
                
                // Close popup since sidepanel is open
                window.close();
            }
        } catch (error) {
            console.error('❌ Failed to open sidepanel:', error);
            this.showNotification('Sidepanel not available. Try keyboard shortcut Ctrl+Shift+S', 'info');
        }
    }
    
    async openDashboard() {
        try {
            console.log('📊 Opening dashboard...');
            
            // Create new tab with dashboard
            await chrome.tabs.create({
                url: chrome.runtime.getURL('src/dashboard/dashboard.html')
            });
            
            console.log('✅ Dashboard opened in new tab');
            
            // Close popup
            window.close();
        } catch (error) {
            console.error('❌ Failed to open dashboard:', error);
            this.showNotification('Dashboard not available', 'error');
        }
    }
    
    async openSettings() {
        try {
            console.log('⚙️ Opening settings...');
            
            // For now, open dashboard with settings focus (can be enhanced later)
            await chrome.tabs.create({
                url: chrome.runtime.getURL('src/dashboard/dashboard.html#settings')
            });
            
            console.log('✅ Settings opened');
            window.close();
        } catch (error) {
            console.error('❌ Failed to open settings:', error);
        }
    }
    
    async initializeIntelligenceContext() {
        try {
            // Show local-first ready state
            const contextData = {
                pageTitle: 'Ready to capture knowledge',
                projectContext: 'Local storage active',
                connectionCount: 'Works offline'
            };
            
            console.log('💾 Local storage initialized:', contextData);
            
            // Update context display
            this.updateContextDisplay(contextData);
            
            // Get current tab information for potential capture
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.title) {
                // Update with actual page title once available
                this.updatePageTitle(tab.title);
            }
        } catch (error) {
            console.warn('Context initialization failed:', error);
        }
    }
    
    updateContextDisplay(contextData) {
        // Update page title and context info
        const pageTitleElement = document.getElementById('pageTitle');
        const projectContextElement = document.getElementById('projectContext');
        const connectionHintElement = document.getElementById('connectionHint');
        
        if (pageTitleElement) {
            pageTitleElement.textContent = contextData.pageTitle;
        }
        if (projectContextElement) {
            projectContextElement.textContent = contextData.projectContext;
        }
        if (connectionHintElement) {
            connectionHintElement.textContent = contextData.connectionCount;
        }
    }
    
    updatePageTitle(title) {
        const pageTitleElement = document.getElementById('pageTitle');
        if (pageTitleElement) {
            // Show actual page title when ready to capture
            pageTitleElement.textContent = `Capture from: ${title.substring(0, 30)}${title.length > 30 ? '...' : ''}`;
        }
    }
    
    setupContextAction() {
        const contextAction = document.getElementById('contextAction');
        
        if (contextAction) {
            contextAction.addEventListener('click', () => {
                console.log('🔗 Opening related items');
                this.showNotification('Opening related items...', 'info');
                // This will connect to sidepanel to show related content
            });
        }
    }
    
    addBookmarkHookHandlers() {
        // Analyze bookmarks button
        const analyzeBtn = document.getElementById('analyzeBookmarksBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', async () => {
                await this.handleBookmarkAnalysis();
            });
        }
        
        // Import selected button
        const importBtn = document.getElementById('importSelectedBtn');
        if (importBtn) {
            importBtn.addEventListener('click', async () => {
                await this.handleBookmarkImport();
            });
        }
        
        // Skip import button  
        const skipBtn = document.getElementById('skipImportBtn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                this.handleSkipImport();
            });
        }
        
        // Select all button
        const selectAllBtn = document.getElementById('selectAllBtn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.handleSelectAll();
            });
        }
    }
    
    async handleBookmarkAnalysis() {
        console.log('🔍 Starting bookmark analysis...');
        
        const analyzeBtn = document.getElementById('analyzeBookmarksBtn');
        const resultsDiv = document.getElementById('bookmarkResults');
        const summaryDiv = document.getElementById('resultsSummary');
        
        if (!this.bookmarkService) {
            console.error('Bookmark service not available');
            return;
        }
        
        try {
            // Show loading state
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Analyzing...</span>';
            
            // Perform analysis
            const analysis = await this.bookmarkService.analyzeExistingBookmarks();
            
            if (analysis.success) {
                // Show results - this is the "aha moment"!
                summaryDiv.innerHTML = this.formatAnalysisResults(analysis);
                resultsDiv.style.display = 'block';
                
                // Show intelligent bookmark selection after analysis
                setTimeout(() => {
                    this.showBookmarkSelection(analysis);
                }, 1000);
                
                console.log('✨ Analysis complete - aha moment delivered!');
            } else {
                summaryDiv.innerHTML = `<p style="color: var(--text-secondary);">No bookmarks found to analyze. Start capturing knowledge with the buttons below!</p>`;
                
                // Hide hook and show capture interface
                setTimeout(() => {
                    this.hideAcquisitionHook();
                }, 2000);
            }
            
        } catch (error) {
            console.error('Analysis failed:', error);
            summaryDiv.innerHTML = `<p style="color: var(--error);">Analysis failed. You can still capture knowledge manually!</p>`;
            
            // Hide hook after error
            setTimeout(() => {
                this.hideAcquisitionHook();
            }, 3000);
            
        } finally {
            // Reset button
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<span class="btn-icon">📊</span><span class="btn-text">Analyze My Bookmarks</span>';
        }
    }
    
    formatAnalysisResults(analysis) {
        const { summary, hooks } = analysis;
        
        return `
            <div class="analysis-summary">
                <p><strong>${hooks.primaryHook.text}</strong></p>
                <div class="quick-stats">
                    <span class="stat-pill">📚 ${summary.totalBookmarks} bookmarks</span>
                    <span class="stat-pill">🌐 ${summary.uniqueDomains} domains</span>
                    <span class="stat-pill">🏷️ ${summary.topicsIdentified} topics</span>
                </div>
                ${hooks.secondaryHooks.length > 0 ? `
                    <div class="opportunities">
                        ${hooks.secondaryHooks.map(hook => 
                            `<div class="opportunity">💡 ${hook.text}</div>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    async handleBookmarkImport() {
        console.log('📥 Starting bookmark import...');
        
        const importBtn = document.getElementById('importSelectedBtn');
        
        try {
            importBtn.disabled = true;
            importBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Importing...</span>';
            
            // Import user-selected bookmarks
            const selectedIds = Array.from(this.selectedBookmarks);
            
            if (selectedIds.length > 0) {
                const result = await this.bookmarkService.importBookmarks(selectedIds);
                
                // Mark onboarding as completed
                await chrome.storage.local.set({ onboardingCompleted: true });
                
                // Show success and hide acquisition hook
                this.showNotification(`Successfully imported ${result.imported} bookmarks! 🎉`, 'success');
                
                setTimeout(() => {
                    this.hideAcquisitionHook();
                }, 1500);
                
                console.log(`✅ Imported ${result.imported}/${selectedIds.length} selected bookmarks - onboarding completed`);
            } else {
                this.showNotification('Please select at least one bookmark to import.', 'info');
            }
            
        } catch (error) {
            console.error('Import failed:', error);
            this.showNotification('Import failed. Try manual capture instead.', 'error');
            
        } finally {
            importBtn.disabled = false;
            importBtn.innerHTML = '<span class="btn-icon">📥</span><span class="btn-text">Import Top Items</span>';
        }
    }
    
    async showBookmarkSelection(analysis) {
        console.log('📋 Showing intelligent bookmark selection');
        
        // Get curated bookmarks from analysis
        this.curatedBookmarks = await this.getCuratedBookmarks(analysis);
        
        // Show selection UI
        const selectionDiv = document.getElementById('bookmarkSelection');
        if (selectionDiv) {
            this.renderBookmarkGrid();
            selectionDiv.style.display = 'block';
            
            // Pre-select recommended bookmarks
            this.preselectRecommended();
        }
    }
    
    async getCuratedBookmarks(analysis) {
        try {
            const allBookmarks = await this.bookmarkService.getAllBookmarks();
            
            // Smart curation based on critique recommendations
            const curated = this.intelligentCuration(allBookmarks, analysis);
            
            console.log(`🎯 Curated ${curated.length} bookmarks from ${allBookmarks.length} total`);
            return curated;
            
        } catch (error) {
            console.error('Failed to curate bookmarks:', error);
            return [];
        }
    }
    
    intelligentCuration(bookmarks, analysis) {
        // Implement smart selection based on product critique recommendations
        const scored = bookmarks.map(bookmark => {
            let score = 0;
            let reasons = [];
            
            // Recent activity weight (40%)
            const daysSinceAdded = (Date.now() - (bookmark.dateAdded || 0)) / (24 * 60 * 60 * 1000);
            if (daysSinceAdded < 7) {
                score += 40;
                reasons.push('Recent');
            } else if (daysSinceAdded < 30) {
                score += 20;
                reasons.push('This month');
            }
            
            // Domain authority (10%)
            const domain = this.extractDomain(bookmark.url);
            const authorityDomains = ['github.com', 'stackoverflow.com', 'mdn.mozilla.org', 'docs.', 'documentation'];
            if (authorityDomains.some(auth => domain.includes(auth))) {
                score += 10;
                reasons.push('High-value');
            }
            
            // Topic relevance (30%) - based on analysis insights
            const text = (bookmark.title + ' ' + bookmark.url).toLowerCase();
            if (analysis.insights && analysis.insights.knowledgeAreas) {
                analysis.insights.knowledgeAreas.forEach(area => {
                    if (text.includes(area.name.toLowerCase())) {
                        score += 30;
                        reasons.push(`${area.name} expert`);
                    }
                });
            }
            
            // Content depth indicators (20%)
            if (bookmark.title.length > 50 || bookmark.url.includes('/docs/') || bookmark.url.includes('/guide/')) {
                score += 20;
                reasons.push('In-depth');
            }
            
            return {
                ...bookmark,
                score,
                reasons: reasons.slice(0, 2), // Max 2 reasons for UI
                selected: score >= 30 // Auto-select high-scoring items
            };
        });
        
        // Return top 10-12 bookmarks, sorted by score
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, 12);
    }
    
    renderBookmarkGrid() {
        const grid = document.getElementById('bookmarksGrid');
        if (!grid) return;
        
        grid.innerHTML = this.curatedBookmarks.map((bookmark, index) => `
            <div class="bookmark-item ${bookmark.selected ? 'selected' : ''}" data-bookmark-id="${bookmark.id}">
                <input 
                    type="checkbox" 
                    class="bookmark-checkbox" 
                    id="bookmark-${index}"
                    ${bookmark.selected ? 'checked' : ''}
                >
                <div class="bookmark-info">
                    <div class="bookmark-title">${bookmark.title}</div>
                    <div class="bookmark-meta">
                        <span>${this.extractDomain(bookmark.url)}</span>
                        ${bookmark.reasons.map(reason => 
                            `<span class="bookmark-reason">${reason}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        grid.querySelectorAll('.bookmark-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = item.querySelector('.bookmark-checkbox');
                    checkbox.checked = !checkbox.checked;
                }
                this.updateSelection();
            });
        });
        
        grid.querySelectorAll('.bookmark-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSelection();
            });
        });
    }
    
    preselectRecommended() {
        // Update selected set based on pre-selected items
        this.selectedBookmarks.clear();
        this.curatedBookmarks.forEach(bookmark => {
            if (bookmark.selected) {
                this.selectedBookmarks.add(bookmark.id);
            }
        });
        
        this.updateSelectionCount();
    }
    
    updateSelection() {
        this.selectedBookmarks.clear();
        
        document.querySelectorAll('.bookmark-checkbox:checked').forEach(checkbox => {
            const item = checkbox.closest('.bookmark-item');
            const bookmarkId = item.dataset.bookmarkId;
            this.selectedBookmarks.add(bookmarkId);
            
            item.classList.add('selected');
        });
        
        document.querySelectorAll('.bookmark-checkbox:not(:checked)').forEach(checkbox => {
            const item = checkbox.closest('.bookmark-item');
            item.classList.remove('selected');
        });
        
        this.updateSelectionCount();
    }
    
    updateSelectionCount() {
        const countElement = document.getElementById('selectedCount');
        if (countElement) {
            countElement.textContent = this.selectedBookmarks.size;
        }
        
        // Update button state
        const importBtn = document.getElementById('importSelectedBtn');
        if (importBtn) {
            importBtn.disabled = this.selectedBookmarks.size === 0;
        }
    }
    
    handleSelectAll() {
        const checkboxes = document.querySelectorAll('.bookmark-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = !allChecked;
        });
        
        this.updateSelection();
        console.log(`📋 ${allChecked ? 'Deselected' : 'Selected'} all bookmarks`);
    }
    
    extractDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch (e) {
            return 'unknown';
        }
    }
    
    async handleSkipImport() {
        console.log('⏭️ User skipped bookmark import');
        
        // Mark onboarding as completed even if skipped
        await chrome.storage.local.set({ onboardingCompleted: true });
        
        // Hide acquisition hook and show normal capture interface
        setTimeout(() => {
            this.hideAcquisitionHook();
        }, 500);
        
        // Show a gentle notification
        this.showNotification('No problem! You can import bookmarks later from settings.', 'info');
    }
    
    addIntelligenceHandlers() {
        // Context actions are handled in the acquisition hook now
        console.log('🧠 Intelligence handlers ready');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `context-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 60px;
            right: 20px;
            padding: 10px 14px;
            background: ${type === 'success' ? '#10b981' : type === 'info' ? '#3b82f6' : '#6b7280'};
            color: white;
            border-radius: 6px;
            z-index: 10000;
            font-size: 13px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 2000);
    }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PopupInterface();
});