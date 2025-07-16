import { NextRequest, NextResponse } from "next/server"

const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY || ""

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

    console.log(`Editing image using Wavespeed AI flux-kontext-max`)
    if (size) {
      console.log(`Requested dimensions: ${size}`)
    }

    const url = "https://api.wavespeed.ai/api/v3/wavespeed-ai/flux-kontext-max"
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${WAVESPEED_API_KEY}`
    }
    
    const payload: any = {
      "prompt": prompt,
      "image": imageUrl,
      "guidance_scale": 3.5,
      "safety_tolerance": "2"
    }

    // Add size parameter if provided
    if (size) {
      // Convert format from "1024x1024" to "1024*1024" if needed
      payload.size = size.replace("x", "*")
      console.log(`API payload size: ${payload.size}`)
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
        if (size) {
          const [requestedWidth, requestedHeight] = size.split('x').map(Number)
          const aspectRatioMatch = (requestedWidth / requestedHeight).toFixed(2) === (result.width / result.height).toFixed(2)
          console.log(`Aspect ratio preserved: ${aspectRatioMatch}`)
        }
      }

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
      console.error(`Image editing failed: ${error.message}`)
      return NextResponse.json(
        { error: error.message || "Failed to edit image with Wavespeed" },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Image editing error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to edit image"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}