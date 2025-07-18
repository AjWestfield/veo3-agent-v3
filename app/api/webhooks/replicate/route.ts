import { NextRequest, NextResponse } from "next/server";
import { validateWebhook } from "replicate";

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.REPLICATE_WEBHOOK_SIGNING_SECRET;

    if (!secret) {
      console.log("Skipping webhook validation. To validate webhooks, set REPLICATE_WEBHOOK_SIGNING_SECRET");
      const body = await request.json();
      console.log("Received webhook (unvalidated):", body);
      return NextResponse.json({ detail: "Webhook received (but not validated)" }, { status: 200 });
    }

    // Validate webhook signature
    const webhookIsValid = await validateWebhook(request.clone(), secret);

    if (!webhookIsValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ detail: "Webhook is invalid" }, { status: 401 });
    }

    // Process validated webhook
    const body = await request.json();
    console.log("Received valid webhook:", body);

    // Handle different webhook events
    const { id, status, output, error, logs } = body;

    switch (status) {
      case "starting":
        console.log(`Prediction ${id} is starting`);
        break;
      case "processing":
        console.log(`Prediction ${id} is processing`);
        break;
      case "succeeded":
        console.log(`Prediction ${id} succeeded with output:`, output);
        // Here you could store the result in a database, notify clients via WebSocket, etc.
        break;
      case "failed":
        console.error(`Prediction ${id} failed:`, error);
        // Here you could handle the failure, notify clients, etc.
        break;
      case "canceled":
        console.log(`Prediction ${id} was canceled`);
        break;
      default:
        console.log(`Prediction ${id} has unknown status: ${status}`);
    }

    return NextResponse.json({ detail: "Webhook processed successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error processing webhook:", error);
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
      message: "This endpoint only accepts POST requests for webhooks"
    },
    { status: 405 }
  );
}