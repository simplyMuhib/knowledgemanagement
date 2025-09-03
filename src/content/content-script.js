// LinkMind Content Script - Page Integration
console.log('📄 LinkMind Content Script Loaded on:', window.location.href);

// Only initialize on actual web pages, not extension pages
if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    initializeContentScript();
}

function initializeContentScript() {
    console.log('🔌 Initializing LinkMind content integration');
    
    // Listen for selection changes for potential capture
    document.addEventListener('selectionchange', handleSelectionChange);
    
    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('📨 Content script received message:', message);
        
        switch (message.type) {
            case 'GET_SELECTED_TEXT':
                sendResponse({
                    success: true,
                    selectedText: window.getSelection().toString(),
                    url: window.location.href,
                    title: document.title
                });
                break;
                
            case 'GET_PAGE_INFO':
                sendResponse({
                    success: true,
                    pageInfo: getPageInfo()
                });
                break;
                
            case 'CAPTURE_VISIBLE_CONTENT':
                sendResponse({
                    success: true,
                    content: captureVisibleContent()
                });
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown message type' });
        }
        
        return true; // Async response
    });
    
    console.log('✅ LinkMind content script ready');
}

// Automatic selection toolbar - shows immediately on text selection
let currentSelection = null;

function handleSelectionChange() {
    clearTimeout(selectionTimeout);
    
    selectionTimeout = setTimeout(() => {
        try {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();
            
            console.log('🔄 Selection change detected, length:', selectedText.length);
            
            if (selectedText.length > 10) { // Only for meaningful selections
                console.log('📝 Text selected:', selectedText.substring(0, 50) + '...');
                
                try {
                    // Analyze selection context for intelligent actions
                    const newSelection = analyzeSelection(selection, selectedText);
                    console.log('✅ Analysis completed');
                    
                    // Only update toolbar if selection has meaningfully changed
                    if (!currentSelection || 
                        !currentSelection.text ||
                        Math.abs(currentSelection.text.length - selectedText.length) > 5 ||
                        currentSelection.text.substring(0, 30) !== selectedText.substring(0, 30)) {
                        
                        currentSelection = newSelection;
                        console.log('🎯 Showing toolbar...');
                        
                        try {
                            showSelectionToolbar(selection, selectedText);
                            console.log('✅ Toolbar shown successfully');
                        } catch (toolbarError) {
                            console.error('❌ TOOLBAR ERROR:', toolbarError);
                        }
                        
                        // Still notify background for context menu enhancement
                        try {
                            chrome.runtime.sendMessage({
                                type: 'SELECTION_CONTEXT_UPDATE',
                                data: currentSelection
                            });
                        } catch (messageError) {
                            console.error('❌ MESSAGE ERROR:', messageError);
                        }
                    } else {
                        console.log('⏭️ Selection hasn\'t changed significantly, skipping');
                    }
                } catch (analysisError) {
                    console.error('❌ ANALYSIS ERROR:', analysisError);
                }
            } else {
                // Only hide if there's truly no selection and no toolbar interaction
                if (selectedText.length === 0) {
                    currentSelection = null;
                    console.log('🔄 No text selected, hiding toolbar after delay');
                    // Add small delay to prevent hiding during selection adjustments
                    setTimeout(() => {
                        try {
                            const finalSelection = window.getSelection().toString().trim();
                            if (finalSelection.length === 0) {
                                hideSelectionToolbar();
                            }
                        } catch (hideError) {
                            console.error('❌ HIDE ERROR:', hideError);
                        }
                    }, 200);
                }
            }
        } catch (error) {
            console.error('❌ SELECTION CHANGE ERROR:', error);
            console.error('Error stack:', error.stack);
        }
    }, 150); // Slightly slower to prevent rapid updates
}

