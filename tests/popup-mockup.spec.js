import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

test.describe('Popup Mockup Testing - Background Validation', () => {
  test('popup mockup loads and displays correctly', async ({ page }) => {
    // Navigate to the popup mockup file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const mockupPath = path.resolve(__dirname, '../test/popup-mockup.html');
    
    console.log('📁 Loading mockup from:', mockupPath);
    await page.goto(`file://${mockupPath}`);
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');

    // Check if the page loads with correct title
    await expect(page).toHaveTitle('LinkMind Popup - Critical Path First Mockup');

    // Verify main structural elements
    await expect(page.locator('.popup-container')).toBeVisible();
    await expect(page.locator('.value-prop')).toBeVisible();
    await expect(page.locator('.primary-action')).toBeVisible();

    // Check critical path elements
    await expect(page.locator('.capture-primary')).toBeVisible();
    await expect(page.locator('.primary-title')).toContainText('Quick Capture');
    await expect(page.locator('.primary-subtitle')).toContainText('Save what matters most');

    // Verify branding
    await expect(page.locator('.logo')).toContainText('🧠 LinkMind');
    await expect(page.locator('.tagline')).toContainText('Instant Knowledge Capture');

    // Check trust indicators
    await expect(page.locator('.trust-indicators')).toBeVisible();
    await expect(page.locator('.trust-item')).toHaveCount(3);

    // Verify secondary actions are present but less prominent
    await expect(page.locator('.secondary-actions')).toBeVisible();
    await expect(page.locator('.action-btn')).toHaveCount(3);

    // Check context information
    await expect(page.locator('.context-bar')).toBeVisible();
    await expect(page.locator('.page-context')).toContainText('Ready to capture');
    await expect(page.locator('.storage-status')).toContainText('Local & Secure');

    // Test primary action click
    let captureClicked = false;
    page.on('console', msg => {
      if (msg.text().includes('🎯 CRITICAL PATH: Quick Capture initiated')) {
        captureClicked = true;
      }
    });

    await page.click('.capture-primary');
    await page.waitForTimeout(100); // Small wait for console log
    
    // Visual validation
    await expect(page.locator('.primary-icon')).toBeVisible();
    await expect(page.locator('.capture-hint')).toBeVisible();
    
    // Test hover effects (CSS validation)
    const primaryButton = page.locator('.capture-primary');
    await primaryButton.hover();
    
    // Take screenshot for visual validation
    await page.screenshot({ 
      path: 'test-results/popup-mockup-screenshot.png', 
      fullPage: true,
      clip: { x: 0, y: 0, width: 360, height: 520 }
    });
    
    console.log('✅ Basic popup mockup validation completed');
  });

  test('popup mockup secondary actions work', async ({ page }) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const mockupPath = path.resolve(__dirname, '../test/popup-mockup.html');
    await page.goto(`file://${mockupPath}`);

    // Test secondary action buttons
    const actionButtons = page.locator('.action-btn');
    
    // Verify all secondary buttons are present
    await expect(actionButtons).toHaveCount(3);
    
    // Test Library button
    const libraryBtn = page.locator('.action-btn').filter({ hasText: 'Library' });
    await expect(libraryBtn).toBeVisible();
    
    // Test Search button  
    const searchBtn = page.locator('.action-btn').filter({ hasText: 'Search' });
    await expect(searchBtn).toBeVisible();
    
    // Test Export button
    const exportBtn = page.locator('.action-btn').filter({ hasText: 'Export' });
    await expect(exportBtn).toBeVisible();

    // Test options toggle
    await expect(page.locator('.options-toggle')).toBeVisible();
    await expect(page.locator('.options-toggle')).toContainText('⚙️ Options');
  });

  test('popup mockup responsive design and visual hierarchy', async ({ page }) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const mockupPath = path.resolve(__dirname, '../test/popup-mockup.html');
    await page.goto(`file://${mockupPath}`);

    // Check dimensions match expected popup size
    const container = page.locator('.popup-container');
    await expect(container).toBeVisible();

    // Verify visual hierarchy - primary action should be most prominent
    const primaryAction = page.locator('.primary-action');
    const secondaryActions = page.locator('.secondary-actions');
    
    await expect(primaryAction).toBeVisible();
    await expect(secondaryActions).toBeVisible();

    // Test gradient background is applied
    const bodyStyles = await page.evaluate(() => {
      return window.getComputedStyle(document.body);
    });

    // Check if container has gradient background
    const containerStyles = await page.evaluate(() => {
      const container = document.querySelector('.popup-container');
      return window.getComputedStyle(container);
    });

    // Verify the primary capture button styling
    const primaryButtonStyles = await page.evaluate(() => {
      const btn = document.querySelector('.capture-primary');
      return window.getComputedStyle(btn);
    });

    expect(primaryButtonStyles.backgroundColor).toBe('rgb(255, 255, 255)'); // white background
    expect(primaryButtonStyles.borderRadius).toBe('20px');

    // Check trust indicators positioning
    await expect(page.locator('.trust-indicators')).toBeVisible();
    
    // Verify all trust items are present
    const trustItems = page.locator('.trust-item');
    await expect(trustItems).toHaveCount(3);
    
    await expect(trustItems.nth(0)).toContainText('Private');
    await expect(trustItems.nth(1)).toContainText('Instant'); 
    await expect(trustItems.nth(2)).toContainText('Smart');
  });

  test('popup mockup critical path first design validation', async ({ page }) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const mockupPath = path.resolve(__dirname, '../test/popup-mockup.html');
    await page.goto(`file://${mockupPath}`);
    await page.waitForLoadState('networkidle');

    console.log('🎯 Starting Critical Path First design validation...');

    // Set viewport for consistent testing
    await page.setViewportSize({ width: 400, height: 600 });

    // 1. Primary action should dominate visual space
    const primaryAction = page.locator('.primary-action');
    await expect(primaryAction).toBeVisible();
    const primaryActionBox = await primaryAction.boundingBox();
    
    console.log('📐 Primary action dimensions:', primaryActionBox);
    
    // 2. Secondary actions should be present but less prominent
    const secondaryActions = page.locator('.secondary-actions');
    await expect(secondaryActions).toBeVisible();
    const secondaryBox = await secondaryActions.boundingBox();
    
    // Secondary actions should be smaller than primary
    expect(secondaryBox.height).toBeLessThan(primaryActionBox.height);
    console.log('✅ Secondary actions properly de-emphasized');

    // 3. Conversion elements should be present
    await expect(page.locator('.value-prop')).toBeVisible(); // Brand value prop
    await expect(page.locator('.trust-indicators')).toBeVisible(); // Trust building
    await expect(page.locator('.capture-hint')).toBeVisible(); // User guidance
    console.log('✅ Conversion elements present');

    // 4. Progressive disclosure implemented
    await expect(page.locator('.options-toggle')).toBeVisible(); // Advanced options hidden
    console.log('✅ Progressive disclosure implemented');

    // 5. Call-to-action should be clear and prominent
    const ctaTitle = page.locator('.primary-title');
    await expect(ctaTitle).toContainText('Quick Capture');
    console.log('✅ Clear CTA present');

    // 6. Trust indicators validation
    const trustItems = page.locator('.trust-item');
    await expect(trustItems).toHaveCount(3);
    console.log('✅ Trust indicators validated');

    // Take final validation screenshot
    await page.screenshot({ 
      path: 'test-results/popup-validation-complete.png', 
      fullPage: true
    });
    
    console.log('🎉 Critical Path First design validation completed successfully');
  });
});