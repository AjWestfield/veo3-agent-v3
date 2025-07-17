import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

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
      const result = await model.generateContent(systemPrompt)
      const response = await result.response
      enhancedPrompt = response.text().trim()
      
      console.log("Enhanced prompt generated:", enhancedPrompt)
    } catch (apiError) {
      console.error("Gemini API call failed:", apiError)
      
      // Fallback: simple enhancement without AI
      enhancedPrompt = prompt + " Please provide detailed information and specific examples."
      console.log("Using fallback enhancement")
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