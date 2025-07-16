#!/bin/bash

echo "Testing Image Processing Animations"
echo "===================================="

# Test image generation with animation
echo -e "\n1. Testing image generation animation..."
echo "Watch for the generation placeholder animation"
curl -X POST http://localhost:3010/api/chat \
  -H "Accept: text/event-stream" \
  -F "message=A beautiful sunset over mountains" \
  -F "selectedTool=createImage"

echo -e "\n\n2. Testing image editing animation..."
echo "First, generate an image to edit"
# This would need to be done through the UI to see the edit modal animation

echo -e "\n\nTo test the edit animation:"
echo "1. Generate an image using the UI"
echo "2. Hover over the generated image and click 'Edit Image'"
echo "3. Enter an edit prompt and click 'Edit Image'"
echo "4. Watch for the editing placeholder animation in the modal"

echo -e "\n\nAnimation test setup complete!"