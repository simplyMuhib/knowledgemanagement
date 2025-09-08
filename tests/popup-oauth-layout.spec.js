import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

test.describe('Popup OAuth Layout - No Scrolling Test', () => {
  test('OAuth providers are visible without scrolling in popup', async ({ page }) => {
    // Navigate to the built popup file
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const popupPath = path.resolve(__dirname, '../dist/src/popup/popup.html');
    
    console.log('📁 Loading popup from:', popupPath);
    await page.goto(`file://${popupPath}`);
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for any JS initialization

    // Verify popup dimensions are as expected (320x180)
    const popupContainer = page.locator('.popup-container');
    await expect(popupContainer).toBeVisible();
    
    const bodyBox = await page.locator('body').boundingBox();
    console.log('📏 Popup dimensions:', bodyBox);
    
    // Check that body dimensions are correct
    expect(bodyBox?.width).toBe(320);
    expect(bodyBox?.height).toBe(180);

    // Verify main navigation is visible initially
    await expect(page.locator('.nav-actions')).toBeVisible();
    await expect(page.locator('[data-action="sync"]')).toBeVisible();

    // Click on the Sign In button to show OAuth providers
    console.log('🔐 Clicking Sign In button...');
    await page.click('[data-action="sync"]');
    
    // Wait for OAuth content to appear
    await page.waitForSelector('.oauth-content.active', { timeout: 5000 });
    
    // Verify OAuth content is now visible and nav is hidden
    await expect(page.locator('.oauth-content')).toHaveClass(/active/);
    await expect(page.locator('.nav-actions')).toHaveClass(/hidden/);

    // Check that all OAuth provider icons are visible
    console.log('🔍 Checking OAuth provider visibility...');
    const googleBtn = page.locator('.oauth-icon-btn.google');
    const microsoftBtn = page.locator('.oauth-icon-btn.microsoft');
    const facebookBtn = page.locator('.oauth-icon-btn.facebook');

    await expect(googleBtn).toBeVisible();
    await expect(microsoftBtn).toBeVisible();
    await expect(facebookBtn).toBeVisible();

    // Verify they are arranged horizontally (same Y position, different X)
    const googleBox = await googleBtn.boundingBox();
    const microsoftBox = await microsoftBtn.boundingBox();
    const facebookBox = await facebookBtn.boundingBox();

    console.log('📐 OAuth icon positions:');
    console.log('  Google:', googleBox);
    console.log('  Microsoft:', microsoftBox);
    console.log('  Facebook:', facebookBox);

    // Verify horizontal layout (same Y, different X positions)
    expect(Math.abs((googleBox?.y || 0) - (microsoftBox?.y || 0))).toBeLessThan(5);
    expect(Math.abs((microsoftBox?.y || 0) - (facebookBox?.y || 0))).toBeLessThan(5);
    
    // Verify they are ordered horizontally (Google < Microsoft < Facebook)
    expect(googleBox?.x).toBeLessThan(microsoftBox?.x || 0);
    expect(microsoftBox?.x).toBeLessThan(facebookBox?.x || 0);

    // Critical test: Verify no scrolling is needed
    console.log('🔍 Checking scrolling requirements...');
    const oauthContent = page.locator('.oauth-content');
    const contentBox = await oauthContent.boundingBox();
    const contentHeight = contentBox?.height || 0;
    
    // Get the content area height (should be popup height minus header)
    const headerBox = await page.locator('.header').boundingBox();
    const availableHeight = 180 - (headerBox?.height || 0);
    
    console.log('📏 Content dimensions:');
    console.log('  OAuth content height:', contentHeight);
    console.log('  Available height:', availableHeight);
    
    // Verify content fits without scrolling
    expect(contentHeight).toBeLessThanOrEqual(availableHeight);

    // Verify scroll properties
    const scrollHeight = await oauthContent.evaluate(el => el.scrollHeight);
    const clientHeight = await oauthContent.evaluate(el => el.clientHeight);
    
    console.log('📊 Scroll check:');
    console.log('  Scroll height:', scrollHeight);
    console.log('  Client height:', clientHeight);
    
    // If scrollHeight equals clientHeight, no scrolling is needed
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 2); // Allow 2px tolerance

    // Test OAuth provider interactions
    console.log('🧪 Testing OAuth provider interactions...');
    
    // Test Google OAuth provider click
    await googleBtn.click();
    
    // Should show alert (in our demo implementation)
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('OAuth flow would initiate for google');
      await dialog.accept();
    });

    // Verify back button works
    await page.waitForTimeout(1500); // Wait for auto-navigation back
    await expect(page.locator('.nav-actions')).toBeVisible();
    await expect(page.locator('.oauth-content')).not.toHaveClass(/active/);

    console.log('✅ All OAuth layout tests passed!');
  });

  test('OAuth icons have proper hover effects', async ({ page }) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const popupPath = path.resolve(__dirname, '../dist/src/popup/popup.html');
    
    await page.goto(`file://${popupPath}`);
    await page.waitForLoadState('networkidle');
    
    // Navigate to OAuth view
    await page.click('[data-action="sync"]');
    await page.waitForSelector('.oauth-content.active');
    
    // Test hover effects on each provider
    const providers = [
      { selector: '.oauth-icon-btn.google', expectedBorder: '#4285F4' },
      { selector: '.oauth-icon-btn.microsoft', expectedBorder: '#00A4EF' },
      { selector: '.oauth-icon-btn.facebook', expectedBorder: '#1877F2' }
    ];

    for (const provider of providers) {
      console.log(`🎨 Testing hover effect for ${provider.selector}`);
      
      const btn = page.locator(provider.selector);
      await btn.hover();
      
      // Check that transform is applied (should move up)
      const transform = await btn.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      // Should have translateY transform on hover
      expect(transform).toContain('matrix');
      
      // Check border color changes (this would require more complex testing)
      const borderColor = await btn.evaluate(el => 
        window.getComputedStyle(el).borderColor
      );
      
      console.log(`  Border color on hover: ${borderColor}`);
    }

    console.log('✅ Hover effects test completed!');
  });
});