// Analyze selection for intelligent context menu customization
function analyzeSelection(selection, text) {
    if (!selection.rangeCount) return null;
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
    
    // Detect content type and context
    const analysis = {
        text: text,
        length: text.length,
        element: {
            tagName: element.tagName,
            className: element.className,
            id: element.id,
            dataset: Object.assign({}, element.dataset)
        },
        
        // Content type analysis
        isCode: detectCode(text, element),
        isQuote: detectQuote(text, element),
        isDefinition: detectDefinition(text),
        isData: detectDataContent(text),
        isHeading: element.matches('h1, h2, h3, h4, h5, h6'),
        
        // Context information
        surroundingText: element.textContent.substring(0, 300),
        pageSection: detectPageSection(element),
        nearbyLinks: getNearbyLinks(element),
        
        // Position and metadata
        rect: range.getBoundingClientRect(),
        pageUrl: window.location.href,
        pageTitle: document.title,
        timestamp: new Date().toISOString()
    };
    
    return analysis;
}

// Content type detectors
function detectCode(text, element) {
    const codeIndicators = ['function', 'class', 'const', 'let', 'var', 'import', 'export', '{', '}', '=>'];
    const hasCodeSyntax = codeIndicators.some(indicator => text.includes(indicator));
    const inCodeElement = element.matches('code, pre, .code, .highlight, [class*="code"], [class*="highlight"]');
    
    return hasCodeSyntax || inCodeElement;
}

function detectQuote(text, element) {
    const quotationMarks = ['"', '"', '"', "'", "'", "'"];
    const startsWithQuote = quotationMarks.some(mark => text.startsWith(mark));
    const inQuoteElement = element.matches('blockquote, q, .quote, [class*="quote"]');
    
    return startsWithQuote || inQuoteElement;
}

function detectDefinition(text) {
    const definitionKeywords = /\b(is|are|means|refers to|defined as|definition|explanation)\b/gi;
    return definitionKeywords.test(text);
}

function detectDataContent(text) {
    // Numbers, percentages, dates, etc.
    const dataPatterns = [
        /^\d+%/,  // Percentages
        /\$\d+/,  // Currency
        /\d{1,2}\/\d{1,2}\/\d{2,4}/, // Dates
        /^\d[\d\s,.$%\-+()]*$/ // Pure numeric data
    ];
    
    return dataPatterns.some(pattern => pattern.test(text.trim()));
}

function detectPageSection(element) {
    // Determine what section of the page this content is from
    const article = element.closest('article, main, [role="main"]');
    const nav = element.closest('nav, [role="navigation"]');
    const aside = element.closest('aside, [role="complementary"]');
    const header = element.closest('header, [role="banner"]');
    const footer = element.closest('footer, [role="contentinfo"]');
    
    if (article) return 'content';
    if (nav) return 'navigation';
    if (aside) return 'sidebar';
    if (header) return 'header';
    if (footer) return 'footer';
    
    return 'body';
}

function getNearbyLinks(element) {
    // Find links near the selected text
    const container = element.closest('p, div, section, article') || element;
    const links = Array.from(container.querySelectorAll('a[href]')).slice(0, 3);
    
    return links.map(link => ({
        text: link.textContent.trim(),
        href: link.href,
        title: link.title || link.textContent.trim()
    }));
}

// Automatic Selection Toolbar System (Medium/Google Docs style)
let selectionToolbar = null;
let selectionTimeout = null;

// Keyboard shortcut for immediate capture
document.addEventListener('keydown', (e) => {
    // Ctrl+Shift+C during selection
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText.length > 10) {
            e.preventDefault();
            console.log('⚡ Keyboard capture shortcut triggered');
            performImmediateCapture(selection, selectedText);
        }
    }
});

