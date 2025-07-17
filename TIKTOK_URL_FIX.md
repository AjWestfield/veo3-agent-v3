# TikTok URL Download Fix

## Problem
The user was getting an error "Failed to download video from the provided URL. Please check if the video is accessible and try again." when pasting TikTok URLs in the chat input.

## Root Causes Identified
1. **Missing TikTok short URL domain**: The API's URL validation didn't include `vm.tiktok.com` which is a common TikTok short URL format
2. **Duplicate paste events**: The paste event was potentially firing multiple times causing duplicate error messages
3. **Generic error messages**: The error messages weren't specific enough to help diagnose the actual issue

## Fixes Applied

### 1. Updated API URL Validation (`app/api/download-video/route.ts`)
- Added `vm.tiktok.com` to the list of supported domains
- Added `fb.watch` for Facebook short URLs
- Added more detailed logging for debugging

### 2. Enhanced Error Handling (`components/ui/chatgpt-prompt-input.tsx`)
- Added more specific error messages based on error type
- Added console logging to track the paste and download process
- Shows more user-friendly error messages

### 3. Prevented Duplicate Processing
- Added `isProcessingPaste` state to prevent duplicate paste event handling
- Ensures only one download process runs at a time

### 4. Improved TikTok URL Pattern Matching
- Updated regex to support more TikTok URL formats:
  - `https://www.tiktok.com/@username/video/1234567890`
  - `https://vm.tiktok.com/ZM8xxxxx/`
  - `https://tiktok.com/t/ZTRxxxxxx/`

## Testing
To test the fix:
1. Run `npm run dev`
2. Open the browser console to see debug logs
3. Paste a TikTok URL like:
   - `https://vm.tiktok.com/ZMxxxxxxx/`
   - `https://www.tiktok.com/@username/video/1234567890`
4. The video should download and appear in the file preview area

## Debug Information
The console will now show:
- `[Video URL Paste] Detected video URL: <url>`
- `[Video URL Paste] URL matches regex: true/false`
- `[Video URL Paste] Calling API with URL: <url>`
- Server logs will show hostname and pathname parsing

## Common Issues
If downloads still fail:
- The video might be private or deleted
- The video might be geo-restricted
- TikTok might require authentication for some videos
- The yt-dlp tool might need updating
- Network issues or rate limiting