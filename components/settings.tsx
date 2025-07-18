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
  const { settings, updateImageGenerationSettings, updateVideoGenerationSettings, resetSettings } = useSettings()
  
  // Use temporary state for settings changes with fallback values
  const [tempSettings, setTempSettings] = useState(settings.imageGeneration || {
    model: 'openai',
    openaiModel: 'gpt-image-1',
    size: '1024x1024',
    quality: 'high',
    style: 'vivid',
    guidanceScale: 3.5,
    safetyTolerance: '2'
  })
  const [tempVideoSettings, setTempVideoSettings] = useState(settings.videoGeneration || {
    model: 'kling-2.1',
    duration: 5,
    quality: 'standard',
    aspectRatio: '16:9',
    enhancePrompt: true
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [notification, setNotification] = useState<{ message: string; description?: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image')

  // Reset temp settings when panel opens
  useEffect(() => {
    if (isOpen) {
      setTempSettings(settings.imageGeneration || {
        model: 'openai',
        openaiModel: 'gpt-image-1',
        size: '1024x1024',
        quality: 'high',
        style: 'vivid',
        guidanceScale: 3.5,
        safetyTolerance: '2'
      })
      setTempVideoSettings(settings.videoGeneration || {
        model: 'kling-2.1',
        duration: 5,
        quality: 'standard',
        aspectRatio: '16:9',
        enhancePrompt: true
      })
      setHasChanges(false)
    }
  }, [isOpen, settings.imageGeneration, settings.videoGeneration])

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

  // Video generation handlers
  const handleVideoModelChange = (model: 'kling-2.1' | 'veo-3-fast') => {
    setTempVideoSettings({ ...tempVideoSettings, model })
    setHasChanges(true)
  }

  const handleVideoDurationChange = (duration: 5 | 10) => {
    setTempVideoSettings({ ...tempVideoSettings, duration })
    setHasChanges(true)
  }

  const handleVideoQualityChange = (quality: 'standard' | 'pro') => {
    setTempVideoSettings({ ...tempVideoSettings, quality })
    setHasChanges(true)
  }

  const handleVideoAspectRatioChange = (aspectRatio: '16:9' | '9:16') => {
    setTempVideoSettings({ ...tempVideoSettings, aspectRatio })
    setHasChanges(true)
  }

  const handleEnhancePromptChange = (checked: boolean) => {
    setTempVideoSettings({ ...tempVideoSettings, enhancePrompt: checked })
    setHasChanges(true)
  }

  const handleApplyAndSave = () => {
    updateImageGenerationSettings(tempSettings)
    updateVideoGenerationSettings(tempVideoSettings)
    setHasChanges(false)
    setNotification({
      message: "Settings saved",
      description: `Settings updated for ${activeTab === 'image' ? 'image' : 'video'} generation`
    })
    onOpenChange(false)
  }

  const handleReset = () => {
    resetSettings()
    // Use DEFAULT_SETTINGS values after reset
    setTempSettings({
      model: 'openai',
      openaiModel: 'gpt-image-1',
      size: '1024x1024',
      quality: 'high',
      style: 'vivid',
      guidanceScale: 3.5,
      safetyTolerance: '2'
    })
    setTempVideoSettings({
      model: 'kling-2.1',
      duration: 5,
      quality: 'standard',
      aspectRatio: '16:9',
      enhancePrompt: true
    })
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
            Configure your generation preferences
          </SheetDescription>
          
          {/* Tabs */}
          <div className="flex space-x-1 bg-[#2f2f2f] rounded-lg p-1 mt-4">
            <button
              onClick={() => setActiveTab('image')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'image' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Image Generation
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'video' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Video Generation
            </button>
          </div>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Image Generation Settings */}
          {activeTab === 'image' && (
            <>
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

              {/* Model Info */}
              <div className="text-xs text-gray-400 space-y-1">
                <p className="font-semibold">Current Model:</p>
                <p>
                  {tempSettings.model === 'openai'
                    ? 'GPT-Image-1'
                    : 'Wavespeed AI Flux Dev LoRA Ultra Fast'}
                </p>
              </div>
            </>
          )}

          {/* Video Generation Settings */}
          {activeTab === 'video' && tempVideoSettings && (
            <>
              {/* Video Generation Model */}
              <div className="space-y-2">
                <Label className="text-white">Video Generation Model</Label>
                <Select
                  value={tempVideoSettings.model || 'kling-2.1'}
                  onValueChange={handleVideoModelChange}
                >
                  <SelectTrigger className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                    <SelectItem value="kling-2.1">Kling 2.1 AI</SelectItem>
                    <SelectItem value="veo-3-fast">VEO 3 Fast</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Kling 2.1 Specific Settings */}
              {tempVideoSettings?.model === 'kling-2.1' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Duration</Label>
                    <Select
                      value={(tempVideoSettings.duration || 5).toString()}
                      onValueChange={(value) => handleVideoDurationChange(Number(value) as 5 | 10)}
                    >
                      <SelectTrigger className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                        <SelectItem value="5">5 seconds</SelectItem>
                        <SelectItem value="10">10 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Quality</Label>
                    <Select
                      value={tempVideoSettings.quality || 'standard'}
                      onValueChange={handleVideoQualityChange}
                    >
                      <SelectTrigger className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2f2f2f] border-[#4a4a4a] text-white">
                        <SelectItem value="standard">Standard (720p)</SelectItem>
                        <SelectItem value="pro">Pro (1080p)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* VEO 3 Fast Specific Settings */}
              {tempVideoSettings?.model === 'veo-3-fast' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white">Duration</Label>
                    <div className="text-sm text-gray-400 bg-[#2f2f2f] p-3 rounded-lg">
                      Fixed at 8 seconds (16:9 aspect ratio)
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enhance Prompt</Label>
                    <Switch
                      checked={tempVideoSettings.enhancePrompt !== false}
                      onCheckedChange={handleEnhancePromptChange}
                    />
                  </div>
                </>
              )}

              {/* Model Info */}
              <div className="text-xs text-gray-400 space-y-1">
                <p className="font-semibold">Current Model:</p>
                <p>
                  {tempVideoSettings?.model === 'kling-2.1'
                    ? 'Kling 2.1 AI - Image to Video & Text to Video'
                    : 'VEO 3 Fast - Google\'s fast text-to-video model'}
                </p>
                <p className="text-xs">
                  {tempVideoSettings?.model === 'kling-2.1'
                    ? `Duration: ${tempVideoSettings?.duration || 5}s, Quality: ${tempVideoSettings?.quality || 'standard'}`
                    : 'Duration: 8s, Aspect Ratio: 16:9, Native Audio'}
                </p>
              </div>
            </>
          )}

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