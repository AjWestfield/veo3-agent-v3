"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { mediaStorage } from '@/lib/media-storage'

export interface TrackedVideo {
  id: string
  url: string
  name?: string
  title?: string
  thumbnail?: string
  duration?: number
  timestamp: Date
  type: 'generated' | 'uploaded' | 'downloaded' | 'video'
  platform?: string // For downloaded videos (youtube, tiktok, etc.)
  details?: {
    model?: string
    duration?: number
    quality?: string
    aspectRatio?: string
    prompt?: string
    id?: string
    createdAt?: string
  }
  createdAt?: string
}

export interface DeletedVideo extends TrackedVideo {
  deletedAt: Date
}

interface VideosContextType {
  videos: TrackedVideo[]
  recentlyDeleted: DeletedVideo | null
  addVideo: (video: Omit<TrackedVideo, 'id' | 'timestamp'>) => TrackedVideo
  removeVideo: (id: string) => void
  removeVideoWithConfirmation: (id: string) => Promise<boolean>
  undoDelete: () => void
  clearVideos: () => void
  getVideoById: (id: string) => TrackedVideo | undefined
  cleanupBrokenVideos: () => Promise<number>
  retryFailedVideo: (videoId: string) => Promise<boolean>
}

const VideosContext = createContext<VideosContextType | undefined>(undefined)

