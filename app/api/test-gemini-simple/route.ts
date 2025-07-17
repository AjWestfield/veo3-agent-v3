import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 })
    }

    console.log("Testing Gemini API...")
    console.log("API Key:", apiKey.substring(0, 10) + "...")

    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Try different models
    const models = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"]
    const results: any[] = []

    for (const modelName of models) {
      try {
        console.log(`Testing model: ${modelName}`)
        const model = genAI.getGenerativeModel({ model: modelName })
        
        // Simple text-only test
        const result = await model.generateContent("Say 'Hello, I am working!'")
        const response = result.response
        const text = response.text()
        
        results.push({
          model: modelName,
          success: true,
          response: text,
          message: "Model is working"
        })
        console.log(`✓ ${modelName} works:`, text)
      } catch (error) {
        console.error(`✗ ${modelName} failed:`, error)
        results.push({
          model: modelName,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          errorDetails: {
            name: error?.name,
            stack: error?.stack,
            response: error?.response,
            status: error?.status
          }
        })
      }
    }

    // Test streaming
    console.log("\nTesting streaming...")
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
      const result = await model.generateContentStream("Count from 1 to 5")
      
      let streamedText = ""
      for await (const chunk of result.stream) {
        streamedText += chunk.text()
      }
      
      results.push({
        test: "streaming",
        success: true,
        response: streamedText,
        message: "Streaming is working"
      })
      console.log("✓ Streaming works:", streamedText)
    } catch (error) {
      console.error("✗ Streaming failed:", error)
      results.push({
        test: "streaming",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        errorDetails: {
          name: error?.name,
          stack: error?.stack
        }
      })
    }

    return NextResponse.json({
      apiKeyConfigured: true,
      timestamp: new Date().toISOString(),
      results
    })
  } catch (error) {
    console.error("Test failed:", error)
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}