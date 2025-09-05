// LinkMind Service Worker - Local-First Background Handler

// Simple logger fallback
const logger = {
    info: () => {},
    error: () => {},
    debug: () => {},
    startFlow: () => {},
    endFlow: () => {},
    stepFlow: () => {},
    startTimer: () => {},
    endTimer: () => {},
    trackStorageOperation: () => {}
};

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
    logger.info('Extension installed/updated', { reason: details.reason });
    
    if (details.reason === 'install') {
        logger.startFlow('extension-installation');
        logger.info('First time installation starting');
        
        // TEST: Create a sample capture on install
        createTestCapture();
        
        logger.endFlow('extension-installation', true);
    } else if (details.reason === 'update') {
        logger.info('Extension updated', { 
            previousVersion: details.previousVersion,
            currentVersion: chrome.runtime.getManifest().version
        });
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    logger.info('Service worker started');
});

// Handle debug log storage from content scripts
async function storeDebugLog(logEntry) {
    try {
        const { debug_logs = [] } = await chrome.storage.local.get('debug_logs');
        debug_logs.push(logEntry);
        
        // Keep only last 500 logs in storage
        if (debug_logs.length > 500) {
            debug_logs.splice(0, debug_logs.length - 500);
        }
        
        await chrome.storage.local.set({ debug_logs });
    } catch (error) {
        console.error('Failed to store debug log:', error);
    }
}

// Handle command shortcuts
chrome.commands.onCommand.addListener((command) => {
    console.log('⌨️ Command triggered:', command);
    
    switch (command) {
        case 'quick_capture':
            handleQuickCapture();
            break;
        case 'toggle_sidepanel':
            handleToggleSidepanel();
            break;
        case 'test_capture':
            createTestCapture();
            break;
        default:
            console.log('Unknown command:', command);
    }
});

// Initialize intelligent context menus
chrome.runtime.onInstalled.addListener(() => {
    setupContextMenus();
});

// Dynamic context menu system with content detection
function setupContextMenus() {
    chrome.contextMenus.removeAll(() => {
        // Main LinkMind parent menu
        chrome.contextMenus.create({
            id: 'linkmind-main',
            title: 'LinkMind',
            contexts: ['all']
        });

        // Smart capture options based on content type
        chrome.contextMenus.create({
            id: 'capture-selection',
            parentId: 'linkmind-main',
            title: 'Capture Selection',
            contexts: ['selection'],
            visible: true
        });

        chrome.contextMenus.create({
            id: 'capture-link',
            parentId: 'linkmind-main', 
            title: 'Save Link',
            contexts: ['link'],
            visible: true
        });

        chrome.contextMenus.create({
            id: 'capture-image',
            parentId: 'linkmind-main',
            title: 'Save Image',
            contexts: ['image'],
            visible: true
        });

        chrome.contextMenus.create({
            id: 'capture-page',
            parentId: 'linkmind-main',
            title: 'Capture Page',
            contexts: ['page'],
            visible: true
        });

        chrome.contextMenus.create({
            id: 'smart-research',
            parentId: 'linkmind-main',
            title: 'Research This',
            contexts: ['selection'],
            visible: true
        });

        chrome.contextMenus.create({
            id: 'screenshot-area',
            parentId: 'linkmind-main',
            title: 'Screenshot Area',
            contexts: ['all'],
            visible: true
        });

        console.log('🎯 Dynamic context menus initialized');
    });
}

