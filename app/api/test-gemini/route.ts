import { GoogleGenAI } from "@google/genai"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }
    
    // Test API key validity
    const ai = new GoogleGenAI({ apiKey })
    let modelName = "gemini-2.0-flash"
    
    // Simple test prompt
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: "Say 'API is working' in 5 words or less"
      })
      const text = response.text
      
      return NextResponse.json({ 
        status: "success",
        apiKeyPresent: true,
        apiKeyLength: apiKey.length,
        testResponse: text,
        model: modelName
      })
    } catch (modelError: any) {
      // Try fallback model if primary fails
      if (modelName === "gemini-2.0-flash") {
        modelName = "gemini-1.5-flash"
        const response = await ai.models.generateContent({
          model: modelName,
          contents: "Say 'API is working' in 5 words or less"
        })
        const text = response.text
        
        return NextResponse.json({ 
          status: "success",
          apiKeyPresent: true,
          apiKeyLength: apiKey.length,
          testResponse: text,
          model: modelName
        })
      }
      throw modelError
    }
    
  } catch (error) {
    console.error("Test API Error:", error)
    return NextResponse.json({ 
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      apiKeyPresent: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY?.length || 0
    }, { status: 500 })
  }
}