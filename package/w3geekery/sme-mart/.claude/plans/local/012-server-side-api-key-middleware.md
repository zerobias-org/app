# Plan: Move ZeroBias API Key Server-Side via Middleware

## Context

SME Mart needs to deploy to Vercel as a dev preview site for CEO (Brian) to review. Currently, `NEXT_PUBLIC_API_KEY` is exposed in the client JS bundle because the `NEXT_PUBLIC_` prefix causes Next.js to include it in browser-side code. This is a security concern for any non-localhost deployment.

**Goal:** Move the API key to a server-only env var (`ZEROBIAS_API_KEY`) and use Next.js middleware to inject the `Authorization` header on proxied requests, so the key never reaches the browser.

## Approach

The client-side ZeroBias SDK makes requests to relative paths (`/dana/api/v2/...`, `/session/...`). The `next.config.ts` fallback rewrites proxy these to ZeroBias. We insert Next.js middleware between the browser request and the rewrite — middleware adds the auth header server-side.

```
Browser → GET /dana/api/v2/me/session/whoAmI (no auth header)
  → Middleware adds Authorization: APIKey xxx + dana-org-id
    → Rewrite proxies to ci.zerobias.com/dana/api/v2/me/session/whoAmI (with auth)
```

## Changes

### 1. Create `src/middleware.ts` (NEW)

Next.js middleware that injects auth headers on ZeroBias-proxied paths:

- Match `/dana/:path*` and `/session/:path*` (always proxied to ZeroBias)
- Read `ZEROBIAS_API_KEY` (server-only) and `NEXT_PUBLIC_DEFAULT_ORG_ID`
- Set `Authorization: APIKey <key>` header
- Set `dana-org-id` header if not already present
- If `ZEROBIAS_API_KEY` is not set, pass through (production/session mode)

### 2. Update `src/lib/zerobias.ts`

Remove API key and org ID injection from the client-side request interceptor. The interceptor becomes a passthrough since middleware now handles auth.

**Before:** Interceptor checks `NEXT_PUBLIC_IS_LOCAL_DEV` and injects `Authorization` + `dana-org-id`
**After:** Interceptor is a no-op passthrough (or removed entirely from `init()`)

### 3. Update `src/lib/zerobias-sdk.ts`

Change from `NEXT_PUBLIC_API_KEY` to `ZEROBIAS_API_KEY` (with fallback for backward compat during migration).

- `const API_KEY = process.env.ZEROBIAS_API_KEY || process.env.NEXT_PUBLIC_API_KEY;`
- Update error message
- Update JSDoc comment

### 4. Update `src/lib/admin-auth.ts`

Same pattern as zerobias-sdk.ts:
- `const API_KEY = process.env.ZEROBIAS_API_KEY || process.env.NEXT_PUBLIC_API_KEY;`
- Update error message

### 5. Update CLI scripts

Both `scripts/explore-catalog.ts` and `scripts/explore-role-categories.ts`:
- `const API_KEY = process.env.ZEROBIAS_API_KEY || process.env.NEXT_PUBLIC_API_KEY;`
- Update JSDoc comments

### 6. Update `.env.local.example`

- Add `ZEROBIAS_API_KEY` as the primary variable
- Mark `NEXT_PUBLIC_API_KEY` as deprecated/removed
- Add comment explaining the middleware approach

### 7. Update env files (`.env.local`, `.env.dev`, `.env.qa`, `.env.prod`)

- Add `ZEROBIAS_API_KEY=<value>` (copy from existing `NEXT_PUBLIC_API_KEY`)
- Remove `NEXT_PUBLIC_API_KEY` lines

### 8. Summary for Kevin (CIO)

Include a brief write-up Clark can send to Kevin explaining:
- What we're doing (Vercel preview deployment)
- The security improvement (API key moved server-side)
- Repo access: currently `zerobias-org/app` (not a fork) — Kevin may need to grant Vercel access to this repo, OR we create a fork under `w3geekery` for Vercel

## Files Modified

| File | Action | Side |
|------|--------|------|
| `src/middleware.ts` | CREATE | Server |
| `src/lib/zerobias.ts` | EDIT | Client |
| `src/lib/zerobias-sdk.ts` | EDIT | Server |
| `src/lib/admin-auth.ts` | EDIT | Server |
| `scripts/explore-catalog.ts` | EDIT | CLI |
| `scripts/explore-role-categories.ts` | EDIT | CLI |
| `.env.local.example` | EDIT | Config |
| `.env.local` | EDIT | Config |
| `.env.dev` | EDIT | Config |
| `.env.qa` | EDIT | Config |
| `.env.prod` | EDIT | Config |

## Verification

1. `npm run dev` (mock mode) — should work unchanged
2. `npm run dev:ci` (proxy mode) — verify ZeroBias auth still works:
   - Page loads, user/org displayed in header
   - Catalog filters load (API routes work)
   - Browser DevTools Network tab: confirm `/dana/*` requests do NOT contain `Authorization` in the browser's request headers (middleware adds it server-side, invisible to browser)
3. `npm run build` — no build errors
4. Browser DevTools Sources tab: search JS bundles for the API key UUID — should NOT appear
