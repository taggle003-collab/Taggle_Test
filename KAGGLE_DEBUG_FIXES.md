# Kaggle API Scraper Debug Fixes

## Problem
The Kaggle API scraper was returning "No leads found" and failing silently without sufficient logging to diagnose the issue.

## Root Cause Analysis
The scraper had multiple potential failure points:
1. **Missing authentication validation** - No test to verify API token works before attempting operations
2. **Insufficient logging** - No visibility into what was happening at each step
3. **Silent failures** - Errors weren't being logged with enough detail
4. **Unknown response format** - Couldn't tell if API was returning data in unexpected format

## Changes Made

### 1. Enhanced `KaggleAPIScraper.scrape()` Method
**File:** `src/lib/scrapers/kaggle-api-scraper.ts`

**Added:**
- Detailed logging at each major step (token check, auth test, search, dataset processing)
- Authentication test before attempting any operations
- Sample dataset logging for debugging
- Per-dataset progress tracking
- Final results summary with all errors

**Before:**
```typescript
if (!this.apiToken) {
  return { leads: [], errors: ['KAGGLE_API_TOKEN not configured'], sources: [this.source] };
}
```

**After:**
```typescript
console.log('[KAGGLE_API] Starting scrape', {
  hasToken: !!this.apiToken,
  tokenLength: this.apiToken?.length,
  tokenPrefix: this.apiToken ? this.apiToken.slice(0, 6) + '...' : 'none',
  industry: criteria.industry,
  location: criteria.location,
  companySize: criteria.companySize,
  desired
});

// Test authentication first
console.log('[KAGGLE_API] Testing API authentication...');
const authResult = await this.testAuthentication();
if (!authResult.success) {
  console.error('[KAGGLE_API] Authentication failed:', authResult.error);
  errors.push(`Kaggle API authentication failed: ${authResult.error}`);
  return { leads: [], errors, sources: [this.source] };
}
```

### 2. New `testAuthentication()` Method
**File:** `src/lib/scrapers/kaggle-api-scraper.ts`

**Added authentication test method:**
```typescript
private async testAuthentication(): Promise<{ success: boolean; error?: string; data?: unknown }> {
  try {
    const url = 'https://www.kaggle.com/api/v1/users/whoami';
    console.log('[KAGGLE_API] Testing auth endpoint:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`
      }
    });

    console.log('[KAGGLE_API] Auth response status:', response.status, response.statusText);

    if (!response.ok) {
      const bodyText = await this.safeReadText(response);
      console.error('[KAGGLE_API] Auth failed:', {
        status: response.status,
        statusText: response.statusText,
        body: bodyText.slice(0, 500)
      });
      return {
        success: false,
        error: `Authentication failed (${response.status}): ${bodyText.slice(0, 200)}`
      };
    }

    const data = await response.json();
    console.log('[KAGGLE_API] Auth successful, user data:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('[KAGGLE_API] Auth error:', error);
    return {
      success: false,
      error: error.message || 'Unknown authentication error'
    };
  }
}
```

### 3. Enhanced `searchKaggleDatasets()` Method
**File:** `src/lib/scrapers/kaggle-api-scraper.ts`

**Added detailed logging for:**
- Endpoint being tried
- Request parameters
- Response parsing steps
- Response format detection
- Why parsing failed (if it does)

**Key additions:**
```typescript
console.log('[KAGGLE_API] Searching datasets with params:', params);

for (const url of endpoints) {
  console.log('[KAGGLE_API] Trying endpoint:', url);
  const result = await this.fetchJson(url, params);

  if (!result.ok) {
    console.warn('[KAGGLE_API] Dataset search failed:', {
      url,
      status: result.status,
      statusText: result.statusText,
      body: result.bodySnippet
    });
    continue;
  }

  console.log('[KAGGLE_API] Request succeeded, parsing response...');
  console.log('[KAGGLE_API] Response type:', typeof result.json);
  console.log('[KAGGLE_API] Response keys:', result.json && typeof result.json === 'object' ? Object.keys(result.json) : 'N/A');

  // ... detailed format detection with logging ...
}
```

### 4. Improved Orchestrator Logging
**File:** `src/lib/scrapers/orchestrator.ts`

**Added comprehensive logging for:**
- Which scraper is running
- Results from each scraper
- Error details from each scraper
- Final aggregation results

**Key additions:**
```typescript
console.log(`[Orchestrator] Starting scrape with ${scraper.constructor.name}...`);
console.log(`[Orchestrator] ${scraper.constructor.name} completed:`, {
  rawLeads: result.leads.length,
  afterFilter: result.leads.filter((lead) => !previouslyScrapedEmails.has(lead.email)).length,
  errors: result.errors.length,
  errorDetails: result.errors.slice(0, 3)
});

