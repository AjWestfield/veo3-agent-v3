import { GoogleGenAI } from "@google/genai"
import { NextRequest, NextResponse } from "next/server"

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" })

export async function POST(request: NextRequest) {
  console.log("=== SUGGEST MULTI-EDIT PROMPTS REQUEST ===")
  
  try {
    const { imageUrls = [], imageDescriptions = [] } = await request.json()
    console.log("Number of images:", imageUrls.length)
    
    if (imageUrls.length === 0) {
      console.error("No images provided")
      return NextResponse.json({ error: "No images provided" }, { status: 400 })
    }

    // Check API key configuration
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not configured")
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    // Set model name - will try different models if one fails
    let modelName = "gemini-2.0-flash";

    // Process images to understand their content
    let imageAnalyses: string[] = []
    if (imageUrls.length > 0) {
      try {
        const imageAnalysisPromises = imageUrls.slice(0, 10).map(async (imageUrl, index) => {
          try {
            // For data URLs, we can analyze them directly
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
              const analysisPrompt = "Analyze this image in detail. Describe the main subjects, their appearance, clothing, setting, mood, and any notable visual elements. Be specific about what you see."
              try {
                const response = await ai.models.generateContent({
                  model: modelName,
                  contents: [analysisPrompt, imagePart]
                })
                return response.text.trim()
              } catch (modelError: any) {
                // Try fallback model if primary fails
                if (modelName === "gemini-2.0-flash") {
                  const fallbackResponse = await ai.models.generateContent({
                    model: "gemini-1.5-flash",
                    contents: [analysisPrompt, imagePart]
                  })
                  return fallbackResponse.text.trim()
                }
                throw modelError
              }
            }
            // For blob URLs or external URLs, use provided descriptions
            else if (imageDescriptions[index]) {
              return imageDescriptions[index]
            }
            return `Image ${index + 1}: Unable to analyze directly`
          } catch (imgError) {
            console.error(`Failed to analyze image ${index + 1}:`, imgError)
            return `Image ${index + 1}: Unable to analyze`
          }
        })
        
        imageAnalyses = await Promise.all(imageAnalysisPromises)
        console.log("Image analyses completed")
      } catch (error) {
        console.error("Error analyzing images:", error)
        imageAnalyses = imageUrls.map((_, i) => `Image ${i + 1}: Analysis failed`)
      }
    }

    // Create a comprehensive context from all images
    const combinedContext = imageAnalyses.join('\n\n')
    const imageCount = imageUrls.length

    // Generate creative prompt suggestions using Flux Kontext best practices
    const systemPrompt = `You are an expert at creating prompts for Wavespeed AI's Flux Kontext Max model, which excels at combining multiple images. Generate exactly 3 highly specific prompts that follow proven Flux Kontext patterns.

CRITICAL REQUIREMENTS for optimal Flux Kontext results:
1. ALWAYS reference specific images using phrases like "the person in the first image", "the object from the second image", "the background from image 3"
2. Be extremely specific about which elements from which images should be combined
3. Use clear action verbs (combine, place, merge, blend)
4. Describe lighting, perspective, and scale adjustments needed
5. Specify desired composition and positioning

Image analyses:
${combinedContext}

PROVEN TEMPLATES that work best:
- "Place [specific subject from first image] next to [specific subject from second image] in [setting/background from third image]"
- "Combine [person from image 1 wearing X] with [environment from image 2], maintaining natural lighting and perspective"
- "Merge [object from first image] into [scene from second image], adjusting scale and lighting to match"
- "Create a composition where [subject from image 1] interacts with [element from image 2] in [style]"

Based on the analyses above, generate exactly 3 prompts that:
1. Specifically reference elements from each image by number (first image, second image, etc.)
2. Describe realistic combinations that would look natural
3. Include composition and lighting guidance
4. Use proven Flux Kontext prompt patterns
5. Are 1-2 sentences each

Format: Just the prompts, one per line, no numbers or bullets.`

    // Generate suggestions
    console.log("Generating prompt suggestions...")
    
    let suggestions: string[] = []
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: systemPrompt
      })
      const text = response.text.trim()
      
      // Split by newlines and clean up
      suggestions = text.split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 10) // Filter out empty or very short lines
        .slice(0, 3) // Take only first 3
      
      // Ensure we have exactly 3 suggestions
      while (suggestions.length < 3) {
        suggestions.push(`Combine all ${imageCount} images into a cohesive artistic composition with enhanced lighting and professional editing`)
      }
      
      console.log("Generated suggestions:", suggestions)
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
          const text = fallbackResponse.text.trim()
          
          suggestions = text.split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 10)
            .slice(0, 3)
          
          while (suggestions.length < 3) {
            suggestions.push(`Combine all ${imageCount} images into a cohesive artistic composition with enhanced lighting and professional editing`)
          }
          
          console.log("Generated suggestions with fallback model:", suggestions)
        } catch (fallbackError) {
          console.error("Fallback model also failed:", fallbackError)
          
          // Fallback suggestions using Flux Kontext best practices
          if (imageCount === 2) {
            suggestions = [
              `Place the main subject from the first image next to the subject from the second image in a natural setting with matching lighting`,
              `Combine the person from the first image with the background environment from the second image, maintaining realistic perspective`,
              `Merge the foreground elements from the first image into the scene from the second image with professional composition`
            ]
          } else if (imageCount >= 3) {
            suggestions = [
              `Place the person from the first image and the subject from the second image together in the background setting from the third image`,
              `Combine the main subject from the first image with the object from the second image and the environment from the third image`,
              `Merge the foreground elements from the first image with the middle subjects from the second image in the background from the third image`
            ]
          } else {
            suggestions = [
              `Combine the main subjects from all ${imageCount} images into a cohesive scene with professional lighting and composition`,
              `Place elements from each image together in a realistic environment with matching perspective and scale`,
              `Merge subjects from the first few images with the background setting from the later images`
            ]
          }
          console.log("Using fallback suggestions")
        }
      } else {
        // Direct fallback if already on fallback model
        if (imageCount === 2) {
          suggestions = [
            `Place the main subject from the first image next to the subject from the second image in a natural setting with matching lighting`,
            `Combine the person from the first image with the background environment from the second image, maintaining realistic perspective`,
            `Merge the foreground elements from the first image into the scene from the second image with professional composition`
          ]
        } else if (imageCount >= 3) {
          suggestions = [
            `Place the person from the first image and the subject from the second image together in the background setting from the third image`,
            `Combine the main subject from the first image with the object from the second image and the environment from the third image`,
            `Merge the foreground elements from the first image with the middle subjects from the second image in the background from the third image`
          ]
        } else {
          suggestions = [
            `Combine the main subjects from all ${imageCount} images into a cohesive scene with professional lighting and composition`,
            `Place elements from each image together in a realistic environment with matching perspective and scale`,
            `Merge subjects from the first few images with the background setting from the later images`
          ]
        }
        console.log("Using fallback suggestions")
      }
    }

    return NextResponse.json({
      suggestions,
      imageCount,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error generating prompt suggestions - Full error:", error)
    
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
      
      return NextResponse.json(
        { error: `Failed to generate suggestions: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to generate prompt suggestions" },
      { status: 500 }
    )
  }
}