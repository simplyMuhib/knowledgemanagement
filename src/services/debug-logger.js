// Centralized Debug Logging Service for LinkMind Extension
// Provides structured logging across all extension contexts

class DebugLogger {
    constructor(context = 'unknown') {
        this.context = context;
        this.sessionId = this.generateSessionId();
        this.logs = [];
        this.maxLogs = 1000;
        
        // Initialize storage for persistent logs
        this.initializeStorage();
        
        // Listen for log messages from other contexts
        this.setupMessageListener();
    }

    generateSessionId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async initializeStorage() {
        try {
            // Check if we have direct storage access (service worker context)
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const existing = await chrome.storage.local.get('debug_logs');
                if (!existing.debug_logs) {
                    await chrome.storage.local.set({ debug_logs: [] });
                }
            } else {
                // Content script context - storage access via message passing
                console.log('Debug logger initialized in content script context - storage via messaging');
            }
        } catch (error) {
            console.error('Failed to initialize debug storage:', error);
        }
    }

    setupMessageListener() {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.type === 'DEBUG_LOG') {
                    this.handleRemoteLog(message.data);
                    sendResponse({ received: true });
                }
            });
        }
    }

    handleRemoteLog(logData) {
        this.logs.push(logData);
        this.trimLogs();
        this.persistLog(logData);
    }

    // Core logging methods
    info(message, data = {}) {
        this.log('INFO', message, data);
    }

    warn(message, data = {}) {
        this.log('WARN', message, data);
    }

    error(message, error = null, data = {}) {
        const errorData = error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : {};
        
        this.log('ERROR', message, { ...data, error: errorData });
    }

    success(message, data = {}) {
        this.log('SUCCESS', message, data);
    }

    debug(message, data = {}) {
        this.log('DEBUG', message, data);
    }

    // User flow tracking
    startFlow(flowName, data = {}) {
        this.log('FLOW_START', `Started: ${flowName}`, {
            flowName,
            flowId: this.generateFlowId(),
            ...data
        });
    }

    stepFlow(flowName, step, data = {}) {
        this.log('FLOW_STEP', `${flowName}: ${step}`, {
            flowName,
            step,
            ...data
        });
    }

    endFlow(flowName, success = true, data = {}) {
        this.log('FLOW_END', `${success ? 'Completed' : 'Failed'}: ${flowName}`, {
            flowName,
            success,
            ...data
        });
    }

    // Performance tracking
    startTimer(timerName) {
        this.log('TIMER_START', `Timer started: ${timerName}`, {
            timerName,
            startTime: performance.now()
        });
    }

    endTimer(timerName) {
        const endTime = performance.now();
        // Find the start time from recent logs
        const startLog = this.logs.slice(-50).find(log => 
            log.level === 'TIMER_START' && 
            log.data.timerName === timerName
        );
        
        const duration = startLog ? endTime - startLog.data.startTime : null;
        
        this.log('TIMER_END', `Timer ended: ${timerName}`, {
            timerName,
            endTime,
            duration: duration ? `${duration.toFixed(2)}ms` : 'unknown'
        });
    }

    // Storage operations tracking
    trackStorageOperation(operation, key, success, data = {}) {
        this.log('STORAGE_OP', `Storage ${operation}: ${key}`, {
            operation,
            key,
            success,
            ...data
        });
    }

    // Component lifecycle tracking
    trackComponent(component, action, data = {}) {
        this.log('COMPONENT', `${component}: ${action}`, {
            component,
            action,
            ...data
        });
    }

    generateFlowId() {
        return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }

    log(level, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            context: this.context,
            level,
            message,
            data: this.sanitizeData(data),
            url: typeof window !== 'undefined' ? window.location?.href : 'N/A'
        };

        // Add to memory logs
        this.logs.push(logEntry);
        this.trimLogs();

        // Console output with emoji and formatting
        this.consoleOutput(logEntry);

        // Persist to storage
        this.persistLog(logEntry);

        // Broadcast to debug dashboard if available
        this.broadcastToDebugger(logEntry);
    }

    sanitizeData(data) {
        try {
            // Remove circular references and functions
            return JSON.parse(JSON.stringify(data, (key, value) => {
                if (typeof value === 'function') return '[Function]';
                if (typeof value === 'object' && value !== null) {
                    if (value instanceof Error) {
                        return {
                            name: value.name,
                            message: value.message,
                            stack: value.stack
                        };
                    }
                }
                return value;
            }));
        } catch (error) {
            return { sanitization_error: error.message };
        }
    }

    consoleOutput(logEntry) {
        const emojis = {
            'INFO': 'ℹ️',
            'WARN': '⚠️',
            'ERROR': '❌',
            'SUCCESS': '✅',
            'DEBUG': '🐛',
            'FLOW_START': '🚀',
            'FLOW_STEP': '📍',
            'FLOW_END': '🏁',
            'TIMER_START': '⏰',
            'TIMER_END': '⏱️',
            'STORAGE_OP': '💾',
            'COMPONENT': '🧩'
        };

        const emoji = emojis[logEntry.level] || '📝';
        const prefix = `${emoji} [${logEntry.context}]`;
        
        const styles = {
            'ERROR': 'color: #ff4444; font-weight: bold;',
            'WARN': 'color: #ffaa00; font-weight: bold;',
            'SUCCESS': 'color: #44ff44; font-weight: bold;',
            'FLOW_START': 'color: #4488ff; font-weight: bold;',
            'FLOW_END': 'color: #8844ff; font-weight: bold;'
        };

        const style = styles[logEntry.level] || 'color: #666;';
        
        if (Object.keys(logEntry.data).length > 0) {
            console.groupCollapsed(`%c${prefix} ${logEntry.message}`, style);
            console.log('Data:', logEntry.data);
            console.log('Timestamp:', logEntry.timestamp);
            console.groupEnd();
        } else {
            console.log(`%c${prefix} ${logEntry.message}`, style);
        }
    }

    async persistLog(logEntry) {
        try {
            // Check if we have direct storage access (service worker context)
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const { debug_logs = [] } = await chrome.storage.local.get('debug_logs');
                debug_logs.push(logEntry);
                
                // Keep only last 500 logs in storage
                if (debug_logs.length > 500) {
                    debug_logs.splice(0, debug_logs.length - 500);
                }
                
                await chrome.storage.local.set({ debug_logs });
            } else {
                // Content script context - send to service worker for storage
                if (typeof chrome !== 'undefined' && chrome.runtime) {
                    chrome.runtime.sendMessage({
                        type: 'DEBUG_STORE_LOG',
                        logEntry: logEntry
                    }).catch(() => {
                        // If messaging fails, fallback to sessionStorage
                        this.fallbackToSessionStorage(logEntry);
                    });
                } else {
                    this.fallbackToSessionStorage(logEntry);
                }
            }
        } catch (error) {
            this.fallbackToSessionStorage(logEntry);
        }
    }
    
    fallbackToSessionStorage(logEntry) {
        try {
            const existing = JSON.parse(sessionStorage.getItem('debug_logs') || '[]');
            existing.push(logEntry);
            if (existing.length > 100) existing.splice(0, existing.length - 100);
            sessionStorage.setItem('debug_logs', JSON.stringify(existing));
        } catch (sessionError) {
            console.error('Failed to persist log to sessionStorage:', sessionError);
        }
    }

    broadcastToDebugger(logEntry) {
        try {
            // Send to debug dashboard if running
            chrome.runtime.sendMessage({
                type: 'DEBUG_LOG',
                data: logEntry
            }).catch(() => {
                // Ignore if no listeners
            });
        } catch (error) {
            // Extension context might not be available
        }
    }

    trimLogs() {
        if (this.logs.length > this.maxLogs) {
            this.logs.splice(0, this.logs.length - this.maxLogs);
        }
    }

    // Utility methods for retrieving logs
    async getAllLogs() {
        try {
            const { debug_logs = [] } = await chrome.storage.local.get('debug_logs');
            return debug_logs;
        } catch (error) {
            return this.logs;
        }
    }

    async getLogsByLevel(level) {
        const logs = await this.getAllLogs();
        return logs.filter(log => log.level === level);
    }

    async getLogsByContext(context) {
        const logs = await this.getAllLogs();
        return logs.filter(log => log.context === context);
    }

    async getLogsInTimeRange(startTime, endTime) {
        const logs = await this.getAllLogs();
        return logs.filter(log => {
            const logTime = new Date(log.timestamp).getTime();
            return logTime >= startTime && logTime <= endTime;
        });
    }

    async clearLogs() {
        this.logs = [];
        try {
            await chrome.storage.local.set({ debug_logs: [] });
        } catch (error) {
            sessionStorage.removeItem('debug_logs');
        }
    }

    // Export logs for analysis
    async exportLogs(format = 'json') {
        const logs = await this.getAllLogs();
        
        switch (format) {
            case 'csv':
                return this.logsToCSV(logs);
            case 'json':
            default:
                return JSON.stringify(logs, null, 2);
        }
    }

    logsToCSV(logs) {
        const headers = ['timestamp', 'context', 'level', 'message', 'data', 'url'];
        const rows = logs.map(log => [
            log.timestamp,
            log.context,
            log.level,
            log.message,
            JSON.stringify(log.data),
            log.url
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }
}

// Global logger instances for different contexts
if (typeof window !== 'undefined') {
    window.DebugLogger = DebugLogger;
    
    // Create context-specific loggers
    if (typeof chrome !== 'undefined') {
        if (chrome.extension && chrome.extension.getBackgroundPage) {
            window.logger = new DebugLogger('background');
        } else if (window.location.href.includes('sidepanel')) {
            window.logger = new DebugLogger('sidepanel');
        } else if (window.location.href.includes('popup')) {
            window.logger = new DebugLogger('popup');
        } else {
            window.logger = new DebugLogger('content');
        }
    } else {
        window.logger = new DebugLogger('web');
    }
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugLogger;
}