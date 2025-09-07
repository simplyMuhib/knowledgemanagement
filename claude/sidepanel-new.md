<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Claude CLI Instructions: quaeli.com Side Panel Implementation

## Core Instruction for Claude CLI

```
Create a sophisticated Chrome Extension side panel for quaeli.com with progressive disclosure, enterprise-grade UI, and intelligent content management. Implement exactly as specified below.
```


***

## SIDE PANEL FILE STRUCTURE

```
sidepanel/
├── sidepanel.html
├── sidepanel.js  
├── sidepanel.css
└── components/
    ├── content-card.js
    ├── project-selector.js
    └── engagement-tracker.js
```


***

## HTML STRUCTURE (sidepanel.html)

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>quaeli.com</title>
    <link rel="stylesheet" href="sidepanel.css">
</head>
<body>
    <!-- Panel Header -->
    <header class="panel-header">
        <div class="brand-section">
            <div class="brand-logo">⚡</div>
            <span class="brand-text">quaeli.com</span>
        </div>
        <div class="context-section">
            <div class="current-project" id="current-project">All Items</div>
            <button class="settings-btn" id="settings-btn">⚙️</button>
        </div>
    </header>

    <!-- Navigation Tabs (Hidden at Level 0-1) -->
    <nav class="tab-navigation" id="tab-navigation" style="display: none;">
        <button class="tab active" data-tab="all">All</button>
        <button class="tab" data-tab="projects">Projects</button>
        <button class="tab" data-tab="recent">Recent</button>
        <button class="tab level-3-only" data-tab="search" style="display: none;">Search</button>
    </nav>

    <!-- Search Bar (Level 3+ only) -->
    <div class="search-container" id="search-container" style="display: none;">
        <input type="text" class="search-input" placeholder="Search all content..." id="search-input">
        <button class="search-btn">🔍</button>
    </div>

    <!-- Main Content Area -->
    <main class="content-area" id="content-area">
        
        <!-- Level 0: Primary CTA -->
        <div class="engagement-level-0" id="level-0">
            <div class="primary-cta-container">
                <h1 class="cta-title">Save This Page</h1>
                <p class="cta-subtitle">One click to remember this forever</p>
                <button class="primary-cta-btn" id="save-page-btn">
                    Save Current Page
                </button>
                <div class="trust-indicators">
                    <span class="trust-text">🔒 Private by default</span>
                    <span class="social-proof">👥 +1,247 knowledge builders</span>
                </div>
            </div>
        </div>

        <!-- Level 1: Success State -->
        <div class="engagement-level-1" id="level-1" style="display: none;">
            <div class="success-celebration">
                <div class="success-animation">🎉</div>
                <h2 class="success-title">Saved! Welcome to the journey</h2>
                
                <div class="first-save-preview">
                    <h3>Your first capture</h3>
                    <div class="content-card first-save" id="first-save-card">
                        <!-- First saved item will appear here -->
                    </div>
                </div>
                
                <button class="continue-btn" id="continue-saving-btn">Continue Saving</button>
                <div class="gentle-tip">💡 Try selecting text for snippets</div>
            </div>
        </div>

        <!-- Level 2+: Content Management -->
        <div class="engagement-level-2-plus" id="level-2-plus" style="display: none;">
            
            <!-- AI Suggestions -->
            <div class="ai-suggestions" id="ai-suggestions" style="display: none;">
                <div class="suggestion-card">
                    <div class="suggestion-header">🤖 Smart suggestion:</div>
                    <div class="suggestion-content">
                        <div class="suggestion-text">Add to "Frontend Learning"?</div>
                        <div class="suggestion-actions">
                            <button class="accept-btn">✓ Accept</button>
                            <button class="choose-btn">○ Choose Different</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Content List -->
            <div class="content-list" id="content-list">
                <!-- Content items will be dynamically inserted here -->
            </div>

            <!-- Projects View -->
            <div class="projects-view" id="projects-view" style="display: none;">
                <div class="projects-container">
                    <!-- Projects will be dynamically inserted here -->
                </div>
                <button class="new-project-btn" id="new-project-btn">+ New Project</button>
            </div>

            <!-- Analytics (Level 3+ only) -->
            <div class="analytics-view" id="analytics-view" style="display: none;">
                <div class="stats-card">
                    <h3>📊 This week</h3>
                    <div class="stat-item">
                        <span class="stat-number">12</span>
                        <span class="stat-label">saves</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">3</span>
                        <span class="stat-label">projects</span>
                    </div>
                    <div class="highlight-stat">⭐ Top project: React Learning</div>
                </div>
            </div>
        </div>
    </main>

    <!-- Footer CTA (Always Visible) -->
    <footer class="panel-footer">
        <button class="footer-cta-btn" id="footer-cta">
            <span class="footer-cta-text">Save Current Page</span>
        </button>
        <button class="secondary-action" id="bulk-import-btn" style="display: none;">Bulk Import</button>
    </footer>

    <!-- Loading States -->
    <div class="loading-overlay" id="loading-overlay" style="display: none;">
        <div class="loading-spinner"></div>
        <div class="loading-text">Saving...</div>
    </div>

    <script src="sidepanel.js"></script>
