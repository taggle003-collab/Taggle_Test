type DodoAuthMethod = "Authorization Bearer" | "X-API-Key" | "Authorization Api-Key";

function redactSecret(value: string): string {
  if (!value) return value;
  if (value.length <= 10) return "REDACTED";
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const next = { ...headers };
  if (next.Authorization) next.Authorization = "REDACTED";
  if (next["X-API-Key"]) next["X-API-Key"] = "REDACTED";
  return next;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

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

  console.log("[dodo-payment] API key loaded:", redactSecret(key));

  return key;
}

function getDodoBaseUrl(): string {
  const baseUrl = process.env.DODO_PAYMENTS_BASE_URL;
  if (baseUrl) {
    const cleaned = baseUrl.replace(/\/+$/, "");
    console.log("[dodo-payment] Using base URL from DODO_PAYMENTS_BASE_URL:", cleaned);
    return cleaned;
  }

  const envVar = process.env.DODO_PAYMENTS_ENVIRONMENT;
  if (envVar) {
    if (envVar === "test" || envVar === "test_mode") {
      console.log("[dodo-payment] Environment detected from DODO_PAYMENTS_ENVIRONMENT:", envVar);
      return "https://test.dodopayments.com";
    }
    if (envVar === "live" || envVar === "live_mode") {
      console.log("[dodo-payment] Environment detected from DODO_PAYMENTS_ENVIRONMENT:", envVar);
      return "https://live.dodopayments.com";
    }

    console.log("[dodo-payment] Unrecognized DODO_PAYMENTS_ENVIRONMENT:", envVar);
  }

  const apiKey = (() => {
    try {
      return getDodoApiKey();
    } catch {
      return "";
    }
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

  const isProd = process.env.NODE_ENV === "production";
  const defaultUrl = isProd
    ? "https://live.dodopayments.com"
    : "https://test.dodopayments.com";

  console.log(
    `[dodo-payment] Defaulting to ${isProd ? "LIVE" : "TEST"} URL based on NODE_ENV=${process.env.NODE_ENV}`
  );

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

  console.log("[dodo-payment] Checkout create base URL:", baseUrl);
  console.log("[dodo-payment] Checkout create endpoint:", url);
  console.log(
    "[dodo-payment] Environment vars:",
    JSON.stringify(
      {
        DODO_PAYMENTS_ENVIRONMENT: process.env.DODO_PAYMENTS_ENVIRONMENT ?? null,
        DODO_PAYMENTS_BASE_URL: process.env.DODO_PAYMENTS_BASE_URL ?? null,
        NODE_ENV: process.env.NODE_ENV ?? null,
      },
      null,
      2
    )
  );
  console.log("[dodo-payment] API key loaded:", redactSecret(bearerToken));

  const authHeaders: { name: DodoAuthMethod; headers: Record<string, string> }[] = [
    {
      name: "Authorization Bearer",
      headers: { Authorization: `Bearer ${bearerToken}` },
    },
    {
      name: "X-API-Key",
      headers: { "X-API-Key": bearerToken },
    },
    {
      name: "Authorization Api-Key",
      headers: { Authorization: `Api-Key ${bearerToken}` },
    },
  ];

  let lastError: Error | null = null;
  const attemptErrors: Array<{
    authMethod: DodoAuthMethod;
    status?: number;
    statusText?: string;
    responseBody?: unknown;
  }> = [];

  for (const authMethod of authHeaders) {
    try {
      console.log(`[dodo-payment] Trying auth method: ${authMethod.name}`);

      const requestHeaders = {
        "Content-Type": "application/json",
        ...authMethod.headers,
      };

      console.log("[dodo-payment] Request", {
        url,
        authMethod: authMethod.name,
        headers: redactHeaders(requestHeaders),
        body: {
          ...payload,
          customer: payload.customer ? { ...payload.customer, email: "REDACTED" } : null,
        },
      });

      const response = await fetch(url, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      const responseJson = safeJsonParse(responseText);

      console.log("[dodo-payment] Response", {
        url,
        authMethod: authMethod.name,
        status: response.status,
        statusText: response.statusText,
        body: responseJson ?? responseText,
      });

      if (!response.ok) {
        attemptErrors.push({
          authMethod: authMethod.name,
          status: response.status,
          statusText: response.statusText,
          responseBody: responseJson ?? responseText,
        });

        const responseObj =
          typeof responseJson === "object" && responseJson ? (responseJson as Record<string, unknown>) : null;

        const messageFromBody =
          (responseObj && ("message" in responseObj || "error" in responseObj)
            ? String((responseObj.message ?? responseObj.error) ?? "")
            : null) ?? null;

        const error = new Error(
          `[dodo-payment] ${authMethod.name} failed: ${response.status} ${response.statusText}${
            messageFromBody ? ` - ${String(messageFromBody)}` : ""
          }`
        ) as Error & {
          status?: number;
          details?: unknown;
          authMethod?: DodoAuthMethod;
        };

        error.status = response.status;
        error.details = responseJson ?? responseText;
        error.authMethod = authMethod.name;

        if (response.status === 401 && authMethod !== authHeaders[authHeaders.length - 1]) {
          console.log(
            `[dodo-payment] 401 Unauthorized with ${authMethod.name}, trying next auth method...`
          );
          lastError = error;
          continue;
        }

        throw error;
      }

      console.log(`[dodo-payment] Success with auth method: ${authMethod.name}`);

      const responseObj =
        typeof responseJson === "object" && responseJson
          ? (responseJson as Record<string, unknown>)
          : null;

      if (!responseObj || !responseObj.session_id || !responseObj.checkout_url) {
        console.error("[dodo-payment] Unexpected Dodo response", {
          url,
          authMethod: authMethod.name,
          response: responseJson ?? responseText,
        });
        throw new Error("Invalid Dodo response: missing session_id or checkout_url");
      }

      return {
        sessionId: String(responseObj.session_id),
        checkoutUrl: String(responseObj.checkout_url),
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

  console.error("[dodo-payment] All authentication methods failed", {
    url,
    baseUrl,
    apiKey: redactSecret(bearerToken),
    attemptErrors,
  });

  const aggregated = new Error(
    `[dodo-payment] All authentication methods failed. Attempts: ${attemptErrors
      .map((a) => `${a.authMethod}: ${a.status ?? "ERR"}`)
      .join(", ")}`
  ) as Error & { attemptErrors?: typeof attemptErrors; details?: unknown };

  aggregated.attemptErrors = attemptErrors;
  aggregated.details = (lastError as Error & { details?: unknown })?.details;

  throw lastError ?? aggregated;
}

export async function getDodoOrder(orderId: string) {
  const bearerToken = getDodoApiKey();
  const baseUrl = getDodoBaseUrl();

  console.log("[dodo-payment] getDodoOrder base URL:", baseUrl);
  console.log("[dodo-payment] getDodoOrder API key loaded:", redactSecret(bearerToken));

  const authHeaders: { name: DodoAuthMethod; headers: Record<string, string> }[] = [
    {
      name: "X-API-Key",
      headers: { "X-API-Key": bearerToken },
    },
    {
      name: "Authorization Bearer",
      headers: { Authorization: `Bearer ${bearerToken}` },
    },
    {
      name: "Authorization Api-Key",
      headers: { Authorization: `Api-Key ${bearerToken}` },
    },
  ];

  let lastError: Error | null = null;
  const attemptErrors: Array<{
    authMethod: DodoAuthMethod;
    status?: number;
    statusText?: string;
    responseBody?: unknown;
  }> = [];

  for (const authMethod of authHeaders) {
    try {
      const url = `${baseUrl}/orders/${orderId}`;
      console.log(`[dodo-payment] getDodoOrder trying auth method: ${authMethod.name}`);
      console.log("[dodo-payment] getDodoOrder request", {
        url,
        authMethod: authMethod.name,
        headers: redactHeaders(authMethod.headers),
      });

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...authMethod.headers,
        },
      });

      const text = await response.text().catch(() => "");
      const json = safeJsonParse(text);

      console.log("[dodo-payment] getDodoOrder response", {
        url,
        authMethod: authMethod.name,
        status: response.status,
        statusText: response.statusText,
        body: json ?? text,
      });

      if (!response.ok) {
        attemptErrors.push({
          authMethod: authMethod.name,
          status: response.status,
          statusText: response.statusText,
          responseBody: json ?? text,
        });

        const responseObj =
          typeof json === "object" && json ? (json as Record<string, unknown>) : null;

        const messageFromBody =
          (responseObj && ("message" in responseObj || "error" in responseObj)
            ? String((responseObj.message ?? responseObj.error) ?? "")
            : null) ?? null;

        const error = new Error(
          `[dodo-payment] getDodoOrder ${authMethod.name} failed: ${response.status} ${
            response.statusText
          }${messageFromBody ? ` - ${String(messageFromBody)}` : ""}`
        ) as Error & {
          status?: number;
          details?: unknown;
          authMethod?: DodoAuthMethod;
        };

        error.status = response.status;
        error.details = json ?? text;
        error.authMethod = authMethod.name;

        if (response.status === 401 && authMethod !== authHeaders[authHeaders.length - 1]) {
          console.log(
            `[dodo-payment] getDodoOrder 401 Unauthorized with ${authMethod.name}, trying next auth method...`
          );
          lastError = error;
          continue;
        }

        throw error;
      }

      console.log(`[dodo-payment] getDodoOrder success with auth method: ${authMethod.name}`);
      return json ?? (text ? text : null);
    } catch (error) {
      lastError = error as Error;
      if (authMethod !== authHeaders[authHeaders.length - 1]) {
        console.log(
          `[dodo-payment] getDodoOrder error with ${authMethod.name}, trying next method...`
        );
        continue;
      }
      break;
    }
  }

  console.error("[dodo-payment] getDodoOrder all authentication methods failed", {
    baseUrl,
    apiKey: redactSecret(bearerToken),
    attemptErrors,
  });

  const aggregated = new Error(
    `[dodo-payment] getDodoOrder all authentication methods failed. Attempts: ${attemptErrors
      .map((a) => `${a.authMethod}: ${a.status ?? "ERR"}`)
      .join(", ")}`
  ) as Error & { attemptErrors?: typeof attemptErrors; details?: unknown };

  aggregated.attemptErrors = attemptErrors;
  aggregated.details = (lastError as Error & { details?: unknown })?.details;

  throw lastError ?? aggregated;
}
