#!/bin/bash

echo "Creating a small test video file..."

# Create a tiny test video using ffmpeg if available
if command -v ffmpeg &> /dev/null; then
    echo "Creating test video with ffmpeg..."
    ffmpeg -f lavfi -i testsrc=duration=1:size=320x240:rate=1 -pix_fmt yuv420p test-video.mp4 -y 2>/dev/null
else
    echo "ffmpeg not found, creating a minimal MP4 file..."
    # Create a minimal valid MP4 structure (very basic, might not play but should upload)
    echo -ne '\x00\x00\x00\x20\x66\x74\x79\x70\x69\x73\x6f\x6d\x00\x00\x02\x00\x69\x73\x6f\x6d\x69\x73\x6f\x32\x61\x76\x63\x31\x6d\x70\x34\x31' > test-video.mp4
fi

# Check file size
if [ -f "test-video.mp4" ]; then
    FILE_SIZE=$(stat -f%z "test-video.mp4" 2>/dev/null || stat -c%s "test-video.mp4" 2>/dev/null || echo "0")
    echo "Test video created: $(ls -lh test-video.mp4)"
    echo "File size: $FILE_SIZE bytes"
else
    echo "Failed to create test video"
    exit 1
fi

echo -e "\nTesting video upload..."
echo "Watch the server console for detailed logs!"
echo ""

# Test video upload
curl -X POST http://localhost:3000/api/chat \
  -F "message=Can you analyze this test video?" \
  -F "files=@test-video.mp4;type=video/mp4" \
  -w "\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  -s -v 2>&1 | grep -E "(HTTP|< |> |File|Error|{|})"|head -30

# Clean up
rm -f test-video.mp4

echo -e "\n---"
echo "If you see a 500 error, check the server console for the detailed error message!"
