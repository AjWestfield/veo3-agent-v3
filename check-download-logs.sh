#!/bin/bash

echo "Checking for video download errors in logs..."
echo "============================================="
echo ""

# Check PM2 logs if using PM2
if command -v pm2 &> /dev/null; then
    echo "Checking PM2 logs for download errors:"
    pm2 logs --lines 100 --nostream | grep -i "download\|yt-dlp\|youtube\|facebook\|error" | tail -50
    echo ""
fi

# Check Next.js console output (if saved to file)
if [ -f "next.log" ]; then
    echo "Checking Next.js logs:"
    grep -i "download\|yt-dlp\|youtube\|facebook\|error" next.log | tail -50
    echo ""
fi

# Check system logs on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Checking system logs (last hour):"
    log show --predicate 'process == "node" OR process == "yt-dlp"' --last 1h 2>/dev/null | grep -i "download\|error" | tail -20
    echo ""
fi

# Check for .next directory logs
if [ -d ".next" ]; then
    echo "Checking .next directory for error traces:"
    find .next -name "*.log" -o -name "*trace*" -type f 2>/dev/null | while read -r file; do
        if grep -qi "download\|yt-dlp\|youtube\|facebook" "$file" 2>/dev/null; then
            echo "Found in $file:"
            grep -i "download\|yt-dlp\|youtube\|facebook" "$file" | tail -10
            echo ""
        fi
    done
fi

# Check npm debug logs
if [ -f "npm-debug.log" ]; then
    echo "Checking npm debug log:"
    grep -i "yt-dlp\|download" npm-debug.log | tail -20
    echo ""
fi

echo "============================================="
echo "Log check complete"