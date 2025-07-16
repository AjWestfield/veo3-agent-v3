#!/bin/bash

echo "Testing video upload to Gemini API..."

# Create a simple test with a small video file
curl -X POST http://localhost:3006/api/chat \
  -H "Accept: text/event-stream" \
  -F "message=Please analyze this test video" \
  -N

echo -e "\n\nTest completed!"