// Handle context menu clicks with intelligent routing
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    console.log('📝 Context menu clicked:', info.menuItemId, info);
    
    try {
        switch (info.menuItemId) {
            case 'capture-selection':
                await handleSmartTextCapture(info, tab);
                break;
            case 'capture-link':
                await handleLinkCapture(info, tab);
                break;
            case 'capture-image':
                await handleImageCapture(info, tab);
                break;
            case 'capture-page':
                await handlePageCapture(info, tab);
                break;
            case 'smart-research':
                await handleSmartResearch(info, tab);
                break;
            case 'screenshot-area':
                await handleScreenshotCapture(info, tab);
                break;
            default:
                console.log('Unknown context menu item:', info.menuItemId);
        }
    } catch (error) {
        console.error('❌ Context menu action failed:', error);
    }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    logger.debug('Message received', {
        messageType: message.type,
        senderTabId: sender.tab?.id,
        senderUrl: sender.tab?.url,
        hasData: !!message.data
    });
    
    // Handle async operations properly
    (async () => {
        try {
            switch (message.type) {
                case 'CAPTURE_SELECTION':
                    await handleCaptureSelection(message.data, sender.tab);
                    sendResponse({ success: true });
                    break;
                    
                case 'GET_TAB_INFO':
                    if (sender.tab) {
                        sendResponse({
                            success: true,
                            tab: {
                                title: sender.tab.title,
                                url: sender.tab.url,
                                favIconUrl: sender.tab.favIconUrl
                            }
                        });
                    }
                    break;
                    
                case 'SELECTION_CONTEXT_UPDATE':
                    handleSelectionContextUpdate(message.data, sender.tab);
                    sendResponse({ success: true });
                    break;
                    
                case 'SMART_CAPTURE':
                    const result = await handleSmartCapture(message.data, sender.tab);
                    sendResponse({ success: !!result });
                    break;
                    
                case 'SMART_RESEARCH':
                    handleSmartResearchFromPopup(message.data, sender.tab);
                    sendResponse({ success: true });
                    break;
                    
                case 'REQUEST_SCREENSHOT':
                    handleRequestScreenshot(message.data, sender.tab);
                    sendResponse({ success: true });
                    break;
                    
                case 'DEBUG_STORE_LOG':
                    // Handle debug log storage from content scripts
                    await storeDebugLog(message.logEntry);
                    sendResponse({ success: true });
                    break;
                    
                case 'REQUEST_BOOKMARK':
                    handleRequestBookmark(message.data, sender.tab);
                    sendResponse({ success: true });
                    break;
                    
                case 'CREATE_SMART_NOTE':
                    handleCreateSmartNote(message.data, sender.tab);
                    sendResponse({ success: true });
                    break;
                    
                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('❌ Message handler error:', error);
            sendResponse({ success: false, error: error.message });
        }
    })();
    
    // Return true to indicate async response
    return true;
});

// Quick capture functionality
async function handleQuickCapture() {
    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (activeTab) {
            console.log('📸 Quick capturing from:', activeTab.title);
            
            // Inject content script to capture page info
            const results = await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                function: capturePageContent
            });
            
            if (results && results[0]) {
                console.log('✅ Quick capture successful');
                // Store the captured content (will integrate with storage service)
            }
        }
    } catch (error) {
        console.error('❌ Quick capture failed:', error);
    }
}

// Toggle sidepanel
async function handleToggleSidepanel() {
    try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (activeTab) {
            console.log('📋 Toggling sidepanel for tab:', activeTab.id);
            // Chrome will handle sidepanel visibility automatically
        }
    } catch (error) {
        console.error('❌ Sidepanel toggle failed:', error);
    }
}

// Handle text/content capture
async function handleCaptureSelection(data, tab) {
    logger.startFlow('capture-selection');
    logger.info('Handling capture selection', {
        tabTitle: tab.title,
        tabUrl: tab.url,
        contentLength: data.selectedText?.length || 0
    });
    
    try {
        // Create proper capture data structure
        const captureData = {
            type: 'text',
            content: data.selectedText,
            url: data.url,
            title: data.title,
            timestamp: data.timestamp,
            source: 'selection-toolbar'
        };
        
        // Save the capture
        logger.stepFlow('capture-selection', 'saving-to-storage');
        const savedId = await saveCapture(captureData);
        logger.success('Selection capture saved', { captureId: savedId });
        
        // Notify sidepanel of new content
        chrome.runtime.sendMessage({
            type: 'NEW_CAPTURE_SAVED',
            data: { ...captureData, id: savedId }
        }).catch(() => {
            logger.debug('No listeners for capture broadcast');
        });
        
        logger.endFlow('capture-selection', true);
        
    } catch (error) {
        logger.error('Failed to save selection capture', error);
        logger.endFlow('capture-selection', false);
    }
}

// Function that will be injected for quick capture
function capturePageContent() {
    return {
        title: document.title,
        url: window.location.href,
        selectedText: window.getSelection().toString(),
        timestamp: new Date().toISOString()
    };
}

// Handle bookmark permission (for our acquisition hook)
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
    console.log('🔖 New bookmark created:', bookmark.title);
    // Could trigger analysis update in future
});

// Context Menu Action Handlers with Content Intelligence

