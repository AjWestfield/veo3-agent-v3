import { NextRequest, NextResponse } from "next/server";
import { replicate } from "@/lib/replicate";

export async function GET(
  request: NextRequest,
  { params }: { params: { predictionId: string } }
) {
  try {
    const { predictionId } = params;

    if (!predictionId) {
      return NextResponse.json(
        { error: "Prediction ID is required" },
        { status: 400 }
      );
    }

    console.log(`Checking status for prediction: ${predictionId}`);

    // Get prediction status
    const prediction = await replicate.predictions.get(predictionId);

    console.log(`Prediction ${predictionId} status:`, prediction.status);

    // Format response based on status
    if (prediction.status === "succeeded") {
      return NextResponse.json({
        status: "completed",
        videoUrl: prediction.output,
        predictionId: prediction.id,
        completedAt: prediction.completed_at,
        metrics: prediction.metrics,
      });
    } else if (prediction.status === "failed") {
      return NextResponse.json({
        status: "failed",
        error: prediction.error || "Video generation failed",
        predictionId: prediction.id,
        logs: prediction.logs,
      });
    } else if (prediction.status === "canceled") {
      return NextResponse.json({
        status: "canceled",
        predictionId: prediction.id,
        message: "Video generation was canceled",
      });
    } else {
      // Still processing
      return NextResponse.json({
        status: prediction.status,
        predictionId: prediction.id,
        progress: extractProgress(prediction.logs),
        message: getStatusMessage(prediction.status),
      });
    }

  } catch (error: any) {
    console.error("Error checking prediction status:", error);
    
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: "Prediction not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to check prediction status",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

function extractProgress(logs: string | null): number | null {
  if (!logs) return null;
  
  // Try to extract progress percentage from logs
  const progressMatch = logs.match(/(\d+)%/);
  if (progressMatch) {
    return parseInt(progressMatch[1]);
  }
  
  return null;
}

function getStatusMessage(status: string): string {
  switch (status) {
    case "starting":
      return "Initializing video generation...";
    case "processing":
      return "Generating your video...";
    default:
      return "Processing...";
  }
}