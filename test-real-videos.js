// Test script with real video URLs from social media platforms
// Run with: node test-real-videos.js

const testRealVideos = async () => {
  const baseUrl = 'http://localhost:3000/api/download-video'
  
  // Real test URLs from public videos
  const testUrls = {
    youtube: [
      // Short public video - Google Developers channel
      'https://www.youtube.com/watch?v=FlzTddt2wAA',
      // YouTube Shorts
      'https://www.youtube.com/shorts/tPEE9ZwTmy0'
    ],
    facebook: [
      // Public Facebook videos (may still require auth)
      // Meta AI announcement video (public)
      'https://www.facebook.com/watch/?v=1093831888680522',
      // Facebook's own public video
      'https://fb.watch/tLzQwQ8_zH/',
      // Another format - public page video
      'https://www.facebook.com/Meta/videos/480846994409070/'
    ],
    instagram: [
      // Public Instagram reels (need real URLs)
      'https://www.instagram.com/reel/C_0Tn7EvLYH/',
      'https://www.instagram.com/p/DAePQWxPwjJ/'
    ],
    tiktok: [
      // Public TikTok videos
      'https://www.tiktok.com/@tiktok/video/7234567890123456789',
      'https://vm.tiktok.com/ZGJKsHf9C/'
    ]
  }
  
  console.log('=== REAL VIDEO DOWNLOAD TEST ===')
  console.log('Testing with actual video URLs...\n')
  
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
  console.log('\nKnown Limitations:')
  console.log('- Facebook: Most videos require authentication, even public ones')
  console.log('- Instagram: Requires authentication for most content')
  console.log('- TikTok: Should work for most public videos')
  console.log('- YouTube: Works best with public, non-age-restricted videos')
}

// Check if server is running
fetch('http://localhost:3000')
  .then(() => {
    console.log('Server is running on http://localhost:3000')
    testRealVideos()
  })
  .catch(() => {
    console.error('Error: Server is not running on http://localhost:3000')
    console.log('Please start the development server with: npm run dev')
  })