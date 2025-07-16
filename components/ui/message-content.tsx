"use client"

import React from "react"

interface MessageContentProps {
  content: string
  isStreaming?: boolean
  onImageClick?: (imageUrl: string, altText: string) => void
  onEditImage?: (imageUrl: string, altText: string) => void
}

export function MessageContent({ content, isStreaming, onImageClick, onEditImage }: MessageContentProps) {
  // Parse the content to detect markdown images
  const renderContent = () => {
    // Split content by markdown image pattern
    const parts = content.split(/(\!\[.*?\]\(.*?\))/)
    
    return parts.map((part, index) => {
      // Check if this part is a markdown image
      const imageMatch = part.match(/\!\[(.*?)\]\((.*?)\)/)
      
      if (imageMatch) {
        const altText = imageMatch[1]
        const imageUrl = imageMatch[2]
        
        return (
          <div key={index} className="my-4 relative inline-block group">
            <img
              src={imageUrl}
              alt={altText}
              className="max-w-md rounded-lg shadow-lg cursor-pointer hover:opacity-95 transition-opacity"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
              onClick={() => {
                if (onImageClick) {
                  onImageClick(imageUrl, altText)
                } else {
                  window.open(imageUrl, '_blank')
                }
              }}
            />
            {onEditImage && !altText.includes('edited') && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditImage(imageUrl, altText)
                }}
                className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Edit Image
              </button>
            )}
          </div>
        )
      }
      
      // For non-image parts, render as text with line breaks
      return (
        <span key={index}>
          {part.split('\n').map((line, lineIndex) => (
            <React.Fragment key={lineIndex}>
              {lineIndex > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </span>
      )
    })
  }
  
  return (
    <div className="whitespace-pre-wrap break-words">
      {renderContent()}
      {isStreaming && content.includes('...') && (content.includes('Uploading') || content.includes('Processing')) && (
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full animate-pulse"
                style={{
                  width: content.includes('Uploading to cloud') ? '33%' :
                         content.includes('Processing video') ? '66%' :
                         content.includes('Analyzing') ? '90%' : '10%',
                  transition: 'width 0.5s ease-out'
                }}
              />
            </div>
            {content.match(/\((\d+)s elapsed\)/) && (
              <span className="text-xs text-white/50 min-w-[60px]">
                {content.match(/\((\d+)s elapsed\)/)?.[1]}s
              </span>
            )}
          </div>
        </div>
      )}
      {isStreaming && !content.includes('...') && (
        <span className="inline-block w-1 h-4 bg-white/50 ml-0.5 animate-pulse" />
      )}
    </div>
  )
}