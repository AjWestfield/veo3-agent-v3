"use client"
import { cn } from "@/lib/utils"
import * as React from "react"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./tooltip-safe"

import { motion } from "framer-motion"
import { MessageSquare, Plus, Music, Trash2, User, Settings, X, Clock } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { useImages } from "@/contexts/images-context"
import { useVideos } from "@/contexts/videos-context"
import { useAudios } from "@/contexts/audios-context"
import { useChatSessions } from "@/contexts/chat-sessions-context"

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "3.05rem",
  },
}

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
}

const itemVariants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
}

const transitionProps = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
}

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
  closed: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
}

const SidebarHeader = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <div className="flex h-[54px] w-full shrink-0 items-center border-b border-[#4a4a4a] p-2">
    <Button
      variant={"ghost" as const}
      size={"sm" as const}
      className="flex w-full items-center justify-start gap-2 px-2 text-white hover:bg-[#404040]"
    >
      <Avatar className="rounded size-4 bg-gray-700">
        <AvatarFallback className="bg-transparent text-white">P</AvatarFallback>
      </Avatar>
      <motion.span variants={itemVariants} className="flex w-fit items-center gap-2">
        {!isCollapsed && <p className="text-sm font-medium">Projects</p>}
      </motion.span>
    </Button>
  </div>
)

