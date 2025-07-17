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
  
  // Check API key configuration
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured")
    return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
  }
  console.log("API Key configured:", apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : "No")
  
  try {
    const formData = await request.formData()
    const message = formData.get("message") as string
    const files = formData.getAll("files") as File[]
    const selectedTool = formData.get("selectedTool") as string | null
    const imageGenerationSettingsStr = formData.get("imageGenerationSettings") as string | null
    const imageGenerationSettings = imageGenerationSettingsStr ? JSON.parse(imageGenerationSettingsStr) : null
    const numberOfClips = formData.get("numberOfClips") as string | null
    
    console.log("Received request - Message:", message, "Files:", files.length, "Tool:", selectedTool, "Image Gen Settings:", imageGenerationSettings, "Number of clips:", numberOfClips)
    
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

    // Handle web search with Perplexity when searchWeb tool is selected
    if (selectedTool === "searchWeb" && message) {
      try {
        console.log("Web search requested with query:", message)
        
        // Extract the actual query (remove the tool prefix if present)
        let searchQuery = message
        if (message.startsWith("Please search the web for: ")) {
          searchQuery = message.replace("Please search the web for: ", "")
        }
        
        // Call the web search API
        const searchResponse = await fetch(new URL("/api/search-web", request.url).toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
            searchMode: 'web',
            searchContextSize: 'high',
            return_images: true,
            return_related_questions: true,
            max_results: 10
          }),
        })
        
        if (!searchResponse.ok) {
          const errorData = await searchResponse.json()
          throw new Error(errorData.error || "Failed to perform search")
        }
        
        const searchData = await searchResponse.json()
        
        // Check if streaming is requested
        const acceptHeader = request.headers.get("accept")
        const wantsStream = acceptHeader?.includes("text/event-stream")
        
        if (wantsStream) {
          // Return streaming response with search results
          const stream = new ReadableStream({
            async start(controller) {
              const encoder = new TextEncoder()
              
              // Send search progress updates
              const progressStages = [
                { stage: "searching", message: "Searching across multiple sources..." },
                { stage: "analyzing", message: "Analyzing and cross-referencing results..." },
                { stage: "formatting", message: "Formatting response with citations..." }
              ]
              
              // Simulate search progress
              for (const progress of progressStages) {
                const event = `data: ${JSON.stringify({ 
                  type: 'searchProgress', 
                  stage: progress.stage,
                  message: progress.message 
                })}\n\n`
                controller.enqueue(encoder.encode(event))
                await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between stages
              }
              
              // Send the search data metadata
              const searchMetaEvent = `data: ${JSON.stringify({ 
                type: 'searchData',
                citations: searchData.citations,
                searchResults: searchData.searchResults,
                images: searchData.images,
                relatedQuestions: searchData.relatedQuestions
              })}\n\n`
              controller.enqueue(encoder.encode(searchMetaEvent))
              
              // Stream the search results content
              const chunks = searchData.response.split(" ")
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
          // Return regular response with search data
          return NextResponse.json({
            response: searchData.response,
            model: searchData.model || "perplexity-sonar-pro",
            citations: searchData.citations,
            searchResults: searchData.searchResults,
            images: searchData.images,
            relatedQuestions: searchData.relatedQuestions,
            usage: searchData.usage
          })
        }
      } catch (error) {
        console.error("Web search error:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to perform web search"
        
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

    // Initialize the model - trying different models based on availability
    let model;
    let modelName = "gemini-2.0-flash-exp";
    try {
      model = genAI.getGenerativeModel({ model: modelName })
      console.log(`Successfully initialized model: ${modelName}`)
    } catch (modelError) {
      console.error(`Failed to initialize ${modelName}:`, modelError)
      // Try fallback to stable model
      try {
        modelName = "gemini-1.5-flash";
        console.log(`Trying fallback model: ${modelName}`)
        model = genAI.getGenerativeModel({ model: modelName })
        console.log(`Successfully initialized fallback model: ${modelName}`)
      } catch (fallbackError) {
        console.error(`Failed to initialize fallback model:`, fallbackError)
        return NextResponse.json(
          { error: "Failed to initialize AI model. Please check API configuration." },
          { status: 500 }
        )
      }
    }

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
            
            // Add text message with celebrity detection for media files
            const hasImageFiles = files.some(f => f.type.startsWith('image/'))
            const hasVideoFiles = files.some(f => f.type.startsWith('video/'))
            const isVeo3Request = selectedTool === 'veoPrompt'
            
            if (message) {
              // For non-VEO3 requests with media, add celebrity detection
              if ((hasImageFiles || hasVideoFiles) && !isVeo3Request) {
                const enhancedMessage = `${message}

Additional instructions: If you identify any public figures, celebrities, or well-known people in this content, please:
1. Name them clearly
2. Mention what they are known for (e.g., "Actor known for...", "Musician famous for...", "Politician who...")
3. Describe their appearance in the image/video
4. Note their role or context in this specific content`
                parts.push({ text: enhancedMessage })
              } else {
                parts.push({ text: message })
              }
            } else if ((hasImageFiles || hasVideoFiles) && !isVeo3Request) {
              // Auto-add celebrity detection for media without specific message
              parts.push({ text: `Analyze this content. If you identify any public figures, celebrities, or well-known people, please:
1. Name them clearly
2. Mention what they are known for (e.g., "Actor known for...", "Musician famous for...", "Politician who...")
3. Describe their appearance in the image/video
4. Note their role or context in this specific content

If no public figures are present, proceed with regular analysis.` })
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

            // Check if this is a video analysis request
            const hasVideoFile = files.some(file => file.type.startsWith("video/"))
            
            if (hasVideoFile && (!message || message.trim() === "" || message.toLowerCase().includes("analyze"))) {
              // Check if multiple clips are requested
              const isAutoDetect = numberOfClips === "auto";
              const numClips = isAutoDetect ? null : parseInt(numberOfClips || "1");
              
              // Add detailed video analysis prompt with celebrity detection
              const detailedVideoPrompt = {
                text: isAutoDetect ? 
                  `Analyze this video completely. 

IMPORTANT FIRST STEP - Celebrity/Public Figure Detection:
If you identify any public figures, celebrities, or well-known people in the video:
- Name them clearly and state what they are known for
- Describe their appearance and actions in the video
- Note their role in the content
- Include this information in your analysis

Then, determine the total duration of the video. If the video is longer than 8 seconds, automatically divide it into multiple 8-second clips.

For videos longer than 8 seconds:
- Calculate how many 8-second clips are needed (e.g., 24-second video = 3 clips)
- Each clip should be approximately 8 seconds
- Provide a separate VEO 3 prompt for EACH 8-second segment

Start your response with: "VEO 3 AUTO-DETECTED CLIPS ANALYSIS:"
Then indicate: "Video Duration: [XX seconds] | Number of 8-second clips: [N]"

Then for EACH clip, use this EXACT format:

## CLIP \${clipNumber} of \${totalClips} [Timestamp: XX:XX-XX:XX]

CLIP: [Brief summary of the entire 8-second scene. This should describe what happens from beginning to end in one or two sentences.]

STYLE: [Describe the visual style. Include resolution (8K), cinematic terms, lens type if relevant (e.g., GoPro-style, drone), lighting conditions (natural, ambient), and tone.]

VISUAL_DESCRIPTION: [Detailed breakdown of the characters, setting, motion, mood, and important visuals seen in the shot. This should help the model visualize everything clearly.]

DIALOGUE:
(00:01) [Character name or descriptor, tone]
"Line of dialogue."
(00:05) [Character name or descriptor, emotional shift if any]
"Line of dialogue."
[If no dialogue, write: None.]

TIMELINE & CAMERA ACTION:
(00:00–00:02) [Describe what the camera shows and how it moves.]
(00:02–00:04) [Continue camera actions.]
(00:04–00:06) [More movement or change in focus.]
(00:06–00:08) [Final frame focus or motion before video ends.]

AUDIO: [List ambient sounds or specific SFX: wind, waves, crowd, breathing, etc. No music unless it's diegetic.]

CAMERA STYLE: [Explain how the camera behaves. Always specify "one continuous handheld shot," "GoPro-style POV," "drone flyover," etc. No cuts, no transitions.]

NEGATIVE_PROMPT: [List what should NOT appear: no text, no captions, no blood, no horror tone, no underwater POV, no jump cuts, etc.]

---

If the video is 8 seconds or shorter, provide just ONE clip analysis.
Each section header must be in CAPS followed by a colon. All content should comply with Veo 3's latest guidelines.`
                : numClips && numClips > 1 ? 
                  `Analyze this video and detect ${numClips} distinct clips/scenes (approximately 8 seconds each). For EACH clip, provide a separate VEO 3 prompt using the official template format.

Start your response with: "VEO 3 MULTI-CLIP ANALYSIS:"

Then for EACH clip, use this EXACT format:

## CLIP \${clipNumber} of ${numClips} [Timestamp: XX:XX-XX:XX]

CLIP: [Brief summary of the entire 8-second scene. This should describe what happens from beginning to end in one or two sentences.]

STYLE: [Describe the visual style. Include resolution (8K), cinematic terms, lens type if relevant (e.g., GoPro-style, drone), lighting conditions (natural, ambient), and tone.]

VISUAL_DESCRIPTION: [Detailed breakdown of the characters, setting, motion, mood, and important visuals seen in the shot. This should help the model visualize everything clearly.]

DIALOGUE:
(00:01) [Character name or descriptor, tone]
"Line of dialogue."
(00:05) [Character name or descriptor, emotional shift if any]
"Line of dialogue."
[If no dialogue, write: None.]

TIMELINE & CAMERA ACTION:
(00:00–00:02) [Describe what the camera shows and how it moves.]
(00:02–00:04) [Continue camera actions.]
(00:04–00:06) [More movement or change in focus.]
(00:06–00:08) [Final frame focus or motion before video ends.]

AUDIO: [List ambient sounds or specific SFX: wind, waves, crowd, breathing, etc. No music unless it's diegetic.]

CAMERA STYLE: [Explain how the camera behaves. Always specify "one continuous handheld shot," "GoPro-style POV," "drone flyover," etc. No cuts, no transitions.]

NEGATIVE_PROMPT: [List what should NOT appear: no text, no captions, no blood, no horror tone, no underwater POV, no jump cuts, etc.]

---

Repeat this exact structure for each of the ${numClips} clips. Each section header must be in CAPS followed by a colon. All content should comply with Veo 3's latest guidelines.

REMEMBER: If any public figures or celebrities are present in the video, identify them by name and mention what they are known for.`
                  :
                  `Analyze this video and provide a VEO 3 prompt using the official template format. Your response should be ready to copy and paste directly into VEO 3.

IMPORTANT FIRST STEP - Celebrity/Public Figure Detection:
If you identify any public figures, celebrities, or well-known people in the video:
- Name them clearly and state what they are known for
- Describe their appearance and actions in the video
- Note their role in the content

Start your response with: "VEO 3 PROMPT:"

Then use this EXACT structure (each section must be included):

CLIP: [Brief summary of the entire 8-second scene. This should describe what happens from beginning to end in one or two sentences.]

STYLE: [Describe the visual style. Include resolution (8K), cinematic terms, lens type if relevant (e.g., GoPro-style, drone), lighting conditions (natural, ambient), and tone.]

VISUAL_DESCRIPTION: [Detailed breakdown of the characters, setting, motion, mood, and important visuals seen in the shot. This should help the model visualize everything clearly.]

DIALOGUE:
(00:01) [Character name or descriptor, tone]
"Line of dialogue."
(00:05) [Character name or descriptor, emotional shift if any]
"Line of dialogue."
[If no dialogue, write: None.]

TIMELINE & CAMERA ACTION:
(00:00–00:02) [Describe what the camera shows and how it moves.]
(00:02–00:04) [Continue camera actions.]
(00:04–00:06) [More movement or change in focus.]
(00:06–00:08) [Final frame focus or motion before video ends.]

AUDIO: [List ambient sounds or specific SFX: wind, waves, crowd, breathing, etc. No music unless it's diegetic.]

CAMERA STYLE: [Explain how the camera behaves. Always specify "one continuous handheld shot," "GoPro-style POV," "drone flyover," etc. No cuts, no transitions.]

NEGATIVE_PROMPT: [List what should NOT appear: no text, no captions, no blood, no horror tone, no underwater POV, no jump cuts, etc.]

IMPORTANT: Follow this template exactly. Each section header must be in CAPS followed by a colon. All content should comply with Veo 3's latest guidelines (no violence, no horror, one continuous shot, etc.).`
              }
              
              // Insert the detailed prompt at the beginning
              parts.unshift(detailedVideoPrompt)
            }

            // Generate streaming response
            console.log("Starting streaming generation...")
            console.log("Number of parts:", parts.length)
            console.log("Parts summary:", parts.map((p, i) => {
              if (p.text) return `Part ${i}: text (${p.text.length} chars)`
              if (p.inlineData) return `Part ${i}: ${p.inlineData.mimeType} (inline data)`
              if (p.fileData) return `Part ${i}: file data`
              return `Part ${i}: unknown type`
            }))
            
            let result;
            try {
              result = await model.generateContentStream(parts)
            } catch (streamError) {
              console.error("Failed to start streaming:", streamError)
              console.error("Stream error details:", {
                name: streamError?.name,
                message: streamError?.message,
                stack: streamError?.stack,
                response: streamError?.response,
                status: streamError?.status
              })
              throw new Error(`Failed to start Gemini streaming: ${streamError instanceof Error ? streamError.message : 'Unknown error'}`)
            }
            
            // Stream the response chunks
            try {
              let chunkCount = 0
              for await (const chunk of result.stream) {
                chunkCount++
                const chunkText = chunk.text()
                if (chunkText) {
                  // Send as Server-Sent Event format with content type
                  const data = `data: ${JSON.stringify({ type: 'content', text: chunkText })}\n\n`
                  controller.enqueue(encoder.encode(data))
                }
              }
              console.log(`Successfully streamed ${chunkCount} chunks`)
            } catch (chunkError) {
              console.error("Error while streaming chunks:", chunkError)
              console.error("Chunk error details:", {
                name: chunkError?.name,
                message: chunkError?.message,
                stack: chunkError?.stack,
                toString: chunkError?.toString?.()
              })
              throw new Error(`Failed to parse stream: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`)
            }
            
            // Send completion signal
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            console.error("Streaming error details:", {
              error,
              errorType: error?.constructor?.name,
              message: error instanceof Error ? error.message : "Unknown error",
              stack: error instanceof Error ? error.stack : undefined
            })
            
            let errorMessage = "Streaming failed"
            if (error instanceof Error) {
              if (error.message.includes("API key")) {
                errorMessage = "Invalid or missing Gemini API key"
              } else if (error.message.includes("quota")) {
                errorMessage = "Gemini API quota exceeded. Please try again later."
              } else if (error.message.includes("Failed to parse stream")) {
                errorMessage = "Failed to parse Gemini response stream. The API might be experiencing issues."
              } else {
                errorMessage = error.message
              }
            }
            
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
      
      // Add text message with celebrity detection for media files (non-streaming)
      const hasImageFiles = files.some(f => f.type.startsWith('image/'))
      const hasVideoFiles = files.some(f => f.type.startsWith('video/'))
      const isVeo3Request = selectedTool === 'veoPrompt'
      
      if (message) {
        // For non-VEO3 requests with media, add celebrity detection
        if ((hasImageFiles || hasVideoFiles) && !isVeo3Request) {
          const enhancedMessage = `${message}

Additional instructions: If you identify any public figures, celebrities, or well-known people in this content, please:
1. Name them clearly
2. Mention what they are known for (e.g., "Actor known for...", "Musician famous for...", "Politician who...")
3. Describe their appearance in the image/video
4. Note their role or context in this specific content`
          parts.push({ text: enhancedMessage })
        } else {
          parts.push({ text: message })
        }
      } else if ((hasImageFiles || hasVideoFiles) && !isVeo3Request) {
        // Auto-add celebrity detection for media without specific message
        parts.push({ text: `Analyze this content. If you identify any public figures, celebrities, or well-known people, please:
1. Name them clearly
2. Mention what they are known for (e.g., "Actor known for...", "Musician famous for...", "Politician who...")
3. Describe their appearance in the image/video
4. Note their role or context in this specific content

If no public figures are present, proceed with regular analysis.` })
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
      
      // Check if this is a video analysis request
      const hasVideoFile = files.some(file => file.type.startsWith("video/"))
      
      if (hasVideoFile && (!message || message.trim() === "" || message.toLowerCase().includes("analyze"))) {
        // Check if multiple clips are requested
        const isAutoDetect = numberOfClips === "auto";
        const numClips = isAutoDetect ? null : parseInt(numberOfClips || "1");
        
        // Add detailed video analysis prompt with celebrity detection
        const detailedVideoPrompt = {
          text: isAutoDetect ? 
            `Analyze this video completely. 

IMPORTANT FIRST STEP - Celebrity/Public Figure Detection:
If you identify any public figures, celebrities, or well-known people in the video:
- Name them clearly and state what they are known for
- Describe their appearance and actions in the video
- Note their role in the content
- Include this information in your analysis

Then, determine the total duration of the video. If the video is longer than 8 seconds, automatically divide it into multiple 8-second clips.

For videos longer than 8 seconds:
- Calculate how many 8-second clips are needed (e.g., 24-second video = 3 clips)
- Each clip should be approximately 8 seconds
- Provide a separate VEO 3 prompt for EACH 8-second segment

Start your response with: "VEO 3 AUTO-DETECTED CLIPS ANALYSIS:"
Then indicate: "Video Duration: [XX seconds] | Number of 8-second clips: [N]"

Then for EACH clip, use this EXACT format:

## CLIP \${clipNumber} of \${totalClips} [Timestamp: XX:XX-XX:XX]

CLIP: [Brief summary of the entire 8-second scene. This should describe what happens from beginning to end in one or two sentences.]

STYLE: [Describe the visual style. Include resolution (8K), cinematic terms, lens type if relevant (e.g., GoPro-style, drone), lighting conditions (natural, ambient), and tone.]

VISUAL_DESCRIPTION: [Detailed breakdown of the characters, setting, motion, mood, and important visuals seen in the shot. This should help the model visualize everything clearly.]

DIALOGUE:
(00:01) [Character name or descriptor, tone]
"Line of dialogue."
(00:05) [Character name or descriptor, emotional shift if any]
"Line of dialogue."
[If no dialogue, write: None.]

TIMELINE & CAMERA ACTION:
(00:00–00:02) [Describe what the camera shows and how it moves.]
(00:02–00:04) [Continue camera actions.]
(00:04–00:06) [More movement or change in focus.]
(00:06–00:08) [Final frame focus or motion before video ends.]

AUDIO: [List ambient sounds or specific SFX: wind, waves, crowd, breathing, etc. No music unless it's diegetic.]

CAMERA STYLE: [Explain how the camera behaves. Always specify "one continuous handheld shot," "GoPro-style POV," "drone flyover," etc. No cuts, no transitions.]

NEGATIVE_PROMPT: [List what should NOT appear: no text, no captions, no blood, no horror tone, no underwater POV, no jump cuts, etc.]

---

If the video is 8 seconds or shorter, provide just ONE clip analysis.
Each section header must be in CAPS followed by a colon. All content should comply with Veo 3's latest guidelines.`
          : numClips && numClips > 1 ? 
            `Analyze this video and detect ${numClips} distinct clips/scenes (approximately 8 seconds each). For EACH clip, provide a separate VEO 3 prompt using the official template format.

Start your response with: "VEO 3 MULTI-CLIP ANALYSIS:"

Then for EACH clip, use this format:

## CLIP \${clipNumber} of ${numClips} [Timestamp: XX:XX-XX:XX]

CLIP: [Brief summary of the entire 8-second scene. This should describe what happens from beginning to end in one or two sentences.]

STYLE: [Describe the visual style. Include resolution (8K), cinematic terms, lens type if relevant (e.g., GoPro-style, drone), lighting conditions (natural, ambient), and tone.]

VISUAL_DESCRIPTION: [Detailed breakdown of the characters, setting, motion, mood, and important visuals seen in the shot. This should help the model visualize everything clearly.]

DIALOGUE:
(00:01) [Character name or descriptor, tone]
"Line of dialogue."
(00:05) [Character name or descriptor, emotional shift if any]
"Line of dialogue."
[If no dialogue, write: None.]

TIMELINE & CAMERA ACTION:
(00:00–00:02) [Describe what the camera shows and how it moves.]
(00:02–00:04) [Continue camera actions.]
(00:04–00:06) [More movement or change in focus.]
(00:06–00:08) [Final frame focus or motion before video ends.]

AUDIO: [List ambient sounds or specific SFX: wind, waves, crowd, breathing, etc. No music unless it's diegetic.]

CAMERA STYLE: [Explain how the camera behaves. Always specify "one continuous handheld shot," "GoPro-style POV," "drone flyover," etc. No cuts, no transitions.]

NEGATIVE_PROMPT: [List what should NOT appear: no text, no captions, no blood, no horror tone, no underwater POV, no jump cuts, etc.]

---

Repeat this exact structure for each of the ${numClips} clips. Each section header must be in CAPS followed by a colon. All content should comply with Veo 3's latest guidelines.

REMEMBER: If any public figures or celebrities are present in the video, identify them by name and mention what they are known for.`
            :
            `Analyze this video and provide a VEO 3 prompt using the official template format. Your response should be ready to copy and paste directly into VEO 3.

Start your response with: "VEO 3 PROMPT:"

Then use this EXACT structure (each section must be included):

CLIP: [Brief summary of the entire 8-second scene. Describe what happens from beginning to end in one or two sentences.]

STYLE: [Describe the visual style. Include resolution (8K), cinematic terms, lens type if relevant (e.g., GoPro-style, drone), lighting conditions (natural, ambient), and tone.]

VISUAL_DESCRIPTION: [Detailed breakdown of the characters, setting, motion, mood, and important visuals seen in the shot. This should help the model visualize everything clearly.]

DIALOGUE:
(00:01) [Character name or descriptor, tone]
"Line of dialogue."
(00:05) [Character name or descriptor, emotional shift if any]
"Line of dialogue."
[If no dialogue, write: None.]

TIMELINE & CAMERA ACTION:
(00:00–00:02) [Describe what the camera shows and how it moves.]
(00:02–00:04) [Continue camera actions.]
(00:04–00:06) [More movement or change in focus.]
(00:06–00:08) [Final frame focus or motion before video ends.]

AUDIO: [List ambient sounds or specific SFX: wind, waves, crowd, breathing, etc. No music unless it's diegetic.]

CAMERA STYLE: [Explain how the camera behaves. Always specify "one continuous handheld shot," "GoPro-style POV," "drone flyover," etc. No cuts, no transitions.]

NEGATIVE_PROMPT: [List what should NOT appear: no text, no captions, no blood, no horror tone, no underwater POV, no jump cuts, etc.]

IMPORTANT: Follow this template exactly. Each section header must be in CAPS followed by a colon. All content should comply with Veo 3's latest guidelines (no violence, no horror, one continuous shot, etc.).`
        }
        
        // Insert the detailed prompt at the beginning
        parts.unshift(detailedVideoPrompt)
      }
      
      console.log("Generating content with Gemini...")
      const result = await model.generateContent(parts)
      const response = result.response
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