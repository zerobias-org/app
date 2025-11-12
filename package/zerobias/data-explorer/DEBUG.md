# Debugging Guide for Data Explorer

This guide helps debug the data-explorer application, particularly issues with infinite loops and failed API calls.

## Quick Start

### Option 1: Run with Debug Server (Recommended)
```bash
npm run dev:debug
```

This starts a custom development server with comprehensive logging for:
- All incoming requests
- All proxied API requests and responses
- Request/response headers (sensitive data masked)
- Failed request bodies
- Proxy errors with stack traces

### Option 2: Standard Next.js Dev Server
```bash
npm run dev
```

This uses the standard Next.js development server. You'll see client-side logs in the browser console but less detailed server logs.

## What Was Fixed

### 1. Infinite Loop in ConnectionSelector

**Problem:** The useEffect hook at line 63-77 had problematic dependencies that could cause infinite re-renders:
- It depended on `explorerLoading` but also called `handleInitialize` which sets loading state
- It depended on `dataProducerClient` (an object) which could change reference on each render

**Solution:**
- Changed dependencies from objects to primitive values: `selectedConnection?.id`, `selectedScope?.id`
- Changed `dataProducerClient` dependency to `dataProducerClient !== null` (boolean)
- Changed `scopes` dependency to `scopes !== null` (boolean)
- Added detailed console.log statements to track exactly when and why the effect triggers

**Before:**
```typescript
}, [selectedConnection, selectedScope, isScoped, scopes, explorerLoading, dataProducerClient]);
```

**After:**
```typescript
}, [selectedConnection?.id, selectedScope?.id, isScoped, scopes !== null, dataProducerClient !== null]);
```

### 2. Added Comprehensive Logging

**ZerobiasAppService (lib/zerobias.ts):**
- Logs initialization start with environment details
- Logs each request interceptor call with URL, method, and auth status
- Catches and logs initialization errors

**CurrentUserContext (context/CurrentUserContext.tsx):**
- Logs when useEffect triggers
- Logs each step of getPlatform async function
- Logs when subscriptions return data
- Logs when loading state changes

**ConnectionSelector (components/ConnectionSelector.tsx):**
- Logs detailed state when initialization effect triggers
- Logs reasons for skipping initialization
- Logs which initialization path is taken (single-scope vs multi-scope)

### 3. Custom Debug Server (server-dev.js)

Created a custom Node.js server that wraps Next.js with:
- Color-coded console output (INFO, SUCCESS, ERROR, WARN, REQUEST, RESPONSE)
- Request/response logging for all proxy requests
- Automatic response body capture for failed requests
- Detailed error logging with stack traces
- Sensitive header masking (Authorization, Cookie)

## Reading the Logs

### Browser Console Logs

Look for these key log sequences:

**1. Initial App Load:**
```
CurrentUserContext: useEffect triggered
ZerobiasAppService: Starting initialization
creating new ZerobiasAppService instance
ZerobiasAppService: Request interceptor (first API call)
CurrentUserContext: Got ZerobiasAppService instance
CurrentUserContext: Subscribing to getWhoAmI
CurrentUserContext: Subscribing to getCurrentOrg
```

**2. Connection Selection:**
```
Initialize effect triggered: { explorerLoading: false, hasSelectedConnection: true, ... }
Initializing with connection ID (single-scope): abc-123
Initializing DataProducer client with targetId: abc-123
Connecting to Hub URL: http://localhost:3000/api/hub
DataProducer client initialized successfully
```

**3. Infinite Loop Detection:**
If you see "Initialize effect triggered" repeating rapidly (more than 2-3 times in a second), you have an infinite loop.

Check the logged state object to see what's changing:
- `explorerLoading` toggling? → Loading state issue
- `hasDataProducerClient` toggling? → Client creation/destruction loop
- `scopesLoaded` changing? → Scopes loading loop

### Server Console Logs (dev:debug)

**Color-Coded Levels:**
- 🔵 BLUE = INFO - Server startup, configuration
- 🟢 GREEN = SUCCESS - Successful API response (2xx)
- 🔴 RED = ERROR - Failed API response (4xx/5xx) or proxy error
- 🟡 YELLOW = WARN - Redirect response (3xx)
- 🟦 CYAN = REQUEST - Incoming request being proxied
- 🟪 MAGENTA = RESPONSE - Response received from upstream

