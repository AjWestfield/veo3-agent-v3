#!/usr/bin/env node

// Test script to verify YouTube Shorts download
const regularVideo = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
const shortsVideo = 'https://www.youtube.com/shorts/tDukIfFzX18'

console.log('=== Testing YouTube Shorts Download ===')
console.log('Regular video:', regularVideo)
console.log('Shorts video:', shortsVideo)

async function testDownload(url, type) {
  console.log(`\nTesting ${type}...`)
  
  try {
    const response = await fetch('http://localhost:3000/api/download-social-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    })
    
    const data = await response.json()
    
    if (data.success) {
      console.log(`✅ ${type} downloaded successfully!`)
      console.log('Title:', data.video.title)
      console.log('Size:', (data.video.size / 1024 / 1024).toFixed(2), 'MB')
      console.log('Platform:', data.video.platform)
    } else {
      console.log(`❌ ${type} download failed:`, data.error)
    }
  } catch (error) {
    console.error(`❌ ${type} API call failed:`, error.message)
  }
}

// Run tests
async function runTests() {
  await testDownload(regularVideo, 'Regular YouTube Video')
  await testDownload(shortsVideo, 'YouTube Shorts')
  
  console.log('\n=== Manual Testing ===')
  console.log('1. Open http://localhost:3000')
  console.log('2. Try pasting these URLs:')
  console.log('   - Regular:', regularVideo)
  console.log('   - Shorts:', shortsVideo)
  console.log('3. Both should download successfully')
}

runTests()