// Quaeli Debug Dashboard Controller
// Real-time debugging interface for the extension

class DebugDashboard {
    constructor() {
        this.logs = [];
        this.filteredLogs = [];
        this.isLivePaused = false;
        this.filters = {
            levels: new Set(['INFO', 'WARN', 'ERROR', 'SUCCESS', 'DEBUG', 'FLOW_START', 'FLOW_STEP', 'FLOW_END', 'TIMER_START', 'TIMER_END', 'STORAGE_OP', 'COMPONENT']),
            contexts: new Set(),
            timeRange: '5m',
            searchQuery: ''
        };
        
        this.sessionStartTime = Date.now();
        this.logger = new DebugLogger('debug-dashboard');
        
        this.init();
    }

    async init() {
        this.logger.info('Debug Dashboard initializing');
        
        // Load existing logs
        await this.loadInitialLogs();
        
        // Setup UI event listeners
        this.setupEventListeners();
        
        // Setup real-time log listening
        this.setupLogListener();
        
        // Start periodic updates
        this.startPeriodicUpdates();
        
        // Initial render
        this.renderFilters();
        this.applyFilters();
        this.updateMetrics();
        this.updateStorageInspector();
        
        this.logger.success('Debug Dashboard initialized');
    }

    async loadInitialLogs() {
        try {
            const { debug_logs = [] } = await chrome.storage.local.get('debug_logs');
            this.logs = debug_logs;
            this.logger.info('Loaded initial logs', { count: this.logs.length });
        } catch (error) {
            this.logger.error('Failed to load initial logs', error);
        }
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('searchBox').addEventListener('input', (e) => {
            this.filters.searchQuery = e.target.value.toLowerCase();
            this.applyFilters();
        });

        // Pause/resume button
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.toggleLive();
        });

        // Clear logs button
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearLogs();
        });

        // Export logs button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportLogs();
        });

        // Time range filter
        document.getElementById('timeRange').addEventListener('change', (e) => {
            this.filters.timeRange = e.target.value;
            this.applyFilters();
        });
    }

    setupLogListener() {
        // Listen for new log messages
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'DEBUG_LOG') {
                this.handleNewLog(message.data);
                sendResponse({ received: true });
            }
        });

        // Also listen for storage changes
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && changes.debug_logs && !this.isLivePaused) {
                this.handleStorageChange(changes.debug_logs.newValue || []);
            }
        });
    }

    handleNewLog(logEntry) {
        if (this.isLivePaused) return;
        
        // Add to logs array
        this.logs.push(logEntry);
        
        // Trim if too many logs
        if (this.logs.length > 1000) {
            this.logs = this.logs.slice(-1000);
        }
        
        // Update contexts filter if new context appears
        this.filters.contexts.add(logEntry.context);
        
        // Re-apply filters and update display
        this.applyFilters();
        this.updateLogStats();
    }

    handleStorageChange(newLogs) {
        // Full refresh from storage (fallback)
        this.logs = newLogs;
        this.applyFilters();
        this.updateLogStats();
    }

    renderFilters() {
        this.renderLevelFilters();
        this.renderContextFilters();
    }

    renderLevelFilters() {
        const container = document.getElementById('levelFilters');
        const levels = [
            { key: 'ERROR', label: 'Errors', color: '#ef4444' },
            { key: 'WARN', label: 'Warnings', color: '#f59e0b' },
            { key: 'SUCCESS', label: 'Success', color: '#22c55e' },
            { key: 'INFO', label: 'Info', color: '#3b82f6' },
            { key: 'DEBUG', label: 'Debug', color: '#6b7280' },
            { key: 'FLOW_START', label: 'Flow Start', color: '#8b5cf6' },
            { key: 'FLOW_STEP', label: 'Flow Step', color: '#a855f7' },
            { key: 'FLOW_END', label: 'Flow End', color: '#c084fc' },
            { key: 'TIMER_START', label: 'Timer Start', color: '#06b6d4' },
            { key: 'TIMER_END', label: 'Timer End', color: '#0891b2' },
            { key: 'STORAGE_OP', label: 'Storage Ops', color: '#f97316' },
            { key: 'COMPONENT', label: 'Components', color: '#84cc16' }
        ];

        container.innerHTML = levels.map(level => `
            <div class="filter-item ${this.filters.levels.has(level.key) ? 'active' : ''}" 
                 data-level="${level.key}">
                <div class="filter-checkbox ${this.filters.levels.has(level.key) ? 'checked' : ''}" 
                     style="border-color: ${level.color}; ${this.filters.levels.has(level.key) ? `background: ${level.color}` : ''}"></div>
                <span>${level.label}</span>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.filter-item').forEach(item => {
            item.addEventListener('click', () => {
                const level = item.dataset.level;
                const checkbox = item.querySelector('.filter-checkbox');
                
                if (this.filters.levels.has(level)) {
                    this.filters.levels.delete(level);
                    item.classList.remove('active');
                    checkbox.classList.remove('checked');
                    checkbox.style.background = '#1a1a1a';
                } else {
                    this.filters.levels.add(level);
                    item.classList.add('active');
                    checkbox.classList.add('checked');
                    const levelConfig = levels.find(l => l.key === level);
                    checkbox.style.background = levelConfig.color;
                }
                
                this.applyFilters();
            });
        });
    }

    renderContextFilters() {
        const container = document.getElementById('contextFilters');
        const contexts = Array.from(new Set(this.logs.map(log => log.context)));
        
        // Update the contexts filter set
        contexts.forEach(context => this.filters.contexts.add(context));
        
        if (contexts.length === 0) {
            container.innerHTML = '<div style="color: #666; font-size: 0.8rem;">No contexts yet</div>';
            return;
        }

        container.innerHTML = contexts.map(context => `
            <div class="filter-item active" data-context="${context}">
                <div class="filter-checkbox checked"></div>
                <span>${context}</span>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.filter-item').forEach(item => {
            item.addEventListener('click', () => {
                const context = item.dataset.context;
                const checkbox = item.querySelector('.filter-checkbox');
                
                if (this.filters.contexts.has(context)) {
                    this.filters.contexts.delete(context);
                    item.classList.remove('active');
                    checkbox.classList.remove('checked');
                } else {
                    this.filters.contexts.add(context);
                    item.classList.add('active');
                    checkbox.classList.add('checked');
                }
                
                this.applyFilters();
            });
        });
    }

    applyFilters() {
        let filtered = [...this.logs];

        // Apply time range filter
        if (this.filters.timeRange !== 'all') {
            const now = Date.now();
            const ranges = {
                '1m': 60 * 1000,
                '5m': 5 * 60 * 1000,
                '30m': 30 * 60 * 1000,
                '1h': 60 * 60 * 1000
            };
            
            const cutoff = now - ranges[this.filters.timeRange];
            filtered = filtered.filter(log => new Date(log.timestamp).getTime() >= cutoff);
        }

        // Apply level filter
        filtered = filtered.filter(log => this.filters.levels.has(log.level));

        // Apply context filter
        filtered = filtered.filter(log => this.filters.contexts.has(log.context));

        // Apply search filter
        if (this.filters.searchQuery) {
            filtered = filtered.filter(log => 
                log.message.toLowerCase().includes(this.filters.searchQuery) ||
                log.context.toLowerCase().includes(this.filters.searchQuery) ||
                JSON.stringify(log.data).toLowerCase().includes(this.filters.searchQuery)
            );
        }

        this.filteredLogs = filtered;
        this.renderLogs();
        this.updateLogStats();
    }

    renderLogs() {
        const container = document.getElementById('logList');
        
        if (this.filteredLogs.length === 0) {
            container.innerHTML = `
                <div class="loading">
                    <span>No logs match current filters</span>
                </div>
            `;
            return;
        }

        // Render logs (most recent first)
        const logs = [...this.filteredLogs].reverse();
        
        container.innerHTML = logs.map(log => this.renderLogEntry(log)).join('');
        
        // Auto-scroll to top for new logs (if not manually scrolled)
        if (container.scrollTop === 0 || container.scrollTop < 50) {
            container.scrollTop = 0;
        }
    }

    renderLogEntry(log) {
        const timestamp = new Date(log.timestamp);
        const timeStr = timestamp.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            fractionalSecondDigits: 3
        });

        const levelClass = log.level.toLowerCase().replace('_', '');
        const hasData = Object.keys(log.data).length > 0;

        return `
            <div class="log-entry ${levelClass}">
                <div class="log-meta">
                    <span>${timeStr}</span>
                    <span class="log-context">${log.context}</span>
                    <span style="color: #666;">${log.level}</span>
                </div>
                <div class="log-message">${this.escapeHtml(log.message)}</div>
                ${hasData ? `<div class="log-data">${this.formatLogData(log.data)}</div>` : ''}
            </div>
        `;
    }

    formatLogData(data) {
        try {
            return JSON.stringify(data, null, 2);
        } catch (error) {
            return String(data);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateLogStats() {
        const total = this.filteredLogs.length;
        const errors = this.filteredLogs.filter(log => log.level === 'ERROR').length;
        const warnings = this.filteredLogs.filter(log => log.level === 'WARN').length;

        document.getElementById('totalLogs').textContent = `${total} log${total !== 1 ? 's' : ''}`;
        document.getElementById('errorCount').textContent = `${errors} error${errors !== 1 ? 's' : ''}`;
        document.getElementById('warningCount').textContent = `${warnings} warning${warnings !== 1 ? 's' : ''}`;
    }

    updateMetrics() {
        // Session duration
        const duration = Date.now() - this.sessionStartTime;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        document.getElementById('sessionTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Capture count (approximate from logs)
        const captures = this.logs.filter(log => 
            log.message.includes('capture') || 
            log.level === 'STORAGE_OP'
        ).length;
        document.getElementById('captureCount').textContent = captures;

        // Storage size estimate
        this.updateStorageSize();
    }

    async updateStorageSize() {
        try {
            const storage = await chrome.storage.local.get();
            const size = JSON.stringify(storage).length;
            const kb = (size / 1024).toFixed(1);
            document.getElementById('storageSize').textContent = `${kb} KB`;
        } catch (error) {
            document.getElementById('storageSize').textContent = 'Unknown';
        }
    }

    async updateStorageInspector() {
        try {
            const storage = await chrome.storage.local.get();
            const container = document.getElementById('storageInspector');
            
            const keys = Object.keys(storage).filter(key => !key.startsWith('debug_logs'));
            
            if (keys.length === 0) {
                container.innerHTML = '<div style="color: #666;">No storage data</div>';
                return;
            }

            container.innerHTML = keys.slice(0, 10).map(key => {
                const value = storage[key];
                const preview = typeof value === 'object' ? 
                    JSON.stringify(value, null, 2).substring(0, 200) + '...' : 
                    String(value).substring(0, 200);

                return `
                    <div class="storage-key" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                        📦 ${key}
                    </div>
                    <div class="storage-value" style="display: none;">${this.escapeHtml(preview)}</div>
                `;
            }).join('') + (keys.length > 10 ? `<div style="color: #666; margin-top: 1rem;">... and ${keys.length - 10} more</div>` : '');

        } catch (error) {
            document.getElementById('storageInspector').innerHTML = `
                <div style="color: #ef4444;">Failed to load storage: ${error.message}</div>
            `;
        }
    }

    toggleLive() {
        const btn = document.getElementById('pauseBtn');
        this.isLivePaused = !this.isLivePaused;
        
        btn.textContent = this.isLivePaused ? 'Resume' : 'Pause';
        btn.className = this.isLivePaused ? 'btn primary' : 'btn';
        
        this.logger.info(`Live monitoring ${this.isLivePaused ? 'paused' : 'resumed'}`);
    }

    async clearLogs() {
        if (confirm('Are you sure you want to clear all logs?')) {
            try {
                await chrome.storage.local.set({ debug_logs: [] });
                this.logs = [];
                this.filteredLogs = [];
                this.renderLogs();
                this.updateLogStats();
                this.logger.info('All logs cleared');
            } catch (error) {
                this.logger.error('Failed to clear logs', error);
            }
        }
    }

    async exportLogs() {
        try {
            const logsToExport = this.filters.searchQuery || this.filteredLogs.length < this.logs.length ? 
                this.filteredLogs : this.logs;
            
            const data = JSON.stringify(logsToExport, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `quaeli-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            this.logger.success('Logs exported', { count: logsToExport.length });
        } catch (error) {
            this.logger.error('Failed to export logs', error);
        }
    }

    startPeriodicUpdates() {
        // Update metrics every second
        setInterval(() => {
            this.updateMetrics();
        }, 1000);

        // Update storage inspector every 5 seconds
        setInterval(() => {
            this.updateStorageInspector();
        }, 5000);

        // Re-render context filters every 10 seconds (in case new contexts appear)
        setInterval(() => {
            if (!this.isLivePaused) {
                this.renderContextFilters();
            }
        }, 10000);
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DebugDashboard();
});