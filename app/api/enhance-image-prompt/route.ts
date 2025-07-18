import { GoogleGenAI } from "@google/genai"
import { NextRequest, NextResponse } from "next/server"

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" })

export async function POST(request: NextRequest) {
  console.log("=== ENHANCE IMAGE PROMPT REQUEST ===")
  
  try {
    const { prompt, imageUrls = [], imageDescriptions = [] } = await request.json()
    console.log("Received prompt:", prompt)
    console.log("Number of images:", imageUrls.length)
    
    if (!prompt) {
      console.error("No prompt provided")
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 })
    }

    // Check API key configuration
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured")
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    // Set model name - will try different models if one fails
    let modelName = "gemini-2.0-flash";

    // Process images if provided
    let imageContext = ""
    if (imageUrls.length > 0) {
      try {
        const imageAnalysisPromises = imageUrls.slice(0, 5).map(async (imageUrl, index) => {
          try {
            // For blob URLs or base64 images, we'll analyze them directly
            if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
              // Extract base64 data if it's a data URL
              if (imageUrl.startsWith('data:')) {
                const base64Data = imageUrl.split(',')[1]
                const mimeType = imageUrl.match(/data:([^;]+)/)?.[1] || 'image/jpeg'
                
                // Create the image part for Gemini
                const imagePart = {
                  inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                  }
                }
                
                // Analyze the image
                const analysisPrompt = "Briefly describe this image in one sentence, focusing on the main subjects, style, and mood."
                try {
                  const response = await ai.models.generateContent({
                    model: modelName,
                    contents: [analysisPrompt, imagePart]
                  })
                  return `Image ${index + 1}: ${response.text.trim()}`
                } catch (modelError: any) {
                  // Try fallback model if primary fails
                  if (modelName === "gemini-2.0-flash") {
                    const fallbackResponse = await ai.models.generateContent({
                      model: "gemini-1.5-flash",
                      contents: [analysisPrompt, imagePart]
                    })
                    return `Image ${index + 1}: ${fallbackResponse.text.trim()}`
                  }
                  throw modelError
                }
              }
              // For blob URLs, we'll use any provided descriptions
              else if (imageDescriptions[index]) {
                return `Image ${index + 1}: ${imageDescriptions[index]}`
              }
              return `Image ${index + 1}: User-provided image`
            } else {
              // For regular URLs, we can't analyze them directly without downloading
              // Use provided descriptions if available
              if (imageDescriptions[index]) {
                return `Image ${index + 1}: ${imageDescriptions[index]}`
              }
              return `Image ${index + 1}: External image URL`
            }
          } catch (imgError) {
            console.error(`Failed to analyze image ${index + 1}:`, imgError)
            return `Image ${index + 1}: Unable to analyze`
          }
        })
        
        const imageAnalyses = await Promise.all(imageAnalysisPromises)
        imageContext = imageAnalyses.join('\n')
        console.log("Image context generated:", imageContext)
      } catch (error) {
        console.error("Error analyzing images:", error)
        imageContext = "Images provided but could not be analyzed"
      }
    }

    // Create enhanced prompt based on image context
    const systemPrompt = `You are helping enhance a prompt for image editing. ${imageUrls.length > 1 ? 'Multiple images will be edited together.' : 'A single image will be edited.'}

${imageContext ? `Context about the image(s):\n${imageContext}\n\n` : ''}Original editing prompt: "${prompt}"

Create an enhanced version that is more detailed, specific, and will produce better results. Consider the image content and suggest appropriate stylistic or compositional improvements. Keep it to 2-3 sentences max.

Enhanced prompt:`

    // Generate enhanced prompt
    console.log("Calling Gemini API for prompt enhancement...")
    
    let enhancedPrompt;
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: systemPrompt
      })
      enhancedPrompt = response.text.trim()
      
      console.log("Enhanced prompt generated:", enhancedPrompt)
    } catch (apiError: any) {
      console.error("Gemini API call failed:", apiError)
      
      // Try fallback model if primary fails
      if (modelName === "gemini-2.0-flash") {
        console.log("Trying fallback model: gemini-1.5-flash")
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: systemPrompt
          })
          enhancedPrompt = fallbackResponse.text.trim()
          console.log("Enhanced prompt generated with fallback model:", enhancedPrompt)
        } catch (fallbackError) {
          console.error("Fallback model also failed:", fallbackError)
          // Fallback: context-aware enhancement without AI
          if (imageUrls.length > 1) {
            enhancedPrompt = `${prompt}. Seamlessly blend all ${imageUrls.length} images together with professional quality and attention to detail.`
          } else {
            enhancedPrompt = `${prompt}. Apply the edit with high quality, preserving important details while achieving the desired effect.`
          }
          console.log("Using fallback enhancement")
        }
      } else {
        // Fallback: context-aware enhancement without AI
        if (imageUrls.length > 1) {
          enhancedPrompt = `${prompt}. Seamlessly blend all ${imageUrls.length} images together with professional quality and attention to detail.`
        } else {
          enhancedPrompt = `${prompt}. Apply the edit with high quality, preserving important details while achieving the desired effect.`
        }
        console.log("Using fallback enhancement")
      }
    }

    return NextResponse.json({
      originalPrompt: prompt,
      enhancedPrompt,
      imageContext,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error enhancing image prompt - Full error:", error)
    
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
      
      // Check for specific Gemini API errors
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Invalid API key configuration" },
          { status: 500 }
        )
      }
      
      if (error.message.includes("quota")) {
        return NextResponse.json(
          { error: "API quota exceeded. Please try again later." },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to enhance prompt: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to enhance prompt" },
      { status: 500 }
    )
  }
}