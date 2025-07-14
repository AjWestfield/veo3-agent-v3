import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Simulate a delay for processing to mimic a real download
    await new Promise((resolve) => setTimeout(resolve, 2500))

    // In a real app, these URLs would come from your blob storage after processing.
    // For this interactive demo, we use a sample video and a live thumbnail service.
    const videoUrl = url
    const thumbnailUrl = `https://image.thum.io/get/width/600/crop/800/noanimate/${url}`

    return NextResponse.json({ videoUrl, thumbnailUrl })
  } catch (error) {
    console.error("Failed to process video URL:", error)
    return NextResponse.json({ error: "Failed to process video URL" }, { status: 500 })
  }
}
