import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const maxDuration = 60 // 1 minute timeout

interface SearchRequest {
  query: string
  searchMode?: 'web' | 'academic' | 'youtube' | 'reddit'
  searchContextSize?: 'low' | 'medium' | 'high'
  return_images?: boolean
  return_related_questions?: boolean
  search_domain_filter?: string[]
  search_recency_filter?: string
  max_results?: number
}

export async function POST(request: NextRequest) {
  console.log("=== PERPLEXITY WEB SEARCH REQUEST ===")
  console.log("Time:", new Date().toISOString())
  
  try {
    // Check API key configuration
    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) {
      console.error("PERPLEXITY_API_KEY is not configured")
      return NextResponse.json({ error: "Search service not configured" }, { status: 500 })
    }
    
    const body: SearchRequest = await request.json()
    const { 
      query, 
      searchMode = 'web',
      searchContextSize = 'medium',
      return_images = false,
      return_related_questions = true,
      search_domain_filter,
      search_recency_filter,
      max_results = 10
    } = body
    
    console.log("Search request:", { query, searchMode, searchContextSize })
    
    if (!query) {
      return NextResponse.json({ error: "No search query provided" }, { status: 400 })
    }
    
    // Prepare the messages for Perplexity API
    const messages = [
      {
        role: "system",
        content: "Be precise and concise. Provide accurate, up-to-date information with sources."
      },
      {
        role: "user",
        content: query
      }
    ]
    
    // Prepare the request payload - simplified to match Perplexity API docs
    const perplexityPayload: any = {
      model: "sonar-pro", // Using sonar-pro for best results
      messages,
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 2000,
      stream: false
    }
    
    // Add optional parameters only if they're supported
    if (return_images) {
      perplexityPayload.return_images = return_images
    }
    
    if (return_related_questions) {
      perplexityPayload.return_related_questions = return_related_questions
    }
    
    // Add optional filters
    if (search_domain_filter && search_domain_filter.length > 0) {
      perplexityPayload.search_domain_filter = search_domain_filter
    }
    
    if (search_recency_filter) {
      perplexityPayload.search_recency_filter = search_recency_filter
    }
    
    console.log("Calling Perplexity API...")
    console.log("Payload:", JSON.stringify(perplexityPayload, null, 2))
    
    // Make the API request
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(perplexityPayload)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      console.error("Perplexity API error:", response.status, errorData)
      throw new Error(errorData.error || `Perplexity API error: ${response.status}`)
    }
    
    const data = await response.json()
    console.log("Perplexity API response received")
    console.log("Images received:", data.images?.length || 0, "images")
    if (data.images && data.images.length > 0) {
      console.log("First image:", data.images[0])
    }
    
    // Extract the response content
    const content = data.choices?.[0]?.message?.content || ""
    const citations = data.citations || []
    const searchResults = data.search_results || []
    const images = data.images || []
    const relatedQuestions = data.related_questions || []
    
    // Format the response
    let formattedResponse = content
    
    // Add citations if available
    if (citations.length > 0) {
      formattedResponse += "\n\n### Sources:\n"
      citations.forEach((citation: string, index: number) => {
        formattedResponse += `${index + 1}. ${citation}\n`
      })
    }
    
    // Add search results if available
    if (searchResults.length > 0 && searchResults.length !== citations.length) {
      formattedResponse += "\n\n### Search Results:\n"
      searchResults.forEach((result: any, index: number) => {
        const date = result.date ? ` (${result.date})` : ""
        formattedResponse += `${index + 1}. [${result.title}](${result.url})${date}\n`
      })
    }
    
    // Prepare the response object
    const responseObject: any = {
      response: formattedResponse,
      model: "perplexity-sonar-pro",
      citations,
      searchResults,
      usage: data.usage
    }
    
    // Add optional data if requested
    if (return_images && images.length > 0) {
      responseObject.images = images
      
      // Add images to the formatted response
      formattedResponse += "\n\n### Related Images:\n"
      images.forEach((image: any, index: number) => {
        formattedResponse += `![Image ${index + 1}](${image.url})\n`
      })
      responseObject.response = formattedResponse
    }
    
    if (return_related_questions && relatedQuestions.length > 0) {
      responseObject.relatedQuestions = relatedQuestions
      
      // Add related questions to the formatted response
      formattedResponse += "\n\n### Related Questions:\n"
      relatedQuestions.forEach((question: string, index: number) => {
        formattedResponse += `${index + 1}. ${question}\n`
      })
      responseObject.response = formattedResponse
    }
    
    return NextResponse.json(responseObject)
    
  } catch (error) {
    console.error("Search error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to perform search"
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}