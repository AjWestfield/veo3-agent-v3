// Comprehensive test for all video platforms
// Run with: node test-all-platforms.js

const testAllPlatforms = async () => {
  const baseUrl = 'http://localhost:3000/api/download-video'
  
  // Real test URLs for each platform
  const testUrls = {
    'YouTube ✅': [
      {
        url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        title: 'Me at the zoo (First YouTube video)'
      },
      {
        url: 'https://www.youtube.com/shorts/tPEE9ZwTmy0', 
        title: 'YouTube Shorts'
      }
    ],
    'TikTok': [
      {
        url: 'https://www.tiktok.com/@zachking/video/7147640742452341038',
        title: 'TikTok video example'
      }
    ],
    'Instagram': [
      {
        url: 'https://www.instagram.com/reel/C1s1234ABCD/',
        title: 'Instagram Reel example'
      }
    ],
    'Facebook ❌': [
      {
        url: 'https://www.facebook.com/watch/?v=1093831888680522',
        title: 'Facebook video (known to fail)'
      }
    ],
    'Twitter/X': [
      {
        url: 'https://twitter.com/Twitter/status/1234567890',
        title: 'Twitter video example'
      }
    ]
  }
  
  console.log('=== COMPREHENSIVE VIDEO PLATFORM TEST ===')
  console.log('Testing video downloads across all supported platforms...')
  console.log('Date:', new Date().toISOString())
  console.log('\n')
  
  const results = {
    working: [],
    notWorking: [],
    total: 0
  }
  
  // Test each platform
  for (const [platform, videos] of Object.entries(testUrls)) {
    console.log(`\n━━━ Testing ${platform} ━━━`)
    
    for (const video of videos) {
      results.total++
      console.log(`\n📹 ${video.title}`)
      console.log(`URL: ${video.url}`)
      
      try {
        const startTime = Date.now()
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: video.url })
        })
        
        const duration = Date.now() - startTime
        const data = await response.json()
        
        if (response.ok && data.success) {
          console.log(`✅ SUCCESS in ${(duration/1000).toFixed(2)}s`)
          console.log(`   Title: ${data.video.title}`)
          console.log(`   Size: ${(data.video.size / 1024 / 1024).toFixed(2)} MB`)
          console.log(`   Platform: ${data.video.platform}`)
          results.working.push({platform, url: video.url})
        } else {
          console.log(`❌ FAILED (${response.status}) in ${(duration/1000).toFixed(2)}s`)
          console.log(`   Error: ${data.error}`)
          if (data.details) {
            console.log(`   Details: ${data.details}`)
          }
          results.notWorking.push({platform, url: video.url, error: data.error})
        }
      } catch (error) {
        console.log(`❌ NETWORK ERROR`)
        console.log(`   Error: ${error.message}`)
        results.notWorking.push({platform, url: video.url, error: error.message})
      }
    }
  }
  
  // Summary
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 TEST SUMMARY')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`\nTotal tests: ${results.total}`)
  console.log(`✅ Working: ${results.working.length}`)
  console.log(`❌ Not working: ${results.notWorking.length}`)
  
  console.log('\n🟢 WORKING PLATFORMS:')
  if (results.working.length > 0) {
    const workingPlatforms = [...new Set(results.working.map(r => r.platform))]
    workingPlatforms.forEach(p => console.log(`   - ${p}`))
  } else {
    console.log('   None')
  }
  
  console.log('\n🔴 NOT WORKING PLATFORMS:')
  if (results.notWorking.length > 0) {
    const notWorkingPlatforms = [...new Set(results.notWorking.map(r => r.platform))]
    notWorkingPlatforms.forEach(p => console.log(`   - ${p}`))
  } else {
    console.log('   None')
  }
  
  console.log('\n📝 KNOWN ISSUES:')
  console.log('1. Facebook: yt-dlp extractor is broken, Facebook changed their system')
  console.log('2. Instagram/TikTok: May require authentication for some videos')
  console.log('3. Twitter: May have issues with protected accounts')
  
  console.log('\n💡 RECOMMENDATIONS:')
  console.log('1. YouTube works best with public, non-age-restricted videos')
  console.log('2. For Instagram/TikTok, ensure videos are public')
  console.log('3. Keep yt-dlp updated: npm update yt-dlp-exec')
  console.log('4. Check server logs for detailed error information')
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

// Check if server is running
fetch('http://localhost:3000')
  .then(() => {
    console.log('Server is running on http://localhost:3000')
    testAllPlatforms()
  })
  .catch(() => {
    console.error('Error: Server is not running on http://localhost:3000')
    console.log('Please start the development server with: npm run dev')
  })