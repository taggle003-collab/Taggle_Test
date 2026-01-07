const DODO_API_KEY = process.env.NEXT_PUBLIC_DODO_API_KEY;

interface DodoCheckoutSession {
  sessionId: string;
  checkoutUrl: string;
}

export async function createDodoCheckoutSession(
  productId: string,
  userEmail: string,
  userId: string
): Promise<DodoCheckoutSession> {
  try {
    const response = await fetch("https://api.dodopayments.com/checkout/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DODO_API_KEY}`,
      },
      body: JSON.stringify({
        productId,
        customerEmail: userEmail,
        customData: {
          userId, // Store Clerk user ID for order tracking
        },
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?payment=success`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/#pricing?payment=cancelled`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Dodo API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      sessionId: data.sessionId,
      checkoutUrl: data.checkoutUrl,
    };
  } catch (error) {
    console.error("Error creating Dodo checkout session:", error);
    throw error;
  }
}

export async function getDodoOrder(orderId: string) {
  try {
    const response = await fetch(`https://api.dodopayments.com/orders/${orderId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${DODO_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Dodo API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching Dodo order:", error);
    throw error;
  }
}