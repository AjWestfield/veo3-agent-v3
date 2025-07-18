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

export interface DeletedImage extends TrackedImage {
  deletedAt: Date
}

interface ImagesContextType {
  images: TrackedImage[]
  selectedImageIds: string[]
  recentlyDeleted: DeletedImage | null
  addImage: (image: Omit<TrackedImage, 'id' | 'timestamp'>) => TrackedImage
  removeImage: (id: string) => void
  removeImageWithConfirmation: (id: string) => Promise<boolean>
  undoDelete: () => void
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
  const [recentlyDeleted, setRecentlyDeleted] = useState<DeletedImage | null>(null)
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
    const imageToDelete = images.find(img => img.id === id)
    if (!imageToDelete) return
    
    // Store for potential undo
    setRecentlyDeleted({
      ...imageToDelete,
      deletedAt: new Date()
    })
    
    setImages(prev => prev.filter(img => img.id !== id))
    setSelectedImageIds(prev => prev.filter(selectedId => selectedId !== id))
    
    // Remove from IndexedDB
    try {
      await mediaStorage.deleteMedia('image', id)
    } catch (error) {
      console.error('Failed to remove image from storage:', error)
    }
    
    // Clear recently deleted after 10 seconds
    setTimeout(() => {
      setRecentlyDeleted(prev => prev?.id === id ? null : prev)
    }, 10000)
  }, [images])

  const removeImageWithConfirmation = useCallback(async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.confirm('Are you sure you want to delete this image? You can undo this action for 10 seconds.')) {
        removeImage(id)
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }, [removeImage])

  const undoDelete = useCallback(async () => {
    if (!recentlyDeleted) return
    
    const { deletedAt, ...imageData } = recentlyDeleted
    
    // Re-add the image
    setImages(prev => [imageData, ...prev])
    
    // Re-save to IndexedDB if it was persisted
    if (imageData.persist !== false) {
      await saveImageToStorage(imageData)
    }
    
    // Clear the recently deleted
    setRecentlyDeleted(null)
  }, [recentlyDeleted, saveImageToStorage])

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
      recentlyDeleted,
      addImage, 
      removeImage, 
      removeImageWithConfirmation,
      undoDelete,
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
