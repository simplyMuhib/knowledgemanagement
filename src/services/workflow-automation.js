/**
 * Workflow Automation Framework
 * IFTTT-style automation for knowledge management
 * "If This Then That" rules for content processing
 */

class WorkflowAutomation {
    constructor() {
        this.rules = new Map();
        this.triggers = new Map();
        this.actions = new Map();
        this.executionHistory = [];
        this.isEnabled = true;
        
        this.initializeBuiltInTriggers();
        this.initializeBuiltInActions();
    }

    /**
     * Initialize built-in trigger types
     */
    initializeBuiltInTriggers() {
        // Content-based triggers
        this.registerTrigger('content_saved', {
            name: 'Content Saved',
            description: 'Triggers when new content is saved',
            parameters: ['contentType', 'domain', 'titleContains', 'urlContains']
        });

        this.registerTrigger('domain_match', {
            name: 'Domain Match',
            description: 'Triggers when content is saved from specific domain',
            parameters: ['domain']
        });

        this.registerTrigger('keyword_match', {
            name: 'Keyword Match', 
            description: 'Triggers when content contains specific keywords',
            parameters: ['keywords', 'matchType'] // matchType: 'any', 'all'
        });

        this.registerTrigger('project_created', {
            name: 'Project Created',
            description: 'Triggers when new project is detected',
            parameters: ['projectName']
        });

        // Time-based triggers
        this.registerTrigger('daily_summary', {
            name: 'Daily Summary',
            description: 'Triggers daily at specified time',
            parameters: ['time'] // 24-hour format: "14:30"
        });

        this.registerTrigger('weekly_digest', {
            name: 'Weekly Digest',
            description: 'Triggers weekly on specified day',
            parameters: ['day', 'time'] // day: 0-6 (Sunday-Saturday)
        });

        // Pattern-based triggers
        this.registerTrigger('streak_milestone', {
            name: 'Streak Milestone',
            description: 'Triggers when reaching save streak milestones',
            parameters: ['milestoneType', 'count'] // milestoneType: 'daily', 'weekly'
        });

        this.registerTrigger('knowledge_gap', {
            name: 'Knowledge Gap Detected',
            description: 'Triggers when AI detects knowledge gaps',
            parameters: ['topic', 'confidence']
        });
    }

    /**
     * Initialize built-in action types
     */
    initializeBuiltInActions() {
        // Organization actions
        this.registerAction('auto_tag', {
            name: 'Auto Tag Content',
            description: 'Automatically add tags to content',
            parameters: ['tags'], // Array of tag strings
            execute: this.executeAutoTag.bind(this)
        });

        this.registerAction('assign_project', {
            name: 'Assign to Project',
            description: 'Automatically assign content to project',
            parameters: ['projectName', 'createIfNotExists'],
            execute: this.executeAssignProject.bind(this)
        });

        this.registerAction('set_priority', {
            name: 'Set Priority',
            description: 'Set content priority level',
            parameters: ['priority'], // 'high', 'medium', 'low'
            execute: this.executeSetPriority.bind(this)
        });

        // Notification actions
        this.registerAction('browser_notification', {
            name: 'Browser Notification',
            description: 'Show browser notification',
            parameters: ['title', 'message', 'icon'],
            execute: this.executeBrowserNotification.bind(this)
        });

        this.registerAction('email_notification', {
            name: 'Email Notification',
            description: 'Send email notification (future)',
            parameters: ['recipient', 'subject', 'template'],
            execute: this.executeEmailNotification.bind(this)
        });

        // External integrations
        this.registerAction('slack_message', {
            name: 'Slack Message',
            description: 'Send message to Slack (future)',
            parameters: ['channel', 'message', 'webhook'],
            execute: this.executeSlackMessage.bind(this)
        });

        this.registerAction('notion_save', {
            name: 'Save to Notion',
            description: 'Save content to Notion database (future)',
            parameters: ['databaseId', 'properties'],
            execute: this.executeNotionSave.bind(this)
        });

        // Analysis actions
        this.registerAction('generate_summary', {
            name: 'Generate Summary',
            description: 'Generate AI summary of content',
            parameters: ['summaryType'], // 'brief', 'detailed'
            execute: this.executeGenerateSummary.bind(this)
        });

        this.registerAction('find_connections', {
            name: 'Find Connections',
            description: 'Find related content automatically',
            parameters: ['scope'], // 'project', 'all'
            execute: this.executeFindConnections.bind(this)
        });
    }

    /**
     * Create new automation rule
     * @param {Object} ruleConfig - Rule configuration
     * @returns {string} Rule ID
     */
    createRule(ruleConfig) {
        const ruleId = this.generateRuleId();
        
        const rule = {
            id: ruleId,
            name: ruleConfig.name,
            description: ruleConfig.description,
            enabled: ruleConfig.enabled !== false,
            trigger: ruleConfig.trigger,
            conditions: ruleConfig.conditions || [],
            actions: ruleConfig.actions || [],
            createdAt: new Date().toISOString(),
            executionCount: 0,
            lastExecuted: null
        };

        this.rules.set(ruleId, rule);
        this.saveRulesToStorage();
        
        console.log('🤖 Automation rule created:', rule.name);
        return ruleId;
    }

