import { NextResponse } from "next/server";

export const runtime = "nodejs";

function redactSecret(value: string): string {
  if (!value) return value;
  if (value.length <= 10) return "REDACTED";
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getDodoApiKeyForDiagnostics(): {
  key: string | null;
  source: string | null;
} {
  const candidates: Array<{ name: string; value: string | undefined }> = [
    { name: "DODO_PAYMENTS_API_KEY", value: process.env.DODO_PAYMENTS_API_KEY },
    { name: "DODO_API_KEY", value: process.env.DODO_API_KEY },
    { name: "NEXT_PUBLIC_DODO_API_KEY", value: process.env.NEXT_PUBLIC_DODO_API_KEY },
  ];

  for (const c of candidates) {
    if (c.value) return { key: c.value, source: c.name };
  }

  return { key: null, source: null };
}

type DodoDetectedEnvironment = "test" | "live" | "override_base_url" | "unknown";

type DodoBaseUrlDiagnostics = {
  baseUrl: string;
  detectedEnvironment: DodoDetectedEnvironment;
  detectionReason: string;
};

function computeDodoBaseUrlForDiagnostics(
  apiKey: string | null
): DodoBaseUrlDiagnostics {
  const configuredBaseUrl = process.env.DODO_PAYMENTS_BASE_URL;
  if (configuredBaseUrl) {
    return {
      baseUrl: configuredBaseUrl.replace(/\/+$/, ""),
      detectedEnvironment: "override_base_url",
      detectionReason: "DODO_PAYMENTS_BASE_URL is set",
    };
  }

  const envVar = process.env.DODO_PAYMENTS_ENVIRONMENT;
  if (envVar) {
    if (envVar === "test" || envVar === "test_mode") {
      return {
        baseUrl: "https://test.dodopayments.com",
        detectedEnvironment: "test",
        detectionReason: `DODO_PAYMENTS_ENVIRONMENT=${envVar}`,
      };
    }
    if (envVar === "live" || envVar === "live_mode") {
      return {
        baseUrl: "https://live.dodopayments.com",
        detectedEnvironment: "live",
        detectionReason: `DODO_PAYMENTS_ENVIRONMENT=${envVar}`,
      };
    }

    return {
      baseUrl: "https://test.dodopayments.com",
      detectedEnvironment: "unknown",
      detectionReason: `Unrecognized DODO_PAYMENTS_ENVIRONMENT=${envVar}`,
    };
  }

  if (apiKey) {
    if (apiKey.startsWith("test_") || apiKey.includes("_test_")) {
      return {
        baseUrl: "https://test.dodopayments.com",
        detectedEnvironment: "test" as const,
        detectionReason: "Auto-detected from API key prefix/contents",
      };
    }

    if (apiKey.startsWith("live_") || apiKey.includes("_live_")) {
      return {
        baseUrl: "https://live.dodopayments.com",
        detectedEnvironment: "live" as const,
        detectionReason: "Auto-detected from API key prefix/contents",
      };
    }
  }

  const isProd = process.env.NODE_ENV === "production";
  return {
    baseUrl: isProd ? "https://live.dodopayments.com" : "https://test.dodopayments.com",
    detectedEnvironment: isProd ? ("live" as const) : ("test" as const),
    detectionReason: `Fallback based on NODE_ENV=${process.env.NODE_ENV}`,
  };
}

type AuthAttempt = {
  name: string;
  headers: Record<string, string>;
};

export async function GET() {
  const requestId = crypto.randomUUID();

  const { key: apiKey, source: apiKeySource } = getDodoApiKeyForDiagnostics();
  const { baseUrl, detectedEnvironment, detectionReason } =
    computeDodoBaseUrlForDiagnostics(apiKey);

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: "No Dodo API key found",
        apiKeyLoaded: false,
        apiKeySource,
        environment: {
          DODO_PAYMENTS_ENVIRONMENT: process.env.DODO_PAYMENTS_ENVIRONMENT ?? null,
          DODO_PAYMENTS_BASE_URL: process.env.DODO_PAYMENTS_BASE_URL ?? null,
          NODE_ENV: process.env.NODE_ENV ?? null,
        },
      },
      { status: 500 }
    );
  }

  const endpoint = `${baseUrl}/checkouts`;

  const payload = {
    product_cart: [{ product_id: "DIAGNOSTIC_ONLY", quantity: 1 }],
    return_url: "https://example.com/return",
    customer: {
      email: "diagnostic@example.com",
    },
    metadata: {
      diagnostic: "true",
      requestId,
    },
  };

  const authAttempts: AuthAttempt[] = [
    {
      name: "Authorization Bearer",
      headers: { Authorization: `Bearer ${apiKey}` },
    },
    {
      name: "X-API-Key",
      headers: { "X-API-Key": apiKey },
    },
    {
      name: "Authorization Api-Key",
      headers: { Authorization: `Api-Key ${apiKey}` },
    },
  ];

  const attempts: Array<{
    authMethod: string;
    request: {
      url: string;
      headers: Record<string, string>;
      body: unknown;
    };
    response: {
      ok: boolean;
      status: number;
      statusText: string;
      headers: Record<string, string>;
      bodyText: string;
      bodyJson: unknown;
    } | null;
    error: { message: string; name?: string; stack?: string } | null;
  }> = [];

  for (const auth of authAttempts) {
    const reqHeaders = {
      "Content-Type": "application/json",
      ...auth.headers,
    };

    const redactedHeaders: Record<string, string> = {
      ...reqHeaders,
    };
    if (redactedHeaders.Authorization) redactedHeaders.Authorization = "REDACTED";
    if (redactedHeaders["X-API-Key"]) redactedHeaders["X-API-Key"] = "REDACTED";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify(payload),
      });

      const bodyText = await response.text().catch(() => "");
      const bodyJson = safeJsonParse(bodyText);

      const responseHeaders: Record<string, string> = {};
      for (const [k, v] of response.headers.entries()) responseHeaders[k] = v;

      attempts.push({
        authMethod: auth.name,
        request: {
          url: endpoint,
          headers: redactedHeaders,
          body: {
            ...payload,
            customer: { email: "REDACTED" },
          },
        },
        response: {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          bodyText,
          bodyJson,
        },
        error: null,
      });

      if (response.ok) {
        break;
      }
    } catch (e) {
      attempts.push({
        authMethod: auth.name,
        request: {
          url: endpoint,
          headers: redactedHeaders,
          body: {
            ...payload,
            customer: { email: "REDACTED" },
          },
        },
        response: null,
        error: {
          name: e instanceof Error ? e.name : undefined,
          message: e instanceof Error ? e.message : String(e),
          stack: e instanceof Error ? e.stack : undefined,
        },
      });
    }
  }

  const successfulAttempt = attempts.find((a) => a.response?.ok);

  return NextResponse.json({
    ok: Boolean(successfulAttempt),
    requestId,
    dodo: {
      baseUrl,
      endpoint,
      detectedEnvironment,
      detectionReason,
    },
    apiKey: {
      loaded: true,
      source: apiKeySource,
      redacted: redactSecret(apiKey),
      length: apiKey.length,
      startsWith: apiKey.slice(0, 8),
    },
    environment: {
      DODO_PAYMENTS_ENVIRONMENT: process.env.DODO_PAYMENTS_ENVIRONMENT ?? null,
      DODO_PAYMENTS_BASE_URL: process.env.DODO_PAYMENTS_BASE_URL ?? null,
      NODE_ENV: process.env.NODE_ENV ?? null,
      VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    },
    attempts,
  });
}
