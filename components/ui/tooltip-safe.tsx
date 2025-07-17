"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProviderProps {
  children: React.ReactNode
  delayDuration?: number
  skipDelayDuration?: number
  disableHoverableContent?: boolean
}

interface TooltipProps {
  children: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const TooltipContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>({
  open: false,
  onOpenChange: () => {},
})

const TooltipProvider = ({
  children,
  delayDuration = 700,
  skipDelayDuration = 300,
  disableHoverableContent = false,
}: TooltipProviderProps) => {
  return <>{children}</>
}

const Tooltip = ({ children, open: controlledOpen, defaultOpen = false, onOpenChange }: TooltipProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = onOpenChange || setUncontrolledOpen

  return (
    <TooltipContext.Provider value={{ open, onOpenChange: setOpen }}>
      {children}
    </TooltipContext.Provider>
  )
}

const TooltipTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ className, onMouseEnter, onMouseLeave, onClick, children, asChild = false, ...props }, ref) => {
  const { onOpenChange } = React.useContext(TooltipContext)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    onMouseEnter?.(e)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => onOpenChange(true), 200)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    onMouseLeave?.(e)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    onOpenChange(false)
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        onClick?.(e)
        ;(children as React.ReactElement<any>).props.onClick?.(e)
      },
      ...props,
    })
  }

  return (
    <span
      ref={ref as React.Ref<HTMLSpanElement>}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={cn(className)}
      {...props}
    >
      {children}
    </span>
  )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    sideOffset?: number
    side?: "top" | "right" | "bottom" | "left"
    align?: "start" | "center" | "end"
  }
>(({ className, sideOffset = 4, side = "top", align = "center", ...props }, ref) => {
  const { open } = React.useContext(TooltipContext)
  
  if (!open) return null

  return (
    <div
      ref={ref}
      role="tooltip"
      className={cn(
        "absolute z-50 max-w-[280px] rounded-md bg-[#404040] text-white px-1.5 py-1 text-xs",
        "animate-in fade-in-0 zoom-in-95",
        side === "top" && "bottom-full mb-1",
        side === "bottom" && "top-full mt-1",
        side === "left" && "right-full mr-1",
        side === "right" && "left-full ml-1",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && "right-0",
        className
      )}
      style={{ marginTop: side === "bottom" ? sideOffset : undefined, marginBottom: side === "top" ? sideOffset : undefined }}
      {...props}
    />
  )
})
TooltipContent.displayName = "TooltipContent"

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
}