**Example: Successful Request:**
```
[2025-11-12T18:30:15.123Z] [REQUEST] Proxying GET /api/dana/api/v2/me
{
  "method": "GET",
  "url": "/api/dana/api/v2/me",
  "headers": {
    "authorization": "[REDACTED]",
    ...
  }
}
[2025-11-12T18:30:15.456Z] [SUCCESS] Proxy response GET /api/dana/api/v2/me - 200
{
  "statusCode": 200,
  "statusMessage": "OK",
  "headers": { ... }
}
```

**Example: Failed Request:**
```
[2025-11-12T18:30:15.123Z] [REQUEST] Proxying POST /api/hub/targets/abc-123/connect
[2025-11-12T18:30:15.456Z] [ERROR] Proxy response POST /api/hub/targets/abc-123/connect - 404
{
  "statusCode": 404,
  "statusMessage": "Not Found",
  "headers": { ... }
}
[2025-11-12T18:30:15.457Z] [ERROR] Failed request body:
{
  "error": "Target not found",
  "message": "No target with ID abc-123"
}
```

## Common Issues and Solutions

### Issue: No API calls in console

**Symptoms:**
- Browser console shows initialization logs but no API calls
- Page appears to hang or loop
- No requests appear in Network tab

**Diagnosis:**
1. Check browser console for errors
2. Look for "ZerobiasAppService: Request interceptor" logs
   - If missing: Client library isn't making requests
   - If present: Requests are being made, check Network tab filtering

**Solutions:**
- Ensure `.env.development.local` has correct `NEXT_PUBLIC_API_HOSTNAME`
- Verify API key is valid: `NEXT_PUBLIC_API_KEY`
- Check that `NEXT_PUBLIC_IS_LOCAL_DEV=true`

### Issue: Infinite loop detected

**Symptoms:**
- Same console.log repeating rapidly
- Browser becomes unresponsive
- CPU usage spikes

**Diagnosis:**
1. Look for repeating "Initialize effect triggered" logs
2. Compare the logged state objects between iterations
3. Identify which value is changing repeatedly

**Solutions:**
- If `explorerLoading` toggling: Check that `setLoading` isn't called inside effect without proper guards
- If `dataProducerClient` toggling: Ensure client isn't being recreated unnecessarily
- If dependencies include objects: Change to primitive dependencies (like `object?.id`)

### Issue: API calls fail with 401 Unauthorized

**Symptoms:**
- Server logs show 401 responses
- "Failed to fetch User or Org" error in browser console

**Diagnosis:**
1. Check server logs for request headers
2. Verify Authorization header is present: `[REDACTED]` appears in logs

**Solutions:**
- Verify `NEXT_PUBLIC_API_KEY` is set in `.env.development.local`
- Check that `NEXT_PUBLIC_IS_LOCAL_DEV=true`
- Test API key with curl:
  ```bash
  curl -H "Authorization: APIKey YOUR_KEY_HERE" https://ci.zerobias.com/api/dana/api/v2/me
  ```

### Issue: API calls fail with CORS errors

**Symptoms:**
- Browser console shows CORS policy errors
- Preflight OPTIONS requests failing

**Diagnosis:**
1. Check if requests are going to localhost proxy
2. Verify `NEXT_PUBLIC_API_HOSTNAME=http://localhost:3000/api`

**Solutions:**
- Ensure environment variable is set correctly
- Restart dev server after changing `.env.development.local`
- Check `next.config.dev.ts` has correct rewrite rules

### Issue: Failed to initialize DataProducer client with empty error {}

**Symptoms:**
- "Failed to initialize DataProducer client: {}" error in console
- Error object appears empty
- No clear error message

**Diagnosis:**
Look at the new detailed step-by-step logs in browser console:
1. Check which step failed (Step 1-8)
2. Look for "Step X: Failed" error messages
3. Review the detailed error information logged for that step

**Common Causes:**
- **Step 4 fails**: Invalid URL format in `NEXT_PUBLIC_API_HOSTNAME`
  - Check `.env.development.local` has valid URL
  - Example: `NEXT_PUBLIC_API_HOSTNAME=http://localhost:3000/api`
- **Step 5 fails**: Invalid target ID (not a valid UUID)
  - Check connection/scope ID format
  - Should be UUID format: `abc-123-def-456`
- **Step 8 fails**: Network error connecting to Hub
  - Check server logs for proxied request
  - Verify Hub is accessible
  - Check API key is valid

