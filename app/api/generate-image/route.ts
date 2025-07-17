import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"

// Initialize API clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY || ""

// Helper function to poll Wavespeed for results
async function pollWavespeedResult(requestId: string, maxAttempts = 60): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(
        `https://api.wavespeed.ai/api/v3/predictions/${requestId}/result`,
        {
          headers: {
            "Authorization": `Bearer ${WAVESPEED_API_KEY}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Polling failed: ${response.status}`)
      }

      const result = await response.json()
      const data = result.data
      const status = data.status

      if (status === "completed") {
        return data.outputs[0] // Return the image URL
      } else if (status === "failed") {
        throw new Error(`Task failed: ${data.error || 'Unknown error'}`)
      }

      // Wait before next attempt (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error
      }
    }
  }

  throw new Error("Timeout waiting for image generation")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      prompt, 
      imageGenerationModel = 'openai',
      size = "1024x1024", 
      quality, 
      openaiModel = "gpt-image-1",
      guidanceScale = 3.5,
      safetyTolerance = "2"
    } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Handle Wavespeed AI generation
    if (imageGenerationModel === 'wavespeed') {
      if (!WAVESPEED_API_KEY) {
        return NextResponse.json(
          { error: "Wavespeed API key not configured" },
          { status: 500 }
        )
      }

      console.log(`Generated image using Wavespeed AI`)

      const url = "https://api.wavespeed.ai/api/v3/wavespeed-ai/flux-dev-lora-ultra-fast"
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WAVESPEED_API_KEY}`
      }
      
      const payload = {
        "prompt": prompt,
        "size": size.replace("x", "*"),
        "enable_base64_output": false,
        "enable_safety_checker": true,
        "guidance_scale": guidanceScale,
        "loras": [
          {
            "path": "strangerzonehf/Flux-Super-Realism-LoRA",
            "scale": 1
          }
        ],
        "num_images": 1,
        "num_inference_steps": 28,
        "output_format": "jpeg",
        "seed": -1,
        "strength": 0.8
      }

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Wavespeed API error: ${response.status} - ${errorText}`)
        }

        const result = await response.json()
        const requestId = result.data?.id

        if (!requestId) {
          throw new Error("No request ID returned from Wavespeed")
        }

        // Poll for the result
        const imageUrl = await pollWavespeedResult(requestId)

        return NextResponse.json({
          imageUrl: imageUrl,
          model: 'wavespeed',
          requestedModel: 'wavespeed',
          size
        })

      } catch (error: any) {
        console.error(`Image generation failed: ${error.message}`)
        return NextResponse.json(
          { error: error.message || "Failed to generate image with Wavespeed" },
          { status: 500 }
        )
      }
    }

    // Handle OpenAI generation (gpt-image-1 only)
    const model = "gpt-image-1" // Force gpt-image-1
    const defaultQuality = "high"
    const finalQuality = quality || defaultQuality

    // Validate size parameter for gpt-image-1
    const validSizes = ["1024x1024", "2048x2048", "4096x4096"]
    
    if (!validSizes.includes(size)) {
      return NextResponse.json(
        { error: `Invalid size for ${model}. Must be one of: ${validSizes.join(", ")}` },
        { status: 400 }
      )
    }

    // Validate quality parameter for gpt-image-1
    const validQualities = ["low", "medium", "high", "auto"]
    
    if (!validQualities.includes(finalQuality)) {
      return NextResponse.json(
        { error: `Invalid quality for ${model}. Must be one of: ${validQualities.join(", ")}` },
        { status: 400 }
      )
    }

    // Note: style parameter is not supported by OpenAI's image generation API
    // Style validation removed as it's not used

    // Build parameters based on model
    const generateParams: any = {
      model: model,
      prompt: prompt,
      n: 1,
      size: size as any,
    }

    // Add parameters for gpt-image-1
    generateParams.quality = finalQuality as any
    // Note: style parameter is not supported by OpenAI's image generation API
    // generateParams.style = style

    // Generate image with fallback
    let response
    let actualModel = model
    
    try {
      response = await openai.images.generate(generateParams)
    } catch (initialError: any) {
      
      // If gpt-image-1 fails with model not found or access error, try dall-e-3 as fallback
      if (model === "gpt-image-1" && 
          (initialError.status === 404 || 
           initialError.status === 400 && 
           (initialError.message?.includes("model") || 
            initialError.message?.includes("Invalid model") ||
            initialError.code === "model_not_found"))) {
        
        // Retry with same parameters but different error handling
        throw new Error("GPT-Image-1 model is not available. Please verify your OpenAI organization has access to this model.")
        
      } else {
        // Re-throw if not a model availability issue
        throw initialError
      }
    }

    if (!response.data || response.data.length === 0) {
      throw new Error("No data returned from OpenAI")
    }

    const imageData = response.data[0]
    
    // Check for url or base64 field
    let imageUrl = imageData?.url
    const revisedPrompt = imageData?.revised_prompt
    
    // Handle base64 response
    if (!imageUrl && imageData?.b64_json) {
      try {
        // Save base64 image to public directory
        const publicDir = join(process.cwd(), 'public', 'generated-images')
        await mkdir(publicDir, { recursive: true })
        
        const fileName = `${randomUUID()}.png`
        const filePath = join(publicDir, fileName)
        
        // Convert base64 to buffer and save
        const buffer = Buffer.from(imageData.b64_json, 'base64')
        await writeFile(filePath, buffer)
        
        // Return a URL to the saved image
        imageUrl = `/generated-images/${fileName}`
      } catch (error) {
        // Fallback to data URL if saving fails
        const mimeType = "image/png"
        imageUrl = `data:${mimeType};base64,${imageData.b64_json}`
      }
    }

    if (!imageUrl) {
      throw new Error("No image URL or base64 data returned from OpenAI")
    }

    console.log(`Generated image using ${actualModel}`)

    return NextResponse.json({
      imageUrl: imageUrl,
      revisedPrompt, // Some models may revise the prompt for better results
      model: model,
      requestedModel: model,
      size,
      quality: finalQuality,
      // style parameter removed as it's not supported by OpenAI's API
    })
  } catch (error) {
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      console.error(`Image generation failed: ${error.message}`)
      
      if (error.status === 401) {
        return NextResponse.json(
          { error: "Invalid API key. Please check your OpenAI API key." },
          { status: 401 }
        )
      } else if (error.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        )
      } else if (error.status === 400) {
        // Check if it's a model access issue
        if (error.message.includes("model") || error.code === "model_not_found") {
          return NextResponse.json(
            { error: "The gpt-image-1 model requires organization verification. Please verify your organization in OpenAI settings to access this model." },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: `Invalid request: ${error.message}` },
          { status: 400 }
        )
      } else if (error.status === 404) {
        return NextResponse.json(
          { error: "Model not found. The gpt-image-1 model requires organization verification. Please verify your organization at platform.openai.com/settings/organization." },
          { status: 404 }
        )
      }
    }

    // Generic error response
    const errorMessage = error instanceof Error ? error.message : "Failed to generate image"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}