"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { flushSync } from "react-dom"
import { useImages } from "@/contexts/images-context"
import { useVideos } from "@/contexts/videos-context"
import { useAudios } from "@/contexts/audios-context"
import { useChatSessions } from "@/contexts/chat-sessions-context"
import { SessionNavBar } from "@/components/ui/sidebar"
import { MessageContent } from "@/components/ui/message-content"
import { SettingsPanel } from "@/components/settings"
import { ImageEditModal } from "@/components/image-edit-modal"
import { ImageAnimationModal } from "@/components/image-animation-modal"
import { ImageComparisonModal } from "@/components/image-comparison-modal"
import { MultiImageEditModal } from "@/components/multi-image-edit-modal"
import { MultiImageResult } from "@/components/multi-image-result"
import { MultiEditComparisonModal } from "@/components/multi-edit-comparison-modal"
import { useSettings } from "@/contexts/settings-context"
import { ImageProcessingPlaceholder } from "@/components/image-processing-placeholder"
import { VideoProcessingPlaceholder } from "@/components/video-processing-placeholder"
import { Notification } from "@/components/notification"
import { mediaStorage, FileData } from "@/lib/media-storage"
import { StorageWarning } from "@/components/ui/storage-warning"
import { PromptBox } from "@/components/ui/chatgpt-prompt-input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CookieManager } from "@/components/social-download/cookie-manager"
import { downloadVideoFromUrl, getPlatformFromUrl, FileWithPreview } from "@/lib/video-download-utils"

export interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isStreaming?: boolean
  files?: FileWithPreview[]
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
}

// Detect video URLs in text
function detectVideoUrls(text: string): string[] {
  // Updated pattern to be more flexible with TikTok URLs
  const urlPattern = /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/|twitter\.com\/\w+\/status\/|x\.com\/\w+\/status\/|instagram\.com\/(?:p|reel|tv)\/|tiktok\.com\/[@\w.-]+\/video\/\d+|vm\.tiktok\.com\/\w+|facebook\.com\/(?:watch\/?\?v=|\w+\/videos\/|reel\/)|fb\.com\/(?:watch\/?\?v=|\w+\/videos\/)|fb\.watch\/|vimeo\.com\/\d+|dailymotion\.com\/video\/|reddit\.com\/r\/\w+\/comments\/|twitch\.tv\/videos\/|streamable\.com\/\w+)[\w\-._~:/?#[\]@!$&'()*+,;=%?&=]*/gi
  
  const matches = text.match(urlPattern) || []
  return [...new Set(matches)] // Remove duplicates
}