    /**
     * Process content through automation rules
     * @param {string} triggerType - Type of trigger
     * @param {Object} triggerData - Data associated with trigger
     * @param {Object} context - Additional context
     */
    async processTrigger(triggerType, triggerData, context = {}) {
        if (!this.isEnabled) return;

        console.log(`🔄 Processing trigger: ${triggerType}`, triggerData);
        
        const applicableRules = Array.from(this.rules.values())
            .filter(rule => rule.enabled && rule.trigger.type === triggerType);

        for (const rule of applicableRules) {
            try {
                const shouldExecute = await this.evaluateRule(rule, triggerData, context);
                if (shouldExecute) {
                    await this.executeRule(rule, triggerData, context);
                }
            } catch (error) {
                console.error(`❌ Error executing rule ${rule.name}:`, error);
            }
        }
    }

    /**
     * Evaluate if rule conditions are met
     * @param {Object} rule - Rule to evaluate
     * @param {Object} triggerData - Trigger data
     * @param {Object} context - Execution context
     * @returns {Promise<boolean>} Whether rule should execute
     */
    async evaluateRule(rule, triggerData, context) {
        // Check trigger parameters
        if (!this.evaluateTriggerConditions(rule.trigger, triggerData)) {
            return false;
        }

        // Check additional conditions
        for (const condition of rule.conditions) {
            const conditionMet = await this.evaluateCondition(condition, triggerData, context);
            if (!conditionMet) {
                return false;
            }
        }

        return true;
    }

    /**
     * Evaluate trigger-specific conditions
     * @param {Object} trigger - Trigger configuration
     * @param {Object} triggerData - Trigger data
     * @returns {boolean} Whether trigger conditions are met
     */
    evaluateTriggerConditions(trigger, triggerData) {
        switch (trigger.type) {
            case 'content_saved':
                return this.evaluateContentSavedTrigger(trigger.parameters, triggerData);
            
            case 'domain_match':
                return this.evaluateDomainMatchTrigger(trigger.parameters, triggerData);
                
            case 'keyword_match':
                return this.evaluateKeywordMatchTrigger(trigger.parameters, triggerData);
                
            default:
                return true;
        }
    }

    /**
     * Evaluate content saved trigger conditions
     */
    evaluateContentSavedTrigger(parameters, triggerData) {
        const { contentType, domain, titleContains, urlContains } = parameters;
        const content = triggerData.content;

        if (contentType && content.type !== contentType) {
            return false;
        }

        if (domain && !this.extractDomain(content.url || '').includes(domain)) {
            return false;
        }

        if (titleContains && !(content.title || '').toLowerCase().includes(titleContains.toLowerCase())) {
            return false;
        }

        if (urlContains && !(content.url || '').toLowerCase().includes(urlContains.toLowerCase())) {
            return false;
        }

        return true;
    }

    /**
     * Evaluate domain match trigger
     */
    evaluateDomainMatchTrigger(parameters, triggerData) {
        const { domain } = parameters;
        const contentDomain = this.extractDomain(triggerData.content?.url || '');
        return contentDomain.includes(domain);
    }

    /**
     * Evaluate keyword match trigger
     */
    evaluateKeywordMatchTrigger(parameters, triggerData) {
        const { keywords, matchType = 'any' } = parameters;
        const content = triggerData.content;
        const text = `${content.title || ''} ${content.content || ''}`.toLowerCase();
        
        const keywordMatches = keywords.map(keyword => 
            text.includes(keyword.toLowerCase())
        );

        return matchType === 'all' 
            ? keywordMatches.every(match => match)
            : keywordMatches.some(match => match);
    }

    /**
     * Execute rule actions
     * @param {Object} rule - Rule to execute
     * @param {Object} triggerData - Trigger data
     * @param {Object} context - Execution context
     */
    async executeRule(rule, triggerData, context) {
        console.log(`⚡ Executing rule: ${rule.name}`);
        
        const execution = {
            ruleId: rule.id,
            ruleName: rule.name,
            timestamp: new Date().toISOString(),
            triggerData,
            context,
            actionsExecuted: [],
            errors: []
        };

        for (const actionConfig of rule.actions) {
            try {
                const action = this.actions.get(actionConfig.type);
                if (action && action.execute) {
                    const result = await action.execute(actionConfig.parameters, triggerData, context);
                    execution.actionsExecuted.push({
                        type: actionConfig.type,
                        parameters: actionConfig.parameters,
                        result
                    });
                    console.log(`✅ Action executed: ${action.name}`);
                } else {
                    throw new Error(`Unknown action type: ${actionConfig.type}`);
                }
            } catch (error) {
                console.error(`❌ Action failed: ${actionConfig.type}`, error);
                execution.errors.push({
                    action: actionConfig.type,
                    error: error.message
                });
            }
        }

        // Update rule statistics
        rule.executionCount++;
        rule.lastExecuted = execution.timestamp;
        
        // Store execution history
        this.executionHistory.push(execution);
        if (this.executionHistory.length > 1000) {
            this.executionHistory = this.executionHistory.slice(-1000);
        }

        this.saveRulesToStorage();
    }

