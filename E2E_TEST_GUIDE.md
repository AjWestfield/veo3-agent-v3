# E2E Test Guide for Video Downloads

## Overview

This guide explains how to run the end-to-end tests for video download functionality using Playwright.

## Test Coverage

### 1. UI Tests (`video-download.spec.ts`)
- ✅ YouTube video download and display in chat
- ✅ Facebook error handling
- ✅ Multiple video downloads
- ✅ Invalid URL handling

### 2. API Tests (`video-download-api.spec.ts`)
- ✅ YouTube API response validation
- ✅ Facebook API error response
- ✅ Invalid URL rejection
- ✅ Platform detection

## Running Tests

### Quick Start
```bash
# Run all video download tests
node run-video-tests.js

# Or use npm scripts
npm run test:e2e:video
```

### Individual Test Commands
```bash
# Run all e2e tests
npm run test:e2e

# Run tests with UI (recommended for debugging)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run only API tests
npx playwright test video-download-api.spec.ts
```

## Prerequisites

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Install Playwright Browsers**
   ```bash
   npx playwright install chromium
   ```

3. **Ensure yt-dlp is Installed**
   ```bash
   npm run postinstall
   ```

## Test Results

### Expected Results

1. **YouTube Tests** ✅
   - Should successfully download video
   - Video should appear in chat input
   - Thumbnail should be generated

2. **Facebook Tests** ⚠️
   - Expected to fail with clear error message
   - Error should mention yt-dlp compatibility issue
   - Should provide alternative solutions

3. **Error Handling** ✅
   - Invalid URLs should be ignored
   - Missing URLs should return 400 error
   - Platform detection should work correctly

### Test Artifacts

After running tests, you'll find:
- **Screenshots**: `tests/screenshots/`
  - `youtube-download-success.png`
  - `facebook-download-result.png`
  - `multiple-downloads.png`
- **Failed Test Artifacts**: `tests/artifacts/`
- **HTML Report**: `playwright-report/`

## Debugging Failed Tests

1. **Run in UI Mode**
   ```bash
   npm run test:e2e:ui
   ```
   This opens Playwright Test Runner with:
   - Step-by-step execution
   - Time travel debugging
   - DOM snapshots

2. **Check Console Output**
   - Tests log progress and results
   - Error messages are detailed

3. **Review Screenshots**
   - Automatic screenshots on failure
   - Manual screenshots at key points

4. **Use Debug Mode**
   ```bash
   npm run test:e2e:debug
   ```
   Opens browser with inspector

## Common Issues

### Server Not Running
- Test runner automatically starts dev server
- Or manually start: `npm run dev`

### Timeout Errors
- Video downloads can be slow
- Tests have 2-minute timeout
- Adjust in `playwright.config.ts`

### Browser Not Found
```bash
npx playwright install chromium
```

### yt-dlp Not Found
```bash
npm run postinstall
```

## Writing New Tests

### Test Structure
```typescript
test('description', async ({ page }) => {
  // Navigate to app
  await page.goto('/');
  
  // Find chat input
  const chatInput = page.locator('textarea[placeholder*="Message"]');
  
  // Enter video URL
  await chatInput.fill('https://youtube.com/...');
  
  // Wait for download
  await expect(page.locator('video')).toBeVisible();
});
```

### Best Practices
1. Use data-testid attributes for reliable selectors
2. Add appropriate timeouts for network operations
3. Take screenshots at key points
4. Log progress for debugging
5. Handle both success and failure cases

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Maintenance

1. **Update yt-dlp Regularly**
   ```bash
   npm update yt-dlp-exec
   ```

2. **Update Test URLs**
   - Use short, stable videos
   - Avoid copyrighted content
   - Test with public videos

3. **Monitor Platform Changes**
   - Social platforms change frequently
   - Update selectors as needed
   - Adjust error expectations