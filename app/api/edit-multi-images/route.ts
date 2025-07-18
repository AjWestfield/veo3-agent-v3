import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY || ""

// Helper function to convert local images to base64
async function getImageAsBase64(imageUrl: string): Promise<string> {
  // Check if it's already a data URL
  if (imageUrl.startsWith('data:')) {
    return imageUrl
  }
  
  // Check if it's a blob URL (shouldn't happen if frontend converts properly, but handle it)
  if (imageUrl.startsWith('blob:')) {
    throw new Error('Blob URLs cannot be processed on the server. Please convert to base64 on the client side.')
  }
  
  // Check if it's a local image in our public directory
  if (imageUrl.startsWith('/generated-images/')) {
    try {
      const publicDir = join(process.cwd(), 'public')
      const filePath = join(publicDir, imageUrl)
      const imageBuffer = await readFile(filePath)
      const base64 = imageBuffer.toString('base64')
      return `data:image/png;base64,${base64}`
    } catch (error) {
      console.error('Failed to read local image:', error)
      throw new Error('Failed to read local image file')
    }
  }
  
  // For external URLs (including OpenAI URLs), fetch and convert to base64
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    try {
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64 = buffer.toString('base64')
      const contentType = response.headers.get('content-type') || 'image/png'
      return `data:${contentType};base64,${base64}`
    } catch (error) {
      console.error('Failed to fetch external image:', error)
      throw new Error('Failed to fetch external image')
    }
  }
  
  // Fallback - throw error for unknown URL format
  throw new Error(`Unsupported image URL format: ${imageUrl}`)
}

// Helper function to poll Wavespeed for results
async function pollWavespeedResult(requestId: string, maxAttempts = 60): Promise<{ url: string; width?: number; height?: number }> {
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
        console.log("Wavespeed result data:", JSON.stringify(data, null, 2))
        return { 
          url: data.outputs[0],
          width: data.width,
          height: data.height
        }
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

  throw new Error("Timeout waiting for image editing")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrls, prompt } = body

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: "imageUrls array is required and must not be empty" },
        { status: 400 }
      )
    }

    if (imageUrls.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 images allowed for multi-image editing" },
        { status: 400 }
      )
    }

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    if (!WAVESPEED_API_KEY) {
      return NextResponse.json(
        { error: "Wavespeed API key not configured" },
        { status: 500 }
      )
    }

    console.log(`Editing ${imageUrls.length} images using Wavespeed AI flux-kontext-max/multi`)

    // Process all images to base64 or external URLs
    let processedImageUrls: string[]
    try {
      processedImageUrls = await Promise.all(
        imageUrls.map(async (imageUrl) => {
          const processed = await getImageAsBase64(imageUrl)
          console.log(`Processed image: ${imageUrl} -> ${processed.startsWith('data:') ? 'base64' : 'external URL'}`)
          return processed
        })
      )
    } catch (error) {
      console.error('Failed to process image URLs:', error)
      return NextResponse.json(
        { error: `Failed to process images: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    const url = "https://api.wavespeed.ai/api/v3/wavespeed-ai/flux-kontext-max/multi"
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${WAVESPEED_API_KEY}`
    }
    
    const payload = {
      "guidance_scale": 3.5,
      "images": processedImageUrls,
      "prompt": prompt,
      "safety_tolerance": "2"
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

      const apiResponse = await response.json()
      const requestId = apiResponse.data?.id

      if (!requestId) {
        throw new Error("No request ID returned from Wavespeed")
      }

      // Poll for the result
      const result = await pollWavespeedResult(requestId)
      
      // Log dimensions for verification
      if (result.width && result.height) {
        console.log(`Result dimensions: ${result.width}x${result.height}`)
      }

      return NextResponse.json({
        imageUrl: result.url,
        model: 'wavespeed-flux-kontext-max-multi',
        prompt: prompt,
        sourceImages: imageUrls,
        imageCount: imageUrls.length,
        ...(result.width && result.height && { 
          resultDimensions: `${result.width}x${result.height}` 
        })
      })

    } catch (error: any) {
      console.error(`Multi-image editing failed: ${error.message}`)
      return NextResponse.json(
        { error: error.message || "Failed to edit images with Wavespeed" },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Multi-image editing error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to edit images"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}