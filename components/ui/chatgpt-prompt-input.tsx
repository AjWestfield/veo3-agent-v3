"use client"

import * as React from "react"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./tooltip-safe"
import { Popover, PopoverTrigger, PopoverContent } from "./popover-safe"
import { Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogContent } from "./dialog-safe"
import { cn } from "@/lib/utils"
import { YouTubeEmbed } from "@next/third-parties/google"

export interface UploadedFile {
  id: string
  file: File
  thumbnail: string
  type: "image" | "video" | "audio"
  videoUrl?: string
  isLoading?: boolean
}

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 5V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Settings2Icon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 7h-9" />
    <path d="M14 17H5" />
    <circle cx="17" cy="17" r="3" />
    <circle cx="7" cy="7" r="3" />
  </svg>
)

const SendIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M12 5.25L12 18.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M18.75 12L12 5.25L5.25 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const GlobeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)

const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
)

const PaintBrushIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 512 512" fill="currentColor" {...props}>
    <g>
      <path d="M141.176,324.641l25.323,17.833c7.788,5.492,17.501,7.537,26.85,5.67c9.35-1.877,17.518-7.514,22.597-15.569l22.985-36.556l-78.377-55.222l-26.681,33.96c-5.887,7.489-8.443,17.081-7.076,26.511C128.188,310.69,133.388,319.158,141.176,324.641z" />
      <path d="M384.289,64.9c9.527-15.14,5.524-35.06-9.083-45.355l-0.194-0.129c-14.615-10.296-34.728-7.344-45.776,6.705L170.041,228.722l77.067,54.292L384.289,64.9z" />
      <path d="M504.745,445.939c-4.011,0-7.254,3.251-7.254,7.262s3.243,7.246,7.254,7.246c4.012,0,7.255-3.235,7.255-7.246S508.757,445.939,504.745,445.939z" />
      <path d="M457.425,432.594c3.914,0,7.092-3.179,7.092-7.101c0-3.898-3.178-7.077-7.092-7.077c-3.915,0-7.093,3.178-7.093,7.077C450.332,429.415,453.51,432.594,457.425,432.594z" />
      <path d="M164.493,440.972c14.671-20.817,16.951-48.064,5.969-71.089l-0.462-0.97l-54.898-38.675l-1.059-0.105c-25.379-2.596-50.256,8.726-64.928,29.552c-13.91,19.742-18.965,41.288-23.858,62.113c-3.333,14.218-6.778,28.929-13.037,43.05c-5.168,11.695-8.63,15.868-8.654,15.884L0,484.759l4.852,2.346c22.613,10.902,53.152,12.406,83.779,4.156C120.812,482.584,147.76,464.717,164.493,440.972z M136.146,446.504c-0.849,0.567-1.714,1.19-2.629,1.892c-10.06,7.91-23.17,4.505-15.188-11.54c7.966-16.054-6.09-21.198-17.502-10.652c-14.323,13.232-21.044,2.669-18.391-4.634c2.636-7.304,12.155-17.267,4.189-23.704c-4.788-3.882-10.967,1.795-20.833,9.486c-5.645,4.392-18.666,2.968-13.393-16.563c2.863-7.271,6.389-14.275,11.104-20.971c10.24-14.542,27.603-23.083,45.404-22.403l47.021,33.11c6.632,16.548,4.416,35.764-5.823,50.305C146.167,436.411,141.476,441.676,136.146,446.504z" />
      <path d="M471.764,441.992H339.549c-0.227-0.477-0.38-1.003-0.38-1.57c0-0.913,0.372-1.73,0.93-2.378h81.531c5.848,0,10.578-4.723,10.578-10.578c0-5.84-4.73-10.571-10.578-10.571H197.765c0.308,15.399-4.116,30.79-13.271,43.786c-11.218,15.925-27.214,28.913-46.196,38.036h303.802c6.551,0,11.864-5.314,11.864-11.872c0-6.559-5.314-11.873-11.864-11.873h-55.392c-3.299,0-5.977-2.668-5.977-5.968c0-1.246,0.47-2.313,1.1-3.267h89.934c6.559,0,11.881-5.305,11.881-11.873C483.645,447.306,478.323,441.992,471.764,441.992z" />
    </g>
  </svg>
)

const TelescopeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 512 512" fill="currentColor" {...props}>
    <g>
      <path d="M452.425,202.575l-38.269-23.11c-1.266-10.321-5.924-18.596-13.711-21.947l-86.843-52.444l-0.275,0.598c-3.571-7.653-9.014-13.553-16.212-16.668L166.929,10.412l-0.236,0.543v-0.016c-3.453-2.856-7.347-5.239-11.594-7.08C82.569-10.435,40.76,14.5,21.516,59.203C2.275,103.827,12.82,151.417,45.142,165.36c4.256,1.826,8.669,3.005,13.106,3.556l-0.19,0.464l146.548,40.669c7.19,3.107,15.206,3.004,23.229,0.37l-0.236,0.566L365.55,238.5c7.819,3.366,17.094,1.125,25.502-5.082l42.957,11.909c7.67,3.312,18.014-3.548,23.104-15.362C462.202,218.158,460.11,205.894,452.425,202.575z M154.516,99.56c-11.792,27.374-31.402,43.783-47.19,49.132c-6.962,2.281-13.176,2.556-17.605,0.637c-14.536-6.254-25.235-41.856-8.252-81.243c16.976-39.378,50.186-56.055,64.723-49.785c4.429,1.904,8.519,6.592,11.626,13.246C164.774,46.699,166.3,72.216,154.516,99.56z" />
      <path d="M297.068,325.878c-1.959-2.706-2.25-6.269-0.724-9.25c1.518-2.981,4.562-4.846,7.913-4.846h4.468c4.909,0,8.889-3.972,8.889-8.897v-7.74c0-4.909-3.98-8.897-8.889-8.897h-85.789c-4.908,0-8.897,3.988-8.897,8.897v7.74c0,4.925,3.989,8.897,8.897,8.897h4.492c3.344,0,6.388,1.865,7.914,4.846c1.518,2.981,1.235,6.544-0.732,9.25L128.715,459.116c-3.225,4.287-2.352,10.36,1.927,13.569c4.295,3.225,10.368,2.344,13.578-1.943l107.884-122.17l4.036,153.738c0,5.333,4.342,9.691,9.691,9.691c5.358,0,9.692-4.358,9.692-9.691l4.043-153.738l107.885,122.17c3.209,4.287,9.282,5.168,13.568,1.943c4.288-3.209,5.145-9.282,1.951-13.569L297.068,325.878z" />
      <path d="M287.227,250.81c0-11.807-9.573-21.388-21.396-21.388c-11.807,0-21.38,9.582-21.38,21.388c0,11.831,9.574,21.428,21.38,21.428C277.654,272.238,287.227,262.642,287.227,250.81z" />
    </g>
  </svg>
)

const VideoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M15 10L20.5 6.5A1 1 0 0 1 22 7.5V16.5A1 1 0 0 1 20.5 17.5L15 14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="2"
      y="6"
      width="13"
      height="12"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
)

const UndoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
  </svg>
)

const RedoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
  </svg>
)

const MicIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
  </svg>
)

const toolsList = [
  { id: "createImage", name: "Create an image", shortName: "Image", icon: PaintBrushIcon },
  { id: "searchWeb", name: "Search the web", shortName: "Search", icon: GlobeIcon },
  { id: "writeCode", name: "Write or code", shortName: "Write", icon: PencilIcon },
  { id: "deepResearch", name: "Run deep research", shortName: "Deep Search", icon: TelescopeIcon, extra: "5 left" },
  { id: "generateVideo", name: "Generate video", shortName: "Video", icon: VideoIcon },
]

const getYouTubeVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? match[2] : null
}

