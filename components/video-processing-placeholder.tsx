"use client"

import { useEffect, useState } from 'react'

interface VideoProcessingPlaceholderProps {
  model?: 'kling-2.1' | 'veo-3-fast'
  message?: string
  subMessage?: string
}

export function VideoProcessingPlaceholder({ 
  model = 'kling-2.1',
  message,
  subMessage 
}: VideoProcessingPlaceholderProps) {
  const [dots, setDots] = useState(1)
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev % 3) + 1)
    }, 500)
    
    return () => clearInterval(interval)
  }, [])
  
  // Simulate progress for better UX
  useEffect(() => {
    const duration = model === 'veo-3-fast' ? 45000 : 60000 // VEO 3 is faster
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev // Stop at 90% until actual completion
        return prev + (100 / (duration / 1000))
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [model])
  
  const defaultMessage = 'Generating your video'
  const defaultSubMessage = model === 'veo-3-fast' 
    ? 'Creating 8-second video with audio'
    : 'Creating high-quality video'
  
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Main container with 16:9 aspect ratio for video */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] rounded-lg overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 opacity-50">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 animate-gradient-x" />
        </div>
        
        {/* Film strip pattern */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-black/30 flex items-center">
          <div className="flex gap-2 px-4 animate-slide-right">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-6 h-4 bg-white/10 rounded-sm flex-shrink-0" />
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/30 flex items-center">
          <div className="flex gap-2 px-4 animate-slide-right">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-6 h-4 bg-white/10 rounded-sm flex-shrink-0" />
            ))}
          </div>
        </div>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Animated icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center animate-pulse">
              <svg 
                width="40" 
                height="40" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
                className="text-white"
              >
                <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" fillOpacity="0.2"/>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            
            {/* Rotating ring */}
            <div className="absolute inset-0 -m-2 animate-spin-slow">
              <svg width="80" height="80" viewBox="0 0 80 80" className="opacity-30">
                <circle 
                  cx="40" 
                  cy="40" 
                  r="38" 
                  fill="none" 
                  stroke="url(#video-gradient)" 
                  strokeWidth="2"
                  strokeDasharray="30 15"
                />
                <defs>
                  <linearGradient id="video-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          
          {/* Status text */}
          <div className="text-center mb-4">
            <p className="text-white/90 text-base font-medium mb-2">
              {message || defaultMessage}{'.'.repeat(dots)}
            </p>
            <p className="text-white/60 text-sm mb-1">
              {subMessage || defaultSubMessage}
            </p>
            <p className="text-white/40 text-xs">
              Model: {model === 'veo-3-fast' ? 'VEO 3 Fast' : 'Kling 2.1 AI'}
            </p>
          </div>
          
          {/* Progress bar */}
          <div className="w-64 mb-2">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white/40 text-xs text-center mt-1">
              {Math.floor(progress)}%
            </p>
          </div>
          
          {/* Processing indicators */}
          <div className="flex gap-3 items-center">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-white/30 animate-pulse"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1.5s'
                  }}
                />
              ))}
            </div>
            <span className="text-white/40 text-xs">
              Processing frames
            </span>
          </div>
        </div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      
      {/* Additional info */}
      <div className="mt-3 text-center">
        <p className="text-gray-400 text-xs">
          {model === 'veo-3-fast' 
            ? 'Video generation typically takes 45-60 seconds'
            : 'Video generation typically takes 60-90 seconds'}
        </p>
      </div>
    </div>
  )
}

// Add required CSS animations to globals.css or tailwind config
const animationStyles = `
@keyframes slide-right {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

.animate-slide-right {
  animation: slide-right 10s linear infinite;
}
`