# Debug Endpoint Implementation Guide

## Overview

This document describes the new debug endpoint created to diagnose the "Failed to fetch leads" error that users are experiencing in the lead search functionality.

## Problem Statement

Users are encountering the error: **"Something went wrong. Please try again. Failed to fetch leads"** even though all background tasks appear to have succeeded. This makes it difficult to diagnose the root cause of the issue.

## Solution

We've created a comprehensive debug endpoint at `/api/leads/debug-search` that provides detailed diagnostic information about every step of the lead search process.

## Files Created

### 1. `/src/app/api/leads/debug-search/route.ts`
The main debug endpoint that mirrors the functionality of `/api/leads/search/route.ts` but includes extensive diagnostic logging.

**Features:**
- ✅ Takes same query parameters as regular search endpoint
- ✅ Returns step-by-step diagnostic information
- ✅ No rate limiting (for easier debugging)
- ✅ Full error stack traces
- ✅ Raw Supabase response data
- ✅ Column availability analysis
- ✅ Timing breakdown for each operation
- ✅ Data transformation details

### 2. `/src/app/api/leads/debug-search/README.md`
Comprehensive documentation on how to use the debug endpoint, including:
- Usage examples
- Parameter documentation
- Response structure
- Common troubleshooting scenarios
- Security considerations

### 3. `/test-debug-endpoint.sh`
A bash script for quickly testing the debug endpoint from the command line.

**Usage:**
```bash
# Local testing
./test-debug-endpoint.sh http://localhost:3000 USA Tech

# Production testing
./test-debug-endpoint.sh https://yourapp.vercel.app USA "Real Estate"
```

## How to Use the Debug Endpoint

### Quick Start

1. **Access the endpoint directly in your browser:**
   ```
   https://yourapp.vercel.app/api/leads/debug-search?country=USA&category=Tech
   ```

2. **Or use curl:**
   ```bash
   curl "https://yourapp.vercel.app/api/leads/debug-search?country=USA&category=Tech" | jq '.'
   ```

3. **Or use the test script:**
   ```bash
   ./test-debug-endpoint.sh https://yourapp.vercel.app USA Tech
   ```

### Query Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `country` | `USA` | Country filter for leads |
| `category` | `Tech` | Industry category filter |

## Diagnostic Information Returned

The endpoint returns a comprehensive JSON object with the following sections:

### 1. Environment Check
```json
{
  "environment": {
    "hasSupabaseUrl": true,
    "hasSupabaseKey": true,
    "supabaseUrlValue": "https://xxxxx.supabase...",
    "nodeEnv": "production"
  }
}
```

### 2. Authentication Status
```json
{
  "auth": {
    "isAuthenticated": true,
    "userId": "user_xxxxx"
  }
}
```

### 3. Request Parameters
```json
{
  "parameters": {
    "received": {
      "country": "USA",
      "category": "Tech",
      "fullUrl": "...",
      "searchParamsString": "country=USA&category=Tech"
    }
  }
}
```

### 4. Query Construction
```json
{
  "query": {
    "table": "leads",
    "filters": {
      "Country": "USA",
      "industry category": "Tech"
    },
    "limit": 10,
    "selectedColumns": ["id", "Name", "Emails", ...]
  }
}
```

### 5. Supabase Response (NEW - Enhanced)
```json
{
  "supabaseResponse": {
    "queryExecutionTime": "234ms",
    "hasError": false,
    "error": null,
    "dataType": "object",
    "dataIsArray": true,
    "dataLength": 10,
    "count": 150,
    "rawDataSample": [...],
    "allData": [...],
    "columnAnalysis": {
      "availableColumns": ["id", "Name", "Emails", ...],
      "expectedColumns": ["id", "Name", "Emails", ...],
      "missingColumns": [],
      "unexpectedColumns": [],
      "criticalColumnsPresent": {
        "Emails": true,
        "Name": true,
        "Country": true,
        "industry category": true
      }
    }
  }
}
```

### 6. Data Transformation
```json
{
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
  }
}
```

### 7. Final Response
```json
{
  "finalResponse": {
    "success": true,
    "leads": [...],
    "totalCount": 150,
    "page": 1,
    "totalPages": 1,
    "pageSize": 10
  }
}
```

### 8. Summary with Timing (NEW - Enhanced)
```json
{
  "summary": {
    "status": "SUCCESS",
    "totalExecutionTime": "256ms",
    "leadsReturned": 10,
    "noIssuesDetected": true,
    "timing": {
      "authTime": 10,
      "queryTime": 234,
      "transformTime": 12,
      "total": 256
    }
  },
  "comparisonWithRegularEndpoint": {
    "note": "This debug endpoint returns the same data structure as /api/leads/search",
    "differences": [
      "Debug endpoint does NOT apply rate limiting",
      "Debug endpoint returns ALL diagnostic information",
      "Debug endpoint includes raw Supabase data",
      "Debug endpoint shows column analysis"
    ],
    "regularEndpointUrl": "/api/leads/search?country=USA&category=Tech"
  }
}
```

