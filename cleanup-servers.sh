#!/bin/bash

echo "Cleaning up all veo3-agent Next.js processes..."

# Kill all Next.js processes related to veo3-agent
ps aux | grep -E "veo3-agent.*next" | grep -v grep | awk '{print $2}' | while read pid; do
    echo "Killing process $pid"
    kill -9 $pid 2>/dev/null
done

# Also kill any process using port 3000
lsof -ti:3000 | while read pid; do
    echo "Killing process $pid on port 3000"
    kill -9 $pid 2>/dev/null
done

# Also kill any process using port 3008
lsof -ti:3008 | while read pid; do
    echo "Killing process $pid on port 3008"
    kill -9 $pid 2>/dev/null
done

echo "Cleanup complete!"
echo ""
echo "To start the server fresh, run:"
echo "npm run dev"
