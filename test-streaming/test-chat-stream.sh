#!/bin/bash

echo "Testing chat streaming on port 3003..."
echo ""

# Create form data with a simple message
curl -X POST http://localhost:3003/api/chat \
  -H "Accept: text/event-stream" \
  -F "message=Count from 1 to 3" \
  -N
