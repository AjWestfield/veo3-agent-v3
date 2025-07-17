"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const PopoverContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>({
  open: false,
  onOpenChange: () => {},
})

const Popover = ({ open = false, onOpenChange = () => {}, children }: PopoverProps) => {
  return (
    <PopoverContext.Provider value={{ open, onOpenChange }}>
      {children}
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onClick, ...props }, ref) => {
  const { onOpenChange } = React.useContext(PopoverContext)
  
  return (
    <button
      ref={ref}
      onClick={(e) => {
        onClick?.(e)
        onOpenChange(true)
      }}
      className={cn(className)}
      {...props}
    />
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "center" | "end"
    sideOffset?: number
  }
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(PopoverContext)
  
  if (!open) return null
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        onClick={() => onOpenChange(false)}
      />
      {/* Content */}
      <div
        ref={ref}
        className={cn(
          "absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
          "animate-in fade-in-0 zoom-in-95",
          className
        )}
        style={{
          marginTop: `${sideOffset}px`,
        }}
        {...props}
      />
    </>
  )
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
