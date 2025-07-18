import { NextRequest, NextResponse } from "next/server";
import { generateVideo } from "@/lib/replicate";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model, duration, quality, aspectRatio, startImage, negativePrompt, seed, enhancePrompt } = body;

    // Validate required fields
    if (!prompt || !model) {
      return NextResponse.json(
        { error: "Prompt and model are required" },
        { status: 400 }
      );
    }

    // Validate prompt length
    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt is too long. Maximum 2000 characters allowed." },
        { status: 400 }
      );
    }

    // Basic prompt sanitization
    const cleanPrompt = prompt.trim();
    if (cleanPrompt.length < 3) {
      return NextResponse.json(
        { error: "Prompt is too short. Please provide a more descriptive prompt." },
        { status: 400 }
      );
    }

    // Generate unique ID for this video generation
    const videoId = uuidv4();
    
    console.log(`Starting async video generation ${videoId} with model: ${model}`);

    // Start video generation without waiting
    let prediction;
    try {
      prediction = await generateVideo({
        prompt: cleanPrompt,
        model,
        duration,
        quality,
        aspectRatio,
        startImage,
        negativePrompt,
        seed,
        enhancePrompt,
      });
    } catch (error: any) {
      console.error(`Failed to start video generation for ${videoId}:`, error);
      
      // Return more specific error messages
      if (error.message?.includes("quota exceeded")) {
        return NextResponse.json(
          { 
            error: "API quota exceeded",
            details: "Your Replicate API quota has been exceeded. Please check your billing.",
            code: "QUOTA_EXCEEDED"
          },
          { status: 402 }
        );
      } else if (error.message?.includes("Invalid Replicate API token")) {
        return NextResponse.json(
          { 
            error: "Authentication failed",
            details: "The Replicate API token is invalid or missing.",
            code: "AUTH_FAILED"
          },
          { status: 401 }
        );
      } else if (error.message?.includes("temporarily unavailable")) {
        return NextResponse.json(
          { 
            error: "Service temporarily unavailable",
            details: "The Replicate service is experiencing issues. Please try again in a few moments.",
            code: "SERVICE_UNAVAILABLE"
          },
          { status: 503 }
        );
      }
      
      // Generic error fallback
      return NextResponse.json(
        { 
          error: "Failed to start video generation",
          details: error.message || "Unknown error occurred",
          code: "GENERATION_FAILED"
        },
        { status: 500 }
      );
    }

    console.log(`Video generation started for ${videoId}, prediction ID: ${prediction.id}`);

    // Return immediately with prediction details
    return NextResponse.json({
      id: videoId,
      predictionId: prediction.id,
      status: prediction.status,
      model,
      prompt: cleanPrompt,
      duration: model === "kling-2.1" ? duration : 8,
      quality: model === "kling-2.1" ? quality : "standard",
      aspectRatio: model === "veo-3-fast" ? "16:9" : aspectRatio,
      urls: prediction.urls,
      createdAt: new Date().toISOString(),
      message: "Video generation started. Use the status endpoint to check progress."
    });

  } catch (error) {
    console.error("Error in async video generation API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}