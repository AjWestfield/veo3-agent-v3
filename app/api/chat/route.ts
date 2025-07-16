import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"
import { GoogleAIFileManager } from "@google/generative-ai/server"
import fs from "fs/promises"
import path from "path"
import os from "os"

// Configure route segment to handle large uploads
export const maxDuration = 300; // 5 minutes timeout for large uploads
export const dynamic = 'force-dynamic';

// Configure body size limit for Next.js 15 App Router
export const runtime = 'nodejs'; // Use Node.js runtime for large uploads

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
  console.log("=== NEW REQUEST RECEIVED ===")
  console.log("Time:", new Date().toISOString())
  
  try {
    const formData = await request.formData()
    const message = formData.get("message") as string
    const files = formData.getAll("files") as File[]
    const selectedTool = formData.get("selectedTool") as string | null
    const imageGenerationSettingsStr = formData.get("imageGenerationSettings") as string | null
    const imageGenerationSettings = imageGenerationSettingsStr ? JSON.parse(imageGenerationSettingsStr) : null
    
    console.log("Received request - Message:", message, "Files:", files.length, "Tool:", selectedTool, "Image Gen Settings:", imageGenerationSettings)
    
    // Log file details
    files.forEach((file, index) => {
      console.log(`File ${index + 1}:`, {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeInMB: (file.size / 1024 / 1024).toFixed(2) + "MB"
      })
    })
    
    if (!message && files.length === 0) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 })
    }

    // Handle image generation with OpenAI when createImage tool is selected
    if (selectedTool === "createImage" && message) {
      try {
        console.log("Image generation requested with prompt:", message)
        
        // Extract the actual prompt (remove the tool prefix if present)
        let imagePrompt = message
        if (message.startsWith("Please create an image of: ")) {
          imagePrompt = message.replace("Please create an image of: ", "")
        }
        
        // Call the image generation API
        const imageResponse = await fetch(new URL("/api/generate-image", request.url).toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: imagePrompt,
            // Use settings from user preferences or defaults
            imageGenerationModel: imageGenerationSettings?.model || 'openai',
            size: imageGenerationSettings?.size || "1024x1024",
            quality: imageGenerationSettings?.quality || "high",
            style: imageGenerationSettings?.style || "vivid",
            openaiModel: imageGenerationSettings?.openaiModel || "gpt-image-1",
            guidanceScale: imageGenerationSettings?.guidanceScale || 3.5,
            safetyTolerance: imageGenerationSettings?.safetyTolerance || "2"
          }),
        })
        
        if (!imageResponse.ok) {
          const errorData = await imageResponse.json()
          throw new Error(errorData.error || "Failed to generate image")
        }
        
        const imageData = await imageResponse.json()
        
        // Check if streaming is requested
        const acceptHeader = request.headers.get("accept")
        const wantsStream = acceptHeader?.includes("text/event-stream")
        
        if (wantsStream) {
          // Return streaming response with image data
          const stream = new ReadableStream({
            start(controller) {
              const encoder = new TextEncoder()
              
              // Now all responses should be URLs (either regular URLs or local file URLs)
              const imageMessage = `I've generated an image for you:\n\n![Generated Image](${imageData.imageUrl})\n\n`
              
              let promptInfo = imageData.revisedPrompt
                ? `*Original prompt: "${imagePrompt}"*\n*Revised prompt: "${imageData.revisedPrompt}"*`
                : `*Prompt: "${imagePrompt}"*`
              
              // Add model information
              if (imageData.model === 'wavespeed') {
                promptInfo += `\n\n*Generated with: Wavespeed AI (Flux Dev LoRA Ultra Fast)*`
              } else {
                promptInfo += `\n\n*Generated with: ${imageData.model}*`
              }
              
              // Add fallback notice if applicable
              if (imageData.fallbackUsed && imageData.requestedModel === "gpt-image-1") {
                promptInfo += `\n\n*Note: gpt-image-1 requires organization verification. Used ${imageData.model} as fallback. To use gpt-image-1, please verify your organization at platform.openai.com/settings/organization.*`
              }
              
              const fullMessage = imageMessage + promptInfo
              
              // Send as content chunks
              const chunks = fullMessage.split(" ")
              chunks.forEach((chunk, index) => {
                const event = `data: ${JSON.stringify({ type: 'content', text: chunk + (index < chunks.length - 1 ? " " : "") })}\n\n`
                controller.enqueue(encoder.encode(event))
              })
              
              // Send completion signal
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
            }
          })
          
          return new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          })
        } else {
          // Return regular response with image data
          let responseText = `I've generated an image for you:\n\n![Generated Image](${imageData.imageUrl})\n\n*Prompt: "${imagePrompt}"*`
          
          if (imageData.revisedPrompt) {
            responseText = `I've generated an image for you:\n\n![Generated Image](${imageData.imageUrl})\n\n*Original prompt: "${imagePrompt}"*\n*Revised prompt: "${imageData.revisedPrompt}"*`
          }
          
          // Add model information
          if (imageData.model === 'wavespeed') {
            responseText += `\n\n*Generated with: Wavespeed AI (Flux Dev LoRA Ultra Fast)*`
          } else {
            responseText += `\n\n*Generated with: ${imageData.model}*`
          }
          
          if (imageData.fallbackUsed && imageData.requestedModel === "gpt-image-1") {
            responseText += `\n\n*Note: gpt-image-1 requires organization verification. Used ${imageData.model} as fallback. To use gpt-image-1, please verify your organization at platform.openai.com/settings/organization.*`
          }
          
          return NextResponse.json({
            response: responseText,
            model: imageData.model || "gpt-image-1",
            imageUrl: imageData.imageUrl,
            revisedPrompt: imageData.revisedPrompt
          })
        }
      } catch (error) {
        console.error("Image generation error:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to generate image"
        
        // Return error in appropriate format
        const acceptHeader = request.headers.get("accept")
        if (acceptHeader?.includes("text/event-stream")) {
          const stream = new ReadableStream({
            start(controller) {
              const encoder = new TextEncoder()
              const event = `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`
              controller.enqueue(encoder.encode(event))
              controller.close()
            }
          })
          return new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          })
        } else {
          return NextResponse.json({ error: errorMessage }, { status: 500 })
        }
      }
    }

    // Initialize the model - using gemini-2.0-flash-exp for latest features
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    // Check if streaming is requested
    const acceptHeader = request.headers.get("accept")
    const wantsStream = acceptHeader?.includes("text/event-stream")
    const hasVideo = files.some(file => file.type.startsWith("video/"))
    
    console.log("Streaming mode:", wantsStream, "Has video:", hasVideo)

    if (wantsStream) {
      // Create a ReadableStream for streaming response with progress updates
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          
          // Helper function to send SSE event
          const sendEvent = (data: any) => {
            const event = `data: ${JSON.stringify(data)}\n\n`
            controller.enqueue(encoder.encode(event))
          }
          
          try {
            // Send initial progress event
            if (hasVideo) {
              sendEvent({ 
                type: 'progress', 
                stage: 'preparing', 
                message: 'Preparing to process your video...' 
              })
            }
            
            // Prepare parts for multimodal input
            const parts: any[] = []
            
            // Add text message if provided
            if (message) {
              parts.push({ text: message })
            }

            // Process files with progress updates
            for (const file of files) {
              console.log("Processing file:", file.name, "Type:", file.type, "Size:", file.size)
              
              // Check file size limits
              const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
              const MAX_VIDEO_SIZE = 1024 * 1024 * 1024; // 1GB (Gemini API maximum)
              const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB
              
              if (file.type.startsWith("image/") && file.size > MAX_IMAGE_SIZE) {
                throw new Error(`Image file ${file.name} is too large. Maximum size is 20MB.`)
              }
              if (file.type.startsWith("video/") && file.size > MAX_VIDEO_SIZE) {
                throw new Error(`Video file ${file.name} is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 1GB (1024MB).`)
              }
              if (file.type.startsWith("audio/") && file.size > MAX_AUDIO_SIZE) {
                throw new Error(`Audio file ${file.name} is too large. Maximum size is 20MB.`)
              }
              
              const bytes = await file.arrayBuffer()
              
              if (file.type.startsWith("image/")) {
                // For images, we can send inline data
                const base64 = Buffer.from(bytes).toString("base64")
                parts.push({
                  inlineData: {
                    mimeType: file.type,
                    data: base64
                  }
                })
              } else if (file.type.startsWith("video/")) {
                // For videos, save temporarily and use the Files API
                console.log("Processing video:", file.name)
                console.log("Video size:", (file.size / 1024 / 1024).toFixed(2), "MB")
                
                // Send upload starting event
                sendEvent({ 
                  type: 'progress', 
                  stage: 'uploading', 
                  message: `Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)...`,
                  fileSize: file.size
                })
                
                // Create a temporary file path
                const tempDir = os.tmpdir()
                const tempFileName = `upload_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
                const tempFilePath = path.join(tempDir, tempFileName)
                
                try {
                  console.log("Writing video to temp file:", tempFilePath)
                  const writeStartTime = Date.now()
                  
                  // Write the file to disk temporarily
                  await fs.writeFile(tempFilePath, Buffer.from(bytes))
                  
                  console.log(`Video saved to disk in ${Date.now() - writeStartTime}ms`)
                  console.log("Starting upload to Files API...")
                  
                  const uploadStartTime = Date.now()
                  
                  // Send upload progress event
                  sendEvent({ 
                    type: 'progress', 
                    stage: 'uploading', 
                    message: `Uploading to cloud...`,
                    startTime: uploadStartTime
                  })
                  
                  // Upload the file using the file path
                  const uploadResult = await fileManager.uploadFile(tempFilePath, {
                    mimeType: file.type,
                    displayName: file.name
                  })
                  
                  const uploadDuration = Date.now() - uploadStartTime
                  console.log(`Video uploaded to Files API in ${uploadDuration}ms`)
                  console.log("File URI:", uploadResult.file.uri)
                  
                  // Send upload complete event
                  sendEvent({ 
                    type: 'progress', 
                    stage: 'processing', 
                    message: `Upload complete. Processing video...`,
                    uploadDuration
                  })
                  
                  // Wait for the file to be processed
                  let fileData = uploadResult.file
                  let waitTime = 0
                  let consecutiveErrors = 0
                  const maxWaitTime = 300000 // 5 minutes max wait
                  const maxConsecutiveErrors = 3 // Stop after 3 consecutive errors
                  
                  while (fileData.state === "PROCESSING" && waitTime < maxWaitTime) {
                    console.log(`Waiting for video processing... (${waitTime / 1000}s elapsed)`)
                    
                    // Send processing progress event
                    sendEvent({ 
                      type: 'progress', 
                      stage: 'processing', 
                      message: `Processing video... (${Math.round(waitTime / 1000)}s elapsed)`,
                      elapsed: waitTime
                    })
                    
                    await new Promise(resolve => setTimeout(resolve, 2000))
                    waitTime += 2000
                    
                    try {
                      const fileResponse = await fileManager.getFile(fileData.name)
                      fileData = fileResponse
                      consecutiveErrors = 0 // Reset error count on success
                    } catch (pollError) {
                      console.error("Error polling file status:", pollError)
                      consecutiveErrors++
                      
                      // If we get consistent errors, the file might be corrupted
                      if (consecutiveErrors >= maxConsecutiveErrors) {
                        console.error(`Failed to poll file status after ${consecutiveErrors} attempts`)
                        
                        // Try to use the file anyway if it was uploaded
                        if (uploadResult.file.uri) {
                          console.log("Attempting to use file despite processing errors...")
                          fileData = uploadResult.file
                          // Proceed with the file even if processing status is unclear
                          break
                        } else {
                          throw new Error("Video file appears to be corrupted or in an unsupported format")
                        }
                      }
                      // Continue waiting
                    }
                  }
                  
                  if (waitTime >= maxWaitTime) {
                    throw new Error("Video processing timeout - file is too large or complex")
                  }
                  
                  if (fileData.state === "FAILED") {
                    throw new Error("Video processing failed - the file may be corrupted or in an unsupported format")
                  }
                  
                  console.log("Video processing complete, state:", fileData.state)
                  
                  // Send processing complete event
                  sendEvent({ 
                    type: 'progress', 
                    stage: 'analyzing', 
                    message: 'Video ready. Analyzing content...'
                  })
                  
                  // Add the file reference to parts
                  parts.push({
                    fileData: {
                      mimeType: file.type,
                      fileUri: fileData.uri
                    }
                  })
                } catch (uploadError) {
                  console.error("Video upload error:", uploadError)
                  
                  // Clean up temp file on error
                  try {
                    await fs.unlink(tempFilePath)
                  } catch (e) {
                    console.error("Failed to delete temp file:", e)
                  }
                  
                  // Provide helpful error messages
                  if (uploadError instanceof Error) {
                    if (uploadError.message.includes('timeout')) {
                      throw new Error("Video upload timed out. Please try a smaller file or check your connection.")
                    } else if (uploadError.message.includes('quota')) {
                      throw new Error("API quota exceeded. Please try again later.")
                    } else if (uploadError.message.includes('format')) {
                      throw new Error("Unsupported video format. Please use MP4, MOV, AVI, or WebM.")
                    }
                  }
                  throw uploadError
                } finally {
                  // Always clean up the temporary file
                  try {
                    await fs.unlink(tempFilePath)
                    console.log("Cleaned up temp file")
                  } catch (e) {
                    console.error("Failed to delete temp file:", e)
                  }
                }
              } else if (file.type.startsWith("audio/")) {
                // For audio, we can send inline data for small files
                const base64 = Buffer.from(bytes).toString("base64")
                parts.push({
                  inlineData: {
                    mimeType: file.type,
                    data: base64
                  }
                })
              }
            }

            console.log("Parts prepared:", parts.length)

            // Generate streaming response
            console.log("Starting streaming generation...")
            const result = await model.generateContentStream(parts)
            
            // Stream the response chunks
            for await (const chunk of result.stream) {
              const chunkText = chunk.text()
              if (chunkText) {
                // Send as Server-Sent Event format with content type
                const data = `data: ${JSON.stringify({ type: 'content', text: chunkText })}\n\n`
                controller.enqueue(encoder.encode(data))
              }
            }
            
            // Send completion signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            console.error("Streaming error:", error)
            const errorMessage = error instanceof Error ? error.message : "Streaming failed"
            const errorData = `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`
            controller.enqueue(encoder.encode(errorData))
            controller.close()
          }
        }
      })

      // Return streaming response with proper headers
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // Regular non-streaming response
      // Prepare parts for multimodal input
      const parts: any[] = []
      
      // Add text message if provided
      if (message) {
        parts.push({ text: message })
      }

      // Process files
      for (const file of files) {
        console.log("Processing file:", file.name, "Type:", file.type, "Size:", file.size)
        
        // Check file size limits
        const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
        const MAX_VIDEO_SIZE = 1024 * 1024 * 1024; // 1GB (Gemini API maximum)
        const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB
        
        if (file.type.startsWith("image/") && file.size > MAX_IMAGE_SIZE) {
          throw new Error(`Image file ${file.name} is too large. Maximum size is 20MB.`)
        }
        if (file.type.startsWith("video/") && file.size > MAX_VIDEO_SIZE) {
          throw new Error(`Video file ${file.name} is too large (${Math.round(file.size / 1024 / 1024)}MB). Maximum size is 1GB (1024MB).`)
        }
        if (file.type.startsWith("audio/") && file.size > MAX_AUDIO_SIZE) {
          throw new Error(`Audio file ${file.name} is too large. Maximum size is 20MB.`)
        }
        
        const bytes = await file.arrayBuffer()
        
        if (file.type.startsWith("image/")) {
          // For images, we can send inline data
          const base64 = Buffer.from(bytes).toString("base64")
          parts.push({
            inlineData: {
              mimeType: file.type,
              data: base64
            }
          })
        } else if (file.type.startsWith("video/")) {
          // For videos, save temporarily and use the Files API
          console.log("Processing video:", file.name)
          console.log("Video size:", (file.size / 1024 / 1024).toFixed(2), "MB")
          
          // Create a temporary file path
          const tempDir = os.tmpdir()
          const tempFileName = `upload_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
          const tempFilePath = path.join(tempDir, tempFileName)
          
          try {
            console.log("Writing video to temp file:", tempFilePath)
            const writeStartTime = Date.now()
            
            // Write the file to disk temporarily
            await fs.writeFile(tempFilePath, Buffer.from(bytes))
            
            console.log(`Video saved to disk in ${Date.now() - writeStartTime}ms`)
            console.log("Starting upload to Files API...")
            
            const uploadStartTime = Date.now()
            
            // Upload the file using the file path
            const uploadResult = await fileManager.uploadFile(tempFilePath, {
              mimeType: file.type,
              displayName: file.name
            })
            
            console.log(`Video uploaded to Files API in ${Date.now() - uploadStartTime}ms`)
            console.log("File URI:", uploadResult.file.uri)
            
            // Wait for the file to be processed
            let fileData = uploadResult.file
            let waitTime = 0
            let consecutiveErrors = 0
            const maxWaitTime = 300000 // 5 minutes max wait
            const maxConsecutiveErrors = 3 // Stop after 3 consecutive errors
            
            while (fileData.state === "PROCESSING" && waitTime < maxWaitTime) {
              console.log(`Waiting for video processing... (${waitTime / 1000}s elapsed)`)
              await new Promise(resolve => setTimeout(resolve, 2000))
              waitTime += 2000
              
              try {
                const fileResponse = await fileManager.getFile(fileData.name)
                fileData = fileResponse
                consecutiveErrors = 0 // Reset error count on success
              } catch (pollError) {
                console.error("Error polling file status:", pollError)
                consecutiveErrors++
                
                // If we get consistent errors, the file might be corrupted
                if (consecutiveErrors >= maxConsecutiveErrors) {
                  console.error(`Failed to poll file status after ${consecutiveErrors} attempts`)
                  
                  // Try to use the file anyway if it was uploaded
                  if (uploadResult.file.uri) {
                    console.log("Attempting to use file despite processing errors...")
                    fileData = uploadResult.file
                    // Proceed with the file even if processing status is unclear
                    break
                  } else {
                    throw new Error("Video file appears to be corrupted or in an unsupported format")
                  }
                }
                // Continue waiting
              }
            }
            
            if (waitTime >= maxWaitTime) {
              throw new Error("Video processing timeout - file is too large or complex")
            }
            
            if (fileData.state === "FAILED") {
              throw new Error("Video processing failed - the file may be corrupted or in an unsupported format")
            }
            
            console.log("Video processing complete, state:", fileData.state)
            
            // Add the file reference to parts
            parts.push({
              fileData: {
                mimeType: file.type,
                fileUri: fileData.uri
              }
            })
          } catch (uploadError) {
            console.error("Video upload error:", uploadError)
            
            // Clean up temp file on error
            try {
              await fs.unlink(tempFilePath)
            } catch (e) {
              console.error("Failed to delete temp file:", e)
            }
            
            // Provide helpful error messages
            if (uploadError instanceof Error) {
              if (uploadError.message.includes('timeout')) {
                throw new Error("Video upload timed out. Please try a smaller file or check your connection.")
              } else if (uploadError.message.includes('quota')) {
                throw new Error("API quota exceeded. Please try again later.")
              } else if (uploadError.message.includes('format')) {
                throw new Error("Unsupported video format. Please use MP4, MOV, AVI, or WebM.")
              }
            }
            throw uploadError
          } finally {
            // Always clean up the temporary file
            try {
              await fs.unlink(tempFilePath)
              console.log("Cleaned up temp file")
            } catch (e) {
              console.error("Failed to delete temp file:", e)
            }
          }
        } else if (file.type.startsWith("audio/")) {
          // For audio, we can send inline data for small files
          const base64 = Buffer.from(bytes).toString("base64")
          parts.push({
            inlineData: {
              mimeType: file.type,
              data: base64
            }
          })
        }
      }

      console.log("Parts prepared:", parts.length)
      console.log("Generating content with Gemini...")
      const result = await model.generateContent(parts)
      const response = await result.response
      const text = response.text()

      console.log("Generation complete, response length:", text.length)

      return NextResponse.json({ 
        response: text,
        model: "gemini-2.0-flash-exp"
      })
    }

  } catch (error) {
    console.error("=== ERROR OCCURRED ===")
    console.error("Error Type:", error?.constructor?.name)
    console.error("Error Message:", error instanceof Error ? error.message : "Unknown error")
    console.error("Full Error:", error)
    console.error("Stack Trace:", error instanceof Error ? error.stack : "No stack trace")
    
    // Determine appropriate error response
    let statusCode = 500
    let errorMessage = "Failed to process request"
    let errorDetails = error instanceof Error ? error.message : "Unknown error"
    
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        statusCode = 429
        errorMessage = "API quota exceeded"
        errorDetails = "Please try again later or contact support"
      } else if (error.message.includes('timeout')) {
        statusCode = 408
        errorMessage = "Request timeout"
        errorDetails = error.message
      } else if (error.message.includes('too large')) {
        statusCode = 413
        errorMessage = "File too large"
        errorDetails = error.message
      } else if (error.message.includes('format') || error.message.includes('unsupported')) {
        statusCode = 415
        errorMessage = "Unsupported media type"
        errorDetails = error.message
      }
    }
    
    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: statusCode }
    )
  }
}