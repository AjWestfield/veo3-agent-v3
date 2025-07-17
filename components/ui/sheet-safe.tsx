"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Simple Sheet implementation without Radix UI to avoid ref composition issues
interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export const Sheet: React.FC<SheetProps> = ({ children, open, onOpenChange }) => {
  return <>{children}</>
}

export const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button ref={ref} className={className} {...props}>
    {children}
  </button>
))
SheetTrigger.displayName = "SheetTrigger"

export const SheetClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button ref={ref} className={className} {...props}>
    {children}
  </button>
))
SheetClose.displayName = "SheetClose"

export const SheetPortal: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

interface SheetOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SheetOverlay = React.forwardRef<HTMLDivElement, SheetOverlayProps>(
  ({ className, onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          className
        )}
        onClick={onClick}
        {...props}
      />
    )
  }
)
SheetOverlay.displayName = "SheetOverlay"

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left"
  onOpenChange?: (open: boolean) => void
}

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "right", className, children, onOpenChange, ...props }, ref) => {
    const sideClasses = {
      top: "inset-x-0 top-0 border-b",
      bottom: "inset-x-0 bottom-0 border-t",
      left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
      right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
    }

    return (
      <>
        <SheetOverlay onClick={() => onOpenChange?.(false)} />
        <div
          ref={ref}
          className={cn(
            "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out",
            sideClasses[side],
            className
          )}
          {...props}
        >
          {children}
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            onClick={() => onOpenChange?.(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>
      </>
    )
  }
)
SheetContent.displayName = "SheetContent"

export const SheetHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

export const SheetFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

export const SheetTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  ...props
}) => (
  <h3
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
)
SheetTitle.displayName = "SheetTitle"

export const SheetDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  ...props
}) => (
  <p
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
)
SheetDescription.displayName = "SheetDescription"

// Wrapper component to handle open/close state
interface SheetWrapperProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export function SheetWrapper({ open, onOpenChange, children }: SheetWrapperProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }
    
    if (open) {
      document.addEventListener('keydown', handleEscape)
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="sheet-root">
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child, { onOpenChange } as any)
          : child
      )}
    </div>
  )
}
