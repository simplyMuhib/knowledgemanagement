/**
 * Knowledge Digest System
 * AI-powered content analysis and summarization
 * Generates weekly/project-based insights and trend analysis
 */

class KnowledgeDigest {
    constructor() {
        this.digestCache = new Map();
        this.analysisBuffer = [];
        this.contentClassifier = new ContentClassifier();
        this.trendAnalyzer = new TrendAnalyzer();
    }

    /**
     * Generate weekly knowledge digest
     * @param {string} timeframe - 'week', 'month', 'project'
     * @param {string} projectFilter - Optional project filter
     * @returns {Promise<Object>} Digest report
     */
    async generateDigest(timeframe = 'week', projectFilter = null) {
        const content = await this.getContentByTimeframe(timeframe, projectFilter);
        
        if (content.length === 0) {
            return this.createEmptyDigest(timeframe);
        }

        const digest = {
            timeframe,
            generatedAt: new Date().toISOString(),
            contentAnalyzed: content.length,
            summary: await this.generateSummary(content),
            trends: await this.analyzeTrends(content),
            keyInsights: await this.extractKeyInsights(content),
            knowledgeGaps: await this.identifyKnowledgeGaps(content),
            connections: await this.findConnections(content),
            recommendations: await this.generateRecommendations(content),
            stats: this.calculateStats(content)
        };

        // Cache the digest
        const cacheKey = `${timeframe}_${projectFilter || 'all'}_${Date.now()}`;
        this.digestCache.set(cacheKey, digest);

        return digest;
    }

    /**
     * Generate content summary using AI-powered analysis
     * @param {Array} content - Content items to summarize
     * @returns {Promise<Object>} Summary object
     */
    async generateSummary(content) {
        const contentByType = this.groupContentByType(content);
        const topicClusters = await this.identifyTopicClusters(content);
        
        return {
            overview: this.generateOverviewText(content, topicClusters),
            mainTopics: topicClusters.slice(0, 5),
            contentBreakdown: Object.keys(contentByType).map(type => ({
                type,
                count: contentByType[type].length,
                percentage: Math.round((contentByType[type].length / content.length) * 100)
            })),
            timeDistribution: this.analyzeTimeDistribution(content)
        };
    }

    /**
     * Analyze trends in saved content
     * @param {Array} content - Content to analyze
     * @returns {Promise<Array>} Trend analysis
     */
    async analyzeTrends(content) {
        const timeBasedAnalysis = this.trendAnalyzer.analyzeByTime(content);
        const topicTrends = await this.trendAnalyzer.analyzeTopicEvolution(content);
        const domainTrends = this.trendAnalyzer.analyzeDomainPatterns(content);
        
        return [
            ...timeBasedAnalysis,
            ...topicTrends,
            ...domainTrends
        ].sort((a, b) => b.significance - a.significance);
    }

    /**
     * Extract key insights from content
     * @param {Array} content - Content to analyze
     * @returns {Promise<Array>} Key insights
     */
    async extractKeyInsights(content) {
        const insights = [];
        
        // Productivity insights
        const productivityInsights = this.analyzeProductivityPatterns(content);
        insights.push(...productivityInsights);
        
        // Learning insights
        const learningInsights = this.analyzeLearningPatterns(content);
        insights.push(...learningInsights);
        
        // Research insights
        const researchInsights = this.analyzeResearchPatterns(content);
        insights.push(...researchInsights);
        
        return insights.sort((a, b) => b.impact - a.impact).slice(0, 10);
    }

