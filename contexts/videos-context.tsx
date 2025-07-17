"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { mediaStorage } from '@/lib/media-storage'

export interface TrackedVideo {
  id: string
  url: string
  name?: string
  duration?: number
  timestamp: Date
  type: 'generated' | 'uploaded' | 'downloaded'
  platform?: string // For downloaded videos (youtube, tiktok, etc.)
}

interface VideosContextType {
  videos: TrackedVideo[]
  addVideo: (video: Omit<TrackedVideo, 'id' | 'timestamp'>) => TrackedVideo
  removeVideo: (id: string) => void
  clearVideos: () => void
  getVideoById: (id: string) => TrackedVideo | undefined
}

const VideosContext = createContext<VideosContextType | undefined>(undefined)

export function VideosProvider({ children }: { children: ReactNode }) {
  const [videos, setVideos] = useState<TrackedVideo[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load videos from IndexedDB on mount
  useEffect(() => {
    const loadVideos = async () => {
      try {
        // Initialize media storage
        await mediaStorage.init()
        
        // Load all videos from IndexedDB
        const storedMedia = await mediaStorage.getAllMedia('video')
        
        // Convert stored format back to TrackedVideo format
        const loadedVideos: TrackedVideo[] = storedMedia.map(item => ({
          id: item.id,
          url: item.url,
          name: item.metadata.name,
          duration: item.metadata.duration,
          timestamp: new Date(item.metadata.timestamp),
          type: item.metadata.videoType || 'uploaded',
          platform: item.metadata.platform
        }))
        
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
          duration: video.duration,
          timestamp: video.timestamp.toISOString(),
          videoType: video.type,
          platform: video.platform
        }
      })
    } catch (error) {
      console.error('Failed to save video to storage:', error)
    }
  }, [])

  const addVideo = useCallback(async (videoData: Omit<TrackedVideo, 'id' | 'timestamp'>) => {
    const newVideo: TrackedVideo = {
      ...videoData,
      id: `vid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }
    
    setVideos(prev => {
      // Check if video with same URL already exists
      const exists = prev.some(vid => vid.url === newVideo.url)
      if (exists) {
        return prev
      }
      // Add new video to the beginning of the array
      return [newVideo, ...prev]
    })
    
    // Save to IndexedDB
    await saveVideoToStorage(newVideo)
    
    return newVideo
  }, [saveVideoToStorage])

  const removeVideo = useCallback(async (id: string) => {
    setVideos(prev => prev.filter(vid => vid.id !== id))
    
    // Remove from IndexedDB
    try {
      await mediaStorage.deleteMedia('video', id)
    } catch (error) {
      console.error('Failed to remove video from storage:', error)
    }
  }, [])

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

  return (
    <VideosContext.Provider value={{ 
      videos,
      addVideo, 
      removeVideo, 
      clearVideos,
      getVideoById
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