// Smart text capture with content analysis
async function handleSmartTextCapture(info, tab) {
    console.log('🧠 Smart text capture triggered');
    
    try {
        // Analyze the selected text for content type
        const selectedText = info.selectionText || '';
        const contentType = analyzeContentType(selectedText);
        
        // Inject content script to get additional context
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: getSelectionContext
        });
        
        const contextData = results[0]?.result || {};
        
        // Create capture data with intelligence
        const captureData = {
            type: 'text',
            content: selectedText,
            contentType: contentType,
            context: contextData,
            url: tab.url,
            title: tab.title,
            timestamp: new Date().toISOString(),
            source: 'context-menu'
        };
        
        // Save using existing capture logic
        const savedItem = await saveCapture(captureData);
        
        // Notify all tabs and sidepanel of new content
        chrome.runtime.sendMessage({
            type: 'NEW_CAPTURE_SAVED',
            data: { ...captureData, id: savedItem }
        }).catch(() => {
            // Ignore if no listeners
            console.log('📡 No listeners for new capture broadcast');
        });
        
        // Show success notification
        chrome.notifications.create({
            type: 'basic',
            title: 'LinkMind',
            message: `${contentType} captured successfully! View in sidepanel.`
        });
        
    } catch (error) {
        console.error('❌ Smart text capture failed:', error);
    }
}

// Link capture with metadata extraction
async function handleLinkCapture(info, tab) {
    console.log('🔗 Link capture triggered');
    
    try {
        const captureData = {
            type: 'link',
            url: info.linkUrl,
            title: info.linkText || info.linkUrl,
            pageUrl: tab.url,
            pageTitle: tab.title,
            timestamp: new Date().toISOString(),
            source: 'context-menu'
        };
        
        const savedItem = await saveCapture(captureData);
        
        // Notify all tabs of new content
        chrome.runtime.sendMessage({
            type: 'NEW_CAPTURE_SAVED',
            data: { ...captureData, id: savedItem }
        }).catch(() => {
            console.log('📡 No listeners for new capture broadcast');
        });
        
        chrome.notifications.create({
            type: 'basic',
            title: 'LinkMind',
            message: 'Link saved to your knowledge base! View in sidepanel.'
        });
        
    } catch (error) {
        console.error('❌ Link capture failed:', error);
    }
}

// Image capture with metadata
async function handleImageCapture(info, tab) {
    console.log('🖼️ Image capture triggered');
    
    try {
        const captureData = {
            type: 'image',
            imageUrl: info.srcUrl,
            alt: info.selectionText || '',
            pageUrl: tab.url,
            pageTitle: tab.title,
            timestamp: new Date().toISOString(),
            source: 'context-menu'
        };
        
        const savedItem = await saveCapture(captureData);
        
        chrome.notifications.create({
            type: 'basic',
            title: 'LinkMind',
            message: 'Image captured and saved! View in sidepanel.'
        });
        
    } catch (error) {
        console.error('❌ Image capture failed:', error);
    }
}

// Full page capture
async function handlePageCapture(info, tab) {
    console.log('📄 Page capture triggered');
    
    try {
        // Get page content and metadata
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: capturePageContent
        });
        
        const pageData = results[0]?.result || {};
        
        const captureData = {
            type: 'page',
            ...pageData,
            timestamp: new Date().toISOString(),
            source: 'context-menu'
        };
        
        const savedItem = await saveCapture(captureData);
        
        chrome.notifications.create({
            type: 'basic',
            title: 'LinkMind',
            message: 'Page captured successfully! View in sidepanel.'
        });
        
    } catch (error) {
        console.error('❌ Page capture failed:', error);
    }
}

// Smart research functionality
async function handleSmartResearch(info, tab) {
    console.log('🔬 Smart research triggered');
    
    try {
        const selectedText = info.selectionText || '';
        
        // Create research capture with analysis
        const captureData = {
            type: 'research',
            query: selectedText,
            content: selectedText,
            context: {
                pageUrl: tab.url,
                pageTitle: tab.title,
                timestamp: new Date().toISOString()
            },
            source: 'context-menu-research'
        };
        
        const savedItem = await saveCapture(captureData);
        
        chrome.notifications.create({
            type: 'basic',
            title: 'LinkMind Research',
            message: 'Research query saved! View results in sidepanel.'
        });
        
    } catch (error) {
        console.error('❌ Smart research failed:', error);
    }
}

