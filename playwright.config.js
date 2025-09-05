// Playwright Configuration for LinkMind Extension Testing
import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false, // Chrome extensions need sequential testing
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshots on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Set viewport size */
    viewport: { width: 1280, height: 720 },
    
    /* Ignore HTTPS errors during testing */
    ignoreHTTPSErrors: true,
    
    /* Set a reasonable timeout for actions */
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-extension',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome DevTools Protocol configuration for extension testing
        launchOptions: {
          // Use headless: false for debugging
          headless: false,
          // Extension testing specific flags
          args: [
            '--disable-extensions-except=./dist',
            '--load-extension=./dist',
            '--disable-features=VizDisplayCompositor',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // Allow file:// access for testing
            '--allow-file-access-from-files',
            // Disable web security for testing
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ],
        },
      },
    },

    // Headless mode for CI
    {
      name: 'chromium-extension-headless',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          headless: true,
          args: [
            '--disable-extensions-except=./dist',
            '--load-extension=./dist',
            '--disable-features=VizDisplayCompositor',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--allow-file-access-from-files',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ],
        },
      },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'node build.js && echo "Extension built for testing"',
  //   port: 8080, // Dummy port, we're not actually serving anything
  //   reuseExistingServer: !process.env.CI,
  //   stdout: 'pipe',
  //   stderr: 'pipe',
  // },
  
  // Global test timeout
  timeout: 60 * 1000,
  
  // Expect assertions timeout
  expect: {
    timeout: 10 * 1000,
  },
});