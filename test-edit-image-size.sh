#!/bin/bash

echo "Testing Wavespeed flux-kontext-max API with size parameters..."
echo "=============================================================="

# Test edit-image endpoint with size parameter
echo -e "\n1. Testing edit-image with size parameter..."
curl -X POST http://localhost:3010/api/edit-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://images.unsplash.com/photo-1501594907352-04cda38ebc29",
    "prompt": "Make the sky purple with aurora borealis",
    "size": "1024x1024"
  }' -v

echo -e "\n\nTest complete!"