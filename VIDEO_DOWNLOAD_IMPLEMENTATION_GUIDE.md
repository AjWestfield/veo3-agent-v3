# Video Download Implementation Guide

## Overview

This implementation provides robust video downloading capabilities for multiple social media platforms using yt-dlp. When a video URL is pasted into the chat input, it's automatically detected and downloaded, then appears as an uploaded video file.

## Supported Platforms

### ✅ YouTube
- **Status**: Fully working
- **Supported**: Regular videos, Shorts, age-restricted (with cookies)
- **Strategies**: Multiple player clients (web, android, tv_embedded, web_embedded)
- **Format**: Best quality MP4 up to 1080p

### ⚠️ Facebook
- **Status**: Limited functionality
- **Issue**: yt-dlp Facebook extractor is broken (known issue)
- **Strategies**: Multiple API approaches, browser cookies, mobile user agents
- **Workaround**: Enhanced error messages with alternative solutions

### 🔒 Instagram
- **Status**: Works with authentication
- **Requirement**: Must be logged into Instagram in Chrome
- **Supported**: Posts, Reels, IGTV
- **Format**: Best available MP4

### ✅ TikTok
- **Status**: Working for public videos
- **Supported**: Regular TikTok videos
- **Note**: May encounter CAPTCHA challenges

### ✅ Twitter/X
- **Status**: Working with proper configuration
- **Supported**: Tweet videos
- **API**: Uses GraphQL API

## Implementation Details

### 1. URL Detection (Frontend)
```typescript
// In chatgpt-prompt-input.tsx
const isVideoUrl = (text: string): boolean => {
  const videoPatterns = [
    /youtube\.com\/watch\?v=/,
    /youtu\.be\//,
    /instagram\.com\/(p|reel|tv)\//,
    /tiktok\.com\/@[\w.-]+\/video\/\d+/,
    /facebook\.com\/(watch|.*\/videos\/)/,
    /twitter\.com\/\w+\/status\/\d+/,
    /x\.com\/\w+\/status\/\d+/
  ]
  return videoPatterns.some(pattern => pattern.test(text))
}
```

### 2. Download Flow

1. **URL Pasted** → Frontend detects video URL
2. **Loading State** → Temporary file shown with loading indicator
3. **API Call** → POST to `/api/download-social-video`
4. **Platform Detection** → Identifies platform from URL
5. **Download Strategy** → Platform-specific download with fallbacks
6. **Video Processing** → Convert to base64 data URL
7. **Return to Frontend** → Video appears as uploaded file
8. **Thumbnail Generation** → Extract frame for preview

### 3. Download Strategies

#### YouTube
```javascript
// Multiple player clients for different scenarios
strategies = [
  { player_client: 'web,android' },     // Best quality
  { player_client: 'android,ios' },     // Mobile fallback
  { player_client: 'tv_embedded' },     // TV client
  { player_client: 'web_embedded' }     // Embedded player
]
```

#### Facebook
```javascript
// Enhanced strategies despite yt-dlp issues
strategies = [
  { api: 'graphql', comprehensive headers },
  { mobile user agent },
  { basic mobile approach },
  { api: 'html5' fallback }
]
```

#### Instagram/TikTok
```javascript
// Platform-specific configurations
instagram: {
  app_id: '936619743392459',
  mobile user agent,
  cookies from browser
}
```

### 4. Error Handling

Each platform has specific error detection and user-friendly messages:

- **Authentication Required**: Suggests login solutions
- **Rate Limiting**: Provides retry timing
- **Platform Issues**: Explains known problems (e.g., Facebook)
- **Generic Errors**: Troubleshooting steps

## Configuration

### Environment Variables
```env
# No specific env vars required
# Uses system yt-dlp installation
```

### Dependencies
```json
{
  "yt-dlp-exec": "latest",
  "uuid": "^9.0.0"
}
```

## Testing

Run the test suite:
```bash
node test-enhanced-video-downloads.js
```

Test individual platforms:
```bash
# YouTube
node_modules/yt-dlp-exec/bin/yt-dlp "https://youtube.com/watch?v=VIDEO_ID" --simulate

# Instagram (requires cookies)
node_modules/yt-dlp-exec/bin/yt-dlp "https://instagram.com/p/POST_ID" --cookies-from-browser chrome
```

## Troubleshooting

### Common Issues

1. **"Cannot parse data" (Facebook)**
   - Known yt-dlp issue
   - Wait for yt-dlp updates
   - Use browser extensions as alternative

2. **"Empty media response" (Instagram)**
   - Not logged into Instagram
   - Private content
   - Solution: Login to Instagram in Chrome

3. **"Sign in to confirm" (YouTube)**
   - Age-restricted content
   - Solution: Use different video or browser cookies

4. **Rate Limiting**
   - Too many requests
   - Solution: Wait 5 minutes

### Updating yt-dlp
```bash
# Update to latest version
npm update yt-dlp-exec

# Or manually update
cd node_modules/yt-dlp-exec/bin
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp
chmod +x yt-dlp
```

## Best Practices

1. **Always Handle Errors Gracefully**
   - Provide clear error messages
   - Suggest alternative solutions
   - Log detailed errors for debugging

2. **Respect Platform Limits**
   - Implement retry logic with backoff
   - Handle rate limiting properly
   - Use appropriate user agents

3. **Cookie Management**
   - Try multiple browsers for cookies
   - Handle cookie failures gracefully
   - Never store sensitive cookie data

4. **Format Selection**
   - Prefer MP4 for compatibility
   - Limit to 1080p for file size
   - Handle format fallbacks

## Future Improvements

1. **Cookie Management UI**
   - Allow users to provide cookies manually
   - Better cookie error handling

2. **Progress Tracking**
   - Show download progress
   - Estimated time remaining

3. **Caching**
   - Cache successful downloads
   - Reduce repeated downloads

4. **Alternative Downloaders**
   - Fallback to other tools if yt-dlp fails
   - Platform-specific APIs

## Security Considerations

1. **Input Validation**
   - Validate URLs before processing
   - Sanitize file names
   - Check file sizes

2. **Rate Limiting**
   - Implement per-user limits
   - Prevent abuse

3. **File Management**
   - Clean up temporary files
   - Limit storage usage
   - Scan for malicious content