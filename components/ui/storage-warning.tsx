"use client"

import React, { useState } from 'react'
import { AlertCircle, Trash2, HardDrive, X } from 'lucide-react'
import { Button } from './button'
import { getLocalStorageUsage } from '@/lib/chat-storage-utils'

interface StorageWarningProps {
  warning: string | null
  onCleanup?: () => void
  onClearAll?: () => void
}

export function StorageWarning({ warning, onCleanup, onClearAll }: StorageWarningProps) {
  const [showStorageInfo, setShowStorageInfo] = useState(false)
  
  if (!warning) return null
  
  const storageInfo = getLocalStorageUsage()
  const usedMB = (storageInfo.used / (1024 * 1024)).toFixed(2)
  const availableMB = (storageInfo.available / (1024 * 1024)).toFixed(2)
  
  return (
    <div className="fixed bottom-20 right-4 max-w-sm bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3 z-50">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-destructive">Storage Warning</p>
          <p className="text-sm text-muted-foreground">{warning}</p>
        </div>
      </div>
      
      {showStorageInfo && (
        <div className="bg-black/20 rounded-md p-3 space-y-1">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Storage Details</p>
            <button
              onClick={() => setShowStorageInfo(false)}
              className="text-muted-foreground hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Used: {usedMB}MB ({storageInfo.percentage.toFixed(1)}%)</p>
          <p className="text-xs text-muted-foreground">Available: {availableMB}MB</p>
          <p className="text-xs text-muted-foreground">Browser limit: ~5-10MB</p>
        </div>
      )}
      
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowStorageInfo(!showStorageInfo)}
          className="gap-2"
        >
          <HardDrive className="h-4 w-4" />
          {showStorageInfo ? 'Hide Info' : 'Storage Info'}
        </Button>
        
        {onCleanup && (
          <Button
            size="sm"
            variant="outline"
            onClick={onCleanup}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clean Old Sessions
          </Button>
        )}
        
        {onClearAll && (
          <Button
            size="sm"
            variant="destructive"
            onClick={onClearAll}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  )
}
