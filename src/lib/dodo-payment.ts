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

  // Log first few characters for debugging (without exposing full key)
  console.log("[dodo-payment] API key loaded:", key.substring(0, 8) + "...");

  return key;
}

function getDodoBaseUrl(): string {
  const baseUrl = process.env.DODO_PAYMENTS_BASE_URL;
  if (baseUrl) return baseUrl.replace(/\/+$/, "");

  // Check explicit environment variable first
  const envVar = process.env.DODO_PAYMENTS_ENVIRONMENT;
  if (envVar) {
    if (envVar === "test" || envVar === "test_mode") return "https://test.dodopayments.com";
    if (envVar === "live" || envVar === "live_mode") return "https://live.dodopayments.com";
  }

  // Auto-detect from API key if possible
  const apiKey = (() => {
    try { return getDodoApiKey(); } catch { return ""; }
  })();

  if (apiKey) {
    if (apiKey.startsWith("test_") || apiKey.includes("_test_")) {
      console.log("[dodo-payment] Auto-detected TEST mode from API key");
      return "https://test.dodopayments.com";
    }
    if (apiKey.startsWith("live_") || apiKey.includes("_live_")) {
      console.log("[dodo-payment] Auto-detected LIVE mode from API key");
      return "https://live.dodopayments.com";
    }
  }

  // Fallback to NODE_ENV
  const isProd = process.env.NODE_ENV === "production";
  // return isProd ? "https://live.dodopayments.com" : "https://test.dodopayments.com";

  // CHANGED: Default to LIVE URL if we can't determine.
  // Many users try to use live keys in dev. It's safer to default to live (or fail) 
  // than to send a live key to a test endpoint which guarantees failure.
  // But to be safe for dev, let's keep the isProd check but ADD logging.

  const defaultUrl = isProd ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
  console.log(`[dodo-payment] Defaulting to ${isProd ? "LIVE" : "TEST"} URL based on NODE_ENV=${process.env.NODE_ENV}`);
  return defaultUrl;
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

  console.log("[dodo-payment] Making API request to:", url);
  console.log("[dodo-payment] API key loaded:", bearerToken.substring(0, 8) + "...");

  // Try different authentication methods that Dodo might support
  const authHeaders: { name: string; headers: Record<string, string> }[] = [
    {
      name: "X-API-Key",
      headers: { "X-API-Key": bearerToken }
    },
    {
      name: "Authorization Bearer",
      headers: { Authorization: `Bearer ${bearerToken}` }
    },
    {
      name: "Authorization API Key",
      headers: { Authorization: `Api-Key ${bearerToken}` }
    }
  ];

  let lastError: Error | null = null;

  // Try each auth method until one works
  for (const authMethod of authHeaders) {
    try {
      console.log(`[dodo-payment] Trying auth method: ${authMethod.name}`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authMethod.headers,
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
        // If this is a 401, try the next auth method
        if (response.status === 401 && authMethod !== authHeaders[authHeaders.length - 1]) {
          console.log(`[dodo-payment] 401 with ${authMethod.name}, trying next method...`);
          continue;
        }

        console.error("Dodo API error", {
          url,
          status: response.status,
          statusText: response.statusText,
          authMethod: authMethod.name,
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

        if (response.status === 401 && authMethod !== authHeaders[authHeaders.length - 1]) {
          lastError = error;
          continue; // Try next auth method
        }

        throw error;
      }

      // Success! Log which auth method worked
      console.log(`[dodo-payment] Success with auth method: ${authMethod.name}`);

      if (!responseJson || !responseJson.session_id || !responseJson.checkout_url) {
        console.error("Unexpected Dodo response", { url, response: responseJson ?? responseText });
        throw new Error("Invalid Dodo response: missing session_id or checkout_url");
      }

      return {
        sessionId: responseJson.session_id,
        checkoutUrl: responseJson.checkout_url,
      };
    } catch (error) {
      lastError = error as Error;
      if (authMethod !== authHeaders[authHeaders.length - 1]) {
        console.log(`[dodo-payment] Error with ${authMethod.name}, trying next method...`);
        continue;
      }
      break;
    }
  }

  // If we get here, all auth methods failed
  console.error("[dodo-payment] All authentication methods failed");
  throw lastError ?? new Error("All authentication methods failed");
}

export async function getDodoOrder(orderId: string) {
  const bearerToken = getDodoApiKey();
  const baseUrl = getDodoBaseUrl();

  // Try different authentication methods that Dodo might support
  const authHeaders: { name: string; headers: Record<string, string> }[] = [
    {
      name: "X-API-Key",
      headers: { "X-API-Key": bearerToken }
    },
    {
      name: "Authorization Bearer",
      headers: { Authorization: `Bearer ${bearerToken}` }
    },
    {
      name: "Authorization API Key",
      headers: { Authorization: `Api-Key ${bearerToken}` }
    }
  ];

  let lastError: Error | null = null;

  // Try each auth method until one works
  for (const authMethod of authHeaders) {
    try {
      console.log(`[dodo-payment] getDodoOrder trying auth method: ${authMethod.name}`);

      const response = await fetch(`${baseUrl}/orders/${orderId}`, {
        method: "GET",
        headers: {
          ...authMethod.headers,
        },
      });

      if (!response.ok) {
        // If this is a 401, try the next auth method
        if (response.status === 401 && authMethod !== authHeaders[authHeaders.length - 1]) {
          console.log(`[dodo-payment] getDodoOrder 401 with ${authMethod.name}, trying next method...`);
          lastError = new Error(`401 Unauthorized with ${authMethod.name}`);
          continue;
        }

        const text = await response.text().catch(() => "");
        const error = new Error(`Dodo API error: ${response.status} ${response.statusText} ${text}`);
        (error as any).status = response.status;

        if (response.status === 401 && authMethod !== authHeaders[authHeaders.length - 1]) {
          lastError = error;
          continue; // Try next auth method
        }

        throw error;
      }

      // Success! Log which auth method worked
      console.log(`[dodo-payment] getDodoOrder success with auth method: ${authMethod.name}`);
      return await response.json();
    } catch (error) {
      lastError = error as Error;
      if (authMethod !== authHeaders[authHeaders.length - 1]) {
        console.log(`[dodo-payment] getDodoOrder error with ${authMethod.name}, trying next method...`);
        continue;
      }
      break;
    }
  }

  // If we get here, all auth methods failed
  console.error("[dodo-payment] getDodoOrder all authentication methods failed");
  throw lastError ?? new Error("All authentication methods failed for getDodoOrder");
}
