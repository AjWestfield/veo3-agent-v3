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

interface AudiosContextType {
  audios: Audio[]
  addAudio: (audio: Omit<Audio, 'id' | 'createdAt'>) => Audio
  removeAudio: (id: string) => void
  clearAudios: () => void
}

const AudiosContext = createContext<AudiosContextType | undefined>(undefined)

export function AudiosProvider({ children }: { children: React.ReactNode }) {
  const [audios, setAudios] = useState<Audio[]>([])

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
    setAudios(prev => prev.filter(audio => audio.id !== id))
  }

  const clearAudios = () => {
    setAudios([])
  }

  return (
    <AudiosContext.Provider value={{ audios, addAudio, removeAudio, clearAudios }}>
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