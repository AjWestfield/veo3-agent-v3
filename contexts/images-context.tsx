"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface TrackedImage {
  id: string
  url: string
  prompt?: string
  model?: string
  timestamp: Date
  type: 'generated' | 'edited' | 'uploaded'
  originalUrl?: string // for edited images
}

interface ImagesContextType {
  images: TrackedImage[]
  addImage: (image: Omit<TrackedImage, 'id' | 'timestamp'>) => void
  removeImage: (id: string) => void
  clearImages: () => void
  getImageById: (id: string) => TrackedImage | undefined
}

const ImagesContext = createContext<ImagesContextType | undefined>(undefined)

export function ImagesProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<TrackedImage[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load images from localStorage on mount
  useEffect(() => {
    const savedImages = localStorage.getItem('trackedImages')
    if (savedImages) {
      try {
        const parsed = JSON.parse(savedImages)
        // Convert timestamp strings back to Date objects
        const imagesWithDates = parsed.map((img: any) => ({
          ...img,
          timestamp: new Date(img.timestamp)
        }))
        setImages(imagesWithDates)
      } catch (error) {
        console.error('Failed to parse saved images:', error)
      }
    }
    setIsInitialized(true)
  }, [])

  // Save images to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('trackedImages', JSON.stringify(images))
    }
  }, [images, isInitialized])

  const addImage = (imageData: Omit<TrackedImage, 'id' | 'timestamp'>) => {
    const newImage: TrackedImage = {
      ...imageData,
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
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
  }

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const clearImages = () => {
    setImages([])
    localStorage.removeItem('trackedImages')
  }

  const getImageById = (id: string) => {
    return images.find(img => img.id === id)
  }

  return (
    <ImagesContext.Provider value={{ 
      images, 
      addImage, 
      removeImage, 
      clearImages,
      getImageById 
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