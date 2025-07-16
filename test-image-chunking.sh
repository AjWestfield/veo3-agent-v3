#\!/bin/bash

echo "Testing image generation with chunked base64 handling..."

# Test through the chat endpoint with streaming
echo "Sending image generation request..."
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: multipart/form-data" \
  -H "Accept: text/event-stream" \
  -F "message=a man" \
  -F "selectedTool=createImage" \
  --no-buffer 2>/dev/null | while IFS= read -r line; do
    if [[ $line == data:* ]]; then
        # Extract the JSON part
        json="${line#data: }"
        if [[ -n "$json" && "$json" \!= "[DONE]" ]]; then
            # Parse the event type
            type=$(echo "$json" | jq -r '.type' 2>/dev/null)
            if [[ "$type" == "image_start" ]]; then
                echo "Started receiving image ($(echo "$json" | jq -r '.totalLength') bytes)"
            elif [[ "$type" == "image_chunk" ]]; then
                echo -n "."
            elif [[ "$type" == "image_end" ]]; then
                echo -e "\nImage transfer complete\!"
            elif [[ "$type" == "content" ]]; then
                echo -n "$(echo "$json" | jq -r '.text' 2>/dev/null)"
            fi
        fi
    fi
done

echo -e "\n\nTest complete\!"
