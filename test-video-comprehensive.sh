#!/bin/bash

echo "=== VEO3 Agent Video Upload Test Suite ==="
echo "Testing various file sizes and scenarios..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test 1: Small video (< 1MB)
echo -e "${YELLOW}Test 1: Small video file${NC}"
if command -v ffmpeg &> /dev/null; then
    ffmpeg -f lavfi -i testsrc=duration=2:size=320x240:rate=10 -pix_fmt yuv420p small-test.mp4 -y 2>/dev/null
    SIZE=$(stat -f%z "small-test.mp4" 2>/dev/null || stat -c%s "small-test.mp4" 2>/dev/null)
    echo "Created small-test.mp4 ($(($SIZE / 1024))KB)"
    
    echo "Uploading..."
    RESPONSE=$(curl -X POST http://localhost:3000/api/chat \
      -F "message=Analyze this small test video" \
      -F "files=@small-test.mp4;type=video/mp4" \
      -w "\n%{http_code}" \
      -s)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✓ Small video upload successful${NC}"
    else
        echo -e "${RED}✗ Small video upload failed (HTTP $HTTP_CODE)${NC}"
        echo "$RESPONSE" | head -n-1 | jq '.' 2>/dev/null || echo "$RESPONSE"
    fi
    rm -f small-test.mp4
else
    echo -e "${RED}ffmpeg not installed, skipping video creation${NC}"
fi

echo ""

# Test 2: Medium video (10-50MB)
echo -e "${YELLOW}Test 2: Medium video file (simulated)${NC}"
echo "Creating 30MB test file..."
dd if=/dev/urandom of=medium-test.mp4 bs=1048576 count=30 2>/dev/null
echo "Created medium-test.mp4 (30MB)"

# Add minimal MP4 header to make it recognizable
echo -ne '\x00\x00\x00\x20\x66\x74\x79\x70\x69\x73\x6f\x6d' | dd of=medium-test.mp4 bs=1 seek=0 conv=notrunc 2>/dev/null

echo "Uploading (this will take longer)..."
START_TIME=$(date +%s)
RESPONSE=$(curl -X POST http://localhost:3000/api/chat \
  -F "message=Analyze this medium test video" \
  -F "files=@medium-test.mp4;type=video/mp4" \
  -w "\n%{http_code}" \
  -s --max-time 300)

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Medium video upload successful (took ${ELAPSED}s)${NC}"
else
    echo -e "${RED}✗ Medium video upload failed (HTTP $HTTP_CODE, took ${ELAPSED}s)${NC}"
    echo "$RESPONSE" | head -n-1 | jq '.' 2>/dev/null || echo "$RESPONSE"
fi
rm -f medium-test.mp4

echo ""

# Test 3: Image upload (control test)
echo -e "${YELLOW}Test 3: Image upload (control)${NC}"
convert -size 640x480 xc:blue test-image.png 2>/dev/null || {
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > test-image.png
}

RESPONSE=$(curl -X POST http://localhost:3000/api/chat \
  -F "message=What color is this image?" \
  -F "files=@test-image.png;type=image/png" \
  -w "\n%{http_code}" \
  -s)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Image upload successful${NC}"
else
    echo -e "${RED}✗ Image upload failed (HTTP $HTTP_CODE)${NC}"
fi
rm -f test-image.png

echo ""

# Test 4: Check server health
echo -e "${YELLOW}Test 4: Server health check${NC}"
HEALTH=$(curl -s http://localhost:3000/api/test-gemini)
if echo "$HEALTH" | grep -q "success"; then
    echo -e "${GREEN}✓ Gemini API is healthy${NC}"
    echo "$HEALTH" | jq -r '.testResponse' 2>/dev/null || echo "$HEALTH"
else
    echo -e "${RED}✗ Gemini API health check failed${NC}"
    echo "$HEALTH"
fi

echo ""
echo "=== Test Summary ==="
echo "• Small files should upload quickly (< 5s)"
echo "• Medium files may take 30-60s"
echo "• Large files (>100MB) may take several minutes"
echo "• If uploads fail with timeout, check server logs for details"
echo ""
echo "Server logs location: Check the terminal running 'npm run dev'"