// Show automatic selection toolbar (Medium/Google Docs style)
function showSelectionToolbar(selection, text) {
    hideSelectionToolbar(); // Remove any existing toolbar
    
    if (!selection.rangeCount) return;
    
    // Analyze the selection for intelligent actions
    const analysis = analyzeSelection(selection, text);
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Create simple, discoverable toolbar
    selectionToolbar = document.createElement('div');
    selectionToolbar.className = 'linkmind-selection-toolbar';
    selectionToolbar.innerHTML = createToolbarHTML(analysis);
    
    // Style the toolbar with stable positioning
    const toolbarTop = Math.max(10, rect.top + window.scrollY - 55);
    const toolbarLeft = Math.max(10, Math.min(window.innerWidth - 200, rect.left + (rect.width / 2) - 100));
    
    selectionToolbar.style.cssText = `
        position: absolute;
        top: ${toolbarTop}px;
        left: ${toolbarLeft}px;
        z-index: 999999;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        display: flex;
        align-items: center;
        padding: 8px 12px;
        gap: 8px;
        opacity: 0;
        transform: translateY(5px);
        transition: all 0.2s ease-out;
        pointer-events: auto;
        white-space: nowrap;
    `;
    
    document.body.appendChild(selectionToolbar);
    
    // Animate in quickly
    requestAnimationFrame(() => {
        selectionToolbar.style.opacity = '1';
        selectionToolbar.style.transform = 'translateY(0)';
    });
    
    // Add event listeners to toolbar actions
    addToolbarEventListeners(selectionToolbar, analysis);
    
    // Add comprehensive hover and interaction listeners for stability
    let hideTimeout;
    let userInteracted = false;
    
    // Clear any existing hide timeout when mouse enters toolbar
    selectionToolbar.addEventListener('mouseenter', () => {
        console.log('🎯 Mouse entered toolbar - keeping stable');
        clearTimeout(hideTimeout);
        userInteracted = true;
    });
    
    // Only start hide timer when mouse leaves AND user has stopped interacting
    selectionToolbar.addEventListener('mouseleave', () => {
        console.log('🎯 Mouse left toolbar - starting hide timer');
        hideTimeout = setTimeout(() => {
            if (!selectionToolbar.matches(':hover')) {
                hideSelectionToolbar();
            }
        }, 3000); // Give user 3 seconds to come back
    });
    
    // Track toolbar for global mouse handler
    window.linkMindActiveToolbar = selectionToolbar;
    
    // Auto-hide after 10 seconds unless user has interacted
    setTimeout(() => {
        if (selectionToolbar && !userInteracted && !selectionToolbar.matches(':hover')) {
            hideSelectionToolbar();
        }
    }, 10000);
}

// Create simple, discoverable toolbar HTML
function createToolbarHTML(analysis) {
    const contentType = analysis.isCode ? 'code' : 
                       analysis.isQuote ? 'quote' : 
                       analysis.isDefinition ? 'definition' : 
                       analysis.isData ? 'data' : 'text';
                       
    const icon = {
        code: '💻',
        quote: '💬', 
        definition: '📚',
        data: '📊',
        text: '📝'
    }[contentType];
    
    const actionLabel = {
        code: 'Code',
        quote: 'Quote',
        definition: 'Definition', 
        data: 'Data',
        text: 'Text'
    }[contentType];
    
    // Simple toolbar with smart primary action
    return `
        <div class="toolbar-content-type">
            <span class="content-icon">${icon}</span>
            <span class="content-label">${actionLabel}</span>
        </div>
        
        <button class="toolbar-btn primary" data-action="capture" data-type="${contentType}">
            <span class="btn-icon">📝</span>
            <span class="btn-label">Capture</span>
        </button>
        
        <div class="toolbar-divider"></div>
        
        <button class="toolbar-btn secondary" data-action="more" title="More options">
            <span class="btn-icon">•••</span>
        </button>
    `;
}

// Simple toolbar event listeners
function addToolbarEventListeners(toolbar, analysis) {
    toolbar.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = e.currentTarget.dataset.action;
            const type = e.currentTarget.dataset.type || 'text';
            
            handleToolbarAction(action, type, analysis);
        });
    });
}

