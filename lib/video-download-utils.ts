// Interface for files with preview data
export interface FileWithPreview {
  file: File
  preview: string
  type: "image" | "video" | "audio" | "other"
  isEdited?: boolean
  // For persistence - store file data as base64
  base64Data?: string
  fileName?: string
  fileSize?: number
  // Reference to stored file in IndexedDB
  fileId?: string
}

// Enhanced download video from URL with cookie support
export async function downloadVideoFromUrl(
  url: string, 
  cookies?: string
): Promise<{ file: FileWithPreview | null; requiresCookies?: boolean; platform?: string; error?: string }> {
  console.log('[Video Download Utils] Starting download for:', url)
  try {
    // Use the enhanced API endpoint
    const response = await fetch('/api/download-social-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, cookies })
    })

    const data = await response.json()
    console.log('[Video Download Utils] API Response:', response.status, data.error || 'Success')
    
    if (!response.ok) {
      // Check if authentication is required
      if (data.requiresCookies) {
        return {
          file: null,
          requiresCookies: true,
          platform: data.platform || getPlatformFromUrl(url),
          error: data.error
        }
      }
      
      throw new Error(data.error || 'Failed to download video')
    }
    
    // Convert base64 to blob
    const base64Response = await fetch(data.video.dataUrl)
    const blob = await base64Response.blob()
    
    // Create File object
    const file = new File([blob], data.video.filename, { type: 'video/mp4' })
    
    const result = {
      file: {
        file,
        preview: data.video.dataUrl,
        type: 'video' as const
      }
    }
    console.log('[Video Download Utils] Download successful, returning file:', file.name)
    return result
  } catch (error: any) {
    console.error('[Video Download Utils] Download error:', error)
    return {
      file: null,
      error: error.message
    }
  }
}

// Helper function to detect platform from URL
export function getPlatformFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube'
    } else if (hostname.includes('facebook.com') || hostname.includes('fb.')) {
      return 'facebook'
    } else if (hostname.includes('instagram.com')) {
      return 'instagram'
    } else if (hostname.includes('tiktok.com')) {
      return 'tiktok'
    }
    return 'unknown'
  } catch {
    return 'unknown'
  }
}