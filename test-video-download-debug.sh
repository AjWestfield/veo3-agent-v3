#!/bin/bash

# Test script for debugging YouTube and Facebook video downloads
# This script tests the download functionality with various URLs and logs detailed information

echo "=================================="
echo "Video Download Debug Test Script"
echo "=================================="
echo "Time: $(date)"
echo ""

# Check if yt-dlp is installed and accessible
echo "1. Checking yt-dlp installation..."
echo "---------------------------------"

# Check various possible locations
YT_DLP_PATHS=(
    "./node_modules/yt-dlp-exec/bin/yt-dlp"
    "./bin/yt-dlp"
    "/usr/local/bin/yt-dlp"
    "/usr/bin/yt-dlp"
)

YT_DLP=""
for path in "${YT_DLP_PATHS[@]}"; do
    if [ -f "$path" ]; then
        echo "✓ Found yt-dlp at: $path"
        YT_DLP="$path"
        break
    else
        echo "✗ Not found at: $path"
    fi
done

if [ -z "$YT_DLP" ]; then
    echo "ERROR: yt-dlp not found in any expected location!"
    exit 1
fi

# Check yt-dlp version and capabilities
echo ""
echo "2. yt-dlp version and capabilities:"
echo "-----------------------------------"
$YT_DLP --version
echo ""

# Test URLs
YOUTUBE_URL="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
YOUTUBE_SHORT_URL="https://youtu.be/dQw4w9WgXcQ"
FACEBOOK_URL="https://www.facebook.com/facebook/videos/10153231379946729/"
FACEBOOK_WATCH_URL="https://fb.watch/test123/"

echo "3. Testing direct yt-dlp downloads:"
echo "-----------------------------------"

# Function to test download
test_download() {
    local url=$1
    local platform=$2
    echo ""
    echo "Testing $platform: $url"
    echo "Command: $YT_DLP -j \"$url\""
    
    # First, try to get video info
    echo "Getting video info..."
    $YT_DLP -j "$url" 2>&1 | head -20
    
    echo ""
    echo "Attempting download with API options..."
    $YT_DLP "$url" \
        --format "best[ext=mp4]/best" \
        --max-filesize 1G \
        --no-playlist \
        --prefer-free-formats \
        --add-header "user-agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
        --no-check-certificates \
        --geo-bypass \
        --simulate \
        --verbose 2>&1 | head -50
    
    echo "---"
}

# Test YouTube
test_download "$YOUTUBE_URL" "YouTube (full URL)"
test_download "$YOUTUBE_SHORT_URL" "YouTube (short URL)"

# Test Facebook (if URL is accessible)
test_download "$FACEBOOK_URL" "Facebook (video post)"
test_download "$FACEBOOK_WATCH_URL" "Facebook (fb.watch)"

echo ""
echo "4. Testing API endpoint:"
echo "------------------------"

# Start the Next.js server if not running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "Starting Next.js server..."
    npm run dev &
    SERVER_PID=$!
    sleep 5
fi

# Function to test API endpoint
test_api_download() {
    local url=$1
    local platform=$2
    
    echo ""
    echo "Testing API with $platform: $url"
    
    # Make API request
    RESPONSE=$(curl -X POST http://localhost:3000/api/download-video \
        -H "Content-Type: application/json" \
        -d "{\"url\": \"$url\"}" \
        -w "\nHTTP_STATUS:%{http_code}" \
        -s)
    
    # Extract HTTP status
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d')
    
    echo "HTTP Status: $HTTP_STATUS"
    echo "Response (first 500 chars):"
    echo "$BODY" | head -c 500
    echo ""
    
    # Check if response contains error details
    if echo "$BODY" | grep -q '"error"'; then
        echo "Error details:"
        echo "$BODY" | jq -r '.error, .details' 2>/dev/null || echo "$BODY"
    fi
    
    echo "---"
}

# Test API with various URLs
test_api_download "$YOUTUBE_URL" "YouTube"
test_api_download "$FACEBOOK_URL" "Facebook"

echo ""
echo "5. Common issues and solutions:"
echo "-------------------------------"
echo "1. YouTube 403 errors: May need cookies or authentication"
echo "2. Facebook requires: User-agent headers, sometimes cookies"
echo "3. Age-restricted videos: Require authentication"
echo "4. Geo-blocked content: May need VPN or proxy"
echo "5. Private videos: Cannot be downloaded without auth"
echo ""

echo "6. Checking for error patterns in logs:"
echo "---------------------------------------"

# Check if there are any Next.js logs
if [ -f ".next/trace" ]; then
    echo "Recent errors in Next.js trace:"
    grep -i "download\|yt-dlp\|error" .next/trace | tail -20
fi

echo ""
echo "Test completed at: $(date)"
echo "=================================="

# Clean up if we started the server
if [ ! -z "$SERVER_PID" ]; then
    echo "Stopping test server..."
    kill $SERVER_PID 2>/dev/null
fi