'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface VideoDownloadProgressProps {
  url?: string
  platform?: string
  isComplete?: boolean
  error?: string
  videoCount?: number
}

export function VideoDownloadProgress({ 
  url, 
  platform = 'video',
  isComplete = false,
  error,
  videoCount = 1
}: VideoDownloadProgressProps) {
  const [progress, setProgress] = useState(0)
  const [downloadSpeed, setDownloadSpeed] = useState('0 MB/s')
  const [timeRemaining, setTimeRemaining] = useState('Calculating...')
  const [currentStage, setCurrentStage] = useState<'connecting' | 'downloading' | 'processing' | 'complete' | 'error'>('connecting')

  useEffect(() => {
    if (error) {
      setCurrentStage('error')
      return
    }

    if (isComplete) {
      setProgress(100)
      setCurrentStage('complete')
      return
    }

    // Simulate download progress
    const startTime = Date.now()
    const duration = 8000 + Math.random() * 4000 // 8-12 seconds

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const currentProgress = Math.min((elapsed / duration) * 100, 99)
      
      setProgress(currentProgress)
      
      // Update stage based on progress
      if (currentProgress < 10) {
        setCurrentStage('connecting')
      } else if (currentProgress < 90) {
        setCurrentStage('downloading')
        // Simulate download speed
        const speed = 2.5 + Math.random() * 2.5 // 2.5-5 MB/s
        setDownloadSpeed(`${speed.toFixed(1)} MB/s`)
        
        // Calculate time remaining
        const remaining = ((duration - elapsed) / 1000).toFixed(0)
        setTimeRemaining(`${remaining}s`)
      } else {
        setCurrentStage('processing')
        setDownloadSpeed('Processing...')
        setTimeRemaining('Almost done...')
      }
    }

    const interval = setInterval(updateProgress, 100)
    return () => clearInterval(interval)
  }, [isComplete, error])

  const getPlatformIcon = () => {
    switch (platform.toLowerCase()) {
      case 'youtube':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        )
      case 'facebook':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 3H3C1.89543 3 1 3.89543 1 5V19C1 20.1046 1.89543 21 3 21H21C22.1046 21 23 20.1046 23 19V5C23 3.89543 22.1046 3 21 3Z"/>
            <path d="M1 9H23"/>
            <path d="M8 21V9"/>
          </svg>
        )
    }
  }

  const getStageIcon = () => {
    switch (currentStage) {
      case 'connecting':
        return (
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeOpacity="0.2"/>
              <path d="M12 2C6.48 2 2 6.48 2 12" strokeLinecap="round"/>
            </svg>
          </motion.div>
        )
      case 'downloading':
        return (
          <motion.svg 
            className="w-6 h-6" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            initial={{ y: -5 }}
            animate={{ y: 5 }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </motion.svg>
        )
      case 'processing':
        return (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-6 h-6"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4m0 12v4m10-10h-4M6 12H2"/>
              <path d="M17.66 17.66l-2.83-2.83m-5.66 0l-2.83 2.83m0-11.32l2.83 2.83m5.66 0l2.83-2.83"/>
            </svg>
          </motion.div>
        )
      case 'complete':
        return (
          <motion.svg 
            className="w-6 h-6 text-green-500" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </motion.svg>
        )
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        )
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-blue-400">
            {getPlatformIcon()}
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">
              Downloading {videoCount > 1 ? `${videoCount} videos` : 'video'} from {platform}
            </h3>
            {url && (
              <p className="text-xs text-gray-400 truncate max-w-md">
                {url}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStageIcon()}
          <span className="text-xs text-gray-400 capitalize">{currentStage}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          >
            {/* Animated shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: [-100, 200] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: '50%' }}
            />
          </motion.div>
        </div>
        
        {/* Progress percentage */}
        <motion.div
          className="absolute -top-6 bg-gray-800 px-2 py-1 rounded text-xs text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, left: `${Math.max(0, Math.min(progress - 5, 90))}%` }}
          transition={{ duration: 0.3 }}
        >
          {progress.toFixed(0)}%
        </motion.div>
      </div>

      {/* Stats */}
      {!error && currentStage !== 'complete' && (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 15l9-9 9 9"/>
              </svg>
              {downloadSpeed}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {timeRemaining}
            </span>
          </div>
          <button 
            className="text-red-400 hover:text-red-300 transition-colors"
            onClick={() => console.log('Cancel download')}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg"
        >
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Success message */}
      {currentStage === 'complete' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-green-900/20 border border-green-800/50 rounded-lg"
        >
          <p className="text-sm text-green-400">
            Successfully downloaded {videoCount > 1 ? `${videoCount} videos` : 'video'}!
          </p>
        </motion.div>
      )}

      {/* Stage-specific messages */}
      <AnimatePresence mode="wait">
        {currentStage === 'connecting' && (
          <motion.p
            key="connecting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-gray-500 text-center"
          >
            Connecting to {platform} servers...
          </motion.p>
        )}
        {currentStage === 'processing' && (
          <motion.p
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-gray-500 text-center"
          >
            Processing video data...
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}