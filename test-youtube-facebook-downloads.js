// Test script for YouTube and Facebook video downloads
// Run with: node test-youtube-facebook-downloads.js

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const path = require('path');
const fs = require('fs');

// Test URLs
const TEST_URLS = {
  youtube: [
    {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      description: 'YouTube - Rick Astley (public video)'
    },
    {
      url: 'https://youtu.be/dQw4w9WgXcQ',
      description: 'YouTube - Short URL format'
    },
    {
      url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      description: 'YouTube - Me at the zoo (first YouTube video)'
    }
  ],
  facebook: [
    {
      url: 'https://www.facebook.com/facebook/videos/10153231379946729/',
      description: 'Facebook - Public video from Facebook page'
    },
    {
      url: 'https://www.facebook.com/watch/?v=1234567890',
      description: 'Facebook Watch - Generic format'
    }
  ]
};

// Find yt-dlp binary
function findYtDlp() {
  const possiblePaths = [
    path.join(process.cwd(), 'node_modules', 'yt-dlp-exec', 'bin', 'yt-dlp'),
    path.join(process.cwd(), 'bin', 'yt-dlp'),
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp'
  ];

  for (const ytdlpPath of possiblePaths) {
    if (fs.existsSync(ytdlpPath)) {
      console.log(`✓ Found yt-dlp at: ${ytdlpPath}`);
      return ytdlpPath;
    }
  }
  
  console.error('✗ yt-dlp not found!');
  return null;
}

