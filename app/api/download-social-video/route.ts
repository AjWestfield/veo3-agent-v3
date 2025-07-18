import { NextRequest, NextResponse } from "next/server"
import { create } from "yt-dlp-exec"
import fs from "fs/promises"
import { existsSync, createWriteStream } from "fs"
import path from "path"
import os from "os"
import { v4 as uuidv4 } from 'uuid'
import { exec } from 'child_process'
import { promisify } from 'util'
import { generateFacebookAlternatives, parseFacebookUrl, getFacebookErrorMessage } from '@/lib/facebook-workaround'

const execAsync = promisify(exec)

export const maxDuration = 300 // 5 minutes timeout
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_VIDEO_SIZE = 1024 * 1024 * 1024 // 1GB max

// Platform detection
function getPlatform(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube'
    } else if (hostname.includes('facebook.com') || hostname.includes('fb.com') || hostname.includes('fb.watch')) {
      return 'facebook'
    } else if (hostname.includes('instagram.com')) {
      return 'instagram'
    } else if (hostname.includes('tiktok.com') || hostname.includes('vm.tiktok.com')) {
      return 'tiktok'
    } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return 'twitter'
    }
    return 'other'
  } catch {
    return 'unknown'
  }
}
// Find yt-dlp binary
function getYtDlpPath(): string {
  const possiblePaths = [
    path.join(process.cwd(), 'node_modules', 'yt-dlp-exec', 'bin', 'yt-dlp'),
    path.join(process.cwd(), 'bin', 'yt-dlp'),
    path.join(__dirname, '..', '..', '..', '..', 'node_modules', 'yt-dlp-exec', 'bin', 'yt-dlp'),
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp'
  ]

  for (const ytdlpPath of possiblePaths) {
    try {
      if (existsSync(ytdlpPath)) {
        console.log("Found yt-dlp at:", ytdlpPath)
        return ytdlpPath
      }
    } catch (e) {
      continue
    }
  }

  console.warn("yt-dlp binary not found in expected locations")
  return possiblePaths[0]
}

const ytDlpBinaryPath = getYtDlpPath()
const ytdl = create(ytDlpBinaryPath)

