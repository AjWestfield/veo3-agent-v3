import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes timeout (for initial request submission)

interface DeepResearchRequest {
  query: string
  reasoning_effort?: 'low' | 'medium' | 'high'
  stream?: boolean
}

interface AsyncRequestResponse {
  id: string
  model: string
  created_at: number
  started_at: number | null
  completed_at: number | null
  response: any | null
  failed_at: number | null
  error_message: string | null
  status: 'CREATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
}

// Submit a new deep research request
export async function POST(request: NextRequest) {
  console.log("=== PERPLEXITY DEEP RESEARCH REQUEST ===")
  console.log("Time:", new Date().toISOString())
  
  try {
    // Check API key configuration
    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) {
      console.error("PERPLEXITY_API_KEY is not configured")
      return NextResponse.json({ error: "Deep research service not configured" }, { status: 500 })
    }
    
    const body: DeepResearchRequest = await request.json()
    const { 
      query, 
      reasoning_effort = 'medium',
      stream = true
    } = body
    
    console.log("Deep research request:", { query, reasoning_effort })
    
    if (!query) {
      return NextResponse.json({ error: "No research query provided" }, { status: 400 })
    }
    
    // Check if streaming is requested (for streaming status updates)
    const acceptHeader = request.headers.get("accept")
    const wantsStream = stream || acceptHeader?.includes("text/event-stream")
    
    // Prepare the messages for Perplexity API
    const messages = [
      {
        role: "user",
        content: query
      }
    ]
    
    // Submit async request to Perplexity
    const submitResponse = await fetch("https://api.perplexity.ai/async/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        request: {
          model: "sonar-deep-research",
          messages,
          reasoning_effort,
          stream: false // The async endpoint doesn't support streaming
        }
      })
    })
    
    if (!submitResponse.ok) {
      const errorData = await submitResponse.json().catch(() => ({ error: "Unknown error" }))
      console.error("Perplexity API submission error:", submitResponse.status, errorData)
      throw new Error(errorData.error || `Perplexity API error: ${submitResponse.status}`)
    }
    
    const submitData: AsyncRequestResponse = await submitResponse.json()
    console.log("Deep research request submitted:", submitData.id)
    
    if (wantsStream) {
      // Return a streaming response that polls for results
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder()
          
          // Helper function to send SSE event
          const sendEvent = (data: any) => {
            const event = `data: ${JSON.stringify(data)}\n\n`
            controller.enqueue(encoder.encode(event))
          }
          
          try {
            // Send initial submission confirmation
            sendEvent({
              type: 'deepResearchStatus',
              status: 'submitted',
              requestId: submitData.id,
              message: 'Deep research request submitted. This may take several minutes...'
            })
            
            // Poll for results
            let completed = false
            let pollCount = 0
            const maxPolls = 180 // 30 minutes max (10 second intervals)
            const pollInterval = 10000 // 10 seconds
            
            while (!completed && pollCount < maxPolls) {
              await new Promise(resolve => setTimeout(resolve, pollInterval))
              pollCount++
              
              try {
                // Check status
                const statusResponse = await fetch(
                  `https://api.perplexity.ai/async/chat/completions/${submitData.id}`,
                  {
                    headers: {
                      "Authorization": `Bearer ${apiKey}`,
                      "Accept": "application/json"
                    }
                  }
                )
                
                if (!statusResponse.ok) {
                  console.error("Error checking status:", statusResponse.status)
                  continue // Keep trying
                }
                
                const statusData: AsyncRequestResponse = await statusResponse.json()
                
                // Send status update
                sendEvent({
                  type: 'deepResearchStatus',
                  status: statusData.status.toLowerCase(),
                  requestId: submitData.id,
                  message: getStatusMessage(statusData.status, pollCount * pollInterval / 1000),
                  elapsed: pollCount * pollInterval / 1000
                })
                
                if (statusData.status === 'COMPLETED') {
                  completed = true
                  
                  // Extract the response content
                  const response = statusData.response
                  const content = response?.choices?.[0]?.message?.content || ""
                  const citations = response?.citations || []
                  const usage = response?.usage || {}
                  
                  // Send the research data
                  sendEvent({
                    type: 'deepResearchData',
                    citations,
                    usage,
                    searchCount: usage.num_search_queries || 0
                  })
                  
                  // Stream the content
                  const chunks = content.split(" ")
                  for (const chunk of chunks) {
                    sendEvent({
                      type: 'content',
                      text: chunk + " "
                    })
                  }
                  
                  // Send completion signal
                  sendEvent({
                    type: 'deepResearchComplete',
                    message: 'Deep research completed successfully',
                    totalTime: pollCount * pollInterval / 1000
                  })
                  
                } else if (statusData.status === 'FAILED') {
                  completed = true
                  sendEvent({
                    type: 'error',
                    error: statusData.error_message || 'Deep research failed',
                    requestId: submitData.id
                  })
                }
              } catch (pollError) {
                console.error("Error polling for results:", pollError)
                // Continue polling
              }
            }
            
            if (!completed) {
              sendEvent({
                type: 'error',
                error: 'Deep research timeout - request took longer than 30 minutes',
                requestId: submitData.id
              })
            }
            
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            console.error("Streaming error:", error)
            const errorMessage = error instanceof Error ? error.message : "Failed to process deep research"
            sendEvent({ type: 'error', error: errorMessage })
            controller.close()
          }
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
      // Return the request ID for manual polling
      return NextResponse.json({
        requestId: submitData.id,
        status: submitData.status,
        message: 'Deep research request submitted. Use the requestId to check status.'
      })
    }
    
  } catch (error) {
    console.error("Deep research error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to perform deep research"
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// Check status of an existing deep research request
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const requestId = searchParams.get('requestId')
  
  if (!requestId) {
    return NextResponse.json({ error: "No requestId provided" }, { status: 400 })
  }
  
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Deep research service not configured" }, { status: 500 })
    }
    
    const response = await fetch(
      `https://api.perplexity.ai/async/chat/completions/${requestId}`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        }
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || `Perplexity API error: ${response.status}`)
    }
    
    const data: AsyncRequestResponse = await response.json()
    
    // Format the response based on status
    if (data.status === 'COMPLETED' && data.response) {
      const content = data.response.choices?.[0]?.message?.content || ""
      const citations = data.response.citations || []
      const usage = data.response.usage || {}
      
      return NextResponse.json({
        status: 'completed',
        response: content,
        citations,
        usage,
        searchCount: usage.num_search_queries || 0
      })
    } else {
      return NextResponse.json({
        status: data.status.toLowerCase(),
        message: getStatusMessage(data.status, 0)
      })
    }
    
  } catch (error) {
    console.error("Status check error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to check research status"
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

function getStatusMessage(status: string, elapsedSeconds: number): string {
  const minutes = Math.floor(elapsedSeconds / 60)
  const timeStr = minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : `${elapsedSeconds} seconds`
  
  switch (status) {
    case 'CREATED':
      return 'Research request created, waiting to start...'
    case 'PROCESSING':
      return `Conducting deep research... (${timeStr} elapsed)`
    case 'COMPLETED':
      return 'Deep research completed successfully'
    case 'FAILED':
      return 'Deep research failed'
    default:
      return `Research status: ${status}`
  }
}