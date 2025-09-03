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

// Track text selection for smart capture suggestions
let selectionTimeout;
function handleSelectionChange() {
    clearTimeout(selectionTimeout);
    
    selectionTimeout = setTimeout(() => {
        const selectedText = window.getSelection().toString().trim();
        
        if (selectedText.length > 10) { // Only for meaningful selections
            console.log('📝 Text selected:', selectedText.substring(0, 50) + '...');
            
            // Could show capture hint UI in future
            // For now, just track the selection
        }
    }, 300); // Debounce selection changes
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

console.log('🎯 LinkMind ready to capture knowledge on:', document.title);