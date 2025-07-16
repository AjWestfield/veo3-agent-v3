"use client"

import { useEffect, useState } from 'react'

interface ImageProcessingPlaceholderProps {
  type?: 'generation' | 'editing'
  message?: string
  subMessage?: string
}

export function ImageProcessingPlaceholder({ 
  type = 'generation',
  message,
  subMessage 
}: ImageProcessingPlaceholderProps) {
  const [dots, setDots] = useState(1)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev % 3) + 1)
    }, 500)
    
    return () => clearInterval(interval)
  }, [])
  
  const defaultMessage = type === 'generation' 
    ? 'Generating your image'
    : 'Editing your image'
    
  const defaultSubMessage = type === 'generation'
    ? 'This may take a few moments'
    : 'Applying your changes'
  
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Main container with aspect ratio for image */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-lg overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-gradient-x" />
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Animated icon */}
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center animate-pulse">
              {type === 'generation' ? (
                <svg 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                  className="text-white"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              ) : (
                <svg 
                  width="32" 
                  height="32" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                  className="text-white"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              )}
            </div>
            
            {/* Rotating ring */}
            <div className="absolute inset-0 animate-spin-slow">
              <svg width="64" height="64" viewBox="0 0 64 64" className="opacity-30">
                <circle 
                  cx="32" 
                  cy="32" 
                  r="30" 
                  fill="none" 
                  stroke="url(#gradient)" 
                  strokeWidth="2"
                  strokeDasharray="20 10"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          
          {/* Status text */}
          <div className="text-center">
            <p className="text-white/90 text-sm font-medium mb-1">
              {message || defaultMessage}{'.'.repeat(dots)}
            </p>
            <p className="text-white/50 text-xs">
              {subMessage || defaultSubMessage}
            </p>
          </div>
          
          {/* Progress indicators */}
          <div className="flex gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  )
}