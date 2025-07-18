"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImagePromptEnhancer } from '@/components/ui/image-prompt-enhancer'
import { Notification } from '@/components/notification'
import { VideoProcessingPlaceholder } from '@/components/video-processing-placeholder'
import { getAspectRatioString } from '@/lib/image-utils'

interface ImageAnimationModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onAnimationComplete: (videoUrl: string, prompt: string, originalImageUrl: string, videoMetadata?: any) => void
}

export function ImageAnimationModal({ isOpen, onClose, imageUrl, onAnimationComplete }: ImageAnimationModalProps) {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState<5 | 10>(5)
  const [quality, setQuality] = useState<'standard' | 'pro'>('standard')
  const [isAnimating, setIsAnimating] = useState(false)
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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPrompt('')
      setDuration(5)
      setQuality('standard')
      setIsAnimating(false)
      setNotification(null)
      setImageDimensions(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleAnimate = async () => {
    if (!prompt.trim()) {
      setNotification({
        message: "Error",
        description: "Please enter an animation prompt"
      })
      return
    }

    setIsAnimating(true)
    
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: 'kling-2.1',
          duration,
          quality,
          startImage: imageUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to animate image')
      }

      const data = await response.json()
      console.log('Animation response data:', data)
      
      const videoMetadata = {
        model: 'kling-2.1',
        duration: data.duration || duration,
        quality: data.quality || quality,
        prompt: prompt.trim(),
        originalImageUrl: imageUrl,
        aspectRatio: data.aspectRatio,
        predictionId: data.predictionId,
        createdAt: data.createdAt
      }
      
      onAnimationComplete(data.videoUrl, prompt.trim(), imageUrl, videoMetadata)
      onClose()
    } catch (error) {
      console.error('Animation error:', error)
      setNotification({
        message: "Animation failed",
        description: error instanceof Error ? error.message : "Failed to animate image"
      })
    } finally {
      setIsAnimating(false)
    }
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={isAnimating ? undefined : onClose}
      />
      
      {/* Modal Container - Flexbox Centered */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-lg bg-[#1a1a1a] border border-[#4a4a4a] p-6 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {isAnimating ? (
          <div className="py-12">
            <VideoProcessingPlaceholder 
              model="kling-2.1"
              message="Animating your image"
              subMessage={prompt.length > 50 
                ? `Prompt: "${prompt.substring(0, 50)}..."` 
                : `Prompt: "${prompt}"`
              }
            />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#4a4a4a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Animate Image</h2>
                  <p className="text-sm text-gray-400">Create animated video with AI</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors group"
                disabled={isAnimating}
                aria-label="Close modal"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="group-hover:scale-110 transition-transform">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Image Preview */}
            <div className="mb-6">
              <Label className="text-white mb-3 block text-sm font-medium">
                Image to Animate
                {imageDimensions && (
                  <span className="text-xs text-gray-400 font-normal ml-2 bg-[#2f2f2f] px-2 py-1 rounded">
                    {imageDimensions.width} × {imageDimensions.height} ({getAspectRatioString(imageDimensions.width, imageDimensions.height)})
                  </span>
                )}
              </Label>
              <div className="relative rounded-lg overflow-hidden bg-black/20 border border-[#4a4a4a] group">
                <img 
                  src={imageUrl} 
                  alt="Image to animate" 
                  className="w-full max-h-64 object-contain transition-transform group-hover:scale-[1.02]"
                />
                {/* Gradient overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                {/* Play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Animation Settings */}
            <div className="mb-6">
              <Label className="text-white mb-3 block text-sm font-medium">
                Animation Settings
                <span className="text-xs text-gray-400 ml-2">Configure video output</span>
              </Label>
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#2f2f2f] rounded-lg border border-[#4a4a4a]">
              <div>
                <Label htmlFor="duration" className="text-white mb-2 block text-sm font-medium">
                  Duration
                </Label>
                <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value) as 5 | 10)}>
                  <SelectTrigger className="bg-[#2f2f2f] border-[#4a4a4a] text-white hover:bg-[#3f3f3f] hover:border-[#5a5a5a] transition-colors focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 h-12">
                    <SelectValue placeholder="Select duration">
                      {duration === 5 && "5 seconds"}
                      {duration === 10 && "10 seconds"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#2f2f2f] border-[#4a4a4a] z-[9999] min-w-[120px] shadow-xl">
                    <SelectItem value="5" className="text-white hover:bg-[#3f3f3f] focus:bg-[#3f3f3f] cursor-pointer py-2 px-3">
                      5 seconds
                    </SelectItem>
                    <SelectItem value="10" className="text-white hover:bg-[#3f3f3f] focus:bg-[#3f3f3f] cursor-pointer py-2 px-3">
                      10 seconds
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quality" className="text-white mb-2 block text-sm font-medium">
                  Quality
                </Label>
                <Select value={quality} onValueChange={(value) => setQuality(value as 'standard' | 'pro')}>
                  <SelectTrigger className="bg-[#2f2f2f] border-[#4a4a4a] text-white hover:bg-[#3f3f3f] hover:border-[#5a5a5a] transition-colors focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 h-12">
                    <SelectValue placeholder="Select quality">
                      {quality === 'standard' && "Standard"}
                      {quality === 'pro' && "Pro"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#2f2f2f] border-[#4a4a4a] z-[9999] min-w-[120px] shadow-xl">
                    <SelectItem value="standard" className="text-white hover:bg-[#3f3f3f] focus:bg-[#3f3f3f] cursor-pointer py-2 px-3">
                      Standard
                    </SelectItem>
                    <SelectItem value="pro" className="text-white hover:bg-[#3f3f3f] focus:bg-[#3f3f3f] cursor-pointer py-2 px-3">
                      Pro
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>
            </div>

            {/* Animation Prompt */}
            <div className="mb-6 space-y-3">
              <Label htmlFor="animation-prompt" className="text-white text-sm font-medium">
                Animation Description
                <span className="text-xs text-gray-400 ml-2">Describe the movement you want</span>
              </Label>
              <ImagePromptEnhancer
                id="animation-prompt"
                value={prompt}
                onChange={setPrompt}
                placeholder="e.g., Gentle swaying in the wind, Slow zoom in, Camera panning left to right, Subtle breathing motion..."
                className="bg-[#2f2f2f] border-[#4a4a4a] text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/50 transition-all min-h-[80px] resize-none"
                disabled={isAnimating}
                imageUrls={[imageUrl]}
              />
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-[#2f2f2f] px-3 py-2 rounded-md border border-[#4a4a4a]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <span>Powered by Kling 2.1 AI • {duration}-second video • {quality === 'standard' ? '720p' : '1080p'} resolution</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-[#4a4a4a]">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isAnimating}
                className="bg-transparent border-[#4a4a4a] text-white hover:bg-[#404040] hover:border-[#5a5a5a] transition-all px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAnimate}
                disabled={isAnimating || !prompt.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6"
              >
                {isAnimating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    Creating Animation...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Create Animation
                  </>
                )}
              </Button>
            </div>
          </>
        )}
        </div>
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