</body>
</html>
```


***

## CSS STYLING (sidepanel.css)

```css
/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    /* Color System */
    --primary-gradient: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
    --accent-teal: #0891b2;
    --success-green: #059669;
    --warning-amber: #d97706;
    --danger-red: #dc2626;
    
    /* Surfaces */
    --surface-primary: #ffffff;
    --surface-secondary: #f8fafc;
    --surface-tertiary: #e2e8f0;
    
    /* Text */
    --text-primary: #1e293b;
    --text-secondary: #64748b;
    --text-tertiary: #94a3b8;
    
    /* Spacing */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    
    /* Typography */
    --font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    --text-cta: 24px;
    --text-headline: 20px;
    --text-body-lg: 16px;
    --text-body: 14px;
    --text-caption: 12px;
    
    /* Effects */
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12);
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
}

body {
    font-family: var(--font-family);
    background: var(--surface-primary);
    color: var(--text-primary);
    width: 380px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
}

/* Panel Header */
.panel-header {
    height: 64px;
    padding: var(--spacing-md);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--surface-primary);
    border-bottom: 1px solid var(--surface-tertiary);
    position: sticky;
    top: 0;
    z-index: 100;
}

.brand-section {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.brand-logo {
    font-size: 20px;
    color: var(--accent-teal);
}

.brand-text {
    font-size: var(--text-body-lg);
    font-weight: 700;
    color: var(--text-primary);
}

.context-section {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.current-project {
    font-size: var(--text-caption);
    padding: 4px 8px;
    background: var(--surface-secondary);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
}

.settings-btn {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: var(--radius-sm);
    transition: background-color 0.2s ease;
}

.settings-btn:hover {
    background: var(--surface-secondary);
}

/* Navigation Tabs */
.tab-navigation {
    height: 48px;
    display: flex;
    background: var(--surface-primary);
    border-bottom: 1px solid var(--surface-tertiary);
    position: sticky;
    top: 64px;
    z-index: 99;
}

.tab {
    flex: 1;
    background: none;
    border: none;
    padding: var(--spacing-md);
    font-size: var(--text-body);
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
}

.tab:hover {
    color: var(--text-primary);
    background: var(--surface-secondary);
}

.tab.active {
    color: var(--text-primary);
    border-bottom-color: var(--accent-teal);
    font-weight: 600;
}

/* Search Container */
.search-container {
    padding: var(--spacing-md);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--surface-tertiary);
    position: sticky;
    top: 112px;
    z-index: 98;
}

.search-input {
    width: 100%;
    padding: var(--spacing-md);
    font-size: var(--text-body-lg);
    border: 2px solid transparent;
    border-radius: var(--radius-md);
    background: var(--surface-secondary);
    transition: all 0.3s ease;
}

.search-input:focus {
    outline: none;
    border-color: var(--accent-teal);
    background: var(--surface-primary);
    box-shadow: 0 0 0 4px rgba(8, 145, 178, 0.1);
}

/* Main Content Area */
.content-area {
    flex: 1;
    padding: var(--spacing-lg);
    overflow-y: auto;
}

/* Level 0: Primary CTA */
.engagement-level-0 {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.primary-cta-container {
    text-align: center;
    max-width: 280px;
}

.cta-title {
    font-size: var(--text-cta);
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
}

.cta-subtitle {
    font-size: var(--text-body);
    color: var(--text-secondary);
    margin-bottom: var(--spacing-xl);
}

.primary-cta-btn {
    width: 100%;
    padding: var(--spacing-lg);
    background: var(--primary-gradient);
    color: white;
    border: none;
    border-radius: var(--radius-lg);
    font-size: var(--text-body-lg);
    font-weight: 700;
    cursor: pointer;
    box-shadow: var(--shadow-md);
    transition: all 0.3s ease;
    animation: pulse 2s infinite;
}

.primary-cta-btn:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.primary-cta-btn:active {
    transform: translateY(0);
}

@keyframes pulse {
    0%, 100% { box-shadow: var(--shadow-md); }
    50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.4); }
}

