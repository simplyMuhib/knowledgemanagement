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

// Track text selection for smart capture suggestions and context menu intelligence
let selectionTimeout;
let currentSelection = null;

function handleSelectionChange() {
    clearTimeout(selectionTimeout);
    
    selectionTimeout = setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText.length > 10) { // Only for meaningful selections
            console.log('📝 Text selected:', selectedText.substring(0, 50) + '...');
            
            // Analyze selection context for intelligent context menus
            currentSelection = analyzeSelection(selection, selectedText);
            
            // Notify background script about selection context
            chrome.runtime.sendMessage({
                type: 'SELECTION_CONTEXT_UPDATE',
                data: currentSelection
            });
            
            // Show subtle capture hint (future enhancement)
            showSelectionHint(selection);
        } else {
            currentSelection = null;
            hideSelectionHint();
        }
    }, 300); // Debounce selection changes
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
    const quotationMarks = ['"', '"', '"', "'", ''', '''];
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

// Intelligent Selection Popup System
let selectionPopup = null;
let gestureTimer = null;
let isGestureActive = false;

// Double-click + hold gesture detection
let clickCount = 0;
let clickTimer = null;
let holdTimer = null;

document.addEventListener('mousedown', handleMouseDown);
document.addEventListener('mouseup', handleMouseUp);
document.addEventListener('dblclick', handleDoubleClick);

function handleMouseDown(e) {
    clickCount++;
    
    if (clickCount === 1) {
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 400); // Reset after 400ms
    } else if (clickCount === 2) {
        // Double-click detected, start hold timer
        clearTimeout(clickTimer);
        isGestureActive = true;
        
        holdTimer = setTimeout(() => {
            if (isGestureActive) {
                handleSmartGesture();
            }
        }, 500); // Hold for 500ms
    }
}

function handleMouseUp(e) {
    isGestureActive = false;
    if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
    }
}

function handleDoubleClick(e) {
    // Prevent default double-click behavior when we're using it for gesture
    const selection = window.getSelection();
    if (selection.toString().trim().length > 10) {
        e.preventDefault();
    }
}

function handleSmartGesture() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 10) {
        console.log('🎯 Smart gesture detected for:', selectedText.substring(0, 50) + '...');
        showIntelligentPopup(selection, selectedText);
    }
    
    // Reset gesture state
    clickCount = 0;
    isGestureActive = false;
}

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

// Show intelligent popup with content analysis
function showIntelligentPopup(selection, text) {
    hideIntelligentPopup(); // Remove any existing popup
    
    if (!selection.rangeCount) return;
    
    // Analyze the selection for intelligent actions
    const analysis = analyzeSelection(selection, text);
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Create intelligent popup
    selectionPopup = document.createElement('div');
    selectionPopup.className = 'linkmind-intelligent-popup';
    selectionPopup.innerHTML = createPopupHTML(analysis);
    
    // Style the popup with modern design
    selectionPopup.style.cssText = `
        position: fixed;
        top: ${Math.max(10, rect.top - 180)}px;
        left: ${Math.max(10, Math.min(window.innerWidth - 320, rect.left))}px;
        z-index: 999999;
        width: 300px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: auto;
    `;
    
    document.body.appendChild(selectionPopup);
    
    // Animate in
    requestAnimationFrame(() => {
        selectionPopup.style.opacity = '1';
        selectionPopup.style.transform = 'translateY(0)';
    });
    
    // Add event listeners to popup actions
    addPopupEventListeners(selectionPopup, analysis);
    
    // Auto-hide after 8 seconds unless user interacts
    setTimeout(() => {
        if (selectionPopup && !selectionPopup.matches(':hover')) {
            hideIntelligentPopup();
        }
    }, 8000);
}

function createPopupHTML(analysis) {
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
        code: 'Save Code Snippet',
        quote: 'Save Quote',
        definition: 'Save Definition', 
        data: 'Save Data',
        text: 'Capture Selection'
    }[contentType];
    
    const preview = analysis.text.length > 60 ? 
                   analysis.text.substring(0, 60) + '...' : 
                   analysis.text;
    
    return `
        <div class="popup-header">
            <div class="popup-type">
                <span class="type-icon">${icon}</span>
                <span class="type-label">Smart ${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Detected</span>
            </div>
            <button class="popup-close" data-action="close">✕</button>
        </div>
        
        <div class="popup-content">
            <div class="content-preview">
                <p class="preview-text">"${preview}"</p>
            </div>
            
            <div class="popup-actions">
                <button class="action-btn primary" data-action="capture" data-type="${contentType}">
                    <span class="btn-icon">${icon}</span>
                    <span class="btn-label">${actionLabel}</span>
                </button>
                
                <button class="action-btn secondary" data-action="research" data-type="${contentType}">
                    <span class="btn-icon">🔬</span>
                    <span class="btn-label">Research This</span>
                </button>
            </div>
            
            <div class="popup-extras">
                <button class="extra-btn" data-action="screenshot">📸 Screenshot</button>
                <button class="extra-btn" data-action="bookmark">🔗 Save Page</button>
                <button class="extra-btn" data-action="note">📝 Add Note</button>
            </div>
        </div>
        
        <div class="popup-footer">
            <div class="popup-tip">💡 Use Ctrl+Shift+C for instant capture</div>
        </div>
    `;
}

