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
}

// Export singleton instance
export const mediaStorage = new MediaStorage()
