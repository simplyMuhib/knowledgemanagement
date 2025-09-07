// Quaeli Local-First Popup JavaScript
console.log('💾 Quaeli Local-First Popup Loaded');

// Local-first interface with bookmark acquisition hook
class PopupInterface {
    constructor() {
        this.bookmarkService = null;
        this.isFirstTime = true; // Will check from storage
        this.selectedBookmarks = new Set();
        this.curatedBookmarks = [];
        
        // OAuth state management
        this.currentUser = null;
        this.syncState = 'local'; // 'local', 'syncing', 'synced'
        this.oauthVisible = false;
        
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
        
        // Initialize OAuth system
        await this.initializeOAuth();
    }
    
    async initializeServices() {
        try {
            // Initialize bookmark import service
            this.bookmarkService = new window.BookmarkImportService();
            
            // Initialize storage if available
            if (window.QuaeliStorage) {
                await window.QuaeliStorage.initialize();
                await this.bookmarkService.initialize(window.QuaeliStorage);
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
                if (window.QuaeliStorage) {
                    const items = await window.QuaeliStorage.getItems({ limit: 5 });
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
            if (window.QuaeliStorage) {
                const items = await window.QuaeliStorage.getItems({ limit: 1 });
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
            projectContextElement.textContent = 'Quaeli initialized';
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
            let capturedItem = null;
            
            switch (action) {
                case 'text':
                    capturedItem = await this.captureSelectedText();
                    break;
                case 'screenshot':
                    capturedItem = await this.captureScreenshot();
                    break;
                case 'bookmark':
                    capturedItem = await this.captureBookmark();
                    break;
                case 'note':
                    capturedItem = await this.createQuickNote();
                    break;
                default:
                    throw new Error(`Unknown capture action: ${action}`);
            }
            
            if (capturedItem) {
                // Save to storage
                const storage = window.QuaeliStorage;
                const savedId = await storage.saveItem(capturedItem);
                
                console.log(`✅ Item saved with ID: ${savedId}`);
                
                // Show success state
                button.classList.remove('loading');
                button.classList.add('success');
                
                // Show success message
                this.showSuccessMessage(`${this.getActionLabel(action)} saved successfully!`);
                
                // Reset after animation
                setTimeout(() => {
                    button.classList.remove('success');
                }, 2000);
            }
            
        } catch (error) {
            console.error(`❌ Capture failed: ${action}`, error);
            button.classList.remove('loading');
            this.showErrorMessage(`Failed to ${action.toLowerCase()}. Please try again.`);
        }
    }
    
    // Capture selected text from current page
    async captureSelectedText() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();
                
                if (!selectedText) {
                    return null;
                }
                
                // Get surrounding context
                let context = '';
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const container = range.commonAncestorContainer;
                    const parentElement = container.nodeType === Node.TEXT_NODE ? 
                        container.parentElement : container;
                    
                    if (parentElement) {
                        context = parentElement.textContent.substring(0, 500);
                    }
                }
                
                return {
                    text: selectedText,
                    context: context,
                    url: window.location.href,
                    title: document.title,
                    domain: window.location.hostname
                };
            }
        });
        
        const captureData = result[0]?.result;
        
        if (!captureData || !captureData.text) {
            throw new Error('No text selected. Please select some text to capture.');
        }
        
        return {
            title: `Text from ${captureData.domain}`,
            content: captureData.text,
            context: captureData.context,
            type: 'text',
            url: captureData.url,
            sourceTitle: captureData.title,
            tags: [captureData.domain.replace(/^www\./, '')],
            createdAt: new Date().toISOString()
        };
    }
    
    // Capture screenshot of current page
    async captureScreenshot() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Capture visible tab
        const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
            format: 'png',
            quality: 90
        });
        
        return {
            title: `Screenshot of ${new URL(tab.url).hostname}`,
            content: dataUrl,
            type: 'screenshot',
            url: tab.url,
            sourceTitle: tab.title,
            tags: [new URL(tab.url).hostname.replace(/^www\./, '')],
            createdAt: new Date().toISOString()
        };
    }
    
    // Capture current page as bookmark
    async captureBookmark() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Get page metadata
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const getMetaContent = (name) => {
                    const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"], meta[property="og:${name}"]`);
                    return meta ? meta.getAttribute('content') : '';
                };
                
                return {
                    description: getMetaContent('description'),
                    image: getMetaContent('image'),
                    keywords: getMetaContent('keywords')
                };
            }
        });
        
        const metadata = result[0]?.result || {};
        
        return {
            title: tab.title,
            content: metadata.description || `Bookmarked from ${new URL(tab.url).hostname}`,
            type: 'bookmark',
            url: tab.url,
            sourceTitle: tab.title,
            image: metadata.image,
            tags: metadata.keywords ? metadata.keywords.split(',').map(k => k.trim().toLowerCase()) : 
                  [new URL(tab.url).hostname.replace(/^www\./, '')],
            createdAt: new Date().toISOString()
        };
    }
    
    // Create a quick note
    async createQuickNote() {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // For now, create a simple note - later we can add a note input dialog
        const noteText = prompt('Enter your note:');
        
        if (!noteText || !noteText.trim()) {
            throw new Error('Note cancelled or empty.');
        }
        
        return {
            title: `Note - ${new Date().toLocaleDateString()}`,
            content: noteText.trim(),
            type: 'note',
            url: tab.url,
            sourceTitle: tab.title,
            tags: ['note', new URL(tab.url).hostname.replace(/^www\./, '')],
            createdAt: new Date().toISOString()
        };
    }
    
    // Helper methods
    getActionLabel(action) {
        const labels = {
            'text': 'Text selection',
            'screenshot': 'Screenshot',
            'bookmark': 'Bookmark',
            'note': 'Note'
        };
        return labels[action] || action;
    }
    
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }
    
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }
    
    showMessage(message, type = 'info') {
        // Remove any existing messages
        const existingMessage = document.querySelector('.popup-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `popup-message ${type}`;
        messageEl.textContent = message;
        
        // Add to popup
        const container = document.querySelector('.popup-container');
        container.insertBefore(messageEl, container.firstChild);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 3000);
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
                await this.handleSyncAction();
                break;
                
            case 'panel':
                await this.openSidepanel();
                break;
                
            case 'note':
                await this.createQuickNote();
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

    // OAuth Authentication System
    async initializeOAuth() {
        console.log('🔐 Initializing OAuth system');
        
        // Load existing auth session
        await this.loadAuthSession();
        
        // Set up OAuth event handlers
        this.setupOAuthHandlers();
        
        // Initialize sync state UI
        this.updateSyncUI();
        
        // Load item count
        this.updateItemCount();
        
        console.log(`✅ OAuth initialized - State: ${this.syncState}`);
    }

    async loadAuthSession() {
        try {
            const result = await chrome.storage.local.get(['auth_session', 'auth_user', 'sync_state']);
            
            if (result.auth_session && result.auth_user) {
                const session = result.auth_session;
                
                // Check if session is still valid (simple check)
                if (session.expires_at && session.expires_at > Date.now()) {
                    this.currentUser = result.auth_user;
                    this.syncState = result.sync_state || 'synced';
                    
                    console.log(`🔓 Auth session restored: ${this.currentUser.email} (${this.currentUser.provider})`);
                    return;
                }
            }
            
            // No valid session found
            this.syncState = 'local';
            console.log('🔒 No valid auth session found - local mode');
            
        } catch (error) {
            console.error('❌ Failed to load auth session:', error);
            this.syncState = 'local';
        }
    }

    setupOAuthHandlers() {
        // OAuth provider buttons
        const oauthButtons = document.querySelectorAll('.oauth-btn[data-provider]');
        oauthButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const provider = button.dataset.provider;
                await this.signInWithProvider(provider);
            });
        });

        // Back/Cancel buttons
        const backButton = document.getElementById('backBtn');
        const cancelButton = document.getElementById('cancelBtn');
        
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.showNavigation();
            });
        }
        
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                this.showNavigation();
            });
        }

        // Sync status in header - click to toggle
        const syncStatus = document.getElementById('syncStatus');
        if (syncStatus) {
            syncStatus.addEventListener('click', () => {
                this.handleSyncStatusClick();
            });
        }

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.oauthVisible) {
                this.showNavigation();
            }
        });
    }

    async handleSyncAction() {
        console.log(`☁️ Sync action - Current state: ${this.syncState}`);
        
        if (this.syncState === 'local') {
            // Not signed in - show OAuth options
            this.showOAuthContent();
        } else if (this.syncState === 'synced') {
            // Already synced - show disconnect option
            const disconnect = confirm('Would you like to disconnect from cloud sync and return to local mode?');
            if (disconnect) {
                await this.signOut();
            }
        }
        // If syncing, do nothing (let it complete)
    }

    handleSyncStatusClick() {
        if (!this.oauthVisible && this.syncState === 'local') {
            this.showOAuthContent();
        } else if (this.oauthVisible) {
            this.showNavigation();
        } else {
            this.handleSyncAction();
        }
    }

    showOAuthContent() {
        console.log('🔐 Showing OAuth provider selection');
        const navActions = document.getElementById('navActions');
        const oauthContent = document.getElementById('oauthContent');
        
        if (navActions && oauthContent) {
            navActions.classList.add('hidden');
            oauthContent.classList.add('active');
            this.oauthVisible = true;
        }
    }

    showNavigation() {
        console.log('🔙 Returning to navigation');
        const navActions = document.getElementById('navActions');
        const oauthContent = document.getElementById('oauthContent');
        
        if (navActions && oauthContent) {
            oauthContent.classList.remove('active');
            navActions.classList.remove('hidden');
            this.oauthVisible = false;
        }
    }

    async signInWithProvider(provider) {
        console.log(`🔐 Starting OAuth flow with ${provider}`);
        
        this.showNavigation();
        this.setSyncState('syncing');

        try {
            // In a real implementation, this would use chrome.identity.launchWebAuthFlow
            // For now, simulate the OAuth flow
            const user = await this.simulateOAuthFlow(provider);
            
            // Save auth session
            const session = {
                access_token: `mock_token_${Date.now()}`,
                expires_at: Date.now() + (3600 * 1000), // 1 hour
                provider: provider
            };

            await chrome.storage.local.set({
                auth_session: session,
                auth_user: user,
                sync_state: 'synced'
            });

            this.currentUser = user;
            this.setSyncState('synced');

            console.log(`✅ Successfully signed in with ${provider}: ${user.email}`);

        } catch (error) {
            console.error(`❌ OAuth failed for ${provider}:`, error);
            this.setSyncState('local');
        }
    }

    async simulateOAuthFlow(provider) {
        // Simulate OAuth delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock user data based on provider
        const mockUsers = {
            google: {
                id: 'google_user_123',
                email: 'user@gmail.com',
                name: 'Demo User',
                picture: 'https://via.placeholder.com/32',
                provider: 'google'
            },
            microsoft: {
                id: 'microsoft_user_456', 
                email: 'user@outlook.com',
                name: 'Demo User', 
                picture: 'https://via.placeholder.com/32',
                provider: 'microsoft'
            },
            facebook: {
                id: 'facebook_user_789',
                email: 'user@facebook.com',
                name: 'Demo User',
                picture: 'https://via.placeholder.com/32', 
                provider: 'facebook'
            }
        };

        return mockUsers[provider] || mockUsers.google;
    }

    async signOut() {
        console.log('🔓 Signing out user');
        
        try {
            await chrome.storage.local.remove(['auth_session', 'auth_user', 'sync_state']);
            
            this.currentUser = null;
            this.setSyncState('local');
            
            console.log('✅ Successfully signed out');
            this.showNotification('Signed out - Back to local mode', 'info');
            
        } catch (error) {
            console.error('❌ Sign out failed:', error);
            this.showNotification('Sign out failed', 'error');
        }
    }

    setSyncState(state) {
        this.syncState = state;
        this.updateSyncUI();
    }

    updateSyncUI() {
        const syncBtn = document.getElementById('syncBtn');
        const syncIcon = document.getElementById('syncIcon');
        const syncLabel = document.getElementById('syncLabel');
        const syncStatus = document.getElementById('syncStatus');
        const syncText = document.getElementById('syncText');
        
        // Remove all state classes from sync button
        if (syncBtn) {
            syncBtn.classList.remove('sync', 'syncing', 'synced', 'login');
            
            switch (this.syncState) {
                case 'local':
                    syncBtn.classList.add('login');
                    if (syncLabel) syncLabel.textContent = 'Sign In';
                    if (syncIcon) syncIcon.textContent = '☁️';
                    break;
                case 'syncing':
                    syncBtn.classList.add('syncing');
                    if (syncLabel) syncLabel.textContent = 'Connecting';
                    if (syncIcon) syncIcon.textContent = '⏳';
                    break;
                case 'synced':
                    syncBtn.classList.add('synced');
                    if (syncLabel) syncLabel.textContent = 'Synced';
                    if (syncIcon) syncIcon.textContent = '✅';
                    break;
            }
        }

        // Update sync status in header
        if (syncStatus) {
            syncStatus.classList.remove('offline', 'syncing', 'synced');
            
            switch (this.syncState) {
                case 'local':
                    syncStatus.classList.add('offline');
                    if (syncText) syncText.textContent = 'Local';
                    break;
                case 'syncing':
                    syncStatus.classList.add('syncing');
                    if (syncText) syncText.textContent = 'Syncing...';
                    break;
                case 'synced':
                    syncStatus.classList.add('synced');
                    if (syncText) syncText.textContent = 'Cloud';
                    break;
            }
        }
    }

    async updateItemCount() {
        try {
            const itemCount = document.getElementById('itemCount');
            if (itemCount && window.LinkMindStorage) {
                const items = await window.QuaeliStorage.getItems({ limit: 1000 });
                itemCount.textContent = items.length.toString();
            } else if (itemCount) {
                // Default count if storage not available
                itemCount.textContent = '0';
            }
        } catch (error) {
            console.error('Failed to load item count:', error);
        }
    }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PopupInterface();
});