#!/bin/bash

# Test video upload with progress tracking

echo "Testing video upload progress tracking..."
echo "========================================"

# Test file path - update this to point to your test video
VIDEO_FILE="${1:-/path/to/test/video.mp4}"

if [ ! -f "$VIDEO_FILE" ]; then
    echo "Error: Video file not found at $VIDEO_FILE"
    echo "Usage: $0 /path/to/video.mp4"
    exit 1
fi

# Get file size
FILE_SIZE=$(stat -f%z "$VIDEO_FILE" 2>/dev/null || stat -c%s "$VIDEO_FILE" 2>/dev/null)
FILE_SIZE_MB=$(echo "scale=2; $FILE_SIZE / 1024 / 1024" | bc)

echo "Video file: $VIDEO_FILE"
echo "File size: ${FILE_SIZE_MB}MB"
echo ""

# Start timing
START_TIME=$(date +%s)

# Upload the video
echo "Uploading video..."
curl -X POST http://localhost:3008/api/chat \
  -H "Accept: text/event-stream" \
  -F "message=Please analyze this video" \
  -F "files=@$VIDEO_FILE" \
  --no-buffer \
  -w "\n\nTotal time: %{time_total}s\n" \
  2>/dev/null | while IFS= read -r line; do
    if [[ $line == data:* ]]; then
        # Extract JSON from SSE data
        json=${line#data: }
        if [[ $json != "[DONE]" ]]; then
            # Pretty print the progress
            echo "$json" | jq -r 'if .type == "progress" then "[\(.stage | ascii_upcase)] \(.message)" elif .type == "content" then "[CONTENT] \(.text)" else . end' 2>/dev/null || echo "$line"
        else
            echo "[DONE] Stream completed"
        fi
    elif [[ ! -z "$line" ]]; then
        echo "$line"
    fi
done

# End timing
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "========================================"
echo "Test completed in ${DURATION} seconds"