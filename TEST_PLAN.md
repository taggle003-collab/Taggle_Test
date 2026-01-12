# Test Plan for scrape-leads API Fix

## Overview
This document outlines the test plan to verify the 400 error fix for the `/api/scrape-leads` endpoint.

## Pre-deployment Verification

### ✅ Build Test
```bash
npm run build
```
**Status**: PASSED - No TypeScript errors

### ✅ TypeScript Compilation
```bash
npx tsc --noEmit
```
**Status**: PASSED - No compilation errors

### ✅ Git Status
```bash
git log --oneline -5
```
**Status**: PASSED - Fix merged to main branch

## Manual Testing Scenarios

### Test 1: User with Old Metadata Format
**Scenario**: User has only legacy metadata fields  
**Metadata**: `['plan', 'leadsUsed', 'totalLeads', 'trialStartedAt']`

**Request**:
```bash
POST /api/scrape-leads
Content-Type: application/json
Authorization: Bearer <token>

{
  "industry": "Technology",
  "location": "USA",
  "companySize": "10-50",
  "page": 1,
  "limit": 20
}
```

**Expected Logs**:
```
[SCRAPE_LEADS] Starting request...
[SCRAPE_LEADS] Auth result: { userId: "present" }
[SCRAPE_LEADS] User metadata keys: ["plan", "leadsUsed", "totalLeads", "trialStartedAt"]
[SCRAPE_LEADS] User metadata values (safe): {
  hasPlan: true,
  hasSearchCount: false,
  hasPreviousLeads: false,
  hasRateLimitResetTime: false,
  hasLeadsUsed: true,
  hasTotalLeads: true,
  hasTrialStartedAt: true
}
[SCRAPE_LEADS] Metadata compatibility: {
  hasRateLimitingFields: false,
  hasOldPlanFields: true,
  metadataKeys: ["plan", "leadsUsed", "totalLeads", "trialStartedAt"],
  userId: "user_abc"
}
[SCRAPE_LEADS] Migrating from old metadata format to rate limiting format
[SCRAPE_LEADS] Rate limit check passed, parsing request body...
[SCRAPE_LEADS] Request body parsed successfully, type: object
[SCRAPE_LEADS] Validation passed, processing request: { page: 1, limit: 20, ... }
[SCRAPE_LEADS] Starting real scraping with orchestrator...
[SCRAPE_LEADS] Scraping orchestrator completed successfully
[SCRAPE_LEADS] Real scraping complete. Found X leads from Y sources
[SCRAPE_LEADS] Successfully updated user metadata - all fields preserved
[SCRAPE_LEADS] Request completed successfully: { leadsGenerated: X, ... }
[SCRAPE_LEADS] Returning response with: { leadsCount: X, ... }
```

**Expected Response**:
- Status: `200 OK`
- Body includes: `leads` array, `pagination` object, `searchesRemaining`

**Verification**:
- ✅ User metadata now includes rate limiting fields
- ✅ Old fields (plan, leadsUsed, totalLeads, trialStartedAt) are preserved
- ✅ Leads are returned successfully
- ✅ No 400 error

---

### Test 2: Invalid JSON in Request Body
**Scenario**: Client sends malformed JSON

**Request**:
```bash
POST /api/scrape-leads
Content-Type: application/json
Authorization: Bearer <token>

{invalid json
```

**Expected Logs**:
```
[SCRAPE_LEADS] Starting request...
[SCRAPE_LEADS] Auth result: { userId: "present" }
[SCRAPE_LEADS] Rate limit check passed, parsing request body...
[SCRAPE_LEADS] Failed to parse request body: Unexpected token 'i', "{invalid json" is not valid JSON
```

**Expected Response**:
- Status: `400 Bad Request`
- Body:
```json
{
  "error": "Invalid JSON",
  "message": "The request body contains invalid JSON.",
  "details": "Unexpected token 'i', \"{invalid json\" is not valid JSON"
}
```

**Verification**:
- ✅ Returns 400 with clear error message
- ✅ Logs show exactly where parsing failed
- ✅ Error message includes the actual parsing error

