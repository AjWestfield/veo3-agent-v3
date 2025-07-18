"use client"

import React, { useState, useCallback } from "react"
import { WebSearchResults } from "@/components/web-search-results"
import { VideoDownloadProgress } from "@/components/ui/video-download-progress"

interface MessageContentProps {
  content: string
  isStreaming?: boolean
  onImageClick?: (imageUrl: string, altText: string) => void
  onEditImage?: (imageUrl: string, altText: string) => void
  onAnimateImage?: (imageUrl: string, altText: string) => void
  onFilePathClick?: (filePath: string) => void
  onRelatedQuestionClick?: (question: string) => void
  onGenerateVideo?: (prompt: string) => void
  isGeneratingVideo?: boolean
  searchData?: {
    citations?: string[]
    searchResults?: any[]
    images?: any[]
    relatedQuestions?: string[]
  }
  searchProgress?: {
    stage: "searching" | "analyzing" | "formatting"
    message: string
  }
  downloadProgress?: {
    url: string
    platform: string
    isComplete: boolean
    error?: string
  }
}

interface ClipData {
  clipNumber: number
  totalClips: number
  timestamp: string
  content: string
}

export function MessageContent({ content, isStreaming, onImageClick, onEditImage, onAnimateImage, onFilePathClick, onRelatedQuestionClick, onGenerateVideo, isGeneratingVideo, searchData, searchProgress, downloadProgress }: MessageContentProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null)
  const [generatedIndex, setGeneratedIndex] = useState<number | null>(null)

  // Check if this is a web search result
  const isWebSearchResult = content.includes("### Sources:") || content.includes("### Related Images:") || searchData || searchProgress
  
  // Check if this is a video download message
  const isVideoDownload = downloadProgress && content.match(/Downloading \d+ video.*from URL/i)
  const videoDownloadMatch = content.match(/Downloading (\d+) video.*from URL/i)
  const videoCount = videoDownloadMatch ? parseInt(videoDownloadMatch[1]) : 1

  // Check if this is a multi-clip or single VEO 3 prompt
  const isMultiClipVEO3 = content.includes("VEO 3 MULTI-CLIP ANALYSIS:") || content.includes("VEO 3 AUTO-DETECTED CLIPS ANALYSIS:")
  const isAutoDetectedClips = content.includes("VEO 3 AUTO-DETECTED CLIPS ANALYSIS:")
  const isSingleVEO3Prompt = !isMultiClipVEO3 && content.includes("VEO 3 PROMPT:")

  // Parse multi-clip content
  const parseMultiClipContent = (): ClipData[] => {
    if (!isMultiClipVEO3) return []
    
    const clips: ClipData[] = []
    // Updated pattern to match the new format (without "VEO 3 PROMPT:" after clip header)
    const clipPattern = /## CLIP (\d+) of (\d+) \[Timestamp: ([^\]]+)\]\s*\n([\s\S]*?)(?=## CLIP \d+ of \d+|$)/g
    
    let match
    while ((match = clipPattern.exec(content)) !== null) {
      clips.push({
        clipNumber: parseInt(match[1]),
        totalClips: parseInt(match[2]),
        timestamp: match[3],
        content: match[4].trim()
      })
    }
    
    return clips
  }

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index ?? -1)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const copySinglePrompt = async () => {
    // Extract the prompt text (everything after "VEO 3 PROMPT:")
    const promptStart = content.indexOf("VEO 3 PROMPT:") + "VEO 3 PROMPT:".length
    const promptText = content.substring(promptStart).trim()
    await copyToClipboard(promptText)
  }

  const generateVideo = useCallback(async (prompt: string, index: number) => {
    if (onGenerateVideo) {
      setGeneratingIndex(index)
      try {
        await onGenerateVideo(prompt)
        setGeneratedIndex(index)
        // Show success state briefly, then return to default
        setTimeout(() => setGeneratedIndex(null), 2000)
      } catch (error) {
        console.error('Video generation error:', error)
      } finally {
        setGeneratingIndex(null)
      }
    }
  }, [onGenerateVideo])

  // Parse the content to detect markdown images, videos, and file paths
  const renderContent = () => {
    // Split content by markdown image pattern, markdown link pattern, and file path pattern
    const combinedPattern = /(\!\[.*?\]\(.*?\))|(\[.*?\]\(.*?\))|(\/([\w\-\._~:\/\[\]@!$&'()*+,;=%]+\/)+[\w\-\._~:\/\[\]@!$&'()*+,;=%]+\.\w+)|([A-Za-z]:\\(?:[\w\-\._~:\/\[\]@!$&'()*+,;=%]+\\)*[\w\-\._~:\/\[\]@!$&'()*+,;=%]+\.\w+)/g;
    
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;
    let lastIndex = 0;
    let match;
    
    while ((match = combinedPattern.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index);
        if (textBefore.trim()) {
          elements.push(
            <span key={`text-${currentIndex++}`}>
              {renderTextWithLineBreaks(textBefore)}
            </span>
          );
        }
      }
      
      const fullMatch = match[0];
      
      // Check if this is a markdown image
      const imageMatch = fullMatch.match(/\!\[(.*?)\]\((.*?)\)/);
      
      // Check if this is a markdown link (potential video)
      const linkMatch = fullMatch.match(/\[(.*?)\]\((.*?)\)/);
      
      if (imageMatch) {
        const altText = imageMatch[1];
        const imageUrl = imageMatch[2];
        
        elements.push(
          <div key={`img-${currentIndex++}`} className="my-4 relative inline-block group">
            <img
              src={imageUrl}
              alt={altText}
              className="max-w-md max-h-[400px] object-contain rounded-lg shadow-lg cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => {
                if (onImageClick) {
                  onImageClick(imageUrl, altText);
                } else {
                  window.open(imageUrl, '_blank');
                }
              }}
            />
            {(onEditImage || onAnimateImage) && !altText.includes('edited') && (
              <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEditImage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditImage(imageUrl, altText);
                    }}
                    className="bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Edit Image
                  </button>
                )}
                {onAnimateImage && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnimateImage(imageUrl, altText);
                    }}
                    className="bg-purple-600/80 hover:bg-purple-700/90 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Animate
                  </button>
                )}
              </div>
            )}
          </div>
        );
      } else if (linkMatch && !imageMatch) {
        const linkText = linkMatch[1];
        const linkUrl = linkMatch[2];
        
        // Check if this is a video link
        const isVideoLink = linkText === 'Watch Video' || 
                           linkText.toLowerCase().includes('video') ||
                           linkUrl.match(/\.(mp4|webm|ogg|mov)$/i) ||
                           linkUrl.includes('replicate.delivery') ||
                           linkUrl.includes('replicate.com');
        
        if (isVideoLink) {
          elements.push(
            <div key={`video-${currentIndex++}`} className="my-4 w-full max-w-2xl">
              <video
                src={linkUrl}
                controls
                autoPlay
                loop
                muted
                className="w-full rounded-lg shadow-lg bg-black"
                style={{ aspectRatio: '16/9' }}
              >
                <source src={linkUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <p className="text-sm text-gray-400 mt-2">
                {linkText !== 'Watch Video' ? linkText : 'Generated video'}
              </p>
            </div>
          );
        } else {
          // Regular link
          elements.push(
            <a
              key={`link-${currentIndex++}`}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              {linkText}
            </a>
          );
        }
      } else {
        // This is a file path
        elements.push(
          <span
            key={`file-${currentIndex++}`}
            className="inline-block bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-2 py-1 rounded cursor-pointer transition-colors font-mono text-sm"
            onClick={() => {
              if (onFilePathClick) {
                onFilePathClick(fullMatch);
              }
            }}
            title={`Click to view: ${fullMatch}`}
          >
            {fullMatch}
          </span>
        );
      }
      
      lastIndex = match.index + fullMatch.length;
    }
    
    // Add any remaining text after the last match
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex);
      if (remainingText.trim()) {
        elements.push(
          <span key={`text-${currentIndex++}`}>
            {renderTextWithLineBreaks(remainingText)}
          </span>
        );
      }
    }
    
    return elements;
  };
  
  // Helper function to render text with line breaks
  const renderTextWithLineBreaks = (text: string) => {
    return text.split('\n').map((line, lineIndex) => (
      <React.Fragment key={lineIndex}>
        {lineIndex > 0 && <br />}
        {line}
      </React.Fragment>
    ));
  };
  // Render multi-clip content
  const renderMultiClipContent = () => {
    const clips = parseMultiClipContent()
    if (clips.length === 0) return renderContent()
    
    // Extract video duration info if auto-detected
    let videoDurationInfo = ""
    if (isAutoDetectedClips) {
      const durationMatch = content.match(/Video Duration: \[?(\d+) seconds\]? \| Number of 8-second clips: \[?(\d+)\]?/)
      if (durationMatch) {
        videoDurationInfo = `Video Duration: ${durationMatch[1]} seconds | ${durationMatch[2]} clips detected`
      }
    }
    
    return (
      <div className="space-y-8">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">
            {isAutoDetectedClips ? "VEO 3 AUTO-DETECTED CLIPS ANALYSIS:" : "VEO 3 MULTI-CLIP ANALYSIS:"}
          </h3>
          <p className="text-sm text-white/70 mt-1">
            {videoDurationInfo || `Found ${clips.length} clips. Each clip is approximately 8 seconds.`}
          </p>
        </div>
        
        {clips.map((clip, index) => (
          <div key={index} className="border border-white/20 rounded-lg p-6 relative bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">
                    {clip.clipNumber}
                  </span>
                  Clip {clip.clipNumber} of {clip.totalClips}
                </h4>
                <p className="text-sm text-white/60 mt-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {clip.timestamp}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(clip.content, index)}
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 shadow-lg
                    ${copiedIndex === index
                      ? 'bg-green-500 text-white shadow-green-500/25' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/25'
                    }
                  `}
                >
                  {copiedIndex === index ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy Prompt
                    </>
                  )}
                </button>
                <button
                  onClick={() => generateVideo(clip.content, index)}
                  disabled={generatingIndex !== null || isGeneratingVideo}
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 shadow-lg
                    ${generatedIndex === index
                      ? 'bg-green-500 text-white shadow-green-500/25' 
                      : generatingIndex === index || isGeneratingVideo
                        ? 'bg-purple-500 text-white shadow-purple-500/25 cursor-not-allowed'
                        : 'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-500/25'
                    }
                  `}
                >
                  {generatedIndex === index ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Generated!
                    </>
                  ) : generatingIndex === index || isGeneratingVideo ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      Generate Video
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="prose prose-sm prose-invert max-w-none">
              <div className="text-sm text-white/90 whitespace-pre-wrap font-mono bg-black/40 rounded-md p-4 overflow-x-auto">
                {clip.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  // If this is a web search result, use the dedicated component
  if (isWebSearchResult) {
    return (
      <WebSearchResults
        content={content}
        citations={searchData?.citations}
        searchResults={searchData?.searchResults}
        images={searchData?.images}
        relatedQuestions={searchData?.relatedQuestions}
        isStreaming={isStreaming}
        searchProgress={searchProgress}
        onRelatedQuestionClick={onRelatedQuestionClick}
      />
    )
  }

  // Special handling for video download progress
  if (isVideoDownload && downloadProgress) {
    return (
      <VideoDownloadProgress 
        url={downloadProgress.url}
        platform={downloadProgress.platform}
        isComplete={downloadProgress.isComplete}
        error={downloadProgress.error}
        videoCount={videoCount}
      />
    )
  }
  
  return (
    <div className="relative">
      {isSingleVEO3Prompt && !isStreaming && (
        <div className="absolute top-0 right-0 z-10">
          <button
            onClick={copySinglePrompt}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2
              ${copiedIndex === -1
                ? 'bg-green-500 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              }
            `}
          >
            {copiedIndex === -1 ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy Prompt
              </>
            )}
          </button>
        </div>
      )}
      
      <div className={`whitespace-pre-wrap break-words ${isSingleVEO3Prompt ? 'pr-32' : ''}`}>
        {isMultiClipVEO3 && !isStreaming ? renderMultiClipContent() : renderContent()}
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
    </div>
  )
}