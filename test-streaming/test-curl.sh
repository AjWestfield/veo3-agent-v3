#!/bin/bash

# Test streaming functionality of the chat API

echo "Testing chat API streaming at http://localhost:3000/api/chat"
echo ""

# Create a simple form data payload
BOUNDARY="----WebKitFormBoundary7MA4YWxkTrZu0gW"

# Test with a simple message
curl -X POST http://localhost:3000/api/chat \
  -H "Accept: text/event-stream" \
  -H "Content-Type: multipart/form-data; boundary=$BOUNDARY" \
  --data-binary @- << EOF
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="message"

Tell me a very short joke
------WebKitFormBoundary7MA4YWxkTrZu0gW--
EOF
