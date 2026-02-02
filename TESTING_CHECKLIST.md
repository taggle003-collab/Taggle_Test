# Testing Checklist for Debug Endpoint

## Pre-Deployment Checks

- [x] Created debug endpoint at `/api/leads/debug-search`
- [x] Added comprehensive error handling
- [x] Implemented column analysis
- [x] Added timing breakdown
- [x] Created documentation (README.md)
- [x] Created usage guide (DEBUG_ENDPOINT_GUIDE.md)
- [x] Created implementation summary
- [x] Created test script (test-debug-endpoint.sh)
- [x] Made test script executable
- [x] Verified .gitignore includes .env files
- [x] Created .env.local for local testing
- [x] Verified branch is correct

## Post-Deployment Testing

### 1. Local Testing (if applicable)
```bash
# Start development server
npm run dev

# Test the endpoint
./test-debug-endpoint.sh http://localhost:3000 USA Tech
```

Expected result:
- [ ] Endpoint responds with 200 status
- [ ] Returns comprehensive JSON diagnostic data
- [ ] Shows authentication status
- [ ] Shows Supabase query details
- [ ] Shows column analysis
- [ ] Shows timing information

### 2. Production Testing
```bash
# Test on production
./test-debug-endpoint.sh https://yourapp.vercel.app USA Tech
```

Expected result:
- [ ] Endpoint is accessible
- [ ] Returns diagnostic information
- [ ] Shows real Supabase data (if exists)
- [ ] No rate limiting errors

### 3. Diagnostic Verification

#### Test Case 1: Successful Query
**Action:** Query with valid country and category
```
?country=USA&category=Tech
```

**Expected Diagnostic Output:**
- [ ] `environment.hasSupabaseUrl` = true
- [ ] `environment.hasSupabaseKey` = true
- [ ] `auth.isAuthenticated` = true
- [ ] `supabaseResponse.hasError` = false
- [ ] `supabaseResponse.dataLength` > 0
- [ ] `columnAnalysis.missingColumns` = []
- [ ] `transformation.leadsTransformed` > 0
- [ ] `summary.status` = "SUCCESS"

#### Test Case 2: No Results
**Action:** Query with country/category that has no data
```
?country=ZZZ&category=NonExistent
```

**Expected Diagnostic Output:**
- [ ] `supabaseResponse.hasError` = false
- [ ] `supabaseResponse.dataLength` = 0
- [ ] `summary.status` = "SUCCESS"
- [ ] `finalResponse.leads` = []

#### Test Case 3: Unauthenticated User
**Action:** Access endpoint without logging in

**Expected Diagnostic Output:**
- [ ] Returns 401 status
- [ ] `auth.isAuthenticated` = false
- [ ] `error` = "User not authenticated"

#### Test Case 4: Invalid Parameters
**Action:** Query with special characters or invalid values
```
?country=<script>&category=test'123
```

**Expected Diagnostic Output:**
- [ ] Endpoint handles gracefully
- [ ] No server crashes
- [ ] Parameters are properly escaped in logs

### 4. Column Analysis Validation

**Action:** Review the `columnAnalysis` section

**Check:**
- [ ] `availableColumns` lists all database columns
- [ ] `expectedColumns` lists all columns the query expects
- [ ] `missingColumns` shows any columns that are expected but not present
- [ ] `unexpectedColumns` shows any columns present but not expected
- [ ] `criticalColumnsPresent` shows status of Emails, Name, Country, industry category

### 5. Performance Testing

**Action:** Check timing breakdown

**Verify:**
- [ ] `timing.authTime` is reasonable (< 100ms)
- [ ] `timing.queryTime` is reasonable (< 1000ms)
- [ ] `timing.transformTime` is reasonable (< 100ms)
- [ ] `timing.total` matches sum of components

### 6. Error Handling Testing

#### Test Supabase Connection Error
**Action:** (If possible) temporarily break Supabase credentials

**Expected:**
- [ ] Returns 500 status
- [ ] `environment.hasSupabaseUrl` or `environment.hasSupabaseKey` = false
- [ ] Clear error message provided