.trust-indicators {
    margin-top: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
}

.trust-text, .social-proof {
    font-size: var(--text-caption);
    color: var(--text-tertiary);
}

/* Level 1: Success State */
.success-celebration {
    text-align: center;
}

.success-animation {
    font-size: 48px;
    margin-bottom: var(--spacing-md);
    animation: bounce 0.6s ease-out;
}

@keyframes bounce {
    0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
    40%, 43% { transform: translate3d(0, -30px, 0); }
    70% { transform: translate3d(0, -15px, 0); }
    90% { transform: translate3d(0, -4px, 0); }
}

.success-title {
    font-size: var(--text-headline);
    font-weight: 700;
    color: var(--success-green);
    margin-bottom: var(--spacing-lg);
}

.first-save-preview h3 {
    font-size: var(--text-body-lg);
    font-weight: 600;
    margin-bottom: var(--spacing-md);
}

.continue-btn {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    background: var(--primary-gradient);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-body-lg);
    font-weight: 600;
    cursor: pointer;
    margin: var(--spacing-lg) 0;
    transition: all 0.3s ease;
}

.continue-btn:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
}

.gentle-tip {
    font-size: var(--text-caption);
    color: var(--text-secondary);
    font-style: italic;
}

/* Content Cards */
.content-card {
    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid var(--surface-tertiary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
    box-shadow: var(--shadow-sm);
    transition: all 0.3s ease;
    position: relative;
}

.content-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.content-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--primary-gradient);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.content-card:hover::before {
    opacity: 1;
}

/* Content Type Styles */
.content-card.link {
    border-left: 4px solid #3b82f6;
}

.content-card.snippet {
    border-left: 4px solid #059669;
}

.content-card.screenshot {
    border-left: 4px solid #d97706;
}

.content-card.note {
    border-left: 4px solid #7c3aed;
}

.content-card-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
}

.content-icon {
    font-size: 16px;
}

.content-title {
    font-size: var(--text-body-lg);
    font-weight: 600;
    color: var(--text-primary);
    flex: 1;
}

.content-meta {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
}

.meta-item {
    font-size: var(--text-caption);
    color: var(--text-secondary);
    padding: 2px 6px;
    background: var(--surface-secondary);
    border-radius: var(--radius-sm);
}

.content-preview {
    font-size: var(--text-body);
    color: var(--text-secondary);
    line-height: 1.5;
    margin-bottom: var(--spacing-md);
}

.content-actions {
    display: flex;
    gap: var(--spacing-sm);
    opacity: 0;
    transition: opacity 0.2s ease;
}

.content-card:hover .content-actions {
    opacity: 1;
}

.action-btn {
    padding: 4px 8px;
    background: none;
    border: 1px solid var(--surface-tertiary);
    border-radius: var(--radius-sm);
    font-size: var(--text-caption);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-btn:hover {
    background: var(--surface-secondary);
    color: var(--text-primary);
}

/* AI Suggestions */
.ai-suggestions {
    margin-bottom: var(--spacing-lg);
}

.suggestion-card {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    border: 1px solid #93c5fd;
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
}

.suggestion-header {
    font-size: var(--text-body);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--spacing-sm);
}

.suggestion-actions {
    display: flex;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-sm);
}

.accept-btn, .choose-btn {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: none;
    border-radius: var(--radius-sm);
    font-size: var(--text-caption);
    cursor: pointer;
    transition: all 0.2s ease;
}

.accept-btn {
    background: var(--success-green);
    color: white;
}

.choose-btn {
    background: var(--surface-secondary);
    color: var(--text-secondary);
}

/* Projects View */
.projects-container {
    display: grid;
    gap: var(--spacing-md);
}

.project-card {
    background: var(--surface-primary);
    border: 1px solid var(--surface-tertiary);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    cursor: pointer;
    transition: all 0.3s ease;
}

.project-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.project-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
}

