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
  if (!DODO_API_KEY) {
    throw new Error("NEXT_PUBLIC_DODO_API_KEY is not set");
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
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
          userId,
        },
        successUrl: `${appUrl}/dashboard?payment=success`,
        cancelUrl: `${appUrl}/#pricing?payment=cancelled`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Dodo API error response:", error);
      throw new Error(`Dodo API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.sessionId || !data.checkoutUrl) {
      throw new Error("Invalid Dodo response: missing sessionId or checkoutUrl");
    }

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