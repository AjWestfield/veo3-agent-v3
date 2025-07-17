#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Setting up yt-dlp binary...');

// Check if yt-dlp exists in node_modules
const ytdlpPath = path.join(process.cwd(), 'node_modules', 'yt-dlp-exec', 'bin', 'yt-dlp');

if (!fs.existsSync(ytdlpPath)) {
  console.error('yt-dlp binary not found in node_modules. Running npm install...');
  try {
    execSync('npm install yt-dlp-exec', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to install yt-dlp-exec:', error.message);
    process.exit(1);
  }
}

// Create bin directory in project root if it doesn't exist
const projectBinDir = path.join(process.cwd(), 'bin');
if (!fs.existsSync(projectBinDir)) {
  fs.mkdirSync(projectBinDir, { recursive: true });
  console.log('Created bin directory');
}

// Copy yt-dlp binary to project bin directory
const projectYtdlpPath = path.join(projectBinDir, 'yt-dlp');
try {
  fs.copyFileSync(ytdlpPath, projectYtdlpPath);
  // Make it executable
  fs.chmodSync(projectYtdlpPath, 0o755);
  console.log('yt-dlp binary copied to project bin directory');
} catch (error) {
  console.error('Failed to copy yt-dlp binary:', error.message);
}

// Also ensure it's executable in node_modules
try {
  fs.chmodSync(ytdlpPath, 0o755);
  console.log('yt-dlp binary permissions set in node_modules');
} catch (error) {
  console.error('Failed to set permissions:', error.message);
}

console.log('yt-dlp setup complete!');