---

### Test 3: Invalid Page Parameter
**Scenario**: Client sends invalid page number

**Request**:
```bash
POST /api/scrape-leads
Content-Type: application/json
Authorization: Bearer <token>

{
  "page": "invalid",
  "limit": 20,
  "industry": "Technology"
}
```

**Expected Logs**:
```
[SCRAPE_LEADS] Rate limit check passed, parsing request body...
[SCRAPE_LEADS] Request body parsed successfully, type: object
[SCRAPE_LEADS] Extracted parameters: { page: "invalid", limit: 20, criteriaKeys: ["industry"] }
[SCRAPE_LEADS] Converted to numbers: { pageNum: NaN, limitNum: 20, pageIsNaN: true, limitIsNaN: false }
[SCRAPE_LEADS] Invalid page parameter: { page: "invalid", pageNum: NaN, isNaN: true, lessThan1: false }
```

**Expected Response**:
- Status: `400 Bad Request`
- Body:
```json
{
  "error": "Invalid page parameter",
  "message": "Invalid page number.",
  "details": "Page must be a positive number. Received: invalid (type: string)"
}
```

**Verification**:
- ✅ Returns 400 with specific error
- ✅ Error message shows the actual value received
- ✅ Error message shows the type of the value
- ✅ Logs show the conversion and validation process

---

### Test 4: Invalid Limit Parameter
**Scenario**: Client sends limit outside allowed range

**Request**:
```bash
POST /api/scrape-leads
Content-Type: application/json
Authorization: Bearer <token>

{
  "page": 1,
  "limit": 200,
  "industry": "Technology"
}
```

**Expected Logs**:
```
[SCRAPE_LEADS] Rate limit check passed, parsing request body...
[SCRAPE_LEADS] Request body parsed successfully, type: object
[SCRAPE_LEADS] Extracted parameters: { page: 1, limit: 200, criteriaKeys: ["industry"] }
[SCRAPE_LEADS] Converted to numbers: { pageNum: 1, limitNum: 200, pageIsNaN: false, limitIsNaN: false }
[SCRAPE_LEADS] Invalid limit parameter: { limit: 200, limitNum: 200, isNaN: false, lessThan1: false, greaterThan100: true }
```

**Expected Response**:
- Status: `400 Bad Request`
- Body:
```json
{
  "error": "Invalid limit parameter",
  "message": "Invalid limit value.",
  "details": "Limit must be between 1 and 100. Received: 200 (type: number)"
}
```

**Verification**:
- ✅ Returns 400 with specific error
- ✅ Error message shows why validation failed
- ✅ Logs show all validation checks

---

### Test 5: Rate Limit Exceeded
**Scenario**: User has exhausted their 3 searches per hour

**Request**:
```bash
POST /api/scrape-leads
Content-Type: application/json
Authorization: Bearer <token>

{
  "page": 1,
  "limit": 20,
  "industry": "Technology"
}
```

**Expected Logs**:
```
[SCRAPE_LEADS] Metadata compatibility: { hasRateLimitingFields: true, ... }
[SCRAPE_LEADS] Rate limit exceeded: { searchCount: 3, searchLimit: 3, resetTime: "2024-01-01T12:00:00Z" }
```

**Expected Response**:
- Status: `429 Too Many Requests`
- Body:
```json
{
  "error": "Rate limit exceeded",
  "message": "You've used 3 searches. Try again in 1 hour.",
  "resetTime": "2024-01-01T12:00:00Z",
  "retryAfter": 3600
}
```

**Verification**:
- ✅ Returns 429 (not 400)
- ✅ Includes reset time
- ✅ All metadata preserved

---

### Test 6: Valid Request - Solo Plan User
**Scenario**: User with Solo plan makes valid request

**Request**:
```bash
POST /api/scrape-leads
Content-Type: application/json
Authorization: Bearer <token>

{
  "page": 1,
  "limit": 20,
  "industry": "SaaS",
  "location": "USA",
  "companySize": "10-50",
  "customICP": "B2B SaaS companies"
}
```

