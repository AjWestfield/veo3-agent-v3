"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { mediaStorage } from '@/lib/media-storage'

export interface TrackedImage {
  id: string
  url: string
  prompt?: string
  model?: string
  timestamp: Date
  type: 'generated' | 'edited' | 'uploaded' | 'multi-edited'
  originalUrl?: string // for edited images
  sourceImages?: string[] // for multi-edited images
  persist?: boolean
}

interface ImagesContextType {
  images: TrackedImage[]
  selectedImageIds: string[]
  addImage: (image: Omit<TrackedImage, 'id' | 'timestamp'>) => TrackedImage
  removeImage: (id: string) => void
  clearImages: () => void
  getImageById: (id: string) => TrackedImage | undefined
  selectImage: (id: string) => void
  deselectImage: (id: string) => void
  toggleImageSelection: (id: string) => void
  selectAllImages: () => void
  deselectAllImages: () => void
  getSelectedImages: () => TrackedImage[]
}

const ImagesContext = createContext<ImagesContextType | undefined>(undefined)

export function ImagesProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<TrackedImage[]>([])
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load images from IndexedDB on mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        // Initialize media storage
        await mediaStorage.init()
        
        // Migrate from localStorage if needed
        await mediaStorage.migrateFromLocalStorage()
        
        // Load all images from IndexedDB
        const storedMedia = await mediaStorage.getAllMedia('image')
        
        // Convert stored format back to TrackedImage format
        const loadedImages: TrackedImage[] = storedMedia.map(item => ({
          id: item.id,
          url: item.url,
          prompt: item.metadata.prompt,
          model: item.metadata.model,
          timestamp: new Date(item.metadata.timestamp),
          type: item.metadata.imageType || 'generated',
          originalUrl: item.metadata.originalUrl,
          sourceImages: item.metadata.sourceImages,
          persist: true
        }))
        
        // Sort by timestamp, newest first
        loadedImages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        
        setImages(loadedImages)
      } catch (error) {
        console.error('Failed to load images from storage:', error)
      }
      setIsInitialized(true)
    }
    
    loadImages()
  }, [])

  // Save image to IndexedDB whenever a new one is added
  const saveImageToStorage = useCallback(async (image: TrackedImage) => {
    try {
      await mediaStorage.saveMedia('image', {
        id: image.id,
        url: image.url,
        type: 'image',
        metadata: {
          prompt: image.prompt,
          model: image.model,
          timestamp: image.timestamp.toISOString(),
          imageType: image.type,
          originalUrl: image.originalUrl,
          sourceImages: image.sourceImages
        }
      })
    } catch (error) {
      console.error('Failed to save image to storage:', error)
    }
  }, [])

  const addImage = useCallback(async (imageData: Omit<TrackedImage, 'id' | 'timestamp'>) => {
    const newImage: TrackedImage = {
      ...imageData,
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      persist: imageData.persist !== false // Default to true
    }
    
    setImages(prev => {
      // Check if image with same URL already exists
      const exists = prev.some(img => img.url === newImage.url)
      if (exists) {
        return prev
      }
      // Add new image to the beginning of the array
      return [newImage, ...prev]
    })
    
    // Save to IndexedDB if persistence is enabled
    if (newImage.persist !== false) {
      await saveImageToStorage(newImage)
    }
    
    return newImage
  }, [saveImageToStorage])

  const removeImage = useCallback(async (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
    setSelectedImageIds(prev => prev.filter(selectedId => selectedId !== id))
    
    // Remove from IndexedDB
    try {
      await mediaStorage.deleteMedia('image', id)
    } catch (error) {
      console.error('Failed to remove image from storage:', error)
    }
  }, [])

  const clearImages = useCallback(async () => {
    setImages([])
    setSelectedImageIds([])
    
    // Clear from IndexedDB
    try {
      await mediaStorage.clearMedia('image')
    } catch (error) {
      console.error('Failed to clear images from storage:', error)
    }
  }, [])

  const getImageById = useCallback((id: string) => {
    return images.find(img => img.id === id)
  }, [images])

  const selectImage = useCallback((id: string) => {
    setSelectedImageIds(prev => {
      if (!prev.includes(id)) {
        return [...prev, id]
      }
      return prev
    })
  }, [])

  const deselectImage = useCallback((id: string) => {
    setSelectedImageIds(prev => prev.filter(selectedId => selectedId !== id))
  }, [])

  const toggleImageSelection = useCallback((id: string) => {
    setSelectedImageIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id)
      }
      return [...prev, id]
    })
  }, [])

  const selectAllImages = useCallback(() => {
    setSelectedImageIds(images.map(img => img.id))
  }, [images])

  const deselectAllImages = useCallback(() => {
    setSelectedImageIds([])
  }, [])

  const getSelectedImages = useCallback(() => {
    return images.filter(img => selectedImageIds.includes(img.id))
  }, [images, selectedImageIds])

  return (
    <ImagesContext.Provider value={{ 
      images,
      selectedImageIds,
      addImage, 
      removeImage, 
      clearImages,
      getImageById,
      selectImage,
      deselectImage,
      toggleImageSelection,
      selectAllImages,
      deselectAllImages,
      getSelectedImages
    }}>
      {children}
    </ImagesContext.Provider>
  )
}

export function useImages() {
  const context = useContext(ImagesContext)
  if (context === undefined) {
    throw new Error('useImages must be used within an ImagesProvider')
  }
  return context
}
