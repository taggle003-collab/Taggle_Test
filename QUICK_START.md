# Quick Start: Debug Endpoint

## TL;DR

A debug endpoint has been created to diagnose the "Failed to fetch leads" error.

### Access It:
```
https://yourapp.vercel.app/api/leads/debug-search?country=USA&category=Tech
```

### What It Does:
Returns comprehensive diagnostic information showing exactly what's happening at each step of the lead search process.

### Key Information Shown:
- ✅ Environment configuration
- ✅ Authentication status
- ✅ Database query details
- ✅ Column availability (missing/unexpected columns)
- ✅ Raw Supabase data
- ✅ Data transformation
- ✅ Performance timing
- ✅ Full error stack traces

## Quick Commands

### Test Locally
```bash
# Start server
npm run dev

# Test endpoint
./test-debug-endpoint.sh http://localhost:3000 USA Tech
```

### Test Production
```bash
# Via browser
open https://yourapp.vercel.app/api/leads/debug-search?country=USA&category=Tech

# Via curl
curl "https://yourapp.vercel.app/api/leads/debug-search?country=USA&category=Tech" | jq '.'

# Via test script
./test-debug-endpoint.sh https://yourapp.vercel.app USA Tech
```

## What to Look For

### 1. Check Environment
```json
"environment": {
  "hasSupabaseUrl": true,    // Should be true
  "hasSupabaseKey": true      // Should be true
}
```

### 2. Check Authentication
```json
"auth": {
  "isAuthenticated": true,   // Should be true
  "userId": "user_xxxxx"
}
```

### 3. Check Column Issues
```json
"columnAnalysis": {
  "missingColumns": [],      // Should be empty
  "criticalColumnsPresent": {
    "Emails": true,          // All should be true
    "Name": true,
    "Country": true,
    "industry category": true
  }
}
```

### 4. Check for Errors
```json
"supabaseResponse": {
  "hasError": false,         // Should be false
  "error": null
}
```

### 5. Check Results
```json
"summary": {
  "status": "SUCCESS",       // Should be SUCCESS
  "leadsReturned": 10
}
```

## Common Issues

| Issue | Look For | Fix |
|-------|----------|-----|
| No credentials | `environment.hasSupabaseUrl: false` | Add env vars |
| Not logged in | `auth.isAuthenticated: false` | Log in via Clerk |
| Wrong column name | `columnAnalysis.missingColumns: ["Emails"]` | Update schema |
| RLS blocking | `error.code: "42501"` | Fix RLS policies |
| No data | `dataLength: 0` | Check filters |

## Full Documentation

- **Complete Guide:** [DEBUG_ENDPOINT_GUIDE.md](./DEBUG_ENDPOINT_GUIDE.md)
- **API Reference:** [src/app/api/leads/debug-search/README.md](./src/app/api/leads/debug-search/README.md)
- **Implementation Summary:** [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Testing Checklist:** [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)

## Important

⚠️ **This endpoint exposes sensitive data** - restrict or remove after debugging.

## Need Help?

1. Review the JSON output from the debug endpoint
2. Check the "diagnosis" section if errors occur
3. Look for "missingColumns" in columnAnalysis
4. Review timing breakdown for performance issues
5. Share the output with the development team

---

**Created:** February 2, 2024  
**Branch:** `cto-task-create-a-debug-endpoint-to-diagnose-the-failed-to-fetch-lead`
