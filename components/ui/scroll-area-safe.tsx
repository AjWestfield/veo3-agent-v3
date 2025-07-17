"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const ScrollAreaSafe = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative overflow-auto",
      // Custom scrollbar styles
      "[&::-webkit-scrollbar]:w-2",
      "[&::-webkit-scrollbar-track]:bg-transparent",
      "[&::-webkit-scrollbar-thumb]:bg-border",
      "[&::-webkit-scrollbar-thumb]:rounded-full",
      "[&::-webkit-scrollbar-thumb]:hover:bg-border/80",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
ScrollAreaSafe.displayName = "ScrollAreaSafe"

export { ScrollAreaSafe }
