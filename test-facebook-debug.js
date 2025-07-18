// Debug script for Facebook video downloads
// Run with: node test-facebook-debug.js

const { create } = require('yt-dlp-exec')
const path = require('path')
const { existsSync } = require('fs')

// Find yt-dlp binary
function getYtDlpPath() {
  const possiblePaths = [
    path.join(process.cwd(), 'node_modules', 'yt-dlp-exec', 'bin', 'yt-dlp'),
    path.join(process.cwd(), 'bin', 'yt-dlp'),
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp'
  ]
  
  for (const ytdlpPath of possiblePaths) {
    if (existsSync(ytdlpPath)) {
      console.log("Found yt-dlp at:", ytdlpPath)
      return ytdlpPath
    }
  }
  
  console.warn("yt-dlp binary not found in expected locations")
  return possiblePaths[0]
}

const ytdlpPath = getYtDlpPath()
const ytdl = create(ytdlpPath)

async function testFacebookDownload() {
  console.log('=== FACEBOOK VIDEO DEBUG TEST ===\n')
  
  // Test with a known public Facebook video
  const testUrl = 'https://www.facebook.com/watch/?v=1093831888680522'
  
  console.log('Testing URL:', testUrl)
  console.log('Using yt-dlp at:', ytdlpPath)
  console.log('\n1. First, let\'s check if yt-dlp can extract video info...\n')
  
  try {
    // Try to get video info
    const info = await ytdl(testUrl, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      geoBypass: true,
      verbose: true
    })
    
    console.log('✅ Successfully extracted video info:')
    console.log('   Title:', info.title || 'N/A')
    console.log('   Duration:', info.duration, 'seconds')
    console.log('   Formats available:', info.formats?.length || 0)
    console.log('   Extractor:', info.extractor)
    
    // Show available formats
    if (info.formats && info.formats.length > 0) {
      console.log('\nAvailable formats:')
      info.formats.slice(0, 5).forEach(format => {
        console.log(`   - ${format.format_id}: ${format.ext} ${format.width}x${format.height} ${format.format_note}`)
      })
    }
    
  } catch (error) {
    console.log('❌ Failed to extract video info')
    console.log('   Error:', error.message)
    
    // Try with different options
    console.log('\n2. Trying with browser cookies...\n')
    
    try {
      const info = await ytdl(testUrl, {
        dumpSingleJson: true,
        cookiesFromBrowser: 'chrome',
        noCheckCertificates: true,
        verbose: true
      })
      
      console.log('✅ Success with browser cookies!')
      console.log('   Title:', info.title || 'N/A')
      
    } catch (cookieError) {
      console.log('❌ Failed even with browser cookies')
      console.log('   Error:', cookieError.message)
    }
  }
  
  // Test actual download
  console.log('\n3. Testing actual video download...\n')
  
  const outputFile = './test-facebook-video.mp4'
  
  try {
    await ytdl(testUrl, {
      output: outputFile,
      format: 'best[ext=mp4]/best',
      noCheckCertificates: true,
      geoBypass: true,
      addHeader: [
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'referer:https://www.facebook.com/'
      ]
    })
    
    console.log('✅ Download successful!')
    console.log('   File saved to:', outputFile)
    
    // Clean up
    const fs = require('fs')
    fs.unlinkSync(outputFile)
    
  } catch (downloadError) {
    console.log('❌ Download failed')
    console.log('   Error:', downloadError.message)
  }
  
  console.log('\n=== RECOMMENDATIONS ===')
  console.log('If Facebook videos aren\'t working:')
  console.log('1. The video might require authentication (login)')
  console.log('2. Facebook actively blocks automated downloads')
  console.log('3. Consider using browser cookies: --cookies-from-browser chrome')
  console.log('4. Try using a different user agent')
  console.log('5. The video might be private or region-locked')
}

testFacebookDownload().catch(console.error)