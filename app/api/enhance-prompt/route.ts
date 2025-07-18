import { GoogleGenAI } from "@google/genai"
import { NextRequest, NextResponse } from "next/server"

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" })

export async function POST(request: NextRequest) {
  console.log("=== ENHANCE PROMPT REQUEST ===")
  
  try {
    const { prompt, chatHistory = [] } = await request.json()
    console.log("Received prompt:", prompt)
    console.log("Chat history length:", chatHistory.length)
    
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
    console.log("API Key configured:", apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : "No")

    // Set model name - will try different models if one fails
    let modelName = "gemini-2.0-flash";

    // Create context from chat history (last 5 messages for relevance)
    const recentHistory = chatHistory.slice(-5)
    const chatContext = recentHistory.map((msg: any) => 
      `${msg.role}: ${msg.content}`
    ).join('\n')

    // Simplified prompt for better compatibility
    const systemPrompt = `Enhance this user prompt to be more detailed and specific. Keep it to 2-3 sentences max.

${chatContext ? `Recent conversation:\n${chatContext}\n\n` : ''}Original: ${prompt}

Enhanced version:`

    // Generate enhanced prompt
    console.log("Calling Gemini API...")
    console.log("System prompt:", systemPrompt)
    
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
        modelName = "gemini-1.5-flash"
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: systemPrompt
          })
          enhancedPrompt = response.text.trim()
          console.log("Enhanced prompt generated with fallback model:", enhancedPrompt)
        } catch (fallbackError) {
          console.error("Fallback model also failed:", fallbackError)
          // Fallback: simple enhancement without AI
          enhancedPrompt = prompt + " Please provide detailed information and specific examples."
          console.log("Using fallback enhancement")
        }
      } else {
        // Fallback: simple enhancement without AI
        enhancedPrompt = prompt + " Please provide detailed information and specific examples."
        console.log("Using fallback enhancement")
      }
    }

    return NextResponse.json({
      originalPrompt: prompt,
      enhancedPrompt,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error enhancing prompt - Full error:", error)
    
    // More detailed error response
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