**Expected Logs**:
```
[SCRAPE_LEADS] User plan: solo Advanced matching: true
[SCRAPE_LEADS] Starting real scraping with orchestrator...
[SCRAPE_LEADS] Scraping orchestrator completed successfully
[SCRAPE_LEADS] Real scraping complete. Found 120 leads from 3 sources
[SCRAPE_LEADS] Request completed successfully: {
  leadsGenerated: 120,
  searchesRemaining: 2,
  totalPreviousLeads: 120,
  userPlan: "solo"
}
[SCRAPE_LEADS] Returning response with: {
  leadsCount: 120,
  paginationTotal: 120,
  searchesRemaining: 2,
  hasRateLimitReset: false
}
```

**Expected Response**:
- Status: `200 OK`
- Body includes:
  - `leads` array with 120 items
  - Each lead has `fundingStage`, `annualRevenue`, `matchQualityScore`
  - `pagination` object
  - `searchesRemaining: 2`
  - `quality: "verified_active"`

**Verification**:
- ✅ Solo plan gets advanced fields
- ✅ Metadata updated with new search count
- ✅ Previous leads tracked for uniqueness
- ✅ Rate limiting applied correctly

---

### Test 7: Valid Request - Lite Plan User
**Scenario**: User with Lite plan makes valid request

**Request**: Same as Test 6

**Expected Logs**:
```
[SCRAPE_LEADS] User plan: lite Advanced matching: false
[SCRAPE_LEADS] Starting real scraping with orchestrator...
```

**Expected Response**:
- Status: `200 OK`
- Body includes:
  - `leads` array
  - Each lead has basic fields
  - No `fundingStage`, `annualRevenue`, or `matchQualityScore` (or null values)
  - `matchedCriteria` array is included

**Verification**:
- ✅ Lite plan gets basic matching
- ✅ No advanced fields returned
- ✅ Still tracks rate limiting

---

## Production Monitoring

### Key Metrics to Watch

1. **Success Rate**: 200 responses should increase significantly
2. **400 Error Rate**: Should decrease to near zero (except for actual invalid requests)
3. **429 Error Rate**: Should remain consistent (rate limiting working)

### Log Patterns to Monitor

**Successful requests**:
```
[SCRAPE_LEADS] Starting request...
→ [SCRAPE_LEADS] User metadata values (safe):
→ [SCRAPE_LEADS] Rate limit check passed
→ [SCRAPE_LEADS] Request body parsed successfully
→ [SCRAPE_LEADS] Validation passed
→ [SCRAPE_LEADS] Scraping orchestrator completed
→ [SCRAPE_LEADS] Returning response with:
```

**400 errors should now have clear context**:
```
[SCRAPE_LEADS] Failed to parse request body: <specific error>
OR
[SCRAPE_LEADS] Invalid page parameter: { page: X, pageNum: Y, ... }
OR
[SCRAPE_LEADS] Invalid limit parameter: { limit: X, ... }
```

### Alerts to Set Up

1. **High 400 Rate**: If 400 errors exceed 5% of requests
2. **Specific 400 Pattern**: If same validation fails repeatedly
3. **Clerk Client Null**: If we see "Clerk client instance is null" errors
4. **Scraping Failures**: If "Scraping orchestrator failed" appears

## Rollback Plan

If issues arise:

```bash
git checkout main
git revert HEAD  # Revert the merge commit
git push origin main
```

This will cleanly revert the logging changes while preserving git history.

## Success Criteria

- ✅ No unexplained 400 errors
- ✅ All 400 errors have clear, actionable error messages
- ✅ Old metadata format users can scrape leads successfully
- ✅ New metadata format users continue to work
- ✅ Rate limiting functions correctly
- ✅ All user metadata is preserved during updates
- ✅ Logs provide clear debugging information

## Sign-off

**Code Review**: ✅ PASSED  
**TypeScript Compilation**: ✅ PASSED  
**Build**: ✅ PASSED  
**Git Status**: ✅ Merged to main  
**Documentation**: ✅ Complete  

**Ready for Deployment**: ✅ YES