// Simple toolbar action handler
function handleToolbarAction(action, type, analysis) {
    console.log('🎯 Toolbar action triggered:', action, type);
    
    switch (action) {
        case 'capture':
            hideSelectionToolbar();
            performSmartCapture(analysis, type);
            break;
        case 'more':
            showMoreOptions(analysis);
            break;
        default:
            console.log('Unknown toolbar action:', action);
    }
}

// Show more options when user clicks "more" button
function showMoreOptions(analysis) {
    // For now, show context menu at toolbar position
    // This will be enhanced later with progressive disclosure
    hideSelectionToolbar();
    console.log('🔧 More options requested - showing context menu');
    
    // Trigger context menu programmatically if possible
    // For now, just perform research action as fallback
    performSmartResearch(analysis);
}

function performSmartCapture(analysis, contentType) {
    hideSelectionToolbar();
    
    // Send to background script with enhanced data
    chrome.runtime.sendMessage({
        type: 'SMART_CAPTURE',
        data: {
            content: analysis.text,
            contentType: contentType,
            intelligence: {
                isCode: analysis.isCode,
                isQuote: analysis.isQuote,
                isDefinition: analysis.isDefinition,
                isData: analysis.isData,
                pageSection: analysis.pageSection,
                element: analysis.element,
                nearbyLinks: analysis.nearbyLinks
            },
            context: {
                url: window.location.href,
                title: document.title,
                surroundingText: analysis.surroundingText
            },
            timestamp: new Date().toISOString(),
            source: 'intelligent-popup'
        }
    });
    
    // Show immediate success feedback
    showSuccessFeedback(`${contentType.charAt(0).toUpperCase() + contentType.slice(1)} captured!`, analysis.rect);
}

function performImmediateCapture(selection, text) {
    const analysis = analyzeSelection(selection, text);
    const contentType = analysis.isCode ? 'code' : 
                       analysis.isQuote ? 'quote' : 
                       analysis.isDefinition ? 'definition' : 
                       analysis.isData ? 'data' : 'text';
    
    performSmartCapture(analysis, contentType);
}

function showSuccessFeedback(message, rect) {
    const feedback = document.createElement('div');
    feedback.className = 'linkmind-success-feedback';
    feedback.innerHTML = `
        <div class="success-icon">✅</div>
        <div class="success-message">${message}</div>
    `;
    
    feedback.style.cssText = `
        position: fixed;
        top: ${rect.top - 60}px;
        left: ${rect.left}px;
        z-index: 999999;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
    `;
    
    document.body.appendChild(feedback);
    
    // Animate in
    requestAnimationFrame(() => {
        feedback.style.opacity = '1';
        feedback.style.transform = 'translateY(0)';
    });
    
    // Animate out after 3 seconds
    setTimeout(() => {
        feedback.style.opacity = '0';
        feedback.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 300);
    }, 3000);
}

// Hide selection toolbar
function hideSelectionToolbar() {
    if (selectionToolbar) {
        selectionToolbar.style.opacity = '0';
        selectionToolbar.style.transform = 'translateY(-5px)';
        setTimeout(() => {
            if (selectionToolbar && selectionToolbar.parentNode) {
                selectionToolbar.parentNode.removeChild(selectionToolbar);
                selectionToolbar = null;
                window.linkMindActiveToolbar = null;
            }
        }, 150);
    }
}

// Handle clicks outside toolbar to close it (but not too aggressively)
document.addEventListener('click', (e) => {
    if (selectionToolbar && !selectionToolbar.contains(e.target)) {
        // Only hide if user clicks significantly away from the toolbar area
        const toolbarRect = selectionToolbar.getBoundingClientRect();
        const clickDistance = Math.sqrt(
            Math.pow(e.clientX - (toolbarRect.left + toolbarRect.width/2), 2) +
            Math.pow(e.clientY - (toolbarRect.top + toolbarRect.height/2), 2)
        );
        
        // Only hide if click is more than 50px away from toolbar
        if (clickDistance > 50) {
            console.log('🎯 Click outside toolbar area - hiding');
            hideSelectionToolbar();
        }
    }
});

