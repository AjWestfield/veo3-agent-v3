"use client"

import { useState } from 'react'
import { X, Download, Edit3, Expand } from 'lucide-react'
import { ScrollAreaSafe } from '@/components/ui/scroll-area-safe'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface MultiImageResultProps {
  isOpen: boolean
  onClose: () => void
  resultImage: string
  sourceImages: string[]
  prompt: string
  resultDimensions?: string
  onEditImage?: (url: string, alt: string) => void
  onMultiEditClick?: () => void
}

export function MultiImageResult({ 
  isOpen, 
  onClose, 
  resultImage, 
  sourceImages, 
  prompt,
  resultDimensions,
  onEditImage,
  onMultiEditClick
}: MultiImageResultProps) {
  const [selectedSourceImage, setSelectedSourceImage] = useState<string | null>(null)
  const [selectedResultImage, setSelectedResultImage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleDownload = async () => {
    try {
      const response = await fetch(resultImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `multi-edited-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-6xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[#1a1a1a] border border-[#4a4a4a] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#4a4a4a] shrink-0 bg-[#1f1f1f]">
          <div>
            <h2 className="text-xl font-semibold text-white">Multi-Image Edit Result</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Combined {sourceImages.length} images into one
              {resultDimensions && ` • ${resultDimensions}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Result Image */}
            <div className="space-y-4 flex flex-col">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-white text-lg font-medium">Edited Result</Label>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Expand className="h-3 w-3" />
                    Click image to expand
                  </span>
                </div>
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] border-2 border-[#3a3a3a] hover:border-blue-500/50 transition-all duration-300 group cursor-pointer shadow-lg">
                  <img 
                    src={resultImage} 
                    alt="Multi-edited result" 
                    className="w-full h-auto max-h-[450px] object-contain"
                    onClick={() => setSelectedResultImage(resultImage)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      <div className="bg-white/10 backdrop-blur-md rounded-full p-2.5 border border-white/20">
                        <Expand className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons positioned below the image */}
                <div className="flex gap-2 justify-center mt-2">
                  {onEditImage && (
                    <Button
                      size="default"
                      variant="outline"
                      className="bg-[#2f2f2f]/50 backdrop-blur-sm border-[#4a4a4a] text-white hover:bg-[#3f3f3f] hover:border-[#5a5a5a] transition-all"
                      onClick={() => onEditImage(resultImage, 'Multi-edited result')}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {onMultiEditClick && (
                    <Button
                      size="default"
                      variant="outline"
                      className="bg-[#2f2f2f]/50 backdrop-blur-sm border-[#4a4a4a] text-white hover:bg-[#3f3f3f] hover:border-[#5a5a5a] transition-all"
                      onClick={onMultiEditClick}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Multi-Edit
                    </Button>
                  )}
                  <Button
                    size="default"
                    className="bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-lg hover:shadow-xl"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Prompt */}
              <div className="mt-auto">
                <Label className="text-white mb-2 block text-sm font-medium">Edit Prompt</Label>
                <div className="bg-[#2f2f2f]/50 backdrop-blur-sm border border-[#4a4a4a] rounded-lg p-3 text-sm text-gray-300">
                  {prompt}
                </div>
              </div>
            </div>

            {/* Source Images */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-white text-lg font-medium">Source Images ({sourceImages.length})</Label>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Expand className="h-3 w-3" />
                  Click to view full size
                </span>
              </div>
              <ScrollAreaSafe className="flex-1 rounded-xl border-2 border-[#4a4a4a] bg-gradient-to-br from-[#252525] to-[#1a1a1a] p-4">
                <div className="grid grid-cols-2 gap-3">
                  {sourceImages.map((image, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-[#3a3a3a] hover:border-blue-500/50 transition-all duration-300 shadow-md hover:shadow-xl"
                      onClick={() => setSelectedSourceImage(image)}
                    >
                      <img
                        src={image}
                        alt={`Source image ${index + 1}`}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
                          <div className="bg-white/10 backdrop-blur-md rounded-full p-1.5 border border-white/20">
                            <Expand className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="text-white text-xs font-medium bg-black/50 px-2 py-0.5 rounded">
                            View
                          </span>
                        </div>
                      </div>
                      <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                        #{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollAreaSafe>
            </div>
          </div>
        </div>
      </div>

      {/* Source Image Viewer Modal */}
      {selectedSourceImage && (
        <>
          <div 
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setSelectedSourceImage(null)}
          />
          <div className="fixed inset-4 md:inset-8 z-[60] flex items-center justify-center animate-in zoom-in-95 duration-200">
            <div className="relative max-w-4xl max-h-[90vh] rounded-xl overflow-hidden bg-gradient-to-br from-[#2f2f2f] to-[#1f1f1f] border border-[#4a4a4a] shadow-2xl">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 z-10">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Source Image</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSourceImage(null)}
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:scale-110"
                    aria-label="Close image viewer"
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>
              <img 
                src={selectedSourceImage} 
                alt="Source image"
                className="max-w-full max-h-[90vh] object-contain"
              />
            </div>
          </div>
        </>
      )}

      {/* Result Image Viewer Modal */}
      {selectedResultImage && (
        <>
          <div 
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setSelectedResultImage(null)}
          />
          <div className="fixed inset-4 md:inset-8 z-[60] flex items-center justify-center animate-in zoom-in-95 duration-200">
            <div className="relative max-w-5xl max-h-[90vh] rounded-xl overflow-hidden bg-gradient-to-br from-[#2f2f2f] to-[#1f1f1f] border border-[#4a4a4a] shadow-2xl">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 z-10">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Multi-Edit Result - Full View</span>
                  <button
                    type="button"
                    onClick={() => setSelectedResultImage(null)}
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:scale-110"
                    aria-label="Close image viewer"
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4 z-10">
                <div className="flex items-center justify-center gap-3">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Full Size
                  </Button>
                </div>
              </div>
              <img 
                src={selectedResultImage} 
                alt="Multi-edited result"
                className="max-w-full max-h-[90vh] object-contain"
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}