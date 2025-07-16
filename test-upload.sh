#!/bin/bash

echo "Testing file upload to veo3-agent API..."
echo ""

# Create a small test image
echo "Creating test image..."
convert -size 100x100 xc:red test-image.png 2>/dev/null || {
    # If ImageMagick is not installed, create a tiny base64 image
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" | base64 -d > test-image.png
}

# Test with just a message
echo "Test 1: Message only..."
curl -X POST http://localhost:3000/api/chat \
  -F "message=Hello, can you see this message?" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "Response parsing failed"

echo -e "\n---\n"

# Test with a small image
echo "Test 2: Message with image..."
curl -X POST http://localhost:3000/api/chat \
  -F "message=Can you see this test image?" \
  -F "files=@test-image.png;type=image/png" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "Response parsing failed"

# Clean up
rm -f test-image.png

echo -e "\n---\n"
echo "Check the server console for detailed logs!"