## Issues This Can Diagnose

### ✅ Column Name Mismatches
The `columnAnalysis` section shows:
- All available columns in the database
- Expected columns based on the query
- Missing columns that should be present
- Unexpected columns that weren't expected
- Status of critical columns (Emails, Name, Country, etc.)

### ✅ Supabase Connection Issues
The `environment` section verifies:
- Supabase URL is configured
- Supabase API key is configured
- Shows partial values for verification

### ✅ Data Transformation Problems
The `transformation` section shows:
- Original database record structure
- Transformed Lead object structure
- Specific email field mapping
- Any transformation errors with stack traces

### ✅ Authentication Issues
The `auth` section shows:
- Whether user is authenticated
- User ID if authenticated
- Full error details if auth fails

### ✅ Query Construction Issues
The `query` section shows:
- Exact filters being applied
- Columns being selected
- Table being queried
- Limit settings

### ✅ Performance Issues
The `timing` section breaks down:
- Authentication time
- Database query time
- Data transformation time
- Total execution time

### ✅ RLS (Row Level Security) Policies
The `error` section within `supabaseResponse` shows:
- Error messages from Supabase
- Error codes
- Hints provided by Supabase
- Detailed error information

## Security Considerations

⚠️ **IMPORTANT:** This debug endpoint exposes sensitive information including:
- Raw database records
- Partial credentials
- User IDs
- Internal system structure

### Recommendations:

1. **Restrict access in production:**
   ```typescript
   // Add this at the start of the GET function
   if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINT) {
     return NextResponse.json(
       { error: "Debug endpoint is disabled in production" },
       { status: 403 }
     );
   }
   ```

2. **Remove after debugging:**
   Once the issue is diagnosed and fixed, consider removing this endpoint entirely.

3. **Add IP whitelist:**
   Only allow access from specific IP addresses if needed in production.

4. **Require admin privileges:**
   Add additional authentication checks to ensure only admins can access.

## Comparison with Regular Endpoint

| Feature | Regular Endpoint | Debug Endpoint |
|---------|------------------|----------------|
| Rate Limiting | ✅ Yes | ❌ No (for easier testing) |
| Diagnostic Info | ❌ No | ✅ Yes (extensive) |
| Raw Data | ❌ No | ✅ Yes (all records) |
| Column Analysis | ❌ No | ✅ Yes |
| Timing Breakdown | ❌ No | ✅ Yes |
| Error Stack Traces | ❌ No | ✅ Yes |
| URL | `/api/leads/search` | `/api/leads/debug-search` |

## Next Steps

1. **Test the endpoint:**
   ```bash
   # If running locally
   ./test-debug-endpoint.sh http://localhost:3000 USA Tech
   
   # If deployed
   ./test-debug-endpoint.sh https://yourapp.vercel.app USA Tech
   ```

2. **Review the diagnostic output:**
   - Look for errors in `supabaseResponse.error`
   - Check `columnAnalysis.missingColumns` for missing columns
   - Review `transformation` section for data mapping issues
   - Check `timing` section for performance bottlenecks

3. **Share findings:**
   Copy the JSON output and share it with the development team to identify the root cause.

4. **Fix the issue:**
   Based on the diagnostic information, fix the underlying issue in `/api/leads/search/route.ts`.

5. **Verify the fix:**
   Test the regular endpoint to ensure the issue is resolved.

6. **Clean up:**
   Consider removing or restricting the debug endpoint after fixing the issue.

## Example Scenarios

### Scenario 1: Missing Email Column
If the diagnostic shows:
```json
{
  "columnAnalysis": {
    "missingColumns": ["Emails"],
    "criticalColumnsPresent": {
      "Emails": false
    }
  }
}
```

**Solution:** The database column might be named differently. Check the Supabase schema and update the query.

### Scenario 2: RLS Policy Blocking
If the diagnostic shows:
```json
{
  "supabaseResponse": {
    "error": {
      "message": "permission denied for table leads",
      "code": "42501",
      "hint": "Check your RLS policies"
    }
  }
}
```

**Solution:** Update the RLS policies in Supabase to allow read access for authenticated users.

### Scenario 3: Transformation Error
If the diagnostic shows:
```json
{
  "transformation": {
    "error": "Cannot read property 'split' of undefined",
    "stack": "..."
  }
}
```

**Solution:** The transformation function is trying to access a property that doesn't exist. Add null checks in the `transformLead` function.

## Support

If you encounter any issues with the debug endpoint itself, please check:
1. The endpoint is properly deployed
2. You're authenticated (logged in via Clerk)
3. The `.env` file has correct Supabase credentials
4. The database table exists and has data

For further assistance, review the detailed README at:
`/src/app/api/leads/debug-search/README.md`
