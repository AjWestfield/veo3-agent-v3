import { NextRequest, NextResponse } from "next/server"
import { create } from "yt-dlp-exec"
import fs from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import os from "os"
import { v4 as uuidv4 } from 'uuid'

export const maxDuration = 300 // 5 minutes timeout for downloads
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_VIDEO_SIZE = 1024 * 1024 * 1024 // 1GB max as per Gemini API

// Configure yt-dlp binary path - check multiple possible locations
function getYtDlpPath(): string {
  const possiblePaths = [
    // In node_modules (most common)
    path.join(process.cwd(), 'node_modules', 'yt-dlp-exec', 'bin', 'yt-dlp'),
    // In project bin directory (if copied there)
    path.join(process.cwd(), 'bin', 'yt-dlp'),
    // Relative to this file in production
    path.join(__dirname, '..', '..', '..', '..', 'node_modules', 'yt-dlp-exec', 'bin', 'yt-dlp'),
    // System-wide installation
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp'
  ]

  // Check each path and return the first one that exists
  for (const ytdlpPath of possiblePaths) {
    try {
      if (existsSync(ytdlpPath)) {
        console.log("Found yt-dlp at:", ytdlpPath)
        return ytdlpPath
      }
    } catch (e) {
      // Continue to next path
    }
  }

  // If no path found, return the most likely one
  console.warn("yt-dlp binary not found in expected locations, using default path")
  return possiblePaths[0]
}

const ytDlpBinaryPath = getYtDlpPath()
const ytdl = create(ytDlpBinaryPath)

// Validate if URL is from supported social media platforms
function isValidVideoUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const supportedDomains = [
      'youtube.com', 'youtu.be',
      'twitter.com', 'x.com',
      'instagram.com',
      'tiktok.com', 'vm.tiktok.com', // Added TikTok short URL domain
      'facebook.com', 'fb.com', 'fb.watch',
      'vimeo.com',
      'dailymotion.com',
      'reddit.com',
      'twitch.tv',
      'streamable.com'
    ]
    
    return supportedDomains.some(domain => 
      urlObj.hostname.includes(domain) || 
      urlObj.hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  console.log("=== VIDEO DOWNLOAD REQUEST ===")
  console.log("Time:", new Date().toISOString())
  console.log("yt-dlp binary path:", ytDlpBinaryPath)
  console.log("yt-dlp exists:", existsSync(ytDlpBinaryPath))
  
  try {
    const { url } = await request.json()
    
    if (!url) {
      console.error("No URL provided")
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      )
    }
    
    console.log("Received URL:", url)
    
    // Parse URL for debugging
    try {
      const urlObj = new URL(url)
      console.log("URL hostname:", urlObj.hostname)
      console.log("URL pathname:", urlObj.pathname)
    } catch (e) {
      console.error("Failed to parse URL:", e)
    }
    
    if (!isValidVideoUrl(url)) {
      console.error("Invalid video URL:", url)
      console.error("URL validation failed - not from supported platform")
      return NextResponse.json(
        { error: "URL must be from a supported social media platform" },
        { status: 400 }
      )
    }
    
    console.log("Downloading video from URL:", url)
    
    // Create temporary directory for download
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-download-'))
    const outputPath = path.join(tempDir, `${uuidv4()}.mp4`)
    
    try {
      // Download video using yt-dlp with improved options for social media platforms
      console.log("Starting download with yt-dlp...")
      await ytdl(url, {
        output: outputPath,
        format: 'best[ext=mp4]/best', // Prefer MP4 format
        maxFilesize: `${MAX_VIDEO_SIZE}`, // Limit file size
        noPlaylist: true, // Don't download playlists
        quiet: false, // Show output for debugging
        noWarnings: false,
        preferFreeFormats: true,
        // Improved headers for better compatibility
        addHeader: [
          'user-agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'accept-language:en-US,en;q=0.5',
          'accept-encoding:gzip, deflate, br',
          'dnt:1'
        ],
        // Additional options for better compatibility
        extractorArgs: 'tiktok:webpage_download=1',
        noCheckCertificates: true,
        geoBypass: true
      })
      
      // Check if file was downloaded
      const stats = await fs.stat(outputPath)
      console.log("Downloaded video size:", (stats.size / 1024 / 1024).toFixed(2), "MB")
      
      if (stats.size > MAX_VIDEO_SIZE) {
        await fs.unlink(outputPath)
        await fs.rmdir(tempDir)
        return NextResponse.json(
          { error: "Downloaded video exceeds 1GB size limit" },
          { status: 413 }
        )
      }
      
      // Read the file and convert to base64
      const videoBuffer = await fs.readFile(outputPath)
      const base64Video = videoBuffer.toString('base64')
      const dataUrl = `data:video/mp4;base64,${base64Video}`
      
      // Get video info
      let info: any = {}
      try {
        info = await ytdl(url, {
          dumpSingleJson: true,
          noCheckCertificates: true,
          noWarnings: true,
          preferFreeFormats: true,
          quiet: true,
          geoBypass: true
        })
      } catch (infoError) {
        console.log("Could not get video info, using defaults:", infoError)
        info = {
          title: 'Downloaded Video',
          duration: 0,
          extractor: 'unknown'
        }
      }
      
      // Clean up temporary files
      await fs.unlink(outputPath)
      await fs.rmdir(tempDir)
      
      return NextResponse.json({
        success: true,
        video: {
          dataUrl,
          filename: `${info.title || 'video'}.mp4`.replace(/[^a-z0-9.-]/gi, '_'),
          size: stats.size,
          title: info.title || 'Downloaded Video',
          duration: info.duration,
          platform: info.extractor || 'unknown'
        }
      })
      
    } catch (downloadError: any) {
      // Clean up on error
      try {
        await fs.unlink(outputPath).catch(() => {})
        await fs.rmdir(tempDir).catch(() => {})
      } catch {}
      
      console.error("Download error:", downloadError)
      console.error("Error message:", downloadError.message)
      console.error("Error stack:", downloadError.stack)
      
      // More specific error handling
      const errorMessage = downloadError.message?.toLowerCase() || downloadError.toString().toLowerCase()
      
      if (errorMessage.includes('format')) {
        return NextResponse.json(
          { error: "Unable to find compatible video format. The video might be in a format that cannot be downloaded." },
          { status: 422 }
        )
      }
      
      if (errorMessage.includes('private') || errorMessage.includes('unavailable') || errorMessage.includes('404')) {
        return NextResponse.json(
          { error: "Video is private, unavailable, or has been removed." },
          { status: 403 }
        )
      }
      
      if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        return NextResponse.json(
          { error: "Access forbidden. The video might be geo-restricted or require authentication." },
          { status: 403 }
        )
      }
      
      if (errorMessage.includes('extractor') || errorMessage.includes('unsupported url')) {
        return NextResponse.json(
          { error: "This video platform is not supported or the URL format is not recognized." },
          { status: 400 }
        )
      }
      
      if (errorMessage.includes('timeout')) {
        return NextResponse.json(
          { error: "Download timed out. The video might be too large or the server is slow." },
          { status: 408 }
        )
      }
      
      // Generic error with more details
      return NextResponse.json(
        { 
          error: "Failed to download video. Please check the URL and try again.",
          details: downloadError.message
        },
        { status: 500 }
      )
    }
    
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    )
  }
}