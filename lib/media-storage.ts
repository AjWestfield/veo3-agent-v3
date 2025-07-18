// IndexedDB storage for media files (images, videos, audio)
// This replaces localStorage to handle large base64 data

interface MediaItem {
  id: string
  url: string
  type: 'image' | 'video' | 'audio'
  metadata: any // Additional data like prompt, model, timestamp, etc.
}

export interface FileData {
  id: string
  base64Data: string
  fileName: string
  fileSize: number
  type: 'image' | 'video' | 'audio' | 'other'
  sessionId?: string
  messageIndex?: number
  fileIndex?: number
  timestamp: Date
}

class MediaStorage {
  private dbName = 'veo3-media-storage'
  private version = 2 // Incremented version to trigger upgrade
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores for different media types
        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'id' })
          imageStore.createIndex('timestamp', 'metadata.timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains('videos')) {
          const videoStore = db.createObjectStore('videos', { keyPath: 'id' })
          videoStore.createIndex('timestamp', 'metadata.timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains('audio')) {
          const audioStore = db.createObjectStore('audio', { keyPath: 'id' })
          audioStore.createIndex('timestamp', 'metadata.timestamp', { unique: false })
        }

        // Create object store for file data
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id' })
          fileStore.createIndex('sessionId', 'sessionId', { unique: false })
          fileStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init()
    }
    if (!this.db) {
      throw new Error('Failed to initialize database')
    }
    return this.db
  }

  async saveMedia(type: 'image' | 'video' | 'audio', item: MediaItem): Promise<void> {
    const db = await this.ensureDb()
    const transaction = db.transaction([type + 's'], 'readwrite')
    const store = transaction.objectStore(type + 's')
    
    return new Promise((resolve, reject) => {
      const request = store.put(item)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Download and store video locally as blob
  async downloadAndStoreVideo(videoUrl: string, videoId: string, metadata: any): Promise<string> {
    try {
      console.log('Downloading video for local storage:', videoUrl)
      
      // Fetch the video file
      const response = await fetch(videoUrl)
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`)
      }
      
      // Convert to blob
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      // Convert blob to base64 for storage
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          resolve(result.split(',')[1]) // Remove data:video/mp4;base64, prefix
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
      
      // Store the video data
      await this.saveMedia('video', {
        id: videoId,
        url: blobUrl, // Store blob URL for immediate use
        type: 'video',
        metadata: {
          ...metadata,
          base64Data, // Store base64 for persistence
          originalUrl: videoUrl,
          fileSize: blob.size,
          mimeType: blob.type
        }
      })
      
      console.log('Video stored successfully with blob URL:', blobUrl)
      return blobUrl
    } catch (error) {
      console.error('Failed to download and store video:', error)
      // Fallback to original URL if download fails
      return videoUrl
    }
  }

  // Restore blob URLs from stored base64 data
  async restoreVideoBlobUrls(): Promise<Map<string, string>> {
    const urlMapping = new Map<string, string>()
    
    try {
      const videos = await this.getAllMedia('video')
      console.log(`Restoring blob URLs for ${videos.length} videos`)
      
      for (const video of videos) {
        if (video.metadata?.base64Data) {
          try {
            // Recreate blob URL from base64 data
            const mimeType = video.metadata.mimeType || 'video/mp4'
            const blob = this.base64ToBlob(video.metadata.base64Data, mimeType)
            const blobUrl = URL.createObjectURL(blob)
            
            // Store the old URL -> new URL mapping
            urlMapping.set(video.id, blobUrl)
            
            // Update the stored video with new blob URL
            await this.saveMedia('video', {
              ...video,
              url: blobUrl
            })
            
            console.log('Restored blob URL for video:', video.id, 'Size:', blob.size, 'bytes')
          } catch (blobError) {
            console.error('Failed to restore blob for video:', video.id, blobError)
            // Try to use original URL if available
            if (video.metadata.originalUrl) {
              urlMapping.set(video.id, video.metadata.originalUrl)
              console.log('Using original URL as fallback for video:', video.id)
            }
          }
        } else if (video.metadata?.originalUrl && !video.url.startsWith('http')) {
          // If we have an original URL but no base64 data, use the original URL
          urlMapping.set(video.id, video.metadata.originalUrl)
          console.log('Using original URL for video:', video.id)
        }
      }
      
      console.log(`Successfully restored ${urlMapping.size} video URLs`)
    } catch (error) {
      console.error('Failed to restore video blob URLs:', error)
    }
    
    return urlMapping
  }

  // Validate and clean up broken videos with recovery attempts
  async validateAndCleanupVideos(): Promise<string[]> {
    const brokenVideoIds: string[] = []
    const recoveredVideoIds: string[] = []
    
    try {
      const videos = await this.getAllMedia('video')
      console.log(`Validating ${videos.length} stored videos`)
      
      for (const video of videos) {
        // Check if video URL is valid
        if (!video.url || video.url === 'undefined' || video.url === 'null') {
          console.log('Found video with invalid URL:', video.id)
          
          // Try to recover from original URL if available
          if (video.metadata?.originalUrl) {
            console.log('Attempting recovery from original URL:', video.metadata.originalUrl)
            try {
              const recoveredUrl = await this.downloadAndStoreVideo(
                video.metadata.originalUrl,
                video.id,
                video.metadata
              )
              
              if (recoveredUrl !== video.metadata.originalUrl) {
                console.log('Successfully recovered video:', video.id)
                recoveredVideoIds.push(video.id)
                continue
              }
            } catch (recoveryError) {
              console.error('Failed to recover video:', video.id, recoveryError)
            }
          }
          
          brokenVideoIds.push(video.id)
          continue
        }

        // For external URLs, try to validate them
        if (video.url.startsWith('http') && !video.metadata?.base64Data) {
          try {
            const response = await fetch(video.url, { method: 'HEAD' })
            const contentType = response.headers.get('content-type')
            
            if (!response.ok || !contentType?.startsWith('video/')) {
              console.log('Found video with broken external URL:', video.id, video.url)
              
              // Try to re-download if we have original URL
              if (video.metadata?.originalUrl && video.metadata.originalUrl !== video.url) {
                try {
                  const recoveredUrl = await this.downloadAndStoreVideo(
                    video.metadata.originalUrl,
                    video.id,
                    video.metadata
                  )
                  
                  if (recoveredUrl !== video.metadata.originalUrl) {
                    console.log('Successfully re-downloaded video:', video.id)
                    recoveredVideoIds.push(video.id)
                    continue
                  }
                } catch (recoveryError) {
                  console.error('Failed to re-download video:', video.id, recoveryError)
                }
              }
              
              brokenVideoIds.push(video.id)
            }
          } catch (error) {
            console.log('Video URL validation failed:', video.id, error)
            brokenVideoIds.push(video.id)
          }
        }
        
        // For blob URLs that might be revoked, ensure we have base64 backup
        if (video.url.startsWith('blob:') && !video.metadata?.base64Data) {
          console.warn('Found blob URL without base64 backup:', video.id)
          // Don't delete immediately - blob might still work
        }
      }

      // Remove truly broken videos from storage
      for (const videoId of brokenVideoIds) {
        await this.deleteMedia('video', videoId)
        console.log('Removed broken video:', videoId)
      }

      console.log(`Video validation complete: ${recoveredVideoIds.length} recovered, ${brokenVideoIds.length} removed`)
      
    } catch (error) {
      console.error('Failed to validate and cleanup videos:', error)
    }

    return brokenVideoIds
  }

  // Helper function to convert base64 to blob
  private base64ToBlob(base64Data: string, mimeType: string): Blob {
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  async getMedia(type: 'image' | 'video' | 'audio', id: string): Promise<MediaItem | null> {
    const db = await this.ensureDb()
    const transaction = db.transaction([type + 's'], 'readonly')
    const store = transaction.objectStore(type + 's')
    
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllMedia(type: 'image' | 'video' | 'audio'): Promise<MediaItem[]> {
    const db = await this.ensureDb()
    const transaction = db.transaction([type + 's'], 'readonly')
    const store = transaction.objectStore(type + 's')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async deleteMedia(type: 'image' | 'video' | 'audio', id: string): Promise<void> {
    const db = await this.ensureDb()
    const transaction = db.transaction([type + 's'], 'readwrite')
    const store = transaction.objectStore(type + 's')
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearMedia(type: 'image' | 'video' | 'audio'): Promise<void> {
    const db = await this.ensureDb()
    const transaction = db.transaction([type + 's'], 'readwrite')
    const store = transaction.objectStore(type + 's')
    
    return new Promise((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Migrate existing localStorage data to IndexedDB
  async migrateFromLocalStorage(): Promise<void> {
    try {
      const savedImages = localStorage.getItem('trackedImages')
      if (savedImages) {
        const parsed = JSON.parse(savedImages)
        for (const img of parsed) {
          if (img.url) { // Only migrate images that have URLs
            await this.saveMedia('image', {
              id: img.id,
              url: img.url,
              type: 'image',
              metadata: {
                prompt: img.prompt,
                model: img.model,
                timestamp: img.timestamp,
                imageType: img.type,
                originalUrl: img.originalUrl,
                sourceImages: img.sourceImages
              }
            })
          }
        }
        // Remove from localStorage after successful migration
        localStorage.removeItem('trackedImages')
      }
    } catch (error) {
      console.error('Failed to migrate from localStorage:', error)
    }
  }

  async saveFile(fileData: FileData): Promise<void> {
    const db = await this.ensureDb()
    const transaction = db.transaction(['files'], 'readwrite')
    const store = transaction.objectStore('files')
    
    return new Promise((resolve, reject) => {
      const request = store.put(fileData)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getFile(id: string): Promise<FileData | null> {
    const db = await this.ensureDb()
    const transaction = db.transaction(['files'], 'readonly')
    const store = transaction.objectStore('files')
    
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getFilesBySession(sessionId: string): Promise<FileData[]> {
    const db = await this.ensureDb()
    const transaction = db.transaction(['files'], 'readonly')
    const store = transaction.objectStore('files')
    const index = store.index('sessionId')
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(sessionId)
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async deleteFilesBySession(sessionId: string): Promise<void> {
    const db = await this.ensureDb()
    const transaction = db.transaction(['files'], 'readwrite')
    const store = transaction.objectStore('files')
    const index = store.index('sessionId')
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(sessionId)
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async clearAll(): Promise<void> {
    try {
      const db = await this.ensureDb()
      
      // Clear all media stores
      await this.clearMedia('image')
      await this.clearMedia('video')
      await this.clearMedia('audio')
      
      // Clear all files
      const transaction = db.transaction(['files'], 'readwrite')
      const store = transaction.objectStore('files')
      
      await new Promise<void>((resolve, reject) => {
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Failed to clear all media storage:', error)
      throw error
    }
  }
}

// Export singleton instance
export const mediaStorage = new MediaStorage()