export function VideosProvider({ children }: { children: ReactNode }) {
  const [videos, setVideos] = useState<TrackedVideo[]>([])
  const [recentlyDeleted, setRecentlyDeleted] = useState<DeletedVideo | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load videos from IndexedDB on mount
  useEffect(() => {
    const loadVideos = async () => {
      try {
        // Initialize media storage
        await mediaStorage.init()
        
        // Clean up broken videos first
        const brokenVideoIds = await mediaStorage.validateAndCleanupVideos()
        
        // Restore blob URLs for existing videos and get URL mapping
        const urlMapping = await mediaStorage.restoreVideoBlobUrls()
        
        // Load all videos from IndexedDB
        const storedMedia = await mediaStorage.getAllMedia('video')
        
        // Convert stored format back to TrackedVideo format
        const loadedVideos: TrackedVideo[] = storedMedia.map(item => {
          // Use restored URL if available, otherwise use stored URL
          const finalUrl = urlMapping.get(item.id) || item.url
          
          return {
            id: item.id,
            url: finalUrl,
            name: item.metadata.name,
            duration: item.metadata.duration,
            timestamp: new Date(item.metadata.timestamp),
            type: item.metadata.videoType || 'uploaded',
            platform: item.metadata.platform,
            thumbnail: item.metadata.thumbnail,
            title: item.metadata.title,
            details: {
              model: item.metadata.model,
              duration: item.metadata.duration,
              quality: item.metadata.quality,
              aspectRatio: item.metadata.aspectRatio,
              prompt: item.metadata.prompt,
              id: item.metadata.id,
              createdAt: item.metadata.createdAt,
              originalUrl: item.metadata.originalUrl
            },
            createdAt: item.metadata.createdAt
          }
        })
        
        // Sort by timestamp, newest first
        loadedVideos.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        
        setVideos(loadedVideos)
      } catch (error) {
        console.error('Failed to load videos from storage:', error)
      }
      setIsInitialized(true)
    }
    
    loadVideos()
  }, [])

  // Save video to IndexedDB
  const saveVideoToStorage = useCallback(async (video: TrackedVideo) => {
    try {
      await mediaStorage.saveMedia('video', {
        id: video.id,
        url: video.url,
        type: 'video',
        metadata: {
          name: video.name,
          title: video.title,
          duration: video.duration,
          timestamp: video.timestamp.toISOString(),
          videoType: video.type,
          platform: video.platform,
          thumbnail: video.thumbnail,
          model: video.details?.model,
          quality: video.details?.quality,
          aspectRatio: video.details?.aspectRatio,
          prompt: video.details?.prompt,
          id: video.details?.id,
          createdAt: video.details?.createdAt || video.createdAt
        }
      })
    } catch (error) {
      console.error('Failed to save video to storage:', error)
    }
  }, [])

  const addVideo = useCallback(async (videoData: Omit<TrackedVideo, 'id' | 'timestamp'>) => {
    const videoId = `vid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const newVideo: TrackedVideo = {
      ...videoData,
      id: videoId,
      url: videoData.url, // Start with original URL
      timestamp: new Date()
    }
    
    // Check for duplicates before adding
    const exists = videos.some(vid => 
      vid.url === videoData.url || 
      (vid.details?.originalUrl && vid.details.originalUrl === videoData.url)
    )
    if (exists) {
      console.log('Video already exists, skipping:', videoData.url)
      return newVideo
    }
    
    // Add video to UI immediately for better UX
    setVideos(prev => [newVideo, ...prev])
    
    // If this is an external URL (from Replicate or other services), download and store locally
    if (videoData.url && !videoData.url.startsWith('blob:') && !videoData.url.startsWith('data:')) {
      try {
        console.log('Processing external video URL:', videoData.url)
        
        const processedUrl = await mediaStorage.downloadAndStoreVideo(
          videoData.url,
          videoId,
          {
            name: videoData.name,
            title: videoData.title,
            duration: videoData.duration,
            timestamp: new Date().toISOString(),
            videoType: videoData.type,
            platform: videoData.platform,
            thumbnail: videoData.thumbnail,
            model: videoData.details?.model,
            quality: videoData.details?.quality,
            aspectRatio: videoData.details?.aspectRatio,
            prompt: videoData.details?.prompt,
            id: videoData.details?.id,
            createdAt: videoData.details?.createdAt || videoData.createdAt,
            originalUrl: videoData.url // Store original URL for reference
          }
        )
        
        // Update the video with the processed blob URL
        if (processedUrl !== videoData.url) {
          console.log('Video processed successfully, updating URL:', processedUrl)
          setVideos(prev => prev.map(vid => 
            vid.id === videoId 
              ? { 
                  ...vid, 
                  url: processedUrl,
                  details: {
                    ...vid.details,
                    originalUrl: videoData.url
                  }
                }
              : vid
          ))
        }
      } catch (error) {
        console.error('Failed to download video:', error)
        // Video remains with original URL - might work temporarily
        
        // Still save to storage with original URL for future retry
        try {
          await saveVideoToStorage(newVideo)
        } catch (saveError) {
          console.error('Failed to save video to storage:', saveError)
        }
      }
    } else {
      // For blob/data URLs, save immediately
      await saveVideoToStorage(newVideo)
    }
    
    return newVideo
  }, [videos, saveVideoToStorage])

  const removeVideo = useCallback(async (id: string) => {
    const videoToDelete = videos.find(vid => vid.id === id)
    if (!videoToDelete) return
    
    // Store for potential undo
    setRecentlyDeleted({
      ...videoToDelete,
      deletedAt: new Date()
    })
    
    setVideos(prev => prev.filter(vid => vid.id !== id))
    
    // Remove from IndexedDB
    try {
      await mediaStorage.deleteMedia('video', id)
    } catch (error) {
      console.error('Failed to remove video from storage:', error)
    }
    
    // Clear recently deleted after 10 seconds
    setTimeout(() => {
      setRecentlyDeleted(prev => prev?.id === id ? null : prev)
    }, 10000)
  }, [videos])

  const removeVideoWithConfirmation = useCallback(async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.confirm('Are you sure you want to delete this video? You can undo this action for 10 seconds.')) {
        removeVideo(id)
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }, [removeVideo])

  const undoDelete = useCallback(async () => {
    if (!recentlyDeleted) return
    
    const { deletedAt, ...videoData } = recentlyDeleted
    
    // Re-add the video
    setVideos(prev => [videoData, ...prev])
    
    // Re-save to IndexedDB
    await saveVideoToStorage(videoData)
    
    // Clear the recently deleted
    setRecentlyDeleted(null)
  }, [recentlyDeleted, saveVideoToStorage])

  const clearVideos = useCallback(async () => {
    setVideos([])
    
    // Clear from IndexedDB
    try {
      await mediaStorage.clearMedia('video')
    } catch (error) {
      console.error('Failed to clear videos from storage:', error)
    }
  }, [])

  const getVideoById = useCallback((id: string) => {
    return videos.find(vid => vid.id === id)
  }, [videos])

  const cleanupBrokenVideos = useCallback(async () => {
    try {
      const brokenVideoIds = await mediaStorage.validateAndCleanupVideos()
      
      if (brokenVideoIds.length > 0) {
        console.log(`Cleaning up ${brokenVideoIds.length} broken videos`)
        // Update local state by removing broken videos
        setVideos(prev => prev.filter(vid => !brokenVideoIds.includes(vid.id)))
      }
      
      return brokenVideoIds.length
    } catch (error) {
      console.error('Failed to cleanup broken videos:', error)
      return 0
    }
  }, [])

  const retryFailedVideo = useCallback(async (videoId: string) => {
    const video = videos.find(v => v.id === videoId)
    if (!video || !video.details?.originalUrl) {
      console.error('Cannot retry video: not found or no original URL')
      return false
    }

    try {
      console.log('Retrying failed video:', videoId, video.details.originalUrl)
      
      const processedUrl = await mediaStorage.downloadAndStoreVideo(
        video.details.originalUrl,
        videoId,
        {
          name: video.name,
          title: video.title,
          duration: video.duration,
          timestamp: video.timestamp.toISOString(),
          videoType: video.type,
          platform: video.platform,
          thumbnail: video.thumbnail,
          model: video.details?.model,
          quality: video.details?.quality,
          aspectRatio: video.details?.aspectRatio,
          prompt: video.details?.prompt,
          id: video.details?.id,
          createdAt: video.details?.createdAt,
          originalUrl: video.details.originalUrl
        }
      )
      
      if (processedUrl !== video.details.originalUrl) {
        // Update the video with the new processed URL
        setVideos(prev => prev.map(vid => 
          vid.id === videoId 
            ? { ...vid, url: processedUrl }
            : vid
        ))
        console.log('Video retry successful:', videoId)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to retry video:', videoId, error)
      return false
    }
  }, [videos])

  return (
    <VideosContext.Provider value={{ 
      videos,
      recentlyDeleted,
      addVideo, 
      removeVideo, 
      removeVideoWithConfirmation,
      undoDelete,
      clearVideos,
      getVideoById,
      cleanupBrokenVideos,
      retryFailedVideo
    }}>
      {children}
    </VideosContext.Provider>
  )
}

export function useVideos() {
  const context = useContext(VideosContext)
  if (context === undefined) {
    throw new Error('useVideos must be used within a VideosProvider')
  }
  return context
}
