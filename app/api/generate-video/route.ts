import { NextRequest, NextResponse } from "next/server";
import { generateVideo, waitForPrediction } from "@/lib/replicate";
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

    // Validate prompt length (increased limit for complex video prompts)
    if (prompt.length > 5000) {
      return NextResponse.json(
        { error: "Prompt is too long. Maximum 5000 characters allowed." },
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

    // Validate model
    if (!["kling-2.1", "veo-3-fast"].includes(model)) {
      return NextResponse.json(
        { error: "Invalid model. Must be 'kling-2.1' or 'veo-3-fast'" },
        { status: 400 }
      );
    }

    // Validate Kling 2.1 specific requirements
    if (model === "kling-2.1" && !startImage) {
      return NextResponse.json(
        { error: "Kling 2.1 requires a start image" },
        { status: 400 }
      );
    }

    // Validate duration for Kling 2.1
    if (model === "kling-2.1" && duration && ![5, 10].includes(duration)) {
      return NextResponse.json(
        { error: "Duration must be 5 or 10 seconds for Kling 2.1" },
        { status: 400 }
      );
    }

    // Validate quality for Kling 2.1
    if (model === "kling-2.1" && quality && !["standard", "pro"].includes(quality)) {
      return NextResponse.json(
        { error: "Quality must be 'standard' or 'pro' for Kling 2.1" },
        { status: 400 }
      );
    }

    // Auto-select appropriate model based on input
    let selectedModel = model;
    if (!startImage && model === "kling-2.1") {
      // Kling 2.1 requires a start image, but none provided - switch to VEO 3 Fast
      selectedModel = "veo-3-fast";
      console.log(`Switching from Kling 2.1 to VEO 3 Fast for text-to-video generation`);
    }

    // Generate unique ID for this video generation
    const videoId = uuidv4();
    
    // Clean terminal output for image animation
    if (selectedModel === "kling-2.1" && startImage) {
      console.log("Animating image with Kling 2.1");
    } else {
      console.log(`Starting video generation ${videoId} with model: ${selectedModel}`);
    }

    // Start video generation with enhanced error handling
    let prediction;
    try {
      prediction = await generateVideo({
        prompt: cleanPrompt,
        model: selectedModel,
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
      } else if (error.message?.includes("not found")) {
        return NextResponse.json(
          { 
            error: "Model not found",
            details: `The model ${model} is not available on Replicate.`,
            code: "MODEL_NOT_FOUND"
          },
          { status: 404 }
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

    // For now, we'll wait for the prediction to complete
    // In a production setup, you'd want to use webhooks for long-running tasks
    let finalPrediction;
    try {
      finalPrediction = await waitForPrediction(prediction.id);
    } catch (error) {
      console.error(`Error waiting for prediction ${prediction.id}:`, error);
      return NextResponse.json(
        { 
          error: "Video generation failed",
          details: error instanceof Error ? error.message : "Unknown error",
          predictionId: prediction.id
        },
        { status: 500 }
      );
    }

    if (finalPrediction.status === "failed") {
      return NextResponse.json(
        { 
          error: "Video generation failed",
          details: finalPrediction.error,
          predictionId: prediction.id
        },
        { status: 500 }
      );
    }

    if (finalPrediction.status !== "succeeded") {
      return NextResponse.json(
        { 
          error: "Video generation did not complete successfully",
          status: finalPrediction.status,
          predictionId: prediction.id
        },
        { status: 500 }
      );
    }

    // Return the generated video URL
    return NextResponse.json({
      id: videoId,
      videoUrl: finalPrediction.output,
      predictionId: prediction.id,
      model: selectedModel,
      prompt: cleanPrompt,
      duration: selectedModel === "kling-2.1" ? duration : 8,
      quality: selectedModel === "kling-2.1" ? quality : "standard",
      aspectRatio: selectedModel === "veo-3-fast" ? "16:9" : aspectRatio,
      status: "completed",
      createdAt: new Date().toISOString(),
      originalModel: model !== selectedModel ? model : undefined // Track if model was switched
    });

  } catch (error) {
    console.error("Error in video generation API:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: "Method not allowed",
      message: "Use POST to generate videos"
    },
    { status: 405 }
  );
}