// Screenshot capture
async function handleScreenshotCapture(info, tab) {
    console.log('📸 Screenshot capture triggered');
    
    try {
        // Capture visible tab
        const screenshot = await chrome.tabs.captureVisibleTab(
            tab.windowId,
            { format: 'png', quality: 95 }
        );
        
        const captureData = {
            type: 'screenshot',
            imageData: screenshot,
            url: tab.url,
            title: tab.title,
            timestamp: new Date().toISOString(),
            source: 'context-menu'
        };
        
        const savedItem = await saveCapture(captureData);
        
        chrome.notifications.create({
            type: 'basic',
            title: 'LinkMind',
            message: 'Screenshot captured and saved! View in sidepanel.'
        });
        
    } catch (error) {
        console.error('❌ Screenshot capture failed:', error);
    }
}

// Content analysis for smart categorization
function analyzeContentType(text) {
    if (!text || text.length < 10) return 'text';
    
    // Code detection
    if (/^[\s]*[<{}\[\]();,=\-+*\/\\|&%$#@!~`'"]*[\w\s]*[<{}\[\]();,=\-+*\/\\|&%$#@!~`'"]*$/g.test(text) &&
        (text.includes('{') || text.includes('function') || text.includes('class') || text.includes('<'))) {
        return 'code';
    }
    
    // Quote detection
    if (text.startsWith('"') || text.startsWith('"') || text.startsWith("'")) {
        return 'quote';
    }
    
    // Number/data detection
    if (/^\d[\d\s,.$%\-+()]*$/g.test(text.trim())) {
        return 'data';
    }
    
    // URL detection
    if (/https?:\/\/|www\./g.test(text)) {
        return 'reference';
    }
    
    // Definition detection (contains "is", "are", "means")
    if (/\b(is|are|means|refers to|defined as)\b/gi.test(text)) {
        return 'definition';
    }
    
    return 'text';
}

// Injected function to get selection context
function getSelectionContext() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return {};
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
    
    return {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        textContent: selection.toString(),
        surroundingText: element.textContent.substring(0, 200),
        pageTitle: document.title,
        pageUrl: window.location.href
    };
}

// Handle selection context updates for smarter context menus
let currentSelectionContext = null;

function handleSelectionContextUpdate(contextData, tab) {
    currentSelectionContext = {
        ...contextData,
        tabId: tab.id,
        tabUrl: tab.url,
        tabTitle: tab.title
    };
    
    console.log('🎯 Selection context updated:', currentSelectionContext);
    
    // Dynamically update context menus based on selection type
    updateContextMenusForSelection(currentSelectionContext);
}

// Dynamically update context menus based on intelligent selection analysis
function updateContextMenusForSelection(context) {
    if (!context) return;
    
    // Update context menu titles based on content type
    let captureTitle = 'Capture Selection';
    let researchTitle = 'Research This';
    
    if (context.isCode) {
        captureTitle = 'Save Code Snippet';
        researchTitle = 'Research Code';
    } else if (context.isQuote) {
        captureTitle = 'Save Quote';
        researchTitle = 'Research Quote';
    } else if (context.isDefinition) {
        captureTitle = 'Save Definition';
        researchTitle = 'Research Term';
    } else if (context.isData) {
        captureTitle = 'Save Data';
        researchTitle = 'Analyze Data';
    }
    
    // Update existing context menu items
    chrome.contextMenus.update('capture-selection', {
        title: captureTitle
    });
    
    chrome.contextMenus.update('smart-research', {
        title: researchTitle
    });
}

