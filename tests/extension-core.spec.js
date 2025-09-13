// Core Extension Functionality Tests
import { test, expect } from '@playwright/test';
import { ExtensionTestUtils } from './utils/extension-utils.js';

let extensionUtils;

test.describe('Nuovix Extension - Core Functionality', () => {
  test.beforeEach(async () => {
    extensionUtils = new ExtensionTestUtils();
    await extensionUtils.launchWithExtension();
    await extensionUtils.waitForExtensionReady();
    
    // Clear any existing captures before each test
    await extensionUtils.clearStoredCaptures();
  });

  test.afterEach(async () => {
    if (extensionUtils) {
      await extensionUtils.cleanup();
    }
  });

  test('Extension loads and initializes correctly', async () => {
    // Open debug dashboard to verify extension is loaded
    const debugPage = await extensionUtils.openDebugDashboard();
    
    // Wait for dashboard to load
    await debugPage.waitForSelector('.dashboard', { timeout: 10000 });
    
    // Check that the dashboard shows "Live Monitoring"
    const statusIndicator = debugPage.locator('.status-indicator');
    await expect(statusIndicator).toContainText('Live Monitoring');
    
    // Verify that debug logs are being collected
    const logs = await extensionUtils.getDebugLogs();
    expect(logs.length).toBeGreaterThan(0);
    
    // Look for service worker startup log
    const serviceWorkerLogs = logs.filter(log => log.context === 'service-worker');
    expect(serviceWorkerLogs.length).toBeGreaterThan(0);
  });

  test('Content script initializes on web pages', async () => {
    // Create a test page
    const testPage = await extensionUtils.createTestPage();
    await testPage.setContent(`
      <html>
        <head><title>Test Page</title></head>
        <body>
          <h1>Test Content</h1>
          <p>This is a test paragraph with some text to select.</p>
        </body>
      </html>
    `);

    // Wait for content script to initialize
    await testPage.waitForTimeout(1000);
    
    // Check debug logs for content script initialization
    await extensionUtils.waitForLogMessage('Content script initializing');
    
    const logs = await extensionUtils.getDebugLogs();
    const contentScriptLogs = logs.filter(log => log.context === 'content-script');
    expect(contentScriptLogs.length).toBeGreaterThan(0);
  });

  test('Text selection triggers toolbar display', async () => {
    // Create a test page with selectable content
    const testPage = await extensionUtils.createTestPage();
    await testPage.setContent(`
      <html>
        <head><title>Selection Test</title></head>
        <body>
          <div id="test-content" style="padding: 20px; font-size: 16px;">
            This is some test content that we will select to trigger the toolbar.
            It needs to be long enough to make a meaningful selection.
          </div>
        </body>
      </html>
    `);

    // Wait for content script to load
    await testPage.waitForTimeout(1000);
    
    // Select text on the page
    await testPage.locator('#test-content').dblclick();
    await testPage.waitForTimeout(500);
    
    // Check if selection toolbar appears
    const toolbar = testPage.locator('.nuovix-selection-toolbar');
    await expect(toolbar).toBeVisible({ timeout: 5000 });
    
    // Verify toolbar has capture button
    const captureBtn = toolbar.locator('[data-action="capture"]');
    await expect(captureBtn).toBeVisible();
  });

  test('Text capture saves to storage successfully', async () => {
    const testPage = await extensionUtils.createTestPage();
    const testText = 'This is important text to capture and save.';
    
    await testPage.setContent(`
      <html>
        <head><title>Capture Test</title></head>
        <body>
          <div id="capture-text" style="padding: 20px;">${testText}</div>
        </body>
      </html>
    `);

    // Wait for content script
    await testPage.waitForTimeout(1000);
    
    // Initial capture count should be 0
    const initialCount = await extensionUtils.getStoredCapturesCount();
    expect(initialCount).toBe(0);
    
    // Select and capture text
    await extensionUtils.selectTextOnPage(testPage, testText);
    
    // Wait for toolbar and click capture
    await extensionUtils.clickCaptureButton(testPage);
    
    // Wait for capture to be processed and saved
    await extensionUtils.waitForCaptureToSave();
    
    // Verify capture was saved
    const finalCount = await extensionUtils.getStoredCapturesCount();
    expect(finalCount).toBe(1);
    
    // Verify the capture content
    const debugPage = await extensionUtils.openDebugDashboard();
    const storageData = await debugPage.evaluate(async () => {
      const storage = await chrome.storage.local.get();
      const captureKeys = Object.keys(storage).filter(key => key.startsWith('capture_'));
      return captureKeys.length > 0 ? storage[captureKeys[0]] : null;
    });
    
    expect(storageData).toBeTruthy();
    expect(storageData.type).toBe('text');
    expect(storageData.content).toContain(testText);
  });

  test('Debug dashboard displays real-time logs', async () => {
    const debugPage = await extensionUtils.openDebugDashboard();
    
    // Wait for dashboard to fully load
    await debugPage.waitForSelector('.log-list', { timeout: 10000 });
    
    // Create activity to generate logs
    const testPage = await extensionUtils.createTestPage();
    await testPage.setContent('<h1>Test Activity Page</h1>');
    
    // Wait for new logs to appear
    await debugPage.waitForTimeout(2000);
    
    // Check that logs are displayed in the dashboard
    const logEntries = debugPage.locator('.log-entry');
    const logCount = await logEntries.count();
    expect(logCount).toBeGreaterThan(0);
    
    // Verify log structure
    const firstLog = logEntries.first();
    await expect(firstLog.locator('.log-meta')).toBeVisible();
    await expect(firstLog.locator('.log-message')).toBeVisible();
    await expect(firstLog.locator('.log-context')).toBeVisible();
  });

  test('Debug dashboard shows storage inspector', async () => {
    const debugPage = await extensionUtils.openDebugDashboard();
    
    // Wait for storage inspector to load
    await debugPage.waitForSelector('#storageInspector', { timeout: 10000 });
    
    // Create a test capture to have something in storage
    const testPage = await extensionUtils.createTestPage();
    await extensionUtils.selectTextOnPage(testPage, 'Test storage content');
    await extensionUtils.clickCaptureButton(testPage);
    await extensionUtils.waitForCaptureToSave();
    
    // Wait for storage inspector to update
    await debugPage.waitForTimeout(2000);
    
    // Check that storage keys are displayed
    const storageInspector = debugPage.locator('#storageInspector');
    const storageKeys = storageInspector.locator('.storage-key');
    const keyCount = await storageKeys.count();
    expect(keyCount).toBeGreaterThan(0);
    
    // Click on a storage key to expand it
    await storageKeys.first().click();
    
    // Verify that storage value is displayed
    const storageValue = storageInspector.locator('.storage-value').first();
    await expect(storageValue).toBeVisible();
  });

  test('Debug dashboard metrics update in real-time', async () => {
    const debugPage = await extensionUtils.openDebugDashboard();
    
    // Wait for initial metrics to load
    await debugPage.waitForSelector('#sessionTime', { timeout: 10000 });
    
    // Get initial session time
    const initialTime = await debugPage.locator('#sessionTime').textContent();
    expect(initialTime).toMatch(/\d+:\d+/);
    
    // Wait 2 seconds and check that session time updated
    await debugPage.waitForTimeout(2000);
    const updatedTime = await debugPage.locator('#sessionTime').textContent();
    expect(updatedTime).not.toBe(initialTime);
    
    // Check capture count starts at 0
    const initialCaptureCount = await debugPage.locator('#captureCount').textContent();
    expect(initialCaptureCount).toBe('0');
    
    // Create a capture and verify count updates
    const testPage = await extensionUtils.createTestPage();
    await extensionUtils.selectTextOnPage(testPage, 'Metrics test capture');
    await extensionUtils.clickCaptureButton(testPage);
    await extensionUtils.waitForCaptureToSave();
    
    // Wait for metrics to update
    await debugPage.waitForTimeout(2000);
    const updatedCaptureCount = await debugPage.locator('#captureCount').textContent();
    expect(parseInt(updatedCaptureCount)).toBeGreaterThan(0);
  });

  test('Debug dashboard log filtering works', async () => {
    const debugPage = await extensionUtils.openDebugDashboard();
    
    // Wait for dashboard to load
    await debugPage.waitForSelector('.log-list');
    
    // Generate some different types of logs by creating activity
    const testPage = await extensionUtils.createTestPage();
    await extensionUtils.selectTextOnPage(testPage, 'Filter test');
    await extensionUtils.clickCaptureButton(testPage);
    
    // Wait for logs to appear
    await debugPage.waitForTimeout(2000);
    
    // Get initial log count
    const allLogs = debugPage.locator('.log-entry');
    const initialCount = await allLogs.count();
    expect(initialCount).toBeGreaterThan(0);
    
    // Filter to only ERROR logs
    const errorFilter = debugPage.locator('[data-level="ERROR"]');
    await errorFilter.click();
    
    // Uncheck other filters
    const infoFilter = debugPage.locator('[data-level="INFO"]');
    await infoFilter.click();
    
    // Wait for filter to apply
    await debugPage.waitForTimeout(1000);
    
    // Check that log count has changed (should be fewer or same)
    const filteredCount = await allLogs.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('Performance timing is tracked correctly', async () => {
    const testPage = await extensionUtils.createTestPage();
    
    // Perform a capture operation which should be timed
    await extensionUtils.selectTextOnPage(testPage, 'Performance timing test');
    await extensionUtils.clickCaptureButton(testPage);
    
    // Wait for capture to complete
    await extensionUtils.waitForCaptureToSave();
    
    // Check debug logs for timing information
    const logs = await extensionUtils.getDebugLogs();
    
    // Look for timer start and end logs
    const timerStartLogs = logs.filter(log => log.level === 'TIMER_START');
    const timerEndLogs = logs.filter(log => log.level === 'TIMER_END');
    
    expect(timerStartLogs.length).toBeGreaterThan(0);
    expect(timerEndLogs.length).toBeGreaterThan(0);
    
    // Find capture-save timer logs
    const captureTimerEnd = timerEndLogs.find(log => 
      log.data.timerName === 'capture-save' && 
      log.data.duration && 
      log.data.duration.includes('ms')
    );
    
    expect(captureTimerEnd).toBeTruthy();
    expect(captureTimerEnd.data.duration).toMatch(/\d+\.\d+ms/);
  });
});