// After primary scraper
console.log(`[Orchestrator] Primary scraper (${primaryScraper.constructor.name}) results:`, {
  leadsFound: primaryResult.leads.length,
  errors: primaryResult.errors.length,
  errorDetails: primaryResult.errors.slice(0, 5),
  sources: primaryResult.sources
});
```

### 5. New Test Endpoint
**File:** `src/app/api/test-kaggle/route.ts` (NEW)

Created a comprehensive test endpoint to diagnose Kaggle API issues:

**GET /api/test-kaggle** tests:
1. Environment variable presence
2. Bearer token authentication to `/users/whoami`
3. Dataset search endpoint
4. Alternative Basic Auth (fallback)

**Example response:**
```json
{
  "hasToken": true,
  "tokenLength": 44,
  "tokenPrefix": "6b02a9...df72b",
  "tests": [
    {
      "name": "Environment Variable Check",
      "success": true,
      "message": "KAGGLE_API_TOKEN is set (44 characters)"
    },
    {
      "name": "Authentication (/users/whoami)",
      "success": true,
      "message": "Authentication successful",
      "data": {
        "status": 200,
        "statusText": "OK",
        "body": "{...}"
      }
    },
    {
      "name": "Dataset Search (/datasets/search)",
      "success": true,
      "message": "Dataset search successful",
      "data": {
        "status": 200,
        "isArray": false,
        "isObject": true,
        "keys": ["results", "meta"],
        "sample": [...]
      }
    }
  ]
}
```

## How to Use the Test Endpoint

1. **Run locally:**
   ```bash
   curl http://localhost:3000/api/test-kaggle
   ```

2. **Check Vercel deployment:**
   ```bash
   curl https://your-app.vercel.app/api/test-kaggle
   ```

3. **Interpret results:**
   - If "Environment Variable Check" fails: Token not configured
   - If "Authentication" fails: Invalid token or wrong auth format
   - If "Dataset Search" fails: Search endpoint issue
   - If "Basic Auth" works: Use Basic Auth instead of Bearer

## Expected Behavior After Fixes

### With Valid Token:
```
[KAGGLE_API] Starting scrape { hasToken: true, tokenLength: 44, tokenPrefix: '6b02a9...' }
[KAGGLE_API] Testing API authentication...
[KAGGLE_API] Testing auth endpoint: https://www.kaggle.com/api/v1/users/whoami
[KAGGLE_API] Auth response status: 200 OK
[KAGGLE_API] Auth successful, user data: { userName: 'username', ... }
[KAGGLE_API] Starting dataset search...
[KAGGLE_API] Searching datasets with params: { search: 'technology companies', ... }
[KAGGLE_API] Trying endpoint: https://www.kaggle.com/api/v1/datasets/search
[KAGGLE_API] Request succeeded, parsing response...
[KAGGLE_API] Response is array with 20 items
[KAGGLE_API] Found 20 candidate datasets
[KAGGLE_API] Processing dataset 0/50: { datasetRef: 'user/dataset', title: 'Company Data' }
[KAGGLE_API] Dataset user/dataset returned 1500 records
[KAGGLE_API] After filtering: 45/1500 records match criteria
[KAGGLE_API] Final results: { totalLeads: 120, uniqueLeads: 98, errors: 0 }
```

### With Invalid Token:
```
[KAGGLE_API] Starting scrape { hasToken: true, tokenLength: 10, tokenPrefix: 'invalid...' }
[KAGGLE_API] Testing API authentication...
[KAGGLE_API] Testing auth endpoint: https://www.kaggle.com/api/v1/users/whoami
[KAGGLE_API] Auth response status: 401 Unauthorized
[KAGGLE_API] Auth failed: { status: 401, statusText: 'Unauthorized', body: '{"error":"Invalid token"}' }
[KAGGLE_API] ERROR: Authentication failed
[KAGGLE_API] Final results: { totalLeads: 0, uniqueLeads: 0, errors: ['Kaggle API authentication failed: ...'] }
```

### With No Token:
```
[KAGGLE_API] Starting scrape { hasToken: false, tokenLength: 0, tokenPrefix: 'none' }
[KAGGLE_API] ERROR: KAGGLE_API_TOKEN not configured
[KAGGLE_API] Final results: { totalLeads: 0, uniqueLeads: 0, errors: ['KAGGLE_API_TOKEN not configured'] }
```

## Next Steps for Troubleshooting

### 1. Test the API endpoint:
```bash
curl https://your-app.vercel.app/api/test-kaggle
```

### 2. Check logs in Vercel:
- Vercel Dashboard → Your Project → Logs
- Filter by `[KAGGLE_API]` to see scraper logs
- Look for error messages and status codes

### 3. Verify token format:
Kaggle API tokens should be:
- Generated from: https://www.kaggle.com/settings
- Format: Typically JSON-like structure or long alphanumeric string
- NOT a password or username

### 4. Check authentication method:
The code uses Bearer token authentication:
```typescript
headers: {
  'Authorization': `Bearer ${this.apiToken}`
}
```

If this doesn't work, try Basic Auth:
```typescript
headers: {
  'Authorization': `Basic ${Buffer.from(token + ':').toString('base64')}`
}
```

### 5. Verify API endpoints:
Currently tried:
- `/api/v1/users/whoami` - Test authentication
- `/api/v1/datasets/search` - Search datasets
- `/api/v1/datasets/list` - List datasets
- `/api/v1/datasets/download/{ref}` - Download dataset

## Fallback Strategy

If Kaggle API continues to fail, the orchestrator will:
1. Try LLM scraper (if `LLM_API_KEY` is configured)
2. Try mock scrapers (if `ALLOW_MOCK_FALLBACK=true` in development)

This ensures users always get leads, even if Kaggle fails.

## Success Criteria

✅ Comprehensive logging shows what's happening at each step
✅ Authentication failures are caught early with clear error messages
✅ Dataset search results are logged with response format details
✅ Per-dataset progress is tracked
✅ Test endpoint provides clear diagnostics
✅ No more silent failures
✅ Orchestrator provides visibility into which scrapers ran and why

## Files Modified

1. `src/lib/scrapers/kaggle-api-scraper.ts` - Enhanced logging and auth testing
2. `src/lib/scrapers/orchestrator.ts` - Better logging coordination
3. `src/app/api/test-kaggle/route.ts` - New test endpoint (created)