**Solutions:**
1. Read the step-by-step logs to identify exactly where it fails
2. Fix the specific issue based on which step failed
3. Check server console logs (`npm run dev:debug`) for network errors
4. Verify environment configuration in `.env.development.local`

### Issue: Connection not found / Target not found

**Symptoms:**
- "Failed to initialize DataProducer client" error
- 404 responses in server logs for `/hub/targets/*/connect`
- Step 8 fails with 404 status code

**Diagnosis:**
1. Check connection ID being used (logged in Step 5)
2. Verify connection status is "up" or "standby"
3. Check server logs for the target ID being used
4. Look at the full URL being requested in server logs

**Solutions:**
- Verify the connection exists in Zerobias admin
- Check connection is in UP or STANDBY status
- For scoped connections, ensure you're using scope ID not connection ID
- Test Hub API directly:
  ```bash
  curl -H "Authorization: APIKey YOUR_KEY" \
    https://ci.zerobias.com/api/hub/connections
  ```

## Testing Checklist

Use this checklist when debugging:

**1. Environment Setup:**
- [ ] `.env.development.local` exists
- [ ] `NEXT_PUBLIC_API_HOSTNAME=http://localhost:3000/api`
- [ ] `NEXT_PUBLIC_IS_LOCAL_DEV=true`
- [ ] `NEXT_PUBLIC_API_KEY=<valid-key>`

**2. Server Startup:**
- [ ] `npm run dev:debug` starts without errors
- [ ] Blue INFO logs show configuration
- [ ] Server listening on http://localhost:3000

**3. Initial Load:**
- [ ] Browser opens to http://localhost:3000
- [ ] "CurrentUserContext: useEffect triggered" appears
- [ ] "ZerobiasAppService: Starting initialization" appears
- [ ] No errors in browser console
- [ ] No red ERROR logs in server console

**4. API Calls:**
- [ ] Request interceptor logs appear
- [ ] Cyan REQUEST logs in server console
- [ ] Green SUCCESS or Red ERROR responses logged
- [ ] Browser Network tab shows requests to localhost:3000/api/*

**5. Connection Selection:**
- [ ] Connection dropdown populates
- [ ] Selecting connection triggers "Initialize effect triggered"
- [ ] Only 1-2 initialize effects (not looping)
- [ ] DataProducer client initializes successfully

**6. No Infinite Loops:**
- [ ] No single log repeating >3 times per second
- [ ] Browser remains responsive
- [ ] CPU usage normal

## Advanced Debugging

### Enable Axios Debugging

Add to `lib/zerobias.ts`:
```typescript
import axios from 'axios';
axios.defaults.headers.common['X-Debug'] = 'true';
```

### Enable React DevTools Profiler

1. Install React DevTools browser extension
2. Open DevTools → Profiler tab
3. Click record
4. Look for components re-rendering frequently

### Network Request Timing

In browser DevTools → Network tab:
1. Right-click column headers
2. Enable "Waterfall" and "Time" columns
3. Look for requests with long "Waiting (TTFB)" times

### Memory Leak Detection

1. Open DevTools → Memory tab
2. Take heap snapshot
3. Perform actions
4. Take another snapshot
5. Compare to see if objects are accumulating

## Disabling Debug Logging

Once you've fixed the issue, you can reduce log verbosity:

**Remove Console Logs:**
```bash
# Find all console.log statements added for debugging
grep -r "console.log" context/ components/ lib/
```

**Or Use Standard Dev Server:**
```bash
npm run dev  # Instead of npm run dev:debug
```

## Getting Help

If you're still stuck:

1. **Gather Information:**
   - Copy the last 50 lines of server console output
   - Export browser console logs (right-click → "Save as...")
   - Take screenshot of Network tab showing failed requests

2. **Check Documentation:**
   - `CLAUDE.md` - Architecture and patterns
   - `README.md` - Setup and configuration
   - `BACKEND_ISSUE.md` - Known backend issues

3. **Report Issue:**
   - Include environment details (Node version, OS, browser)
   - Attach logs and screenshots
   - Describe steps to reproduce
   - Mention what you've already tried

## Related Files

- `server-dev.js` - Custom debug server with logging
- `package.json` - npm scripts including `dev:debug`
- `.env.development.local` - Local environment configuration
- `lib/zerobias.ts` - Client initialization and request interceptor
- `context/CurrentUserContext.tsx` - Auth context with logging
- `components/ConnectionSelector.tsx` - Connection/scope selection with logging
