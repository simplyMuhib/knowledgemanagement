/**
 * Zero-Click Smart Suggestions Context Engine
 * Provides real-time content relevance and auto-curation
 */

class ContextEngine {
    constructor() {
        this.currentPageData = null;
        this.relevanceCache = new Map();
        this.cacheExpiry = 60000; // 1 minute cache
        this.similarityThreshold = 0.3; // Minimum similarity score
    }

    /**
     * Analyze current page and find related content
     * @param {string} url - Current page URL
     * @param {string} title - Page title
     * @param {string} domain - Page domain
     * @returns {Promise<Object>} Context analysis result
     */
    async analyzePageContext(url, title, domain) {
        const pageData = {
            url,
            title: title || '',
            domain,
            timestamp: Date.now(),
            keywords: this.extractKeywords(title),
            contentType: this.classifyContentType(url, title)
        };

        this.currentPageData = pageData;

        // Get all saved content for comparison
        const savedContent = await this.getAllSavedContent();
        
        // Find contextual matches
        const contextMatches = this.findContextualMatches(pageData, savedContent);
        
        return {
            currentPage: pageData,
            matches: contextMatches,
            suggestions: this.generateSuggestions(contextMatches)
        };
    }

    /**
     * Extract meaningful keywords from page title
     * @param {string} title - Page title
     * @returns {string[]} Array of keywords
     */
    extractKeywords(title) {
        if (!title) return [];

        // Remove common stop words and extract meaningful terms
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
        
        return title.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word))
            .slice(0, 10); // Limit to top 10 keywords
    }

    /**
     * Classify content type based on URL and title patterns
     * @param {string} url - Page URL
     * @param {string} title - Page title
     * @returns {string} Content type classification
     */
    classifyContentType(url, title) {
        const urlLower = url.toLowerCase();
        const titleLower = (title || '').toLowerCase();

        // Documentation sites
        if (urlLower.includes('docs.') || titleLower.includes('documentation') || titleLower.includes('api reference')) {
            return 'documentation';
        }

        // GitHub repositories
        if (urlLower.includes('github.com')) {
            return 'repository';
        }

        // Stack Overflow and Q&A
        if (urlLower.includes('stackoverflow') || urlLower.includes('stackexchange')) {
            return 'qa';
        }

        // Tutorials and learning
        if (titleLower.includes('tutorial') || titleLower.includes('guide') || titleLower.includes('how to')) {
            return 'tutorial';
        }

        // Blog posts
        if (urlLower.includes('blog') || urlLower.includes('medium.com') || urlLower.includes('dev.to')) {
            return 'blog';
        }

        // News and articles
        if (titleLower.includes('news') || urlLower.includes('techcrunch') || urlLower.includes('hacker')) {
            return 'news';
        }

        return 'general';
    }

    /**
     * Find contextually relevant saved content
     * @param {Object} pageData - Current page data
     * @param {Array} savedContent - All saved content
     * @returns {Object} Categorized matches
     */
    findContextualMatches(pageData, savedContent) {
        const matches = {
            exactPage: [],      // Same URL
            sameDomain: [],     // Same domain
            related: [],        // Similar keywords/content
            project: []         // Same project classification
        };

        savedContent.forEach(item => {
            const similarity = this.calculateSimilarity(pageData, item);
            
            // Exact page match
            if (item.url === pageData.url) {
                matches.exactPage.push({ ...item, similarity: 1.0 });
                return;
            }

            // Same domain
            if (item.url && this.extractDomain(item.url) === pageData.domain) {
                matches.sameDomain.push({ ...item, similarity });
                return;
            }

            // Related content (above threshold)
            if (similarity >= this.similarityThreshold) {
                matches.related.push({ ...item, similarity });
            }

            // Same project classification
            if (item.intelligence?.project && this.detectProject(pageData) === item.intelligence.project) {
                matches.project.push({ ...item, similarity });
            }
        });

        // Sort by similarity score
        Object.keys(matches).forEach(key => {
            matches[key].sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
        });

        return matches;
    }

    /**
     * Calculate similarity between current page and saved content
     * @param {Object} pageData - Current page data
     * @param {Object} savedItem - Saved content item
     * @returns {number} Similarity score (0-1)
     */
    calculateSimilarity(pageData, savedItem) {
        let score = 0;
        let factors = 0;

        // Title similarity (weighted heavily)
        if (pageData.title && savedItem.title) {
            const titleSim = this.calculateTextSimilarity(pageData.title, savedItem.title);
            score += titleSim * 0.4;
            factors += 0.4;
        }

        // Content similarity
        if (pageData.title && savedItem.content) {
            const contentSim = this.calculateTextSimilarity(pageData.title, savedItem.content);
            score += contentSim * 0.3;
            factors += 0.3;
        }

        // Keyword overlap
        if (pageData.keywords.length > 0 && savedItem.title) {
            const keywordSim = this.calculateKeywordSimilarity(pageData.keywords, savedItem.title);
            score += keywordSim * 0.2;
            factors += 0.2;
        }

        // Content type similarity
        if (pageData.contentType === (savedItem.intelligence?.contentType || 'general')) {
            score += 0.1;
            factors += 0.1;
        }

        return factors > 0 ? score / factors : 0;
    }

    /**
     * Calculate text similarity using simple word overlap
     * @param {string} text1 - First text
     * @param {string} text2 - Second text
     * @returns {number} Similarity score (0-1)
     */
    calculateTextSimilarity(text1, text2) {
        if (!text1 || !text2) return 0;

        const words1 = new Set(text1.toLowerCase().split(/\W+/).filter(w => w.length > 2));
        const words2 = new Set(text2.toLowerCase().split(/\W+/).filter(w => w.length > 2));
        
        const intersection = new Set([...words1].filter(w => words2.has(w)));
        const union = new Set([...words1, ...words2]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }

    /**
     * Calculate keyword similarity
     * @param {string[]} keywords - Page keywords
     * @param {string} text - Text to compare against
     * @returns {number} Similarity score (0-1)
     */
    calculateKeywordSimilarity(keywords, text) {
        if (!keywords.length || !text) return 0;

        const textLower = text.toLowerCase();
        const matchedKeywords = keywords.filter(keyword => 
            textLower.includes(keyword.toLowerCase())
        );

        return matchedKeywords.length / keywords.length;
    }

    /**
     * Generate contextual suggestions based on matches
     * @param {Object} matches - Categorized matches
     * @returns {Array} Suggestion objects
     */
    generateSuggestions(matches) {
        const suggestions = [];

        // Exact page suggestions
        if (matches.exactPage.length > 0) {
            suggestions.push({
                type: 'exact_page',
                title: `You've saved this page before`,
                subtitle: `${matches.exactPage.length} item${matches.exactPage.length > 1 ? 's' : ''} from this exact page`,
                icon: '📍',
                priority: 10,
                items: matches.exactPage.slice(0, 3)
            });
        }

        // Same domain suggestions
        if (matches.sameDomain.length > 0) {
            const domain = this.currentPageData?.domain || '';
            suggestions.push({
                type: 'same_domain',
                title: `Related content from ${domain}`,
                subtitle: `${matches.sameDomain.length} item${matches.sameDomain.length > 1 ? 's' : ''} from this domain`,
                icon: '🌐',
                priority: 8,
                items: matches.sameDomain.slice(0, 5)
            });
        }

        // Related content suggestions
        if (matches.related.length > 0) {
            suggestions.push({
                type: 'related',
                title: `Similar to your saved content`,
                subtitle: `${matches.related.length} related item${matches.related.length > 1 ? 's' : ''} found`,
                icon: '🔗',
                priority: 6,
                items: matches.related.slice(0, 5)
            });
        }

        // Project suggestions
        if (matches.project.length > 0) {
            const project = this.detectProject(this.currentPageData);
            suggestions.push({
                type: 'project',
                title: `Part of your ${project}`,
                subtitle: `${matches.project.length} item${matches.project.length > 1 ? 's' : ''} in this project`,
                icon: '🚀',
                priority: 7,
                items: matches.project.slice(0, 5)
            });
        }

        // Sort by priority (higher first)
        return suggestions.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Detect smart project classification
     * @param {Object} pageData - Page data
     * @returns {string} Project name
     */
    detectProject(pageData) {
        if (!pageData) return 'General Research';

        const { domain, title, url } = pageData;

        // GitHub project detection
        if (domain.includes('github.com')) {
            const match = url.match(/github\.com\/[^\/]+\/([^\/]+)/);
            return match ? `${match[1]} Project` : 'GitHub Project';
        }

        // Technology-specific detection
        const titleLower = title.toLowerCase();
        if (titleLower.includes('react')) return 'React Development';
        if (titleLower.includes('vue')) return 'Vue Development';
        if (titleLower.includes('angular')) return 'Angular Development';
        if (titleLower.includes('node')) return 'Node.js Development';
        if (titleLower.includes('python')) return 'Python Development';
        if (titleLower.includes('java')) return 'Java Development';

        // Documentation sites
        if (domain.includes('docs.') || titleLower.includes('documentation')) {
            return 'Documentation Research';
        }

        // Default domain-based
        return `${domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)} Research`;
    }

    /**
     * Extract domain from URL
     * @param {string} url - Full URL
     * @returns {string} Domain name
     */
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url.split('/')[0] || '';
        }
    }

    /**
     * Get all saved content from storage
     * @returns {Promise<Array>} All saved content items
     */
    async getAllSavedContent() {
        try {
            const result = await chrome.storage.local.get(null);
            const content = [];

            Object.keys(result).forEach(key => {
                if (key.startsWith('capture_')) {
                    content.push(result[key]);
                }
            });

            return content;
        } catch (error) {
            console.error('Error fetching saved content:', error);
            return [];
        }
    }

    /**
     * Get contextual suggestions for current page
     * @returns {Promise<Object>} Context analysis with suggestions
     */
    async getCurrentPageSuggestions() {
        if (!this.currentPageData) {
            // Get current tab info if not already set
            try {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs[0]) {
                    const domain = this.extractDomain(tabs[0].url);
                    return this.analyzePageContext(tabs[0].url, tabs[0].title, domain);
                }
            } catch (error) {
                console.error('Error getting current tab:', error);
            }
        }

        return this.analyzePageContext(
            this.currentPageData.url,
            this.currentPageData.title,
            this.currentPageData.domain
        );
    }
}

// Export for use in other modules
window.ContextEngine = ContextEngine;