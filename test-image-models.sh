#!/bin/bash

# Test script for image generation models

echo "Testing Image Generation Models"
echo "==============================="

# Test OpenAI model
echo -e "\n1. Testing OpenAI (gpt-image-1) model..."
curl -X POST http://localhost:3000/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a peaceful mountain landscape at sunset",
    "imageGenerationModel": "openai",
    "openaiModel": "gpt-image-1",
    "size": "1024x1024",
    "quality": "high",
    "style": "vivid"
  }' | jq .

# Test Wavespeed model
echo -e "\n2. Testing Wavespeed AI model..."
curl -X POST http://localhost:3000/api/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a futuristic cityscape with flying cars",
    "imageGenerationModel": "wavespeed",
    "guidanceScale": 3.5,
    "safetyTolerance": "2"
  }' | jq .

echo -e "\nTests completed!"