// Legacy hint system (keep for fallback)
let selectionHint = null;

function showSelectionHint(selection) {
    // This is now used as a subtle backup indicator
    // The main interaction is through the intelligent popup
    return; // Disabled in favor of intelligent popup
}

function hideSelectionHint() {
    if (selectionHint) {
        selectionHint.remove();
        selectionHint = null;
    }
}

// Get comprehensive page information
function getPageInfo() {
    const info = {
        title: document.title,
        url: window.location.href,
        domain: window.location.hostname,
        selectedText: window.getSelection().toString(),
        timestamp: new Date().toISOString(),
        wordCount: document.body.innerText.split(/\s+/).length,
        hasImages: document.images.length > 0,
        hasVideos: document.getElementsByTagName('video').length > 0,
        language: document.documentElement.lang || 'unknown'
    };
    
    // Extract meta information
    const metaTags = {};
    document.querySelectorAll('meta[name], meta[property]').forEach(meta => {
        const key = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        if (key && content) {
            metaTags[key] = content;
        }
    });
    info.meta = metaTags;
    
    // Extract headings structure
    const headings = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
        headings.push({
            level: parseInt(heading.tagName.substr(1)),
            text: heading.textContent.trim(),
            id: heading.id || null
        });
    });
    info.headings = headings.slice(0, 20); // Limit to first 20 headings
    
    return info;
}

// Capture visible content from the page
function captureVisibleContent() {
    const content = {
        selectedText: window.getSelection().toString(),
        visibleText: getVisibleText(),
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString()
    };
    
    return content;
}

// Get text content that's actually visible to the user
function getVisibleText() {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Skip text in script and style tags
                const parent = node.parentElement;
                if (!parent) return NodeFilter.FILTER_REJECT;
                
                const tagName = parent.tagName.toLowerCase();
                if (['script', 'style', 'noscript'].includes(tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }
                
                // Check if element is visible
                const computedStyle = window.getComputedStyle(parent);
                if (computedStyle.display === 'none' || 
                    computedStyle.visibility === 'hidden' ||
                    computedStyle.opacity === '0') {
                    return NodeFilter.FILTER_REJECT;
                }
                
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );
    
    const textNodes = [];
    let node;
    
    while (node = walker.nextNode()) {
        const text = node.textContent.trim();
        if (text.length > 0) {
            textNodes.push(text);
        }
    }
    
    // Join and limit text length
    const fullText = textNodes.join(' ').substring(0, 5000);
    return fullText;
}

// Keyboard shortcuts that work on pages
document.addEventListener('keydown', (e) => {
    // Quick capture shortcut (Ctrl/Cmd + Shift + K)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        console.log('⚡ Quick capture shortcut triggered');
        
        // Send capture request to background
        chrome.runtime.sendMessage({
            type: 'CAPTURE_SELECTION',
            data: {
                selectedText: window.getSelection().toString(),
                url: window.location.href,
                title: document.title,
                timestamp: new Date().toISOString()
            }
        });
    }
});

// Add missing functions for intelligent popup actions
function performSmartResearch(analysis) {
    hideSelectionToolbar();
    
    chrome.runtime.sendMessage({
        type: 'SMART_RESEARCH',
        data: {
            query: analysis.text,
            content: analysis.text,
            intelligence: analysis,
            context: {
                url: window.location.href,
                title: document.title,
                timestamp: new Date().toISOString()
            },
            source: 'intelligent-popup-research'
        }
    });
    
    showSuccessFeedback('Research query saved!', analysis.rect);
}

