# Nuovix Extension Build Guide

## Quick Start

### Building the Extension
```bash
node build.js
```

This creates a `dist/` folder with the production-ready extension.

### Loading in Chrome/Edge
1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `./dist` folder

### Loading in Firefox
1. Open `about:debugging`
2. Click "This Firefox" 
3. Click "Load Temporary Add-on"
4. Select `manifest.json` from the `./dist` folder

## Features

The built extension includes:

### ✅ Implemented Features
- **Intelligent Context Menus**: Right-click to access Nuovix capture options
- **Smart Content Detection**: Auto-detects code, quotes, definitions, and data
- **Multi-modal Capture**: Text, links, images, screenshots, and full pages
- **Research Integration**: Quick research on selected content
- **Dynamic Menu Titles**: Context menus adapt based on content type

### 🔬 Context Menu Intelligence
- **Code Detection**: Recognizes programming syntax and code blocks
- **Quote Detection**: Identifies quoted text and citations
- **Definition Detection**: Finds explanatory content and definitions
- **Data Detection**: Recognizes numbers, percentages, dates, currency

### 📋 Available Context Menu Actions
- **Capture Selection**: Save selected text with intelligent categorization
- **Save Link**: Bookmark links with metadata
- **Save Image**: Capture images with context
- **Capture Page**: Full page content extraction
- **Research This**: Smart research on selected content
- **Screenshot Area**: Capture visible page area

### 🎯 Smart Features
- **Real-time Selection Analysis**: Analyzes content as you select
- **Context-aware Titles**: Menu options change based on content type
- **Subtle Visual Hints**: Shows capture indicators on text selection
- **Notification Feedback**: Confirms successful captures

## Development

### Project Structure
```
dist/
├── manifest.json          # Extension manifest
├── package-info.json     # Build metadata
├── src/
│   ├── background/       # Service worker
│   ├── content/          # Content scripts
│   ├── popup/           # Extension popup
│   ├── sidepanel/       # Side panel interface
│   ├── dashboard/       # Dashboard (not enabled by default)
│   ├── services/        # Storage and utilities
│   └── shared/          # Shared components
└── assets/
    └── icons/           # Extension icons
```

### Key Files
- `src/background/service-worker.js`: Context menu logic and capture handlers
- `src/content/content-script.js`: Page content analysis and selection tracking
- `manifest.json`: Extension permissions and configuration

### Permissions Used
- `storage`: Local data storage
- `activeTab`: Access to active tab content
- `scripting`: Inject content analysis scripts
- `contextMenus`: Create right-click menus
- `sidePanel`: Show research/management panel
- `tabs`: Tab information and screenshot capture
- `bookmarks`: Integration with browser bookmarks
- `notifications`: User feedback

## Usage

1. **Install the extension** using the instructions above
2. **Browse any website** - the extension works on all URLs
3. **Right-click anywhere** to see Nuovix context menu
4. **Select text and right-click** to see smart capture options
5. **Context menu titles change** based on what you select (code, quotes, data, etc.)
6. **All captures are saved** and can be accessed via the extension popup

## Troubleshooting

### Extension Not Loading
- Ensure you're pointing to the `dist` folder, not the project root
- Check that "Developer mode" is enabled
- Look for errors in `chrome://extensions/`

### Context Menus Not Appearing  
- Refresh the page after loading the extension
- Check extension permissions are granted
- Right-click should show "Nuovix" submenu

### Captures Not Saving
- Check browser console for errors (F12)
- Verify storage permissions are granted
- Look at extension's background page for logs

## Next Steps

The extension is ready for immediate use with intelligent context menus. Future enhancements will include:
- Integration with IndexedDB storage service
- Advanced research capabilities
- Knowledge graph connections
- Collaborative features
- Export functionality

---

🎯 **Nuovix is now context-menu first!** Right-click on any content to start capturing knowledge intelligently.
