import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Test endpoint to verify enhance prompt configuration
  const apiKey = process.env.GEMINI_API_KEY
  
  return NextResponse.json({
    status: "OK",
    apiKeyConfigured: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + "..." : "Not configured",
    timestamp: new Date().toISOString()
  })
}