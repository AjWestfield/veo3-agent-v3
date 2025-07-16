"use client"

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Compare } from '@/components/ui/compare'

interface ImageComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  originalUrl: string
  editedUrl: string
  prompt: string
}

export function ImageComparisonModal({ 
  isOpen, 
  onClose, 
  originalUrl, 
  editedUrl, 
  prompt 
}: ImageComparisonModalProps) {
  const [activeTab, setActiveTab] = useState("split")

  if (!isOpen) return null

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="fixed inset-4 md:inset-8 z-50 flex items-center justify-center">
        <div className="w-full h-full max-w-7xl max-h-[90vh] bg-[#1a1a1a] border border-[#4a4a4a] rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#4a4a4a]">
            <h2 className="text-lg font-semibold text-white">Image Comparison</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Edit prompt display */}
          {prompt && (
            <div className="px-4 py-3 border-b border-[#4a4a4a] bg-[#2f2f2f]">
              <p className="text-sm text-gray-400">
                <span className="font-medium text-white">Edit prompt:</span> {prompt}
              </p>
            </div>
          )}

          {/* Images Container with Tabs */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-4 pt-3">
                <TabsList className="bg-[#2f2f2f] border border-[#4a4a4a] p-1">
                  <TabsTrigger 
                    value="split" 
                    className="text-white data-[state=active]:bg-[#404040] data-[state=active]:text-white"
                  >
                    Split Screen
                  </TabsTrigger>
                  <TabsTrigger 
                    value="slider" 
                    className="text-white data-[state=active]:bg-[#404040] data-[state=active]:text-white"
                  >
                    Slider
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="split" className="flex-1 p-4 overflow-hidden mt-0">
                <div className="h-full relative">
                  <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    {/* Original Image */}
                    <div className="relative flex flex-col h-full">
                      <h3 className="text-sm font-medium text-white mb-2">Original</h3>
                      <div className="flex-1 bg-black/20 rounded-lg overflow-hidden flex items-center justify-center">
                        <img 
                          src={originalUrl} 
                          alt="Original image" 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Edited Image */}
                    <div className="relative flex flex-col h-full">
                      <h3 className="text-sm font-medium text-white mb-2">Edited</h3>
                      <div className="flex-1 bg-black/20 rounded-lg overflow-hidden flex items-center justify-center">
                        <img 
                          src={editedUrl} 
                          alt="Edited image" 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Improved Divider */}
                  <div className="hidden md:block absolute left-1/2 top-8 bottom-0 -translate-x-1/2">
                    <div className="h-full w-px bg-gradient-to-b from-transparent via-[#4a4a4a]/50 to-transparent" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#2f2f2f] border border-[#4a4a4a] rounded-full flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
                        <path d="M8 12H16M12 8V16" />
                      </svg>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="slider" className="flex-1 p-4 overflow-hidden mt-0">
                <div className="h-full flex flex-col">
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-400">Drag the slider to compare images</p>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="p-4 border rounded-3xl bg-black/20 border-[#4a4a4a]">
                      <Compare
                        firstImage={editedUrl}
                        secondImage={originalUrl}
                        firstImageClassName="object-cover object-left-top"
                        secondImageClassname="object-cover object-left-top"
                        className="h-[250px] w-[200px] md:h-[500px] md:w-[500px]"
                        slideMode="drag"
                        autoplay={false}
                        showHandlebar={true}
                        initialSliderPercentage={50}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#4a4a4a] bg-[#2f2f2f]">
            <p className="text-xs text-gray-400 text-center">
              Edited with Wavespeed AI (Flux Kontext Max)
            </p>
          </div>
        </div>
      </div>
    </>
  )
}