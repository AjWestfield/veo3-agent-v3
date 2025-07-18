import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Redirect to the new enhanced endpoint
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // Forward the request to the new enhanced endpoint
  const response = await fetch(new URL('/api/download-social-video', request.url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  })
  
  const data = await response.json()
  
  return NextResponse.json(data, { status: response.status })
}