#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');

// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    http.get('http://localhost:3000', (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('🎬 Video Download E2E Test Runner');
  console.log('=================================\n');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('⚠️  Server not running on http://localhost:3000');
    console.log('📝 Starting development server...\n');
    
    // Start dev server in background
    const devServer = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      detached: false
    });
    
    // Wait for server to start
    console.log('⏳ Waiting for server to start...');
    let attempts = 0;
    while (attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (await checkServer()) {
        console.log('✅ Server started successfully!\n');
        break;
      }
      attempts++;
    }
    
    if (attempts >= 30) {
      console.error('❌ Server failed to start');
      process.exit(1);
    }
  } else {
    console.log('✅ Server already running\n');
  }
  
  console.log('🧪 Running E2E tests...\n');
  
  // Run Playwright tests
  const testProcess = spawn('npx', ['playwright', 'test', 'video-download.spec.ts', '--reporter=list'], {
    stdio: 'inherit'
  });
  
  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ All tests passed!');
      
      // Run API tests too
      console.log('\n🔄 Running API tests...\n');
      const apiTests = spawn('npx', ['playwright', 'test', 'video-download-api.spec.ts', '--reporter=list'], {
        stdio: 'inherit'
      });
      
      apiTests.on('close', (apiCode) => {
        if (apiCode === 0) {
          console.log('\n✅ All API tests passed!');
          console.log('\n📊 Test Summary:');
          console.log('  - YouTube downloads: ✅ Working');
          console.log('  - Facebook downloads: ⚠️  Expected to fail (yt-dlp issue)');
          console.log('  - Error handling: ✅ Working');
          console.log('  - Platform detection: ✅ Working');
          console.log('\n🎉 E2E testing complete!');
        } else {
          console.log('\n❌ Some API tests failed');
        }
        process.exit(apiCode);
      });
    } else {
      console.log('\n❌ Some tests failed');
      console.log('\n💡 Tips:');
      console.log('  - Check test screenshots in tests/screenshots/');
      console.log('  - Review error messages above');
      console.log('  - Ensure yt-dlp is installed: npm run postinstall');
      console.log('  - Try running tests in UI mode: npm run test:e2e:ui');
      process.exit(code);
    }
  });
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test runner interrupted');
  process.exit(0);
});

// Run the tests
runTests().catch(err => {
  console.error('❌ Test runner error:', err);
  process.exit(1);
});