// Save capture data (integrate with existing storage)
async function saveCapture(captureData) {
    try {
    
    // Enhanced capture data with selection context
    if (currentSelectionContext && captureData.type === 'text') {
        captureData.intelligence = {
            contentType: currentSelectionContext.isCode ? 'code' :
                        currentSelectionContext.isQuote ? 'quote' :
                        currentSelectionContext.isDefinition ? 'definition' :
                        currentSelectionContext.isData ? 'data' : 'text',
            pageSection: currentSelectionContext.pageSection,
            nearbyLinks: currentSelectionContext.nearbyLinks,
            element: currentSelectionContext.element
        };
    }
    
    // Store in chrome.storage.local
    const storageKey = `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await chrome.storage.local.set({
        [storageKey]: captureData
    });
    
    return storageKey;
    
    } catch (error) {
        console.error('❌ Storage save failed:', error);
        throw error;
    }
}

// Intelligent Popup Action Handlers
async function handleSmartCapture(data, tab) {
    try {
        const captureData = {
            type: 'text',
            content: data.content,
            contentType: data.contentType,
            intelligence: data.intelligence,
            context: data.context,
            url: tab.url,
            title: tab.title,
            timestamp: data.timestamp,
            source: data.source
        };
        
        const savedItem = await saveCapture(captureData);
        
        // Notify all tabs of new content
        chrome.runtime.sendMessage({
            type: 'NEW_CAPTURE_SAVED',
            data: { ...captureData, id: savedItem }
        }).catch(() => {
            console.log('📡 No listeners for new capture broadcast');
        });
        
        return savedItem;
        
    } catch (error) {
        console.error('❌ Smart capture failed:', error);
        return null;
    }
}

async function handleSmartResearchFromPopup(data, tab) {
    console.log('🔬 Smart research from intelligent popup:', data.query);
    
    try {
        const captureData = {
            type: 'research',
            query: data.query,
            content: data.content,
            intelligence: data.intelligence,
            context: data.context,
            url: tab.url,
            title: tab.title,
            timestamp: data.timestamp,
            source: data.source
        };
        
        const savedItem = await saveCapture(captureData);
        
        console.log('✅ Smart research completed:', savedItem);
        
    } catch (error) {
        console.error('❌ Smart research failed:', error);
    }
}

async function handleRequestScreenshot(data, tab) {
    console.log('📸 Screenshot request from intelligent popup');
    
    try {
        const screenshot = await chrome.tabs.captureVisibleTab(
            tab.windowId,
            { format: 'png', quality: 95 }
        );
        
        const captureData = {
            type: 'screenshot',
            imageData: screenshot,
            url: tab.url,
            title: tab.title,
            timestamp: data.timestamp,
            source: data.source
        };
        
        const savedItem = await saveCapture(captureData);
        
        console.log('✅ Screenshot capture completed:', savedItem);
        
    } catch (error) {
        console.error('❌ Screenshot capture failed:', error);
    }
}

async function handleRequestBookmark(data, tab) {
    console.log('🔗 Bookmark request from intelligent popup');
    
    try {
        const captureData = {
            type: 'link',
            url: data.url,
            title: data.title,
            pageUrl: tab.url,
            pageTitle: tab.title,
            timestamp: data.timestamp,
            source: data.source
        };
        
        const savedItem = await saveCapture(captureData);
        
        console.log('✅ Bookmark capture completed:', savedItem);
        
    } catch (error) {
        console.error('❌ Bookmark capture failed:', error);
    }
}

async function handleCreateSmartNote(data, tab) {
    console.log('📝 Smart note creation from intelligent popup');
    
    try {
        const captureData = {
            type: 'note',
            content: data.content,
            context: data.context,
            intelligence: data.context.intelligence,
            url: tab.url,
            title: tab.title,
            timestamp: data.timestamp,
            source: data.source
        };
        
        const savedItem = await saveCapture(captureData);
        
        console.log('✅ Smart note creation completed:', savedItem);
        
    } catch (error) {
        console.error('❌ Smart note creation failed:', error);
    }
}

// TEST FUNCTION - Create a test capture to verify storage
async function createTestCapture() {
    console.log('🧪 Creating test capture...');
    try {
        const testCapture = {
            type: 'text',
            content: 'This is a test capture to verify storage is working',
            url: 'https://example.com',
            title: 'Test Page',
            timestamp: new Date().toISOString(),
            source: 'test',
            intelligence: {
                contentType: 'text'
            }
        };
        
        const testKey = `capture_test_${Date.now()}`;
        await chrome.storage.local.set({ [testKey]: testCapture });
        console.log('✅ Test capture created:', testKey);
        
        // Verify it was saved
        const verification = await chrome.storage.local.get(testKey);
        console.log('🔍 Test verification:', verification);
        
        // Also create a second test capture
        const testKey2 = `capture_test2_${Date.now()}`;
        await chrome.storage.local.set({ [testKey2]: { ...testCapture, content: 'Second test capture' } });
        console.log('✅ Second test capture created:', testKey2);
        
    } catch (error) {
        console.error('❌ Test capture failed:', error);
    }
}

console.log('✅ LinkMind Service Worker Ready');
console.log('🧠 Intelligent popup system enabled');
console.log('🎯 Double-click + hold for smart capture');
console.log('⚡ Ctrl+Shift+C for instant capture');