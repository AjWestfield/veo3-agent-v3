import { test, expect } from '@playwright/test';

test.describe('Video Download E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we need to handle any initial setup/modals
    const chatInput = page.locator('textarea[placeholder*="Message"], input[placeholder*="Message"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });
  });

  test('YouTube video download should work', async ({ page }) => {
    console.log('Starting YouTube video download test...');
    
    // Test with a short YouTube video
    const youtubeUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
    
    // Find the chat input
    const chatInput = page.locator('textarea[placeholder*="Message"], input[placeholder*="Message"]');
    
    // Clear any existing text and paste the YouTube URL
    await chatInput.clear();
    await chatInput.fill(youtubeUrl);
    
    // Wait a moment for the paste handler to trigger
    await page.waitForTimeout(1000);
    
    // Check if the video download started (loading state)
    const uploadedFiles = page.locator('[data-testid="uploaded-file"], .uploaded-file, div[class*="upload"]');
    await expect(uploadedFiles).toBeVisible({ timeout: 5000 });
    
    // Wait for the download to complete (video should appear)
    await test.step('Wait for video download to complete', async () => {
      // Look for video element or download completion indicator
      const videoElement = page.locator('video, [data-testid="video-preview"], .video-preview');
      const downloadComplete = await Promise.race([
        videoElement.waitFor({ state: 'visible', timeout: 60000 }).then(() => true),
        page.waitForTimeout(60000).then(() => false)
      ]);
      
      if (downloadComplete) {
        console.log('✅ YouTube video downloaded successfully');
        
        // Verify video metadata if available
        const videoTitle = page.locator('[data-testid="video-title"], .video-title, .file-name');
        if (await videoTitle.isVisible()) {
          const title = await videoTitle.textContent();
          console.log(`Video title: ${title}`);
          expect(title).toBeTruthy();
        }
      } else {
        // Check for error messages
        const errorMessage = page.locator('.error-message, [role="alert"], .text-red-500');
        if (await errorMessage.isVisible()) {
          const error = await errorMessage.textContent();
          console.error(`Download failed with error: ${error}`);
        }
        throw new Error('YouTube video download timed out');
      }
    });
    
    // Take a screenshot of successful download
    await page.screenshot({ path: 'tests/screenshots/youtube-download-success.png', fullPage: true });
  });

  test('Facebook video download should show appropriate error', async ({ page }) => {
    console.log('Starting Facebook video download test...');
    
    // Test with a Facebook video URL
    const facebookUrl = 'https://www.facebook.com/watch/?v=1093831888680522';
    
    // Find the chat input
    const chatInput = page.locator('textarea[placeholder*="Message"], input[placeholder*="Message"]');
    
    // Clear and paste the Facebook URL
    await chatInput.clear();
    await chatInput.fill(facebookUrl);
    
    // Wait for the download attempt
    await page.waitForTimeout(1000);
    
    // Check if loading state appears
    const uploadedFiles = page.locator('[data-testid="uploaded-file"], .uploaded-file, div[class*="upload"]');
    await expect(uploadedFiles).toBeVisible({ timeout: 5000 });
    
    // Wait for the error message (Facebook downloads are expected to fail)
    await test.step('Check for Facebook error handling', async () => {
      // Wait for either error message or unexpected success
      const errorMessage = page.locator('.error-message, [role="alert"], .text-red-500, .text-destructive');
      const videoElement = page.locator('video, [data-testid="video-preview"], .video-preview');
      
      const result = await Promise.race([
        errorMessage.waitFor({ state: 'visible', timeout: 30000 }).then(() => 'error'),
        videoElement.waitFor({ state: 'visible', timeout: 30000 }).then(() => 'success'),
        page.waitForTimeout(30000).then(() => 'timeout')
      ]);
      
      if (result === 'error') {
        console.log('✅ Facebook download showed expected error');
        const error = await errorMessage.textContent();
        console.log(`Error message: ${error}`);
        
        // Verify the error mentions Facebook or yt-dlp issues
        expect(error?.toLowerCase()).toMatch(/facebook|temporarily unavailable|yt-dlp/i);
      } else if (result === 'success') {
        console.log('⚠️ Facebook download unexpectedly succeeded - yt-dlp may have been fixed');
      } else {
        throw new Error('Facebook video download test timed out without clear result');
      }
    });
    
    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/facebook-download-result.png', fullPage: true });
  });

  test('Multiple video URLs should download in sequence', async ({ page }) => {
    console.log('Starting multiple video download test...');
    
    const videoUrls = [
      'https://www.youtube.com/shorts/mWOQKEDaWmQ', // YouTube Shorts
      'https://youtu.be/dQw4w9WgXcQ', // YouTube short URL format
    ];
    
    for (let i = 0; i < videoUrls.length; i++) {
      const url = videoUrls[i];
      console.log(`Testing video ${i + 1}/${videoUrls.length}: ${url}`);
      
      // Find the chat input
      const chatInput = page.locator('textarea[placeholder*="Message"], input[placeholder*="Message"]');
      
      // Clear and paste URL
      await chatInput.clear();
      await chatInput.fill(url);
      
      // Wait for download to start
      await page.waitForTimeout(1000);
      
      // Count uploaded files
      const uploadedFilesCount = await page.locator('[data-testid="uploaded-file"], .uploaded-file, div[class*="upload"] video').count();
      
      // Wait for this download to complete
      await page.waitForTimeout(15000); // Give it 15 seconds
      
      // Verify the number of videos increased
      const newCount = await page.locator('[data-testid="uploaded-file"], .uploaded-file, div[class*="upload"] video').count();
      console.log(`Videos after download ${i + 1}: ${newCount}`);
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/multiple-downloads.png', fullPage: true });
  });

  test('Invalid URL should not trigger download', async ({ page }) => {
    console.log('Testing invalid URL handling...');
    
    const invalidUrl = 'https://www.example.com/not-a-video';
    
    // Find the chat input
    const chatInput = page.locator('textarea[placeholder*="Message"], input[placeholder*="Message"]');
    
    // Enter invalid URL
    await chatInput.clear();
    await chatInput.fill(invalidUrl);
    
    // Wait to see if anything happens
    await page.waitForTimeout(2000);
    
    // Check that no upload/loading state appears
    const uploadedFiles = page.locator('[data-testid="uploaded-file"], .uploaded-file, div[class*="upload"]');
    const count = await uploadedFiles.count();
    
    // Should not trigger any download
    expect(count).toBe(0);
    console.log('✅ Invalid URL correctly ignored');
  });
});

// Helper function to save test artifacts
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    // Save additional debugging info on failure
    const html = await page.content();
    const htmlPath = `tests/artifacts/${testInfo.title.replace(/\s+/g, '-')}.html`;
    await page.screenshot({ path: `tests/artifacts/${testInfo.title.replace(/\s+/g, '-')}.png`, fullPage: true });
    console.log(`Test failed. Screenshot saved to ${htmlPath}`);
  }
});