    /**
     * Execute auto-tag action
     */
    async executeAutoTag(parameters, triggerData, context) {
        const { tags } = parameters;
        const content = triggerData.content;
        
        if (!content.tags) content.tags = { user: [], auto: [] };
        if (!content.tags.auto) content.tags.auto = [];
        
        tags.forEach(tag => {
            if (!content.tags.auto.includes(tag)) {
                content.tags.auto.push(tag);
            }
        });

        // Save updated content
        await this.saveContentUpdate(content);
        
        return { tagsAdded: tags };
    }

    /**
     * Execute assign project action
     */
    async executeAssignProject(parameters, triggerData, context) {
        const { projectName, createIfNotExists } = parameters;
        const content = triggerData.content;
        
        if (!content.intelligence) content.intelligence = {};
        content.intelligence.project = projectName;
        
        // Save updated content
        await this.saveContentUpdate(content);
        
        return { projectAssigned: projectName };
    }

    /**
     * Execute browser notification action
     */
    async executeBrowserNotification(parameters, triggerData, context) {
        const { title, message, icon } = parameters;
        
        // Replace template variables
        const processedTitle = this.processTemplate(title, triggerData, context);
        const processedMessage = this.processTemplate(message, triggerData, context);
        
        if (chrome.notifications) {
            const notificationId = await chrome.notifications.create({
                type: 'basic',
                iconUrl: icon || chrome.runtime.getURL('icon.png'),
                title: processedTitle,
                message: processedMessage
            });
            
            return { notificationId };
        } else {
            // Fallback to browser notification API
            if (Notification.permission === 'granted') {
                new Notification(processedTitle, {
                    body: processedMessage,
                    icon: icon
                });
            }
            return { fallback: true };
        }
    }

    /**
     * Process template strings with variable substitution
     */
    processTemplate(template, triggerData, context) {
        return template.replace(/\{(\w+(?:\.\w+)*)\}/g, (match, path) => {
            const value = this.getNestedValue({ triggerData, context }, path);
            return value !== undefined ? String(value) : match;
        });
    }

    /**
     * Get nested object value by path
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Register trigger type
     */
    registerTrigger(type, config) {
        this.triggers.set(type, config);
    }

    /**
     * Register action type
     */
    registerAction(type, config) {
        this.actions.set(type, config);
    }

    /**
     * Get available triggers
     */
    getAvailableTriggers() {
        return Array.from(this.triggers.entries()).map(([type, config]) => ({
            type,
            ...config
        }));
    }

    /**
     * Get available actions
     */
    getAvailableActions() {
        return Array.from(this.actions.entries()).map(([type, config]) => ({
            type,
            ...config
        }));
    }

    /**
     * Generate unique rule ID
     */
    generateRuleId() {
        return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Extract domain from URL
     */
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return '';
        }
    }

    /**
     * Save content update to storage
     */
    async saveContentUpdate(content) {
        try {
            await chrome.storage.local.set({ [content.id]: content });
        } catch (error) {
            console.error('Error saving content update:', error);
        }
    }

    /**
     * Save rules to storage
     */
    async saveRulesToStorage() {
        try {
            const rulesData = {
                rules: Object.fromEntries(this.rules),
                executionHistory: this.executionHistory.slice(-100) // Keep last 100 executions
            };
            await chrome.storage.local.set({ 'workflow_automation': rulesData });
        } catch (error) {
            console.error('Error saving automation rules:', error);
        }
    }

    /**
     * Load rules from storage
     */
    async loadRulesFromStorage() {
        try {
            const result = await chrome.storage.local.get('workflow_automation');
            const rulesData = result.workflow_automation;
            
            if (rulesData) {
                this.rules = new Map(Object.entries(rulesData.rules || {}));
                this.executionHistory = rulesData.executionHistory || [];
            }
        } catch (error) {
            console.error('Error loading automation rules:', error);
        }
    }

    // Placeholder implementations for future integrations
    async executeEmailNotification(parameters, triggerData, context) {
        console.log('📧 Email notification (not yet implemented):', parameters);
        return { status: 'pending_implementation' };
    }

    async executeSlackMessage(parameters, triggerData, context) {
        console.log('💬 Slack message (not yet implemented):', parameters);
        return { status: 'pending_implementation' };
    }

    async executeNotionSave(parameters, triggerData, context) {
        console.log('📝 Notion save (not yet implemented):', parameters);
        return { status: 'pending_implementation' };
    }

    async executeGenerateSummary(parameters, triggerData, context) {
        console.log('📄 Generate summary (not yet implemented):', parameters);
        return { status: 'pending_implementation' };
    }

    async executeFindConnections(parameters, triggerData, context) {
        console.log('🔗 Find connections (not yet implemented):', parameters);
        return { status: 'pending_implementation' };
    }
}

// Export for use in other modules
window.WorkflowAutomation = WorkflowAutomation;