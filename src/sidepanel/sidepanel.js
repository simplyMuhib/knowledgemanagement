class NuovixSidePanel {
    constructor() {
        this.engagementLevel = 0;
        this.savedItems = [];
        this.currentProject = 'All Items';
        this.activeTab = 'all';
        this.userHasImported = false;
        
        this.init();
    }

    async init() {
        await this.loadUserData();
        this.determineEngagementLevel();
        this.setupEventListeners();
        this.renderInterface();
    }

    async loadUserData() {
        // Load from IndexedDB or chrome.storage
        try {
            const result = await chrome.storage.local.get(['savedItems', 'engagementLevel', 'currentProject', 'userHasImported']);
            this.savedItems = result.savedItems || [];
            this.engagementLevel = result.engagementLevel || 0;
            this.currentProject = result.currentProject || 'All Items';
            this.userHasImported = result.userHasImported || false;
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    determineEngagementLevel() {
        const saveCount = this.savedItems.length;
        
        // Import-first strategy: bulk import users jump to power user level
        if (this.userHasImported && saveCount > 50) {
            this.engagementLevel = 3; // Power user - show everything
            return;
        }
        
        // Regular progression for manual savers
        if (saveCount === 0) {
            this.engagementLevel = 0; // New user - show save CTA + import option
        } else if (saveCount === 1) {
            this.engagementLevel = 1; // First manual save - celebration + continue
        } else if (saveCount >= 2 && saveCount <= 4) {
            this.engagementLevel = 2; // Basic tabs + organization
        } else {
            this.engagementLevel = 3; // 5+ saves - full power interface
        }
    }

    setupEventListeners() {
        // Primary CTA
        document.getElementById('save-page-btn')?.addEventListener('click', () => {
            this.saveCurrentPage();
        });

        // Import bookmarks
        document.getElementById('import-bookmarks-btn')?.addEventListener('click', () => {
            this.showImportModal();
        });

        // Continue saving
        document.getElementById('continue-saving-btn')?.addEventListener('click', () => {
            this.showContinueSaving();
        });

        // Footer CTA
        document.getElementById('footer-cta')?.addEventListener('click', () => {
            this.saveCurrentPage();
        });

        // Tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        // Search
        document.getElementById('search-input')?.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // AI suggestions
        document.querySelectorAll('.accept-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.acceptAISuggestion();
            });
        });

        // New project
        document.getElementById('new-project-btn')?.addEventListener('click', () => {
            this.createNewProject();
        });
    }

    renderInterface() {
        this.hideAllEngagementLevels();
        
        switch (this.engagementLevel) {
            case 0:
                this.showLevel0Interface();
                break;
            case 1:
                this.showLevel1Interface();
                break;
            case 2:
            case 3:
                this.showLevel2PlusInterface();
                break;
        }
    }

    hideAllEngagementLevels() {
        document.getElementById('level-0').style.display = 'none';
        document.getElementById('level-1').style.display = 'none';
        document.getElementById('level-2-plus').style.display = 'none';
        document.getElementById('tab-navigation').style.display = 'none';
        document.getElementById('search-container').style.display = 'none';
    }

    showLevel0Interface() {
        document.getElementById('level-0').style.display = 'flex';
        document.getElementById('footer-cta').querySelector('.footer-cta-text').textContent = 'Save Current Page';
    }

    showLevel1Interface() {
        document.getElementById('level-1').style.display = 'block';
        document.getElementById('level-1').classList.add('fade-in');
        
        // Show first saved item
        if (this.savedItems.length > 0) {
            this.renderFirstSaveCard();
        }
        
        document.getElementById('footer-cta').querySelector('.footer-cta-text').textContent = 'Save Another';
    }

    showLevel2PlusInterface() {
        document.getElementById('level-2-plus').style.display = 'block';
        document.getElementById('tab-navigation').style.display = 'flex';
        
        if (this.engagementLevel >= 3) {
            document.querySelector('.level-3-only').style.display = 'block';
            document.getElementById('search-container').style.display = 'block';
            document.getElementById('bulk-import-btn').style.display = 'block';
        }
        
        this.renderContentList();
        document.getElementById('footer-cta').querySelector('.footer-cta-text').textContent = 'Quick Save';
    }

    async saveCurrentPage() {
        this.showLoading();
        
        try {
            // Get current tab info
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check for duplicates first
            const existingItem = this.savedItems.find(item => 
                item.url === tab.url || item.pageUrl === tab.url
            );
            
            if (existingItem) {
                this.hideLoading();
                // Show duplicate handling options instead of saving
                this.showDuplicateHandlingModal(existingItem, tab);
                return;
            }
            
            const savedItem = {
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                type: 'link',
                title: tab.title,
                url: tab.url,
                favicon: tab.favIconUrl,
                timestamp: new Date().toISOString(),
                project: this.currentProject === 'All Items' ? null : this.currentProject
            };

            this.savedItems.push(savedItem);
            await this.saveUserData();
            
            this.hideLoading();
            this.determineEngagementLevel();
            this.renderInterface();
            
            this.showSuccessAnimation();
            
        } catch (error) {
            console.error('Error saving page:', error);
            this.hideLoading();
            this.showErrorMessage('Failed to save page. Please try again.');
        }
    }

    renderFirstSaveCard() {
        const firstItem = this.savedItems[0];
        const cardHtml = this.createContentCardHTML(firstItem);
        document.getElementById('first-save-card').innerHTML = cardHtml;
    }

    renderContentList() {
        const contentList = document.getElementById('content-list');
        
        if (this.savedItems.length === 0) {
            contentList.innerHTML = this.createEmptyStateHTML();
            return;
        }

        const filteredItems = this.getFilteredItems();
        const groupedItems = this.groupItemsByDate(filteredItems);
        
        let html = '';
        for (const [date, items] of Object.entries(groupedItems)) {
            html += `<div class="date-group">
                <h3 class="date-header">${this.formatDateHeader(date)}</h3>
                ${items.map(item => this.createContentCardHTML(item)).join('')}
            </div>`;
        }
        
        contentList.innerHTML = html;
    }

    createContentCardHTML(item) {
        const icon = this.getContentTypeIcon(item.type);
        const meta = this.getContentMeta(item);
        
        return `
            <div class="content-card ${item.type}" data-id="${item.id}">
                <div class="content-card-header">
                    <span class="content-icon">${icon}</span>
                    <span class="content-title" title="${item.title || ''}">${item.title || ''}</span>
                </div>
                <div class="content-meta">
                    ${meta.map(m => `<span class="meta-item" title="${m.replace(/^[🌐📅📁]\s/, '')}">${m}</span>`).join('')}
                </div>
                ${item.preview ? `<div class="content-preview">${item.preview}</div>` : ''}
                <div class="content-actions">
                    <button class="action-btn" onclick="editItem('${item.id}')">📝 Edit</button>
                    <button class="action-btn" onclick="moveItem('${item.id}')">📁 Move</button>
                    <button class="action-btn" onclick="tagItem('${item.id}')">🏷️ Tag</button>
                    <button class="action-btn" onclick="deleteItem('${item.id}')">🗑️ Delete</button>
                </div>
            </div>
        `;
    }

    getContentTypeIcon(type) {
        const icons = {
            'link': '🔗',
            'snippet': '📝',
            'screenshot': '📸',
            'note': '💭'
        };
        return icons[type] || '📄';
    }

    getContentMeta(item) {
        const meta = [];
        
        if (item.url && item.type !== 'note') {
            const domain = new URL(item.url).hostname;
            meta.push(`🌐 ${domain}`);
        }
        
        meta.push(`📅 ${this.formatRelativeTime(item.timestamp)}`);
        
        if (item.project) {
            meta.push(`📁 ${item.project}`);
        }
        
        return meta;
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        this.activeTab = tabName;
        
        // Show appropriate content
        switch (tabName) {
            case 'all':
                document.getElementById('content-list').style.display = 'block';
                document.getElementById('projects-view').style.display = 'none';
                document.getElementById('analytics-view').style.display = 'none';
                this.renderContentList();
                break;
            case 'projects':
                document.getElementById('content-list').style.display = 'none';
                document.getElementById('projects-view').style.display = 'block';
                document.getElementById('analytics-view').style.display = 'none';
                this.renderProjectsView();
                break;
            case 'recent':
                document.getElementById('content-list').style.display = 'block';
                document.getElementById('projects-view').style.display = 'none';
                document.getElementById('analytics-view').style.display = 'none';
                this.renderRecentItems();
                break;
            case 'search':
                // Search is handled by input field
                break;
        }
    }

    showSuccessAnimation() {
        // Create and show confetti animation
        const animation = document.createElement('div');
        animation.className = 'success-animation-overlay';
        animation.innerHTML = '🎉';
        animation.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 48px;
            z-index: 1001;
            animation: bounce 0.6s ease-out;
        `;
        
        document.body.appendChild(animation);
        
        setTimeout(() => {
            animation.remove();
        }, 600);
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    async saveUserData() {
        try {
            await chrome.storage.local.set({
                savedItems: this.savedItems,
                engagementLevel: this.engagementLevel,
                currentProject: this.currentProject,
                userHasImported: this.userHasImported
            });
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    formatDateHeader(dateString) {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const date = new Date(dateString).toDateString();
        
        if (date === today) return 'TODAY';
        if (date === yesterday) return 'YESTERDAY';
        return date.toUpperCase();
    }

    groupItemsByDate(items) {
        const groups = {};
        items.forEach(item => {
            const date = new Date(item.timestamp).toDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(item);
        });
        return groups;
    }

    getFilteredItems() {
        // Filter based on current tab and search
        let filtered = [...this.savedItems];
        
        // Add more filtering logic as needed
        
        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    createEmptyStateHTML() {
        return `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>No content saved yet</h3>
                <p>Start saving pages to build your knowledge collection</p>
            </div>
        `;
    }

    showContinueSaving() {
        this.engagementLevel = 2;
        this.renderInterface();
    }

    handleSearch(query) {
        // Implement search functionality
        console.log('Search query:', query);
    }

    acceptAISuggestion() {
        // Implement AI suggestion acceptance
        console.log('AI suggestion accepted');
        document.getElementById('ai-suggestions').style.display = 'none';
    }

    createNewProject() {
        // Implement new project creation
        console.log('Create new project');
    }

    renderProjectsView() {
        // Implement projects view rendering
        console.log('Render projects view');
    }

    renderRecentItems() {
        // Implement recent items rendering
        this.renderContentList();
    }

    showErrorMessage(message) {
        // Implement error message display
        console.error(message);
    }

    // Duplicate handling modal for smart save management
    showDuplicateHandlingModal(existingItem, currentTab) {
        const modal = document.createElement('div');
        modal.className = 'duplicate-modal';
        modal.innerHTML = `
            <div class="duplicate-content">
                <div class="duplicate-header">
                    <div class="duplicate-icon">📝</div>
                    <h2>Page Already Saved</h2>
                    <p>This page was saved ${this.formatRelativeTime(existingItem.timestamp)}</p>
                </div>
                <div class="duplicate-info">
                    <div class="existing-item-preview">
                        <strong>${existingItem.title || currentTab.title}</strong>
                        <div class="item-meta">
                            <span>📁 ${existingItem.project || 'General'}</span>
                            <span>🕒 ${this.formatRelativeTime(existingItem.timestamp)}</span>
                        </div>
                    </div>
                </div>
                <div class="duplicate-actions">
                    <button class="duplicate-btn primary" data-action="update">
                        <span class="btn-icon">🔄</span>
                        <div class="btn-content">
                            <strong>Update Existing</strong>
                            <small>Replace with current version</small>
                        </div>
                    </button>
                    <button class="duplicate-btn secondary" data-action="new-version">
                        <span class="btn-icon">📋</span>
                        <div class="btn-content">
                            <strong>Save as New</strong>
                            <small>Keep both versions</small>
                        </div>
                    </button>
                    <button class="duplicate-btn tertiary" data-action="view">
                        <span class="btn-icon">👁️</span>
                        <div class="btn-content">
                            <strong>View Existing</strong>
                            <small>See what you saved</small>
                        </div>
                    </button>
                </div>
                <button class="duplicate-close">Cancel</button>
            </div>
        `;
        
        // Style the modal
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1002;
            background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.querySelector('.duplicate-content').style.cssText = `
            background: white; color: #333; padding: 30px; border-radius: 16px; text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3); max-width: 450px; width: 90%;
            animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners for all buttons
        modal.addEventListener('click', async (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            const closeBtn = e.target.closest('.duplicate-close');
            
            if (action) {
                await this.handleDuplicateAction(action, existingItem, currentTab);
                modal.remove();
            } else if (closeBtn) {
                modal.remove();
            }
        });
        
        console.log(`⚠️ Duplicate detected for URL: ${existingItem.url}`);
    }

    // Handle duplicate action choices
    async handleDuplicateAction(action, existingItem, currentTab) {
        switch (action) {
            case 'update':
                // Replace existing item with updated version
                const updatedItem = {
                    ...existingItem,
                    title: currentTab.title,
                    timestamp: new Date().toISOString(),
                    favicon: currentTab.favIconUrl
                };
                
                const itemIndex = this.savedItems.findIndex(item => item.id === existingItem.id);
                if (itemIndex !== -1) {
                    this.savedItems[itemIndex] = updatedItem;
                    await this.saveUserData();
                    this.renderInterface();
                    this.showUpdateSuccessMessage();
                }
                break;
                
            case 'new-version':
                // Save as new version with timestamp differentiation
                const newItem = {
                    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    type: 'link',
                    title: currentTab.title + ' (Updated)',
                    url: currentTab.url,
                    favicon: currentTab.favIconUrl,
                    timestamp: new Date().toISOString(),
                    project: this.currentProject === 'All Items' ? null : this.currentProject
                };
                
                this.savedItems.push(newItem);
                await this.saveUserData();
                this.determineEngagementLevel();
                this.renderInterface();
                this.showSuccessAnimation();
                break;
                
            case 'view':
                // Open existing item for viewing (would need detail modal)
                console.log('View existing item:', existingItem);
                break;
        }
    }

    // Show update success message
    showUpdateSuccessMessage() {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed; top: 20px; right: 20px; z-index: 1003;
                background: #059669; color: white; padding: 12px 20px;
                border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: slideInRight 0.4s ease;
            ">
                ✅ Page Updated Successfully
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.4s ease';
            setTimeout(() => notification.remove(), 400);
        }, 3000);
    }

    // Import functionality
    showImportModal() {
        const modal = document.createElement('div');
        modal.className = 'import-modal';
        modal.innerHTML = `
            <div class="import-modal-content">
                <div class="import-header">
                    <h2>Import Your Bookmarks</h2>
                    <p>Bring your existing collection into Nuovix instantly</p>
                </div>
                <div class="import-options">
                    <button class="import-option-btn" data-type="chrome">
                        <div class="import-option-icon">🌐</div>
                        <div class="import-option-content">
                            <strong>Chrome Bookmarks</strong>
                            <small>Direct import from browser</small>
                        </div>
                    </button>
                    <button class="import-option-btn" data-type="file">
                        <div class="import-option-icon">📄</div>
                        <div class="import-option-content">
                            <strong>HTML/CSV File</strong>
                            <small>Upload exported bookmarks</small>
                        </div>
                    </button>
                    <button class="import-option-btn" data-type="pocket">
                        <div class="import-option-icon">📚</div>
                        <div class="import-option-content">
                            <strong>Pocket/Raindrop</strong>
                            <small>Migrate from other services</small>
                        </div>
                    </button>
                </div>
                <div class="import-footer">
                    <button class="import-cancel">Maybe Later</button>
                </div>
            </div>
        `;
        
        // Style the modal
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1002;
            background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        
        modal.querySelector('.import-modal-content').style.cssText = `
            background: white; color: #333; padding: 40px; border-radius: 20px; text-align: center;
            box-shadow: 0 25px 50px rgba(0,0,0,0.25); max-width: 500px; width: 90%;
            animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.addEventListener('click', async (e) => {
            const importType = e.target.closest('[data-type]')?.dataset.type;
            const cancelBtn = e.target.closest('.import-cancel');
            
            if (importType) {
                await this.handleImportType(importType);
                modal.remove();
            } else if (cancelBtn) {
                modal.remove();
            }
        });
    }

    async handleImportType(type) {
        switch (type) {
            case 'chrome':
                await this.importChromeBookmarks();
                break;
            case 'file':
                this.showFileImport();
                break;
            case 'pocket':
                this.showServiceImport();
                break;
        }
    }

    async importChromeBookmarks() {
        try {
            this.showImportProgress('Reading Chrome bookmarks...');
            
            // Access Chrome bookmarks API
            const bookmarks = await chrome.bookmarks.getTree();
            const flatBookmarks = this.processBookmarksTree(bookmarks);
            
            this.showImportProgress(`Processing ${flatBookmarks.length} bookmarks...`);
            
            // Convert bookmarks to Nuovix format with deduplication
            const importedItems = await this.convertBookmarksToItems(flatBookmarks);
            
            await this.handleImportSuccess(importedItems, 'Chrome Bookmarks');
        } catch (error) {
            console.error('Error importing Chrome bookmarks:', error);
            this.showErrorMessage('Unable to access Chrome bookmarks. Please check permissions or try file import instead.');
        }
    }

    processBookmarksTree(bookmarksTree, currentPath = []) {
        let flatBookmarks = [];
        
        for (const node of bookmarksTree) {
            if (node.children) {
                // This is a folder
                const folderPath = [...currentPath];
                if (node.title && node.title !== 'Bookmarks bar' && node.title !== 'Other bookmarks') {
                    folderPath.push(node.title);
                }
                flatBookmarks = flatBookmarks.concat(
                    this.processBookmarksTree(node.children, folderPath)
                );
            } else if (node.url && node.title) {
                // This is a bookmark
                flatBookmarks.push({
                    title: node.title,
                    url: node.url,
                    folder: currentPath.length > 0 ? currentPath.join(' > ') : 'Imported',
                    dateAdded: node.dateAdded ? new Date(node.dateAdded) : new Date()
                });
            }
        }
        
        return flatBookmarks;
    }

    async convertBookmarksToItems(bookmarks) {
        const existingUrls = new Set(this.savedItems.map(item => item.url));
        const importedItems = [];
        let duplicates = 0;
        
        for (const bookmark of bookmarks) {
            // Skip duplicates based on URL
            if (existingUrls.has(bookmark.url)) {
                duplicates++;
                continue;
            }
            
            // Convert to Nuovix item format
            const item = {
                id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'link',
                title: bookmark.title,
                url: bookmark.url,
                timestamp: bookmark.dateAdded.toISOString(),
                project: bookmark.folder,
                source: 'chrome_bookmarks',
                intelligence: {
                    contentType: 'bookmark'
                },
                preview: this.generatePreview(bookmark.title, bookmark.url)
            };
            
            importedItems.push(item);
            existingUrls.add(bookmark.url);
        }
        
        if (duplicates > 0) {
            console.log(`Skipped ${duplicates} duplicate bookmarks`);
        }
        
        return importedItems;
    }

    generatePreview(title, url) {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            return `${title.substring(0, 100)}${title.length > 100 ? '...' : ''} - ${domain}`;
        } catch {
            return title.substring(0, 100) + (title.length > 100 ? '...' : '');
        }
    }


    async handleImportSuccess(importedItems, source = 'Import') {
        // Skip progressive disclosure for import users
        this.savedItems = [...this.savedItems, ...importedItems];
        this.userHasImported = true;
        this.engagementLevel = 3; // Jump to power user
        
        // Save to storage
        await this.saveUserData();
        
        // Show import success celebration
        this.showImportCelebration(importedItems.length, source);
        
        // Enable all features immediately
        this.renderInterface();
        
        // Prompt for organization after celebration
        setTimeout(() => {
            this.showProjectOrganizationPrompt();
        }, 3000);
    }

    showImportCelebration(count, source = 'Import') {
        const celebration = document.createElement('div');
        celebration.innerHTML = `
            <div style="
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                z-index: 1003; background: linear-gradient(135deg, #059669 0%, #047857 100%);
                color: white; padding: 30px; border-radius: 20px; text-align: center;
                box-shadow: 0 25px 50px rgba(0,0,0,0.3); animation: celebrationBounce 0.8s ease;
            ">
                <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                <h2 style="margin: 0 0 8px;">Import Successful!</h2>
                <p style="margin: 0; opacity: 0.9;">Imported ${count.toLocaleString()} bookmarks from ${source}</p>
                <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.8;">Welcome to the power user experience!</p>
            </div>
        `;
        
        document.body.appendChild(celebration);
        
        setTimeout(() => {
            celebration.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => celebration.remove(), 500);
        }, 2500);
    }

    showImportProgress(message) {
        // Remove existing progress if any
        const existing = document.getElementById('import-progress');
        if (existing) existing.remove();
        
        const progress = document.createElement('div');
        progress.id = 'import-progress';
        progress.innerHTML = `
            <div style="
                position: fixed; top: 20px; right: 20px; z-index: 1004;
                background: rgba(0,0,0,0.9); color: white; padding: 16px 20px;
                border-radius: 12px; font-size: 14px; display: flex; align-items: center;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3); animation: slideInRight 0.3s ease;
            ">
                <div style="width: 16px; height: 16px; border: 2px solid #fff; border-top: 2px solid transparent; 
                           border-radius: 50%; animation: spin 1s linear infinite; margin-right: 12px;"></div>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(progress);
    }

    showErrorMessage(message) {
        const error = document.createElement('div');
        error.innerHTML = `
            <div style="
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                z-index: 1003; background: #DC2626; color: white; padding: 20px 30px;
                border-radius: 12px; text-align: center; max-width: 400px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3); animation: slideUp 0.3s ease;
            ">
                <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
                <p style="margin: 0; font-weight: 500;">${message}</p>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    margin-top: 16px; background: rgba(255,255,255,0.2); color: white;
                    border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;
                ">Dismiss</button>
            </div>
        `;
        
        document.body.appendChild(error);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (error.parentNode) error.remove();
        }, 5000);
    }

    showFileImport() {
        // Placeholder for file import functionality
        this.showErrorMessage('File import coming soon! Try Chrome bookmarks import for now.');
    }

    showServiceImport() {
        // Placeholder for service import functionality
        this.showErrorMessage('Service import coming soon! Try Chrome bookmarks import for now.');
    }

    showProjectOrganizationPrompt() {
        // Future: Show smart organization suggestions
        console.log('Project organization prompt would appear here');
    }
}

// Initialize the side panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NuovixSidePanel();
});

// Global functions for content card actions
window.editItem = (itemId) => {
    console.log('Edit item:', itemId);
    // Implement edit functionality
};

window.moveItem = (itemId) => {
    console.log('Move item:', itemId);
    // Implement move functionality
};

window.tagItem = (itemId) => {
    console.log('Tag item:', itemId);
    // Implement tag functionality
};

window.deleteItem = (itemId) => {
    console.log('Delete item:', itemId);
    // Implement delete functionality
};