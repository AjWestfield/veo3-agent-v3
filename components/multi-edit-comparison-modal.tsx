"use client"

import { useState } from 'react'
import { X, Download, Edit3, Expand } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MultiEditComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  resultUrl: string
  sourceImages: string[]
  prompt: string
  onEditImage?: (url: string, alt: string) => void
}

export function MultiEditComparisonModal({ 
  isOpen, 
  onClose, 
  resultUrl, 
  sourceImages, 
  prompt,
  onEditImage
}: MultiEditComparisonModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleDownload = async () => {
    try {
      const response = await fetch(resultUrl)
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-7xl max-h-[90vh] bg-[#1a1a1a] border border-[#4a4a4a] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#4a4a4a] bg-[#1f1f1f]">
            <div>
              <h2 className="text-lg font-semibold text-white">Multi-Image Edit Result</h2>
              {prompt && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                  <span className="font-medium">Edit prompt:</span> {prompt}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-5">
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Result Image */}
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-medium text-white">Final Result</h3>
                  <div className="flex items-center gap-2">
                    {onEditImage && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 bg-[#2f2f2f]/50 backdrop-blur-sm border-[#4a4a4a] text-white hover:bg-[#3f3f3f] hover:border-[#5a5a5a]"
                        onClick={() => onEditImage(resultUrl, 'Multi-edit result')}
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleDownload}
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Download
                    </Button>
                  </div>
                </div>
                <div 
                  className="flex-1 bg-gradient-to-br from-[#252525] to-[#1a1a1a] rounded-xl p-4 border border-[#3a3a3a] hover:border-blue-500/50 transition-all duration-300 cursor-pointer group relative flex items-center justify-center"
                  onClick={() => setSelectedImage(resultUrl)}
                  style={{ maxHeight: 'calc(90vh - 200px)' }}
                >
                  <img 
                    src={resultUrl} 
                    alt="Multi-edit result" 
                    className="max-w-full max-h-full object-contain"
                    style={{ maxHeight: 'calc(90vh - 220px)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg">
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      <div className="bg-white/10 backdrop-blur-md rounded-full p-2.5 border border-white/20">
                        <Expand className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Source Images */}
              <div className="flex flex-col lg:w-[400px]">
                <h3 className="text-base font-medium text-white mb-3">Source Images ({sourceImages.length})</h3>
                <div className="flex-1 bg-gradient-to-br from-[#252525] to-[#1a1a1a] rounded-xl border border-[#3a3a3a] p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                  <div className="grid grid-cols-2 gap-3">
                      {sourceImages.map((sourceUrl, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer rounded-lg overflow-hidden border border-[#3a3a3a] hover:border-blue-500/50 transition-all duration-300"
                          onClick={() => setSelectedImage(sourceUrl)}
                        >
                          <img
                            src={sourceUrl}
                            alt={`Source image ${index + 1}`}
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2">
                              <div className="bg-white/10 backdrop-blur-md rounded-full p-1.5 border border-white/20">
                                <Expand className="h-3.5 w-3.5 text-white" />
                              </div>
                            </div>
                          </div>
                          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
                            #{index + 1}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <>
          <div 
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setSelectedImage(null)}
          />
          <div className="fixed inset-4 md:inset-8 z-[60] flex items-center justify-center animate-in zoom-in-95 duration-200">
            <div className="relative max-w-6xl max-h-[90vh] rounded-xl overflow-hidden bg-gradient-to-br from-[#2f2f2f] to-[#1f1f1f] border border-[#4a4a4a] shadow-2xl">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 z-10">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">
                    {selectedImage === resultUrl ? 'Multi-Edit Result' : 'Source Image'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:scale-110"
                    aria-label="Close image viewer"
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>
              {selectedImage === resultUrl && (
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
              )}
              <img 
                src={selectedImage} 
                alt="Full size view"
                className="max-w-full max-h-[90vh] object-contain"
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}