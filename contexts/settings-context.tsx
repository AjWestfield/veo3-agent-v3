"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type ImageGenerationModel = 'openai' | 'wavespeed'
export type VideoGenerationModel = 'kling-2.1' | 'veo-3-fast'

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

export interface VideoGenerationSettings {
  model: VideoGenerationModel
  // Kling 2.1 specific settings
  duration?: 5 | 10
  quality?: 'standard' | 'pro'
  // VEO 3 Fast specific settings
  aspectRatio?: '16:9' | '9:16'
  enhancePrompt?: boolean
}

interface Settings {
  imageGeneration: ImageGenerationSettings
  videoGeneration: VideoGenerationSettings
  enhancePrompt: boolean
}

interface SettingsContextType {
  settings: Settings
  updateImageGenerationSettings: (settings: Partial<ImageGenerationSettings>) => void
  updateVideoGenerationSettings: (settings: Partial<VideoGenerationSettings>) => void
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
  },
  videoGeneration: {
    model: 'veo-3-fast',
    duration: 8,
    quality: 'standard',
    aspectRatio: '16:9',
    enhancePrompt: true
  },
  enhancePrompt: true
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
        // Handle migration from old settings
        let videoGenSettings = {
          ...DEFAULT_SETTINGS.videoGeneration,
          ...(parsed.videoGeneration || {})
        }
        
        // Migrate old default model from kling-2.1 to veo-3-fast if duration is also default
        if (videoGenSettings.model === 'kling-2.1' && videoGenSettings.duration === 5) {
          console.log('🔄 Migrating old video settings: kling-2.1 → veo-3-fast')
          videoGenSettings = {
            ...videoGenSettings,
            model: 'veo-3-fast',
            duration: 8
          }
        }

        // Merge saved settings with defaults to ensure all properties exist
        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
          // Deep merge for nested objects
          imageGeneration: {
            ...DEFAULT_SETTINGS.imageGeneration,
            ...(parsed.imageGeneration || {})
          },
          videoGeneration: videoGenSettings,
          enhancePrompt: parsed.enhancePrompt !== undefined ? parsed.enhancePrompt : DEFAULT_SETTINGS.enhancePrompt
        })
      } catch (error) {
        console.error('Failed to parse saved settings:', error)
        setSettings(DEFAULT_SETTINGS)
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

  const updateVideoGenerationSettings = (newSettings: Partial<VideoGenerationSettings>) => {
    setSettings(prev => ({
      ...prev,
      videoGeneration: {
        ...prev.videoGeneration,
        ...newSettings
      }
    }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem('chatSettings')
  }

  return (
    <SettingsContext.Provider value={{ settings, updateImageGenerationSettings, updateVideoGenerationSettings, resetSettings }}>
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