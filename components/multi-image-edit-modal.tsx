"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollAreaSafe } from '@/components/ui/scroll-area-safe'
import { Notification } from '@/components/notification'
import { ImageProcessingPlaceholder } from '@/components/image-processing-placeholder'
import { useImages } from '@/contexts/images-context'

interface MultiImageEditModalProps {
  isOpen: boolean
  onClose: () => void
  onEditComplete: (editedImageUrl: string, prompt: string, sourceImages: string[], resultDimensions?: string) => void
}

export function MultiImageEditModal({ isOpen, onClose, onEditComplete }: MultiImageEditModalProps) {
  const { images, selectedImageIds, toggleImageSelection, selectAllImages, deselectAllImages, getSelectedImages } = useImages()
  const [prompt, setPrompt] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [notification, setNotification] = useState<{ message: string; description?: string } | null>(null)

  // Reset selections when modal closes
  useEffect(() => {
    if (!isOpen) {
      deselectAllImages()
      setPrompt('')
    }
  }, [isOpen, deselectAllImages])

  if (!isOpen) return null

  const selectedImages = getSelectedImages()
  const selectedCount = selectedImages.length

  const handleEdit = async () => {
    if (!prompt.trim()) {
      setNotification({
        message: "Error",
        description: "Please enter an edit prompt"
      })
      return
    }

    if (selectedCount === 0) {
      setNotification({
        message: "Error",
        description: "Please select at least one image"
      })
      return
    }

    if (selectedCount > 10) {
      setNotification({
        message: "Error",
        description: "Maximum 10 images can be edited at once"
      })
      return
    }

    setIsEditing(true)
    
    try {
      const response = await fetch('/api/edit-multi-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrls: selectedImages.map(img => img.url),
          prompt: prompt.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to edit images')
      }

      const data = await response.json()
      console.log('Multi-edit response data:', data)
      onEditComplete(data.imageUrl, prompt.trim(), data.sourceImages, data.resultDimensions)
      onClose()
    } catch (error) {
      setNotification({
        message: "Edit failed",
        description: error instanceof Error ? error.message : "Failed to edit images"
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedCount === images.length) {
      deselectAllImages()
    } else {
      selectAllImages()
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
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[#1a1a1a] border border-[#4a4a4a] p-6 shadow-xl">
        {isEditing ? (
          <div className="py-12">
            <ImageProcessingPlaceholder 
              type="editing" 
              message={`Editing ${selectedCount} images`}
              subMessage={prompt.length > 50 
                ? `Prompt: "${prompt.substring(0, 50)}..."` 
                : `Prompt: "${prompt}"`
              }
            />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Edit Multiple Images</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Select up to 10 images to edit together
                  {selectedCount > 0 && ` • ${selectedCount} selected`}
                </p>
              </div>
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

            {/* Image Selection Grid */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-white">Select Images</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  {selectedCount === images.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <ScrollAreaSafe className="h-64 w-full rounded-lg border border-[#4a4a4a] bg-black/20 p-4">
                <div className="grid grid-cols-4 gap-3">
                  {images.map((image) => {
                    const isSelected = selectedImageIds.includes(image.id)
                    return (
                      <div
                        key={image.id}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected 
                            ? 'border-blue-500 ring-2 ring-blue-500/30' 
                            : 'border-transparent hover:border-[#4a4a4a]'
                        }`}
                        onClick={() => toggleImageSelection(image.id)}
                      >
                        <img
                          src={image.url}
                          alt={image.prompt || 'Image'}
                          className="w-full aspect-square object-cover"
                        />
                        <div className={`absolute inset-0 bg-black/60 transition-opacity ${
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          <div className="absolute top-2 right-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleImageSelection(image.id)}
                              className="bg-white/10 border-white/50 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollAreaSafe>
            </div>

            {/* Edit Prompt */}
            <div className="mb-6 space-y-2">
              <Label htmlFor="multi-edit-prompt" className="text-white">
                Describe how you want to combine and edit these images
              </Label>
              <Textarea
                id="multi-edit-prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Combine all elements into a single scene, Create a collage with these images, Merge the subjects wearing different outfits..."
                className="min-h-[100px] bg-[#2f2f2f] border-[#4a4a4a] text-white placeholder:text-gray-500"
                disabled={isEditing}
              />
              <p className="text-xs text-gray-400">
                The selected images will be combined and edited using Wavespeed AI (Flux Kontext Max Multi)
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
                disabled={isEditing || !prompt.trim() || selectedCount === 0 || selectedCount > 10}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
              >
                {isEditing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    Editing...
                  </>
                ) : (
                  `Edit ${selectedCount} ${selectedCount === 1 ? 'Image' : 'Images'}`
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