#### Test Transformation Error
**Action:** Review code handles null/undefined values

**Expected:**
- [ ] No crashes on null data
- [ ] Transformation errors caught
- [ ] Stack trace included in response

### 7. Security Testing

**Check:**
- [ ] Endpoint requires authentication (401 without login)
- [ ] Sensitive data is only visible to authenticated users
- [ ] No SQL injection vulnerabilities
- [ ] Proper error messages (no sensitive info leaked)

### 8. Documentation Testing

**Verify:**
- [ ] README.md is clear and accurate
- [ ] DEBUG_ENDPOINT_GUIDE.md covers all scenarios
- [ ] IMPLEMENTATION_SUMMARY.md is complete
- [ ] Code comments are helpful
- [ ] Example responses match actual responses

### 9. Integration Testing

**Compare with Regular Endpoint:**
```bash
# Debug endpoint
curl "https://yourapp.vercel.app/api/leads/debug-search?country=USA&category=Tech"

# Regular endpoint
curl "https://yourapp.vercel.app/api/leads/search?country=USA&category=Tech"
```

**Verify:**
- [ ] Both return same lead data (in finalResponse vs response)
- [ ] Debug endpoint includes additional diagnostic info
- [ ] Regular endpoint still works correctly
- [ ] No rate limiting on debug endpoint
- [ ] Rate limiting still applies to regular endpoint

### 10. Browser Testing

**Action:** Access endpoint directly in browser
```
https://yourapp.vercel.app/api/leads/debug-search?country=USA&category=Tech
```

**Verify:**
- [ ] JSON is properly formatted
- [ ] All sections are present
- [ ] No JavaScript errors
- [ ] Browser can parse the JSON

## Common Issues to Check

### Issue 1: "Missing Supabase credentials"
- [ ] Verify NEXT_PUBLIC_SUPABASE_URL is set
- [ ] Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is set
- [ ] Check environment variables in deployment

### Issue 2: "User not authenticated"
- [ ] User is logged in via Clerk
- [ ] Clerk configuration is correct
- [ ] Session is valid

### Issue 3: Column name errors
- [ ] Check `columnAnalysis.missingColumns`
- [ ] Verify database schema matches expected columns
- [ ] Update query if column names changed

### Issue 4: RLS policy errors
- [ ] Check `supabaseResponse.error.code`
- [ ] Review Supabase RLS policies
- [ ] Ensure anon key has read access

### Issue 5: Transformation errors
- [ ] Check `transformation.error`
- [ ] Review stack trace
- [ ] Add null checks if needed

## Diagnostic Decision Tree

1. **If endpoint returns 401:**
   → User not authenticated, check Clerk login

2. **If endpoint returns 500 with environment error:**
   → Missing credentials, check .env configuration

3. **If endpoint returns 400 with Supabase error:**
   → Database query failed, check error.code and error.hint

4. **If endpoint returns 500 with transformation error:**
   → Data format issue, check transformation.error

5. **If endpoint returns 200 but dataLength = 0:**
   → No data for query, try different parameters

6. **If endpoint returns 200 with data:**
   → Success! Review diagnostic info to understand data flow

## Final Verification

Before marking complete:
- [ ] All files created are tracked by git
- [ ] .env.local is NOT tracked by git
- [ ] Documentation is comprehensive
- [ ] Code follows project conventions
- [ ] No console.log statements left in code
- [ ] All TypeScript types are correct
- [ ] Error handling is complete

## Production Cleanup (After Debugging)

Once the main issue is resolved:
- [ ] Consider removing debug endpoint
- [ ] Or add environment check to disable in production
- [ ] Or add admin-only access restriction
- [ ] Update documentation to reflect changes
- [ ] Remove or archive debug endpoint files

## Notes

- This endpoint is for **debugging purposes only**
- It exposes sensitive information
- Should not be permanently enabled in production without restrictions
- Remove after issue is diagnosed and fixed

---

**Testing Status:** ⏳ Pending Deployment
**Next Step:** Deploy and run through checklist
