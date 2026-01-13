# Vercel environment variables

This project relies on server-side environment variables for lead scraping.

## Required

### `KAGGLE_API_TOKEN`

Used by `KaggleAPIScraper` to authenticate against Kaggle’s API.

Add it in Vercel:

1. Vercel Dashboard → your project
2. **Settings** → **Environment Variables**
3. Add **Name**: `KAGGLE_API_TOKEN`
4. Paste your token value
5. Enable for:
   - Production
   - Preview
   - Development
6. Save and redeploy

## Optional

### `LLM_API_KEY`

If set, the app can use the LLM fallback scraper (OpenRouter) when Kaggle returns too few leads.

### `ALLOW_MOCK_FALLBACK`

Set to `true` to allow mock fallback scrapers when real scrapers fail.

## CLI alternative (Vercel CLI)

You can also set variables via the CLI:

```bash
# Install/login first
npm i -g vercel
vercel login

# Add token to all three environments
vercel env add KAGGLE_API_TOKEN production
vercel env add KAGGLE_API_TOKEN preview
vercel env add KAGGLE_API_TOKEN development

# Trigger a redeploy
vercel --prod
```
