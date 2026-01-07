import { createDodoCheckoutSession } from "@/lib/dodo-payment";
import { NextRequest, NextResponse } from "next/server";

// Store pending orders temporarily (in production, use a database)
const pendingOrders = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const { productId, userEmail, userId, planName } = await request.json();

    if (!productId || !userEmail || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const session = await createDodoCheckoutSession(productId, userEmail, userId);

    // Store pending order info (you should use a database for production)
    pendingOrders.set(session.sessionId, {
      userId,
      userEmail,
      productId,
      planName,
      createdAt: new Date(),
    });

    // Cleanup old pending orders (older than 24 hours)
    const now = Date.now();
    for (const [key, value] of pendingOrders.entries()) {
      if (now - value.createdAt.getTime() > 24 * 60 * 60 * 1000) {
        pendingOrders.delete(key);
      }
    }

    return NextResponse.json({
      sessionId: session.sessionId,
      checkoutUrl: session.checkoutUrl,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

// Export for testing
export { pendingOrders };