function requestScreenshot() {
    hideSelectionToolbar();
    
    chrome.runtime.sendMessage({
        type: 'REQUEST_SCREENSHOT',
        data: {
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString(),
            source: 'intelligent-popup'
        }
    });
    
    showSuccessFeedback('Screenshot captured!', { top: window.scrollY + 100, left: 100 });
}

function requestBookmark() {
    hideSelectionToolbar();
    
    chrome.runtime.sendMessage({
        type: 'REQUEST_BOOKMARK',
        data: {
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString(),
            source: 'intelligent-popup'
        }
    });
    
    showSuccessFeedback('Page bookmarked!', { top: window.scrollY + 100, left: 100 });
}

function createSmartNote(analysis) {
    hideSelectionToolbar();
    
    chrome.runtime.sendMessage({
        type: 'CREATE_SMART_NOTE',
        data: {
            content: analysis.text,
            context: {
                url: window.location.href,
                title: document.title,
                pageSection: analysis.pageSection,
                intelligence: analysis
            },
            timestamp: new Date().toISOString(),
            source: 'intelligent-popup'
        }
    });
    
    showSuccessFeedback('Smart note created!', analysis.rect);
}

// Inject CSS styles for selection toolbar
const toolbarStyles = document.createElement('style');
toolbarStyles.textContent = `
    .linkmind-selection-toolbar {
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.4;
        user-select: none;
    }
    
    .toolbar-content-type {
        display: flex;
        align-items: center;
        gap: 6px;
        padding-right: 8px;
        border-right: 1px solid rgba(0, 0, 0, 0.1);
        margin-right: 8px;
    }
    
    .content-icon {
        font-size: 14px;
    }
    
    .content-label {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
    }
    
    .toolbar-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 10px;
        border: none;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease-out;
        background: none;
    }
    
    .toolbar-btn.primary {
        background: #6366f1;
        color: white;
    }
    
    .toolbar-btn.primary:hover {
        background: #5b5bd6;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
    }
    
    .toolbar-btn.secondary {
        background: none;
        color: #6b7280;
        border: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .toolbar-btn.secondary:hover {
        background: #f3f4f6;
        color: #374151;
    }
    
    .btn-icon {
        font-size: 14px;
    }
    
    .btn-label {
        font-size: 12px;
    }
    
    .toolbar-divider {
        width: 1px;
        height: 20px;
        background: rgba(0, 0, 0, 0.1);
    }
    
    .linkmind-success-feedback {
        font-family: system-ui, -apple-system, sans-serif;
    }
    
    @keyframes toolbarSlideIn {
        from {
            opacity: 0;
            transform: translateY(5px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes successPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .linkmind-selection-toolbar {
        animation: toolbarSlideIn 0.15s ease-out;
    }
    
    .linkmind-success-feedback {
        animation: successPulse 0.6s ease-out;
    }
`;
document.head.appendChild(toolbarStyles);

// Global mouse handler for toolbar proximity detection (safer version)
document.addEventListener('mousemove', (e) => {
    const toolbar = window.linkMindActiveToolbar;
    if (toolbar && toolbar.parentNode) {
        try {
            const toolbarRect = toolbar.getBoundingClientRect();
            const distanceToToolbar = Math.sqrt(
                Math.pow(e.clientX - (toolbarRect.left + toolbarRect.width/2), 2) +
                Math.pow(e.clientY - (toolbarRect.top + toolbarRect.height/2), 2)
            );
            
            // This just provides proximity tracking - individual handlers manage hiding
            if (distanceToToolbar < 100) {
                // User is near toolbar - let hover handlers manage visibility
            }
        } catch (error) {
            // Clean up stale reference
            window.linkMindActiveToolbar = null;
        }
    }
});

console.log('🎯 LinkMind ready to capture knowledge on:', document.title);
console.log('✨ Select any text to see smart toolbar automatically!');
console.log('⚡ Use Ctrl+Shift+C for instant capture');