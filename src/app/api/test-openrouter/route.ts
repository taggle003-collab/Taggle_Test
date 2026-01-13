/// <reference types="node" />
/// <reference lib="es2020" />

const json = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json"
    }
  });

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shouldCall = url.searchParams.get("call") === "1";

  const apiKey = process.env.LLM_API_KEY || "";
  const modelName = process.env.LLM_MODEL_NAME || "deepseek/deepseek-chat";
  const apiBaseUrl = (process.env.LLM_API_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/+$/, "");

  const config = {
    nodeEnv: process.env.NODE_ENV,
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.slice(0, 6) : null,
    apiKeySuffix: apiKey ? apiKey.slice(-4) : null,
    apiBaseUrl,
    modelName
  };

  if (!shouldCall) {
    return json({ ok: true, config, note: "Add ?call=1 to run a live OpenRouter test request." });
  }

  if (!apiKey) {
    return json(
      {
        ok: false,
        config,
        error: "LLM_API_KEY is missing",
        message: "Set LLM_API_KEY in your environment and redeploy."
      },
      { status: 500 }
    );
  }

  const endpoint = `${apiBaseUrl}/chat/completions`;
  const startedAt = Date.now();

  try {
    const requestBody = {
      model: modelName,
      messages: [
        {
          role: "user",
          content:
            "Return ONLY valid JSON in the format {\"ok\":true,\"service\":\"openrouter\"}. No markdown."
        }
      ],
      temperature: 0,
      max_tokens: 120
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://leadscraperapp.com",
        "X-Title": "Lead Scraper App"
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();

    return json({
      ok: response.ok,
      config,
      endpoint,
      status: response.status,
      statusText: response.statusText,
      durationMs: Date.now() - startedAt,
      responseBodyPreview: responseText.slice(0, 2000)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return json(
      {
        ok: false,
        config,
        endpoint,
        durationMs: Date.now() - startedAt,
        error: message
      },
      { status: 502 }
    );
  }
}
