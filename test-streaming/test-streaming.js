// Test script to verify streaming functionality

const testStreaming = async () => {
  console.log('Testing chat API streaming...\n');
  
  const formData = new FormData();
  formData.append('message', 'Tell me a short story about a cat');
  
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
      console.log('WARNING: Response is not streaming. Content-Type:', contentType);
      const data = await response.json();
      console.log('Non-streaming response:', data);
      return;
    }

    console.log('\nStreaming response received. Reading chunks...\n');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            console.log('\n\nStreaming completed!');
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content') {
              process.stdout.write(parsed.text);
              fullContent += parsed.text;
            } else if (parsed.type === 'progress') {
              console.log(`\n[Progress] ${parsed.message}\n`);
            } else if (parsed.type === 'error') {
              console.error(`\n[Error] ${parsed.error}\n`);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
    
    console.log('\n\nFull response:', fullContent);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Check if running in Node.js
if (typeof window === 'undefined') {
  console.log('Note: This test needs to be run in a browser or with a proper fetch implementation.');
  console.log('You can copy this code and run it in the browser console while the app is running.');
} else {
  testStreaming();
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.testStreaming = testStreaming;
}