.project-icon {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    background: var(--primary-gradient);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
}

.project-name {
    font-size: var(--text-body-lg);
    font-weight: 600;
    color: var(--text-primary);
}

.project-stats {
    font-size: var(--text-caption);
    color: var(--text-secondary);
}

.new-project-btn {
    width: 100%;
    padding: var(--spacing-md);
    background: none;
    border: 2px dashed var(--surface-tertiary);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: var(--spacing-md);
}

.new-project-btn:hover {
    border-color: var(--accent-teal);
    color: var(--accent-teal);
}

/* Footer */
.panel-footer {
    padding: var(--spacing-md);
    background: var(--surface-primary);
    border-top: 1px solid var(--surface-tertiary);
    display: flex;
    gap: var(--spacing-sm);
}

.footer-cta-btn {
    flex: 1;
    padding: var(--spacing-md);
    background: var(--primary-gradient);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-body);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.footer-cta-btn:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
}

.secondary-action {
    padding: var(--spacing-md);
    background: none;
    border: 1px solid var(--surface-tertiary);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
}

.secondary-action:hover {
    background: var(--surface-secondary);
    color: var(--text-primary);
}

/* Loading States */
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--surface-tertiary);
    border-top: 3px solid var(--accent-teal);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-text {
    margin-top: var(--spacing-md);
    font-size: var(--text-body);
    color: var(--text-secondary);
}

/* Responsive Design */
@media (max-width: 360px) {
    body {
        width: 320px;
    }
    
    .content-area {
        padding: var(--spacing-md);
    }
    
    .primary-cta-container {
        max-width: 240px;
    }
}

@media (min-width: 480px) {
    body {
        width: 520px;
    }
}

/* Animations */
.fade-in {
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.slide-in {
    animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
    :root {
        --surface-primary: #0f172a;
        --surface-secondary: #1e293b;
        --surface-tertiary: #334155;
        --text-primary: #f1f5f9;
        --text-secondary: #cbd5e1;
        --text-tertiary: #64748b;
    }
    
    .content-card {
        background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
    }
    
    .suggestion-card {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
        border-color: #3b82f6;
    }
}
```


***

## JAVASCRIPT FUNCTIONALITY (sidepanel.js)

```javascript
class QuaeliSidePanel {
    constructor() {
        this.engagementLevel = 0;
        this.savedItems = [];
        this.currentProject = 'All Items';
        this.activeTab = 'all';
        
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
            const result = await chrome.storage.local.get(['savedItems', 'engagementLevel', 'currentProject']);
            this.savedItems = result.savedItems || [];
            this.engagementLevel = result.engagementLevel || 0;
            this.currentProject = result.currentProject || 'All Items';
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    determineEngagementLevel() {
        const saveCount = this.savedItems.length;
        
        if (saveCount === 0) {
            this.engagementLevel = 0;
        } else if (saveCount === 1) {
            this.engagementLevel = 1;
        } else if (saveCount >= 2 && saveCount <= 4) {
            this.engagementLevel = 2;
        } else {
            this.engagementLevel = 3;
        }
    }

    setupEventListeners() {
        // Primary CTA
        document.getElementById('save-page-btn')?.addEventListener('click', () => {
            this.saveCurrentPage();
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
                    <span class="content-title">${item.title}</span>
                </div>
                <div class="content-meta">
                    ${meta.map(m => `<span class="meta-item">${m}</span>`).join('')}
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
                currentProject: this.currentProject
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
}

// Initialize the side panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new QuaeliSidePanel();
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
```


***

## IMPLEMENTATION REQUIREMENTS

1. **Progressive Disclosure**: Implement strict engagement level controls - hide all advanced features until user demonstrates usage
2. **Content Type Support**: Handle links, text snippets, screenshots, and notes with distinct visual styling and functionality
3. **Responsive Design**: Panel should work smoothly from 320px to 520px width
4. **Performance**: All interactions must respond within 100ms, smooth 60fps animations
5. **Accessibility**: Full keyboard navigation, ARIA labels, screen reader support
6. **Storage Integration**: Connect to IndexedDB for persistent storage, chrome.storage for settings
7. **Error Handling**: Graceful error states with actionable recovery options

***

**Claude CLI Execution**: Use this complete specification to build a production-ready side panel that matches the enterprise-grade UI/UX standards described. Focus on pixel-perfect implementation of the progressive disclosure system and content type handling.