    /**
     * Identify knowledge gaps using AI analysis
     * @param {Array} content - Content to analyze
     * @returns {Promise<Array>} Knowledge gaps
     */
    async identifyKnowledgeGaps(content) {
        const gaps = [];
        const topicClusters = await this.identifyTopicClusters(content);
        
        // Analyze completeness within topic clusters
        for (const cluster of topicClusters) {
            const gapAnalysis = await this.analyzeTopicCompleteness(cluster, content);
            if (gapAnalysis.gaps.length > 0) {
                gaps.push({
                    topic: cluster.name,
                    confidence: gapAnalysis.confidence,
                    gaps: gapAnalysis.gaps,
                    suggestions: gapAnalysis.suggestions,
                    priority: this.calculateGapPriority(gapAnalysis)
                });
            }
        }
        
        return gaps.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Generate content recommendations
     * @param {Array} content - Content to analyze
     * @returns {Promise<Array>} Recommendations
     */
    async generateRecommendations(content) {
        const recommendations = [];
        
        // Based on knowledge gaps
        const knowledgeGaps = await this.identifyKnowledgeGaps(content);
        for (const gap of knowledgeGaps.slice(0, 3)) {
            recommendations.push({
                type: 'knowledge_gap',
                priority: 'high',
                title: `Research ${gap.topic} foundations`,
                description: `You've collected advanced ${gap.topic} content but might benefit from foundational resources`,
                suggestedActions: gap.suggestions.slice(0, 3)
            });
        }
        
        // Based on trends
        const trends = await this.analyzeTrends(content);
        const emergingTrend = trends.find(t => t.type === 'emerging');
        if (emergingTrend) {
            recommendations.push({
                type: 'trend_opportunity',
                priority: 'medium',
                title: `Explore emerging trend: ${emergingTrend.topic}`,
                description: `Your recent saves suggest growing interest in ${emergingTrend.topic}`,
                suggestedActions: [
                    `Save more ${emergingTrend.topic} resources`,
                    `Create a dedicated ${emergingTrend.topic} project`,
                    `Set up alerts for ${emergingTrend.topic} updates`
                ]
            });
        }
        
        // Based on productivity patterns
        const productivityRec = this.generateProductivityRecommendations(content);
        recommendations.push(...productivityRec);
        
        return recommendations.slice(0, 5);
    }

    /**
     * Group content by type for analysis
     * @param {Array} content - Content to group
     * @returns {Object} Grouped content
     */
    groupContentByType(content) {
        const grouped = {};
        
        for (const item of content) {
            const type = item.type || 'general';
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push(item);
        }
        
        return grouped;
    }

    /**
     * Identify topic clusters using content analysis
     * @param {Array} content - Content to analyze
     * @returns {Promise<Array>} Topic clusters
     */
    async identifyTopicClusters(content) {
        const clusters = new Map();
        
        for (const item of content) {
            const topics = await this.extractTopics(item);
            
            for (const topic of topics) {
                if (!clusters.has(topic.name)) {
                    clusters.set(topic.name, {
                        name: topic.name,
                        items: [],
                        strength: 0,
                        keywords: new Set()
                    });
                }
                
                const cluster = clusters.get(topic.name);
                cluster.items.push(item);
                cluster.strength += topic.confidence;
                topic.keywords?.forEach(kw => cluster.keywords.add(kw));
            }
        }
        
        // Convert to array and sort by strength
        return Array.from(clusters.values())
            .sort((a, b) => b.strength - a.strength)
            .map(cluster => ({
                ...cluster,
                keywords: Array.from(cluster.keywords)
            }));
    }

    /**
     * Extract topics from content item
     * @param {Object} item - Content item
     * @returns {Promise<Array>} Extracted topics
     */
    async extractTopics(item) {
        const topics = [];
        const text = `${item.title || ''} ${item.content || ''}`.toLowerCase();
        
        // Technology topics
        const techPatterns = {
            'JavaScript': /\b(javascript|js|node\.?js|react|vue|angular)\b/g,
            'Python': /\b(python|django|flask|numpy|pandas)\b/g,
            'Web Development': /\b(html|css|frontend|backend|fullstack|web\s+dev)\b/g,
            'Data Science': /\b(data\s+science|machine\s+learning|ai|analytics)\b/g,
            'DevOps': /\b(docker|kubernetes|aws|cloud|devops|ci\/cd)\b/g,
            'Design': /\b(ui|ux|design|figma|sketch|adobe)\b/g
        };
        
        for (const [topic, pattern] of Object.entries(techPatterns)) {
            const matches = text.match(pattern);
            if (matches && matches.length > 0) {
                topics.push({
                    name: topic,
                    confidence: Math.min(matches.length * 0.2, 1),
                    keywords: [...new Set(matches.map(m => m.trim()))]
                });
            }
        }
        
        // Domain-based topics
        if (item.url) {
            const domain = this.extractDomain(item.url);
            if (domain.includes('github')) {
                topics.push({ name: 'Open Source', confidence: 0.8, keywords: ['github', 'repository'] });
            } else if (domain.includes('stackoverflow')) {
                topics.push({ name: 'Problem Solving', confidence: 0.7, keywords: ['stackoverflow', 'qa'] });
            } else if (domain.includes('medium') || domain.includes('blog')) {
                topics.push({ name: 'Learning Content', confidence: 0.6, keywords: ['article', 'blog'] });
            }
        }
        
        return topics.length > 0 ? topics : [{ name: 'General', confidence: 0.1, keywords: [] }];
    }

    /**
     * Analyze productivity patterns in content
     * @param {Array} content - Content to analyze
     * @returns {Array} Productivity insights
     */
    analyzeProductivityPatterns(content) {
        const insights = [];
        const timeGroups = this.groupContentByTime(content);
        
        // Peak productivity times
        const hourlyDistribution = this.analyzeHourlyDistribution(content);
        const peakHour = Object.entries(hourlyDistribution)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (peakHour) {
            insights.push({
                type: 'productivity',
                title: 'Peak Learning Time Identified',
                description: `You save most content around ${peakHour[0]}:00`,
                impact: 0.7,
                suggestion: `Schedule focused research sessions during this time`
            });
        }
        
        // Consistency patterns
        const dailyConsistency = this.analyzeDailyConsistency(content);
        if (dailyConsistency.streakLength > 3) {
            insights.push({
                type: 'productivity',
                title: 'Strong Learning Consistency',
                description: `You've maintained a ${dailyConsistency.streakLength}-day learning streak`,
                impact: 0.8,
                suggestion: 'Continue this momentum with daily knowledge goals'
            });
        }
        
        return insights;
    }

    /**
     * Generate overview text for digest
     * @param {Array} content - Content analyzed
     * @param {Array} topicClusters - Topic clusters
     * @returns {string} Overview text
     */
    generateOverviewText(content, topicClusters) {
        const timeframe = this.getTimeframeDescription(content);
        const topTopic = topicClusters[0]?.name || 'various topics';
        const contentCount = content.length;
        
        let overview = `This ${timeframe}, you captured ${contentCount} pieces of content, `;
        
        if (topicClusters.length > 0) {
            overview += `with a strong focus on ${topTopic}. `;
            
            if (topicClusters.length > 1) {
                overview += `You also explored ${topicClusters.slice(1, 3).map(c => c.name).join(' and ')}.`;
            }
        } else {
            overview += 'covering a diverse range of topics.';
        }
        
        return overview;
    }

    /**
     * Calculate statistics for digest
     * @param {Array} content - Content to analyze
     * @returns {Object} Statistics
     */
    calculateStats(content) {
        const now = new Date();
        const oldestItem = content.reduce((oldest, item) => {
            const itemDate = new Date(item.timestamp);
            return itemDate < oldest ? itemDate : oldest;
        }, now);
        
        return {
            totalItems: content.length,
            timeSpan: Math.ceil((now - oldestItem) / (1000 * 60 * 60 * 24)),
            averagePerDay: (content.length / Math.max(1, Math.ceil((now - oldestItem) / (1000 * 60 * 60 * 24)))).toFixed(1),
            domains: [...new Set(content.map(item => this.extractDomain(item.url || '')))].length,
            projects: [...new Set(content.map(item => item.intelligence?.project).filter(Boolean))].length
        };
    }

    /**
     * Extract domain from URL
     * @param {string} url - URL to extract domain from
     * @returns {string} Domain
     */
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return '';
        }
    }

    /**
     * Get content by timeframe
     * @param {string} timeframe - Time period
     * @param {string} projectFilter - Optional project filter
     * @returns {Promise<Array>} Filtered content
     */
    async getContentByTimeframe(timeframe, projectFilter = null) {
        try {
            const allContent = await this.getAllContent();
            const now = new Date();
            let cutoffDate;
            
            switch (timeframe) {
                case 'week':
                    cutoffDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                    break;
                case 'month':
                    cutoffDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                    break;
                case 'project':
                    // Get all content for project analysis
                    cutoffDate = new Date(0);
                    break;
                default:
                    cutoffDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            }
            
            return allContent.filter(item => {
                const itemDate = new Date(item.timestamp);
                const inTimeRange = itemDate >= cutoffDate;
                const matchesProject = !projectFilter || item.intelligence?.project === projectFilter;
                
                return inTimeRange && matchesProject;
            });
        } catch (error) {
            console.error('Error getting content by timeframe:', error);
            return [];
        }
    }

    /**
     * Get all saved content
     * @returns {Promise<Array>} All content
     */
    async getAllContent() {
        try {
            const result = await chrome.storage.local.get(null);
            const content = [];
            
            Object.keys(result).forEach(key => {
                if (key.startsWith('capture_')) {
                    content.push(result[key]);
                }
            });
            
            return content.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error('Error fetching all content:', error);
            return [];
        }
    }

    /**
     * Create empty digest for when no content is found
     * @param {string} timeframe - Timeframe
     * @returns {Object} Empty digest
     */
    createEmptyDigest(timeframe) {
        return {
            timeframe,
            generatedAt: new Date().toISOString(),
            contentAnalyzed: 0,
            summary: {
                overview: `No content captured in the selected ${timeframe}. Start saving valuable resources to build your knowledge base!`,
                mainTopics: [],
                contentBreakdown: [],
                timeDistribution: {}
            },
            trends: [],
            keyInsights: [],
            knowledgeGaps: [],
            connections: [],
            recommendations: [{
                type: 'getting_started',
                priority: 'high',
                title: 'Start Building Your Knowledge Base',
                description: 'Begin saving content to unlock personalized insights and trends',
                suggestedActions: [
                    'Save your first piece of content',
                    'Try different content types (articles, code, images)',
                    'Organize content into projects'
                ]
            }],
            stats: {
                totalItems: 0,
                timeSpan: 0,
                averagePerDay: '0',
                domains: 0,
                projects: 0
            }
        };
    }
}

/**
 * Content Classifier for topic analysis
 */
class ContentClassifier {
    classify(content) {
        // Simple classification based on content and URL patterns
        // In a full implementation, this would use ML models
        return 'general';
    }
}

/**
 * Trend Analyzer for pattern recognition
 */
class TrendAnalyzer {
    analyzeByTime(content) {
        // Analyze temporal patterns in content
        return [];
    }
    
    async analyzeTopicEvolution(content) {
        // Analyze how topics evolve over time
        return [];
    }
    
    analyzeDomainPatterns(content) {
        // Analyze patterns in content domains
        return [];
    }
}

// Export for use in other modules
window.KnowledgeDigest = KnowledgeDigest;