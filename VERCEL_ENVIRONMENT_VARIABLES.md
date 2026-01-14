# Vercel environment variables

This project relies on server-side environment variables for lead scraping.

## Required for Production

### `LLM_API_KEY`

Used by `LLMScraper` (OpenRouter) as the primary and only lead generation source. This is required for the best user experience.

**Get an API key:**
1. Sign up at [OpenRouter.ai](https://openrouter.ai)
2. Get your API key from the dashboard (starts with `sk-or-`)
3. Add credits to your account for API usage

**Add it in Vercel:**

1. Vercel Dashboard → your project
2. **Settings** → **Environment Variables**
3. Add **Name**: `LLM_API_KEY`
4. Paste your API key value
5. Enable for:
   - Production
   - Preview
   - Development
6. Save and redeploy

**Optional configuration:**

- `LLM_API_BASE_URL`: Base URL for the LLM API (defaults to `https://openrouter.ai/api/v1`)
- `LLM_MODEL_NAME`: Model to use for lead generation (defaults to `deepseek/deepseek-chat`)

## Optional

### `ALLOW_MOCK_FALLBACK`

Set to `true` to allow mock fallback scrapers when real scrapers fail. Recommended: `false` in production to avoid masking configuration issues.

## CLI alternative (Vercel CLI)

You can also set variables via the CLI:

```bash
# Install/login first
npm i -g vercel
vercel login

# Add LLM API key to all three environments
vercel env add LLM_API_KEY production
vercel env add LLM_API_KEY preview
vercel env add LLM_API_KEY development

# Trigger a redeploy
vercel --prod
```

## Scraping Priority

The lead generation follows this order:

1. **LLMScraper** (primary) - Uses OpenRouter API to generate realistic B2B leads
2. **Mock scrapers** (dev only) - Only enabled in development or when `ALLOW_MOCK_FALLBACK=true`

**Note:** Even without API keys configured, the LLM scraper will generate fallback leads to ensure users always get results.
