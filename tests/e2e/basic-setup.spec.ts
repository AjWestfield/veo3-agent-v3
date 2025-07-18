import { test, expect } from '@playwright/test';

test.describe('Basic Setup Verification', () => {
  test('App should load successfully', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'tests/screenshots/app-loaded.png' });
    
    // Check for basic elements
    const possibleSelectors = [
      'textarea[placeholder*="Message"]',
      'input[placeholder*="Message"]',
      'textarea[placeholder*="message"]',
      'input[placeholder*="message"]',
      '[data-testid="chat-input"]',
      '.chat-input',
      'textarea',
      'input[type="text"]'
    ];
    
    let inputFound = false;
    for (const selector of possibleSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        inputFound = true;
        console.log(`✅ Found input element with selector: ${selector}`);
        break;
      }
    }
    
    expect(inputFound).toBeTruthy();
    console.log('✅ App loaded successfully');
  });
  
  test('API endpoint should be accessible', async ({ request }) => {
    // Test if the API endpoint exists
    const response = await request.post('/api/download-social-video', {
      data: {
        url: 'https://invalid-url-for-testing.com'
      }
    });
    
    // We expect an error, but the endpoint should exist
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500); // Not a server error
    
    const data = await response.json();
    expect(data).toHaveProperty('error');
    
    console.log('✅ API endpoint is accessible');
  });
});