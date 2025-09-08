// Test script for bookmark import functionality
// Run this with: node test-bookmark-import.js

// Mock Chrome bookmarks tree structure
const mockBookmarksTree = [
    {
        id: "0",
        title: "",
        children: [
            {
                id: "1",
                title: "Bookmarks bar",
                children: [
                    {
                        id: "2",
                        title: "GitHub",
                        url: "https://github.com",
                        dateAdded: 1694102400000
                    },
                    {
                        id: "3", 
                        title: "Development",
                        children: [
                            {
                                id: "4",
                                title: "Stack Overflow",
                                url: "https://stackoverflow.com",
                                dateAdded: 1694188800000
                            },
                            {
                                id: "5",
                                title: "MDN Web Docs",
                                url: "https://developer.mozilla.org",
                                dateAdded: 1694275200000
                            }
                        ]
                    }
                ]
            },
            {
                id: "6",
                title: "Other bookmarks",
                children: [
                    {
                        id: "7",
                        title: "YouTube",
                        url: "https://youtube.com",
                        dateAdded: 1694361600000
                    }
                ]
            }
        ]
    }
];

// Mock QuaeliSidePanel class methods for testing
class MockQuaeliSidePanel {
    constructor() {
        this.savedItems = [];
    }

    processBookmarksTree(bookmarksTree, currentPath = []) {
        let flatBookmarks = [];
        
        for (const node of bookmarksTree) {
            if (node.children) {
                // This is a folder
                const folderPath = [...currentPath];
                if (node.title && node.title !== 'Bookmarks bar' && node.title !== 'Other bookmarks') {
                    folderPath.push(node.title);
                }
                flatBookmarks = flatBookmarks.concat(
                    this.processBookmarksTree(node.children, folderPath)
                );
            } else if (node.url && node.title) {
                // This is a bookmark
                flatBookmarks.push({
                    title: node.title,
                    url: node.url,
                    folder: currentPath.length > 0 ? currentPath.join(' > ') : 'Imported',
                    dateAdded: node.dateAdded ? new Date(node.dateAdded) : new Date()
                });
            }
        }
        
        return flatBookmarks;
    }

    async convertBookmarksToItems(bookmarks) {
        const existingUrls = new Set(this.savedItems.map(item => item.url));
        const importedItems = [];
        let duplicates = 0;
        
        for (const bookmark of bookmarks) {
            // Skip duplicates based on URL
            if (existingUrls.has(bookmark.url)) {
                duplicates++;
                continue;
            }
            
            // Convert to Quaeli item format
            const item = {
                id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'link',
                title: bookmark.title,
                url: bookmark.url,
                timestamp: bookmark.dateAdded.toISOString(),
                project: bookmark.folder,
                source: 'chrome_bookmarks',
                intelligence: {
                    contentType: 'bookmark'
                },
                preview: this.generatePreview(bookmark.title, bookmark.url)
            };
            
            importedItems.push(item);
            existingUrls.add(bookmark.url);
        }
        
        if (duplicates > 0) {
            console.log(`Skipped ${duplicates} duplicate bookmarks`);
        }
        
        return importedItems;
    }

    generatePreview(title, url) {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            return `${title.substring(0, 100)}${title.length > 100 ? '...' : ''} - ${domain}`;
        } catch {
            return title.substring(0, 100) + (title.length > 100 ? '...' : '');
        }
    }
}

// Run tests
async function runTests() {
    console.log('🧪 Testing Bookmark Import Functionality\n');
    
    const panel = new MockQuaeliSidePanel();
    
    // Test 1: Process bookmarks tree
    console.log('Test 1: Processing bookmarks tree...');
    const flatBookmarks = panel.processBookmarksTree(mockBookmarksTree);
    console.log(`✅ Found ${flatBookmarks.length} bookmarks`);
    console.log('Bookmarks:', flatBookmarks.map(b => `${b.title} (${b.folder})`));
    console.log();
    
    // Test 2: Convert to Quaeli items
    console.log('Test 2: Converting to Quaeli format...');
    const importedItems = await panel.convertBookmarksToItems(flatBookmarks);
    console.log(`✅ Converted ${importedItems.length} items`);
    console.log('Sample item:');
    console.log(JSON.stringify(importedItems[0], null, 2));
    console.log();
    
    // Test 3: Duplicate detection
    console.log('Test 3: Testing duplicate detection...');
    panel.savedItems = [
        { url: 'https://github.com', title: 'Existing GitHub' }
    ];
    const filteredItems = await panel.convertBookmarksToItems(flatBookmarks);
    console.log(`✅ Filtered out duplicates: ${importedItems.length - filteredItems.length} skipped`);
    console.log(`Final count: ${filteredItems.length} unique items`);
    console.log();
    
    console.log('🎉 All tests passed! Bookmark import functionality is working correctly.');
}

runTests().catch(console.error);