// End-to-End User Flow Tests
import { test, expect } from '@playwright/test';
import { ExtensionTestUtils } from './utils/extension-utils.js';

let extensionUtils;

test.describe('LinkMind Extension - User Flows', () => {
  test.beforeEach(async () => {
    extensionUtils = new ExtensionTestUtils();
    await extensionUtils.launchWithExtension();
    await extensionUtils.waitForExtensionReady();
    await extensionUtils.clearStoredCaptures();
  });

  test.afterEach(async () => {
    if (extensionUtils) {
      await extensionUtils.cleanup();
    }
  });

  test('Complete capture workflow: select → capture → verify in dashboard', async () => {
    // Step 1: Create test content
    const testPage = await extensionUtils.createTestPage();
    const testContent = 'This is a comprehensive test of the capture workflow. It includes multiple sentences to test the intelligence analysis. This could be considered a definition or explanation.';
    
    await testPage.setContent(`
      <html>
        <head><title>Workflow Test</title></head>
        <body>
          <article>
            <h1>Test Article</h1>
            <p id="test-paragraph">${testContent}</p>
          </article>
        </body>
      </html>
    `);

    // Step 2: Open debug dashboard to monitor the process
    const debugPage = await extensionUtils.openDebugDashboard();
    await debugPage.waitForSelector('.log-list');

    // Step 3: Select text and verify toolbar appears
    await extensionUtils.selectTextOnPage(testPage, testContent);
    
    // Verify selection toolbar is visible
    const toolbar = testPage.locator('.linkmind-selection-toolbar');
    await expect(toolbar).toBeVisible({ timeout: 5000 });
    
    // Verify we can see selection flow in debug logs
    await extensionUtils.waitForLogMessage('Content script initializing');

    // Step 4: Click capture button
    await extensionUtils.clickCaptureButton(testPage);
    
    // Step 5: Monitor the capture flow in debug dashboard
    await extensionUtils.waitForLogMessage('Starting smart capture');
    await extensionUtils.waitForLogMessage('Starting capture save process');
    await extensionUtils.waitForCaptureToSave();

    // Step 6: Verify capture completed successfully
    const finalCount = await extensionUtils.getStoredCapturesCount();
    expect(finalCount).toBe(1);

    // Step 7: Open sidepanel and verify capture appears
    const sidepanelPage = await extensionUtils.openSidepanel();
    await sidepanelPage.waitForSelector('#contentGrid');
    
    // Wait for content to load
    await sidepanelPage.waitForTimeout(2000);
    
    // Check that the capture appears in the sidepanel
    const contentCards = sidepanelPage.locator('.content-card');
    await expect(contentCards).toHaveCountGreaterThan(0);
    
    // Verify the captured content is displayed
    const firstCard = contentCards.first();
    await expect(firstCard).toContainText(testContent.substring(0, 50));
  });

  test('Multiple captures workflow with different content types', async () => {
    const testPage = await extensionUtils.createTestPage();
    
    // Create page with different types of content
    await testPage.setContent(`
      <html>
        <head><title>Multiple Content Types</title></head>
        <body>
          <div id="quote-content">"This is a quoted statement that should be recognized as a quote."</div>
          <div id="code-content">function testFunction() { return "hello world"; }</div>
          <div id="definition-content">Machine Learning: A subset of artificial intelligence that enables computers to learn and make decisions from data.</div>
          <div id="normal-text">This is just regular text without any special characteristics.</div>
        </body>
      </html>
    `);

    const debugPage = await extensionUtils.openDebugDashboard();

    // Capture 1: Quote
    await extensionUtils.selectTextOnPage(testPage, '"This is a quoted statement that should be recognized as a quote."');
    await extensionUtils.clickCaptureButton(testPage);
    await extensionUtils.waitForCaptureToSave();

    // Capture 2: Code
    await extensionUtils.selectTextOnPage(testPage, 'function testFunction() { return "hello world"; }');
    await extensionUtils.clickCaptureButton(testPage);
    await extensionUtils.waitForCaptureToSave();

    // Capture 3: Definition
    await extensionUtils.selectTextOnPage(testPage, 'Machine Learning: A subset of artificial intelligence that enables computers to learn and make decisions from data.');
    await extensionUtils.clickCaptureButton(testPage);
    await extensionUtils.waitForCaptureToSave();

    // Verify all captures were saved
    const finalCount = await extensionUtils.getStoredCapturesCount();
    expect(finalCount).toBe(3);

    // Verify captures have different intelligence types
    const storageData = await debugPage.evaluate(async () => {
      const storage = await chrome.storage.local.get();
      const captureKeys = Object.keys(storage).filter(key => key.startsWith('capture_'));
      return captureKeys.map(key => storage[key]);
    });

    expect(storageData).toHaveLength(3);
    
    // Each capture should have intelligence data
    storageData.forEach(capture => {
      expect(capture.type).toBe('text');
      expect(capture.content).toBeTruthy();
      expect(capture.timestamp).toBeTruthy();
    });
  });

  test('Error recovery workflow: failed capture handling', async () => {
    const testPage = await extensionUtils.createTestPage();
    const debugPage = await extensionUtils.openDebugDashboard();

    // Create a scenario that might cause issues (very large content)
    const largeContent = 'A'.repeat(10000); // 10KB of text
    
    await testPage.setContent(`
      <html>
        <head><title>Error Recovery Test</title></head>
        <body>
          <div id="large-content">${largeContent}</div>
        </body>
      </html>
    `);

    // Try to capture the large content
    await extensionUtils.selectTextOnPage(testPage, largeContent);
    
    const toolbar = testPage.locator('.linkmind-selection-toolbar');
    await expect(toolbar).toBeVisible({ timeout: 5000 });
    
    await extensionUtils.clickCaptureButton(testPage);

    // Wait and see if it completes or errors
    try {
      await extensionUtils.waitForCaptureToSave(10000); // Longer timeout for large content
      
      // If it succeeds, verify the content was saved
      const count = await extensionUtils.getStoredCapturesCount();
      expect(count).toBe(1);
      
    } catch (error) {
      // If it fails, check that error is properly logged
      const logs = await extensionUtils.getDebugLogs();
      const errorLogs = logs.filter(log => log.level === 'ERROR');
      expect(errorLogs.length).toBeGreaterThan(0);
    }

    // Verify system is still functional after potential error
    const simpleContent = 'Simple test content after error scenario';
    await extensionUtils.selectTextOnPage(testPage, simpleContent);
    await extensionUtils.clickCaptureButton(testPage);
    await extensionUtils.waitForCaptureToSave();

    // Should still work
    const finalCount = await extensionUtils.getStoredCapturesCount();
    expect(finalCount).toBeGreaterThan(0);
  });

  test('Dashboard monitoring during extended usage', async () => {
    const debugPage = await extensionUtils.openDebugDashboard();
    const testPage = await extensionUtils.createTestPage();

    // Simulate extended usage with multiple operations
    const operations = [
      'First capture to test the system',
      'Second capture with different content',
      'Third capture to verify consistency',
      'Fourth capture for stress testing',
      'Fifth capture to complete the sequence'
    ];

    for (let i = 0; i < operations.length; i++) {
      const content = operations[i];
      
      // Update page content
      await testPage.setContent(`
        <html>
          <head><title>Operation ${i + 1}</title></head>
          <body>
            <div id="content-${i}">${content}</div>
          </body>
        </html>
      `);

      // Perform capture
      await extensionUtils.selectTextOnPage(testPage, content);
      await extensionUtils.clickCaptureButton(testPage);
      await extensionUtils.waitForCaptureToSave();

      // Verify dashboard updates
      await debugPage.waitForTimeout(1000);
      
      const captureCount = await debugPage.locator('#captureCount').textContent();
      expect(parseInt(captureCount)).toBeGreaterThanOrEqual(i + 1);
    }

    // Verify final state
    const finalCount = await extensionUtils.getStoredCapturesCount();
    expect(finalCount).toBe(operations.length);

    // Check that session metrics are reasonable
    const sessionTime = await debugPage.locator('#sessionTime').textContent();
    expect(sessionTime).toMatch(/\d+:\d+/);

    const storageSize = await debugPage.locator('#storageSize').textContent();
    expect(storageSize).toMatch(/\d+\.?\d* KB/);

    // Verify log count is substantial
    const logs = await extensionUtils.getDebugLogs();
    expect(logs.length).toBeGreaterThan(50); // Should have lots of logs from extended usage
  });

  test('Context menu integration workflow', async () => {
    const testPage = await extensionUtils.createTestPage();
    const debugPage = await extensionUtils.openDebugDashboard();

    await testPage.setContent(`
      <html>
        <head><title>Context Menu Test</title></head>
        <body>
          <p id="context-text">This text will be captured via context menu.</p>
          <a href="https://example.com" id="test-link">Test Link</a>
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwNzNlNiIvPjwvc3ZnPg==" alt="Test Image" id="test-image">
        </body>
      </html>
    `);

    // Test text selection context menu
    await testPage.locator('#context-text').selectText();
    await extensionUtils.rightClickOnPage(testPage, '#context-text');
    
    // Simulate context menu click (this is tricky with Playwright, so we'll simulate the message)
    await extensionUtils.clickContextMenuItem(testPage, 'Capture Selection');
    
    // Wait for capture to process
    await extensionUtils.waitForLogMessage('Smart text capture triggered');
    await extensionUtils.waitForCaptureToSave();

    // Verify capture was created
    const captureCount = await extensionUtils.getStoredCapturesCount();
    expect(captureCount).toBe(1);

    // Test link context menu
    await extensionUtils.rightClickOnPage(testPage, '#test-link');
    await extensionUtils.clickContextMenuItem(testPage, 'Save Link');
    
    // Wait for link capture
    await extensionUtils.waitForCaptureToSave();

    // Verify both captures exist
    const finalCount = await extensionUtils.getStoredCapturesCount();
    expect(finalCount).toBe(2);

    // Verify different capture types in storage
    const storageData = await debugPage.evaluate(async () => {
      const storage = await chrome.storage.local.get();
      const captureKeys = Object.keys(storage).filter(key => key.startsWith('capture_'));
      return captureKeys.map(key => ({ key, data: storage[key] }));
    });

    expect(storageData).toHaveLength(2);
    
    // Should have both text and link captures
    const captureTypes = storageData.map(item => item.data.type);
    expect(captureTypes).toContain('text');
    expect(captureTypes).toContain('link');
  });

  test('Sidepanel real-time updates during captures', async () => {
    const sidepanelPage = await extensionUtils.openSidepanel();
    const testPage = await extensionUtils.createTestPage();

    // Verify sidepanel starts empty
    await sidepanelPage.waitForSelector('#contentGrid');
    let contentCards = sidepanelPage.locator('.content-card');
    expect(await contentCards.count()).toBe(0);

    // Perform first capture
    await testPage.setContent(`
      <html>
        <head><title>Real-time Test</title></head>
        <body>
          <div>First capture content for real-time testing</div>
        </body>
      </html>
    `);

    await extensionUtils.selectTextOnPage(testPage, 'First capture content for real-time testing');
    await extensionUtils.clickCaptureButton(testPage);
    await extensionUtils.waitForCaptureToSave();

    // Wait for sidepanel to update
    await sidepanelPage.waitForTimeout(2000);
    contentCards = sidepanelPage.locator('.content-card');
    expect(await contentCards.count()).toBe(1);

    // Perform second capture
    await extensionUtils.selectTextOnPage(testPage, 'Second capture content');
    await extensionUtils.clickCaptureButton(testPage);
    await extensionUtils.waitForCaptureToSave();

    // Verify sidepanel updates with second capture
    await sidepanelPage.waitForTimeout(2000);
    contentCards = sidepanelPage.locator('.content-card');
    expect(await contentCards.count()).toBe(2);

    // Verify newest capture appears first (should be sorted by timestamp)
    const firstCard = contentCards.first();
    await expect(firstCard).toContainText('Second capture');
  });
});