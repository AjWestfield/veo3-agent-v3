"use client"

import { useState, useRef, useEffect } from "react"
import { useImages } from "@/contexts/images-context"
import { SessionNavBar } from "@/components/ui/sidebar"
import { MessageContent } from "@/components/ui/message-content"
import { SettingsPanel } from "@/components/settings"
import { ImageEditModal } from "@/components/image-edit-modal"
import { ImageComparisonModal } from "@/components/image-comparison-modal"
import { useSettings } from "@/contexts/settings-context"
import { ImageProcessingPlaceholder } from "@/components/image-processing-placeholder"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isStreaming?: boolean
  files?: FileWithPreview[]
}

interface FileWithPreview {
  file: File
  preview: string
  type: "image" | "video" | "audio" | "other"
}

export default function ChatPage() {
  const { settings } = useSettings()
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [filesWithPreviews, setFilesWithPreviews] = useState<FileWithPreview[]>([])
  const [showTools, setShowTools] = useState(false)
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [selectedFilePreview, setSelectedFilePreview] = useState<FileWithPreview | null>(null)
  const [selectedImageUrl, setSelectedImageUrl] = useState<{ url: string; alt: string } | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [editingImage, setEditingImage] = useState<{ url: string; alt: string } | null>(null)
  const [comparisonModal, setComparisonModal] = useState<{ originalUrl: string; editedUrl: string; prompt: string } | null>(null)
  const [editedImages, setEditedImages] = useState<Map<string, { originalUrl: string; prompt: string }>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { addImage } = useImages()

  // Track generated images mentioned in assistant messages
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.role === 'assistant' && msg.content) {
        const regex = /!\[.*?\]\((.*?)\)/g;
        let match;
        while ((match = regex.exec(msg.content)) !== null) {
          const url = match[1];
          if (url) {
            addImage({ url, type: 'generated' });
          }
        }
      }
    });
  }, [messages, addImage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!message.trim() && filesWithPreviews.length === 0) {
      return
    }

    // Add user message to chat with files
    const userMessage: Message = {
      role: "user",
      content: message || "Uploaded files for analysis",
      timestamp: new Date(),
      files: filesWithPreviews.length > 0 ? [...filesWithPreviews] : undefined
    }
    setMessages(prev => [...prev, userMessage])

    setIsLoading(true)
    
    // Set image generation flag if using createImage tool
    if (selectedTool === 'createImage') {
      setIsGeneratingImage(true)
    }

    try {
      // Create FormData for API request
      const apiFormData = new FormData()
      
      // Add tool context to the message if a tool is selected
      let finalMessage = message
      if (selectedTool) {
        const toolPrefix = {
          createImage: "Please create an image of: ",
          searchWeb: "Please search the web for: ",
          writeCode: "Please write code for: ",
          deepResearch: "Please do deep research on: ",
          thinkLonger: "Please think carefully and thoroughly about: "
        }[selectedTool]
        
        finalMessage = toolPrefix + message
      }
      
      if (finalMessage) {
        apiFormData.append("message", finalMessage)
      } else if (filesWithPreviews.length > 0) {
        apiFormData.append("message", "Please analyze these files")
      }
      
      // Add selected tool to FormData
      if (selectedTool) {
        apiFormData.append("selectedTool", selectedTool)
      }
      
      // Add image generation settings to FormData if using createImage tool
      if (selectedTool === 'createImage') {
        apiFormData.append("imageGenerationSettings", JSON.stringify(settings.imageGeneration))
      }
      
      // Add files to FormData
      filesWithPreviews.forEach(({ file }) => {
        apiFormData.append("files", file)
      })

      // Determine if we have video files
      const hasVideo = filesWithPreviews.some(f => f.type === 'video')
      const totalFileSize = filesWithPreviews.reduce((acc, f) => acc + f.file.size, 0)
      const isLargeUpload = totalFileSize > 50 * 1024 * 1024 // 50MB
      
      // Set appropriate timeout based on content
      const timeout = hasVideo ? 600000 : // 10 minutes for videos
                     isLargeUpload ? 300000 : // 5 minutes for large files
                     120000; // 2 minutes for normal requests
      
      console.log(`Upload size: ${(totalFileSize / 1024 / 1024).toFixed(2)}MB, Timeout: ${timeout / 1000}s`)

      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch("/api/chat", {
        method: "POST",
        body: apiFormData,
        headers: {
          'Accept': 'text/event-stream'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.details || errorData.error || "Failed to get response")
      }

      // Check if response is streaming
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("No response body")
        }

        // Create initial assistant message with streaming flag
        const assistantMessage: Message = {
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isStreaming: true
        }
        
        // Reset image generation flag when streaming starts
        setIsGeneratingImage(false)
        
        // Add initial message based on content type
        let assistantMessageIndex = messages.length + 1
        let progressMessageIndex = -1
        
        if (hasVideo) {
          // Don't add an empty assistant message yet, we'll handle progress first
          assistantMessageIndex = -1
        } else {
          // For non-video content, add the assistant message immediately
          setMessages(prev => [...prev, assistantMessage])
        }

        let accumulatedContent = ""
        let hasStartedContent = false

        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              
              if (data === '[DONE]') {
                // Update message to mark streaming as complete
                if (assistantMessageIndex !== -1) {
                  setMessages(prev => prev.map((msg, idx) => 
                    idx === assistantMessageIndex 
                      ? { ...msg, isStreaming: false }
                      : msg
                  ))
                }
                continue
              }
              
              try {
                const parsed = JSON.parse(data)
                
                if (parsed.type === 'progress') {
                  // Handle progress updates
                  const progressMessage = parsed.message || 'Processing...'
                  
                  if (progressMessageIndex === -1) {
                    // Add initial progress message
                    const newMessage: Message = {
                      role: "assistant",
                      content: progressMessage,
                      timestamp: new Date(),
                      isStreaming: true
                    }
                    setMessages(prev => [...prev, newMessage])
                    progressMessageIndex = messages.length + 1
                  } else {
                    // Update existing progress message
                    setMessages(prev => prev.map((msg, idx) => 
                      idx === progressMessageIndex 
                        ? { ...msg, content: progressMessage }
                        : msg
                    ))
                  }
                } else if (parsed.type === 'content') {
                  // Handle content chunks
                  if (!hasStartedContent && hasVideo) {
                    // First content chunk for video - replace progress with actual message
                    hasStartedContent = true
                    accumulatedContent = parsed.text || ''
                    
                    setMessages(prev => {
                      const updatedMessages = [...prev]
                      if (progressMessageIndex !== -1 && progressMessageIndex < updatedMessages.length) {
                        // Replace progress message with content message
                        updatedMessages[progressMessageIndex] = {
                          role: "assistant",
                          content: accumulatedContent,
                          timestamp: new Date(),
                          isStreaming: true
                        }
                      }
                      return updatedMessages
                    })
                    assistantMessageIndex = progressMessageIndex
                  } else if (parsed.text) {
                    // Regular content update
                    accumulatedContent += parsed.text
                    
                    if (assistantMessageIndex !== -1) {
                      setMessages(prev => prev.map((msg, idx) => 
                        idx === assistantMessageIndex 
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      ))
                    }
                  }
                } else if (parsed.type === 'error' || parsed.error) {
                  // Handle error from server
                  const errorMessage = parsed.error || parsed.message || 'An error occurred'
                  console.error("Server error:", errorMessage)
                  
                  const targetIndex = assistantMessageIndex !== -1 ? assistantMessageIndex : progressMessageIndex
                  if (targetIndex !== -1) {
                    setMessages(prev => prev.map((msg, idx) => 
                      idx === targetIndex 
                        ? { ...msg, content: `Error: ${errorMessage}`, isStreaming: false }
                        : msg
                    ))
                  } else {
                    // No existing message to update, add error message
                    setMessages(prev => [...prev, {
                      role: "assistant",
                      content: `Error: ${errorMessage}`,
                      timestamp: new Date(),
                      isStreaming: false
                    }])
                  }
                  break
                }
              } catch (e) {
                console.error("Parse error:", e, "Data:", data)
                // Skip invalid JSON
              }
            }
          }
        }
      } else {
        // Handle regular JSON response (backward compatibility)
        const data = await response.json()
        
        // Add assistant response to chat
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])

        // If server responded with an image URL (generated), track it in sidebar
        if (data.imageUrl) {
          addImage({ url: data.imageUrl, prompt: message, model: data.model, type: 'generated' })
        }
      }
      
      // Clear the input and reset tool
      setMessage("")
      setFilesWithPreviews([])
      setSelectedTool(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

    } catch (error) {
      console.error("Error:", error)
      
      let errorContent = "An error occurred while processing your request."
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorContent = `Request timed out. This usually happens with large files or slow connections. 
          
Tips:
• Try compressing your video to reduce file size
• Check your internet connection
• For videos larger than 500MB, processing may take several minutes`
        } else if (error.message.includes('Failed to fetch')) {
          errorContent = "Network error. Please check your connection and try again."
        } else {
          errorContent = `Error: ${error.message}`
        }
      }
      
      // Add error message to chat
      const errorMessage: Message = {
        role: "assistant",
        content: errorContent,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsGeneratingImage(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const newFilesWithPreviews: FileWithPreview[] = []
      
      // File size limits
      const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
      const MAX_VIDEO_SIZE = 1024 * 1024 * 1024; // 1GB (Gemini API maximum)
      const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB
      
      for (const file of files) {
        let type: FileWithPreview['type'] = 'other'
        let preview = ''
        
        // Check file size limits
        if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
          alert(`Image file ${file.name} is too large. Maximum size is 20MB.`)
          continue
        }
        if (file.type.startsWith('video/') && file.size > MAX_VIDEO_SIZE) {
          alert(`Video file ${file.name} is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 1GB (1024MB).`)
          continue
        }
        if (file.type.startsWith('audio/') && file.size > MAX_AUDIO_SIZE) {
          alert(`Audio file ${file.name} is too large. Maximum size is 20MB.`)
          continue
        }
        
        if (file.type.startsWith('image/')) {
          type = 'image'
          preview = URL.createObjectURL(file)
          // Track uploaded image in sidebar
          addImage({ url: preview, type: 'uploaded' })
        } else if (file.type.startsWith('video/')) {
          type = 'video'
          // For videos, we'll create a preview URL
          preview = URL.createObjectURL(file)
        } else if (file.type.startsWith('audio/')) {
          type = 'audio'
        }
        
        newFilesWithPreviews.push({
          file,
          preview,
          type
        })
      }
      
      setFilesWithPreviews(newFilesWithPreviews)
    }
  }

  // Clean up preview URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      filesWithPreviews.forEach(fileWithPreview => {
        if (fileWithPreview.preview) {
          URL.revokeObjectURL(fileWithPreview.preview)
        }
      })
    }
  }, [filesWithPreviews])

  // Clean up when modal closes
  useEffect(() => {
    if (!selectedFilePreview && filesWithPreviews.length === 0) {
      // Additional cleanup if needed
    }
  }, [selectedFilePreview, filesWithPreviews])

  // Handle image edit completion
  const handleEditComplete = (editedImageUrl: string, prompt: string, originalUrl: string, resultDimensions?: string) => {
    // Store metadata about the edited image
    setEditedImages(prev => new Map(prev).set(editedImageUrl, { originalUrl, prompt }))
    
    // Add edited image as assistant message
    let content = `I've edited your image based on your request: "${prompt}"\n\n![Edited Image - ${originalUrl}](${editedImageUrl})\n\n*Edited using Wavespeed AI (Flux Kontext Max)*`
    
    if (resultDimensions) {
      content += `\n*Dimensions: ${resultDimensions}*`
    }
    
    const editedMessage: Message = {
      role: "assistant",
      content,
      timestamp: new Date(),
      isStreaming: false
    }
    
    setMessages(prev => [...prev, editedMessage])
    
    // Track edited image in sidebar
    addImage({ url: editedImageUrl, prompt, originalUrl, type: 'edited' })
    setEditingImage(null)
  }

  const toolsList = [
    { id: "createImage", name: "Create an image", icon: "🎨", shortName: "Image" },
    { id: "searchWeb", name: "Search the web", icon: "🌐", shortName: "Search" },
    { id: "writeCode", name: "Write or code", icon: "✏️", shortName: "Write" },
    { id: "deepResearch", name: "Run deep research", icon: "🔬", shortName: "Deep Search" },
    { id: "thinkLonger", name: "Think for longer", icon: "💡", shortName: "Think" },
  ]

  const selectedToolData = selectedTool ? toolsList.find(t => t.id === selectedTool) : null

  return (
    <div className="flex h-screen w-full bg-[#1a1a1a]">
      {/* Full featured sidebar */}
      <SessionNavBar 
        onSettingsClick={() => setIsSettingsOpen(true)} 
        onEditImage={(url, alt) => setEditingImage({ url, alt })}
      />
      <SettingsPanel isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      
      <main className="flex h-full flex-1 flex-col ml-[3.05rem]">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-3xl text-white mb-2">How Can I Help You?</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto p-4">
              {messages.map((msg, index) => (
                <div key={index} className={`mb-4 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  <div className={`inline-block max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.role === "user" 
                      ? "bg-[#2f2f2f] text-white border border-[#4a4a4a]" 
                      : "bg-[#2f2f2f] text-white border border-[#4a4a4a]"
                  }`}>
                    {/* Display files if present */}
                    {msg.files && msg.files.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {msg.files.map((file, fileIndex) => (
                          <div key={fileIndex} className="relative group">
                            {file.type === 'image' && file.preview && (
                              <div 
                                className="w-16 h-16 rounded-lg overflow-hidden bg-black/20 cursor-pointer"
                                onClick={() => setSelectedFilePreview(file)}
                              >
                                <img 
                                  src={file.preview} 
                                  alt={file.file.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            {file.type === 'video' && (
                              <div 
                                className="w-16 h-16 rounded-lg overflow-hidden bg-black/20 cursor-pointer"
                                onClick={() => setSelectedFilePreview(file)}
                              >
                                <video 
                                  src={file.preview}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                      <path d="M8 5v14l11-7z" fill="black"/>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            )}
                            {file.type === 'audio' && (
                              <div 
                                className="w-16 h-16 rounded-lg bg-black/20 flex items-center justify-center cursor-pointer"
                                onClick={() => setSelectedFilePreview(file)}
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                                  <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                              </div>
                            )}
                            {file.type === 'other' && (
                              <div className="text-xs bg-black/20 rounded px-2 py-1">
                                {file.file.name}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <MessageContent 
                      content={msg.content} 
                      isStreaming={msg.isStreaming}
                      onImageClick={(url, alt) => {
                        // Check if this is an edited image
                        const editedImageData = editedImages.get(url)
                        if (editedImageData) {
                          setComparisonModal({
                            originalUrl: editedImageData.originalUrl,
                            editedUrl: url,
                            prompt: editedImageData.prompt
                          })
                        } else {
                          setSelectedImageUrl({ url, alt })
                        }
                      }}
                      onEditImage={(url, alt) => setEditingImage({ url, alt })}
                    />
                    <div className="text-xs mt-1 text-gray-500">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && !messages.some(msg => msg.role === 'assistant' && msg.isStreaming) && (
                <div className="mb-4 text-left">
                  {isGeneratingImage ? (
                    <ImageProcessingPlaceholder type="generation" />
                  ) : (
                    <div className="inline-block bg-[#2f2f2f] rounded-2xl px-4 py-3 border border-[#4a4a4a]">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-sm text-gray-400">Preparing response...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col rounded-[28px] p-2 shadow-sm transition-colors bg-[#2f2f2f] border text-white border-[#4a4a4a]">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,video/*,audio/*"
                  className="hidden"
                  aria-label="Upload files"
                />
                
                {filesWithPreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2 px-3">
                    {filesWithPreviews.map((fileWithPreview, index) => (
                      <div key={index} className="relative group">
                        {fileWithPreview.type === 'image' && fileWithPreview.preview && (
                          <div 
                            className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#404040] cursor-pointer"
                            onClick={() => setSelectedFilePreview(fileWithPreview)}
                          >
                            <img 
                              src={fileWithPreview.preview} 
                              alt={fileWithPreview.file.name}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const newFiles = filesWithPreviews.filter((_, i) => i !== index)
                                setFilesWithPreviews(newFiles)
                              }}
                              className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove file"
                            >
                              <span className="text-white text-xs">×</span>
                            </button>
                          </div>
                        )}
                        {fileWithPreview.type === 'video' && (
                          <div 
                            className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#404040] cursor-pointer"
                            onClick={() => setSelectedFilePreview(fileWithPreview)}
                          >
                            <video 
                              src={fileWithPreview.preview}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M8 5v14l11-7z" fill="black"/>
                                </svg>
                              </div>
                            </div>
                            {/* File size indicator */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-1 py-0.5">
                              {Math.round(fileWithPreview.file.size / 1024 / 1024)}MB
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const newFiles = filesWithPreviews.filter((_, i) => i !== index)
                                setFilesWithPreviews(newFiles)
                              }}
                              className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove file"
                            >
                              <span className="text-white text-xs">×</span>
                            </button>
                          </div>
                        )}
                        {fileWithPreview.type === 'audio' && (
                          <div 
                            className="relative w-20 h-20 rounded-lg bg-[#404040] flex items-center justify-center group cursor-pointer"
                            onClick={() => setSelectedFilePreview(fileWithPreview)}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                              <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const newFiles = filesWithPreviews.filter((_, i) => i !== index)
                                setFilesWithPreviews(newFiles)
                              }}
                              className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove file"
                            >
                              <span className="text-white text-xs">×</span>
                            </button>
                          </div>
                        )}
                        {fileWithPreview.type === 'other' && (
                          <div className="text-xs bg-[#404040] rounded px-2 py-1 relative group">
                            {fileWithPreview.file.name}
                            <button
                              type="button"
                              onClick={() => {
                                const newFiles = filesWithPreviews.filter((_, i) => i !== index)
                                setFilesWithPreviews(newFiles)
                              }}
                              className="ml-2 text-white/50 hover:text-white"
                              aria-label="Remove file"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (!isLoading && (message.trim() || filesWithPreviews.length > 0)) {
                        handleSubmit(e as any)
                      }
                    }
                  }}
                  disabled={isLoading}
                  placeholder={
                    isLoading 
                      ? "Processing..." 
                      : selectedTool 
                        ? `Ask anything for ${selectedToolData?.shortName?.toLowerCase()}...`
                        : "Send a message..."
                  }
                  className="w-full resize-none border-0 bg-transparent p-3 text-white placeholder:text-gray-400 focus:ring-0 focus-visible:outline-none min-h-12"
                  rows={1}
                />
                <div className="mt-0.5 p-1 pt-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-[#404040] focus-visible:outline-none"
                      title="Upload files (Images: 20MB, Videos: 100MB, Audio: 20MB)"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    
                    {/* Tools button with selected tool display */}
                    <div className="relative flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowTools(!showTools)}
                        className="flex h-8 items-center gap-2 rounded-full p-2 text-sm text-white transition-colors hover:bg-[#404040] focus-visible:outline-none"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M20 7h-9"></path>
                          <path d="M14 17H5"></path>
                          <circle cx="17" cy="17" r="3"></circle>
                          <circle cx="7" cy="7" r="3"></circle>
                        </svg>
                        Tools
                      </button>
                      
                      {/* Selected tool indicator - displays beside the Tools button */}
                      {selectedTool && (
                        <div className="flex items-center gap-2 bg-blue-600/20 text-blue-400 rounded-full px-3 py-1 text-sm">
                          <span>{selectedToolData?.icon}</span>
                          <span>{selectedToolData?.shortName}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedTool(null)}
                            className="ml-1 hover:text-blue-300"
                            aria-label="Clear tool selection"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      
                      {/* Tools dropdown - positioned above the button */}
                      {showTools && (
                        <div className="absolute bottom-full mb-2 left-0 w-64 bg-[#2f2f2f] border border-[#4a4a4a] rounded-lg shadow-lg overflow-hidden">
                          {toolsList.map((tool) => (
                            <button
                              key={tool.id}
                              type="button"
                              onClick={() => {
                                setSelectedTool(tool.id)
                                setShowTools(false)
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-[#404040] transition-colors"
                            >
                              <span className="text-xl">{tool.icon}</span>
                              <span className="text-sm">{tool.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1" />
                    
                    {/* Microphone button */}
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-[#404040] focus-visible:outline-none"
                      aria-label="Record voice message"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                      </svg>
                    </button>
                    
                    {/* Send button with proper icon */}
                    <button
                      type="submit"
                      disabled={isLoading || (!message.trim() && filesWithPreviews.length === 0)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80 disabled:bg-black/40 dark:disabled:bg-[#515151]"
                      aria-label="Send message"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5.25L12 18.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path
                          d="M18.75 12L12 5.25L5.25 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* File Preview Modal */}
      {selectedFilePreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedFilePreview(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] rounded-lg overflow-hidden bg-[#2f2f2f]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedFilePreview(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              aria-label="Close preview"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* File info */}
            <div className="absolute top-4 left-4 z-10 bg-black/50 rounded-lg px-3 py-2">
              <p className="text-white text-sm">{selectedFilePreview.file.name}</p>
            </div>

            {/* Content */}
            {selectedFilePreview.type === 'image' && (
              <img 
                src={selectedFilePreview.preview} 
                alt={selectedFilePreview.file.name}
                className="max-w-full max-h-[90vh] object-contain"
              />
            )}
            
            {selectedFilePreview.type === 'video' && (
              <video 
                src={selectedFilePreview.preview}
                controls
                autoPlay
                className="max-w-full max-h-[90vh]"
              >
                Your browser does not support the video tag.
              </video>
            )}
            
            {selectedFilePreview.type === 'audio' && (
              <div className="w-full max-w-2xl p-8">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-32 h-32 bg-[#404040] rounded-full flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                      <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <audio 
                    src={selectedFilePreview.preview}
                    controls
                    autoPlay
                    className="w-full"
                  >
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Image Modal */}
      {selectedImageUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImageUrl(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] rounded-lg overflow-hidden bg-[#2f2f2f]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedImageUrl(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              aria-label="Close preview"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Image info */}
            {selectedImageUrl.alt && (
              <div className="absolute top-4 left-4 z-10 bg-black/50 rounded-lg px-3 py-2">
                <p className="text-white text-sm">{selectedImageUrl.alt}</p>
              </div>
            )}

            {/* Image content */}
            <img 
              src={selectedImageUrl.url} 
              alt={selectedImageUrl.alt || "Generated image"}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* Image Edit Modal */}
      {editingImage && (
        <ImageEditModal
          isOpen={!!editingImage}
          onClose={() => setEditingImage(null)}
          imageUrl={editingImage.url}
          onEditComplete={handleEditComplete}
        />
      )}

      {/* Image Comparison Modal */}
      {comparisonModal && (
        <ImageComparisonModal
          isOpen={!!comparisonModal}
          onClose={() => setComparisonModal(null)}
          originalUrl={comparisonModal.originalUrl}
          editedUrl={comparisonModal.editedUrl}
          prompt={comparisonModal.prompt}
        />
      )}
    </div>
  )
}