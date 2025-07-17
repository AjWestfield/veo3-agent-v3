import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: "API is working",
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  // Check if streaming is requested
  const acceptHeader = request.headers.get("accept")
  const wantsStream = acceptHeader?.includes("text/event-stream")
  
  if (wantsStream) {
    // Return a simple streaming response
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        
        // Send a few test chunks
        for (let i = 1; i <= 5; i++) {
          const event = `data: ${JSON.stringify({ type: 'content', text: `Test chunk ${i} ` })}\n\n`
          controller.enqueue(encoder.encode(event))
        }
        
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
    return NextResponse.json({ 
      message: "Non-streaming response",
      timestamp: new Date().toISOString()
    })
  }
}
