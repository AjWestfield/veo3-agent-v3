// Test script for video download functionality
// Run with: node test-video-downloads.js

const testVideoDownloads = async () => {
  const baseUrl = 'http://localhost:3000/api/download-video'
  
  // Test URLs - use short, public videos
  const testUrls = {
    youtube: [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Astley - Never Gonna Give You Up (public)
      'https://youtu.be/dQw4w9WgXcQ', // Short URL format
      'https://www.youtube.com/watch?v=jNQXAC9IVRw', // Me at the zoo (first YouTube video)
    ],
    facebook: [
      // Note: Facebook videos often require authentication
      // These are examples of public video URL formats
      'https://www.facebook.com/watch/?v=123456789', // Example format
      'https://fb.watch/abcdefg/', // Short format
    ],
    tiktok: [
      'https://www.tiktok.com/@username/video/1234567890', // Example format
    ],
    instagram: [
      'https://www.instagram.com/reel/ABC123/', // Example format
    ]
  }
  
  console.log('=== VIDEO DOWNLOAD TEST ===')
  console.log('Testing video downloads from various platforms...\n')
  
  // Test each platform
  for (const [platform, urls] of Object.entries(testUrls)) {
    console.log(`\n--- Testing ${platform.toUpperCase()} ---`)
    
    for (const url of urls) {
      console.log(`\nTesting URL: ${url}`)
      
      try {
        const startTime = Date.now()
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
        
        const duration = Date.now() - startTime
        const data = await response.json()
        
        if (response.ok && data.success) {
          console.log(`✅ SUCCESS in ${(duration/1000).toFixed(2)}s`)
          console.log(`   Title: ${data.video.title}`)
          console.log(`   Size: ${(data.video.size / 1024 / 1024).toFixed(2)} MB`)
          console.log(`   Platform: ${data.video.platform}`)
        } else {
          console.log(`❌ FAILED (${response.status}) in ${(duration/1000).toFixed(2)}s`)
          console.log(`   Error: ${data.error}`)
          if (data.details) {
            console.log(`   Details: ${data.details}`)
          }
        }
      } catch (error) {
        console.log(`❌ NETWORK ERROR`)
        console.log(`   Error: ${error.message}`)
      }
    }
  }
  
  console.log('\n=== TEST COMPLETE ===')
  console.log('\nNotes:')
  console.log('- YouTube: Public videos should work. Age-restricted/premium content may fail.')
  console.log('- Facebook: Most videos require authentication. Only public videos may work.')
  console.log('- Instagram/TikTok: Should work for public content.')
  console.log('\nFor better results with YouTube/Facebook:')
  console.log('1. Use public, non-age-restricted videos')
  console.log('2. Avoid premium or DRM-protected content')
  console.log('3. For Facebook, use videos that don\'t require login')
}

// Check if server is running
fetch('http://localhost:3000')
  .then(() => {
    console.log('Server is running on http://localhost:3000')
    testVideoDownloads()
  })
  .catch(() => {
    console.error('Error: Server is not running on http://localhost:3000')
    console.log('Please start the development server with: npm run dev')
  })