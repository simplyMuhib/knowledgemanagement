#!/usr/bin/env node

// Nuovix Debug System Demo Script
// This script demonstrates the automated debugging capabilities

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

console.log('🎯 Nuovix Automated Debugging System Demo');
console.log('===========================================');

async function demonstrateDebugSystem() {
  let context;
  
  try {
    console.log('\n🚀 Launching Chrome with Nuovix extension...');
    
    // Launch Chrome with extension loaded
    context = await chromium.launchPersistentContext('', {
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

    console.log('✅ Chrome launched with extension loaded');

    // Step 1: Create a test page
    console.log('\n📄 Creating test page...');
    const testPage = await context.newPage();
    await testPage.setContent(`
      <html>
        <head><title>Debug System Demo</title></head>
        <body style="padding: 40px; font-family: Arial, sans-serif;">
          <h1>Nuovix Debug System Demonstration</h1>
          
          <div style="background: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h2>Test Content for Capture</h2>
            <p id="demo-text">This is demonstration text that will be captured to show the automated debugging system in action. The system will track the entire flow from selection to storage.</p>
            
            <blockquote style="border-left: 4px solid #007acc; padding-left: 16px; margin: 20px 0;">
              "This is a quoted statement that should be detected by the intelligence system."
            </blockquote>
            
            <pre style="background: #2d3748; color: #e2e8f0; padding: 16px; border-radius: 4px;"><code>function exampleCode() {
  return "This code snippet should be detected as programming content";
}</code></pre>
            
            <p><strong>Machine Learning Definition:</strong> A subset of artificial intelligence (AI) that enables computers to learn and make decisions from data without being explicitly programmed for every task.</p>
          </div>
          
          <div style="background: #fff5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3>Debug Instructions</h3>
            <ol>
              <li>Select any text above</li>
              <li>Use the selection toolbar to capture</li>
              <li>Monitor the debug dashboard for real-time activity</li>
              <li>Check storage inspector for saved data</li>
            </ol>
          </div>
        </body>
      </html>
    `);
    console.log('✅ Test page created with demo content');

    // Step 2: Wait for content script to initialize
    console.log('\n⏳ Waiting for content script initialization...');
    await testPage.waitForTimeout(3000);

    // Listen for console messages
    const extensionLogs = [];
    testPage.on('console', msg => {
      const text = msg.text();
      if (text.includes('Nuovix') || text.includes('🧠') || text.includes('📄') || text.includes('🎯')) {
        extensionLogs.push(text);
        console.log(`  📝 ${text}`);
      }
    });

    // Step 3: Try to find extension ID and open debug dashboard
    console.log('\n🔍 Looking for extension ID...');
    
    let extensionId = null;
    
    // Try to get from content script
    try {
      extensionId = await testPage.evaluate(() => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
          return chrome.runtime.id;
        }
        // Try to find it in any injected scripts
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          if (script.src && script.src.includes('chrome-extension://')) {
            return script.src.split('chrome-extension://')[1].split('/')[0];
          }
        }
        return null;
      });
    } catch (error) {
      console.log('  ℹ️ Could not get extension ID from content script');
    }

    // Try to get from background pages
    if (!extensionId) {
      try {
        const backgroundPages = await context.backgroundPages();
        for (const bgPage of backgroundPages) {
          const url = bgPage.url();
          if (url.includes('chrome-extension://')) {
            extensionId = url.split('chrome-extension://')[1].split('/')[0];
            break;
          }
        }
      } catch (error) {
        console.log('  ℹ️ Could not get extension ID from background pages');
      }
    }

    if (extensionId) {
      console.log(`✅ Found extension ID: ${extensionId}`);
      
      // Step 4: Open debug dashboard
      console.log('\n🎛️ Opening debug dashboard...');
      const debugPage = await context.newPage();
      await debugPage.goto(`chrome-extension://${extensionId}/src/debug/debug.html`);
      
      // Wait for dashboard to load
      await debugPage.waitForTimeout(3000);
      
      // Check if dashboard loaded
      const dashboardExists = await debugPage.locator('.dashboard').count() > 0;
      
      if (dashboardExists) {
        console.log('✅ Debug dashboard opened successfully');
        
        // Take screenshot of dashboard
        await debugPage.screenshot({ 
          path: 'test-results/debug-dashboard-demo.png', 
          fullPage: true 
        });
        console.log('📸 Dashboard screenshot saved: test-results/debug-dashboard-demo.png');
        
        // Check components
        console.log('\n🔧 Verifying dashboard components...');
        
        const components = [
          { selector: '.status-indicator', name: 'Live monitoring status' },
          { selector: '#logList', name: 'Log list' },
          { selector: '#storageInspector', name: 'Storage inspector' },
          { selector: '#sessionTime', name: 'Session metrics' },
          { selector: '#levelFilters', name: 'Log filters' }
        ];
        
        for (const component of components) {
          const exists = await debugPage.locator(component.selector).count() > 0;
          console.log(`  ${exists ? '✅' : '❌'} ${component.name}`);
        }
        
        // Step 5: Demonstrate real-time logging
        console.log('\n🎯 Demonstrating real-time logging...');
        console.log('📝 Go to the test page and:');
        console.log('   1. Select some text');
        console.log('   2. Watch the debug dashboard for live updates');
        console.log('   3. Check the storage inspector for saved captures');
        
        // Keep the demo running for manual testing
        console.log('\n⏰ Demo running - press Ctrl+C to exit');
        console.log('🌐 Test page: available in browser');
        console.log('🎛️ Debug dashboard: available in browser');
        
        // Wait for user to test manually
        await new Promise(resolve => {
          process.on('SIGINT', () => {
            console.log('\n\n🏁 Demo completed!');
            resolve();
          });
          
          // Also auto-resolve after 5 minutes
          setTimeout(() => {
            console.log('\n\n⏰ Demo timeout reached');
            resolve();
          }, 300000);
        });
        
      } else {
        console.log('❌ Dashboard failed to load');
      }
      
    } else {
      console.log('❌ Could not find extension ID');
      console.log('ℹ️ Make sure the extension is properly loaded in Chrome');
    }

    // Step 6: Show results
    console.log('\n📊 Demo Results:');
    console.log(`📝 Extension logs captured: ${extensionLogs.length}`);
    
    if (extensionLogs.length > 0) {
      console.log('🔍 Recent extension activity:');
      extensionLogs.slice(-5).forEach(log => {
        console.log(`   • ${log}`);
      });
    }

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  } finally {
    if (context) {
      await context.close();
    }
  }
}

// Run the demonstration
demonstrateDebugSystem().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
