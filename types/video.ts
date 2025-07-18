export type VideoModel = 'kling-2.1' | 'veo-3-fast';

export interface VideoGenerationSettings {
  model: VideoModel;
  duration?: 5 | 8 | 10;
  quality?: 'standard' | 'pro';
  aspectRatio?: '16:9' | '9:16';
  enhancePrompt?: boolean;
}

export interface VideoGenerationRequest {
  prompt: string;
  model: VideoModel;
  duration?: number;
  quality?: 'standard' | 'pro';
  aspectRatio?: '16:9' | '9:16';
  startImage?: string;
  negativePrompt?: string;
  seed?: number;
  enhancePrompt?: boolean;
}

export interface VideoGenerationResponse {
  id: string;
  videoUrl: string;
  predictionId: string;
  model: VideoModel;
  prompt: string;
  duration: number;
  quality: string;
  aspectRatio: string;
  status: 'completed' | 'failed' | 'processing';
  createdAt: string;
  error?: string;
}

export interface KlingVideoInput {
  prompt: string;
  start_image: string;
  duration: 5 | 10;
  mode: 'standard' | 'pro';
  negative_prompt?: string;
}

export interface VeoVideoInput {
  prompt: string;
  enhance_prompt?: boolean;
  negative_prompt?: string;
  seed?: number;
}

export interface VideoDetails {
  model: VideoModel;
  duration: number;
  quality: string;
  aspectRatio: string;
  prompt: string;
  id: string;
  createdAt: string;
}

export interface VideoData {
  id: string;
  url: string;
  type: 'video';
  title: string;
  thumbnail?: string;
  details: VideoDetails;
  createdAt: string;
}

export interface VideoContextType {
  videos: VideoData[];
  addVideo: (video: VideoData) => void;
  removeVideo: (id: string) => void;
  clearVideos: () => void;
  getVideo: (id: string) => VideoData | undefined;
}

export interface VideoPreviewProps {
  video: VideoData;
  onClose: () => void;
  onDownload?: () => void;
}

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export interface VideoGenerationError {
  message: string;
  details?: string;
  predictionId?: string;
  code?: string;
}

export interface VideoGenerationStatus {
  status: 'idle' | 'generating' | 'completed' | 'failed';
  progress?: number;
  estimatedTime?: number;
  error?: VideoGenerationError;
}

export interface VideoModelCapabilities {
  model: VideoModel;
  name: string;
  description: string;
  maxDuration: number;
  minDuration: number;
  supportedQualities: ('standard' | 'pro')[];
  supportedAspectRatios: ('16:9' | '9:16')[];
  supportsImageToVideo: boolean;
  supportsTextToVideo: boolean;
  hasAudio: boolean;
  pricing: {
    perSecond: number;
    currency: 'USD';
  };
}

export const VIDEO_MODEL_CAPABILITIES: Record<VideoModel, VideoModelCapabilities> = {
  'kling-2.1': {
    model: 'kling-2.1',
    name: 'Kling 2.1 AI',
    description: 'Advanced image-to-video and text-to-video generation',
    maxDuration: 10,
    minDuration: 5,
    supportedQualities: ['standard', 'pro'],
    supportedAspectRatios: ['16:9', '9:16'],
    supportsImageToVideo: true,
    supportsTextToVideo: true,
    hasAudio: false,
    pricing: {
      perSecond: 0.125,
      currency: 'USD'
    }
  },
  'veo-3-fast': {
    model: 'veo-3-fast',
    name: 'VEO 3 Fast',
    description: 'Google\'s fast text-to-video model with native audio',
    maxDuration: 8,
    minDuration: 8,
    supportedQualities: ['standard'],
    supportedAspectRatios: ['16:9'],
    supportsImageToVideo: false,
    supportsTextToVideo: true,
    hasAudio: true,
    pricing: {
      perSecond: 0.75,
      currency: 'USD'
    }
  }
};

export const DEFAULT_VIDEO_SETTINGS: VideoGenerationSettings = {
  model: 'kling-2.1',
  duration: 5,
  quality: 'standard',
  aspectRatio: '16:9',
  enhancePrompt: true
};