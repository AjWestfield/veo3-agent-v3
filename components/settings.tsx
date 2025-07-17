"use client"

import { useState, useEffect } from 'react'
import { useSettings } from '@/contexts/settings-context'
import { Button } from '@/components/ui/button'
import { Notification } from '@/components/notification'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SheetWrapper,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet-safe'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

interface SettingsPanelProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsPanel({ isOpen, onOpenChange }: SettingsPanelProps) {
  const { settings, updateImageGenerationSettings, resetSettings } = useSettings()
  
  // Use temporary state for settings changes
  const [tempSettings, setTempSettings] = useState(settings.imageGeneration)
  const [hasChanges, setHasChanges] = useState(false)
  const [notification, setNotification] = useState<{ message: string; description?: string } | null>(null)

  // Reset temp settings when panel opens
  useEffect(() => {
    if (isOpen) {
      setTempSettings(settings.imageGeneration)
      setHasChanges(false)
    }
  }, [isOpen, settings.imageGeneration])

  const handleModelChange = (model: 'openai' | 'wavespeed') => {
    setTempSettings({ ...tempSettings, model })
    setHasChanges(true)
  }

  const handleOpenAIModelChange = (openaiModel: any) => {
    setTempSettings({ ...tempSettings, openaiModel })
    setHasChanges(true)
  }

  const handleSizeChange = (size: string) => {
    setTempSettings({ ...tempSettings, size })
    setHasChanges(true)
  }

  const handleQualityChange = (quality: string) => {
    setTempSettings({ ...tempSettings, quality })
    setHasChanges(true)
  }

  const handleStyleChange = (checked: boolean) => {
    setTempSettings({ ...tempSettings, style: checked ? 'natural' : 'vivid' })
    setHasChanges(true)
  }

  const handleGuidanceScaleChange = (value: number[]) => {
    setTempSettings({ ...tempSettings, guidanceScale: value[0] })
    setHasChanges(true)
  }

  const handleSafetyToleranceChange = (value: string) => {
    setTempSettings({ ...tempSettings, safetyTolerance: value })
    setHasChanges(true)
  }

  const handleApplyAndSave = () => {
    updateImageGenerationSettings(tempSettings)
    setHasChanges(false)
    setNotification({
      message: "Settings saved",
      description: `Image generation will now use ${tempSettings.model === 'openai' 
        ? 'GPT-Image-1'
        : 'Wavespeed AI Flux Dev LoRA Ultra Fast'}`
    })
    onOpenChange(false)
  }

  const handleReset = () => {
    resetSettings()
    setTempSettings(settings.imageGeneration)
    setHasChanges(false)
    setNotification({
      message: "Settings reset",
      description: "All settings have been restored to defaults"
    })
  }

  // Get available sizes based on selected model
  const getAvailableSizes = () => {
    if (tempSettings.model === 'wavespeed') {
      // Wavespeed doesn't specify size constraints in the docs
      return ['1024x1024', '512x512', '768x768', '1024x768', '768x1024']
    }
    
    // gpt-image-1 sizes
    return ['1024x1024', '2048x2048', '4096x4096']
  }

  // Get available quality options based on model
  const getQualityOptions = () => {
    if (tempSettings.model === 'wavespeed') {
      return [] // Wavespeed uses guidance scale instead
    }
    
    // gpt-image-1 quality options
    return ['low', 'medium', 'high', 'auto']
  }

  return (
    <>
      <SheetWrapper open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="bg-[#1a1a1a] text-white border-[#4a4a4a] overflow-y-auto" onOpenChange={onOpenChange}>
        <SheetHeader>
          <SheetTitle className="text-white">Settings</SheetTitle>
          <SheetDescription className="text-gray-400">
            Configure your image generation preferences
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Image Generation Model */}
          <div className="space-y-2">
            <Label className="text-white">Image Generation Model</Label>
            <Select
              value={tempSettings.model}
              onValueChange={handleModelChange}
            >
              <SelectTrigger className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="wavespeed">Wavespeed AI (Flux Dev LoRA Ultra Fast)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* OpenAI Specific Settings */}
          {tempSettings.model === 'openai' && (
            <>
              <div className="space-y-2">
                <Label className="text-white">OpenAI Model</Label>
                <Select
                  value={tempSettings.openaiModel}
                  onValueChange={handleOpenAIModelChange}
                >
                  <SelectTrigger className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                    <SelectItem value="gpt-image-1">GPT-Image-1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quality */}
              {getQualityOptions().length > 0 && (
                <div className="space-y-2">
                  <Label className="text-white">Quality</Label>
                  <Select
                    value={tempSettings.quality}
                    onValueChange={handleQualityChange}
                  >
                    <SelectTrigger className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                      {getQualityOptions().map(quality => (
                        <SelectItem key={quality} value={quality}>
                          {quality.charAt(0).toUpperCase() + quality.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Style (only for gpt-image-1) */}
              {tempSettings.openaiModel === 'gpt-image-1' && (
                <div className="flex items-center justify-between">
                  <Label className="text-white">Style</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Vivid</span>
                    <Switch
                      checked={tempSettings.style === 'natural'}
                      onCheckedChange={handleStyleChange}
                    />
                    <span className="text-sm text-gray-400">Natural</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Wavespeed Specific Settings */}
          {tempSettings.model === 'wavespeed' && (
            <>
              <div className="space-y-2">
                <Label className="text-white">
                  Guidance Scale ({tempSettings.guidanceScale})
                </Label>
                <Slider
                  value={[tempSettings.guidanceScale || 3.5]}
                  onValueChange={handleGuidanceScaleChange}
                  min={1}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
                <p className="text-xs text-gray-400">
                  Controls how closely the image follows your prompt
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Safety Tolerance</Label>
                <Select
                  value={tempSettings.safetyTolerance}
                  onValueChange={handleSafetyToleranceChange}
                >
                  <SelectTrigger className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                    <SelectItem value="1">Strict (1)</SelectItem>
                    <SelectItem value="2">Moderate (2)</SelectItem>
                    <SelectItem value="3">Relaxed (3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Size Selection */}
          <div className="space-y-2">
            <Label className="text-white">Image Size</Label>
            <Select
              value={tempSettings.size}
              onValueChange={handleSizeChange}
            >
              <SelectTrigger className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                {getAvailableSizes().map(size => (
                  <SelectItem key={size} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#4a4a4a] space-y-2">
            <Button
              onClick={handleApplyAndSave}
              disabled={!hasChanges}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
            >
              Apply and Save
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full bg-transparent border-[#4a4a4a] text-white hover:bg-[#404040]"
            >
              Reset to Defaults
            </Button>
          </div>

          {/* Model Info */}
          <div className="text-xs text-gray-400 space-y-1">
            <p className="font-semibold">Current Model:</p>
            <p>
              {tempSettings.model === 'openai'
                ? 'GPT-Image-1'
                : 'Wavespeed AI Flux Dev LoRA Ultra Fast'}
            </p>
          </div>
        </div>
      </SheetContent>
    </SheetWrapper>
    
    {notification && (
      <Notification
        message={notification.message}
        description={notification.description}
        show={true}
        onHide={() => setNotification(null)}
      />
    )}
    </>
  )
}