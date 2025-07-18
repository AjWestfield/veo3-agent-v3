// Facebook download workaround attempts
// This file contains experimental approaches to handle Facebook videos

export interface FacebookVideoInfo {
  url: string
  type: 'video' | 'reel' | 'live' | 'story'
  id?: string
  user?: string
}

// Parse Facebook URL to extract video information
export function parseFacebookUrl(url: string): FacebookVideoInfo | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const hostname = urlObj.hostname.toLowerCase()
    
    // Check if it's a Facebook URL
    if (!hostname.includes('facebook.com') && !hostname.includes('fb.com') && !hostname.includes('fb.watch')) {
      return null
    }
    
    // Facebook Reels
    if (pathname.includes('/reel/')) {
      const reelId = pathname.match(/\/reel\/(\d+)/)?.[1]
      return {
        url,
        type: 'reel',
        id: reelId
      }
    }
    
    // Facebook Watch videos
    if (pathname.includes('/watch') || urlObj.searchParams.has('v')) {
      const videoId = urlObj.searchParams.get('v') || pathname.match(/\/(\d+)/)?.[1]
      return {
        url,
        type: 'video',
        id: videoId
      }
    }
    
    // User videos
    if (pathname.match(/\/\w+\/videos\/\d+/)) {
      const matches = pathname.match(/\/(\w+)\/videos\/(\d+)/)
      return {
        url,
        type: 'video',
        user: matches?.[1],
        id: matches?.[2]
      }
    }
    
    // fb.watch short URLs
    if (hostname.includes('fb.watch')) {
      return {
        url,
        type: 'video',
        id: pathname.slice(1) // Remove leading slash
      }
    }
    
    return {
      url,
      type: 'video'
    }
  } catch {
    return null
  }
}

// Generate alternative Facebook URLs to try
export function generateFacebookAlternatives(url: string): string[] {
  const info = parseFacebookUrl(url)
  if (!info) return [url]
  
  const alternatives: string[] = [url]
  
  // If we have a video ID, try different URL formats
  if (info.id) {
    alternatives.push(
      `https://www.facebook.com/watch/?v=${info.id}`,
      `https://m.facebook.com/watch/?v=${info.id}`,
      `https://www.facebook.com/video.php?v=${info.id}`,
      `https://m.facebook.com/video.php?v=${info.id}`
    )
    
    // For reels, try different formats
    if (info.type === 'reel') {
      alternatives.push(
        `https://www.facebook.com/reel/${info.id}`,
        `https://m.facebook.com/reel/${info.id}`,
        `https://www.facebook.com/reels/${info.id}`,
        `https://m.facebook.com/reels/${info.id}`
      )
    }
  }
  
  // Remove duplicates
  return [...new Set(alternatives)]
}

// Enhanced cookie extraction for Facebook
export function getFacebookCookieInstructions(): string {
  return `To download private Facebook videos, you need to export cookies:

1. Install a browser extension like "Get cookies.txt" or "EditThisCookie"
2. Log into Facebook in your browser
3. Visit the video page you want to download
4. Export cookies in Netscape format
5. Save the cookies to a file

Note: Even with cookies, Facebook downloads may fail due to platform changes.`
}

// Check if URL might work better with mobile version
export function convertToMobileFacebookUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    if (urlObj.hostname.includes('facebook.com') && !urlObj.hostname.includes('m.')) {
      urlObj.hostname = urlObj.hostname.replace('facebook.com', 'm.facebook.com')
      return urlObj.toString()
    }
  } catch {
    // Invalid URL, return as-is
  }
  return url
}

// Facebook-specific error messages
export function getFacebookErrorMessage(error: string): {
  userMessage: string
  technicalDetails: string
  alternatives: string[]
} {
  const errorLower = error.toLowerCase()
  
  if (errorLower.includes('cannot parse data')) {
    return {
      userMessage: "Facebook's video system has changed, making downloads impossible with yt-dlp",
      technicalDetails: "The yt-dlp Facebook extractor is broken and needs updating by the yt-dlp team",
      alternatives: [
        "Browser Extension: Install 'Video DownloadHelper' or 'FBDown' extension",
        "Online Tools: Use fbdown.net, getfvid.com, or savefrom.net",
        "Screen Recording: Use OBS Studio or built-in screen recorder",
        "Mobile Apps: Some Android apps can download Facebook videos",
        "Developer Tools: Inspect network tab while video plays to find direct URL"
      ]
    }
  }
  
  if (errorLower.includes('login') || errorLower.includes('private')) {
    return {
      userMessage: "This Facebook video requires authentication",
      technicalDetails: "The video is private or requires login to access",
      alternatives: [
        "Make sure you're logged into Facebook in your browser",
        "Try exporting cookies and using them with the download",
        "Check if the video is publicly accessible",
        "Ask the video owner to change privacy settings",
        "Use screen recording as a last resort"
      ]
    }
  }
  
  return {
    userMessage: "Facebook video download failed",
    technicalDetails: error,
    alternatives: [
      "Try a different Facebook video URL",
      "Use alternative download methods listed above",
      "Check if the video still exists on Facebook",
      "Report the issue if it persists"
    ]
  }
}