function addPopupEventListeners(popup, analysis) {
    popup.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = e.currentTarget.dataset.action;
            const type = e.currentTarget.dataset.type || 'text';
            
            handlePopupAction(action, type, analysis);
        });
    });
}

function handlePopupAction(action, type, analysis) {
    console.log('🎯 Popup action triggered:', action, type);
    
    switch (action) {
        case 'close':
            hideIntelligentPopup();
            break;
        case 'capture':
            performSmartCapture(analysis, type);
            break;
        case 'research':
            performSmartResearch(analysis);
            break;
        case 'screenshot':
            requestScreenshot();
            break;
        case 'bookmark':
            requestBookmark();
            break;
        case 'note':
            createSmartNote(analysis);
            break;
    }
}

function performSmartCapture(analysis, contentType) {
    hideIntelligentPopup();
    
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

function hideIntelligentPopup() {
    if (selectionPopup) {
        selectionPopup.style.opacity = '0';
        selectionPopup.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if (selectionPopup && selectionPopup.parentNode) {
                selectionPopup.parentNode.removeChild(selectionPopup);
                selectionPopup = null;
            }
        }, 200);
    }
}

// Handle clicks outside popup to close it
document.addEventListener('click', (e) => {
    if (selectionPopup && !selectionPopup.contains(e.target)) {
        hideIntelligentPopup();
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
    hideIntelligentPopup();
    
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
    hideIntelligentPopup();
    
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
    hideIntelligentPopup();
    
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
    hideIntelligentPopup();
    
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

// Inject CSS styles for intelligent popup
const popupStyles = document.createElement('style');
popupStyles.textContent = `
    .linkmind-intelligent-popup {
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.5;
    }
    
    .popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px 12px;
        border-bottom: 1px solid rgba(229, 231, 235, 0.8);
    }
    
    .popup-type {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .type-icon {
        font-size: 16px;
    }
    
    .type-label {
        font-weight: 600;
        color: #374151;
        font-size: 14px;
    }
    
    .popup-close {
        background: none;
        border: none;
        font-size: 18px;
        color: #6b7280;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s;
    }
    
    .popup-close:hover {
        background: #f3f4f6;
        color: #374151;
    }
    
    .popup-content {
        padding: 0 20px 16px;
    }
    
    .content-preview {
        margin-bottom: 16px;
    }
    
    .preview-text {
        font-style: italic;
        color: #6b7280;
        font-size: 13px;
        line-height: 1.4;
        margin: 0;
        background: #f9fafb;
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid #6366f1;
    }
    
    .popup-actions {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
    }
    
    .action-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        flex: 1;
    }
    
    .action-btn.primary {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
    }
    
    .action-btn.primary:hover {
        background: linear-gradient(135deg, #5b5bd6, #7c3aed);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }
    
    .action-btn.secondary {
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
    }
    
    .action-btn.secondary:hover {
        background: #e5e7eb;
        transform: translateY(-1px);
    }
    
    .btn-icon {
        font-size: 16px;
    }
    
    .popup-extras {
        display: flex;
        gap: 4px;
        justify-content: space-between;
    }
    
    .extra-btn {
        background: none;
        border: none;
        color: #6b7280;
        font-size: 12px;
        padding: 6px 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        flex: 1;
    }
    
    .extra-btn:hover {
        background: #f3f4f6;
        color: #374151;
    }
    
    .popup-footer {
        padding: 12px 20px;
        border-top: 1px solid rgba(229, 231, 235, 0.8);
        background: #f9fafb;
        border-radius: 0 0 16px 16px;
    }
    
    .popup-tip {
        font-size: 12px;
        color: #6b7280;
        text-align: center;
    }
    
    .linkmind-success-feedback {
        font-family: system-ui, -apple-system, sans-serif;
    }
    
    @keyframes popupSlideIn {
        from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
    
    @keyframes successPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .linkmind-intelligent-popup {
        animation: popupSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .linkmind-success-feedback {
        animation: successPulse 0.6s ease-out;
    }
`;
document.head.appendChild(popupStyles);

console.log('🎯 LinkMind ready to capture knowledge on:', document.title);
console.log('💡 Use double-click + hold for intelligent popup');
console.log('⚡ Use Ctrl+Shift+C for instant capture');