interface PromptBoxProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  chatHistory?: Array<{ role: string; content: string }>
  onFilesChange?: (files: UploadedFile[]) => void
  selectedTool?: string | null
  onToolChange?: (tool: string | null) => void
  onEditImage?: (imageUrl: string, imageName: string) => void
  onAnimateImage?: (imageUrl: string, imageName: string) => void
}

export const PromptBox = React.forwardRef<HTMLTextAreaElement, PromptBoxProps>(
  ({ className, chatHistory = [], onFilesChange, selectedTool: externalSelectedTool, onToolChange, onEditImage, onAnimateImage, ...props }, ref) => {
    const internalTextareaRef = React.useRef<HTMLTextAreaElement>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [value, setValue] = React.useState("")
    const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([])
    const [isDragOver, setIsDragOver] = React.useState(false)
    const [selectedTool, setSelectedTool] = React.useState<string | null>(externalSelectedTool || null)
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
    const [selectedFilePreview, setSelectedFilePreview] = React.useState<UploadedFile | null>(null)
    const [isFileDialogOpen, setIsFileDialogOpen] = React.useState(false)
    const [isProcessingPaste, setIsProcessingPaste] = React.useState(false)
    
    // Prompt enhancement states
    const [promptHistory, setPromptHistory] = React.useState<string[]>([])
    const [historyIndex, setHistoryIndex] = React.useState(-1)
    const [isEnhancing, setIsEnhancing] = React.useState(false)
    const [hasEnhanced, setHasEnhanced] = React.useState(false)
    
    // Sync external selectedTool changes
    React.useEffect(() => {
      if (externalSelectedTool !== undefined) {
        setSelectedTool(externalSelectedTool)
      }
    }, [externalSelectedTool])
    
    // Notify parent when files change
    React.useEffect(() => {
      if (onFilesChange) {
        onFilesChange(uploadedFiles)
      }
    }, [uploadedFiles, onFilesChange])

    React.useEffect(() => {
      return () => {
        uploadedFiles.forEach((uploadedFile) => {
          if (uploadedFile.type === "video" && uploadedFile.videoUrl && uploadedFile.videoUrl.startsWith("blob:")) {
            URL.revokeObjectURL(uploadedFile.videoUrl)
          }
        })
      }
    }, [uploadedFiles])

    React.useImperativeHandle(ref, () => internalTextareaRef.current!, [])

    React.useLayoutEffect(() => {
      const textarea = internalTextareaRef.current
      if (textarea) {
        textarea.style.height = "auto"
        const newHeight = Math.min(textarea.scrollHeight, 200)
        textarea.style.height = `${newHeight}px`
      }
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value)
      if (props.onChange) props.onChange(e)
      
      // Reset enhancement state when user manually edits
      if (hasEnhanced) {
        setHasEnhanced(false)
        setPromptHistory([])
        setHistoryIndex(-1)
      }
    }
    
    const handleEnhancePrompt = async () => {
      if (!value.trim() || isEnhancing) return
      
      setIsEnhancing(true)
      
      try {
        // Save current prompt to history
        const newHistory = [...promptHistory.slice(0, historyIndex + 1), value]
        setPromptHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
        
        // Use the chat history from props
        
        const response = await fetch('/api/enhance-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: value,
            chatHistory
          })
        })
        
        if (!response.ok) {
          throw new Error('Failed to enhance prompt')
        }
        
        const data = await response.json()
        
        // Update the value with enhanced prompt
        setValue(data.enhancedPrompt)
        
        // Add enhanced prompt to history
        const updatedHistory = [...newHistory, data.enhancedPrompt]
        setPromptHistory(updatedHistory)
        setHistoryIndex(updatedHistory.length - 1)
        setHasEnhanced(true)
        
        // Trigger onChange if needed
        if (props.onChange) {
          const syntheticEvent = {
            target: { value: data.enhancedPrompt }
          } as React.ChangeEvent<HTMLTextAreaElement>
          props.onChange(syntheticEvent)
        }
      } catch (error) {
        console.error('Error enhancing prompt:', error)
        // Optionally show error toast/notification
      } finally {
        setIsEnhancing(false)
      }
    }
    
    const handleUndo = () => {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setValue(promptHistory[newIndex])
        
        if (props.onChange) {
          const syntheticEvent = {
            target: { value: promptHistory[newIndex] }
          } as React.ChangeEvent<HTMLTextAreaElement>
          props.onChange(syntheticEvent)
        }
      }
    }
    
    const handleRedo = () => {
      if (historyIndex < promptHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setValue(promptHistory[newIndex])
        
        if (props.onChange) {
          const syntheticEvent = {
            target: { value: promptHistory[newIndex] }
          } as React.ChangeEvent<HTMLTextAreaElement>
          props.onChange(syntheticEvent)
        }
      }
    }

    const handlePlusClick = () => {
      fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])
      processFiles(files)
      event.target.value = ""
    }

    const processFiles = (files: File[]) => {
      files.forEach((file) => {
        const id = Math.random().toString(36).substr(2, 9)
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onloadend = () => {
            const newFile: UploadedFile = {
              id,
              file,
              thumbnail: reader.result as string,
              type: "image",
            }
            setUploadedFiles((prev) => [...prev, newFile])
          }
          reader.readAsDataURL(file)
        } else if (file.type.startsWith("video/")) {
          const videoUrl = URL.createObjectURL(file)
          const video = document.createElement("video")
          video.src = videoUrl
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          video.onloadedmetadata = () => {
            video.currentTime = Math.min(1, video.duration / 2)
          }

          video.onseeked = () => {
            if (ctx) {
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const thumbnail = canvas.toDataURL("image/jpeg", 0.8)
              const newFile: UploadedFile = {
                id,
                file,
                thumbnail,
                type: "video",
                videoUrl,
              }
              setUploadedFiles((prev) => [...prev, newFile])
            }
          }
          video.onerror = () => {
            const newFile: UploadedFile = {
              id,
              file,
              thumbnail: "",
              type: "video",
              videoUrl,
            }
            setUploadedFiles((prev) => [...prev, newFile])
          }
        } else if (file.type.startsWith("audio/")) {
          // Handle audio files
          const audioUrl = URL.createObjectURL(file)
          const newFile: UploadedFile = {
            id,
            file,
            thumbnail: "", // Audio files don't have visual thumbnails
            type: "audio" as any, // We'll need to update the type definition
            videoUrl: audioUrl, // Reuse videoUrl field for audio URL
          }
          setUploadedFiles((prev) => [...prev, newFile])
        }
      })
    }

    const handleRemoveFile = (fileId: string) => {
      const fileToRemove = uploadedFiles.find((f) => f.id === fileId)
      if (fileToRemove?.type === "video" && fileToRemove.videoUrl && fileToRemove.videoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileToRemove.videoUrl)
      }
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
    }

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('[DragEnter] Event triggered')
      setIsDragOver(true)
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'copy'
      console.log('[DragOver] Event triggered')
      setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('[DragLeave] Event triggered')
      
      // Check if we're truly leaving the drop zone
      const relatedTarget = e.relatedTarget as Node
      if (!e.currentTarget.contains(relatedTarget)) {
        setIsDragOver(false)
      }
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('[Drop] Event triggered', e.dataTransfer.files)
      setIsDragOver(false)
      
      const files = Array.from(e.dataTransfer.files)
      console.log('[Drop] Files:', files)
      if (files.length > 0) {
        processFiles(files)
      }
    }

    const handlePaste = async (e: React.ClipboardEvent) => {
      // Prevent duplicate processing
      if (isProcessingPaste) {
        console.log("[Video URL Paste] Already processing a paste, ignoring duplicate")
        return
      }
      
      const pastedText = e.clipboardData.getData("text")
      // Updated regex to match social media video URLs
      const videoUrlRegex = /https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|twitter\.com\/\w+\/status\/|x\.com\/\w+\/status\/|instagram\.com\/(?:p|reel|tv)\/|tiktok\.com\/(?:[@\w.-]+\/video\/\d+|t\/[\w]+)|vm\.tiktok\.com\/[\w]+|facebook\.com\/(?:watch\/?\?v=|\w+\/videos\/)|fb\.com\/(?:watch\/?\?v=|\w+\/videos\/)|fb\.watch\/|vimeo\.com\/\d+|dailymotion\.com\/video\/|reddit\.com\/r\/\w+\/comments\/|twitch\.tv\/videos\/|streamable\.com\/\w+)[\w\-._~:/?#[\]@!$&'()*+,;=%?&=]*/i
      
      if (videoUrlRegex.test(pastedText)) {
        e.preventDefault()
        const url = pastedText.trim()
        
        console.log("[Video URL Paste] Detected video URL:", url)
        console.log("[Video URL Paste] URL matches regex:", videoUrlRegex.test(url))
        
        setIsProcessingPaste(true)

        // Detect platform for better loading message
        const getPlatformFromUrl = (url: string) => {
          try {
            const urlObj = new URL(url)
            const hostname = urlObj.hostname.toLowerCase()
            if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'YouTube'
            if (hostname.includes('facebook.com') || hostname.includes('fb.com') || hostname.includes('fb.watch')) return 'Facebook'
            if (hostname.includes('instagram.com')) return 'Instagram'
            if (hostname.includes('tiktok.com') || hostname.includes('vm.tiktok.com')) return 'TikTok'
            if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'Twitter/X'
            return 'video'
          } catch {
            return 'video'
          }
        }

        const platform = getPlatformFromUrl(url)
        const id = Math.random().toString(36).substr(2, 9)
        const tempFile: UploadedFile = {
          id,
          file: new File([], url, { type: "text/plain" }),
          thumbnail: "",
          type: "video",
          isLoading: true,
        }
        setUploadedFiles((prev) => [...prev, tempFile])
        
        console.log(`[Video URL Paste] Downloading ${platform} video...`)

        try {
          console.log("[Video URL Paste] Calling API with URL:", url)
          const response = await fetch("/api/download-video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
            console.error("API Error:", response.status, errorData)
            throw new Error(errorData.error || "Failed to download video")
          }

          const data = await response.json()
          
          if (data.success && data.video) {
            // Convert base64 to blob
            const base64Response = await fetch(data.video.dataUrl)
            const blob = await base64Response.blob()
            
            // Create File object
            const videoFile = new File([blob], data.video.filename || "video.mp4", { type: 'video/mp4' })
            
            // Create video element to generate thumbnail
            const videoUrl = URL.createObjectURL(blob)
            const video = document.createElement("video")
            video.src = videoUrl
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")

            video.onloadedmetadata = () => {
              video.currentTime = Math.min(1, video.duration / 2)
            }

            video.onseeked = () => {
              if (ctx) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                const thumbnail = canvas.toDataURL("image/jpeg", 0.8)
                
                setUploadedFiles((prev) =>
                  prev.map((f) =>
                    f.id === id
                      ? {
                          id: f.id,
                          file: videoFile,
                          thumbnail,
                          type: "video",
                          videoUrl,
                          isLoading: false,
                        }
                      : f,
                  ),
                )
              }
              // Clean up the temporary video URL after thumbnail generation
              URL.revokeObjectURL(videoUrl)
            }

            video.onerror = () => {
              // If thumbnail generation fails, still update the file
              setUploadedFiles((prev) =>
                prev.map((f) =>
                  f.id === id
                    ? {
                        id: f.id,
                        file: videoFile,
                        thumbnail: "",
                        type: "video",
                        videoUrl,
                        isLoading: false,
                      }
                    : f,
                ),
              )
              URL.revokeObjectURL(videoUrl)
            }
          } else {
            throw new Error("Invalid response format")
          }
        } catch (error) {
          console.error("Error downloading video from URL:", error)
          
          // Enhanced error handling with platform-specific messages
          let errorMessage = "Failed to download video"
          let errorDetails = ""
          
          if (error instanceof Error) {
            errorMessage = error.message
            
            // Extract details from API response if available
            if (errorData?.details) {
              errorDetails = errorData.details
            }
            
            // Platform-specific error messages
            const platform = getPlatformFromUrl(url)
            
            if (platform === 'YouTube') {
              if (errorMessage.includes("sign-in verification") || errorMessage.includes("bot")) {
                errorMessage = "YouTube requires sign-in verification"
                errorDetails = errorDetails || "This often happens with age-restricted or premium content. Try a public, non-age-restricted video."
              } else if (errorMessage.includes("rate limit")) {
                errorMessage = "YouTube rate limit exceeded"
                errorDetails = errorDetails || "Please wait a few minutes before trying again."
              } else if (errorMessage.includes("DRM protected")) {
                errorMessage = "This YouTube video is DRM protected"
                errorDetails = errorDetails || "DRM protected videos cannot be downloaded."
              }
            } else if (platform === 'Facebook') {
              if (errorMessage.includes("requires login")) {
                errorMessage = "This Facebook video requires login"
                errorDetails = errorDetails || "Only public Facebook videos can be downloaded without authentication."
              } else if (errorMessage.includes("private")) {
                errorMessage = "This Facebook video is private"
                errorDetails = errorDetails || "Make sure the video is publicly accessible."
              }
            }
            
            // General error messages
            if (errorMessage.includes("private") || errorMessage.includes("unavailable")) {
              errorMessage = "This video is private or has been removed"
            } else if (errorMessage.includes("geo-restricted") || errorMessage.includes("geo-blocked")) {
              errorMessage = "This video is geo-restricted"
              errorDetails = errorDetails || "The video is not available in your location."
            } else if (errorMessage.includes("authentication") || errorMessage.includes("Access forbidden")) {
              errorMessage = "This video requires authentication"
              errorDetails = errorDetails || "You need to be logged in to access this video."
            } else if (errorMessage.includes("platform is not supported")) {
              errorMessage = "Video platform not supported"
              errorDetails = errorDetails || "This video platform or URL format is not recognized."
            } else if (errorMessage.includes("size limit")) {
              errorMessage = "Video exceeds size limit"
              errorDetails = errorDetails || "The video is larger than the 1GB limit."
            } else if (errorMessage.includes("timeout")) {
              errorMessage = "Download timed out"
              errorDetails = errorDetails || "The video is taking too long to download. It might be too large."
            }
          }
          
          console.error("Detailed error:", errorMessage, errorDetails)
          
          // Create a more informative error message
          const fullErrorMessage = errorDetails 
            ? `${errorMessage}\n\n${errorDetails}`
            : errorMessage
            
          alert(`Video download failed:\n\n${fullErrorMessage}`)
          setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
        } finally {
          setIsProcessingPaste(false)
        }
      }
    }

    const hasValue = value.trim().length > 0 || uploadedFiles.length > 0
    const activeTool = selectedTool ? toolsList.find((t) => t.id === selectedTool) : null
    const ActiveToolIcon = activeTool?.icon

    return (
      <div
        className={cn(
          "relative flex flex-col rounded-[28px] p-2 shadow-sm transition-all duration-200 bg-[#2f2f2f] border text-white cursor-text",
          isDragOver ? "border-blue-500 bg-[#3a3a3a] scale-[1.02]" : "border-[#4a4a4a]",
          className,
        )}
        onClick={() => internalTextareaRef.current?.focus()}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*"
          multiple
          aria-label="Upload files"
          title="Upload image, video, or audio files"
        />

        {isDragOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[28px] bg-blue-500/20 backdrop-blur-sm border-2 border-dashed border-blue-500">
            <div className="flex flex-col items-center gap-2 text-white">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium">Drop files here</p>
              <p className="text-sm text-white/80">Images, videos, and audio files supported</p>
            </div>
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-1">
            {uploadedFiles.map((uploadedFile) => (
              <div key={uploadedFile.id} className="relative group">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-600 flex items-center justify-center">
                  {uploadedFile.isLoading ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                  ) : (
                    <>
                      {uploadedFile.type === "audio" ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-700">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        </div>
                      ) : (
                        <>
                          <img
                            src={uploadedFile.thumbnail || "/placeholder.svg"}
                            alt={uploadedFile.type === "video" ? "Video thumbnail" : "Image preview"}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedFilePreview(uploadedFile)
                              setIsFileDialogOpen(true)
                            }}
                          />
                          {uploadedFile.type === "video" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg pointer-events-none">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFile(uploadedFile.id)
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={internalTextareaRef}
          rows={1}
          value={value}
          onChange={handleInputChange}
          onPaste={handlePaste}
          placeholder="Ask anything or paste a video URL..."
          className="custom-scrollbar w-full resize-none border-0 bg-transparent p-3 text-white placeholder:text-gray-400 focus:ring-0 focus-visible:outline-none min-h-12"
          {...props}
        />

        <div className="mt-0.5 p-1 pt-0">
          <TooltipProvider delayDuration={100}>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handlePlusClick}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-[#404040] focus-visible:outline-none"
                  >
                    <PlusIcon className="h-6 w-6" />
                    <span className="sr-only">Attach files</span>
                  </button>
                </TooltipTrigger>
                {uploadedFiles.length === 0 && (
                  <TooltipContent side="top">
                    <p>Attach files</p>
                  </TooltipContent>
                )}
              </Tooltip>

              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger
                      type="button"
                      className="flex h-8 items-center gap-2 rounded-full p-2 text-sm text-white transition-colors hover:bg-[#404040] focus-visible:outline-none focus-visible:ring-ring"
                    >
                      <Settings2Icon className="h-4 w-4" />
                      {!selectedTool && "Tools"}
                    </PopoverTrigger>
                  </TooltipTrigger>
                  {!selectedTool && (
                    <TooltipContent side="top">
                      <p>Explore Tools</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                <PopoverContent align="start">
                  <div className="flex flex-col gap-1">
                    {toolsList.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          const newTool = tool.id
                          setSelectedTool(newTool)
                          setIsPopoverOpen(false)
                          if (onToolChange) {
                            onToolChange(newTool)
                          }
                        }}
                        className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-[#404040]"
                      >
                        <tool.icon className="h-4 w-4" />
                        <span>{tool.name}</span>
                        {tool.extra && (
                          <span className="ml-auto text-xs text-muted-foreground dark:text-gray-400">{tool.extra}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {activeTool && (
                <>
                  <div className="h-4 w-px bg-gray-600" />
                  <button
                    onClick={() => {
                      setSelectedTool(null)
                      if (onToolChange) {
                        onToolChange(null)
                      }
                    }}
                    className="flex h-8 items-center justify-center gap-2 rounded-full px-2 text-sm hover:bg-[#404040] cursor-pointer text-[#99ceff] transition-colors"
                  >
                    {ActiveToolIcon && <ActiveToolIcon className="h-4 w-4" />}
                    {activeTool.shortName}
                    <XIcon className="h-4 w-4" />
                  </button>
                </>
              )}

              <div className="ml-auto flex items-center gap-2">
                {/* Prompt Enhancement Controls */}
                {value.trim() && (
                  <>
                    {hasEnhanced && historyIndex > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={handleUndo}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-[#404040] focus-visible:outline-none"
                          >
                            <UndoIcon className="h-5 w-5" />
                            <span className="sr-only">Undo enhancement</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Undo</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={handleEnhancePrompt}
                          disabled={isEnhancing}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-[#404040] focus-visible:outline-none disabled:opacity-50"
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
                            <SparklesIcon className="h-5 w-5" />
                          )}
                          <span className="sr-only">Enhance prompt</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{isEnhancing ? "Enhancing..." : "Enhance prompt"}</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    {hasEnhanced && historyIndex < promptHistory.length - 1 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={handleRedo}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-[#404040] focus-visible:outline-none"
                          >
                            <RedoIcon className="h-5 w-5" />
                            <span className="sr-only">Redo enhancement</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Redo</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    
                    {value.trim() && (
                      <div className="h-4 w-px bg-gray-600" />
                    )}
                  </>
                )}
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-[#404040] focus-visible:outline-none"
                    >
                      <MicIcon className="h-5 w-5" />
                      <span className="sr-only">Record voice</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Record voice</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="submit"
                      disabled={!hasValue}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80 disabled:bg-black/40 dark:disabled:bg-[#515151]"
                    >
                      <SendIcon className="h-6 w-6 text-bold" />
                      <span className="sr-only">Send message</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Send</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </TooltipProvider>
        </div>
        <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
          <DialogContent className="bg-[#2f2f2f] border-[#4a4a4a] text-white max-w-4xl max-h-[90vh] overflow-auto">
            {selectedFilePreview && (
              <div className="w-full relative">
                {/* File name header */}
                <div className="absolute top-4 left-4 z-10 bg-black/50 rounded-lg px-3 py-2 max-w-[60%]">
                  <p className="text-white text-sm">{selectedFilePreview.file.name}</p>
                </div>

                {/* Close button */}
                <button
                  onClick={() => setIsFileDialogOpen(false)}
                  className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Close modal"
                >
                  <XIcon className="h-6 w-6 text-white" />
                </button>

                {/* File content */}
                {selectedFilePreview.videoUrl && getYouTubeVideoId(selectedFilePreview.videoUrl) ? (
                  <div className="aspect-video w-full">
                    <YouTubeEmbed
                      videoid={getYouTubeVideoId(selectedFilePreview.videoUrl)!}
                      params="autoplay=1"
                      playlabel="Play video"
                    />
                  </div>
                ) : selectedFilePreview.type === "image" ? (
                  <div className="relative">
                    <img
                      src={selectedFilePreview.thumbnail || "/placeholder.svg"}
                      alt="Full size preview"
                      className="w-full max-h-[70vh] object-contain rounded-lg"
                    />
                    
                    {/* Edit and Animate buttons for images */}
                    {(onEditImage || onAnimateImage) && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                        {onEditImage && (
                          <button
                            onClick={() => {
                              onEditImage(selectedFilePreview.thumbnail || "", selectedFilePreview.file.name)
                              setIsFileDialogOpen(false)
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors border border-white/20"
                          >
                            <PencilIcon className="w-4 h-4" />
                            Edit Image
                          </button>
                        )}
                        {onAnimateImage && (
                          <button
                            onClick={() => {
                              onAnimateImage(selectedFilePreview.thumbnail || "", selectedFilePreview.file.name)
                              setIsFileDialogOpen(false)
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-700/90 text-white rounded-lg backdrop-blur-sm transition-colors border border-purple-500/20"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            Animate
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : selectedFilePreview.type === "audio" ? (
                  <div className="w-full p-8 bg-[#404040] rounded-[24px]">
                    <div className="flex flex-col items-center gap-4">
                      <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                      <p className="text-white text-lg">{selectedFilePreview.file.name}</p>
                      <audio
                        src={selectedFilePreview.videoUrl}
                        controls
                        autoPlay
                        className="w-full max-w-md"
                      >
                        Your browser does not support the audio tag.
                      </audio>
                    </div>
                  </div>
                ) : (
                  <video
                    src={selectedFilePreview.videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full max-h-[70vh] rounded-lg outline-none"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  },
)

PromptBox.displayName = "PromptBox"
