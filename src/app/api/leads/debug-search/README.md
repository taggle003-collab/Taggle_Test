# Debug Search Endpoint

## Purpose
This endpoint is designed to diagnose the "Failed to fetch leads" error by providing comprehensive diagnostic information about the entire lead search process.

## Usage

### Local Development
```bash
http://localhost:3000/api/leads/debug-search?country=USA&category=Tech
```

### Production
```bash
https://yourapp.vercel.app/api/leads/debug-search?country=USA&category=Tech
```

## Query Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `country` | No | `USA` | Country filter for lead search |
| `category` | No | `Tech` | Industry category filter for lead search |

## What It Returns

The endpoint returns a comprehensive JSON object containing:

### 1. Environment Check
- Verifies Supabase URL and API key are configured
- Shows partial values for security verification

### 2. Authentication Status
- Confirms user is authenticated via Clerk
- Shows user ID (if authenticated)

### 3. Request Parameters
- Displays all received query parameters
- Shows full URL and search params string

### 4. Query Construction
- Shows the exact Supabase query being built
- Lists all selected columns
- Shows filter criteria

### 5. Supabase Response
- Raw response from Supabase
- Query execution time
- Any errors with details (message, code, hint)
- Data length and type information
- Sample records (first 2)
- Full raw data for complete analysis

### 6. Data Transformation
- Shows how database records are transformed to Lead objects
- Provides before/after sample
- Shows email mapping specifically
- Lists any transformation errors

### 7. Final Response
- The complete response that would be sent to the client
- All leads data
- Pagination info

### 8. Summary
- Overall status (SUCCESS/FAILURE)
- Total execution time
- Number of leads returned
- Issues detected

## Example Response

```json
{
  "timestamp": "2024-02-02T08:30:00.000Z",
  "endpoint": "/api/leads/debug-search",
  "purpose": "Diagnose 'Failed to fetch leads' error",
  "environment": {
    "hasSupabaseUrl": true,
    "hasSupabaseKey": true,
    "supabaseUrlValue": "https://xxxxxxxxxxxxx.supabase...",
    "nodeEnv": "production"
  },
  "auth": {
    "isAuthenticated": true,
    "userId": "user_xxxxxxxxxxxxx"
  },
  "parameters": {
    "received": {
      "country": "USA",
      "category": "Tech",
      "fullUrl": "https://yourapp.com/api/leads/debug-search?country=USA&category=Tech",
      "searchParamsString": "country=USA&category=Tech"
    }
  },
  "query": {
    "table": "leads",
    "filters": {
      "Country": "USA",
      "industry category": "Tech"
    },
    "limit": 10,
    "selectedColumns": ["id", "Name", "Emails", ...]
  },
  "supabaseResponse": {
    "queryExecutionTime": "234ms",
    "hasError": false,
    "error": null,
    "dataType": "object",
    "dataIsArray": true,
    "dataLength": 10,
    "count": 150,
    "rawDataSample": [...],
    "allData": [...]
  },
  "transformation": {
    "recordsReceived": 10,
    "leadsTransformed": 10,
    "sampleTransformation": {
      "original": {...},
      "transformed": {...}
    },
    "emailMapping": {
      "note": "Mapping 'Emails' column to 'email' field",
      "examples": [...]
    }
  },
  "finalResponse": {
    "success": true,
    "leads": [...],
    "totalCount": 150,
    "page": 1,
    "totalPages": 1,
    "pageSize": 10
  },
  "summary": {
    "status": "SUCCESS",
    "totalExecutionTime": "256ms",
    "leadsReturned": 10,
    "noIssuesDetected": true
  }
}
```

## Diagnosable Issues

This endpoint can help diagnose:

✅ **Column Name Mismatches**
- Shows exact column names being queried
- Displays raw data structure from Supabase

✅ **Supabase Connection Issues**
- Verifies credentials are configured
- Shows connection errors with full details

✅ **Data Transformation Problems**
- Shows before/after transformation
- Catches and reports transformation errors

✅ **Type Mismatches**
- Displays data types at each stage
- Shows interface mapping

✅ **Authentication Issues**
- Verifies Clerk authentication status
- Shows auth errors with stack traces

✅ **Rate Limiting**
- Note: This debug endpoint does NOT apply rate limiting
- Use it freely to diagnose issues

✅ **RLS (Row Level Security) Policies**
- Shows Supabase errors if RLS is blocking access
- Displays hint messages from Supabase

## Error Response Format

If an error occurs, the response will include:

```json
{
  "timestamp": "...",
  "endpoint": "/api/leads/debug-search",
  "error": "Description of what went wrong",
  "diagnosis": {
    "issue": "High-level issue description",
    "possibleCauses": [
      "Cause 1",
      "Cause 2",
      "Cause 3"
    ],
    "recommendation": "What to do next"
  },
  "criticalError": {
    "message": "Error message",
    "stack": "Full stack trace",
    "type": "Error type"
  },
  "summary": {
    "status": "CRITICAL_FAILURE",
    "totalExecutionTime": "10ms"
  }
}
```

## Security Notes

- This endpoint requires authentication (Clerk)
- It shows sensitive data like raw database records
- **Should be removed or restricted in production after debugging**
- Consider adding an environment check to only enable in development:

```typescript
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: "Debug endpoint disabled in production" }, { status: 403 });
}
```

## Troubleshooting Common Issues

### Issue: "Missing Supabase credentials"
**Solution:** Check your `.env.local` file contains:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### Issue: "User not authenticated"
**Solution:** Make sure you're logged in via Clerk before accessing this endpoint

### Issue: "Column does not exist"
**Solution:** Check the `supabaseResponse.error` field for the exact column name that's wrong, then update the query

### Issue: "Row Level Security policy violation"
**Solution:** Check your Supabase RLS policies and ensure the service role key has proper access

## Next Steps After Debugging

1. Review the diagnostic output
2. Identify the root cause from the detailed information
3. Fix the issue in `/api/leads/search/route.ts`
4. Test with the regular search endpoint
5. Consider removing or disabling this debug endpoint in production
