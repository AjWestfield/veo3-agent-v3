#!/usr/bin/env node

// Test script to verify video download flow
const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

console.log('=== Testing Video Download Flow ===')
console.log('Test URL:', testUrl)

// Test 1: Direct API call
console.log('\n1. Testing direct API call...')
fetch('http://localhost:3000/api/download-social-video', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ url: testUrl })
})
.then(response => {
  console.log('Response status:', response.status)
  return response.json()
})
.then(data => {
  if (data.success) {
    console.log('✅ Video downloaded successfully!')
    console.log('Video title:', data.video.title)
    console.log('Video size:', (data.video.size / 1024 / 1024).toFixed(2), 'MB')
    console.log('Video has base64 data:', data.video.dataUrl ? 'Yes' : 'No')
  } else {
    console.log('❌ Download failed:', data.error)
    if (data.solutions) {
      console.log('Suggested solutions:', data.solutions)
    }
  }
})
.catch(error => {
  console.error('❌ API call failed:', error.message)
})

// Instructions for manual testing
console.log('\n=== Manual Testing Instructions ===')
console.log('1. Open http://localhost:3000 in your browser')
console.log('2. Open the browser console (F12)')
console.log('3. Paste this YouTube URL:', testUrl)
console.log('4. Watch the console logs for:')
console.log('   - [Paste Handler] messages')
console.log('   - [Send Handler] messages (should NOT appear if working correctly)')
console.log('   - [Video Download Utils] messages')
console.log('5. The video should appear in the chat input area')
console.log('6. Check the Videos tab in the sidebar')
console.log('\nIf you see TWO download attempts, the duplicate fix is not working.')
console.log('If the video doesn\'t appear, check console errors.')