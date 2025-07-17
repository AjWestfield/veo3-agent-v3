# Video URL Download Feature

## Overview
This feature automatically detects video URLs from social media platforms when pasted in the chat input and downloads them using yt-dlp, then uploads them as regular video files for analysis.

## How It Works
1. **Automatic Detection on Paste**: When a user pastes a video URL, it's immediately detected
2. **Instant Download**: The system starts downloading the video using yt-dlp
3. **Progress Feedback**: Shows "Downloading video from URL..." message during download
4. **Auto Upload**: Downloaded video is automatically added to the file upload queue
5. **Ready for Analysis**: The video is processed like any other uploaded video file

## Supported Platforms
- YouTube (youtube.com, youtu.be)
- Twitter/X (twitter.com, x.com)
- Instagram (instagram.com - posts and reels)
- TikTok (tiktok.com)
- Facebook (facebook.com, fb.com)
- Vimeo (vimeo.com)
- Dailymotion (dailymotion.com)
- Reddit (reddit.com)
- Twitch (twitch.tv)
- Streamable (streamable.com)

## Recent Improvements (Fixed TikTok Issue)

### Key Fixes
1. **Paste Event Handler**: Added automatic URL detection on paste event
2. **Improved URL Regex**: Updated pattern to support more TikTok URL formats
3. **Better Error Handling**: More detailed error messages for debugging
4. **Enhanced yt-dlp Options**: Added better headers and compatibility options
5. **Console Logging**: Added detailed logging for troubleshooting

## Technical Implementation

### Frontend Changes (app/page.tsx)
- Added `detectVideoUrls()` function with improved regex patterns
- Added `downloadVideoFromUrl()` function with better error logging
- Added `handlePaste()` event handler for instant URL detection
- Modified `handleSubmit()` to check for URLs before processing
- Added UI feedback during download (disabled input, loading message)
- Added `isDownloadingVideo` state for UI control
- Shows success/error messages after download attempts

### Backend Changes (app/api/download-video/route.ts)
- Created new API endpoint for video downloads
- Uses yt-dlp-exec to download videos
- Validates URLs to ensure they're from supported platforms
- Enforces 1GB file size limit (Gemini API maximum)
- Returns video as base64 data URL with metadata

### Dependencies Added
- yt-dlp-exec: Node.js wrapper for yt-dlp
- uuid: For generating unique temporary file names

## Testing Instructions

### Basic Test
1. Start the development server: `npm run dev`
2. Open the application in your browser
3. Paste a video URL in the chat input
4. Press Enter or click Send
5. Watch for the "Downloading video from URL..." message
6. The video should appear in the file preview area
7. The video will be analyzed like any uploaded file

### Sample Test URLs

**YouTube:**
- https://www.youtube.com/watch?v=dQw4w9WgXcQ (Short video)
- https://youtu.be/dQw4w9WgXcQ (Short URL format)

**Twitter/X:**
- https://twitter.com/i/status/1234567890123456789
- https://x.com/username/status/1234567890123456789

**Instagram:**
- https://www.instagram.com/p/ABC123/
- https://www.instagram.com/reel/XYZ789/

**TikTok:**
- https://www.tiktok.com/@username/video/1234567890123456789

**Note:** Some URLs may require the videos to be publicly accessible. Private or restricted videos may not download successfully.

### Error Handling
The system handles various error cases:
- Invalid URLs (not from supported platforms)
- Private/restricted videos
- Videos exceeding 1GB size limit
- Network errors during download
- Invalid video formats

### Multiple URLs
You can paste multiple video URLs in one message. The system will:
1. Detect all valid video URLs
2. Download them sequentially
3. Add all successfully downloaded videos to the upload queue

## Limitations
1. Maximum video size: 1GB (Gemini API limit)
2. Download timeout: 5 minutes
3. Only supports platforms listed above
4. Requires yt-dlp to be installed on the system
5. Some videos may be geo-restricted or require authentication

## Security Considerations
- URLs are validated to ensure they're from known platforms
- Downloaded files are temporarily stored and cleaned up after processing
- File size limits prevent abuse
- No user credentials are stored or used for downloads