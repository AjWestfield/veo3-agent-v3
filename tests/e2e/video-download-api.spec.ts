import { test, expect } from '@playwright/test';

test.describe('Video Download API Tests', () => {
  const API_ENDPOINT = '/api/download-social-video';
  
  test('YouTube API download should return video data', async ({ request }) => {
    console.log('Testing YouTube API endpoint...');
    
    const response = await request.post(API_ENDPOINT, {
      data: {
        url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Verify response structure
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('video');
    expect(data.video).toHaveProperty('dataUrl');
    expect(data.video).toHaveProperty('filename');
    expect(data.video).toHaveProperty('platform', 'youtube');
    expect(data.video).toHaveProperty('title');
    
    // Verify video data
    expect(data.video.dataUrl).toMatch(/^data:video\/mp4;base64,/);
    expect(data.video.size).toBeGreaterThan(0);
    
    console.log('✅ YouTube API test passed');
    console.log(`Video title: ${data.video.title}`);
    console.log(`Video size: ${(data.video.size / 1024 / 1024).toFixed(2)} MB`);
  });
  
  test('Facebook API download should return appropriate error', async ({ request }) => {
    console.log('Testing Facebook API endpoint...');
    
    const response = await request.post(API_ENDPOINT, {
      data: {
        url: 'https://www.facebook.com/watch/?v=1093831888680522'
      }
    });
    
    // Facebook is expected to fail
    expect(response.status()).toBeGreaterThanOrEqual(400);
    const data = await response.json();
    
    // Verify error response
    expect(data).toHaveProperty('error');
    expect(data.error.toLowerCase()).toContain('facebook');
    
    console.log('✅ Facebook API correctly returned error');
    console.log(`Error: ${data.error}`);
    if (data.solutions) {
      console.log('Suggested solutions:', data.solutions);
    }
  });
  
  test('Invalid URL should return 400 error', async ({ request }) => {
    console.log('Testing invalid URL handling...');
    
    const response = await request.post(API_ENDPOINT, {
      data: {
        url: 'https://www.example.com/not-a-video'
      }
    });
    
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    
    console.log('✅ Invalid URL correctly rejected');
  });
  
  test('Missing URL should return 400 error', async ({ request }) => {
    console.log('Testing missing URL handling...');
    
    const response = await request.post(API_ENDPOINT, {
      data: {}
    });
    
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('URL is required');
    
    console.log('✅ Missing URL correctly rejected');
  });
  
  test('Platform detection should work correctly', async ({ request }) => {
    const testUrls = [
      { url: 'https://youtube.com/watch?v=test', platform: 'youtube' },
      { url: 'https://youtu.be/test', platform: 'youtube' },
      { url: 'https://instagram.com/p/test/', platform: 'instagram' },
      { url: 'https://tiktok.com/@user/video/123', platform: 'tiktok' },
      { url: 'https://twitter.com/user/status/123', platform: 'twitter' },
      { url: 'https://facebook.com/watch/?v=123', platform: 'facebook' }
    ];
    
    console.log('Testing platform detection...');
    
    // We'll test platform detection by checking error messages
    // since most will fail without real video IDs
    for (const testCase of testUrls) {
      const response = await request.post(API_ENDPOINT, {
        data: { url: testCase.url }
      });
      
      if (!response.ok()) {
        const data = await response.json();
        // Check that the error mentions the correct platform
        if (data.platform) {
          expect(data.platform).toBe(testCase.platform);
          console.log(`✅ Correctly detected ${testCase.platform} from ${testCase.url}`);
        } else if (data.error) {
          // Platform might be mentioned in error message
          expect(data.error.toLowerCase()).toContain(testCase.platform);
        }
      }
    }
  });
});