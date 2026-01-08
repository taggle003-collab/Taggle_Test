type DodoPaymentsEnvironment = "live_mode" | "test_mode" | "live" | "test";

function getDodoApiKey(): string {
  const key =
    process.env.DODO_PAYMENTS_API_KEY ??
    process.env.DODO_API_KEY ??
    process.env.NEXT_PUBLIC_DODO_API_KEY;

  if (!key) {
    throw new Error(
      "Dodo API key is not set. Configure DODO_PAYMENTS_API_KEY (recommended)."
    );
  }

  return key;
}

function getDodoBaseUrl(): string {
  const baseUrl = process.env.DODO_PAYMENTS_BASE_URL;
  if (baseUrl) return baseUrl.replace(/\/+$/, "");

  const env = (process.env.DODO_PAYMENTS_ENVIRONMENT ??
    (process.env.NODE_ENV === "production" ? "live_mode" : "test_mode")) as DodoPaymentsEnvironment;

  switch (env) {
    case "test":
    case "test_mode":
      return "https://test.dodopayments.com";
    case "live":
    case "live_mode":
    default:
      return "https://live.dodopayments.com";
  }
}

function getAppUrl(): string {
  // NEXT_PUBLIC_APP_URL works on the server too, but Vercel URL is a good fallback.
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}

interface DodoCheckoutSession {
  sessionId: string;
  checkoutUrl: string;
}

export interface CreateDodoCheckoutSessionParams {
  productId: string;
  userEmail: string;
  userId: string;
  metadata?: Record<string, unknown>;
  returnUrl?: string;
}

export async function createDodoCheckoutSession(
  params: CreateDodoCheckoutSessionParams
): Promise<DodoCheckoutSession> {
  const { productId, userEmail, userId, metadata, returnUrl } = params;

  const bearerToken = getDodoApiKey();
  const baseUrl = getDodoBaseUrl();

  const appUrl = getAppUrl();

  const safeMetadata: Record<string, string> = { userId };

  for (const [key, value] of Object.entries(metadata ?? {})) {
    if (value === undefined || value === null) continue;
    safeMetadata[key] =
      typeof value === "string"
        ? value
        : typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value);
  }

  const payload = {
    product_cart: [{ product_id: productId, quantity: 1 }],
    return_url: returnUrl ?? `${appUrl}/dashboard?payment=return`,
    customer: {
      email: userEmail,
    },
    metadata: safeMetadata,
  };

  const url = `${baseUrl}/checkouts`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  const responseJson = (() => {
    try {
      return JSON.parse(responseText);
    } catch {
      return null;
    }
  })();

  if (!response.ok) {
    console.error("Dodo API error", {
      url,
      status: response.status,
      statusText: response.statusText,
      request: {
        ...payload,
        customer: payload.customer ? { ...payload.customer, email: "REDACTED" } : null,
      },
      response: responseJson ?? responseText,
    });

    const message =
      (typeof responseJson === "object" && responseJson &&
      ("message" in responseJson || "error" in responseJson)
        ? ((responseJson as any).message ?? (responseJson as any).error)
        : null) ?? `Dodo API error: ${response.status} ${response.statusText}`;

    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).details = responseJson ?? responseText;
    throw error;
  }

  if (!responseJson || !responseJson.session_id || !responseJson.checkout_url) {
    console.error("Unexpected Dodo response", { url, response: responseJson ?? responseText });
    throw new Error("Invalid Dodo response: missing session_id or checkout_url");
  }

  return {
    sessionId: responseJson.session_id,
    checkoutUrl: responseJson.checkout_url,
  };
}

export async function getDodoOrder(orderId: string) {
  const bearerToken = getDodoApiKey();
  const baseUrl = getDodoBaseUrl();

  const response = await fetch(`${baseUrl}/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Dodo API error: ${response.status} ${response.statusText} ${text}`);
  }

  return await response.json();
}
