import Replicate from "replicate";

// Helper function to create fetch with retry logic
function createFetchWithRetry(maxRetries = 3, retryDelay = 1000) {
  return async (url: string, options: RequestInit = {}) => {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
        
        const response = await fetch(url, {
          ...options,
          cache: "no-store",
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // If we get a 502 or 503, retry
        if ((response.status === 502 || response.status === 503) && i < maxRetries) {
          console.log(`Got ${response.status}, retrying in ${retryDelay}ms... (attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
          continue;
        }
        
        return response;
      } catch (error: any) {
        lastError = error;
        
        // If it's a network error or timeout, retry
        if (i < maxRetries && (error.name === 'AbortError' || error.message?.includes('fetch'))) {
          console.log(`Network error, retrying in ${retryDelay}ms... (attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  };
}

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
  fetch: createFetchWithRetry(3, 2000), // 3 retries with 2 second delay
});

export const VIDEO_MODELS = {
  "kling-2.1": "kwaivgi/kling-v2.1",
  "veo-3-fast": "google/veo-3-fast",
} as const;

export type VideoModel = keyof typeof VIDEO_MODELS;

export interface VideoGenerationOptions {
  prompt: string;
  model: VideoModel;
  duration?: number;
  quality?: "standard" | "pro";
  aspectRatio?: "16:9" | "9:16";
  startImage?: string;
  negativePrompt?: string;
  seed?: number;
  enhancePrompt?: boolean;
}

export interface KlingVideoInput {
  prompt: string;
  start_image: string;
  duration: 5 | 10;
  mode: "standard" | "pro";
  negative_prompt?: string;
}

export interface VeoVideoInput {
  prompt: string;
  enhance_prompt?: boolean;
  negative_prompt?: string;
  seed?: number;
}

export function createVideoInput(options: VideoGenerationOptions): KlingVideoInput | VeoVideoInput {
  const { model, prompt, duration, quality, startImage, negativePrompt, seed, enhancePrompt } = options;

  if (model === "kling-2.1") {
    if (!startImage) {
      throw new Error("Kling 2.1 requires a start image for image-to-video generation. For text-to-video, use VEO 3 Fast instead.");
    }
    return {
      prompt,
      start_image: startImage,
      duration: (duration === 10 ? 10 : 5) as 5 | 10,
      mode: quality === "pro" ? "pro" : "standard",
      negative_prompt: negativePrompt || "",
    };
  }

  if (model === "veo-3-fast") {
    return {
      prompt,
      enhance_prompt: enhancePrompt ?? true,
      negative_prompt: negativePrompt,
      seed,
    };
  }

  throw new Error(`Unsupported video model: ${model}`);
}

export async function generateVideo(options: VideoGenerationOptions) {
  const modelId = VIDEO_MODELS[options.model];
  
  try {
    // Validate model exists
    const modelVersion = await getModelVersion(modelId);
    if (!modelVersion) {
      throw new Error(`Model ${modelId} not found or has no available version`);
    }
    
    // Create input based on model requirements
    const input = createVideoInput(options);
    
    const prediction = await replicate.predictions.create({
      version: modelVersion,
      input,
    });

    return prediction;
  } catch (error: any) {
    console.error("Error generating video:", error);
    
    // Provide more specific error messages
    if (error.response?.status === 402) {
      throw new Error("Replicate API quota exceeded. Please check your billing.");
    } else if (error.response?.status === 401) {
      throw new Error("Invalid Replicate API token. Please check your API key.");
    } else if (error.response?.status === 404) {
      throw new Error(`Model ${modelId} not found on Replicate.`);
    } else if (error.response?.status === 502 || error.response?.status === 503) {
      throw new Error("Replicate service is temporarily unavailable. Please try again.");
    }
    
    throw error;
  }
}

async function getModelVersion(modelId: string): Promise<string> {
  try {
    const [owner, name] = modelId.split("/");
    const model = await replicate.models.get(owner, name);
    
    if (!model.latest_version?.id) {
      console.error(`Model ${modelId} has no available version`);
      return "";
    }
    
    return model.latest_version.id;
  } catch (error: any) {
    console.error(`Error getting model version for ${modelId}:`, error);
    
    if (error.response?.status === 404) {
      console.error(`Model ${modelId} not found on Replicate`);
      return "";
    }
    
    throw error;
  }
}

export async function waitForPrediction(predictionId: string) {
  try {
    const prediction = await replicate.predictions.get(predictionId);
    return replicate.wait(prediction);
  } catch (error) {
    console.error("Error waiting for prediction:", error);
    throw error;
  }
}

export async function cancelPrediction(predictionId: string) {
  try {
    return await replicate.predictions.cancel(predictionId);
  } catch (error) {
    console.error("Error canceling prediction:", error);
    throw error;
  }
}