// Enhanced YouTube downloader with improved strategies
async function downloadYouTube(url: string, outputPath: string, cookies?: string): Promise<void> {
  const maxRetries = 3
  let lastError: any = null
  
  // Different strategies to try - updated with latest yt-dlp recommendations
  const strategies = [
    // Strategy 1: Best quality with fallback formats
    {
      format: 'bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/best',
      extractorArgs: 'youtube:player_client=web,android',
      addHeader: [
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'accept-language:en-US,en;q=0.9',
        'accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      ]
    },
    // Strategy 2: Mobile client with multiple fallbacks
    {
      format: 'best[ext=mp4]/bestvideo+bestaudio/best',
      extractorArgs: 'youtube:player_client=android,ios',
      addHeader: [
        'user-agent:com.google.android.youtube/19.02.39 (Linux; U; Android 13) gzip'
      ]
    },
    // Strategy 3: TV client (often has less restrictions)
    {
      format: 'best[ext=mp4]/best',
      extractorArgs: 'youtube:player_client=tv_embedded',
      addHeader: [
        'user-agent:Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.93 Safari/537.36'
      ]
    },
    // Strategy 4: Web embedded player
    {
      format: 'best[ext=mp4]/best',
      extractorArgs: 'youtube:player_client=web_embedded',
      addHeader: [
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'referer:https://www.youtube.com/'
      ]
    }
  ]
  
  for (let strategyIndex = 0; strategyIndex < strategies.length; strategyIndex++) {
    const strategy = strategies[strategyIndex]
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`YouTube download strategy ${strategyIndex + 1}/${strategies.length}, attempt ${attempt}/${maxRetries}`)
        
        const options: any = {
          output: outputPath,
          ...strategy,
          noCheckCertificates: true,
          preferFreeFormats: true,
          geoBypass: true,
          noPlaylist: true,
          maxFilesize: MAX_VIDEO_SIZE,
          retries: 10,
          fragmentRetries: 10,
          bufferSize: '16K',
          // Force IPv4 for better reliability
          forceIpv4: true,
          // Abort on errors instead of continuing
          abortOnError: true
        }
        
        // Enhanced cookie handling
        if (cookies) {
          options.cookies = cookies
        } else {
          // Try multiple browsers for cookies
          try {
            options.cookiesFromBrowser = 'chrome'
          } catch {
            try {
              options.cookiesFromBrowser = 'firefox'
            } catch {
              // Continue without browser cookies
            }
          }
        }
        
        await ytdl(url, options)
        console.log("YouTube download successful!")
        return
      } catch (error: any) {
        lastError = error
        console.error(`Strategy ${strategyIndex + 1}, attempt ${attempt} failed:`, error.message)
        
        // Check for specific errors and adjust strategy
        if (error.message?.includes('Sign in to confirm')) {
          console.log("Video requires authentication, trying with cookies...")
          // Skip to next strategy that might work better
          break
        }
        
        // Wait before retry with exponential backoff
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)))
        }
      }
    }
  }
  
  throw lastError || new Error("All YouTube download strategies failed")
}
// Enhanced Facebook downloader with multiple strategies
async function downloadFacebook(url: string, outputPath: string): Promise<void> {
  console.log("Attempting Facebook download with enhanced methods...")
  
  // Parse Facebook URL and generate alternatives
  const fbInfo = parseFacebookUrl(url)
  console.log("Facebook URL info:", fbInfo)
  
  // Generate alternative URLs to try
  const urlsToTry = generateFacebookAlternatives(url)
  console.log(`Trying ${urlsToTry.length} URL variations for Facebook ${fbInfo?.type || 'video'}`)
  
  // Different strategies optimized for Facebook
  const strategies = [
    // Strategy 1: Web with comprehensive headers
    {
      format: 'best[ext=mp4]/best',
      cookiesFromBrowser: 'chrome',
      addHeader: [
        'user-agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'referer:https://www.facebook.com/',
        'accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language:en-US,en;q=0.9',
        'sec-fetch-dest:document',
        'sec-fetch-mode:navigate',
        'sec-fetch-site:none',
        'sec-fetch-user:?1',
        'upgrade-insecure-requests:1'
      ],
      extractorArgs: 'facebook:api=graphql'
    },
    // Strategy 2: Mobile API approach
    {
      format: 'best[ext=mp4]/best',
      cookiesFromBrowser: 'chrome',
      addHeader: [
        'user-agent:Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36 FB_IAB/FB4A;FBAV/410.0.0.26.115;',
        'x-fb-connection-type:WIFI',
        'x-fb-sim-hni:310260',
        'x-fb-net-hni:310260'
      ]
    },
    // Strategy 3: Basic mobile approach
    {
      format: 'best[ext=mp4]/best',
      cookiesFromBrowser: 'firefox',
      addHeader: [
        'user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'accept:*/*'
      ]
    },
    // Strategy 4: Alternative extraction
    {
      format: 'best',
      cookiesFromBrowser: 'edge',
      addHeader: [
        'user-agent:facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
      ],
      extractorArgs: 'facebook:api=html5'
    }
  ]
  
  let lastError: any = null
  let attemptCount = 0
  
  // Try each URL with each strategy
  for (const currentUrl of urlsToTry) {
    console.log(`\nTrying URL variant: ${currentUrl}`)
    
    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i]
      attemptCount++
    
    // Skip cookie-based strategies if browser is not available
    if (strategy.cookiesFromBrowser) {
      try {
        // Test if browser cookies are accessible
        await execAsync(`which ${strategy.cookiesFromBrowser} 2>/dev/null || echo "not found"`)
      } catch {
        console.log(`Skipping strategy ${i + 1}: ${strategy.cookiesFromBrowser} browser not available`)
        continue
      }
    }
    
    try {
      console.log(`Trying Facebook strategy ${i + 1}/${strategies.length}`)
      
      const options: any = {
        output: outputPath,
        ...strategy,
        noCheckCertificates: true,
        geoBypass: true,
        maxFilesize: MAX_VIDEO_SIZE,
        retries: 5,
        fragmentRetries: 5,
        // Facebook-specific options
        preferFreeFormats: false,
        // Additional options
        httpChunkSize: '10M',
        concurrentFragments: 3
      }
      
      await ytdl(currentUrl, options)
      console.log("Facebook download successful!")
      return
    } catch (error: any) {
      lastError = error
      console.error(`Facebook strategy ${i + 1} for URL variant failed:`, error.message)
      
      // Check for specific Facebook errors
      if (error.message?.includes('Cannot parse data')) {
        console.log("Facebook extractor is broken in yt-dlp. This is a known issue.")
        // Skip remaining strategies for this URL since extractor is broken
        break
      } else if (error.message?.includes('HTTP Error 401')) {
        console.log("Facebook requires authentication for this video")
      }
    }
    }
  }
  
  // Enhanced error message for Facebook using the workaround helper
  const errorMessage = lastError?.message || "Unknown error"
  const fbError = getFacebookErrorMessage(errorMessage)
  
  console.log(`Facebook download failed after ${attemptCount} attempts`)
  console.log("Technical details:", fbError.technicalDetails)
  
  // Create a detailed error object that will be handled by the error handler
  const error = new Error(fbError.userMessage)
  ;(error as any).isFacebookError = true
  ;(error as any).alternatives = fbError.alternatives
  ;(error as any).technicalDetails = fbError.technicalDetails
  ;(error as any).videoType = fbInfo?.type || 'video'
  throw error
}

// Enhanced generic downloader with platform-specific optimizations
async function downloadGeneric(url: string, outputPath: string, platform: string): Promise<void> {
  const baseOptions: any = {
    output: outputPath,
    format: 'best[ext=mp4]/best',
    noCheckCertificates: true,
    geoBypass: true,
    noPlaylist: true,
    maxFilesize: MAX_VIDEO_SIZE,
    retries: 10,
    fragmentRetries: 10,
    bufferSize: '16K',
    httpChunkSize: '10M'
  }
  
  let options = { ...baseOptions }
  
  // Platform-specific configurations
  switch (platform) {
    case 'instagram':
      options = {
        ...options,
        cookiesFromBrowser: 'chrome',
        format: 'best[ext=mp4]/best',
        addHeader: [
          'user-agent:Instagram 292.0.0.32.119 Android (33/13; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100)',
          'x-ig-app-id:936619743392459',
          'x-ig-www-claim:0',
          'accept-language:en-US,en;q=0.9'
        ],
        extractorArgs: 'instagram:app_id=936619743392459'
      }
      break
      
    case 'tiktok':
      options = {
        ...options,
        cookiesFromBrowser: 'chrome',
        format: 'best[ext=mp4]/best',
        addHeader: [
          'user-agent:Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
          'referer:https://www.tiktok.com/'
        ],
        // TikTok-specific extractor args
        extractorArgs: 'tiktok:app_name=trill'
      }
      break
      
    case 'twitter':
      options = {
        ...options,
        cookiesFromBrowser: 'chrome',
        format: 'best[ext=mp4]/best',
        addHeader: [
          'user-agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'referer:https://twitter.com/'
        ],
        extractorArgs: 'twitter:api=graphql'
      }
      break
      
    default:
      // Default configuration for unknown platforms
      options = {
        ...options,
        cookiesFromBrowser: 'chrome',
        addHeader: [
          'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      }
  }
  
  // Try download with primary options
  try {
    console.log(`Downloading ${platform} video with optimized settings...`)
    await ytdl(url, options)
    console.log(`${platform} download successful!`)
    return
  } catch (error: any) {
    console.error(`Primary ${platform} download failed:`, error.message)
    
    // Fallback for authentication issues
    if (error.message?.includes('login') || error.message?.includes('cookie')) {
      console.log(`Retrying ${platform} download with alternative browser cookies...`)
      
      // Try different browsers
      const browsers = ['firefox', 'edge', 'safari', 'brave']
      for (const browser of browsers) {
        try {
          const fallbackOptions = {
            ...options,
            cookiesFromBrowser: browser
          }
          await ytdl(url, fallbackOptions)
          console.log(`${platform} download successful with ${browser} cookies!`)
          return
        } catch (browserError) {
          console.log(`Failed with ${browser} cookies:`, browserError.message)
        }
      }
    }
    
    // Re-throw the error with enhanced message
    throw new Error(
      `Failed to download ${platform} video: ${error.message}. ` +
      (platform === 'instagram' ? 'Instagram may require login. Try using a public post or ensure you\'re logged in to Instagram in Chrome.' :
       platform === 'tiktok' ? 'TikTok download failed. The video might be private or region-restricted.' :
       'Download failed. Please check if the URL is correct and the video is publicly accessible.')
    )
  }
}

// Main download orchestrator
async function downloadVideo(url: string, outputPath: string, platform: string, cookies?: string): Promise<void> {
  console.log(`Downloading ${platform} video from: ${url}`)
  
  switch (platform) {
    case 'youtube':
      await downloadYouTube(url, outputPath, cookies)
      break
    case 'facebook':
      await downloadFacebook(url, outputPath)
      break
    default:
      await downloadGeneric(url, outputPath, platform)
      break
  }
}
// Main POST handler
export async function POST(request: NextRequest) {
  console.log("=== SOCIAL VIDEO DOWNLOAD REQUEST ===")
  console.log("Time:", new Date().toISOString())
  
  try {
    const { url, cookies } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }
    
    // Detect platform
    const platform = getPlatform(url)
    console.log("Platform detected:", platform)
    
    if (platform === 'unknown') {
      return NextResponse.json(
        { error: "URL must be from a supported social media platform" },
        { status: 400 }
      )
    }
    
    // Create temporary directory
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-download-'))
    const outputPath = path.join(tempDir, `${uuidv4()}.mp4`)
    
    try {
      // Download the video with platform-specific handler
      await downloadVideo(url, outputPath, platform, cookies)
      
      // Check if file was downloaded
      const stats = await fs.stat(outputPath)
      console.log("Downloaded video size:", (stats.size / 1024 / 1024).toFixed(2), "MB")
      
      if (stats.size > MAX_VIDEO_SIZE) {
        throw new Error("Downloaded video exceeds 1GB size limit")
      }
      
      // Get video info
      let info: any = { title: 'Downloaded Video', duration: 0 }
      try {
        info = await ytdl(url, {
          dumpSingleJson: true,
          noCheckCertificates: true,
          geoBypass: true
        })
      } catch (infoError) {
        console.log("Could not get video info:", infoError)
      }
      
      // Read file and convert to base64
      const videoBuffer = await fs.readFile(outputPath)
      const base64Video = videoBuffer.toString('base64')
      const dataUrl = `data:video/mp4;base64,${base64Video}`
      
      // Clean up
      await fs.unlink(outputPath)
      await fs.rmdir(tempDir)
      
      return NextResponse.json({
        success: true,
        video: {
          dataUrl,
          filename: `${info.title || 'video'}.mp4`.replace(/[^a-z0-9.-]/gi, '_'),
          size: stats.size,
          title: info.title || 'Downloaded Video',
          duration: info.duration || 0,
          platform
        }
      })
      
    } catch (error: any) {
      // Clean up on error
      try {
        await fs.unlink(outputPath).catch(() => {})
        await fs.rmdir(tempDir).catch(() => {})
      } catch {}
      
      // Enhanced error handling
      return handleDownloadError(error, platform, url)
    }
    
  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    )
  }
}

// Enhanced error handler with comprehensive platform-specific messages
function handleDownloadError(error: any, platform: string, url: string): NextResponse {
  console.error(`${platform} download error:`, error.message)
  const errorMessage = error.message?.toLowerCase() || ''
  
  // YouTube-specific errors
  if (platform === 'youtube') {
    if (errorMessage.includes('sign in') || errorMessage.includes('bot') || errorMessage.includes('confirm')) {
      return NextResponse.json({
        error: "YouTube requires authentication",
        details: "This video is age-restricted or requires sign-in. Try one of these solutions:",
        solutions: [
          "Use a public YouTube video URL",
          "Install a browser extension like 'youtube-dl' for manual download",
          "Try using YouTube Premium if you have access"
        ],
        requiresCookies: true
      }, { status: 403 })
    }
    if (errorMessage.includes('429') || errorMessage.includes('too many requests')) {
      return NextResponse.json({
        error: "YouTube rate limit exceeded",
        details: "YouTube has temporarily blocked requests from this server.",
        retryAfter: 300,
        solutions: ["Wait 5 minutes before trying again", "Try a different video URL"]
      }, { status: 429 })
    }
    if (errorMessage.includes('copyright') || errorMessage.includes('unavailable') || errorMessage.includes('private')) {
      return NextResponse.json({
        error: "Video unavailable",
        details: "This video cannot be downloaded due to restrictions.",
        reasons: [
          "Video may be private or unlisted",
          "Copyright restrictions in your region",
          "Video has been removed"
        ]
      }, { status: 403 })
    }
    if (errorMessage.includes('live')) {
      return NextResponse.json({
        error: "Live streams not supported",
        details: "Cannot download live streams or premieres. Please wait until the stream ends."
      }, { status: 400 })
    }
  }
  
  // Facebook-specific errors
  if (platform === 'facebook') {
    // Check if it's an enhanced Facebook error with additional info
    if ((error as any).isFacebookError) {
      return NextResponse.json({
        error: error.message,
        details: (error as any).technicalDetails,
        solutions: (error as any).alternatives,
        videoType: (error as any).videoType,
        alternativeAction: "manual",
        ytdlpIssue: errorMessage.includes('cannot parse data')
      }, { status: 503 })
    }
    
    // Fallback for standard Facebook errors
    if (errorMessage.includes('cannot parse data')) {
      return NextResponse.json({
        error: "Facebook videos and Reels temporarily unavailable",
        details: "Facebook has changed their platform, breaking yt-dlp compatibility for all video types including Reels.",
        solutions: [
          "Use browser extensions like 'Video DownloadHelper' or 'FBDown'",
          "Try online services: fbdown.net, getfvid.com, or fdown.net",
          "For Reels: Try reelsaver.net or screen recording",
          "Wait for yt-dlp updates (run: npm update yt-dlp-exec)"
        ],
        alternativeAction: "manual",
        ytdlpIssue: true
      }, { status: 503 })
    }
    if (errorMessage.includes('login') || errorMessage.includes('401')) {
      return NextResponse.json({
        error: "Facebook authentication required",
        details: "This video is only available to logged-in users.",
        solutions: [
          "Use a public Facebook video URL",
          "Ensure you're logged into Facebook in Chrome",
          "Try mobile Facebook URLs (m.facebook.com)"
        ],
        requiresCookies: true
      }, { status: 401 })
    }
  }
  
  // Instagram-specific errors
  if (platform === 'instagram') {
    if (errorMessage.includes('login') || errorMessage.includes('empty media response')) {
      return NextResponse.json({
        error: "Instagram authentication required",
        details: "This content requires Instagram login or is private.",
        solutions: [
          "Make sure you're logged into Instagram in Chrome",
          "Use public Instagram posts only",
          "Try copying the post URL from a browser, not the app"
        ],
        requiresCookies: true
      }, { status: 401 })
    }
  }
  
  // TikTok-specific errors
  if (platform === 'tiktok') {
    if (errorMessage.includes('captcha')) {
      return NextResponse.json({
        error: "TikTok CAPTCHA challenge",
        details: "TikTok is requiring human verification.",
        solutions: [
          "Try again in a few minutes",
          "Use the desktop TikTok website URL",
          "Download using TikTok's built-in download feature"
        ]
      }, { status: 403 })
    }
  }
  
  // Generic errors
  if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
    return NextResponse.json({
      error: "Access forbidden",
      details: `The ${platform} video is not accessible.`,
      solutions: [
        "Check if the video is public",
        "Try a different video URL",
        `Make sure you're logged into ${platform} in your browser`
      ],
      requiresCookies: true
    }, { status: 403 })
  }
  
  if (errorMessage.includes('404') || errorMessage.includes('not found')) {
    return NextResponse.json({
      error: "Video not found",
      details: "The video doesn't exist or has been removed.",
      solutions: [
        "Verify the URL is correct",
        "Check if the video is still available on the platform"
      ]
    }, { status: 404 })
  }
  
  if (errorMessage.includes('format') || errorMessage.includes('no video')) {
    return NextResponse.json({
      error: "No downloadable video found",
      details: "The URL might not contain a video or the format is not supported.",
      solutions: [
        "Make sure the URL points to a video, not a profile or playlist",
        "Try a different video from the same platform"
      ]
    }, { status: 400 })
  }
  
  // Default error
  return NextResponse.json({
    error: `Failed to download ${platform} video`,
    details: error.message || "An unexpected error occurred",
    platform,
    troubleshooting: [
      "Check if the video URL is correct and complete",
      "Ensure the video is publicly accessible",
      "Try updating yt-dlp: npm update yt-dlp-exec",
      `Report persistent issues for ${platform} downloads`
    ]
  }, { status: 500 })
}