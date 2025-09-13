# Nuovix Automated Debugging System

## 🚀 Quick Start

### 1. **Load Extension with Debug Infrastructure**
```bash
# Build extension with debugging enabled
npm run build

# Load the ./dist folder in Chrome extensions page
# The extension now includes comprehensive debugging tools
```

### 2. **Access Real-Time Debug Dashboard**
- **Method 1**: Right-click extension icon → "Options"
- **Method 2**: Go to `chrome://extensions/` → Nuovix → "Extension options"
- **Method 3**: Navigate to `chrome-extension://[extension-id]/src/debug/debug.html`

### 3. **View Live Debugging Information**
The dashboard provides:
- **Real-time log stream** with structured data
- **Performance metrics** (capture timing, session duration)
- **Storage inspector** with live data visualization
- **Flow tracking** for user operations
- **Error monitoring** with stack traces

## 🔧 Running Automated Tests

### Core Functionality Tests
```bash
# Run all tests
npm test

# Run with browser visible for debugging
npm run test:headed

# Debug mode with step-by-step execution
npm run test:debug

# Run only core functionality tests
npm run test:core

# Run user flow tests
npm run test:flows
```

### Test Results Analysis
```bash
# Generate HTML test report
npm run analyze

# View results in browser
open playwright-report/index.html
```

## 📊 Debug Dashboard Features

### **Live Log Monitoring**
- **Structured logging** across all extension contexts
- **Filterable by level**: Error, Warning, Success, Info, Debug, Flow events
- **Searchable content** with real-time filtering
- **Context separation**: Service worker, content script, sidepanel, popup
- **Export capabilities** for analysis

### **Performance Tracking**
- **Timer tracking** for operations (capture save time, etc.)
- **Storage operation monitoring** 
- **Memory usage estimation**
- **Session duration tracking**

### **Flow Visualization**
- **User flow tracking**: selection → toolbar → capture → storage
- **Step-by-step monitoring** of operations
- **Success/failure tracking** with automatic recovery detection
- **Component lifecycle monitoring**

### **Storage Inspector**
- **Real-time storage contents** with expandable JSON viewer
- **Capture data inspection** with metadata
- **Storage size monitoring**
- **Data integrity verification**

## 🧪 Testing Framework

### **Extension-Specific Testing**
The Playwright test suite provides:

1. **Chrome Extension Context Testing**
   - Loads extension in real Chrome instance
   - Tests actual browser integration
   - Verifies extension permissions and APIs

2. **End-to-End User Flows**
   - Text selection → toolbar display → capture save
   - Context menu interactions
   - Sidepanel real-time updates
   - Debug dashboard functionality

3. **Error Scenario Testing**
   - Large content handling
   - Network failure simulation
   - Storage quota scenarios
   - Recovery mechanisms

4. **Performance Benchmarking**
   - Capture operation timing
   - Memory usage monitoring
   - Storage efficiency testing

### **Key Test Files**
- `tests/extension-core.spec.js` - Core functionality and debug dashboard
- `tests/user-flows.spec.js` - Complete user workflows and integration
- `tests/utils/extension-utils.js` - Reusable testing utilities

## 📈 Debugging Workflows

### **Issue Investigation**
1. **Reproduce issue** in browser with extension loaded
2. **Open debug dashboard** to monitor real-time logs
3. **Filter logs** by context/level to isolate problem
4. **Export logs** for detailed analysis
5. **Run automated tests** to verify fix

### **Performance Analysis**
1. **Monitor performance metrics** in dashboard
2. **Look for timer events** showing operation durations
3. **Check storage operations** for efficiency
4. **Run performance tests** for regression detection

### **Development Workflow**
1. **Make code changes**
2. **Run `npm run build`** to rebuild extension
3. **Reload extension** in Chrome
4. **Monitor debug dashboard** for issues
5. **Run `npm test`** for automated verification

## 🔍 Log Structure

### **Log Entry Format**
```javascript
{
  timestamp: "2025-01-XX...",
  sessionId: "session_123...",
  context: "service-worker|content-script|sidepanel|popup",
  level: "INFO|WARN|ERROR|SUCCESS|DEBUG|FLOW_START|FLOW_STEP|FLOW_END|TIMER_START|TIMER_END|STORAGE_OP|COMPONENT",
  message: "Human readable message",
  data: { /* Structured data */ },
  url: "Current page URL"
}
```

### **Key Log Types**
- **FLOW_START/STEP/END**: User operation tracking
- **TIMER_START/END**: Performance measurement
- **STORAGE_OP**: All storage operations with success/failure
- **COMPONENT**: Component lifecycle events
- **ERROR**: Detailed error information with stack traces

## 🚨 Troubleshooting

### **Extension Not Loading**
- Check `chrome://extensions/` for error messages
- Verify `dist/` folder contains all files
- Check console for manifest errors

### **Debug Dashboard Not Working**
- Ensure extension has proper permissions
- Check if debug-logger.js is accessible
- Verify options_page in manifest.json

### **Tests Failing**
- Run `npm run test:install` to install Playwright browsers
- Check that extension builds successfully with `npm run build`
- Verify Chrome DevTools Protocol access

### **No Logs Appearing**
- Check if content script is loading (look for initialization logs)
- Verify message passing between contexts
- Check storage permissions and quota

## 📋 Best Practices

1. **Use structured logging** instead of console.log
2. **Track user flows** with start/step/end patterns
3. **Monitor performance** with timer tracking
4. **Verify storage operations** with success/failure logging
5. **Run tests regularly** to catch regressions
6. **Export logs** for detailed analysis when needed

## 🎯 Next Steps

With this debugging infrastructure in place:
1. **Development velocity increases** through immediate feedback
2. **Bug detection is automated** via comprehensive testing
3. **Performance monitoring is continuous** 
4. **User issues are traceable** through detailed logging
5. **Regression prevention** through automated test suite

The system transforms debugging from reactive manual work to proactive automated monitoring with comprehensive visibility.
