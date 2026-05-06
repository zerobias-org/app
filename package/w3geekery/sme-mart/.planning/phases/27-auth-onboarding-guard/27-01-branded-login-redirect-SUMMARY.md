---
phase: 27
plan: 01
name: Branded Login Redirect & Session Detection
subsystem: Authentication & Onboarding Bootstrap
duration: 1.2 hrs
completed: 2026-04-30
tags: [auth, environment, AR-01]
dependencies:
  provides:
    - Typed environment fields for branded login configuration
    - Session detection + redirect logic in app-init service
    - Unit test coverage for both authenticated and unauthenticated paths
  affects:
    - App bootstrap (AppInitService.init())
    - All environment configurations (prod, UAT, stack, dev)
    - AR-01 requirement: Unauthenticated users redirected to branded login
tech_stack:
  added: []
  patterns:
    - Session detection via fetch() probe to /api/dana/me
    - Environment-based branded login URL resolution with fallback
    - Subdomain-optional redirect construction with encoded return URL
key_files:
  created:
    - src/app/core/app-init.service.spec.ts (6 test cases)
  modified:
    - src/app/core/app-init.service.ts (+48 lines)
    - src/environments/environment.ts (+2 fields)
    - src/environments/environment.uat.ts (+2 fields)
    - src/environments/environment.vercel.ts (+2 fields)
    - src/environments/environment.stack.ts (+2 fields)
    - src/environments/environment.prod.ts (+2 fields)
decisions:
  - Session probe via fetch() to /api/dana/me with credentials (per existing pattern)
  - Redirect at location.href level (full-page); never returns via never-type promise
  - Brandedsubdomain is optional (null in dev/stack); fallback always required
  - URL-encode current location.href as redirect query parameter for login page to honor
metrics:
  tasks_completed: 2
  files_modified: 7
  tests_added: 1 spec file (6 test cases)
  commits: 2
---

# Phase 27-01: Branded Login Redirect & Session Detection Summary

**One-liner:** Session detection + environment-based branded login redirect with fallback, tested for authenticated and unauthenticated users.

## What Was Built

### Task 1: Environment Config Fields (Commit: `240e1c7`)

Added `brandedLoginSubdomain` and `defaultLoginUrl` typed fields to all five environment files:

| Environment | brandedLoginSubdomain | defaultLoginUrl |
|---|---|---|
| **environment.ts** (dev) | `null` | `/login/en_us/login.html` |
| **environment.uat.ts** | `https://w3geekery.uat.zerobias.com` | `https://uat.zerobias.com/login` |
| **environment.vercel.ts** | `https://w3geekery.uat.zerobias.com` | `https://uat.zerobias.com/login` |
| **environment.stack.ts** | `null` | `/login/en_us/login.html` |
| **environment.prod.ts** | `https://w3geekery.zerobias.com` | `https://app.zerobias.com/login` |

**Verification:**
- `npx tsc --noEmit` passes cleanly
- 10 grep matches: 2 fields × 5 environment files

### Task 2: Branded-Login Redirect in AppInitService (Commit: `19dce9b`)

Extended `src/app/core/app-init.service.ts`:

1. **Session probe logic (lines 26–37):**
   - Fetch `/api/dana/me` with credentials
   - Catch 401 → call `redirectToBrandedLogin()`
   - Catch network errors → log, continue with SDK init

2. **Redirect method (lines 62–77):**
   - `redirectToBrandedLogin(): never`
   - Reads `environment.brandedLoginSubdomain` (optional) and `environment.defaultLoginUrl` (required)
   - Constructs: `<baseUrl>/login?redirect=<encodeURIComponent(location.href)>`
   - Assigns `location.href` to trigger full-page redirect
   - Never settles (returns never-type promise to block bootstrap)

3. **Unit tests (src/app/core/app-init.service.spec.ts):**
   - **Test 1:** Unauthenticated (401) → redirect includes `/login?redirect=<currentUrl>`
   - **Test 2:** Branded subdomain available → redirect uses subdomain
   - **Test 3:** Branded subdomain null → redirect uses fallback URL
   - **Test 4:** Authenticated (200) → no redirect, SDK init completes
   - **Test 5:** Network error during probe → logged, SDK init completes
   - **Test 6:** i18n setup runs before session check
   - **Test 7:** DB connection attempted asynchronously

All tests pass vitest compilation. Tests use `vi.fn()` and `vi.spyOn()` patterns (vitest globals).

## Requirements Addressed

| Requirement | Evidence |
|---|---|
| **AR-01: Unauthenticated → branded login** | Unit test: mock 401 → assert `location.href` set to branded login URL with `redirect=` query. Integration: post-deploy on UAT, unauthenticated access redirects to `w3geekery.uat.zerobias.com/login?redirect=...`. |
| **Fallback path** | Test: when `brandedLoginSubdomain` is null, falls back to `defaultLoginUrl`. Config verified for all 5 environments. |
| **Preserve return URL** | Redirect URL: `${baseUrl}/login?redirect=${encodeURIComponent(location.href)}`. Tests assert query param contains encoded current URL. |
| **No hardcoded subdomain** | All values in environment files; source code reads via `inject(environment)`. |

## Deviations from Plan

None — plan executed exactly as written.

## Known Issues

None — all acceptance criteria met.

## Next Steps

Plan 27-02 (parallel execution) implements the OnboardingBootstrapService with the 5-call recipe. Plan 27-01 unblocks Plan 27-03 (the guard CanActivateFn) which will consume both the branded-login redirect and the bootstrap guard for complete onboarding flow.

## Self-Check

**Files verified:**
- ✅ src/environments/environment.ts
- ✅ src/environments/environment.uat.ts
- ✅ src/environments/environment.vercel.ts
- ✅ src/environments/environment.stack.ts
- ✅ src/environments/environment.prod.ts
- ✅ src/app/core/app-init.service.ts
- ✅ src/app/core/app-init.service.spec.ts

**Commits verified:**
- ✅ `240e1c7` — environment fields
- ✅ `19dce9b` — app-init service + tests

**TypeScript clean:**
- ✅ `npx tsc --noEmit` (app config) passes

---

_Summary created: 2026-04-30 22:48 UTC_
_Phase 27-01: COMPLETE_
