// LinkMind Service Worker - Local-First Background Handler
console.log('🧠 LinkMind Service Worker Loaded');

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
    console.log('📦 LinkMind installed:', details.reason);
    
    if (details.reason === 'install') {
        console.log('🎉 First time installation');
        // Extension is being installed for the first time
        // IndexedDB will handle data initialization
    } else if (details.reason === 'update') {
        console.log('⬆️ Extension updated');
        // Extension is being updated
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('🚀 LinkMind service worker started');
});

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
        default:
            console.log('Unknown command:', command);
    }
});

// Handle context menu clicks (future feature)
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('📝 Context menu clicked:', info.menuItemId);
    // Will implement context menu capture in later chunks
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('💬 Message received:', message);
    
    switch (message.type) {
        case 'CAPTURE_SELECTION':
            handleCaptureSelection(message.data, sender.tab);
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
            
        default:
            sendResponse({ success: false, error: 'Unknown message type' });
    }
    
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
function handleCaptureSelection(data, tab) {
    console.log('📝 Capturing selection from:', tab.title);
    console.log('📄 Captured content:', data);
    
    // This will integrate with our IndexedDB storage service
    // For now, just log the capture
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

console.log('✅ LinkMind Service Worker Ready');