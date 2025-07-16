#!/bin/bash

echo "Testing streaming chat response..."

# Test the streaming endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: multipart/form-data" \
  -F "message=Tell me a short story about a robot learning to paint" \
  -N

echo -e "\n\nTest completed!"