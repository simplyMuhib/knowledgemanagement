// Nuovix Bookmark Import Service - Primary Acquisition Hook
// This is the "trojan horse" feature that creates immediate "aha moments"

class BookmarkImportService {
    constructor() {
        this.storage = null;
        this.analysisCache = new Map();
    }

    async initialize(storageInstance) {
        this.storage = storageInstance;
        console.log('📚 Bookmark Import Service initialized');
    }

    // Primary acquisition hook - analyze user's existing bookmarks
    async analyzeExistingBookmarks() {
        try {
            console.log('🔍 Starting bookmark analysis for acquisition hook...');
            
            // Get all browser bookmarks
            const bookmarks = await this.getAllBookmarks();
            
            if (!bookmarks.length) {
                return {
                    success: false,
                    message: "No bookmarks found",
                    totalBookmarks: 0
                };
            }

            // Perform instant analysis
            const analysis = await this.performInstantAnalysis(bookmarks);
            
            console.log('✨ Bookmark analysis complete:', analysis);
            
            return {
                success: true,
                ...analysis,
                bookmarks: bookmarks.slice(0, 10) // First 10 for preview
            };
            
        } catch (error) {
            console.error('❌ Bookmark analysis failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get all bookmarks recursively
    async getAllBookmarks() {
        return new Promise((resolve) => {
            chrome.bookmarks.getTree((bookmarkTree) => {
                const allBookmarks = [];
                
                const extractBookmarks = (nodes) => {
                    for (const node of nodes) {
                        if (node.url && node.title) {
                            // Extract meaningful bookmark data
                            allBookmarks.push({
                                id: node.id,
                                title: node.title,
                                url: node.url,
                                dateAdded: node.dateAdded,
                                parentFolder: node.parentId
                            });
                        }
                        
                        if (node.children) {
                            extractBookmarks(node.children);
                        }
                    }
                };
                
                extractBookmarks(bookmarkTree);
                
                // Sort by most recently added
                allBookmarks.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
                
                console.log(`📖 Found ${allBookmarks.length} bookmarks`);
                resolve(allBookmarks);
            });
        });
    }

    // Instant analysis to create "aha moment"
    async performInstantAnalysis(bookmarks) {
        const analysis = {
            totalBookmarks: bookmarks.length,
            domains: new Map(),
            topics: new Map(),
            recentActivity: [],
            knowledgeAreas: [],
            duplicates: 0,
            organizationOpportunities: []
        };

        // Domain analysis
        bookmarks.forEach(bookmark => {
            try {
                const domain = new URL(bookmark.url).hostname.replace('www.', '');
                analysis.domains.set(domain, (analysis.domains.get(domain) || 0) + 1);
            } catch (e) {
                // Skip invalid URLs
            }
        });

        // Topic extraction from titles and URLs
        this.extractTopicsFromBookmarks(bookmarks, analysis);
        
        // Find recent activity patterns
        analysis.recentActivity = this.findRecentPatterns(bookmarks);
        
        // Identify knowledge areas
        analysis.knowledgeAreas = this.identifyKnowledgeAreas(analysis.domains, analysis.topics);
        
        // Find duplicates and organization opportunities
        analysis.duplicates = this.findDuplicates(bookmarks);
        analysis.organizationOpportunities = this.findOrganizationOpportunities(bookmarks, analysis);

        return this.formatAnalysisForDisplay(analysis);
    }

    // Extract topics using keyword analysis
    extractTopicsFromBookmarks(bookmarks, analysis) {
        // Common tech/knowledge keywords
        const techKeywords = {
            'javascript': ['javascript', 'js', 'node', 'npm', 'react', 'vue', 'angular'],
            'python': ['python', 'django', 'flask', 'pandas'],
            'design': ['design', 'ui', 'ux', 'figma', 'sketch', 'photoshop'],
            'development': ['development', 'coding', 'programming', 'tutorial'],
            'documentation': ['docs', 'documentation', 'api', 'reference'],
            'tools': ['tools', 'productivity', 'extension', 'app'],
            'research': ['research', 'paper', 'study', 'analysis'],
            'news': ['news', 'blog', 'article', 'medium'],
            'learning': ['learn', 'course', 'tutorial', 'education'],
            'career': ['career', 'job', 'interview', 'resume']
        };

        bookmarks.forEach(bookmark => {
            const text = (bookmark.title + ' ' + bookmark.url).toLowerCase();
            
            Object.entries(techKeywords).forEach(([topic, keywords]) => {
                if (keywords.some(keyword => text.includes(keyword))) {
                    analysis.topics.set(topic, (analysis.topics.get(topic) || 0) + 1);
                }
            });
        });
    }

    // Find recent activity patterns
    findRecentPatterns(bookmarks) {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentBookmarks = bookmarks.filter(b => 
            (b.dateAdded || 0) > thirtyDaysAgo
        ).slice(0, 5);

        return recentBookmarks.map(bookmark => ({
            title: bookmark.title,
            domain: this.extractDomain(bookmark.url),
            daysAgo: Math.floor((Date.now() - (bookmark.dateAdded || 0)) / (24 * 60 * 60 * 1000))
        }));
    }

    // Identify main knowledge areas
    identifyKnowledgeAreas(domains, topics) {
        const areas = [];
        
        // Top domains
        const topDomains = Array.from(domains.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        // Top topics
        const topTopics = Array.from(topics.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        // Combine and format
        topDomains.forEach(([domain, count]) => {
            areas.push({
                name: domain,
                type: 'domain',
                count: count,
                icon: this.getDomainIcon(domain)
            });
        });

        topTopics.forEach(([topic, count]) => {
            areas.push({
                name: topic,
                type: 'topic', 
                count: count,
                icon: this.getTopicIcon(topic)
            });
        });

        return areas.slice(0, 8); // Top 8 areas
    }

    // Find potential duplicates
    findDuplicates(bookmarks) {
        const urlSet = new Set();
        let duplicates = 0;
        
        bookmarks.forEach(bookmark => {
            const cleanUrl = bookmark.url.replace(/[?#].*/, ''); // Remove query params
            if (urlSet.has(cleanUrl)) {
                duplicates++;
            } else {
                urlSet.add(cleanUrl);
            }
        });
        
        return duplicates;
    }

    // Find organization opportunities
    findOrganizationOpportunities(bookmarks, analysis) {
        const opportunities = [];
        
        // Suggest workspace creation based on topics
        const significantTopics = Array.from(analysis.topics.entries())
            .filter(([, count]) => count >= 3)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        
        significantTopics.forEach(([topic, count]) => {
            opportunities.push({
                type: 'workspace',
                suggestion: `Create "${topic}" workspace`,
                impact: `Organize ${count} ${topic}-related bookmarks`,
                icon: this.getTopicIcon(topic)
            });
        });

        return opportunities;
    }

    // Format analysis for display
    formatAnalysisForDisplay(analysis) {
        return {
            summary: {
                totalBookmarks: analysis.totalBookmarks,
                uniqueDomains: analysis.domains.size,
                topicsIdentified: analysis.topics.size,
                recentActivity: analysis.recentActivity.length,
                duplicatesFound: analysis.duplicates
            },
            insights: {
                knowledgeAreas: analysis.knowledgeAreas,
                recentActivity: analysis.recentActivity,
                organizationOpportunities: analysis.organizationOpportunities
            },
            hooks: {
                primaryHook: this.generatePrimaryHook(analysis),
                secondaryHooks: this.generateSecondaryHooks(analysis)
            }
        };
    }

    // Generate primary "aha moment" hook
    generatePrimaryHook(analysis) {
        const totalBookmarks = analysis.totalBookmarks;
        const topTopic = Array.from(analysis.topics.entries())
            .sort(([,a], [,b]) => b - a)[0];
        
        if (topTopic) {
            const [topic, count] = topTopic;
            return {
                text: `You have ${totalBookmarks} bookmarks with ${count} ${topic}-related resources across ${analysis.domains.size} domains`,
                cta: "See your knowledge map →",
                impact: "high"
            };
        }
        
        return {
            text: `You have ${totalBookmarks} bookmarks across ${analysis.domains.size} different domains`,
            cta: "Organize your knowledge →",
            impact: "medium"
        };
    }

    // Generate secondary engagement hooks
    generateSecondaryHooks(analysis) {
        const hooks = [];
        
        if (analysis.duplicates > 0) {
            hooks.push({
                text: `${analysis.duplicates} potential duplicates found`,
                cta: "Clean up duplicates",
                type: "cleanup"
            });
        }
        
        if (analysis.organizationOpportunities.length > 0) {
            hooks.push({
                text: "Smart workspace suggestions ready",
                cta: "Auto-organize bookmarks",
                type: "organize"
            });
        }
        
        return hooks;
    }

    // Helper methods for icons
    getDomainIcon(domain) {
        const iconMap = {
            'github.com': '💻',
            'stackoverflow.com': '📚',
            'medium.com': '📝',
            'youtube.com': '📹',
            'reddit.com': '🔗',
            'twitter.com': '🐦',
            'linkedin.com': '💼'
        };
        return iconMap[domain] || '🌐';
    }

    getTopicIcon(topic) {
        const iconMap = {
            'javascript': '⚡',
            'python': '🐍',
            'design': '🎨',
            'development': '💻',
            'documentation': '📚',
            'tools': '🔧',
            'research': '🔬',
            'news': '📰',
            'learning': '🎓',
            'career': '💼'
        };
        return iconMap[topic] || '📌';
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch (e) {
            return 'unknown';
        }
    }

    // Import selected bookmarks into Nuovix
    async importBookmarks(bookmarkIds, options = {}) {
        console.log('📥 Importing bookmarks:', bookmarkIds.length);
        
        const allBookmarks = await this.getAllBookmarks();
        const toImport = allBookmarks.filter(b => bookmarkIds.includes(b.id));
        
        let imported = 0;
        const results = [];
        
        for (const bookmark of toImport) {
            try {
                // Convert bookmark to Nuovix knowledge item
                const knowledgeItem = {
                    title: bookmark.title,
                    url: bookmark.url,
                    type: 'bookmark',
                    content: `Imported from browser bookmarks: ${bookmark.title}`,
                    tags: await this.generateTagsForBookmark(bookmark),
                    projectId: options.projectId || null,
                    metadata: {
                        originalId: bookmark.id,
                        dateAdded: bookmark.dateAdded,
                        importedAt: new Date().toISOString()
                    }
                };
                
                const savedId = await this.storage.saveItem(knowledgeItem);
                results.push({ bookmarkId: bookmark.id, itemId: savedId });
                imported++;
                
            } catch (error) {
                console.error(`Failed to import bookmark ${bookmark.id}:`, error);
                results.push({ bookmarkId: bookmark.id, error: error.message });
            }
        }
        
        console.log(`✅ Imported ${imported}/${toImport.length} bookmarks`);
        
        return {
            imported,
            total: toImport.length,
            results
        };
    }

    // Generate smart tags for imported bookmarks
    async generateTagsForBookmark(bookmark) {
        const tags = [];
        const text = (bookmark.title + ' ' + bookmark.url).toLowerCase();
        
        // Auto-tag based on domain
        const domain = this.extractDomain(bookmark.url);
        tags.push(`domain-${domain}`);
        
        // Auto-tag based on keywords
        const keywordTags = [
            { keywords: ['javascript', 'js', 'react', 'vue'], tag: 'javascript' },
            { keywords: ['python', 'django', 'flask'], tag: 'python' },
            { keywords: ['design', 'ui', 'ux', 'figma'], tag: 'design' },
            { keywords: ['tutorial', 'learn', 'course'], tag: 'learning' },
            { keywords: ['docs', 'documentation', 'api'], tag: 'documentation' },
            { keywords: ['tool', 'productivity', 'extension'], tag: 'tools' }
        ];
        
        keywordTags.forEach(({ keywords, tag }) => {
            if (keywords.some(keyword => text.includes(keyword))) {
                tags.push(tag);
            }
        });
        
        return tags.length > 0 ? tags : ['imported'];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BookmarkImportService;
} else {
    window.BookmarkImportService = BookmarkImportService;
}
