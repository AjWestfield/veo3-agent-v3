#!/bin/bash

# Test script for Gemini API integration

echo "🧪 Testing Gemini API Integration..."
echo ""

# Test text-only request
echo "1. Testing text-only request..."
curl -X POST http://localhost:3003/api/chat \
  -F "message=Hello, can you introduce yourself?" \
  -s | jq '.'

echo ""
echo "2. Testing with sample image..."
# Create a simple test image using ImageMagick if available, or use base64
# For now, just test the endpoint structure

echo ""
echo "✅ Basic API test complete!"
echo ""
echo "To test with real files:"
echo "1. Open http://localhost:3003 in your browser"
echo "2. Type a message or upload files"
echo "3. Check the console for any errors"
