"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ImagePromptEnhancer } from '@/components/ui/image-prompt-enhancer'
import { Checkbox } from '@/components/ui/checkbox'
import { Notification } from '@/components/notification'
import { ImageProcessingPlaceholder } from '@/components/image-processing-placeholder'
import { useImages } from '@/contexts/images-context'

interface MultiImageEditModalProps {
  isOpen: boolean
  onClose: () => void
  onEditComplete: (editedImageUrl: string, prompt: string, sourceImages: string[], resultDimensions?: string) => void
  onSendPrompt?: (prompt: string) => void
  specificImages?: Array<{ id: string; url: string; prompt?: string }> // Optional specific images for chat input
}

export function MultiImageEditModal({ isOpen, onClose, onEditComplete, onSendPrompt, specificImages }: MultiImageEditModalProps) {
  const { images, selectedImageIds, toggleImageSelection, selectAllImages, deselectAllImages, getSelectedImages } = useImages()
  const [prompt, setPrompt] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [notification, setNotification] = useState<{ message: string; description?: string } | null>(null)
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  
  // State for managing specific image selections when using specificImages prop
  const [specificSelectedIds, setSpecificSelectedIds] = useState<string[]>([])
  
  // Determine which images to use: specificImages prop or global images context
  const usingSpecificImages = Boolean(specificImages && specificImages.length > 0)
  const displayImages = usingSpecificImages ? specificImages! : images
  const currentSelectedIds = usingSpecificImages ? specificSelectedIds : selectedImageIds

  // Reset selections when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (!usingSpecificImages) {
        deselectAllImages()
      }
      setSpecificSelectedIds([])
      setPrompt('')
      setPromptSuggestions([])
    }
  }, [isOpen, deselectAllImages, usingSpecificImages])
  
  // Auto-select all specific images when modal opens with specificImages
  useEffect(() => {
    if (isOpen && usingSpecificImages && specificImages) {
      setSpecificSelectedIds(specificImages.map(img => img.id))
    }
  }, [isOpen, usingSpecificImages, specificImages])

  // Get selected images based on mode
  const selectedImages = usingSpecificImages 
    ? specificImages!.filter(img => specificSelectedIds.includes(img.id))
    : getSelectedImages()
  const selectedCount = selectedImages.length
  
  // Helper functions for selection management
  const toggleSelection = (imageId: string) => {
    if (usingSpecificImages) {
      setSpecificSelectedIds(prev => 
        prev.includes(imageId) 
          ? prev.filter(id => id !== imageId)
          : [...prev, imageId]
      )
    } else {
      toggleImageSelection(imageId)
    }
  }
  
  const handleSelectAll = () => {
    if (usingSpecificImages) {
      if (specificSelectedIds.length === displayImages.length) {
        setSpecificSelectedIds([])
      } else {
        setSpecificSelectedIds(displayImages.map(img => img.id))
      }
    } else {
      if (selectedCount === images.length) {
        deselectAllImages()
      } else {
        selectAllImages()
      }
    }
  }

  // Fetch prompt suggestions when images are selected
  useEffect(() => {
    if (isOpen && selectedCount >= 2) {
      fetchPromptSuggestions()
    } else {
      setPromptSuggestions([])
    }
  }, [selectedCount, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // Auto-fetch suggestions when using specific images (for chat input)
  useEffect(() => {
    if (isOpen && usingSpecificImages && specificImages && specificImages.length >= 2) {
      // Small delay to ensure selectedImages state is updated
      const timer = setTimeout(() => {
        fetchPromptSuggestions()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, usingSpecificImages, specificImages]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPromptSuggestions = async () => {
    if (selectedCount < 2 || isLoadingSuggestions) return
    
    setIsLoadingSuggestions(true)
    
    try {
      // Convert blob URLs to base64 for analysis
      const processedImageUrls = await Promise.all(
        selectedImages.map(async (img) => {
          if (img.url.startsWith('blob:')) {
            try {
              const response = await fetch(img.url)
              const blob = await response.blob()
              return new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })
            } catch (error) {
              console.error('Failed to convert blob URL:', error)
              return img.url
            }
          }
          return img.url
        })
      )
      
      const response = await fetch('/api/suggest-multi-edit-prompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrls: processedImageUrls,
          imageDescriptions: selectedImages.map(img => img.prompt || '')
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }

      const data = await response.json()
      setPromptSuggestions(data.suggestions || [])
    } catch (error) {
      console.error('Error fetching prompt suggestions:', error)
      setPromptSuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion)
  }

  const handleSendPrompt = () => {
    if (!prompt.trim()) return
    
    if (onSendPrompt) {
      onSendPrompt(prompt.trim())
      onClose()
    }
  }

  if (!isOpen) return null

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
      // Convert blob URLs to base64
      const processedImageUrls = await Promise.all(
        selectedImages.map(async (img) => {
          if (img.url.startsWith('blob:')) {
            try {
              // Convert blob URL to base64
              const response = await fetch(img.url)
              const blob = await response.blob()
              return new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(blob)
              })
            } catch (error) {
              console.error('Failed to convert blob URL:', error)
              throw new Error('Failed to process uploaded image')
            }
          }
          return img.url
        })
      )

      const response = await fetch('/api/edit-multi-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrls: processedImageUrls,
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


  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={isEditing ? undefined : onClose}
      />
      
      {/* Modal Content */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-5xl max-h-[92vh] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[#1a1a1a] border border-[#4a4a4a] shadow-xl overflow-hidden flex flex-col">
        {isEditing ? (
          <div className="flex-1 flex items-center justify-center p-8">
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
            <div className="flex items-center justify-between p-4 pb-0 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-white">Edit Multiple Images</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Select up to 10 images to edit together
                  {selectedCount > 0 && ` • ${selectedCount} selected`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                disabled={isEditing}
                aria-label="Close modal"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Image Selection Grid */}
            <div className="px-4 flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-2 shrink-0">
                <Label className="text-white text-sm">Select Images</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs text-gray-400 hover:text-white h-7 px-2"
                >
                  {selectedCount === displayImages.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="w-full rounded-lg border border-[#4a4a4a] bg-black/20 p-3 flex-1 min-h-0 overflow-y-auto">
                <div className={`grid gap-2 ${
                  displayImages.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' :
                  displayImages.length <= 8 ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6' :
                  displayImages.length <= 12 ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8' :
                  'grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10'
                }`}>
                  {displayImages.map((image) => {
                    const isSelected = currentSelectedIds.includes(image.id)
                    return (
                      <div
                        key={image.id}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          isSelected 
                            ? 'border-blue-500 ring-2 ring-blue-500/30' 
                            : 'border-transparent hover:border-[#4a4a4a]'
                        }`}
                        onClick={() => toggleSelection(image.id)}
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
                              onCheckedChange={() => toggleSelection(image.id)}
                              className="bg-white/10 border-white/50 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Prompt Suggestions */}
            {selectedCount >= 2 && (
              <div className="px-4 pb-3 shrink-0">
                {isLoadingSuggestions ? (
                  <div className="flex items-center justify-center py-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Analyzing images for suggestions...</span>
                    </div>
                  </div>
                ) : promptSuggestions.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Suggested prompts based on your selected images:</p>
                    <div className="space-y-2">
                      {promptSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left p-3 rounded-md bg-[#2a2a2a] hover:bg-[#3a3a3a] border border-[#4a4a4a] hover:border-blue-500/50 transition-all group"
                          disabled={isEditing}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5 shrink-0">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                              </svg>
                            </span>
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors leading-relaxed">
                              {suggestion}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Edit Prompt */}
            <div className="px-4 pb-3 space-y-2 shrink-0">
              <Label htmlFor="multi-edit-prompt" className="text-white text-sm">
                Describe how you want to combine and edit these images
              </Label>
              <ImagePromptEnhancer
                id="multi-edit-prompt"
                value={prompt}
                onChange={setPrompt}
                placeholder="e.g., Combine all elements into a single scene, Create a collage with these images, Merge the subjects wearing different outfits..."
                className="bg-[#2f2f2f] border-[#4a4a4a] text-white placeholder:text-gray-500 min-h-[80px]"
                disabled={isEditing}
                imageUrls={selectedImages.map(img => img.url)}
                imageDescriptions={selectedImages.map(img => img.prompt || '')}
              />
              <p className="text-xs text-gray-400">
                The selected images will be combined and edited using Wavespeed AI (Flux Kontext Max Multi)
              </p>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-[#4a4a4a] bg-[#1a1a1a] shrink-0 flex gap-3 justify-between">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isEditing}
                className="bg-transparent border-[#4a4a4a] text-white hover:bg-[#404040] h-8 px-3 text-sm"
              >
                Cancel
              </Button>
              
              <div className="flex gap-2">
                {/* Send prompt as message */}
                <Button
                  onClick={handleSendPrompt}
                  disabled={!prompt.trim()}
                  variant="outline"
                  className="bg-transparent border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:border-gray-500/50 disabled:text-gray-400 h-8 px-3 text-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                    <path d="m22 2-7 20-4-9-9-4Z"/>
                    <path d="M22 2 11 13"/>
                  </svg>
                  Send Prompt
                </Button>
                
                {/* Edit images button */}
                <Button
                  onClick={handleEdit}
                  disabled={isEditing || !prompt.trim() || selectedCount === 0 || selectedCount > 10}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white h-8 px-3 text-sm"
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