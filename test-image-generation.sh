#!/bin/bash

echo "Testing OpenAI gpt-image-1 Image Generation API..."
echo "=================================================="

# Test direct API endpoint with different sizes
echo -e "\n1. Testing direct image generation endpoint (1024x1024)..."
curl -X POST http://localhost:3010/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic city with flying cars at sunset",
    "size": "1024x1024",
    "quality": "standard",
    "style": "vivid"
  }'

echo -e "\n\n2. Testing with larger size (2048x2048)..."
curl -X POST http://localhost:3010/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene mountain landscape with a crystal clear lake",
    "size": "2048x2048",
    "quality": "hd",
    "style": "natural"
  }'

echo -e "\n\n3. Testing chat API with image generation tool..."
curl -X POST http://localhost:3010/api/chat \
  -H "Accept: text/event-stream" \
  -F "message=A cute robot playing guitar in a meadow" \
  -F "selectedTool=createImage"

echo -e "\n\nTest complete!"