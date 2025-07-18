import { NextRequest } from "next/server";
import { generateVideo, replicate } from "@/lib/replicate";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model, duration, quality, aspectRatio, startImage, negativePrompt, seed, enhancePrompt } = body;

    // Validate required fields
    if (!prompt || !model) {
      return new Response(
        JSON.stringify({ error: "Prompt and model are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate prompt length
    if (prompt.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Prompt is too long. Maximum 5000 characters allowed." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Basic prompt sanitization
    const cleanPrompt = prompt.trim();
    if (cleanPrompt.length < 3) {
      return new Response(
        JSON.stringify({ error: "Prompt is too short. Please provide a more descriptive prompt." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Auto-select appropriate model based on input
    console.log(`Input validation - model: ${model}, startImage: ${startImage}, startImage type: ${typeof startImage}`);
    
    let selectedModel = model;
    if ((!startImage || startImage === null || startImage === undefined || startImage === "") && model === "kling-2.1") {
      // Kling 2.1 requires a start image, but none provided - switch to VEO 3 Fast
      selectedModel = "veo-3-fast";
      console.log(`🔄 Switching from Kling 2.1 to VEO 3 Fast for text-to-video generation`);
    } else if (model === "kling-2.1" && startImage) {
      console.log(`✅ Using Kling 2.1 for image-to-video with start image: ${startImage.substring(0, 50)}...`);
    }

    // Generate unique ID for this video generation
    const videoId = uuidv4();
    
    console.log(`Starting streaming video generation ${videoId} with model: ${selectedModel}`);

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // Send initial progress message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: "progress",
          message: "🎬 Starting video generation...",
          progress: 0
        })}\n\n`));

        try {
          // Start video generation
          const prediction = await generateVideo({
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

          console.log(`Video generation started for ${videoId}, prediction ID: ${prediction.id}`);

          // Send progress update
          const modelName = selectedModel === 'veo-3-fast' ? 'VEO 3 Fast' : 'Kling 2.1';
          let progressMessage = `📹 Processing video with ${modelName}...`;
          
          // Add note about model switch if it happened
          if (selectedModel !== model) {
            progressMessage = `📹 Using ${modelName} for text-to-video generation...`;
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "progress",
            message: progressMessage,
            progress: 10
          })}\n\n`));

          // Poll for prediction status
          let finalPrediction;
          let pollCount = 0;
          const maxPolls = 120; // 2 minutes max at 1 second intervals
          
          while (pollCount < maxPolls) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            try {
              const currentPrediction = await replicate.predictions.get(prediction.id);
              
              // Calculate progress (rough estimate)
              const progress = Math.min(10 + (pollCount / maxPolls) * 80, 90);
              
              if (currentPrediction.status === "succeeded") {
                finalPrediction = currentPrediction;
                
                // Send completion progress
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: "progress",
                  message: "✨ Video generation complete!",
                  progress: 100
                })}\n\n`));
                
                break;
              } else if (currentPrediction.status === "failed") {
                throw new Error(currentPrediction.error || "Video generation failed");
              } else if (currentPrediction.status === "canceled") {
                throw new Error("Video generation was canceled");
              } else {
                // Send progress update
                const statusMessage = currentPrediction.status === "starting" 
                  ? "🚀 Initializing video generation..." 
                  : "🎨 Generating your video...";
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: "progress",
                  message: statusMessage,
                  progress
                })}\n\n`));
              }
              
              pollCount++;
            } catch (pollError) {
              console.error(`Error polling prediction ${prediction.id}:`, pollError);
              // Continue polling on transient errors
              pollCount++;
            }
          }

          if (!finalPrediction) {
            throw new Error("Video generation timed out");
          }

          // Send the final video data
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "video",
            videoUrl: finalPrediction.output,
            videoDetails: {
              id: videoId,
              model: selectedModel,
              prompt: cleanPrompt,
              duration: selectedModel === "kling-2.1" ? duration : 8,
              quality: selectedModel === "kling-2.1" ? quality : "standard",
              aspectRatio: selectedModel === "veo-3-fast" ? "16:9" : aspectRatio,
              predictionId: prediction.id,
              createdAt: new Date().toISOString(),
              originalModel: model !== selectedModel ? model : undefined // Track if model was switched
            }
          })}\n\n`));

          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "done"
          })}\n\n`));

        } catch (error: any) {
          console.error(`Error in streaming video generation for ${videoId}:`, error);
          
          // Send error message
          let errorMessage = "❌ Video generation failed: ";
          
          if (error.message?.includes("quota exceeded")) {
            errorMessage += "API quota exceeded. Please check your billing.";
          } else if (error.message?.includes("Invalid Replicate API token")) {
            errorMessage += "Authentication failed. Please check your API token.";
          } else if (error.message?.includes("temporarily unavailable")) {
            errorMessage += "Service temporarily unavailable. Please try again.";
          } else {
            errorMessage += error.message || "Unknown error occurred";
          }
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "error",
            message: errorMessage
          })}\n\n`));
        }
        
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Error in streaming video generation API:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}