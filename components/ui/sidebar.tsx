"use client"
import { cn } from "@/lib/utils"
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import { MessageSquare, Plus, Music, Trash2, User, Settings, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useImages } from "@/contexts/images-context"

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "relative z-50 max-w-[280px] rounded-md bg-[#404040] text-white px-1.5 py-1 text-xs animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

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

const MediaGrid = ({ 
  isCollapsed, 
  items, 
  onItemClick,
  onItemDelete,
  showDeleteButton = false 
}: { 
  isCollapsed: boolean
  items: { id: string; src: string; prompt?: string }[]
  onItemClick?: (item: any) => void
  onItemDelete?: (id: string) => void
  showDeleteButton?: boolean
}) => (
  <motion.div variants={itemVariants}>
    {!isCollapsed && (
      <div className="grid grid-cols-4 gap-2 px-2">
        {items.map((item) => (
          <div key={item.id} className="relative group">
            <div 
              className="aspect-square rounded-md bg-[#404040] overflow-hidden cursor-pointer"
              onClick={() => onItemClick?.(item)}
            >
              <img 
                src={item.src || "/placeholder.svg"} 
                alt={item.prompt || "media thumbnail"} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200" 
              />
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
            No images yet
          </div>
        )}
      </div>
    )}
  </motion.div>
)

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
}

export function SessionNavBar({ onSettingsClick, onEditImage }: SessionNavBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [chatHistory, setChatHistory] = useState<string[]>([])
  const [videos, setVideos] = useState<{ id: string; src: string }[]>([])
  const [audio, setAudio] = useState<{ id: string; name: string }[]>([])
  const [selectedImage, setSelectedImage] = useState<any>(null)
  
  const { images, removeImage, clearImages } = useImages()

  const handleClearChatHistory = () => {
    setChatHistory([])
  }

  const handleImageClick = (item: any) => {
    setSelectedImage(item)
  }

  const handleClearImages = () => {
    if (window.confirm('Are you sure you want to clear all tracked images?')) {
      clearImages()
    }
  }

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
          <Button variant="ghost" className="w-full justify-start gap-2 text-white hover:bg-[#404040]">
            <Plus className="h-4 w-4" />
            <motion.span variants={itemVariants}>{!isCollapsed && "New Chat"}</motion.span>
          </Button>
        </div>

        <ScrollArea className="grow">
          <motion.div variants={staggerVariants} className="flex flex-col gap-4 p-2 pt-0">
            <div>
              <SidebarSectionHeader title="Chat History" isCollapsed={isCollapsed} onClear={handleClearChatHistory} />
              <motion.div variants={itemVariants} className="flex flex-col gap-1 mt-2">
                {!isCollapsed &&
                  chatHistory.map((chat) => (
                    <div
                      key={chat}
                      className="flex items-center gap-2 p-1.5 rounded-md hover:bg-[#404040] cursor-pointer"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <p className="text-sm truncate">{chat}</p>
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
              <MediaGrid 
                isCollapsed={isCollapsed} 
                items={images.map(img => ({ 
                  id: img.id, 
                  src: img.url,
                  prompt: img.prompt 
                }))}
                onItemClick={handleImageClick}
                onItemDelete={removeImage}
                showDeleteButton={true}
              />
            </div>

            <div>
              <SidebarSectionHeader title="Videos" isCollapsed={isCollapsed} />
              <MediaGrid isCollapsed={isCollapsed} items={videos} />
            </div>

            <div>
              <SidebarSectionHeader title="Audio" isCollapsed={isCollapsed} />
              <AudioList isCollapsed={isCollapsed} items={audio} />
            </div>
          </motion.div>
        </ScrollArea>

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
}
