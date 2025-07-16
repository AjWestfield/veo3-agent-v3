import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }
    
    // Test API key validity
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
    
    // Simple test prompt
    const result = await model.generateContent("Say 'API is working' in 5 words or less")
    const response = await result.response
    const text = response.text()
    
    return NextResponse.json({ 
      status: "success",
      apiKeyPresent: true,
      apiKeyLength: apiKey.length,
      testResponse: text,
      model: "gemini-2.0-flash-exp"
    })
    
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
