#!/bin/bash

echo "Testing image generation with base64 response handling..."

# Test the generate-image endpoint directly
echo "Testing generate-image endpoint..."
curl -X POST http://localhost:3000/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a man",
    "model": "gpt-image-1",
    "size": "1024x1024",
    "quality": "high",
    "style": "vivid"
  }' | jq '.'

echo -e "\n\nNow test through the chat endpoint with streaming..."
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: multipart/form-data" \
  -H "Accept: text/event-stream" \
  -F "message=a man" \
  -F "selectedTool=createImage"