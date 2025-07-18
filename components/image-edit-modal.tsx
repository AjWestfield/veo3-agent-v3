"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ImagePromptEnhancer } from '@/components/ui/image-prompt-enhancer'
import { Notification } from '@/components/notification'
import { getAspectRatioString, getClosestStandardSize } from '@/lib/image-utils'
import { ImageProcessingPlaceholder } from '@/components/image-processing-placeholder'

interface ImageEditModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onEditComplete: (editedImageUrl: string, prompt: string, originalUrl: string, resultDimensions?: string) => void
}

export function ImageEditModal({ isOpen, onClose, imageUrl, onEditComplete }: ImageEditModalProps) {
  const [prompt, setPrompt] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [notification, setNotification] = useState<{ message: string; description?: string } | null>(null)
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)

  // Detect image dimensions when modal opens
  useEffect(() => {
    if (isOpen && imageUrl) {
      const img = new Image()
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        })
      }
      img.src = imageUrl
    }
  }, [isOpen, imageUrl])

  if (!isOpen) return null

  const handleEdit = async () => {
    if (!prompt.trim()) {
      setNotification({
        message: "Error",
        description: "Please enter an edit prompt"
      })
      return
    }

    setIsEditing(true)
    
    try {
      const standardSize = imageDimensions ? getClosestStandardSize(imageDimensions.width, imageDimensions.height) : undefined
      if (standardSize && imageDimensions) {
        console.log(`Using standard size ${standardSize} for original ${imageDimensions.width}x${imageDimensions.height}`)
      }
      
      const response = await fetch('/api/edit-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          prompt: prompt.trim(),
          ...(standardSize && { size: standardSize }),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to edit image')
      }

      const data = await response.json()
      console.log('Edit response data:', data)
      onEditComplete(data.imageUrl, prompt.trim(), imageUrl, data.resultDimensions)
      onClose()
    } catch (error) {
      setNotification({
        message: "Edit failed",
        description: error instanceof Error ? error.message : "Failed to edit image"
      })
    } finally {
      setIsEditing(false)
    }
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={isEditing ? undefined : onClose}
      />
      
      {/* Modal Content */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[#1a1a1a] border border-[#4a4a4a] p-6 shadow-xl">
        {isEditing ? (
          <div className="py-12">
            <ImageProcessingPlaceholder 
              type="editing" 
              message="Applying your edits"
              subMessage={prompt.length > 50 
                ? `Editing with: "${prompt.substring(0, 50)}..."` 
                : `Editing with: "${prompt}"`
              }
            />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Edit Image</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                disabled={isEditing}
                aria-label="Close modal"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

        {/* Image Preview */}
        <div className="mb-6">
          <Label className="text-white mb-2 block">
            Original Image
            {imageDimensions && (
              <span className="text-xs text-gray-400 font-normal ml-2">
                {imageDimensions.width} × {imageDimensions.height} ({getAspectRatioString(imageDimensions.width, imageDimensions.height)})
              </span>
            )}
          </Label>
          <div className="relative rounded-lg overflow-hidden bg-black/20">
            <img 
              src={imageUrl} 
              alt="Original image to edit" 
              className="w-full max-h-64 object-contain"
            />
          </div>
        </div>

        {/* Edit Prompt */}
        <div className="mb-6 space-y-2">
          <Label htmlFor="edit-prompt" className="text-white">
            Describe how you want to edit this image
          </Label>
          <ImagePromptEnhancer
            id="edit-prompt"
            value={prompt}
            onChange={setPrompt}
            placeholder="e.g., Make it look like a painting, Add a sunset in the background, Change to cyberpunk style..."
            className="bg-[#2f2f2f] border-[#4a4a4a] text-white placeholder:text-gray-500"
            disabled={isEditing}
            imageUrls={[imageUrl]}
          />
          <p className="text-xs text-gray-400">
            The image will be edited using Wavespeed AI (Flux Kontext Max) while preserving its aspect ratio
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isEditing}
            className="bg-transparent border-[#4a4a4a] text-white hover:bg-[#404040]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleEdit}
            disabled={isEditing || !prompt.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
          >
            {isEditing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                Editing...
              </>
            ) : (
              'Edit Image'
            )}
          </Button>
        </div>
          </>
        )}
      </div>

      {notification && (
        <Notification
          message={notification.message}
          description={notification.description}
          show={true}
          onHide={() => setNotification(null)}
        />
      )}
    </>
  )
}