"use client"

import React, { useState } from "react"
import { ArrowTopRightOnSquareIcon, DocumentTextIcon, PhotoIcon, QuestionMarkCircleIcon, XMarkIcon } from "@heroicons/react/24/outline"

interface WebSearchResultsProps {
  content: string
  citations?: string[]
  searchResults?: any[]
  images?: any[]
  relatedQuestions?: string[]
  isStreaming?: boolean
  searchProgress?: {
    stage: "searching" | "analyzing" | "formatting"
    message: string
  }
  onRelatedQuestionClick?: (question: string) => void
}

export function WebSearchResults({ 
  content, 
  citations, 
  searchResults, 
  images, 
  relatedQuestions,
  isStreaming,
  searchProgress,
  onRelatedQuestionClick
}: WebSearchResultsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  // Parse the content to extract the main response (before sources section)
  const extractMainContent = () => {
    const sourcesIndex = content.indexOf("### Sources:")
    const searchResultsIndex = content.indexOf("### Search Results:")
    const imagesIndex = content.indexOf("### Related Images:")
    const questionsIndex = content.indexOf("### Related Questions:")
    
    // Find the first section marker
    const firstSectionIndex = Math.min(
      sourcesIndex > -1 ? sourcesIndex : Infinity,
      searchResultsIndex > -1 ? searchResultsIndex : Infinity,
      imagesIndex > -1 ? imagesIndex : Infinity,
      questionsIndex > -1 ? questionsIndex : Infinity
    )
    
    if (firstSectionIndex === Infinity) {
      return content
    }
    
    return content.substring(0, firstSectionIndex).trim()
  }

  // Render the main content with proper formatting
  const renderMainContent = (text: string) => {
    // Split by newlines to preserve paragraph structure
    const paragraphs = text.split('\n\n')
    return paragraphs.map((paragraph, index) => {
      if (paragraph.trim()) {
        return (
          <p key={index} className="text-white/90 mb-4 leading-relaxed">
            {paragraph}
          </p>
        )
      }
      return null
    })
  }

  const mainContent = extractMainContent()

  // Show search progress animation
  if (isStreaming && searchProgress) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">
                {searchProgress.stage === "searching" && "Searching the web..."}
                {searchProgress.stage === "analyzing" && "Analyzing results..."}
                {searchProgress.stage === "formatting" && "Formatting response..."}
              </p>
              <p className="text-white/60 text-sm mt-1">{searchProgress.message}</p>
            </div>
          </div>
          {searchProgress.stage === "searching" && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2 text-white/50 text-sm">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                <span>Querying search engines</span>
              </div>
              <div className="flex items-center space-x-2 text-white/50 text-sm">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Processing search results</span>
              </div>
              <div className="flex items-center space-x-2 text-white/50 text-sm">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Generating response</span>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main content */}
      <div className="prose prose-invert max-w-none">
        {renderMainContent(mainContent)}
      </div>

      {/* Citations Section */}
      {citations && citations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-5 backdrop-blur-sm">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-blue-400" />
            Sources
            <span className="text-xs text-white/50 font-normal ml-1">({citations.length})</span>
          </h3>
          <div className="space-y-3">
            {citations.map((citation, index) => {
              // Extract domain from URL
              let domain = "Source"
              let faviconUrl = ""
              try {
                const url = new URL(citation)
                domain = url.hostname.replace('www.', '')
                // Use Google's favicon service or DuckDuckGo's favicon service
                faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
              } catch (e) {}
              
              return (
                <div key={index} className="flex items-start gap-3 group">
                  <span className="text-blue-400 font-bold min-w-[24px] text-sm bg-blue-500/20 w-6 h-6 rounded-full flex items-center justify-center">{index + 1}</span>
                  <div className="flex-1">
                    <a 
                      href={citation} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white/90 hover:text-white transition-colors flex items-start gap-2"
                    >
                      <div className="flex items-start gap-2 flex-1">
                        {faviconUrl && (
                          <img 
                            src={faviconUrl} 
                            alt={`${domain} favicon`}
                            className="w-4 h-4 mt-0.5 rounded-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-0.5">{domain}</div>
                          <div className="text-xs text-white/60 group-hover:text-white/80 break-all line-clamp-2">{citation}</div>
                        </div>
                      </div>
                      <ArrowTopRightOnSquareIcon className="w-4 h-4 mt-0.5 text-white/40 group-hover:text-white/60 flex-shrink-0" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Images Section */}
      {images && images.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-5 backdrop-blur-sm">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <PhotoIcon className="w-5 h-5 text-purple-400" />
            Related Images
            <span className="text-xs text-white/50 font-normal ml-1">({images.length})</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {images.map((image, index) => {
              // Handle different image formats from Perplexity API
              const imageUrl = typeof image === 'string' ? image : (image.url || image.image_url || image.src)
              const imageAlt = typeof image === 'object' ? (image.alt || image.caption || `Search result ${index + 1}`) : `Search result ${index + 1}`
              
              return (
                <div key={index} className="relative group cursor-pointer">
                  <div className="aspect-square bg-black/20 rounded-xl overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={imageAlt}
                      className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                      onClick={() => setSelectedImage(imageUrl)}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.onerror = null
                        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="0.5"%3E%3Crect x="3" y="3" width="18" height="18" rx="2" ry="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="m21 15-5-5L5 21"/%3E%3C/svg%3E'
                        target.className = "w-full h-full object-center p-8 opacity-20"
                      }}
                    />
                  </div>
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center text-sm text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {index + 1}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Related Questions Section */}
      {relatedQuestions && relatedQuestions.length > 0 && (
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-5 backdrop-blur-sm">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <QuestionMarkCircleIcon className="w-5 h-5 text-green-400" />
            People Also Ask
            <span className="text-xs text-white/50 font-normal ml-1">({relatedQuestions.length})</span>
          </h3>
          <div className="space-y-3">
            {relatedQuestions.map((question, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 group cursor-pointer hover:bg-white/5 rounded-lg p-2 -mx-2 transition-colors"
                onClick={() => onRelatedQuestionClick?.(question)}
              >
                <span className="text-green-400 font-bold min-w-[24px] text-sm bg-green-500/20 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">{index + 1}</span>
                <p className="text-white/90 text-sm leading-relaxed group-hover:text-white transition-colors">{question}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>
            <img
              src={selectedImage}
              alt="Full size image"
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}