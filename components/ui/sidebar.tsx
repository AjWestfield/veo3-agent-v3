"use client"
import { cn } from "@/lib/utils"
import * as React from "react"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./tooltip-safe"

import { ScrollAreaSafe } from "@/components/ui/scroll-area-safe"
import { motion } from "framer-motion"
import { MessageSquare, Plus, Music, Trash2, User, Settings, X, Clock } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
      variant="ghost"
      size="sm"
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
              variant="ghost"
              size="icon"
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
  mediaType = "image"
}: {
  isCollapsed: boolean
  items: { id: string; src: string; prompt?: string }[]
  onItemClick?: (item: any) => void
  onItemDelete?: (id: string) => void
  showDeleteButton?: boolean
  emptyMessage?: string
  mediaType?: "image" | "video" | "audio"
}) {
  return (
    <motion.div variants={itemVariants}>
      {!isCollapsed && (
        <div className="grid grid-cols-4 gap-2 px-2">
          {items.map((item) => (
            <div key={item.id} className="relative group">
              <div
                className="aspect-square rounded-md bg-[#404040] overflow-hidden cursor-pointer relative"
                onClick={() => onItemClick?.(item)}
              >
                {mediaType === "video" ? (
                  <>
                    <video
                      src={item.src}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                      <div className="w-6 h-6 bg-white/80 rounded-full flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M8 5v14l11-7z" fill="black"/>
                        </svg>
                      </div>
                    </div>
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
              </div>
              {showDeleteButton && onItemDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onItemDelete(item.id)
                  }}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete image"
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
  onMultiEditClick?: () => void
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

  const { images, removeImage, clearImages } = useImages()
  const { videos, removeVideo, clearVideos } = useVideos()
  const { audios, removeAudio, clearAudios } = useAudios()
  const { sessions, deleteSession, clearAllSessions } = useChatSessions()

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
    >
      <motion.div
        className="relative z-40 flex h-full shrink-0 flex-col bg-[#2f2f2f] text-gray-400 transition-all"
        variants={contentVariants}
      >
        <SidebarHeader isCollapsed={isCollapsed} />

        <div className="flex flex-col p-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-white hover:bg-[#404040]"
            onClick={onNewChat}
          >
            <Plus className="h-4 w-4" />
            <motion.span variants={itemVariants}>{!isCollapsed && "New Chat"}</motion.span>
          </Button>
        </div>

        <ScrollAreaSafe className="grow">
          <motion.div variants={staggerVariants} className="flex flex-col gap-4 p-2 pt-0">
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
              {!isCollapsed && images.length > 0 && onMultiEditClick && (
                <motion.div variants={itemVariants} className="px-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center gap-2 text-xs bg-transparent border-[#4a4a4a] text-white hover:bg-[#404040] hover:text-white"
                    onClick={onMultiEditClick}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Multiple
                  </Button>
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
                onItemDelete={removeImage}
                showDeleteButton={true}
              />
            </div>

            <div>
              <SidebarSectionHeader
                title={`Videos${!isCollapsed && videos.length > 0 ? ` (${videos.length})` : ''}`}
                isCollapsed={isCollapsed}
                onClear={videos.length > 0 ? handleClearVideos : undefined}
              />
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
                onItemDelete={removeVideo}
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
                onItemDelete={removeAudio}
                showDeleteButton={true}
                emptyMessage="No audio files yet"
                mediaType="audio"
              />
            </div>
          </motion.div>
        </ScrollAreaSafe>

        <div className="mt-auto border-t border-[#4a4a4a] p-2">
          <Button variant="ghost" className="w-full justify-start gap-2 text-white hover:bg-[#404040]">
            <User className="h-4 w-4" />
            <motion.span variants={itemVariants}>{!isCollapsed && "Account"}</motion.span>
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-white hover:bg-[#404040]"
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

            {/* Edit Image button */}
            {onEditImage && (
              <button
                type="button"
                onClick={() => {
                  onEditImage(selectedImage.src, selectedImage.prompt || "Generated image")
                  setSelectedImage(null)
                }}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-sm transition-colors flex items-center gap-2 border border-white/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Image
              </button>
            )}
          </div>
        </div>
      </>
    )}
  </>
  )
})