// Test download with various options
async function testDownload(url, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${description}`);
  console.log(`URL: ${url}`);
  console.log(`${'='.repeat(60)}`);

  const ytdlp = findYtDlp();
  if (!ytdlp) return;

  // Test 1: Get video info
  console.log('\n1. Getting video info...');
  try {
    const infoCmd = `"${ytdlp}" -j "${url}" --no-check-certificates --geo-bypass`;
    const { stdout, stderr } = await execPromise(infoCmd);
    
    if (stderr) {
      console.error('STDERR:', stderr);
    }
    
    const info = JSON.parse(stdout);
    console.log('✓ Video found:');
    console.log(`  Title: ${info.title || 'Unknown'}`);
    console.log(`  Duration: ${info.duration || 'Unknown'} seconds`);
    console.log(`  Extractor: ${info.extractor || 'Unknown'}`);
    console.log(`  Formats available: ${info.formats ? info.formats.length : 0}`);
  } catch (error) {
    console.error('✗ Failed to get video info:');
    console.error(`  Error: ${error.message}`);
    if (error.stderr) {
      console.error(`  Details: ${error.stderr}`);
    }
  }

  // Test 2: Simulate download with current API options
  console.log('\n2. Testing download with API options...');
  try {
    const downloadCmd = `"${ytdlp}" "${url}" \
      --format "best[ext=mp4]/best" \
      --max-filesize 1G \
      --no-playlist \
      --prefer-free-formats \
      --add-header "user-agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
      --no-check-certificates \
      --geo-bypass \
      --simulate \
      --verbose`;
    
    const { stdout, stderr } = await execPromise(downloadCmd);
    console.log('✓ Download simulation successful');
    if (stdout.includes('Downloading')) {
      console.log('  Would download successfully');
    }
  } catch (error) {
    console.error('✗ Download simulation failed:');
    console.error(`  Error: ${error.message}`);
    if (error.stderr) {
      console.error(`  Details: ${error.stderr}`);
    }
  }

  // Test 3: Try alternative options for problematic platforms
  if (url.includes('facebook.com') || url.includes('fb.')) {
    console.log('\n3. Testing Facebook-specific options...');
    try {
      const fbCmd = `"${ytdlp}" "${url}" \
        --format "best[ext=mp4]/best" \
        --add-header "user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" \
        --add-header "accept-language:en-US,en;q=0.9" \
        --cookies-from-browser chrome \
        --no-check-certificates \
        --simulate \
        --verbose`;
      
      const { stdout, stderr } = await execPromise(fbCmd);
      console.log('✓ Facebook-specific options work');
    } catch (error) {
      console.error('✗ Facebook-specific options failed:');
      console.error(`  Error: ${error.message}`);
      
      // Suggest using cookies
      console.log('\n  💡 Facebook often requires authentication. Try:');
      console.log('     1. Export cookies from your browser');
      console.log('     2. Use --cookies-from-browser option');
      console.log('     3. Use a logged-in browser profile');
    }
  }

  // Test 4: Check for common issues
  console.log('\n4. Common issues check:');
  try {
    // Check if URL is accessible
    const checkCmd = `curl -I -s -o /dev/null -w "%{http_code}" "${url}"`;
    const { stdout: statusCode } = await execPromise(checkCmd);
    console.log(`  HTTP Status: ${statusCode}`);
    
    if (statusCode === '403') {
      console.log('  ⚠️  403 Forbidden - May need authentication or different headers');
    } else if (statusCode === '404') {
      console.log('  ⚠️  404 Not Found - Video may have been removed');
    }
  } catch (error) {
    console.log('  Could not check URL accessibility');
  }
}

// Test API endpoint
async function testAPIEndpoint(url, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`API Test: ${description}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const response = await fetch('http://localhost:3000/api/download-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    if (response.ok && data.success) {
      console.log('✓ Download successful via API');
      console.log(`  Video title: ${data.video.title}`);
      console.log(`  Size: ${(data.video.size / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.log('✗ Download failed via API');
      console.log(`  Error: ${data.error}`);
      if (data.details) {
        console.log(`  Details: ${data.details}`);
      }
    }
  } catch (error) {
    console.error('✗ API request failed:');
    console.error(`  Error: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log('YouTube & Facebook Download Test Suite');
  console.log('=====================================');
  console.log(`Date: ${new Date().toISOString()}`);

  // Check yt-dlp version
  const ytdlp = findYtDlp();
  if (ytdlp) {
    try {
      const { stdout } = await execPromise(`"${ytdlp}" --version`);
      console.log(`yt-dlp version: ${stdout.trim()}`);
    } catch (error) {
      console.log('Could not get yt-dlp version');
    }
  }

  // Test YouTube URLs
  console.log('\n\n### YOUTUBE TESTS ###');
  for (const test of TEST_URLS.youtube) {
    await testDownload(test.url, test.description);
  }

  // Test Facebook URLs
  console.log('\n\n### FACEBOOK TESTS ###');
  for (const test of TEST_URLS.facebook) {
    await testDownload(test.url, test.description);
  }

  // Test API if server is running
  console.log('\n\n### API ENDPOINT TESTS ###');
  try {
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('Server is running, testing API endpoints...');
      for (const test of TEST_URLS.youtube.slice(0, 1)) {
        await testAPIEndpoint(test.url, test.description);
      }
      for (const test of TEST_URLS.facebook.slice(0, 1)) {
        await testAPIEndpoint(test.url, test.description);
      }
    }
  } catch (error) {
    console.log('Server not running, skipping API tests');
  }

  // Summary and recommendations
  console.log('\n\n### RECOMMENDATIONS ###');
  console.log('=====================================');
  console.log('\nFor YouTube issues:');
  console.log('1. Update yt-dlp regularly: npm update yt-dlp-exec');
  console.log('2. Some videos may be age-restricted or region-locked');
  console.log('3. Try using --cookies-from-browser if getting 403 errors');
  
  console.log('\nFor Facebook issues:');
  console.log('1. Facebook often requires authentication');
  console.log('2. Export cookies from browser or use --cookies-from-browser');
  console.log('3. Some videos are only accessible when logged in');
  console.log('4. Try different user-agent strings');
  
  console.log('\nGeneral troubleshooting:');
  console.log('1. Check server logs for detailed error messages');
  console.log('2. Ensure yt-dlp is up to date');
  console.log('3. Test URLs directly with yt-dlp command line');
  console.log('4. Monitor rate limits from platforms');
}

// Run tests
runTests().catch(console.error);