const SidebarSectionHeader = ({
  title,
  isCollapsed,
  onClear,
}: {
  title: string
  isCollapsed: boolean
  onClear?: () => void
}) => (
  <motion.div variants={staggerVariants} className="flex items-center justify-between px-2 pt-2">
    <motion.p variants={itemVariants} className="text-xs font-semibold text-gray-500">
      {!isCollapsed && title}
    </motion.p>
    {!isCollapsed && onClear && (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={"ghost" as const}
              size={"icon" as const}
              className="h-6 w-6 text-gray-500 transition-colors hover:text-red-400"
              onClick={onClear}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Clear chat history</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Clear chat history</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </motion.div>
)

const MediaGrid = React.memo(function MediaGrid({
  isCollapsed,
  items,
  onItemClick,
  onItemDelete,
  showDeleteButton = false,
  emptyMessage = "No images yet",
  mediaType = "image",
  isSelectionMode = false,
  selectedIds = [],
  onItemSelect,
  onRetryItem,
  retryingItems = new Set()
}: {
  isCollapsed: boolean
  items: { id: string; src: string; prompt?: string }[]
  onItemClick?: (item: any) => void
  onItemDelete?: (id: string) => void | Promise<boolean>
  showDeleteButton?: boolean
  emptyMessage?: string
  mediaType?: "image" | "video" | "audio"
  isSelectionMode?: boolean
  selectedIds?: string[]
  onItemSelect?: (id: string) => void
  onRetryItem?: (id: string) => void
  retryingItems?: Set<string>
}) {
  const [brokenItems, setBrokenItems] = React.useState<Set<string>>(new Set())
  
  return (
    <motion.div variants={itemVariants}>
      {!isCollapsed && (
        <div className="grid grid-cols-4 gap-2 px-2">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              <div
                className={`aspect-square rounded-md bg-[#404040] overflow-hidden cursor-pointer relative transition-all ${
                  isSelectionMode && selectedIds.includes(item.id) 
                    ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-[#1a1a1a]' 
                    : ''
                }`}
                onClick={() => {
                  if (isSelectionMode) {
                    onItemSelect?.(item.id)
                  } else {
                    onItemClick?.(item)
                  }
                }}
              >
                {mediaType === "video" ? (
                  <>
                    {!brokenItems.has(item.id) ? (
                      <>
                        <video
                          src={item.src}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                          onError={(e) => {
                            console.log('Video failed to load:', item.src)
                            setBrokenItems(prev => new Set(prev).add(item.id))
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                          <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M8 5v14l11-7z" fill="black"/>
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex flex-col items-center justify-center text-white text-xs">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mb-1 opacity-60">
                          <path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V10.5L1,13V20A1,1 0 0,0 2,21H22A1,1 0 0,0 23,20V13L21,10.5M16,10.5H15.5L14,8.75L12.5,10.5H7.5L9,8.75L7.5,7H16V10.5Z" />
                        </svg>
                        <span className="opacity-80 mb-1">Video Unavailable</span>
                        {onRetryItem && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setBrokenItems(prev => {
                                const newSet = new Set(prev)
                                newSet.delete(item.id)
                                return newSet
                              })
                              onRetryItem(item.id)
                            }}
                            disabled={retryingItems.has(item.id)}
                            className="text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 px-2 py-1 rounded text-white transition-colors"
                          >
                            {retryingItems.has(item.id) ? 'Retrying...' : 'Retry'}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : mediaType === "audio" ? (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                    <Music className="h-6 w-6 text-white" />
                  </div>
                ) : (
                  <img
                    src={item.src || "/placeholder.svg"}
                    alt={item.prompt || "media thumbnail"}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                )}
                
                {/* Selection checkbox overlay */}
                {isSelectionMode && (
                  <div className={`absolute inset-0 bg-black/40 transition-opacity ${
                    selectedIds.includes(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <div className="absolute top-2 right-2">
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={() => onItemSelect?.(item.id)}
                        className="bg-white/20 border-white/50 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                )}
              </div>
              {showDeleteButton && onItemDelete && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    const result = onItemDelete(item.id)
                    if (result instanceof Promise) {
                      await result
                    }
                  }}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Delete ${mediaType}`}
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-4 text-xs text-gray-500 text-center py-2">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
})

const AudioList = ({ isCollapsed, items }: { isCollapsed: boolean; items: { id: string; name: string }[] }) => (
  <motion.div variants={itemVariants} className="flex flex-col gap-1 px-2">
    {!isCollapsed &&
      (items.length > 0 ? (
        items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[#404040] cursor-pointer">
            <Music className="h-4 w-4 text-gray-400" />
            <p className="text-sm truncate">{item.name}</p>
          </div>
        ))
      ) : (
        <p className="text-xs text-gray-500 px-1.5">No audio files.</p>
      ))}
  </motion.div>
)

interface SessionNavBarProps {
  onSettingsClick?: () => void
  onEditImage?: (url: string, alt: string) => void
  onAnimateImage?: (url: string, alt: string) => void
  onMultiEditClick?: (selectedImages: Array<{ id: string; url: string; prompt?: string }>) => void
  onImageClick?: (imageData: any) => void
  onVideoClick?: (videoData: any) => void
  onAudioClick?: (audioData: any) => void
  onNewChat?: () => void
  onSessionClick?: (sessionId: string) => void
  currentSessionId?: string | null
}

export const SessionNavBar = React.memo(function SessionNavBar({ 
  onSettingsClick, 
  onEditImage, 
  onAnimateImage,
  onMultiEditClick, 
  onImageClick, 
  onVideoClick,
  onAudioClick,
  onNewChat,
  onSessionClick,
  currentSessionId
}: SessionNavBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [audio, setAudio] = useState<{ id: string; name: string }[]>([])
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [retryingVideos, setRetryingVideos] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)

  const { images, removeImageWithConfirmation, undoDelete: undoImageDelete, recentlyDeleted: recentlyDeletedImage, clearImages } = useImages()
  const { videos, removeVideoWithConfirmation, undoDelete: undoVideoDelete, recentlyDeleted: recentlyDeletedVideo, clearVideos, retryFailedVideo } = useVideos()
  const { audios, removeAudioWithConfirmation, undoDelete: undoAudioDelete, recentlyDeleted: recentlyDeletedAudio, clearAudios } = useAudios()
  const { sessions, deleteSession, clearAllSessions } = useChatSessions()

  // Selection helper functions
  const toggleImageSelection = (imageId: string) => {
    setSelectedImageIds(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const selectAllImages = () => {
    setSelectedImageIds(images.map(img => img.id))
  }

  const deselectAllImages = () => {
    setSelectedImageIds([])
  }

  const getSelectedImages = () => {
    return images.filter(img => selectedImageIds.includes(img.id))
  }

  const handleMultiEditClick = () => {
    if (onMultiEditClick && selectedImageIds.length > 0) {
      const selectedImages = getSelectedImages().map(img => ({
        id: img.id,
        url: img.url,
        prompt: img.prompt
      }))
      onMultiEditClick(selectedImages)
      // Reset selection after opening modal
      setSelectedImageIds([])
      setIsSelectionMode(false)
    }
  }

  // Ensure scrolling works when content changes
  useEffect(() => {
    if (scrollRef.current && !isCollapsed) {
      // Force browser to recalculate scrollable area
      scrollRef.current.style.overflow = 'hidden';
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.style.overflow = 'auto';
        }
      }, 0);
    }
  }, [images.length, videos.length, audios.length, sessions.length, isCollapsed])

  const handleClearChatHistory = useCallback(() => {
    clearAllSessions()
  }, [clearAllSessions])

  const handleImageClick = useCallback((item: any) => {
    setSelectedImage(item)
  }, [])

  const handleClearImages = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all tracked images?')) {
      clearImages()
    }
  }, [clearImages])

  const handleClearVideos = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all tracked videos?')) {
      clearVideos()
    }
  }, [clearVideos])


  const handleClearAudios = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all tracked audio files?')) {
      clearAudios()
    }
  }, [clearAudios])

  const handleRetryVideo = useCallback(async (videoId: string) => {
    setRetryingVideos(prev => new Set(prev).add(videoId))
    
    try {
      const success = await retryFailedVideo(videoId)
      if (success) {
        console.log('Video retry successful for:', videoId)
      } else {
        console.log('Video retry failed for:', videoId)
      }
    } catch (error) {
      console.error('Error retrying video:', error)
    } finally {
      setRetryingVideos(prev => {
        const newSet = new Set(prev)
        newSet.delete(videoId)
        return newSet
      })
    }
  }, [retryFailedVideo])

  return (
    <>
      <motion.div
      className={cn("sidebar fixed left-0 z-40 h-full shrink-0 border-r border-[#4a4a4a]")}
      initial="closed"
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
      data-collapsed={isCollapsed}
    >
        <motion.div
        className="relative z-40 flex h-full shrink-0 flex-col bg-[#2f2f2f] text-gray-400 transition-all overflow-hidden"
        variants={contentVariants}
      >
        <SidebarHeader isCollapsed={isCollapsed} />

        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-col p-2 border-b border-[#4a4a4a]">
            <Button variant={"ghost" as const} className="w-full justify-start gap-2 text-white hover:bg-[#404040] mb-2">
              <User className="h-4 w-4" />
              <motion.span variants={itemVariants}>{!isCollapsed && "Account"}</motion.span>
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={"ghost" as const}
                    className="w-full justify-start gap-2 text-white hover:bg-[#404040] mb-2"
                    onClick={onSettingsClick}
                  >
                    <Settings className="h-4 w-4" />
                    <motion.span variants={itemVariants}>{!isCollapsed && "Settings"}</motion.span>
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    Settings
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <Button 
              variant={"ghost" as const}
              className="w-full justify-start gap-2 text-white hover:bg-[#404040]"
              onClick={onNewChat}
            >
              <Plus className="h-4 w-4" />
              <motion.span variants={itemVariants}>{!isCollapsed && "New Chat"}</motion.span>
            </Button>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar h-full"
            onWheel={(e: React.WheelEvent) => {
              // Prevent scroll event from bubbling up
              e.stopPropagation();
            }}
          >
          <motion.div variants={staggerVariants} className="flex flex-col gap-4 p-2">
            <div>
              <SidebarSectionHeader 
                title={`Chat History${!isCollapsed && sessions.length > 0 ? ` (${sessions.length})` : ''}`} 
                isCollapsed={isCollapsed} 
                onClear={sessions.length > 0 ? handleClearChatHistory : undefined} 
              />
              <motion.div variants={itemVariants} className="flex flex-col gap-1 mt-2">
                {!isCollapsed && sessions.length === 0 && (
                  <p className="text-xs text-gray-500 px-2 py-1">No chat history yet</p>
                )}
                {!isCollapsed &&
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "group flex items-center gap-2 p-1.5 rounded-md hover:bg-[#404040] cursor-pointer relative",
                        currentSessionId === session.id && "bg-[#404040]"
                      )}
                      onClick={() => onSessionClick?.(session.id)}
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{session.title}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(session.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Delete session"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSession(session.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                      >
                        <X className="h-3 w-3 text-red-400" />
                      </button>
                    </div>
                  ))}
              </motion.div>
            </div>

            <Separator className="bg-[#4a4a4a]" />

            <div>
              <SidebarSectionHeader
                title={`Images${!isCollapsed && images.length > 0 ? ` (${images.length})` : ''}`}
                isCollapsed={isCollapsed}
                onClear={images.length > 0 ? handleClearImages : undefined}
              />
              {!isCollapsed && recentlyDeletedImage && (
                <motion.div 
                  variants={itemVariants} 
                  className="mx-2 mb-2 p-2 bg-orange-500/20 border border-orange-500/30 rounded-md flex items-center justify-between text-xs"
                >
                  <span className="text-orange-300">Image deleted</span>
                  <button
                    onClick={undoImageDelete}
                    className="text-orange-300 hover:text-orange-100 underline"
                  >
                    Undo
                  </button>
                </motion.div>
              )}
              {!isCollapsed && images.length > 0 && onMultiEditClick && (
                <motion.div variants={itemVariants} className="px-2 mb-2 space-y-2">
                  {!isSelectionMode ? (
                    <Button
                      variant={"outline" as const}
                      size={"sm" as const}
                      className="w-full justify-center gap-2 text-xs bg-transparent border-[#4a4a4a] text-white hover:bg-[#404040] hover:text-white"
                      onClick={() => setIsSelectionMode(true)}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Select Images to Edit
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{selectedImageIds.length} selected</span>
                        <div className="flex gap-1">
                          <button
                            onClick={selectAllImages}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            All
                          </button>
                          <span>•</span>
                          <button
                            onClick={deselectAllImages}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            None
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={"outline" as const}
                          size={"sm" as const}
                          className="flex-1 text-xs bg-transparent border-[#4a4a4a] text-white hover:bg-[#404040]"
                          onClick={() => {
                            setIsSelectionMode(false)
                            setSelectedImageIds([])
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant={"outline" as const}
                          size={"sm" as const}
                          className="flex-1 text-xs bg-blue-600/20 border-blue-500/50 text-blue-300 hover:bg-blue-600/30 disabled:opacity-50"
                          onClick={handleMultiEditClick}
                          disabled={selectedImageIds.length === 0}
                        >
                          Edit {selectedImageIds.length > 0 ? selectedImageIds.length : ''}
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
              <MediaGrid
                isCollapsed={isCollapsed}
                items={images.map(img => ({
                  id: img.id,
                  src: img.url,
                  prompt: img.prompt
                }))}
                onItemClick={onImageClick || handleImageClick}
                onItemDelete={removeImageWithConfirmation}
                showDeleteButton={!isSelectionMode}
                isSelectionMode={isSelectionMode}
                selectedIds={selectedImageIds}
                onItemSelect={toggleImageSelection}
              />
            </div>

            <div>
              <SidebarSectionHeader
                title={`Videos${!isCollapsed && videos.length > 0 ? ` (${videos.length})` : ''}`}
                isCollapsed={isCollapsed}
                onClear={videos.length > 0 ? handleClearVideos : undefined}
              />
              {!isCollapsed && recentlyDeletedVideo && (
                <motion.div 
                  variants={itemVariants} 
                  className="mx-2 mb-2 p-2 bg-orange-500/20 border border-orange-500/30 rounded-md flex items-center justify-between text-xs"
                >
                  <span className="text-orange-300">Video deleted</span>
                  <button
                    onClick={undoVideoDelete}
                    className="text-orange-300 hover:text-orange-100 underline"
                  >
                    Undo
                  </button>
                </motion.div>
              )}
              <MediaGrid
                isCollapsed={isCollapsed}
                items={videos.map(vid => ({
                  id: vid.id,
                  src: vid.url,
                  prompt: vid.name
                }))}
                onItemClick={(item) => {
                  // Handle video click if needed
                  if (onVideoClick) {
                    onVideoClick(item)
                  }
                }}
                onItemDelete={removeVideoWithConfirmation}
                onRetryItem={handleRetryVideo}
                retryingItems={retryingVideos}
                showDeleteButton={true}
                emptyMessage="No videos yet"
                mediaType="video"
              />
            </div>

            <div>
              <SidebarSectionHeader 
                title={`Audio${!isCollapsed && audios.length > 0 ? ` (${audios.length})` : ''}`}
                isCollapsed={isCollapsed}
                onClear={audios.length > 0 ? handleClearAudios : undefined}
              />
              {!isCollapsed && recentlyDeletedAudio && (
                <motion.div 
                  variants={itemVariants} 
                  className="mx-2 mb-2 p-2 bg-orange-500/20 border border-orange-500/30 rounded-md flex items-center justify-between text-xs"
                >
                  <span className="text-orange-300">Audio deleted</span>
                  <button
                    onClick={undoAudioDelete}
                    className="text-orange-300 hover:text-orange-100 underline"
                  >
                    Undo
                  </button>
                </motion.div>
              )}
              <MediaGrid
                isCollapsed={isCollapsed}
                items={audios.map(aud => ({
                  id: aud.id,
                  src: aud.url,
                  prompt: aud.name || 'Audio file'
                }))}
                onItemClick={(item) => {
                  // Handle audio click if needed
                  if (onAudioClick) {
                    onAudioClick(item)
                  }
                }}
                onItemDelete={removeAudioWithConfirmation}
                showDeleteButton={true}
                emptyMessage="No audio files yet"
                mediaType="audio"
              />
            </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>

    {/* Image Viewer Modal */}
    {selectedImage && (
      <>
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        />
        <div className="fixed inset-4 md:inset-8 z-50 flex items-center justify-center">
          <div className="relative max-w-4xl max-h-[90vh] rounded-lg overflow-hidden bg-[#2f2f2f]">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
              aria-label="Close image viewer"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Image info */}
            {selectedImage.prompt && (
              <div className="absolute top-4 left-4 z-10 bg-black/50 rounded-lg px-3 py-2 max-w-[60%]">
                <p className="text-white text-sm">{selectedImage.prompt}</p>
              </div>
            )}

            {/* Image */}
            <img
              src={selectedImage.src}
              alt={selectedImage.prompt || "Generated image"}
              className="max-w-full max-h-[90vh] object-contain"
            />

            {/* Action buttons */}
            {(onEditImage || onAnimateImage) && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {onEditImage && (
                  <button
                    type="button"
                    onClick={() => {
                      onEditImage(selectedImage.src, selectedImage.prompt || "Generated image")
                      setSelectedImage(null)
                    }}
                    className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-colors flex items-center gap-2 border border-white/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Image
                  </button>
                )}
                {onAnimateImage && (
                  <button
                    type="button"
                    onClick={() => {
                      onAnimateImage(selectedImage.src, selectedImage.prompt || "Generated image")
                      setSelectedImage(null)
                    }}
                    className="bg-purple-600/80 hover:bg-purple-700/90 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-colors flex items-center gap-2 border border-purple-500/20"
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
        </div>
      </>
    )}
  </>
  )
})
