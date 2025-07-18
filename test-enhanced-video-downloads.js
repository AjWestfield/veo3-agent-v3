// Enhanced test script for video downloads
// Tests all platforms with improved implementation

const TEST_VIDEOS = {
  youtube: [
    {
      url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      name: 'Me at the zoo (First YouTube video)',
      expected: 'public video'
    },
    {
      url: 'https://youtu.be/dQw4w9WgXcQ',
      name: 'Rick Astley - Never Gonna Give You Up',
      expected: 'public video'
    },
    {
      url: 'https://www.youtube.com/shorts/mWOQKEDaWmQ',
      name: 'YouTube Shorts example',
      expected: 'shorts format'
    }
  ],
  facebook: [
    {
      url: 'https://www.facebook.com/watch/?v=1093831888680522',
      name: 'Facebook Watch video',
      expected: 'may fail due to yt-dlp issue'
    },
    {
      url: 'https://www.facebook.com/facebook/videos/10153231379946729/',
      name: 'Facebook page video',
      expected: 'may require authentication'
    }
  ],
  instagram: [
    {
      url: 'https://www.instagram.com/p/CGh4a0iAhc1/',
      name: 'Instagram post',
      expected: 'requires cookies'
    },
    {
      url: 'https://www.instagram.com/reel/C0123456789/',
      name: 'Instagram Reel',
      expected: 'requires cookies'
    }
  ],
  tiktok: [
    {
      url: 'https://www.tiktok.com/@tiktok/video/7106594312292453675',
      name: 'TikTok official account video',
      expected: 'public video'
    }
  ]
}

async function testVideoDownload(platform, video) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Testing ${platform}: ${video.name}`)
  console.log(`URL: ${video.url}`)
  console.log(`Expected: ${video.expected}`)
  console.log(`${'='.repeat(60)}`)
  
  const startTime = Date.now()
  
  try {
    const response = await fetch('http://localhost:3000/api/download-social-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: video.url })
    })
    
    const data = await response.json()
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    if (response.ok && data.success) {
      console.log(`✅ SUCCESS in ${duration}s`)
      console.log(`   Title: ${data.video.title}`)
      console.log(`   Size: ${(data.video.size / 1024 / 1024).toFixed(2)} MB`)
      console.log(`   Platform: ${data.video.platform}`)
      console.log(`   Video data received: ${data.video.dataUrl ? 'Yes' : 'No'}`)
    } else {
      console.log(`❌ FAILED in ${duration}s`)
      console.log(`   Status: ${response.status}`)
      console.log(`   Error: ${data.error}`)
      if (data.details) {
        console.log(`   Details: ${data.details}`)
      }
      if (data.solutions) {
        console.log(`   Solutions:`)
        data.solutions.forEach(solution => {
          console.log(`     - ${solution}`)
        })
      }
    }
  } catch (error) {
    console.log(`❌ REQUEST FAILED`)
    console.log(`   Error: ${error.message}`)
  }
}

async function runTests() {
  console.log('Enhanced Video Download Test Suite')
  console.log('=================================')
  console.log(`Date: ${new Date().toISOString()}`)
  console.log('\nMake sure the server is running on http://localhost:3000')
  console.log('\nStarting tests in 3 seconds...\n')
  
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Test each platform
  for (const [platform, videos] of Object.entries(TEST_VIDEOS)) {
    console.log(`\n\n### ${platform.toUpperCase()} TESTS ###`)
    
    for (const video of videos) {
      await testVideoDownload(platform, video)
      // Wait between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  // Summary
  console.log('\n\n### TEST SUMMARY ###')
  console.log('===================')
  console.log('\n✅ YouTube: Should work for public videos')
  console.log('⚠️  Facebook: Currently broken in yt-dlp (known issue)')
  console.log('🔒 Instagram: Requires Chrome login cookies')
  console.log('✅ TikTok: Should work for public videos')
  console.log('\n📝 Notes:')
  console.log('- Ensure you are logged into social platforms in Chrome')
  console.log('- Update yt-dlp regularly: npm update yt-dlp-exec')
  console.log('- Some videos may be region-restricted or private')
  console.log('- Facebook extractor needs yt-dlp update to work again')
}

// Run the tests
runTests().catch(console.error)