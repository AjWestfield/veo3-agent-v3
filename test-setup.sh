#!/bin/bash

# Test script for veo3-agent

# Source nvm and use Node v20
source ~/.nvm/nvm.sh
nvm use 20

echo "🚀 Testing veo3-agent setup..."
echo ""

# Check Node.js version
echo "📦 Node.js Version:"
node --version
echo ""

# Check package manager
echo "📦 Package Manager:"
which pnpm && pnpm --version
echo ""

# Check if dependencies are installed
echo "📦 Dependencies Status:"
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
    echo "Total packages: $(ls node_modules | wc -l)"
else
    echo "❌ Dependencies not installed"
fi
echo ""

# Check Next.js version
echo "📦 Next.js Version:"
grep '"next":' package.json | head -1
echo ""

# Test API endpoint
echo "🔍 Testing API endpoint..."
if curl -s -X POST http://localhost:3000/api/process-video \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/video.mp4"}' | grep -q "videoUrl"; then
    echo "✅ API endpoint working"
else
    echo "⚠️  API endpoint test failed (make sure dev server is running)"
fi
echo ""

echo "✨ Setup test complete!"
