#!/bin/bash

# Start script for veo3-agent
# This ensures we're using the correct Node.js version

echo "🚀 Starting veo3-agent..."
echo ""

# Source nvm and use Node v20
source ~/.nvm/nvm.sh
nvm use 20

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Start the development server
echo "🔧 Starting development server..."
pnpm dev
