#!/usr/bin/env node

// Quick Verification Script for Nuovix Debug System
// This script validates that all debugging components are properly built and accessible

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

console.log('🔍 Nuovix Debug System Verification');
console.log('=====================================');

// Check if extension is built
function checkExtensionBuild() {
  console.log('\n📦 Checking Extension Build...');
  
  const requiredFiles = [
    'manifest.json',
    'src/services/debug-logger.js',
    'src/debug/debug.html',
    'src/debug/debug.js',
    'src/background/service-worker.js',
    'src/content/content-script.js',
    'src/sidepanel/sidepanel.html',
    'src/sidepanel/sidepanel.js'
  ];

  let allFilesExist = true;

  requiredFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    const exists = fs.existsSync(filePath);
    
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    
    if (!exists) {
      allFilesExist = false;
    }
  });

  return allFilesExist;
}

// Check manifest configuration
function checkManifest() {
  console.log('\n📋 Checking Manifest Configuration...');
  
  try {
    const manifestPath = path.join(distDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check debug dashboard is configured as options page
    const hasOptionsPage = !!manifest.options_page;
    console.log(`  ${hasOptionsPage ? '✅' : '❌'} Options page configured: ${manifest.options_page || 'Not set'}`);
    
    // Check web accessible resources
    const hasWebResources = manifest.web_accessible_resources && 
      manifest.web_accessible_resources[0]?.resources?.includes('src/services/debug-logger.js');
    console.log(`  ${hasWebResources ? '✅' : '❌'} Debug logger is web accessible`);
    
    // Check permissions
    const hasStoragePermission = manifest.permissions?.includes('storage');
    console.log(`  ${hasStoragePermission ? '✅' : '❌'} Storage permission granted`);
    
    return hasOptionsPage && hasWebResources && hasStoragePermission;
    
  } catch (error) {
    console.log(`  ❌ Error reading manifest: ${error.message}`);
    return false;
  }
}

// Check debug infrastructure integration
function checkDebugIntegration() {
  console.log('\n🔧 Checking Debug Integration...');
  
  try {
    // Check service worker integration
    const serviceWorkerPath = path.join(distDir, 'src/background/service-worker.js');
    const serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');
    
    const hasDebugImport = serviceWorkerContent.includes('debug-logger.js');
    const hasStructuredLogging = serviceWorkerContent.includes('logger.info') || serviceWorkerContent.includes('logger.error');
    const hasFlowTracking = serviceWorkerContent.includes('startFlow') && serviceWorkerContent.includes('endFlow');
    
    console.log(`  ${hasDebugImport ? '✅' : '❌'} Service worker imports debug logger`);
    console.log(`  ${hasStructuredLogging ? '✅' : '❌'} Service worker uses structured logging`);
    console.log(`  ${hasFlowTracking ? '✅' : '❌'} Service worker has flow tracking`);
    
    // Check content script integration
    const contentScriptPath = path.join(distDir, 'src/content/content-script.js');
    const contentScriptContent = fs.readFileSync(contentScriptPath, 'utf8');
    
    const contentHasDebugLogger = contentScriptContent.includes('debug-logger.js');
    const contentHasLogging = contentScriptContent.includes('logger.') || contentScriptContent.includes('log.');
    
    console.log(`  ${contentHasDebugLogger ? '✅' : '❌'} Content script loads debug logger`);
    console.log(`  ${contentHasLogging ? '✅' : '❌'} Content script uses logging`);
    
    return hasDebugImport && hasStructuredLogging && hasFlowTracking && contentHasDebugLogger;
    
  } catch (error) {
    console.log(`  ❌ Error checking integration: ${error.message}`);
    return false;
  }
}

// Check debug dashboard components
function checkDebugDashboard() {
  console.log('\n🎛️ Checking Debug Dashboard...');
  
  try {
    const dashboardHtmlPath = path.join(distDir, 'src/debug/debug.html');
    const dashboardJsPath = path.join(distDir, 'src/debug/debug.js');
    
    const htmlContent = fs.readFileSync(dashboardHtmlPath, 'utf8');
    const jsContent = fs.readFileSync(dashboardJsPath, 'utf8');
    
    // Check HTML components
    const hasLogList = htmlContent.includes('log-list');
    const hasStorageInspector = htmlContent.includes('storageInspector');
    const hasFilters = htmlContent.includes('levelFilters');
    const hasMetrics = htmlContent.includes('sessionTime');
    
    console.log(`  ${hasLogList ? '✅' : '❌'} Log list component`);
    console.log(`  ${hasStorageInspector ? '✅' : '❌'} Storage inspector component`);
    console.log(`  ${hasFilters ? '✅' : '❌'} Log filtering system`);
    console.log(`  ${hasMetrics ? '✅' : '❌'} Real-time metrics`);
    
    // Check JavaScript functionality
    const hasLogHandling = jsContent.includes('handleNewLog');
    const hasRealTimeUpdates = jsContent.includes('chrome.runtime.onMessage');
    const hasStorageMonitoring = jsContent.includes('chrome.storage.onChanged');
    
    console.log(`  ${hasLogHandling ? '✅' : '❌'} Log handling logic`);
    console.log(`  ${hasRealTimeUpdates ? '✅' : '❌'} Real-time message handling`);
    console.log(`  ${hasStorageMonitoring ? '✅' : '❌'} Storage change monitoring`);
    
    return hasLogList && hasStorageInspector && hasFilters && hasMetrics && 
           hasLogHandling && hasRealTimeUpdates && hasStorageMonitoring;
    
  } catch (error) {
    console.log(`  ❌ Error checking dashboard: ${error.message}`);
    return false;
  }
}

// Main verification
async function main() {
  const buildExists = checkExtensionBuild();
  const manifestOk = checkManifest();
  const integrationOk = checkDebugIntegration();
  const dashboardOk = checkDebugDashboard();
  
  const allGood = buildExists && manifestOk && integrationOk && dashboardOk;
  
  console.log('\n📊 Verification Summary');
  console.log('=======================');
  console.log(`📦 Extension Build: ${buildExists ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📋 Manifest Config: ${manifestOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🔧 Debug Integration: ${integrationOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🎛️ Debug Dashboard: ${dashboardOk ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log(`\n🎯 Overall Status: ${allGood ? '✅ READY FOR TESTING' : '❌ NEEDS FIXES'}`);
  
  if (allGood) {
    console.log('\n🚀 Manual Testing Instructions:');
    console.log('1. Load ./dist folder in Chrome extensions (chrome://extensions/)');
    console.log('2. Enable "Developer mode" if needed');
    console.log('3. Right-click extension icon → "Options" to open debug dashboard');
    console.log('4. Visit any webpage and select text to test capture functionality');
    console.log('5. Monitor real-time logs and metrics in the debug dashboard');
    console.log('');
    console.log('🎛️ Debug Dashboard Features:');
    console.log('• Real-time log streaming with filtering');
    console.log('• Performance metrics and timing analysis');
    console.log('• Storage inspector with live data');
    console.log('• User flow tracking and error monitoring');
    console.log('• Export capabilities for detailed analysis');
  } else {
    console.log('\n❌ Some components need attention before testing.');
  }
  
  process.exit(allGood ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
