#!/bin/bash

# Test script for enhanced video download functionality
# Run with: ./test-enhanced-downloads.sh

echo "=== Enhanced Video Download Test Suite ==="
echo "Testing the new social video download implementation"
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API endpoint
API_URL="http://localhost:3000/api/download-social-video"

# Test function
test_download() {
    local url=$1
    local description=$2
    
    echo -e "${YELLOW}Testing: ${description}${NC}"
    echo "URL: ${url}"
    
    # Make API request
    response=$(curl -s -X POST $API_URL \
        -H "Content-Type: application/json" \
        -d "{\"url\": \"$url\"}" \
        -w "\n%{http_code}")
    
    # Extract status code
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    # Check response
    if [ "$status_code" == "200" ]; then
        echo -e "${GREEN}✓ Success (200)${NC}"
        # Extract video info if available
        if echo "$body" | grep -q '"success":true'; then
            title=$(echo "$body" | grep -o '"title":"[^"]*' | cut -d'"' -f4)
            platform=$(echo "$body" | grep -o '"platform":"[^"]*' | cut -d'"' -f4)
            echo "  Title: $title"
            echo "  Platform: $platform"
        fi
    elif [ "$status_code" == "403" ]; then
        echo -e "${YELLOW}⚠ Authentication Required (403)${NC}"
        error=$(echo "$body" | grep -o '"error":"[^"]*' | cut -d'"' -f4)
        details=$(echo "$body" | grep -o '"details":"[^"]*' | cut -d'"' -f4)
        echo "  Error: $error"
        echo "  Details: $details"
    elif [ "$status_code" == "503" ]; then
        echo -e "${RED}✗ Service Unavailable (503)${NC}"
        error=$(echo "$body" | grep -o '"error":"[^"]*' | cut -d'"' -f4)
        echo "  Error: $error"
    else
        echo -e "${RED}✗ Failed ($status_code)${NC}"
        echo "  Response: $body"
    fi
    
    echo
}

# Check if server is running
echo "Checking if server is running..."
if curl -s -f http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Server is running${NC}"
    echo
else
    echo -e "${RED}✗ Server is not running. Please start it with 'npm run dev'${NC}"
    exit 1
fi

# Test YouTube URLs
echo "=== YOUTUBE TESTS ==="
test_download "https://www.youtube.com/watch?v=dQw4w9WgXcQ" "YouTube - Rick Astley (public video)"
test_download "https://youtu.be/jNQXAC9IVRw" "YouTube - Me at the zoo (first video)"

# Test Facebook URLs
echo "=== FACEBOOK TESTS ==="
test_download "https://www.facebook.com/watch/?v=1093831888680522" "Facebook - Public video"

# Test TikTok URLs
echo "=== TIKTOK TESTS ==="
test_download "https://www.tiktok.com/@zachking/video/7303508555784326446" "TikTok - Public video"

# Test Instagram URLs
echo "=== INSTAGRAM TESTS ==="
test_download "https://www.instagram.com/reel/C1234567890/" "Instagram - Public reel"

# Summary
echo "=== TEST SUMMARY ==="
echo "The enhanced download system handles:"
echo "- YouTube: Should work for public videos"
echo "- YouTube (restricted): Shows authentication prompt"
echo "- Facebook: Shows friendly error about temporary unavailability"
echo "- TikTok/Instagram: Should continue working as before"
echo
echo "To test cookie authentication:"
echo "1. Try downloading an age-restricted YouTube video"
echo "2. The UI will prompt for cookies"
echo "3. Follow the instructions to provide cookies"