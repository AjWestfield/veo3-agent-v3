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
  
  // Fallback - return as is
  return imageUrl
}

// Helper function to poll Wavespeed for results
async function pollWavespeedResult(requestId: string, maxAttempts = 60): Promise<{ url: string; width?: number; height?: number }> {
  console.log(`[${new Date().toISOString()}] Starting polling for request ID: ${requestId}`)
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`[${new Date().toISOString()}] Polling attempt ${attempt + 1}/${maxAttempts}`)
      
      const response = await fetch(
        `https://api.wavespeed.ai/api/v3/predictions/${requestId}/result`,
        {
          headers: {
            "Authorization": `Bearer ${WAVESPEED_API_KEY}`
          }
        }
      )

      console.log(`[${new Date().toISOString()}] Poll response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[${new Date().toISOString()}] Poll error response:`, errorText)
        throw new Error(`Polling failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      const data = result.data
      const status = data?.status

      console.log(`[${new Date().toISOString()}] Poll result status: ${status}`)

      if (status === "completed") {
        console.log(`[${new Date().toISOString()}] Wavespeed result data:`, JSON.stringify(data, null, 2))
        
        if (!data.outputs || !data.outputs[0]) {
          throw new Error("No output URL in completed result")
        }
        
        return { 
          url: data.outputs[0],
          width: data.width,
          height: data.height
        }
      } else if (status === "failed") {
        console.error(`[${new Date().toISOString()}] Task failed:`, data.error || 'Unknown error')
        throw new Error(`Task failed: ${data.error || 'Unknown error'}`)
      } else if (status === "processing" || status === "pending") {
        console.log(`[${new Date().toISOString()}] Task still ${status}, waiting...`)
      } else {
        console.warn(`[${new Date().toISOString()}] Unknown status:`, status)
      }

      // Wait before next attempt (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Polling error:`, error)
      
      if (attempt === maxAttempts - 1) {
        throw error
      }
      
      // Wait before retry on error
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  throw new Error("Timeout waiting for image editing")
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log(`[${new Date().toISOString()}] Starting image edit request`)
  
  try {
    const body = await request.json()
    const { imageUrl, prompt, size } = body

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: "Image URL and prompt are required" },
        { status: 400 }
      )
    }

    if (!WAVESPEED_API_KEY) {
      return NextResponse.json(
        { error: "Wavespeed API key not configured" },
        { status: 500 }
      )
    }

    console.log(`[${new Date().toISOString()}] Editing image using Wavespeed AI flux-kontext-max`)
    console.log(`[${new Date().toISOString()}] Prompt: ${prompt}`)
    if (size) {
      console.log(`[${new Date().toISOString()}] Requested dimensions: ${size}`)
    }

    // Convert local images to base64 for Wavespeed
    let processedImageUrl: string
    try {
      console.log(`[${new Date().toISOString()}] Processing image URL...`)
      processedImageUrl = await getImageAsBase64(imageUrl)
      console.log(`[${new Date().toISOString()}] Original image URL: ${imageUrl}`)
      console.log(`[${new Date().toISOString()}] Image URL type: ${processedImageUrl.startsWith('data:') ? 'base64' : 'external URL'}`)
      if (processedImageUrl.startsWith('data:')) {
        console.log(`[${new Date().toISOString()}] Base64 image size: ${(processedImageUrl.length / 1024 / 1024).toFixed(2)} MB`)
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to process image URL:`, error)
      return NextResponse.json(
        { error: `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

    const url = "https://api.wavespeed.ai/api/v3/wavespeed-ai/flux-kontext-max"
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${WAVESPEED_API_KEY}`
    }
    
    const payload: any = {
      "prompt": prompt,
      "image": processedImageUrl,
      "guidance_scale": 3.5,
      "safety_tolerance": "2"
    }

    // Add size parameter if provided
    if (size) {
      // Convert format from "1024x1024" to "1024*1024" if needed
      payload.size = size.replace("x", "*")
      console.log(`[${new Date().toISOString()}] API payload size: ${payload.size}`)
    }

    try {
      console.log(`[${new Date().toISOString()}] Sending request to Wavespeed API...`)
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      })

      console.log(`[${new Date().toISOString()}] Wavespeed API response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[${new Date().toISOString()}] Wavespeed API error response:`, errorText)
        throw new Error(`Wavespeed API error: ${response.status} - ${errorText}`)
      }

      const apiResponse = await response.json()
      console.log(`[${new Date().toISOString()}] Wavespeed API response:`, JSON.stringify(apiResponse, null, 2))
      
      const requestId = apiResponse.data?.id

      if (!requestId) {
        console.error(`[${new Date().toISOString()}] No request ID in response:`, apiResponse)
        throw new Error("No request ID returned from Wavespeed")
      }

      console.log(`[${new Date().toISOString()}] Request ID: ${requestId}`)
      console.log(`[${new Date().toISOString()}] Starting to poll for result...`)

      // Poll for the result
      const result = await pollWavespeedResult(requestId)
      
      // Log dimensions for verification
      if (result.width && result.height) {
        console.log(`Result dimensions: ${result.width}x${result.height}`)
        if (size) {
          const [requestedWidth, requestedHeight] = size.split('x').map(Number)
          const aspectRatioMatch = (requestedWidth / requestedHeight).toFixed(2) === (result.width / result.height).toFixed(2)
          console.log(`Aspect ratio preserved: ${aspectRatioMatch}`)
        }
      }

      const totalTime = Date.now() - startTime
      console.log(`[${new Date().toISOString()}] Edit completed successfully in ${totalTime}ms`)
      
      return NextResponse.json({
        imageUrl: result.url,
        model: 'wavespeed-flux-kontext-max',
        prompt: prompt,
        originalImage: imageUrl,
        ...(size && { size }),
        ...(result.width && result.height && { 
          resultDimensions: `${result.width}x${result.height}` 
        })
      })

    } catch (error: any) {
      const totalTime = Date.now() - startTime
      console.error(`[${new Date().toISOString()}] Image editing failed after ${totalTime}ms: ${error.message}`)
      return NextResponse.json(
        { error: error.message || "Failed to edit image with Wavespeed" },
        { status: 500 }
      )
    }

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`[${new Date().toISOString()}] Image editing error after ${totalTime}ms:`, error)
    const errorMessage = error instanceof Error ? error.message : "Failed to edit image"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}