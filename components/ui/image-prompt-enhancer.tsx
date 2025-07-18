"use client"

import * as React from "react"
import { Textarea } from "@/components/ui/textarea"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip-safe"
import { cn } from "@/lib/utils"
import { useSettings } from "@/contexts/settings-context"

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="20"
    height="20"
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
    width="20"
    height="20"
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
    width="20"
    height="20"
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

interface ImagePromptEnhancerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  imageUrls?: string[]
  imageDescriptions?: string[]
  id?: string
}

export function ImagePromptEnhancer({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  imageUrls = [],
  imageDescriptions = [],
  id
}: ImagePromptEnhancerProps) {
  const { settings } = useSettings()
  const [promptHistory, setPromptHistory] = React.useState<string[]>([])
  const [historyIndex, setHistoryIndex] = React.useState(-1)
  const [isEnhancing, setIsEnhancing] = React.useState(false)
  const [hasEnhanced, setHasEnhanced] = React.useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    
    // Reset enhancement state when user manually edits
    if (hasEnhanced) {
      setHasEnhanced(false)
      setPromptHistory([])
      setHistoryIndex(-1)
    }
  }

  const handleEnhancePrompt = async () => {
    if (!value.trim() || isEnhancing || !settings.enhancePrompt) return
    
    setIsEnhancing(true)
    
    try {
      // Save current prompt to history
      const newHistory = [...promptHistory.slice(0, historyIndex + 1), value]
      setPromptHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
      
      const response = await fetch('/api/enhance-image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: value,
          imageUrls,
          imageDescriptions
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to enhance prompt')
      }
      
      const data = await response.json()
      
      // Update the value with enhanced prompt
      onChange(data.enhancedPrompt)
      
      // Add enhanced prompt to history
      const updatedHistory = [...newHistory, data.enhancedPrompt]
      setPromptHistory(updatedHistory)
      setHistoryIndex(updatedHistory.length - 1)
      setHasEnhanced(true)
    } catch (error) {
      console.error('Error enhancing prompt:', error)
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      onChange(promptHistory[newIndex])
    }
  }

  const handleRedo = () => {
    if (historyIndex < promptHistory.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      onChange(promptHistory[newIndex])
    }
  }

  return (
    <div className="relative">
      <Textarea
        id={id}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={cn("min-h-[100px] pr-24", className)}
        disabled={disabled || isEnhancing}
      />
      
      {settings.enhancePrompt && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <TooltipProvider>
            {hasEnhanced && historyIndex > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={disabled}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[#404040] hover:text-white focus-visible:outline-none disabled:opacity-50"
                  >
                    <UndoIcon />
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
                  disabled={disabled || isEnhancing || !value.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[#404040] hover:text-white focus-visible:outline-none disabled:opacity-50"
                >
                  {isEnhancing ? (
                    <svg
                      className="animate-spin h-5 w-5 text-gray-400"
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
                    <SparklesIcon />
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
                    disabled={disabled}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-[#404040] hover:text-white focus-visible:outline-none disabled:opacity-50"
                  >
                    <RedoIcon />
                    <span className="sr-only">Redo enhancement</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Redo</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      )}
    </div>
  )
}