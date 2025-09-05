/**
 * LinkMind Enterprise - Professional Knowledge Management Interface
 * Implements enterprise-grade design system with polished interactions
 */

class EnterpriseSidepanel {
    constructor() {
        this.capturedContent = [];
        this.filteredContent = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.isLoading = false;
        
        // Enterprise interaction settings
        this.transitions = {
            fast: 150,
            normal: 200,
            slow: 300
        };
        
        this.init();
    }

    async init() {
        console.log('🏢 Initializing Enterprise LinkMind Interface...');
        
        this.setupEventListeners();
        this.setupInteractionEffects();
        await this.loadCapturedContent();
        this.displayContent();
        
        // Professional loading completion
        this.completeInitialization();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchClear = document.getElementById('searchClear');
        
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearchInput.bind(this));
            searchInput.addEventListener('focus', this.handleSearchFocus.bind(this));
            searchInput.addEventListener('blur', this.handleSearchBlur.bind(this));
        }
        
        if (searchClear) {
            searchClear.addEventListener('click', this.clearSearch.bind(this));
        }
        
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', this.handleFilterClick.bind(this));
        });
        
        // Action buttons
        document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
            btn.addEventListener('click', this.handleButtonClick.bind(this));
        });
        
        // Header actions
        document.querySelectorAll('.btn-icon').forEach(btn => {
            btn.addEventListener('click', this.handleHeaderAction.bind(this));
        });
        
        // Modal system
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', this.handleModalOverlayClick.bind(this));
        }
        
        // Keyboard shortcuts for enterprise users
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Real-time data updates
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.onChanged.addListener(this.handleStorageChange.bind(this));
        }
    }

    setupInteractionEffects() {
        // Professional hover effects
        document.addEventListener('mouseover', this.handleGlobalHover.bind(this));
        document.addEventListener('mouseout', this.handleGlobalHoverEnd.bind(this));
        
        // Focus management for accessibility
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
        document.addEventListener('focusout', this.handleFocusOut.bind(this));
        
        // Touch support for mobile enterprise users
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }

    async loadCapturedContent() {
        try {
            this.isLoading = true;
            this.showLoadingState();
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const data = await chrome.storage.local.get();
                
                this.capturedContent = Object.keys(data)
                    .filter(key => key.startsWith('capture_'))
                    .map(key => ({
                        id: key,
                        ...data[key],
                        timestamp: new Date(data[key].timestamp)
                    }))
                    .sort((a, b) => b.timestamp - a.timestamp);
                
                console.log('📊 Enterprise data loaded:', this.capturedContent.length, 'items');
                this.updateFilterCounts();
                
            } else {
                // Professional demo data
                this.capturedContent = this.generateEnterpriseDemo();
                console.log('🏢 Using enterprise demo data');
            }
            
        } catch (error) {
            console.error('❌ Enterprise data loading error:', error);
            this.showNotification('Failed to load knowledge base', 'error', 'Data Loading Error');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    generateEnterpriseDemo() {
        const demoItems = [
            {
                type: 'document',
                title: 'API Documentation - User Authentication',
                content: 'Comprehensive guide to implementing secure user authentication using OAuth 2.0 and JWT tokens...',
                url: 'https://docs.company.com/api/auth',
                domain: 'docs.company.com',
                tags: ['api', 'security', 'authentication']
            },
            {
                type: 'code',
                title: 'React Component Library Standards',
                content: 'Enterprise standards for building reusable React components with TypeScript and proper testing...',
                url: 'https://github.com/company/component-lib',
                domain: 'github.com',
                tags: ['react', 'components', 'standards']
            },
            {
                type: 'document',
                title: 'Database Migration Strategy',
                content: 'Step-by-step approach for migrating legacy systems to cloud infrastructure with zero downtime...',
                url: 'https://confluence.company.com/db-migration',
                domain: 'confluence.company.com',
                tags: ['database', 'migration', 'cloud']
            },
            {
                type: 'media',
                title: 'Architecture Diagram - Microservices',
                content: 'System architecture showing microservices communication patterns and data flow...',
                url: 'https://drive.company.com/architecture-diagrams',
                domain: 'drive.company.com',
                tags: ['architecture', 'microservices', 'diagram']
            },
            {
                type: 'document',
                title: 'Security Compliance Checklist',
                content: 'Complete checklist for ensuring SOC 2 compliance across all enterprise applications...',
                url: 'https://security.company.com/compliance',
                domain: 'security.company.com',
                tags: ['security', 'compliance', 'soc2']
            },
            {
                type: 'code',
                title: 'GraphQL Schema Design Patterns',
                content: 'Best practices for designing scalable GraphQL schemas in enterprise environments...',
                url: 'https://graphql.company.com/patterns',
                domain: 'graphql.company.com',
                tags: ['graphql', 'schema', 'patterns']
            }
        ];
        
        return demoItems.map((item, index) => ({
            id: `demo_${Date.now()}_${index}`,
            ...item,
            timestamp: new Date(Date.now() - index * 7200000), // 2 hour intervals
            intelligence: {
                contentType: item.type,
                isCode: item.type === 'code',
                connections: Math.floor(Math.random() * 6) + 2,
                importance: Math.random() > 0.5 ? 'high' : 'medium'
            }
        }));
    }

    displayContent(content = null) {
        const contentList = document.getElementById('contentList');
        if (!contentList) return;
        
        const itemsToDisplay = content || this.getFilteredContent();
        
        // Professional content rendering
        this.fadeOutContent(contentList, () => {
            contentList.innerHTML = '';
            
            if (itemsToDisplay.length === 0) {
                this.displayEmptyState(contentList);
                return;
            }
            
            itemsToDisplay.forEach((item, index) => {
                const cardElement = this.createEnterpriseContentCard(item, index);
                contentList.appendChild(cardElement);
            });
            
            this.fadeInContent(contentList);
        });
    }

    createEnterpriseContentCard(item, index) {
        const card = document.createElement('div');
        card.className = 'content-card';
        card.setAttribute('data-item-id', item.id);
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `${item.title} - Click to view details`);
        
        const cardIcon = this.createCardIcon(item.type);
        const timeAgo = this.formatTimeAgo(item.timestamp);
        const preview = this.getContentPreview(item);
        const domain = this.extractDomain(item.url);
        
        card.innerHTML = `
            ${cardIcon}
            <div class="card-content">
                <div class="card-title">${this.escapeHtml(item.title || 'Untitled Document')}</div>
                <div class="card-meta">
                    <span class="card-time">${timeAgo}</span>
                    <span class="card-separator">•</span>
                    <span class="card-domain">${domain}</span>
                    ${item.intelligence?.connections ? `
                        <span class="connection-badge">
                            <svg viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"/>
                            </svg>
                            ${item.intelligence.connections}
                        </span>
                    ` : ''}
                </div>
                <div class="card-preview">${this.escapeHtml(preview)}</div>
            </div>
            <div class="card-actions">
                <button class="card-action-btn" onclick="enterpriseSidepanel.viewContent('${item.id}')" title="View Document" aria-label="View document details">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                    </svg>
                </button>
                <button class="card-action-btn" onclick="enterpriseSidepanel.editContent('${item.id}')" title="Edit Document" aria-label="Edit document">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                </button>
                <button class="card-action-btn" onclick="enterpriseSidepanel.deleteContent('${item.id}')" title="Delete Document" aria-label="Delete document">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clip-rule="evenodd"/>
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
        `;
        
        this.attachCardInteractions(card);
        return card;
    }

    createCardIcon(type) {
        const iconMap = {
            document: `
                <div class="card-icon type-document">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
                    </svg>
                </div>
            `,
            code: `
                <div class="card-icon type-code">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </div>
            `,
            media: `
                <div class="card-icon type-media">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
                    </svg>
                </div>
            `
        };
        
        return iconMap[type] || iconMap.document;
    }

    attachCardInteractions(card) {
        // Professional hover effects
        card.addEventListener('mouseenter', (e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.transition = `all ${this.transitions.fast}ms ease-out`;
        });
        
        card.addEventListener('mouseleave', (e) => {
            e.currentTarget.style.transform = 'translateY(0)';
        });
        
        // Keyboard navigation
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const itemId = card.getAttribute('data-item-id');
                this.viewContent(itemId);
            }
        });
        
        // Click handling
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-action-btn')) {
                const itemId = card.getAttribute('data-item-id');
                this.viewContent(itemId);
            }
        });
        
        // Touch support
        card.addEventListener('touchstart', () => {
            card.style.backgroundColor = 'var(--color-gray-50)';
        });
        
        card.addEventListener('touchend', () => {
            setTimeout(() => {
                card.style.backgroundColor = '';
            }, this.transitions.fast);
        });
    }

    getFilteredContent() {
        let filtered = [...this.capturedContent];
        
        // Apply enterprise filters
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(item => {
                switch(this.currentFilter) {
                    case 'notes':
                        return ['document', 'text', 'page', 'research'].includes(item.type);
                    case 'snippets':
                        return item.type === 'code' || (item.intelligence?.isCode === true);
                    case 'images':
                        return ['media', 'image', 'screenshot'].includes(item.type);
                    default:
                        return true;
                }
            });
        }
        
        // Apply search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                (item.title && item.title.toLowerCase().includes(query)) ||
                (item.content && item.content.toLowerCase().includes(query)) ||
                (item.url && item.url.toLowerCase().includes(query)) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
            );
        }
        
        this.filteredContent = filtered;
        return filtered;
    }

    // Event Handlers
    handleSearchInput(e) {
        const input = e.target;
        const clearBtn = document.getElementById('searchClear');
        
        this.searchQuery = input.value.trim();
        
        // Professional search feedback
        if (this.searchQuery) {
            clearBtn.classList.add('visible');
            input.style.paddingRight = '40px';
        } else {
            clearBtn.classList.remove('visible');
            input.style.paddingRight = '40px';
        }
        
        // Debounced search for performance
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.displayContent();
        }, 250);
    }

    handleSearchFocus(e) {
        const wrapper = e.target.closest('.search-wrapper');
        wrapper.style.transform = 'translateY(-1px)';
        wrapper.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
    }

    handleSearchBlur(e) {
        const wrapper = e.target.closest('.search-wrapper');
        wrapper.style.transform = 'translateY(0)';
        wrapper.style.boxShadow = '';
    }

    clearSearch() {
        const input = document.getElementById('searchInput');
        const clearBtn = document.getElementById('searchClear');
        
        input.value = '';
        this.searchQuery = '';
        clearBtn.classList.remove('visible');
        
        // Smooth feedback
        input.style.transform = 'scale(0.98)';
        setTimeout(() => {
            input.style.transform = 'scale(1)';
        }, this.transitions.fast);
        
        input.focus();
        this.displayContent();
    }

    handleFilterClick(e) {
        const tab = e.currentTarget;
        const filter = tab.getAttribute('data-filter');
        
        // Professional state management
        document.querySelectorAll('.filter-tab').forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        
        // Subtle feedback animation
        tab.style.transform = 'scale(1.02)';
        setTimeout(() => {
            tab.style.transform = 'scale(1)';
        }, this.transitions.fast);
        
        this.currentFilter = filter;
        this.displayContent();
    }

    handleButtonClick(e) {
        const button = e.currentTarget;
        const action = button.getAttribute('data-action');
        
        // Professional button feedback
        button.style.transform = 'scale(0.98)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, this.transitions.fast);
        
        switch(action) {
            case 'new-note':
                this.createNewDocument();
                break;
            case 'capture':
                this.quickCapture();
                break;
            case 'sort':
                this.showSortOptions();
                break;
            default:
                console.log('Button action:', action);
        }
    }

    handleHeaderAction(e) {
        const action = e.currentTarget.getAttribute('data-action');
        
        switch(action) {
            case 'export':
                this.exportKnowledgeBase();
                break;
            case 'settings':
                this.openEnterpriseSettings();
                break;
            case 'view-analytics':
                this.viewAnalytics();
                break;
        }
    }

    handleKeyboardShortcuts(e) {
        // Enterprise keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'k':
                    e.preventDefault();
                    document.getElementById('searchInput')?.focus();
                    break;
                case 'n':
                    e.preventDefault();
                    this.createNewDocument();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportKnowledgeBase();
                    break;
                case ',':
                    e.preventDefault();
                    this.openEnterpriseSettings();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            this.closeModal();
        }
    }

    // Content Management
    async viewContent(itemId) {
        const item = this.capturedContent.find(c => c.id === itemId);
        if (!item) return;
        
        const modalContent = `
            <div class="modal-header">
                <h2 class="modal-title">${this.escapeHtml(item.title || 'Untitled Document')}</h2>
                <button class="modal-close" onclick="enterpriseSidepanel.closeModal()" aria-label="Close modal">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="content-metadata">
                    <div class="metadata-grid">
                        <div class="metadata-item">
                            <span class="metadata-label">Type</span>
                            <span class="metadata-value">${this.formatContentType(item.type)}</span>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">Source</span>
                            <a href="${item.url}" target="_blank" rel="noopener" class="metadata-link">${this.extractDomain(item.url)}</a>
                        </div>
                        <div class="metadata-item">
                            <span class="metadata-label">Created</span>
                            <span class="metadata-value">${this.formatFullDate(item.timestamp)}</span>
                        </div>
                        ${item.intelligence?.connections ? `
                            <div class="metadata-item">
                                <span class="metadata-label">Connections</span>
                                <span class="metadata-value">${item.intelligence.connections} related items</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="content-display">
                    ${this.formatContentForDisplay(item)}
                </div>
            </div>
        `;
        
        this.showModal(modalContent);
    }

    async editContent(itemId) {
        const item = this.capturedContent.find(c => c.id === itemId);
        if (!item) return;
        
        const modalContent = `
            <div class="modal-header">
                <h2 class="modal-title">Edit Document</h2>
                <button class="modal-close" onclick="enterpriseSidepanel.closeModal()" aria-label="Close modal">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="editDocumentForm" onsubmit="enterpriseSidepanel.saveEdit('${itemId}', event)">
                    <div class="form-group">
                        <label class="form-label" for="editTitle">Title</label>
                        <input type="text" id="editTitle" class="form-input" value="${this.escapeHtml(item.title || '')}" required />
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="editContent">Content</label>
                        <textarea id="editContent" class="form-textarea" rows="8" required>${this.escapeHtml(item.content || '')}</textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="enterpriseSidepanel.closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        
        this.showModal(modalContent);
    }

    async deleteContent(itemId) {
        const item = this.capturedContent.find(c => c.id === itemId);
        if (!item) return;
        
        if (!confirm(`Delete "${item.title || 'Untitled Document'}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            // Remove from storage
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.remove(itemId);
            }
            
            // Remove from local array with animation
            this.capturedContent = this.capturedContent.filter(c => c.id !== itemId);
            this.removeCardWithAnimation(itemId);
            this.updateFilterCounts();
            
            this.showNotification('Document deleted successfully', 'success', 'Document Deleted');
            
        } catch (error) {
            console.error('❌ Delete error:', error);
            this.showNotification('Failed to delete document', 'error', 'Delete Error');
        }
    }

    // Feature Methods
    createNewDocument() {
        const modalContent = `
            <div class="modal-header">
                <h2 class="modal-title">Create New Document</h2>
                <button class="modal-close" onclick="enterpriseSidepanel.closeModal()" aria-label="Close modal">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="newDocumentForm" onsubmit="enterpriseSidepanel.saveNewDocument(event)">
                    <div class="form-group">
                        <label class="form-label" for="newDocTitle">Document Title</label>
                        <input type="text" id="newDocTitle" class="form-input" placeholder="Enter document title..." required />
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="newDocContent">Content</label>
                        <textarea id="newDocContent" class="form-textarea" rows="10" placeholder="Start writing your document..." required></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="enterpriseSidepanel.closeModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Create Document</button>
                    </div>
                </form>
            </div>
        `;
        
        this.showModal(modalContent);
        
        // Focus management
        setTimeout(() => {
            document.getElementById('newDocTitle')?.focus();
        }, this.transitions.normal);
    }

    quickCapture() {
        this.showNotification('Quick capture functionality coming soon', 'warning', 'Feature Preview');
    }

    showSortOptions() {
        // Implementation for sort dropdown
        this.showNotification('Sort options coming soon', 'warning', 'Feature Preview');
    }

    exportKnowledgeBase() {
        try {
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '2.0.0',
                    itemCount: this.capturedContent.length
                },
                content: this.capturedContent.map(item => ({
                    ...item,
                    timestamp: item.timestamp.toISOString()
                }))
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `linkmind-enterprise-export-${Date.now()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showNotification('Knowledge base exported successfully', 'success', 'Export Complete');
            
        } catch (error) {
            console.error('❌ Export error:', error);
            this.showNotification('Failed to export knowledge base', 'error', 'Export Error');
        }
    }

    openEnterpriseSettings() {
        this.showNotification('Enterprise settings panel coming soon', 'warning', 'Feature Preview');
    }

    viewAnalytics() {
        this.showNotification('Advanced analytics dashboard coming soon', 'warning', 'Feature Preview');
    }

    // Utility Methods
    formatTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return timestamp.toLocaleDateString();
    }

    formatFullDate(timestamp) {
        return timestamp.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatContentType(type) {
        const typeMap = {
            document: 'Document',
            code: 'Code Snippet',
            media: 'Media File',
            text: 'Text Note',
            research: 'Research Note',
            page: 'Web Page'
        };
        return typeMap[type] || 'Document';
    }

    extractDomain(url) {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '');
        } catch {
            return 'Unknown source';
        }
    }

    getContentPreview(item) {
        if (item.type === 'media') {
            return 'Media file attachment';
        }
        
        let content = item.content || '';
        if (content.length > 120) {
            content = content.substring(0, 120) + '...';
        }
        
        return content || 'No preview available';
    }

    formatContentForDisplay(item) {
        if (item.type === 'media') {
            if (item.content && item.content.startsWith('data:image/')) {
                return `<img src="${item.content}" alt="Content image" style="max-width: 100%; height: auto; border-radius: 8px;" />`;
            }
            return '<div class="media-placeholder">Media file</div>';
        }
        
        return `<div class="content-text" style="white-space: pre-wrap; line-height: 1.6;">${this.escapeHtml(item.content || 'No content available')}</div>`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Animation and UI Methods
    fadeOutContent(element, callback) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(8px)';
        element.style.transition = `all ${this.transitions.normal}ms ease-out`;
        setTimeout(callback, this.transitions.normal);
    }

    fadeInContent(element) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }

    removeCardWithAnimation(itemId) {
        const card = document.querySelector(`[data-item-id="${itemId}"]`);
        if (card) {
            card.style.transform = 'translateX(-100%)';
            card.style.opacity = '0';
            card.style.transition = `all ${this.transitions.normal}ms ease-out`;
            
            setTimeout(() => {
                if (card.parentNode) {
                    card.parentNode.removeChild(card);
                }
            }, this.transitions.normal);
        }
    }

    // Modal System
    showModal(content) {
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContent = document.getElementById('modalContent');
        
        modalContent.innerHTML = content;
        modalOverlay.classList.add('active');
        
        // Enterprise focus management
        setTimeout(() => {
            const firstFocusable = modalContent.querySelector('input, textarea, button, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) firstFocusable.focus();
        }, this.transitions.normal);
    }

    closeModal() {
        const modalOverlay = document.getElementById('modalOverlay');
        modalOverlay.classList.remove('active');
    }

    handleModalOverlayClick(e) {
        if (e.target === e.currentTarget) {
            this.closeModal();
        }
    }

    // Notification System
    showNotification(message, type = 'success', title = '') {
        const container = document.getElementById('notificationContainer');
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const iconMap = {
            success: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>',
            error: '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>',
            warning: '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                    ${iconMap[type]}
                </svg>
            </div>
            <div class="notification-content">
                ${title ? `<div class="notification-title">${title}</div>` : ''}
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentNode.remove()" aria-label="Close notification">
                <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
            </button>
        `;
        
        container.appendChild(notification);
        
        // Professional animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto-remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), this.transitions.normal);
        }, 5000);
    }

    // Support Methods
    async saveNewDocument(event) {
        event.preventDefault();
        
        const title = document.getElementById('newDocTitle').value.trim();
        const content = document.getElementById('newDocContent').value.trim();
        
        if (!title || !content) {
            this.showNotification('Please fill in all fields', 'error', 'Validation Error');
            return;
        }
        
        const newDoc = {
            id: `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'document',
            title,
            content,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            intelligence: {
                contentType: 'document',
                isCode: false,
                connections: 0,
                importance: 'medium'
            }
        };
        
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({ [newDoc.id]: newDoc });
            }
            
            this.capturedContent.unshift({
                ...newDoc,
                timestamp: new Date(newDoc.timestamp)
            });
            
            this.updateFilterCounts();
            this.displayContent();
            this.closeModal();
            
            this.showNotification('Document created successfully', 'success', 'Document Created');
            
        } catch (error) {
            console.error('❌ Save error:', error);
            this.showNotification('Failed to create document', 'error', 'Save Error');
        }
    }

    async saveEdit(itemId, event) {
        event.preventDefault();
        
        const title = document.getElementById('editTitle').value.trim();
        const content = document.getElementById('editContent').value.trim();
        
        if (!title || !content) {
            this.showNotification('Please fill in all fields', 'error', 'Validation Error');
            return;
        }
        
        const itemIndex = this.capturedContent.findIndex(c => c.id === itemId);
        if (itemIndex === -1) return;
        
        try {
            const updatedItem = {
                ...this.capturedContent[itemIndex],
                title,
                content
            };
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({ [itemId]: updatedItem });
            }
            
            this.capturedContent[itemIndex] = updatedItem;
            this.displayContent();
            this.closeModal();
            
            this.showNotification('Document updated successfully', 'success', 'Changes Saved');
            
        } catch (error) {
            console.error('❌ Update error:', error);
            this.showNotification('Failed to save changes', 'error', 'Save Error');
        }
    }

    updateFilterCounts() {
        const counts = {
            all: this.capturedContent.length,
            notes: this.capturedContent.filter(item => 
                ['document', 'text', 'page', 'research'].includes(item.type)
            ).length,
            snippets: this.capturedContent.filter(item => 
                item.type === 'code' || item.intelligence?.isCode
            ).length,
            images: this.capturedContent.filter(item => 
                ['media', 'image', 'screenshot'].includes(item.type)
            ).length
        };
        
        Object.keys(counts).forEach(filter => {
            const tab = document.querySelector(`[data-filter="${filter}"] .tab-count`);
            if (tab) {
                tab.textContent = counts[filter];
            }
        });
    }

    showLoadingState() {
        const contentList = document.getElementById('contentList');
        if (contentList) {
            contentList.innerHTML = `
                <div class="loading-text">
                    <div class="loading-spinner"></div>
                    Loading knowledge base...
                </div>
            `;
        }
    }

    hideLoadingState() {
        // Content will be replaced by actual data
    }

    displayEmptyState(container) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <h3 class="empty-title">No documents found</h3>
                <p class="empty-description">Start building your knowledge base by creating your first document or capturing content from the web</p>
                <button class="btn-primary" onclick="enterpriseSidepanel.createNewDocument()">
                    Create First Document
                </button>
            </div>
        `;
    }

    completeInitialization() {
        // Professional initialization completion
        console.log('✅ Enterprise LinkMind initialized successfully');
        
        // Add subtle ready indicator
        const brandIcon = document.querySelector('.brand-icon');
        if (brandIcon) {
            brandIcon.style.opacity = '0.8';
            setTimeout(() => {
                brandIcon.style.opacity = '1';
                brandIcon.style.transition = 'opacity 300ms ease-out';
            }, 100);
        }
    }

    // Global interaction handlers
    handleGlobalHover(e) {
        // Professional hover effects for interactive elements
        if (e.target.matches('.btn-primary, .btn-secondary, .card-action-btn')) {
            e.target.style.transform = 'translateY(-1px)';
        }
    }

    handleGlobalHoverEnd(e) {
        if (e.target.matches('.btn-primary, .btn-secondary, .card-action-btn')) {
            e.target.style.transform = 'translateY(0)';
        }
    }

    handleFocusIn(e) {
        // Enterprise-grade focus management
        if (e.target.matches('input, textarea, button, [tabindex]:not([tabindex="-1"])')) {
            e.target.style.outline = '2px solid var(--color-primary-500)';
            e.target.style.outlineOffset = '2px';
        }
    }

    handleFocusOut(e) {
        e.target.style.outline = '';
        e.target.style.outlineOffset = '';
    }

    handleTouchStart(e) {
        if (e.target.closest('.content-card')) {
            e.target.closest('.content-card').style.backgroundColor = 'var(--color-gray-50)';
        }
    }

    handleTouchEnd(e) {
        if (e.target.closest('.content-card')) {
            setTimeout(() => {
                const card = e.target.closest('.content-card');
                if (card) card.style.backgroundColor = '';
            }, this.transitions.fast);
        }
    }

    handleStorageChange(changes) {
        // Handle real-time updates from extension
        let needsRefresh = false;
        
        for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
            if (key.startsWith('capture_')) {
                needsRefresh = true;
                break;
            }
        }
        
        if (needsRefresh) {
            this.loadCapturedContent().then(() => {
                this.displayContent();
            });
        }
    }
}

// Initialize Enterprise Sidepanel
let enterpriseSidepanel;

document.addEventListener('DOMContentLoaded', () => {
    enterpriseSidepanel = new EnterpriseSidepanel();
});

// Export for global access
window.enterpriseSidepanel = enterpriseSidepanel;