export default function ChatPage() {
  const { settings } = useSettings()
  const { 
    sessions,
    currentSession, 
    currentSessionId,
    createNewSession, 
    switchToSession, 
    updateCurrentSession,
    updateSession,
    generateTitleForSession,
    storageWarning,
    cleanupOldSessions,
    clearAllSessions
  } = useChatSessions()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false)
  const [message, setMessage] = useState("")
  const [filesWithPreviews, setFilesWithPreviews] = useState<FileWithPreview[]>([])
  const [showTools, setShowTools] = useState(false)
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [selectedFilePreview, setSelectedFilePreview] = useState<FileWithPreview | null>(null)
  const [selectedImageUrl, setSelectedImageUrl] = useState<{ url: string; alt: string } | null>(null)
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null)
  const [filePathContent, setFilePathContent] = useState<{ content: string; type: string } | null>(null)
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showCookieManager, setShowCookieManager] = useState(false)
  const [cookieManagerPlatform, setCookieManagerPlatform] = useState('')
  const [pendingVideoUrl, setPendingVideoUrl] = useState('')
  const [editingImage, setEditingImage] = useState<{ url: string; alt: string } | null>(null)
  const [animatingImage, setAnimatingImage] = useState<{ url: string; alt: string } | null>(null)
  const [comparisonModal, setComparisonModal] = useState<{ originalUrl: string; editedUrl: string; prompt: string } | null>(null)
  const [multiEditComparisonModal, setMultiEditComparisonModal] = useState<{ resultUrl: string; sourceImages: string[]; prompt: string } | null>(null)
  const [editedImages, setEditedImages] = useState<Map<string, { originalUrl: string; prompt: string }>>(new Map())
  const [isMultiEditOpen, setIsMultiEditOpen] = useState(false)
  const [multiEditSpecificImages, setMultiEditSpecificImages] = useState<Array<{ id: string; url: string; prompt?: string }> | null>(null)
  const [multiEditResult, setMultiEditResult] = useState<{ resultImage: string; sourceImages: string[]; prompt: string; resultDimensions?: string } | null>(null)
  const [numberOfClips, setNumberOfClips] = useState<number | "auto">("auto")
  const [uploadedImageIds, setUploadedImageIds] = useState<Map<string, string>>(new Map()) // Maps file name to sidebar image ID
  const [isDragOver, setIsDragOver] = useState(false)
  const [notification, setNotification] = useState<{ message: string; description?: string } | null>(null)
  const [audioAnalysis, setAudioAnalysis] = useState<{ [key: string]: any } | null>(null)
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false)
  
  // Prompt enhancement states
  const [promptHistory, setPromptHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [hasEnhanced, setHasEnhanced] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Local state for messages during active conversation
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [isMediaStorageReady, setIsMediaStorageReady] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const lastLoadedSessionId = useRef<string | null>(null)
  
  // Get messages from current session or local state
  const messages = currentSession?.messages || localMessages
  
  // Create a new session if none exists
  useEffect(() => {
    if (!currentSessionId) {
      createNewSession()
    }
  }, [currentSessionId, createNewSession])
  
  // Initialize media storage
  useEffect(() => {
    const initStorage = async () => {
      try {
        await mediaStorage.init()
        setIsMediaStorageReady(true)
      } catch (error) {
        console.error('Failed to initialize media storage:', error)
      }
    }
    initStorage()
  }, [])
  
  // Track if we're updating to prevent loops
  const [isUpdatingSession, setIsUpdatingSession] = useState(false)
  
  // Sync local messages to session when they change
  useEffect(() => {
    if (currentSessionId && localMessages.length > 0 && !isUpdatingSession) {
      // Only update if messages are actually different
      const sessionMessages = currentSession?.messages || []
      const messagesChanged = sessionMessages.length !== localMessages.length ||
        JSON.stringify(sessionMessages) !== JSON.stringify(localMessages)
      
      if (messagesChanged) {
        setIsUpdatingSession(true)
        updateSession(currentSessionId, localMessages)
        
        // Generate title for new session on first real message exchange
        if (localMessages.length === 2 && localMessages[1].role === 'assistant') {
          generateTitleForSession(currentSessionId, localMessages[0], localMessages[1])
        }
        
        // Reset flag after a short delay
        setTimeout(() => setIsUpdatingSession(false), 100)
      }
    }
  }, [localMessages, currentSessionId, currentSession, updateSession, generateTitleForSession, isUpdatingSession])
  
  // When session changes, update local messages and load file data
  useEffect(() => {
    const loadSessionFiles = async () => {
      // Only proceed if we have a current session ID
      if (!currentSessionId) {
        setLocalMessages([])
        setIsLoadingSession(false)
        lastLoadedSessionId.current = null
        return
      }
      
      // Skip if we're in the middle of updating
      if (isUpdatingSession) {
        return
      }
      
      // Skip if we've already loaded this session
      if (lastLoadedSessionId.current === currentSessionId) {
        return
      }
      
      // Set loading state immediately when session changes
      setIsLoadingSession(true)
      
      // Find the current session from sessions array
      const sessionToLoad = sessions.find(s => s.id === currentSessionId)
      
      if (sessionToLoad) {
        try {
          // Load file data from IndexedDB for this session
          const sessionFiles = await mediaStorage.getFilesBySession(sessionToLoad.id)
          const fileMap = new Map(sessionFiles.map(f => [f.id, f]))
          
          // Update messages with file data
          const messagesWithFiles = sessionToLoad.messages.map(msg => {
            if (msg.files && msg.files.length > 0) {
              return {
                ...msg,
                files: msg.files.map(file => {
                  if (file.fileId && fileMap.has(file.fileId)) {
                    const fileData = fileMap.get(file.fileId)!
                    return {
                      ...file,
                      base64Data: fileData.base64Data,
                      preview: fileData.base64Data || file.preview
                    }
                  }
                  return file
                })
              }
            }
            return msg
          })
          
          // Update messages and mark as loaded
          setLocalMessages(messagesWithFiles)
          lastLoadedSessionId.current = currentSessionId
        } catch (error) {
          console.error('Failed to load session files:', error)
        } finally {
          setIsLoadingSession(false)
        }
      } else {
        // Session not found, clear messages and stop loading
        setLocalMessages([])
        setIsLoadingSession(false)
        lastLoadedSessionId.current = null
      }
    }
    
    loadSessionFiles()
  }, [currentSessionId, isUpdatingSession, sessions]) // Include sessions to ensure we have the data
  
  // Simple wrapper to update messages
  const setMessages = (updater: Message[] | ((prev: Message[]) => Message[])) => {
    setLocalMessages(updater)
  }

  // Custom session switching handler to prevent glitchy behavior
  const handleSessionSwitch = useCallback((sessionId: string) => {
    if (sessionId === currentSessionId) return // Don't switch to same session
    
    // Clear current form state immediately to prevent conflicts
    setMessage("")
    setFilesWithPreviews([])
    setSelectedTool(null)
    setHasEnhanced(false)
    setPromptHistory([])
    setHistoryIndex(-1)
    
    // Reset textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px'
      textareaRef.current.style.maxHeight = '128px'
    }
    
    // Reset the last loaded session ref so the new session will be loaded
    lastLoadedSessionId.current = null
    
    // Switch to the new session (loading state will be managed by loadSessionFiles useEffect)
    switchToSession(sessionId)
  }, [currentSessionId, switchToSession])
  const { addImage, removeImage, images, deselectAllImages, selectImage } = useImages()
  const { addVideo } = useVideos()
  const { addAudio } = useAudios()

  // Handle video generation from prompt (for video analysis Generate Video button)
  const handleGenerateVideoFromPrompt = async (prompt: string) => {
    setIsGeneratingVideo(true)
    
    try {
      const response = await fetch('/api/generate-video/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: prompt,
          model: settings.videoGeneration?.model || 'veo-3-fast',
          duration: settings.videoGeneration?.duration || 8,
          quality: settings.videoGeneration?.quality || 'standard',
          aspectRatio: settings.videoGeneration?.aspectRatio || '16:9',
          enhancePrompt: settings.videoGeneration?.enhancePrompt !== false
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No reader available')
      }
      
      const decoder = new TextDecoder()
      let buffer = ''
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          
          for (const line of lines) {
            if (line.trim() === '') continue
            
            const data = line.replace(/^data: /, '')
            if (data === '[DONE]') break
            
            try {
              const parsed = JSON.parse(data)
              
              if (parsed.type === 'video') {
                // Handle video generation completion
                if (parsed.videoUrl && parsed.videoDetails) {
                  // Add video to sidebar
                  addVideo({
                    id: parsed.videoDetails.id || new Date().getTime().toString(),
                    url: parsed.videoUrl,
                    type: 'video',
                    title: `Generated Video - ${new Date().toLocaleString()}`,
                    thumbnail: parsed.videoUrl,
                    details: parsed.videoDetails,
                    createdAt: parsed.videoDetails.createdAt || new Date().toISOString()
                  })
                  
                  // Create video message content for chat interface
                  const modelName = parsed.videoDetails.model === 'veo-3-fast' ? 'VEO 3 Fast' : 'Kling 2.1'
                  let videoMessage = `🎬 **Video Generated from Analysis with ${modelName}**\n\n[Watch Video](${parsed.videoUrl})\n\n**Prompt:** ${parsed.videoDetails.prompt}`
                  
                  // Add video message to chat
                  const newMessage = {
                    role: "assistant" as const,
                    content: videoMessage,
                    timestamp: new Date(),
                    isStreaming: false
                  }
                  setMessages(prev => [...prev, newMessage])
                }
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError)
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error('Video generation failed:', error)
      
      // Show error message in chat
      const errorMessage = {
        role: "assistant" as const,
        content: `❌ **Video Generation Failed**\n\nSorry, there was an error generating the video. Please try again.`,
        timestamp: new Date(),
        isStreaming: false
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGeneratingVideo(false)
    }
  }

  // Removed automatic image tracking to prevent infinite loop with ScrollArea
  // Images are now only tracked when explicitly generated through the API

  const scrollToBottom = () => {
    // Use requestAnimationFrame to defer scroll operation
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    })
  }

  useEffect(() => {
    // Add a small delay to ensure DOM is updated before scrolling
    const timeoutId = setTimeout(() => {
      scrollToBottom()
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [messages.length]) // Only depend on messages length to reduce re-renders
  
  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'
      
      // Calculate new height based on content
      const scrollHeight = textarea.scrollHeight
      const minHeight = 48 // min-h-12 = 3rem = 48px
      const defaultMaxHeight = 128 // max-h-32 = 8rem = 128px
      const enhancedMaxHeight = 200 // Increased max height for enhanced prompts
      
      // Use different max height if enhanced
      const maxHeight = hasEnhanced ? enhancedMaxHeight : defaultMaxHeight
      
      // Set height between min and max
      let newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
      
      // If enhanced, ensure at least 5 lines are visible
      if (hasEnhanced) {
        const lineHeight = 24 // Approximate line height
        const minEnhancedHeight = lineHeight * 5 // 5 lines = 120px
        newHeight = Math.max(newHeight, minEnhancedHeight)
      }
      
      textarea.style.height = `${newHeight}px`
      
      // Update max-height style dynamically
      textarea.style.maxHeight = `${maxHeight}px`
    }
  }, [message, hasEnhanced])

  // Handle paste event to detect and download video URLs
  const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = event.clipboardData.getData('text')
    const videoUrls = detectVideoUrls(pastedText)
    
    if (videoUrls.length > 0) {
      event.preventDefault() // Prevent the URL from being pasted
      
      // Create a unique ID for this download session
      const downloadId = Date.now()
      
      // Set downloading state
      setIsDownloadingVideo(true)
      
      // Use setTimeout to avoid immediate state updates that could cause loops
      setTimeout(async () => {
        try {
          // Show downloading message
          const downloadingMessage: Message = {
            role: "assistant",
            content: `Downloading ${videoUrls.length} video${videoUrls.length > 1 ? 's' : ''} from URL${videoUrls.length > 1 ? 's' : ''}...`,
            timestamp: new Date(),
            isStreaming: true
          }
          
          setMessages(prev => [...prev, downloadingMessage])
          
          // Download videos
          const downloadedVideos: FileWithPreview[] = []
          const failedUrls: { url: string; requiresCookies: boolean; platform: string }[] = []
          
          for (const url of videoUrls) {
            try {
              console.log('[Paste Handler] Downloading video from:', url)
              const result = await downloadVideoFromUrl(url)
              
              if (result.file) {
                console.log('[Paste Handler] Video downloaded successfully:', result.file.file.name)
                downloadedVideos.push(result.file)
              } else if (result.requiresCookies) {
                console.log('[Paste Handler] Authentication required for:', url)
                failedUrls.push({ 
                  url, 
                  requiresCookies: true, 
                  platform: result.platform || 'unknown' 
                })
              } else {
                console.log('[Paste Handler] Download failed:', result.error)
              }
            } catch (error) {
              console.error(`[Paste Handler] Failed to download video from ${url}:`, error)
              failedUrls.push({ 
                url, 
                requiresCookies: false, 
                platform: getPlatformFromUrl(url) 
              })
            }
          }
          
          // Handle authentication requirements
          if (failedUrls.length > 0 && failedUrls.some(f => f.requiresCookies)) {
            const authRequired = failedUrls.find(f => f.requiresCookies)
            if (authRequired) {
              setPendingVideoUrl(authRequired.url)
              setCookieManagerPlatform(authRequired.platform)
              setShowCookieManager(true)
            }
          }
          
          // Update state only once at the end
          setMessages(prev => {
            // Remove the downloading message and add result message
            const newMessages = prev.slice(0, -1)
            
            if (downloadedVideos.length > 0) {
              // Add success message
              newMessages.push({
                role: "assistant",
                content: `Successfully downloaded ${downloadedVideos.length} video${downloadedVideos.length > 1 ? 's' : ''}. You can now ask questions about the video${downloadedVideos.length > 1 ? 's' : ''} or perform analysis.`,
                timestamp: new Date()
              })
            } else if (videoUrls.length > 0) {
              // Add error message
              newMessages.push({
                role: "assistant",
                content: `Failed to download video${videoUrls.length > 1 ? 's' : ''} from the provided URL${videoUrls.length > 1 ? 's' : ''}. Please check if the video${videoUrls.length > 1 ? 's are' : ' is'} accessible and try again.`,
                timestamp: new Date()
              })
            }
            
            return newMessages
          })
          
          // Add downloaded videos to files if any
          if (downloadedVideos.length > 0) {
            setFilesWithPreviews(prev => [...prev, ...downloadedVideos])
            
            // Add downloaded videos to sidebar for persistence
            downloadedVideos.forEach(video => {
              console.log('[Paste Handler] Adding video to sidebar:', video.file.name)
              addVideo({
                url: video.preview,
                type: 'downloaded',
                name: video.file.name,
                platform: 'downloaded'
              })
            })
          }
          
        } finally {
          // Always reset downloading state
          setIsDownloadingVideo(false)
        }
      }, 100) // Small delay to prevent immediate state updates
      
      // Don't clear the message - let the user decide what to do
      // This prevents confusion when paste is intercepted
      // setMessage('')
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(new DOMException('User cancelled the request', 'AbortError'))
      abortControllerRef.current = null
    }
    setIsLoading(false)
    setIsGeneratingImage(false)
    setIsGeneratingVideo(false)
    setIsDownloadingVideo(false)
    setIsAnalyzingAudio(false)
  }
  
  const handleEnhancePrompt = async () => {
    if (!message.trim() || isEnhancing) return
    
    setIsEnhancing(true)
    
    try {
      // Save current prompt to history
      const newHistory = [...promptHistory.slice(0, historyIndex + 1), message]
      setPromptHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
      
      // Get recent chat history
      const chatHistory = messages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content
      }))
      
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: message,
          chatHistory
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Enhance prompt error:', response.status, errorData)
        throw new Error(errorData.error || `Failed to enhance prompt (${response.status})`)
      }
      
      const data = await response.json()
      
      // Update the message with enhanced prompt
      setMessage(data.enhancedPrompt)
      
      // Add enhanced prompt to history
      const updatedHistory = [...newHistory, data.enhancedPrompt]
      setPromptHistory(updatedHistory)
      setHistoryIndex(updatedHistory.length - 1)
      setHasEnhanced(true)
    } catch (error) {
      console.error('Error enhancing prompt:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to enhance prompt'
      
      setNotification({
        message: 'Failed to enhance prompt',
        description: errorMessage
      })
    } finally {
      setIsEnhancing(false)
    }
  }
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setMessage(promptHistory[newIndex])
    }
  }
  
  const handleRedo = () => {
    if (historyIndex < promptHistory.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setMessage(promptHistory[newIndex])
    }
  }
  
  const handleClearAllSessions = () => {
    clearAllSessions()
    // Reset enhancement state
    setHasEnhanced(false)
    setPromptHistory([])
    setHistoryIndex(-1)
    // Reset textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px'
      textareaRef.current.style.maxHeight = '128px'
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    console.log('handleSubmit called - message:', message, 'tool:', selectedTool)
    
    if (!message.trim() && filesWithPreviews.length === 0) {
      console.log('handleSubmit - returning early: no message or files')
      return
    }
    
    // Ensure we have a session before proceeding
    if (!currentSessionId) {
      createNewSession()
      // Messages will be synced via the useEffect when session is created
    }

    // Check for video URLs in the message
    const videoUrls = detectVideoUrls(message)
    let downloadedVideos: FileWithPreview[] = []
    
    // Only process video URLs if we're not already downloading and there are no files attached
    // This prevents duplicate processing when URLs are pasted and then sent
    if (videoUrls.length > 0 && !isDownloadingVideo && filesWithPreviews.length === 0) {
      setIsDownloadingVideo(true)
      
      // Show downloading message
      const downloadingMessage: Message = {
        role: "assistant",
        content: `Downloading ${videoUrls.length} video${videoUrls.length > 1 ? 's' : ''} from URL${videoUrls.length > 1 ? 's' : ''}...`,
        timestamp: new Date(),
        isStreaming: true
      }
      setMessages(prev => [...prev, downloadingMessage])
      
      // Download videos
      for (const url of videoUrls) {
        console.log('[Send Handler] Downloading video from:', url)
        const result = await downloadVideoFromUrl(url)
        if (result.file) {
          console.log('[Send Handler] Video downloaded successfully:', result.file.file.name)
          downloadedVideos.push(result.file)
        } else {
          console.log('[Send Handler] Download failed:', result.error || 'Unknown error')
        }
      }
      
      // Remove downloading message
      setMessages(prev => prev.slice(0, -1))
      setIsDownloadingVideo(false)
      
      if (downloadedVideos.length > 0) {
        // Add downloaded videos to files
        setFilesWithPreviews(prev => [...prev, ...downloadedVideos])
        
        // Add downloaded videos to sidebar for persistence
        downloadedVideos.forEach((video, index) => {
          console.log('[Send Handler] Adding video to sidebar:', video.file.name)
          addVideo({
            url: video.preview,
            type: 'downloaded',
            name: video.file.name,
            platform: getPlatformFromUrl(videoUrls[index] || '') // Extract the actual platform
          })
        })
      }
    }

    // Combine existing files with downloaded videos
    const allFiles = [...filesWithPreviews, ...downloadedVideos]

    // Convert files to base64 and store in IndexedDB for persistence
    const processedFiles = await Promise.all(allFiles.map(async (fileWithPreview) => {
      // If base64 data already exists, use it
      if (fileWithPreview.base64Data) {
        return fileWithPreview
      }
      
      // Convert file to base64
      return new Promise<FileWithPreview>(async (resolve) => {
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64Data = reader.result as string
          const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          
          // Store file data in IndexedDB
          if (currentSessionId) {
            try {
              await mediaStorage.saveFile({
                id: fileId,
                base64Data,
                fileName: fileWithPreview.file.name,
                fileSize: fileWithPreview.file.size,
                type: fileWithPreview.type,
                sessionId: currentSessionId,
                timestamp: new Date()
              })
            } catch (error) {
              console.error('Failed to save file to IndexedDB:', error)
            }
          }
          
          resolve({
            ...fileWithPreview,
            base64Data,
            fileName: fileWithPreview.file.name,
            fileSize: fileWithPreview.file.size,
            fileId
          })
        }
        reader.onerror = () => {
          // If conversion fails, return original
          resolve(fileWithPreview)
        }
        reader.readAsDataURL(fileWithPreview.file)
      })
    }))

    // Add user message to chat with files
    const userMessage: Message = {
      role: "user",
      content: message || "Uploaded files for analysis",
      timestamp: new Date(),
      files: processedFiles.length > 0 ? processedFiles : undefined
    }
    setMessages(prev => [...prev, userMessage])

    setIsLoading(true)
    
    // Set image generation flag if using createImage tool
    if (selectedTool === 'createImage') {
      setIsGeneratingImage(true)
    }
    
    // Set video generation flag if using generateVideo tool
    if (selectedTool === 'generateVideo') {
      setIsGeneratingVideo(true)
    }
    
    // Reset textarea height to original size
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px' // Reset to min-height
      textareaRef.current.style.maxHeight = '128px' // Reset to default max-height
    }
    
    // Add web search progress message immediately
    if (selectedTool === 'searchWeb') {
      const searchProgressMessage: Message = {
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
        searchProgress: {
          stage: "searching",
          message: "Querying search engines for the latest information..."
        }
      }
      setMessages(prev => [...prev, searchProgressMessage])
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
          generateVideo: "Please generate a video showing: "
        }[selectedTool]
        
        finalMessage = toolPrefix + message
      }
      
      if (finalMessage) {
        apiFormData.append("message", finalMessage)
      } else if (allFiles.length > 0) {
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
      
      // Add video generation settings to FormData if using generateVideo tool
      if (selectedTool === 'generateVideo') {
        apiFormData.append("videoGenerationSettings", JSON.stringify(settings.videoGeneration))
      }
      
      // Add files to FormData
      allFiles.forEach(({ file }) => {
        apiFormData.append("files", file)
      })
      
      // Add number of clips for video analysis
      if (allFiles.some(f => f.type === 'video')) {
        apiFormData.append("numberOfClips", numberOfClips.toString())
      }

      // Determine if we have video files
      const hasVideo = allFiles.some(f => f.type === 'video')
      const totalFileSize = allFiles.reduce((acc, f) => acc + f.file.size, 0)
      const isLargeUpload = totalFileSize > 50 * 1024 * 1024 // 50MB
      
      // Set appropriate timeout based on content
      const timeout = hasVideo ? 600000 : // 10 minutes for videos
                     isLargeUpload ? 300000 : // 5 minutes for large files
                     120000; // 2 minutes for normal requests
      
      console.log(`Upload size: ${(totalFileSize / 1024 / 1024).toFixed(2)}MB, Timeout: ${timeout / 1000}s`)

      // Create AbortController for timeout and manual cancellation
      const controller = new AbortController()
      abortControllerRef.current = controller
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
        
        // Reset image generation flag when streaming starts (but not video for generateVideo tool)
        setIsGeneratingImage(false)
        
        // Only reset video generation flag if we're not using the generateVideo tool
        if (selectedTool !== "generateVideo") {
          setIsGeneratingVideo(false)
        }
        
        // Track whether we've added the assistant message
        let assistantMessageAdded = false
        let isProgressMessage = false
        let currentSearchData: Message['searchData'] = undefined
        
        // For video content or web search, we'll start with progress messages
        if (hasVideo || selectedTool === 'searchWeb') {
          // We'll add progress message when we receive it
          assistantMessageAdded = false
          isProgressMessage = true
          
          // For web search, the progress message is already added before the API call
          if (selectedTool === 'searchWeb') {
            assistantMessageAdded = true
          }
        } else {
          // For non-video, non-search content, add the assistant message immediately
          setMessages(prev => {
            const newMessages = [...prev, assistantMessage]
            return newMessages
          })
          assistantMessageAdded = true
          isProgressMessage = false
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
                // Update the last assistant message to mark streaming as complete
                setMessages(prev => {
                  const newMessages = [...prev]
                  // Find the last assistant message (should be the one we're streaming)
                  for (let i = newMessages.length - 1; i >= 0; i--) {
                    if (newMessages[i].role === 'assistant') {
                      newMessages[i] = { ...newMessages[i], isStreaming: false }
                      break
                    }
                  }
                  return newMessages
                })
                
                // Reset generation flags when streaming completes
                setIsGeneratingVideo(false)
                setIsGeneratingImage(false)
                continue
              }
              
              try {
                const parsed = JSON.parse(data)
                
                if (parsed.type === 'progress') {
                  // Handle progress updates
                  // Skip progress messages for video generation - we use the video placeholder component instead
                  if (selectedTool === 'generateVideo') {
                    // For video generation, don't add progress messages to chat
                    // The video placeholder component handles all progress display
                    continue
                  }
                  
                  const progressMessage = parsed.message || 'Processing...'
                  
                  if (!assistantMessageAdded && isProgressMessage) {
                    // Add initial progress message
                    const newMessage: Message = {
                      role: "assistant",
                      content: progressMessage,
                      timestamp: new Date(),
                      isStreaming: true
                    }
                    setMessages(prev => [...prev, newMessage])
                    assistantMessageAdded = true
                  } else if (isProgressMessage) {
                    // Update existing progress message
                    setMessages(prev => {
                      const newMessages = [...prev]
                      // Find the last assistant message
                      for (let i = newMessages.length - 1; i >= 0; i--) {
                        if (newMessages[i].role === 'assistant') {
                          newMessages[i] = { ...newMessages[i], content: progressMessage }
                          break
                        }
                      }
                      return newMessages
                    })
                  }
                } else if (parsed.type === 'searchProgress') {
                  // Handle search progress updates
                  setMessages(prev => {
                    const newMessages = [...prev]
                    // Update the last assistant message with search progress
                    for (let i = newMessages.length - 1; i >= 0; i--) {
                      if (newMessages[i].role === 'assistant') {
                        newMessages[i] = {
                          ...newMessages[i],
                          searchProgress: {
                            stage: parsed.stage,
                            message: parsed.message
                          }
                        }
                        break
                      }
                    }
                    return newMessages
                  })
                } else if (parsed.type === 'searchData') {
                  // Handle search metadata
                  currentSearchData = {
                    citations: parsed.citations,
                    searchResults: parsed.searchResults,
                    images: parsed.images,
                    relatedQuestions: parsed.relatedQuestions
                  }
                  
                  // Update the message with search data
                  setMessages(prev => {
                    const newMessages = [...prev]
                    for (let i = newMessages.length - 1; i >= 0; i--) {
                      if (newMessages[i].role === 'assistant') {
                        newMessages[i] = {
                          ...newMessages[i],
                          searchData: currentSearchData,
                          searchProgress: undefined // Clear progress when we have data
                        }
                        break
                      }
                    }
                    return newMessages
                  })
                } else if (parsed.type === 'message') {
                  // Handle complete message content (for video generation, error messages, etc.)
                  if (parsed.content) {
                    if (!assistantMessageAdded) {
                      // Add new message
                      const newMessage: Message = {
                        role: "assistant",
                        content: parsed.content,
                        timestamp: new Date(),
                        isStreaming: !parsed.done
                      }
                      setMessages(prev => [...prev, newMessage])
                      assistantMessageAdded = true
                    } else {
                      // Update existing message
                      setMessages(prev => {
                        const newMessages = [...prev]
                        // Find the last assistant message and replace its content
                        for (let i = newMessages.length - 1; i >= 0; i--) {
                          if (newMessages[i].role === 'assistant') {
                            newMessages[i] = {
                              ...newMessages[i],
                              content: parsed.content,
                              isStreaming: !parsed.done
                            }
                            break
                          }
                        }
                        return newMessages
                      })
                    }
                    accumulatedContent = parsed.content
                  }
                } else if (parsed.type === 'video') {
                  // Handle video generation completion
                  if (parsed.videoUrl && parsed.videoDetails) {
                    // Add video to sidebar
                    addVideo({
                      id: parsed.videoDetails.id || new Date().getTime().toString(),
                      url: parsed.videoUrl,
                      type: 'video',
                      title: `Generated Video - ${new Date().toLocaleString()}`,
                      thumbnail: parsed.videoUrl,
                      details: parsed.videoDetails,
                      createdAt: parsed.videoDetails.createdAt || new Date().toISOString()
                    })
                    
                    // Create video message content for chat interface
                    const modelName = parsed.videoDetails.model === 'veo-3-fast' ? 'VEO 3 Fast' : 'Kling 2.1'
                    let videoMessage = `🎬 **Video Generated with ${modelName}**\n\n[Watch Video](${parsed.videoUrl})\n\n**Prompt:** ${parsed.videoDetails.prompt}`
                    
                    // Add note about model switch if it happened
                    if (parsed.videoDetails.originalModel && parsed.videoDetails.originalModel !== parsed.videoDetails.model) {
                      const originalModelName = parsed.videoDetails.originalModel === 'kling-2.1' ? 'Kling 2.1' : 'VEO 3 Fast'
                      videoMessage += `\n\n*Note: Automatically switched from ${originalModelName} to ${modelName} for text-to-video generation.*`
                    }
                    
                    // Add video message to chat
                    if (!assistantMessageAdded) {
                      // Add new message
                      const newMessage: Message = {
                        role: "assistant",
                        content: videoMessage,
                        timestamp: new Date(),
                        isStreaming: false
                      }
                      setMessages(prev => [...prev, newMessage])
                      assistantMessageAdded = true
                    } else {
                      // Update existing message content
                      setMessages(prev => {
                        const newMessages = [...prev]
                        for (let i = newMessages.length - 1; i >= 0; i--) {
                          if (newMessages[i].role === 'assistant') {
                            newMessages[i] = {
                              ...newMessages[i],
                              content: videoMessage,
                              isStreaming: false
                            }
                            break
                          }
                        }
                        return newMessages
                      })
                    }
                    
                    // Reset video generation flag
                    setIsGeneratingVideo(false)
                  }
                } else if (parsed.type === 'content') {
                  // Handle content chunks
                  if (!hasStartedContent && (hasVideo || selectedTool === 'searchWeb') && isProgressMessage) {
                    // First content chunk - replace progress with actual message
                    hasStartedContent = true
                    accumulatedContent = parsed.text || ''
                    isProgressMessage = false // No longer a progress message
                    
                    setMessages(prev => {
                      const newMessages = [...prev]
                      // Find and update the last assistant message
                      for (let i = newMessages.length - 1; i >= 0; i--) {
                        if (newMessages[i].role === 'assistant') {
                          newMessages[i] = {
                            ...newMessages[i],
                            content: accumulatedContent,
                            isStreaming: true,
                            searchProgress: undefined // Clear search progress
                          }
                          break
                        }
                      }
                      return newMessages
                    })
                  } else if (parsed.text) {
                    // Regular content update or continuation
                    accumulatedContent += parsed.text
                    
                    setMessages(prev => {
                      const newMessages = [...prev]
                      // Update the last assistant message
                      for (let i = newMessages.length - 1; i >= 0; i--) {
                        if (newMessages[i].role === 'assistant') {
                          newMessages[i] = { 
                            ...newMessages[i], 
                            content: accumulatedContent,
                            searchData: currentSearchData // Keep search data if available
                          }
                          break
                        }
                      }
                      return newMessages
                    })
                  }
                } else if (parsed.type === 'error' || parsed.error) {
                  // Handle error from server
                  const errorMessage = parsed.error || parsed.message || 'An error occurred'
                  console.error("Server error:", errorMessage)
                  
                  if (assistantMessageAdded) {
                    // Update existing assistant message with error
                    setMessages(prev => {
                      const newMessages = [...prev]
                      for (let i = newMessages.length - 1; i >= 0; i--) {
                        if (newMessages[i].role === 'assistant') {
                          newMessages[i] = {
                            ...newMessages[i],
                            content: `Error: ${errorMessage}`,
                            isStreaming: false
                          }
                          break
                        }
                      }
                      return newMessages
                    })
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
        
        // After streaming is complete, check if we generated an image
        if (selectedTool === "createImage" && accumulatedContent) {
          // Extract image URL from markdown content
          const imageUrlMatch = accumulatedContent.match(/!\[Generated Image\]\((https?:\/\/[^\)]+)\)/)
          if (imageUrlMatch && imageUrlMatch[1]) {
            const imageUrl = imageUrlMatch[1]
            
            // Extract model information from the content
            let model = "unknown"
            const modelMatch = accumulatedContent.match(/\*Generated with: ([^*]+)\*/)
            if (modelMatch && modelMatch[1]) {
              model = modelMatch[1].trim()
            }
            
            // Add image to sidebar
            addImage({ 
              url: imageUrl, 
              prompt: message, 
              model: model, 
              type: 'generated' 
            })
          }
        }
        
        // After streaming is complete, check if we generated a video
        if (selectedTool === "generateVideo" && accumulatedContent) {
          // Extract video URL from markdown content - looking for [Watch Video](url) pattern
          const videoUrlMatch = accumulatedContent.match(/\[Watch Video\]\((https?:\/\/[^\)]+)\)/)
          if (videoUrlMatch && videoUrlMatch[1]) {
            const videoUrl = videoUrlMatch[1]
            
            // Extract video details from the content
            let model = "unknown"
            const modelMatch = accumulatedContent.match(/Model:\s*([^\n]+)/)
            if (modelMatch && modelMatch[1]) {
              model = modelMatch[1].trim()
            }
            
            let duration = 8
            const durationMatch = accumulatedContent.match(/Duration:\s*(\d+)s/)
            if (durationMatch && durationMatch[1]) {
              duration = parseInt(durationMatch[1])
            }
            
            // Add video to sidebar
            addVideo({
              id: new Date().getTime().toString(),
              url: videoUrl,
              type: 'video',
              title: `Generated Video - ${new Date().toLocaleString()}`,
              thumbnail: videoUrl, // We could generate a thumbnail in the future
              details: {
                model: model.includes('kling') ? 'kling-2.1' : 'veo-3-fast',
                duration,
                quality: 'standard',
                aspectRatio: '16:9',
                prompt: message,
                id: new Date().getTime().toString(),
                createdAt: new Date().toISOString()
              },
              createdAt: new Date().toISOString()
            })
          }
        }
      } else {
        // Handle regular JSON response (backward compatibility)
        const data = await response.json()
        
        // Add assistant response to chat
        const assistantMessage: Message = {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
          // Include search data if this was a web search
          searchData: selectedTool === 'searchWeb' && data.citations ? {
            citations: data.citations,
            searchResults: data.searchResults,
            images: data.images,
            relatedQuestions: data.relatedQuestions
          } : undefined
        }
        setMessages(prev => [...prev, assistantMessage])

        // If server responded with an image URL (generated), track it in sidebar
        if (data.imageUrl) {
          addImage({ url: data.imageUrl, prompt: message, model: data.model, type: 'generated' })
        }
        
        // If server responded with video data (generated), track it in sidebar
        if (data.type === 'video' && data.content && data.videoDetails) {
          addVideo({
            id: data.videoDetails.id || new Date().getTime().toString(),
            url: data.content,
            type: 'video',
            title: `Generated Video - ${new Date().toLocaleString()}`,
            thumbnail: data.content,
            details: data.videoDetails,
            createdAt: data.videoDetails.createdAt || new Date().toISOString()
          })
        }
      }
      
      // Clear the input and reset tool
      setMessage("")
      setFilesWithPreviews([])
      setSelectedTool(null)
      setNumberOfClips("auto")
      setUploadedImageIds(new Map()) // Clear tracking but keep images in sidebar
      
      // Reset enhancement state
      setHasEnhanced(false)
      setPromptHistory([])
      setHistoryIndex(-1)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

    } catch (error) {
      console.error("Error:", error)
      
      let errorContent = "An error occurred while processing your request."
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          // Check if it was manually cancelled
          if (!abortControllerRef.current) {
            errorContent = "Request cancelled."
          } else {
            errorContent = `Request timed out. This usually happens with large files or slow connections. 
          
Tips:
• Try compressing your video to reduce file size
• Check your internet connection
• For videos larger than 500MB, processing may take several minutes`
          }
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
      setIsGeneratingVideo(false)
      abortControllerRef.current = null
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
          // Don't add to sidebar here - we'll add base64 version instead
          // to ensure it persists after page reload
        } else if (file.type.startsWith('video/')) {
          type = 'video'
          // For videos, we'll create a preview URL
          preview = URL.createObjectURL(file)
        } else if (file.type.startsWith('audio/')) {
          type = 'audio'
          // Create preview URL for audio files
          preview = URL.createObjectURL(file)
        }
        
        const fileWithPreview = {
          file,
          preview,
          type
        }
        newFilesWithPreviews.push(fileWithPreview)
        
        // Add images to sidebar with base64 data for persistence
        if (type === 'image') {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64Data = reader.result as string
            
            // Add to sidebar and get the created image with ID
            const createdImage = addImage({ 
              url: base64Data, 
              type: 'uploaded',
              prompt: file.name 
            })
            
            // Track the image ID for this file
            setUploadedImageIds(prev => new Map(prev).set(file.name, createdImage.id))
          }
          reader.readAsDataURL(file)
        }
        
        // Add videos to sidebar with base64 data for persistence
        if (type === 'video') {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64Data = reader.result as string
            
            // Add to sidebar
            addVideo({ 
              url: base64Data, 
              type: 'uploaded',
              name: file.name 
            })
          }
          reader.readAsDataURL(file)
        }
        
        // Add audio files to sidebar
        if (type === 'audio') {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64Data = reader.result as string
            
            // Add to sidebar
            addAudio({ 
              url: base64Data, 
              type: 'uploaded',
              name: file.name 
            })
          }
          reader.readAsDataURL(file)
        }
      }
      
      setFilesWithPreviews(newFilesWithPreviews)
    }
  }

  // Function to handle related question clicks
  const handleRelatedQuestionClick = (question: string) => {
    console.log('Related question clicked:', question)
    
    // Clear any files first
    setFilesWithPreviews([])
    
    // Use flushSync to ensure state updates are applied synchronously
    flushSync(() => {
      setMessage(question)
      setSelectedTool('searchWeb')
    })
    
    // Now submit the form using requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      const formElement = document.querySelector('form') as HTMLFormElement
      if (formElement) {
        console.log('Submitting form with question:', question)
        formElement.requestSubmit()
      }
    })
    
    // Scroll to bottom to show the new search
    scrollToBottom()
  }

  // Function to handle file path clicks
  const handleFilePathClick = async (filePath: string) => {
    setSelectedFilePath(filePath)
    setIsLoadingFile(true)
    setFilePathContent(null)
    
    try {
      // Try to read the file content
      const response = await fetch(filePath)
      if (response.ok) {
        const contentType = response.headers.get('content-type') || ''
        
        if (contentType.startsWith('image/')) {
          // For images, we'll show them directly
          setFilePathContent({ content: filePath, type: 'image' })
        } else if (contentType.startsWith('video/')) {
          // For videos, we'll show them directly
          setFilePathContent({ content: filePath, type: 'video' })
        } else if (contentType.startsWith('audio/')) {
          // For audio, we'll show them directly
          setFilePathContent({ content: filePath, type: 'audio' })
        } else {
          // For text files, read the content
          const text = await response.text()
          setFilePathContent({ content: text, type: 'text' })
        }
      } else {
        // If we can't fetch the file (common for local files), just try to display it
        const extension = filePath.split('.').pop()?.toLowerCase() || ''
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
          setFilePathContent({ content: filePath, type: 'image' })
        } else if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
          setFilePathContent({ content: filePath, type: 'video' })
        } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
          setFilePathContent({ content: filePath, type: 'audio' })
        } else {
          setFilePathContent({ content: 'Unable to load file content. The file may not be accessible from the browser.', type: 'error' })
        }
      }
    } catch (error) {
      // If fetch fails, try to determine type by extension
      const extension = filePath.split('.').pop()?.toLowerCase() || ''
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
        setFilePathContent({ content: filePath, type: 'image' })
      } else if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
        setFilePathContent({ content: filePath, type: 'video' })
      } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
        setFilePathContent({ content: filePath, type: 'audio' })
      } else {
        setFilePathContent({ content: 'Unable to load file content. The file may not be accessible from the browser.', type: 'error' })
      }
    } finally {
      setIsLoadingFile(false)
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
  
  // Function to handle file removal
  const handleRemoveFile = (index: number) => {
    const fileToRemove = filesWithPreviews[index]
    
    // Remove from sidebar if it's an image
    if (fileToRemove.type === 'image') {
      const imageId = uploadedImageIds.get(fileToRemove.file.name)
      if (imageId) {
        removeImage(imageId)
        setUploadedImageIds(prev => {
          const newMap = new Map(prev)
          newMap.delete(fileToRemove.file.name)
          return newMap
        })
      }
    }
    
    // Remove from files list
    const newFiles = filesWithPreviews.filter((_, i) => i !== index)
    setFilesWithPreviews(newFiles)
  }

  // Clean up when modal closes
  useEffect(() => {
    if (!selectedFilePreview && filesWithPreviews.length === 0) {
      // Additional cleanup if needed
    }
  }, [selectedFilePreview, filesWithPreviews])

  // Function to format audio analysis for chat
  const formatAudioAnalysisForChat = (analysis: any) => {
    if (!analysis || !analysis.analysis) return ''
    
    const { analysis: data } = analysis
    let text = `Audio Analysis for ${analysis.fileName}:\n\n`
    
    if (data.summary) {
      text += `Summary: ${data.summary}\n\n`
    }
    
    if (data.language) {
      text += `Language: ${data.language}\n`
    }
    
    if (data.duration) {
      text += `Duration: ${data.duration}\n\n`
    }
    
    if (data.transcription && data.transcription.length > 0) {
      text += `Transcription:\n`
      data.transcription.forEach((segment: any) => {
        text += `${segment.timestamp} `
        if (segment.speaker && segment.speaker !== "Unknown") {
          text += `[${segment.speaker}] `
        }
        text += `${segment.text}`
        text += ` (Tone: ${segment.tone})\n`
      })
    }
    
    if (data.backgroundSounds && data.backgroundSounds.length > 0) {
      text += `\nBackground Sounds: ${data.backgroundSounds.join(', ')}`
    }
    
    return text
  }

  // Function to analyze audio file
  const analyzeAudio = async (audioFile: FileWithPreview) => {
    setIsAnalyzingAudio(true)
    setAudioAnalysis(null)
    
    try {
      const formData = new FormData()
      formData.append('audio', audioFile.file)
      
      const response = await fetch('/api/analyze-audio', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to analyze audio')
      }
      
      const result = await response.json()
      setAudioAnalysis(result)
      
      // Show notification
      setNotification({
        message: "Audio analysis complete",
        description: `Analyzed ${result.fileName}`
      })
      
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
      
    } catch (error) {
      console.error('Audio analysis error:', error)
      setNotification({
        message: "Failed to analyze audio",
        description: error instanceof Error ? error.message : 'Unknown error'
      })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setIsAnalyzingAudio(false)
    }
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check if we're truly leaving the drop zone
    const relatedTarget = e.relatedTarget as Node
    if (!e.currentTarget.contains(relatedTarget)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      // Show notification
      const fileTypes = [...new Set(files.map(f => {
        if (f.type.startsWith('image/')) return 'image'
        if (f.type.startsWith('video/')) return 'video'
        if (f.type.startsWith('audio/')) return 'audio'
        return 'file'
      }))]
      
      const typeText = fileTypes.length === 1 
        ? `${files.length} ${fileTypes[0]}${files.length > 1 ? 's' : ''}`
        : `${files.length} files`
      
      setNotification({
        message: `Added ${typeText}`,
        description: files.length === 1 ? files[0].name : `${files.map(f => f.name).join(', ').substring(0, 50)}...`
      })
      
      // Create a synthetic event to reuse handleFileChange
      const syntheticEvent = {
        target: {
          files: files as unknown as FileList
        }
      } as React.ChangeEvent<HTMLInputElement>
      
      await handleFileChange(syntheticEvent)
    }
  }

  // Handle image edit completion
  const handleEditComplete = (editedImageUrl: string, prompt: string, originalUrl: string, resultDimensions?: string) => {
    // Check if this is an image from the chat input area
    // We need to check both the preview URL and the file name from the alt text
    const altText = editingImage?.alt || ''
    const fileIndex = filesWithPreviews.findIndex(f => 
      f.preview === originalUrl || 
      f.file.name === altText ||
      (originalUrl.startsWith('data:') && f.file.name === altText) // Handle base64 URLs
    )
    
    if (fileIndex !== -1) {
      // This is an image from the chat input area - update it
      fetch(editedImageUrl)
        .then(res => res.blob())
        .then(blob => {
          const originalFileName = filesWithPreviews[fileIndex].file.name
          const editedFileName = originalFileName.startsWith('edited_') 
            ? originalFileName 
            : `edited_${originalFileName}`
          
          const editedFile = new File([blob], editedFileName, { type: blob.type })
          const newFileWithPreview: FileWithPreview = {
            file: editedFile,
            preview: editedImageUrl,
            type: 'image',
            isEdited: true
          }
          
          const newFiles = [...filesWithPreviews]
          newFiles[fileIndex] = newFileWithPreview
          setFilesWithPreviews(newFiles)
          
          // Update sidebar: remove old image and add edited one
          const oldImageId = uploadedImageIds.get(originalFileName)
          if (oldImageId) {
            removeImage(oldImageId)
          }
          
          // Add edited image to sidebar
          const editedImageInSidebar = addImage({
            url: editedImageUrl,
            type: 'edited',
            prompt: prompt,
            originalUrl: originalUrl
          })
          
          // Update tracking
          setUploadedImageIds(prev => {
            const newMap = new Map(prev)
            newMap.delete(originalFileName)
            newMap.set(editedFileName, editedImageInSidebar.id)
            return newMap
          })
        })
    } else {
      // This is an image from a message - add as assistant message
      setEditedImages(prev => new Map(prev).set(editedImageUrl, { originalUrl, prompt }))
      
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
    }
    
    setEditingImage(null)
  }

  // Handle image animation completion
  const handleAnimationComplete = (videoUrl: string, prompt: string, originalImageUrl: string, videoMetadata?: any) => {
    // Add the animated video to the videos context
    const newVideo = addVideo({
      url: videoUrl,
      name: `Animated from image: ${prompt}`,
      type: 'generated',
      details: {
        model: 'kling-2.1',
        prompt: prompt,
        duration: videoMetadata?.duration || 5,
        quality: videoMetadata?.quality || 'standard',
        aspectRatio: videoMetadata?.aspectRatio,
        originalImageUrl: originalImageUrl,
        predictionId: videoMetadata?.predictionId,
        createdAt: videoMetadata?.createdAt || new Date().toISOString()
      }
    })

    // Add assistant message with the animated video
    const content = `I've animated your image based on your request: "${prompt}"\n\n[Watch Video](${videoUrl})\n\n*Animated using Kling 2.1 AI (${videoMetadata?.duration || 5} seconds, ${videoMetadata?.quality || 'standard'} quality)*`
    
    const animationMessage: Message = {
      role: "assistant",
      content,
      timestamp: new Date(),
      isStreaming: false
    }
    
    setMessages(prev => [...prev, animationMessage])
    setAnimatingImage(null)
  }

  // Handle multi-image edit completion
  const handleMultiEditComplete = (editedImageUrl: string, prompt: string, sourceImages: string[], resultDimensions?: string) => {
    // Add the multi-edited image to the images context
    const newImage = addImage({
      url: editedImageUrl,
      prompt: prompt,
      model: 'wavespeed-flux-kontext-max-multi',
      type: 'multi-edited',
      sourceImages: sourceImages
    })

    // Show the result in the multi-image result modal
    setMultiEditResult({
      resultImage: editedImageUrl,
      sourceImages: sourceImages,
      prompt: prompt,
      resultDimensions: resultDimensions
    })

    setIsMultiEditOpen(false)
  }

  const toolsList = [
    { id: "createImage", name: "Create an image", icon: "🎨", shortName: "Image" },
    { id: "searchWeb", name: "Search the web", icon: "🌐", shortName: "Search" },
    { id: "writeCode", name: "Write or code", icon: "✏️", shortName: "Write" },
    { id: "deepResearch", name: "Run deep research", icon: "🔬", shortName: "Deep Search" },
    { id: "generateVideo", name: "Generate video", icon: "🎬", shortName: "Video" },
  ]

  const selectedToolData = selectedTool ? toolsList.find(t => t.id === selectedTool) : null


  return (
    <div className="flex h-screen w-full bg-[#1a1a1a]">
      {/* Full featured sidebar */}
      <SessionNavBar 
        onSettingsClick={() => setIsSettingsOpen(true)} 
        onEditImage={(url, alt) => {
          // Check if this is an edited image that should show comparison modal
          const fullImageData = images.find(img => img.url === url)
          if (fullImageData?.type === 'edited' && fullImageData.originalUrl) {
            // Open comparison modal for edited images
            setComparisonModal({
              originalUrl: fullImageData.originalUrl,
              editedUrl: fullImageData.url,
              prompt: fullImageData.prompt || ''
            })
          } else if (fullImageData?.type === 'multi-edited' && fullImageData.sourceImages) {
            // Open multi-edit comparison modal for multi-edited images
            setMultiEditComparisonModal({
              resultUrl: fullImageData.url,
              sourceImages: fullImageData.sourceImages,
              prompt: fullImageData.prompt || ''
            })
          } else {
            // For regular images, open the edit modal
            setEditingImage({ url, alt })
          }
        }}
        onAnimateImage={(url, alt) => setAnimatingImage({ url, alt })}
        onMultiEditClick={(selectedImages) => {
          setMultiEditSpecificImages(selectedImages)
          setIsMultiEditOpen(true)
        }}
        onVideoClick={(videoData) => {
          // Create a FileWithPreview object for the video modal
          const fileWithPreview: FileWithPreview = {
            file: new File([], videoData.prompt || 'video'),
            preview: videoData.src,
            type: 'video'
          }
          setSelectedFilePreview(fileWithPreview)
        }}
        onNewChat={() => {
          // Clear current state and create new session
          setMessage("")
          setFilesWithPreviews([])
          setSelectedTool(null)
          setLocalMessages([]) // Clear messages immediately
          // Reset enhancement state
          setHasEnhanced(false)
          setPromptHistory([])
          setHistoryIndex(-1)
          // Reset textarea
          if (textareaRef.current) {
            textareaRef.current.style.height = '48px'
            textareaRef.current.style.maxHeight = '128px'
          }
          createNewSession()
          // Don't call switchToSession here - createNewSession already sets currentSessionId
        }}
        onSessionClick={handleSessionSwitch}
        currentSessionId={currentSessionId}
      />
      <SettingsPanel isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      
      <main className="flex h-full flex-1 flex-col ml-[3.05rem]">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingSession ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg text-white">Loading session...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
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
                        {msg.files.map((file, fileIndex) => {
                          // Ensure file has proper structure
                          if (!file || typeof file === 'string') {
                            return (
                              <div key={fileIndex} className="text-xs bg-black/20 rounded px-2 py-1">
                                {file || 'Unknown file'}
                              </div>
                            )
                          }
                          return (
                          <div key={fileIndex} className="relative group">
                            {file.type === 'image' && (file.preview || file.base64Data) && (
                              <div 
                                className="w-20 h-20 rounded-lg overflow-hidden bg-black/20 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all relative"
                                onClick={() => {
                                  // Create a proper FileWithPreview object if file is missing
                                  const fileToPreview = file.file ? file : {
                                    ...file,
                                    file: new File([], file.fileName || 'image', { type: 'image/jpeg' }),
                                    preview: file.base64Data || file.preview
                                  }
                                  setSelectedFilePreview(fileToPreview)
                                }}
                                title={`Click to view ${file.fileName || file.file?.name || 'image'}`}
                              >
                                <img 
                                  src={file.base64Data || file.preview} 
                                  alt={file.fileName || file.file?.name || 'image'}
                                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                />
                                {file.isEdited && (
                                  <div className="absolute top-1 right-1 bg-blue-500 text-white text-[10px] px-1 py-0.5 rounded font-medium">
                                    Edited
                                  </div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                                  <p className="text-[10px] text-white truncate">{file.fileName || file.file?.name || 'image'}</p>
                                </div>
                              </div>
                            )}
                            {file.type === 'video' && (file.preview || file.base64Data) && (
                              <div 
                                className="w-20 h-20 rounded-lg overflow-hidden bg-black/20 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all relative"
                                onClick={() => {
                                  const fileToPreview = file.file ? file : {
                                    ...file,
                                    file: new File([], file.fileName || 'video', { type: 'video/mp4' }),
                                    preview: file.base64Data || file.preview
                                  }
                                  setSelectedFilePreview(fileToPreview)
                                }}
                                title={`Click to view ${file.fileName || file.file?.name || 'video'}`}
                              >
                                <video 
                                  src={file.base64Data || file.preview}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                                  <div className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                      <path d="M8 5v14l11-7z" fill="black"/>
                                    </svg>
                                  </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                                  <p className="text-[10px] text-white truncate">{file.fileName || file.file?.name || 'video'}</p>
                                </div>
                              </div>
                            )}
                            {file.type === 'audio' && (file.preview || file.base64Data) && (
                              <div 
                                className="w-20 h-20 rounded-lg bg-black/20 flex flex-col items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500 hover:bg-black/30 transition-all relative"
                                onClick={() => {
                                  const fileToPreview = file.file ? file : {
                                    ...file,
                                    file: new File([], file.fileName || 'audio', { type: 'audio/mpeg' }),
                                    preview: file.base64Data || file.preview
                                  }
                                  setSelectedFilePreview(fileToPreview)
                                }}
                                title={`Click to play ${file.fileName || file.file?.name || 'audio'}`}
                              >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="mb-1">
                                  <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                                <p className="text-[10px] text-white text-center px-1 truncate w-full">{file.fileName || file.file?.name || 'audio'}</p>
                              </div>
                            )}
                            {file.type === 'other' && (
                              <div className="text-xs bg-black/20 rounded px-2 py-1">
                                {file.file.name}
                              </div>
                            )}
                          </div>
                          )
                        })}
                      </div>
                    )}
                    <MessageContent 
                      content={msg.content} 
                      isStreaming={msg.isStreaming}
                      searchData={msg.searchData}
                      searchProgress={msg.searchProgress}
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
                      onAnimateImage={(url, alt) => setAnimatingImage({ url, alt })}
                      onFilePathClick={handleFilePathClick}
                      onRelatedQuestionClick={handleRelatedQuestionClick}
                      onGenerateVideo={handleGenerateVideoFromPrompt}
                      isGeneratingVideo={isGeneratingVideo}
                    />
                    <div className="text-xs mt-1 text-gray-500">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {/* Video placeholder - show during entire video generation process */}
              {isGeneratingVideo && (
                <div className="mb-4 text-left">
                  <VideoProcessingPlaceholder model={settings.videoGeneration?.model || 'veo-3-fast'} />
                </div>
              )}
              
              {/* Regular loading placeholder for non-video generation */}
              {isLoading && !isGeneratingVideo && !messages.some(msg => msg.role === 'assistant' && msg.isStreaming) && (
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
              <div 
                className={`relative flex flex-col rounded-[28px] p-2 shadow-sm transition-all duration-200 bg-[#2f2f2f] border text-white ${
                  isDragOver ? 'border-blue-500 bg-[#3a3a3a] scale-[1.02]' : 'border-[#4a4a4a]'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,video/*,audio/*"
                  className="hidden"
                  aria-label="Upload files"
                />
                
                {isDragOver && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[28px] pointer-events-none">
                    {/* Backdrop with blur */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-purple-500/20 to-pink-500/30 backdrop-blur-md rounded-[28px] animate-in fade-in duration-200" />
                    
                    {/* Border glow effect */}
                    <div className="absolute inset-0 rounded-[28px] border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-border opacity-80 animate-pulse" />
                    
                    {/* Content */}
                    <div className="relative flex flex-col items-center gap-3 text-white animate-in zoom-in-90 fade-in duration-200">
                      {/* Animated icon */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-ping" />
                        <svg className="relative w-16 h-16 text-white drop-shadow-2xl" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      
                      {/* Text */}
                      <div className="text-center">
                        <p className="text-xl font-semibold mb-1 drop-shadow-lg">Drop your files here</p>
                        <p className="text-sm text-white/90 drop-shadow">Images, videos, and audio files supported</p>
                      </div>
                      
                      {/* File type icons */}
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-white/80">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Images</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-white/80">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Videos</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-white/80">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                          <span>Audio</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {filesWithPreviews.length > 0 && (
                  <div className="flex flex-col gap-2 mb-2 px-3 relative">
                    {/* Show clip selector if there are videos */}
                    {filesWithPreviews.some(f => f.type === 'video') && (
                      <div className="flex items-center gap-2 py-2 border-b border-white/10">
                        <label htmlFor="clips-selector" className="text-sm text-white/70">Clips in video:</label>
                        <select 
                          id="clips-selector"
                          aria-label="Number of clips to generate"
                          value={numberOfClips}
                          onChange={(e) => setNumberOfClips(e.target.value === "auto" ? "auto" : parseInt(e.target.value))}
                          className="bg-[#404040] text-white text-sm rounded px-2 py-1 border border-white/20 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="auto">Auto-detect</option>
                          <option value="1">1 clip (8s)</option>
                          <option value="2">2 clips (16s)</option>
                          <option value="3">3 clips (24s)</option>
                          <option value="4">4 clips (32s)</option>
                          <option value="5">5 clips (40s)</option>
                          <option value="6">6 clips (48s)</option>
                          <option value="7">7 clips (56s)</option>
                          <option value="8">8 clips (64s)</option>
                        </select>
                        <span className="text-xs text-white/50">Each clip ≈ 8 seconds</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
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
                            {fileWithPreview.isEdited && (
                              <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-md font-medium">
                                Edited
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveFile(index)
                              }}
                              className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove file"
                            >
                              <span className="text-white text-xs">×</span>
                            </button>
                            {/* Edit button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingImage({ 
                                  url: fileWithPreview.preview, 
                                  alt: fileWithPreview.file.name 
                                })
                              }}
                              className="absolute bottom-1 right-8 bg-black/70 hover:bg-black/90 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Edit image"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                <path d="m15 5 4 4" />
                              </svg>
                            </button>
                            {/* Animate button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setAnimatingImage({ 
                                  url: fileWithPreview.preview, 
                                  alt: fileWithPreview.file.name 
                                })
                              }}
                              className="absolute bottom-1 right-1 bg-purple-600/80 hover:bg-purple-700/90 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Animate image"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
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
                                handleRemoveFile(index)
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
                                handleRemoveFile(index)
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
                                handleRemoveFile(index)
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
                    
                    {/* Multi-image edit button when multiple images are uploaded */}
                    {filesWithPreviews.filter(f => f.type === 'image').length > 1 && (
                      <div className="mt-2 px-1">
                        <button
                          type="button"
                          onClick={() => {
                            // Create specific images from uploaded files
                            const imageFiles = filesWithPreviews.filter(f => f.type === 'image')
                            const specificImages = imageFiles.map((fileWithPreview, index) => ({
                              id: `uploaded-${index}-${Date.now()}`,
                              url: fileWithPreview.preview,
                              prompt: `Uploaded: ${fileWithPreview.file.name}`
                            }))
                            
                            // Set specific images and open modal
                            setMultiEditSpecificImages(specificImages)
                            setIsMultiEditOpen(true)
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600/10 to-purple-600/10 hover:from-blue-600/20 hover:to-purple-600/20 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all border border-white/10 hover:border-white/20 group"
                          aria-label="Edit multiple images together"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70 group-hover:opacity-100 transition-opacity">
                            <path d="M20 7h-9m3-3l-3 3 3 3M4 17h9m-3 3l3-3-3-3" />
                          </svg>
                          <span className="opacity-90 group-hover:opacity-100">
                            Combine {filesWithPreviews.filter(f => f.type === 'image').length} images with AI
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    // Reset enhancement state when user manually edits
                    if (hasEnhanced) {
                      setHasEnhanced(false)
                      setPromptHistory([])
                      setHistoryIndex(-1)
                    }
                  }}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (!isLoading && !isDownloadingVideo && (message.trim() || filesWithPreviews.length > 0)) {
                        handleSubmit(e as any)
                      }
                    }
                  }}
                  disabled={isLoading || isDownloadingVideo || isLoadingSession}
                  placeholder={
                    isDownloadingVideo
                      ? "Downloading video from URL..."
                      : isLoading 
                        ? "Processing..." 
                        : selectedTool 
                          ? `Ask anything for ${selectedToolData?.shortName?.toLowerCase()}...`
                          : "Send a message or paste a video URL..."
                  }
                  className="w-full resize-none border-0 bg-transparent p-3 text-white placeholder:text-gray-400 focus:ring-0 focus-visible:outline-none min-h-12 max-h-32 overflow-y-auto enhanced-textarea-scrollbar"
                  rows={1}
                />
                <div className="mt-0.5 p-1 pt-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-[#404040] focus-visible:outline-none"
                      title="Upload files - Select multiple (Images: 20MB, Videos: 100MB, Audio: 20MB)"
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
                    
                    {/* Prompt Enhancement Controls */}
                    {message.trim() && (
                      <>
                        {hasEnhanced && historyIndex > 0 && (
                          <button
                            type="button"
                            onClick={handleUndo}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-[#404040] focus-visible:outline-none"
                            title="Undo enhancement"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M9 14 4 9l5-5" />
                              <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
                            </svg>
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={handleEnhancePrompt}
                          disabled={isEnhancing}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-[#404040] focus-visible:outline-none disabled:opacity-50"
                          title={isEnhancing ? "Enhancing..." : "Enhance prompt"}
                        >
                          {isEnhancing ? (
                            <svg
                              className="animate-spin h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                          ) : (
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                              <path d="M5 3v4" />
                              <path d="M19 17v4" />
                              <path d="M3 5h4" />
                              <path d="M17 19h4" />
                            </svg>
                          )}
                        </button>
                        
                        {hasEnhanced && historyIndex < promptHistory.length - 1 && (
                          <button
                            type="button"
                            onClick={handleRedo}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-[#404040] focus-visible:outline-none"
                            title="Redo enhancement"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m15 14 5-5-5-5" />
                              <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
                            </svg>
                          </button>
                        )}
                        
                        {message.trim() && (
                          <div className="h-4 w-px bg-gray-600" />
                        )}
                      </>
                    )}
                    
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
                    
                    {/* Send/Stop button */}
                    <button
                      type={isLoading || isDownloadingVideo ? "button" : "submit"}
                      onClick={isLoading || isDownloadingVideo ? handleStop : undefined}
                      disabled={(!isLoading && !isDownloadingVideo && (!message.trim() && filesWithPreviews.length === 0)) || isLoadingSession}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none bg-white text-black hover:bg-gray-200 disabled:bg-gray-300 disabled:text-gray-500 dark:bg-white dark:text-black dark:hover:bg-gray-200 dark:disabled:bg-gray-300 dark:disabled:text-gray-500"
                      aria-label={isLoading || isDownloadingVideo ? "Stop generation" : isLoadingSession ? "Loading session..." : "Send message"}
                    >
                      {isLoading || isDownloadingVideo ? (
                        // Stop icon
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="4" y="4" width="8" height="8" rx="1" fill="currentColor" />
                        </svg>
                      ) : (
                        // Send icon
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
                      )}
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
              <p className="text-white text-sm font-medium">{selectedFilePreview.fileName || selectedFilePreview.file?.name || 'File'}</p>
              <p className="text-white/70 text-xs">
                {selectedFilePreview.fileSize ? 
                  `${(selectedFilePreview.fileSize / 1024 / 1024).toFixed(2)} MB` : 
                  selectedFilePreview.file ? 
                    `${(selectedFilePreview.file.size / 1024 / 1024).toFixed(2)} MB` : 
                    'Unknown size'
                } • {selectedFilePreview.type}
              </p>
            </div>
            
            {/* Download button */}
            <a 
              href={selectedFilePreview.base64Data || selectedFilePreview.preview}
              download={selectedFilePreview.fileName || selectedFilePreview.file?.name || 'file'}
              className="absolute top-4 right-20 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              aria-label="Download file"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            </a>

            {/* Edit and Animate buttons - only for images */}
            {selectedFilePreview.type === 'image' && (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    // Use base64Data if available, otherwise use preview URL
                    let imageUrl = selectedFilePreview.base64Data || selectedFilePreview.preview
                    let altText = selectedFilePreview.fileName || selectedFilePreview.file?.name || 'Image'
                    
                    if (!selectedFilePreview.base64Data && imageUrl.startsWith('blob:') && selectedFilePreview.file) {
                      // Read the file and convert to base64
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setSelectedFilePreview(null)
                        setEditingImage({ url: reader.result as string, alt: altText })
                      }
                      reader.readAsDataURL(selectedFilePreview.file)
                    } else {
                      setSelectedFilePreview(null)
                      setEditingImage({ url: imageUrl, alt: altText })
                    }
                  }}
                  className="absolute top-4 right-44 z-10 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-1.5 transition-colors border border-white/20"
                  aria-label="Edit image"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                  <span className="text-sm text-white">Edit Image</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    // Use base64Data if available, otherwise use preview URL
                    let imageUrl = selectedFilePreview.base64Data || selectedFilePreview.preview
                    let altText = selectedFilePreview.fileName || selectedFilePreview.file?.name || 'Image'
                    
                    if (!selectedFilePreview.base64Data && imageUrl.startsWith('blob:') && selectedFilePreview.file) {
                      // Read the file and convert to base64
                      const reader = new FileReader()
                      reader.onloadend = () => {
                        setSelectedFilePreview(null)
                        setAnimatingImage({ url: reader.result as string, alt: altText })
                      }
                      reader.readAsDataURL(selectedFilePreview.file)
                    } else {
                      setSelectedFilePreview(null)
                      setAnimatingImage({ url: imageUrl, alt: altText })
                    }
                  }}
                  className="absolute top-4 right-32 z-10 px-3 py-2 bg-purple-600/80 hover:bg-purple-700/90 rounded-lg flex items-center gap-1.5 transition-colors border border-purple-500/20"
                  aria-label="Animate image"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span className="text-sm text-white">Animate</span>
                </button>
              </>
            )}

            {/* Content */}
            {selectedFilePreview.type === 'image' && (
              <img 
                src={selectedFilePreview.base64Data || selectedFilePreview.preview} 
                alt={selectedFilePreview.fileName || selectedFilePreview.file?.name || 'Image'}
                className="max-w-full max-h-[90vh] object-contain"
              />
            )}
            
            {selectedFilePreview.type === 'video' && (
              <video 
                src={selectedFilePreview.base64Data || selectedFilePreview.preview}
                controls
                autoPlay
                className="max-w-full max-h-[90vh]"
              >
                Your browser does not support the video tag.
              </video>
            )}
            
            {selectedFilePreview.type === 'audio' && (
              <div className="w-full max-w-4xl p-8">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-32 h-32 bg-[#404040] rounded-full flex items-center justify-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                      <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  {(selectedFilePreview.base64Data || selectedFilePreview.preview) ? (
                    <audio 
                      src={selectedFilePreview.base64Data || selectedFilePreview.preview}
                      controls
                      autoPlay
                      className="w-full max-w-md"
                    >
                      Your browser does not support the audio tag.
                    </audio>
                  ) : (
                    <p className="text-gray-400 text-sm">Unable to load audio preview</p>
                  )}
                  
                  {/* Analyze Audio Button */}
                  <button
                    onClick={() => analyzeAudio(selectedFilePreview)}
                    disabled={isAnalyzingAudio}
                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                      isAnalyzingAudio 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                    } text-white flex items-center gap-2`}
                  >
                    {isAnalyzingAudio ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        Analyze Audio
                      </>
                    )}
                  </button>
                  
                  {/* Analysis Results */}
                  {audioAnalysis && (
                    <div className="w-full bg-[#1a1a1a] rounded-lg p-6 max-h-96 overflow-y-auto">
                      <h3 className="text-lg font-semibold mb-4 text-white">Audio Analysis Results</h3>
                      
                      {audioAnalysis.analysis && (
                        <div className="space-y-4">
                          {/* Summary */}
                          {audioAnalysis.analysis.summary && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Summary</h4>
                              <p className="text-white">{audioAnalysis.analysis.summary}</p>
                            </div>
                          )}
                          
                          {/* Language & Duration */}
                          <div className="flex gap-6 mb-4">
                            {audioAnalysis.analysis.language && (
                              <div>
                                <span className="text-sm text-gray-400">Language: </span>
                                <span className="text-white">{audioAnalysis.analysis.language}</span>
                              </div>
                            )}
                            {audioAnalysis.analysis.duration && (
                              <div>
                                <span className="text-sm text-gray-400">Duration: </span>
                                <span className="text-white">{audioAnalysis.analysis.duration}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Transcription */}
                          {audioAnalysis.analysis.transcription && audioAnalysis.analysis.transcription.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-2">Transcription</h4>
                              <div className="space-y-2">
                                {audioAnalysis.analysis.transcription.map((segment: any, index: number) => (
                                  <div key={index} className="bg-[#2a2a2a] rounded p-3">
                                    <div className="flex items-start gap-3">
                                      <span className="text-xs text-blue-400 font-mono whitespace-nowrap">
                                        {segment.timestamp}
                                      </span>
                                      <div className="flex-1">
                                        {segment.speaker && segment.speaker !== "Unknown" && (
                                          <span className="text-xs text-green-400 font-medium">
                                            {segment.speaker}:
                                          </span>
                                        )}
                                        <p className="text-white text-sm mt-1">{segment.text}</p>
                                        <div className="flex gap-4 mt-2 text-xs">
                                          <span className="text-gray-400">
                                            Tone: <span className="text-yellow-400">{segment.tone}</span>
                                          </span>
                                          {segment.confidence > 0 && (
                                            <span className="text-gray-400">
                                              Confidence: <span className="text-green-400">
                                                {(segment.confidence * 100).toFixed(0)}%
                                              </span>
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Background Sounds */}
                          {audioAnalysis.analysis.backgroundSounds && audioAnalysis.analysis.backgroundSounds.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Background Sounds</h4>
                              <div className="flex flex-wrap gap-2">
                                {audioAnalysis.analysis.backgroundSounds.map((sound: string, index: number) => (
                                  <span key={index} className="px-2 py-1 bg-[#2a2a2a] rounded text-sm text-white">
                                    {sound}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Raw Response (if parsing failed) */}
                          {audioAnalysis.analysis.rawResponse && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-1">Raw Analysis</h4>
                              <pre className="text-white text-sm whitespace-pre-wrap">
                                {audioAnalysis.analysis.rawResponse}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Send to Chat Button */}
                      <button
                        onClick={() => {
                          const analysisText = formatAudioAnalysisForChat(audioAnalysis)
                          setMessage(analysisText)
                          setSelectedFilePreview(null)
                          setAudioAnalysis(null)
                        }}
                        className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all active:scale-95"
                      >
                        Send Analysis to Chat
                      </button>
                    </div>
                  )}
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
            {/* Edit button */}
            <button
              onClick={() => {
                setSelectedImageUrl(null)
                setEditingImage({ url: selectedImageUrl.url, alt: selectedImageUrl.alt || "Generated image" })
              }}
              className="absolute top-4 right-20 z-10 px-3 py-2 bg-black/50 hover:bg-black/70 rounded-full flex items-center gap-1.5 transition-colors"
              aria-label="Edit image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span className="text-white text-sm">Edit</span>
            </button>

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

      {/* Image Animation Modal */}
      {animatingImage && (
        <ImageAnimationModal
          isOpen={!!animatingImage}
          onClose={() => setAnimatingImage(null)}
          imageUrl={animatingImage.url}
          onAnimationComplete={handleAnimationComplete}
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

      {/* Multi-Image Edit Modal */}
      <MultiImageEditModal
        isOpen={isMultiEditOpen}
        onClose={() => {
          setIsMultiEditOpen(false)
          setMultiEditSpecificImages(null)
        }}
        onEditComplete={handleMultiEditComplete}
        onSendPrompt={(prompt) => {
          setMessage(prompt)
          setIsMultiEditOpen(false)
          setMultiEditSpecificImages(null)
        }}
        specificImages={multiEditSpecificImages || undefined}
      />

      {/* Multi-Image Result Modal */}
      {multiEditResult && (
        <MultiImageResult
          isOpen={!!multiEditResult}
          onClose={() => setMultiEditResult(null)}
          resultImage={multiEditResult.resultImage}
          sourceImages={multiEditResult.sourceImages}
          prompt={multiEditResult.prompt}
          resultDimensions={multiEditResult.resultDimensions}
          onEditImage={(url, alt) => setEditingImage({ url, alt })}
          onMultiEditClick={(selectedImages) => {
          setMultiEditSpecificImages(selectedImages)
          setIsMultiEditOpen(true)
        }}
        />
      )}

      {/* Multi-Edit Comparison Modal */}
      {multiEditComparisonModal && (
        <MultiEditComparisonModal
          isOpen={!!multiEditComparisonModal}
          onClose={() => setMultiEditComparisonModal(null)}
          resultUrl={multiEditComparisonModal.resultUrl}
          sourceImages={multiEditComparisonModal.sourceImages}
          prompt={multiEditComparisonModal.prompt}
          onEditImage={(url, alt) => {
            setMultiEditComparisonModal(null)
            setEditingImage({ url, alt })
          }}
        />
      )}

      {/* File Path Modal */}
      {selectedFilePath && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => {
            setSelectedFilePath(null)
            setFilePathContent(null)
          }}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] rounded-lg overflow-hidden bg-[#2f2f2f]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setSelectedFilePath(null)
                setFilePathContent(null)
              }}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              aria-label="Close preview"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* File info */}
            <div className="absolute top-4 left-4 z-10 bg-black/50 rounded-lg px-3 py-2">
              <p className="text-white text-sm font-medium">{selectedFilePath}</p>
              {filePathContent && filePathContent.type !== 'error' && (
                <p className="text-white/70 text-xs">{filePathContent.type}</p>
              )}
            </div>

            {/* Content */}
            {isLoadingFile && (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-white">Loading file...</div>
              </div>
            )}

            {filePathContent && !isLoadingFile && (
              <>
                {filePathContent.type === 'image' && (
                  <img 
                    src={filePathContent.content} 
                    alt={selectedFilePath}
                    className="max-w-full max-h-[90vh] object-contain"
                  />
                )}

                {filePathContent.type === 'video' && (
                  <video 
                    src={filePathContent.content}
                    controls
                    autoPlay
                    className="max-w-full max-h-[90vh]"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}

                {filePathContent.type === 'audio' && (
                  <div className="w-full max-w-2xl p-8">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-32 h-32 bg-[#404040] rounded-full flex items-center justify-center">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                          <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <audio 
                        src={filePathContent.content}
                        controls
                        autoPlay
                        className="w-full"
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                )}

                {filePathContent.type === 'text' && (
                  <div className="p-6 max-w-4xl max-h-[80vh] overflow-auto">
                    <pre className="text-white font-mono text-sm whitespace-pre-wrap">
                      {filePathContent.content}
                    </pre>
                  </div>
                )}

                {filePathContent.type === 'error' && (
                  <div className="p-6 text-center">
                    <p className="text-white/70">{filePathContent.content}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Notification */}
      <Notification
        message={notification?.message || ''}
        description={notification?.description}
        show={!!notification}
        onHide={() => setNotification(null)}
      />
      
      {/* Storage Warning */}
      <StorageWarning
        warning={storageWarning}
        onCleanup={() => cleanupOldSessions(5)} // Keep last 5 sessions
        onClearAll={handleClearAllSessions}
      />
      
      {/* Cookie Manager */}
      <CookieManager
        isOpen={showCookieManager}
        onClose={() => {
          setShowCookieManager(false)
          setPendingVideoUrl('')
        }}
        onSaveCookies={async (cookies) => {
          setShowCookieManager(false)
          if (pendingVideoUrl) {
            setIsDownloadingVideo(true)
            try {
              const result = await downloadVideoFromUrl(pendingVideoUrl, cookies)
              if (result.file) {
                setFilesWithPreviews(prev => [...prev, result.file!])
                addVideo({
                  url: result.file!.preview,
                  type: 'downloaded',
                  name: result.file!.file.name,
                  platform: cookieManagerPlatform
                })
                setNotification({
                  message: 'Video downloaded successfully',
                  description: 'The video has been added to your files.'
                })
              } else {
                setNotification({
                  message: 'Download failed',
                  description: result.error || 'Unable to download video with provided cookies.'
                })
              }
            } catch (error) {
              console.error('Cookie download error:', error)
              setNotification({
                message: 'Download error',
                description: 'An error occurred while downloading the video.'
              })
            } finally {
              setIsDownloadingVideo(false)
              setPendingVideoUrl('')
            }
          }
        }}
        platform={cookieManagerPlatform}
      />
    </div>
  )
}
