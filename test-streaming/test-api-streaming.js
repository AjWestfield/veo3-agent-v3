#!/usr/bin/env node

// Test streaming functionality of the chat API
// Usage: node test-api-streaming.js

const testStreaming = async () => {
  console.log('Testing chat API streaming at http://localhost:3000/api/chat\n');
  
  const formData = new FormData();
  formData.append('message', 'Count from 1 to 5 slowly');
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'text/event-stream'
      }
    });

    console.log('Response status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Error response:', error);
      return;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/event-stream')) {
      console.log('\n❌ ISSUE FOUND: Response is not streaming!');
      console.log('Content-Type received:', contentType);
      console.log('Expected: text/event-stream');
      
      // Try to read as JSON
      try {
        const data = await response.json();
        console.log('\nReceived non-streaming response:');
        console.log(JSON.stringify(data, null, 2));
      } catch (e) {
        const text = await response.text();
        console.log('\nReceived response:', text);
      }
      return;
    }

    console.log('\n✅ Streaming response detected!\n');
    console.log('Reading stream chunks...\n');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          chunkCount++;
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            console.log('\n✅ Stream completed successfully!');
            console.log(`Total chunks received: ${chunkCount}`);
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content') {
              console.log(`Chunk ${chunkCount}: "${parsed.text}"`);
            } else if (parsed.type === 'progress') {
              console.log(`Progress: ${parsed.message}`);
            } else if (parsed.type === 'error') {
              console.error(`Error: ${parsed.error}`);
            }
          } catch (e) {
            console.log(`Raw chunk ${chunkCount}: ${data}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nMake sure the server is running at http://localhost:3000');
  }
};

// Run the test
testStreaming();
