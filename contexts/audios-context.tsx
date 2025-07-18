"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface Audio {
  id: string
  url: string
  type: 'uploaded' | 'recorded'
  name?: string
  createdAt: Date
  transcript?: string
  duration?: string
}

export interface DeletedAudio extends Audio {
  deletedAt: Date
}

interface AudiosContextType {
  audios: Audio[]
  recentlyDeleted: DeletedAudio | null
  addAudio: (audio: Omit<Audio, 'id' | 'createdAt'>) => Audio
  removeAudio: (id: string) => void
  removeAudioWithConfirmation: (id: string) => Promise<boolean>
  undoDelete: () => void
  clearAudios: () => void
}

const AudiosContext = createContext<AudiosContextType | undefined>(undefined)

export function AudiosProvider({ children }: { children: React.ReactNode }) {
  const [audios, setAudios] = useState<Audio[]>([])
  const [recentlyDeleted, setRecentlyDeleted] = useState<DeletedAudio | null>(null)

  // Load audios from localStorage on mount
  useEffect(() => {
    const storedAudios = localStorage.getItem('veo3-audios')
    if (storedAudios) {
      try {
        const parsed = JSON.parse(storedAudios)
        // Convert date strings back to Date objects
        const audiosWithDates = parsed.map((audio: any) => ({
          ...audio,
          createdAt: new Date(audio.createdAt)
        }))
        setAudios(audiosWithDates)
      } catch (error) {
        console.error('Failed to parse stored audios:', error)
      }
    }
  }, [])

  // Save audios to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('veo3-audios', JSON.stringify(audios))
  }, [audios])

  const addAudio = (audioData: Omit<Audio, 'id' | 'createdAt'>) => {
    const newAudio: Audio = {
      ...audioData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date()
    }
    setAudios(prev => [...prev, newAudio])
    return newAudio
  }

  const removeAudio = (id: string) => {
    const audioToDelete = audios.find(audio => audio.id === id)
    if (!audioToDelete) return
    
    // Store for potential undo
    setRecentlyDeleted({
      ...audioToDelete,
      deletedAt: new Date()
    })
    
    setAudios(prev => prev.filter(audio => audio.id !== id))
    
    // Clear recently deleted after 10 seconds
    setTimeout(() => {
      setRecentlyDeleted(prev => prev?.id === id ? null : prev)
    }, 10000)
  }

  const removeAudioWithConfirmation = (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.confirm('Are you sure you want to delete this audio? You can undo this action for 10 seconds.')) {
        removeAudio(id)
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }

  const undoDelete = () => {
    if (!recentlyDeleted) return
    
    const { deletedAt, ...audioData } = recentlyDeleted
    
    // Re-add the audio
    setAudios(prev => [audioData, ...prev])
    
    // Clear the recently deleted
    setRecentlyDeleted(null)
  }

  const clearAudios = () => {
    setAudios([])
  }

  return (
    <AudiosContext.Provider value={{ 
      audios, 
      recentlyDeleted, 
      addAudio, 
      removeAudio, 
      removeAudioWithConfirmation, 
      undoDelete, 
      clearAudios 
    }}>
      {children}
    </AudiosContext.Provider>
  )
}

export function useAudios() {
  const context = useContext(AudiosContext)
  if (context === undefined) {
    throw new Error('useAudios must be used within an AudiosProvider')
  }
  return context
}