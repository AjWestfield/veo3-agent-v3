# VEO3 Agent - File Size Limits

## Updated File Size Limits (Maximum Capacity)

The video file upload limit has been increased to the maximum supported by Google Gemini API.

## File Size Limits

The following file size limits are now enforced:

- **Images**: Maximum 20MB
- **Videos**: Maximum **1GB (1,024MB)** ✨ UPDATED!
- **Audio**: Maximum 20MB

## Why These Limits?

1. **Gemini API Maximum**: The Gemini 2.0 Flash API supports videos up to 1GB in size
2. **Video Duration**: Supports up to 1 hour of video content
3. **Performance**: Large files are processed using Gemini's Files API for optimal handling
4. **Reliability**: The API is designed to handle large video files efficiently

## What Changed?

- Previous limit: 100MB for videos
- New limit: **1GB (1,024MB)** for videos
- This is the maximum supported by Gemini API
- Next.js configuration updated to handle large uploads
- Frontend validation updated to match new limits

## Solutions for Files Over 1GB

### For Videos Larger than 1GB:
1. **Split the video**: Use tools to split into parts under 1GB each
2. **Compress the video**: Use FFmpeg or similar tools
3. **Reduce quality**: Lower resolution or bitrate while maintaining viewability

### Compression Commands

Using FFmpeg to reduce file size:
```bash
# Compress video with higher compression (smaller file)
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -crf 28 -preset slow output.mp4

# Reduce to specific size (approximate)
ffmpeg -i input.mp4 -vcodec h264 -acodec aac -b:v 2M -b:a 128k output.mp4

# Split video into 30-minute segments
ffmpeg -i input.mp4 -c copy -map 0 -segment_time 00:30:00 -f segment output%03d.mp4
```

## Technical Details

- Next.js body size limit: Set to 1.5GB to handle overhead
- Upload timeout: Extended for large file uploads
- Streaming support: Disabled for video uploads for reliability
- API endpoint: Validates file size before processing

The app now supports video files up to 1GB - the maximum allowed by Gemini API!