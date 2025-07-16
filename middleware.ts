import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware to handle large file uploads
export function middleware(request: NextRequest) {
  // Apply to API routes that handle file uploads
  if (request.nextUrl.pathname.startsWith('/api/chat')) {
    // Clone the request to modify headers
    const requestHeaders = new Headers(request.headers)
    
    // Set a custom header that our API route can check
    requestHeaders.set('x-large-upload', 'true')
    
    // Return the request with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  return NextResponse.next()
}

// Configure which routes the middleware runs on
export const config = {
  matcher: '/api/:path*',
}