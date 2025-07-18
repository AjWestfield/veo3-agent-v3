# Video Download Guide

This guide explains the video download functionality and its current limitations.

## Supported Platforms

### ✅ Working Platforms

1. **YouTube**
   - Works well for public videos
   - Supports various URL formats (youtube.com, youtu.be, shorts)
   - Limitations:
     - Age-restricted videos require authentication
     - Premium/paid content cannot be downloaded
     - Some videos may be geo-restricted

2. **TikTok**
   - Generally works for public videos
   - Supports both regular and short URLs

3. **Instagram**
   - Works for public reels and posts
   - May require authentication for private content

4. **Twitter/X**
   - Works for most public videos
   - May have issues with protected accounts

### ⚠️ Limited Support

1. **Facebook**
   - **Current Status**: Not working due to yt-dlp extractor issues
   - Facebook frequently changes their page structure to prevent downloads
   - Even public videos often fail to download
   - Issues observed:
     - "Cannot parse data" errors
     - "No video formats found" even with authentication
   - Recommendation: Use alternative methods or wait for yt-dlp updates

## Common Error Messages and Solutions

### YouTube Errors

1. **"Sign-in required" or "Age-restricted"**
   - The video requires YouTube authentication
   - Solution: Use a public, non-age-restricted video

2. **"Video unavailable"**
   - The video might be private, deleted, or geo-blocked
   - Solution: Verify the URL and ensure the video is publicly accessible

### Facebook Errors

1. **"Cannot parse data"**
   - Facebook's page structure has changed
   - This is a known yt-dlp limitation
   - Solution: Currently no workaround available

2. **"No video formats found"**
   - The video data cannot be extracted even with authentication
   - Solution: Facebook actively prevents automated downloads

### General Errors

1. **"URL must be from a supported social media platform"**
   - The URL is not recognized as a supported platform
   - Solution: Check the URL format and ensure it's from a supported site

2. **"Downloaded video exceeds 1GB size limit"**
   - The video is too large for processing
   - Solution: Try a shorter or lower quality video

## Technical Details

The video download feature uses:
- **yt-dlp**: A powerful command-line tool for downloading videos
- **Platform-specific configurations**: Custom headers and options for each platform
- **Retry logic**: Automatic fallback strategies for failed downloads
- **Error handling**: Platform-specific error messages for better user guidance

## Troubleshooting Tips

1. **Update yt-dlp regularly**
   ```bash
   npm update yt-dlp-exec
   ```

2. **Check if a video is downloadable**
   ```bash
   npx yt-dlp --simulate [VIDEO_URL]
   ```

3. **For debugging**
   - Run the test scripts: `node test-video-downloads.js`
   - Check server logs for detailed error messages

## Future Improvements

- Monitor yt-dlp updates for Facebook extractor fixes
- Add support for more video platforms
- Implement user authentication options for private videos
- Add video quality selection options

## Important Notes

- This feature is for personal use only
- Respect copyright and platform terms of service
- Some videos are protected and cannot be downloaded legally
- Platform support may change as sites update their systems