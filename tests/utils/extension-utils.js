// Chrome Extension Testing Utilities for Playwright
import { chromium } from '@playwright/test';

class ExtensionTestUtils {
  constructor() {
    this.context = null;
    this.extensionId = null;
    this.pages = new Map();
  }

  /**
   * Launch Chrome with extension loaded
   */
  async launchWithExtension() {
    this.context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        '--disable-extensions-except=./dist',
        '--load-extension=./dist',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--allow-file-access-from-files',
        '--disable-web-security'
      ]
    });

    // Wait for extension to load and get extension ID
    await this.getExtensionId();
    
    return this.context;
  }

  /**
   * Get the extension ID dynamically
   */
  async getExtensionId() {
    // Try to get extension ID from the background page
    try {
      const targets = await this.context.backgroundPages();
      for (const backgroundPage of targets) {
        const url = backgroundPage.url();
        if (url.includes('chrome-extension://')) {
          this.extensionId = url.split('chrome-extension://')[1].split('/')[0];
          console.log(`Found LinkMind extension with ID: ${this.extensionId}`);
          return this.extensionId;
        }
      }
    } catch (error) {
      console.log('Could not get extension ID from background pages');
    }

    // Fallback: try accessing a test page to get extension ID from content script
    try {
      const testPage = await this.context.newPage();
      await testPage.goto('data:text/html,<html><body><h1>Test</h1></body></html>');
      
      // Wait a bit for content script to load
      await testPage.waitForTimeout(1000);
      
      // Try to get the extension ID from the content script
      this.extensionId = await testPage.evaluate(() => {
        return new Promise((resolve) => {
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
            resolve(chrome.runtime.id);
          } else {
            // Try to find it in any injected scripts
            const scripts = Array.from(document.querySelectorAll('script'));
            for (const script of scripts) {
              if (script.src && script.src.includes('chrome-extension://')) {
                const id = script.src.split('chrome-extension://')[1].split('/')[0];
                resolve(id);
                return;
              }
            }
            resolve(null);
          }
        });
      });
      
      await testPage.close();
      
      if (this.extensionId) {
        console.log(`Found LinkMind extension with ID: ${this.extensionId}`);
        return this.extensionId;
      }
      
    } catch (error) {
      console.log('Could not get extension ID from content script');
    }

    // If all else fails, use a known pattern or throw error
    throw new Error('LinkMind extension ID not found. Make sure it\'s built and loaded correctly.');
  }

  /**
   * Open extension popup
   */
  async openPopup() {
    if (!this.extensionId) {
      throw new Error('Extension ID not found. Run launchWithExtension() first.');
    }

    const popupPage = await this.context.newPage();
    await popupPage.goto(`chrome-extension://${this.extensionId}/src/popup/popup.html`);
    
    this.pages.set('popup', popupPage);
    return popupPage;
  }

  /**
   * Open extension sidepanel
   */
  async openSidepanel() {
    if (!this.extensionId) {
      throw new Error('Extension ID not found. Run launchWithExtension() first.');
    }

    const sidepanelPage = await this.context.newPage();
    await sidepanelPage.goto(`chrome-extension://${this.extensionId}/src/sidepanel/sidepanel.html`);
    
    this.pages.set('sidepanel', sidepanelPage);
    return sidepanelPage;
  }

  /**
   * Open debug dashboard
   */
  async openDebugDashboard() {
    if (!this.extensionId) {
      throw new Error('Extension ID not found. Run launchWithExtension() first.');
    }

    const debugPage = await this.context.newPage();
    await debugPage.goto(`chrome-extension://${this.extensionId}/src/debug/debug.html`);
    
    this.pages.set('debug', debugPage);
    return debugPage;
  }

  /**
   * Create a test web page
   */
  async createTestPage(url = 'about:blank') {
    const page = await this.context.newPage();
    if (url !== 'about:blank') {
      await page.goto(url);
    }
    
    this.pages.set('test', page);
    return page;
  }

  /**
   * Wait for extension to be ready
   */
  async waitForExtensionReady() {
    const page = await this.createTestPage();
    
    // Check if content script is injected
    await page.addScriptTag({ content: `
      window.extensionReady = new Promise((resolve) => {
        const checkReady = () => {
          if (window.logger || document.querySelector('script[src*="debug-logger.js"]')) {
            resolve(true);
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
    `});

    await page.evaluate(() => window.extensionReady);
    await page.close();
  }

  /**
   * Simulate text selection on a page
   */
  async selectTextOnPage(page, text) {
    await page.evaluate((textToSelect) => {
      // Create a text node with the specified text
      const textNode = document.createTextNode(textToSelect);
      const div = document.createElement('div');
      div.appendChild(textNode);
      document.body.appendChild(div);
      
      // Select the text
      const range = document.createRange();
      range.selectNodeContents(div);
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger selection change event
      document.dispatchEvent(new Event('selectionchange'));
    }, text);

    // Wait for selection toolbar to appear
    await page.waitForTimeout(500);
  }

  /**
   * Wait for selection toolbar to appear
   */
  async waitForSelectionToolbar(page) {
    return await page.waitForSelector('.linkmind-selection-toolbar', { timeout: 5000 });
  }

  /**
   * Click capture button in selection toolbar
   */
  async clickCaptureButton(page) {
    const toolbar = await this.waitForSelectionToolbar(page);
    const captureBtn = toolbar.locator('[data-action="capture"]');
    await captureBtn.click();
  }

  /**
   * Wait for capture to be saved
   */
  async waitForCaptureToSave(timeout = 5000) {
    const debugPage = this.pages.get('debug') || await this.openDebugDashboard();
    
    // Wait for capture save log entry
    await debugPage.waitForFunction(() => {
      const logEntries = document.querySelectorAll('.log-entry');
      for (let entry of logEntries) {
        if (entry.textContent.includes('Capture saved and verified')) {
          return true;
        }
      }
      return false;
    }, { timeout });
  }

  /**
   * Get stored captures count
   */
  async getStoredCapturesCount() {
    const debugPage = this.pages.get('debug') || await this.openDebugDashboard();
    
    return await debugPage.evaluate(async () => {
      const storage = await chrome.storage.local.get();
      const captureKeys = Object.keys(storage).filter(key => key.startsWith('capture_'));
      return captureKeys.length;
    });
  }

  /**
   * Clear all stored captures
   */
  async clearStoredCaptures() {
    const debugPage = this.pages.get('debug') || await this.openDebugDashboard();
    
    await debugPage.evaluate(async () => {
      const storage = await chrome.storage.local.get();
      const captureKeys = Object.keys(storage).filter(key => key.startsWith('capture_'));
      
      const toRemove = {};
      captureKeys.forEach(key => toRemove[key] = undefined);
      
      await chrome.storage.local.remove(captureKeys);
    });
  }

  /**
   * Get debug logs
   */
  async getDebugLogs() {
    const debugPage = this.pages.get('debug') || await this.openDebugDashboard();
    
    return await debugPage.evaluate(async () => {
      const { debug_logs = [] } = await chrome.storage.local.get('debug_logs');
      return debug_logs;
    });
  }

  /**
   * Wait for specific log message
   */
  async waitForLogMessage(messagePattern, timeout = 5000) {
    const debugPage = this.pages.get('debug') || await this.openDebugDashboard();
    
    await debugPage.waitForFunction((pattern) => {
      const logEntries = document.querySelectorAll('.log-entry .log-message');
      for (let entry of logEntries) {
        if (entry.textContent.match(new RegExp(pattern))) {
          return true;
        }
      }
      return false;
    }, messagePattern, { timeout });
  }

  /**
   * Take screenshot for debugging
   */
  async takeDebugScreenshot(name) {
    const page = this.pages.get('test');
    if (page) {
      await page.screenshot({ path: `test-results/debug-${name}-${Date.now()}.png` });
    }
  }

  /**
   * Right-click to open context menu
   */
  async rightClickOnPage(page, selector = 'body') {
    await page.click(selector, { button: 'right' });
    await page.waitForTimeout(500); // Wait for context menu to appear
  }

  /**
   * Click context menu item
   */
  async clickContextMenuItem(page, menuText) {
    // Context menus are in the browser's UI, which is harder to access
    // For now, we'll simulate the direct call to the context menu handler
    await page.evaluate((text) => {
      // This simulates what happens when a context menu item is clicked
      chrome.runtime.sendMessage({
        type: 'CONTEXT_MENU_CLICKED',
        menuItemId: text.toLowerCase().replace(/\s+/g, '-'),
        selectionText: window.getSelection().toString()
      });
    }, menuText);
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.context) {
      await this.context.close();
    }
    this.pages.clear();
  }
}

export { ExtensionTestUtils };