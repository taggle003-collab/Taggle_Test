import { createDodoCheckoutSession } from "@/lib/dodo-payment";
import { NextRequest, NextResponse } from "next/server";

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

    // TODO: Store pending plan purchase in database
    // This will be used to update user's plan when payment succeeds

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