#!/bin/bash

echo "Testing Aspect Ratio Preservation in Image Editing"
echo "=================================================="

# Test with a landscape image (16:9 aspect ratio)
echo -e "\n1. Testing with landscape image (16:9 aspect ratio)..."
curl -X POST http://localhost:3010/api/edit-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://picsum.photos/1920/1080",
    "prompt": "Add a sunset glow",
    "size": "1920x1080"
  }' | jq '.'

# Test with a portrait image (9:16 aspect ratio)
echo -e "\n\n2. Testing with portrait image (9:16 aspect ratio)..."
curl -X POST http://localhost:3010/api/edit-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://picsum.photos/1080/1920",
    "prompt": "Make it look vintage",
    "size": "1080x1920"
  }' | jq '.'

# Test with a square image (1:1 aspect ratio)
echo -e "\n\n3. Testing with square image (1:1 aspect ratio)..."
curl -X POST http://localhost:3010/api/edit-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://picsum.photos/1024/1024",
    "prompt": "Add artistic effects",
    "size": "1024x1024"
  }' | jq '.'

# Test with a custom aspect ratio (4:3)
echo -e "\n\n4. Testing with 4:3 aspect ratio..."
curl -X POST http://localhost:3010/api/edit-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://picsum.photos/1600/1200",
    "prompt": "Make it more colorful",
    "size": "1600x1200"
  }' | jq '.'

echo -e "\n\nAspect ratio tests complete! Check console logs for dimension verification."