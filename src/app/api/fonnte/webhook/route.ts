import { NextResponse } from "next/server";

/**
 * Fonnte Webhook Endpoint
 * 
 * Fonnte sends a POST request to this URL when:
 * 1. An incoming message is received (if configured in Fonnte dashboard)
 * 2. The "Test Webhook" or "Connect" button is clicked in Fonnte dashboard
 * 
 * This endpoint satisfies Fonnte's requirement for a valid JSON response.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let data = {};

    if (contentType.includes("application/json")) {
      data = await request.json().catch(() => ({}));
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData().catch(() => new FormData());
      data = Object.fromEntries(formData.entries());
    }
    
    console.log("Fonnte Webhook received:", data);

    return NextResponse.json({
      status: true,
      message: "Webhook received successfully"
    });
  } catch (error) {
    console.error("Fonnte Webhook error:", error);
    
    // Always return a JSON response even on error to avoid parsing issues in Fonnte dashboard
    return NextResponse.json({
      status: false,
      message: "Error processing webhook"
    }, { status: 500 });
  }
}

/**
 * Handle GET requests (e.g. if someone visits the URL in a browser)
 */
export async function GET() {
  return NextResponse.json({
    status: true,
    message: "Fonnte Webhook endpoint is active. Use POST to send data."
  });
}
