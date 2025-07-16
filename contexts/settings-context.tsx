"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ImageGenerationModel = 'openai' | 'wavespeed'

export interface ImageGenerationSettings {
  model: ImageGenerationModel
  // OpenAI specific settings
  openaiModel?: 'gpt-image-1'
  size?: string
  quality?: string
  style?: 'vivid' | 'natural'
  // Wavespeed specific settings
  guidanceScale?: number
  safetyTolerance?: string
}

interface Settings {
  imageGeneration: ImageGenerationSettings
}

interface SettingsContextType {
  settings: Settings
  updateImageGenerationSettings: (settings: Partial<ImageGenerationSettings>) => void
  resetSettings: () => void
}

const DEFAULT_SETTINGS: Settings = {
  imageGeneration: {
    model: 'openai',
    openaiModel: 'gpt-image-1',
    size: '1024x1024',
    quality: 'high',
    style: 'vivid',
    guidanceScale: 3.5,
    safetyTolerance: '2'
  }
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('chatSettings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
      } catch (error) {
        console.error('Failed to parse saved settings:', error)
      }
    }
    setIsInitialized(true)
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('chatSettings', JSON.stringify(settings))
    }
  }, [settings, isInitialized])

  const updateImageGenerationSettings = (newSettings: Partial<ImageGenerationSettings>) => {
    setSettings(prev => ({
      ...prev,
      imageGeneration: {
        ...prev.imageGeneration,
        ...newSettings
      }
    }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem('chatSettings')
  }

  return (
    <SettingsContext.Provider value={{ settings, updateImageGenerationSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}