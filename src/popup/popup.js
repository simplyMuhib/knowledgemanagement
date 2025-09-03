// LinkMind Local-First Popup JavaScript
console.log('💾 LinkMind Local-First Popup Loaded');

// Local-first interface with bookmark acquisition hook
class PopupInterface {
    constructor() {
        this.bookmarkService = null;
        this.isFirstTime = true; // Will check from storage
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
            // Check if user has any stored items
            if (window.LinkMindStorage) {
                const items = await window.LinkMindStorage.getItems({ limit: 5 });
                this.isFirstTime = items.length === 0;
                
                if (!this.isFirstTime) {
                    // User has existing data - show welcome back message
                    this.showReturningUserWelcome(items.length);
                } else {
                    // True first-time user - show acquisition hook
                    this.showAcquisitionHook();
                }
            }
            
            console.log(`👋 User status: ${this.isFirstTime ? 'First-time' : 'Returning'} (${this.isFirstTime ? 0 : 'existing data found'})`);
            
        } catch (error) {
            console.error('First-time check failed:', error);
            this.isFirstTime = true;
            this.showAcquisitionHook();
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
    
    handleNavigation(action, button) {
        console.log(`🔧 Navigation: ${action}`);
        
        switch (action) {
            case 'sync':
                button.classList.add('loading');
                setTimeout(() => button.classList.remove('loading'), 2000);
                break;
                
            case 'panel':
                // Open side panel (will be implemented)
                break;
                
            case 'search':
                // Open search interface (will be implemented)
                break;
                
            case 'settings':
                // Open settings (will be implemented)
                break;
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
                
                // Show import permission prompt after analysis
                setTimeout(() => {
                    this.showImportPermission();
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
            
            // For now, import a few sample bookmarks
            // In a full implementation, user would select which ones to import
            const allBookmarks = await this.bookmarkService.getAllBookmarks();
            const topBookmarks = allBookmarks.slice(0, 5); // Import top 5
            
            if (topBookmarks.length > 0) {
                const result = await this.bookmarkService.importBookmarks(
                    topBookmarks.map(b => b.id)
                );
                
                // Show success and hide acquisition hook
                this.showNotification(`Successfully imported ${result.imported} bookmarks! 🎉`, 'success');
                
                setTimeout(() => {
                    this.hideAcquisitionHook();
                }, 1500);
                
                console.log(`✅ Imported ${result.imported} bookmarks`);
            }
            
        } catch (error) {
            console.error('Import failed:', error);
            this.showNotification('Import failed. Try manual capture instead.', 'error');
            
        } finally {
            importBtn.disabled = false;
            importBtn.innerHTML = '<span class="btn-icon">📥</span><span class="btn-text">Import Top Items</span>';
        }
    }
    
    showImportPermission() {
        const permissionDiv = document.getElementById('importPermission');
        if (permissionDiv) {
            permissionDiv.style.display = 'block';
            console.log('📋 Import permission prompt shown');
        }
    }
    
    handleSkipImport() {
        console.log('⏭️ User skipped bookmark import');
        
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