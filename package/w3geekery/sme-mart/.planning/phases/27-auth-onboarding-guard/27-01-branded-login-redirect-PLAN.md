---
phase: 27
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: 
  - src/environments/environment.ts
  - src/environments/environment.uat.ts
  - src/environments/environment.vercel.ts
  - src/environments/environment.dev.ts
  - src/app/core/services/app-init.service.ts
autonomous: true
requirements_addressed: [AR-01]
must_haves:
  truths:
    - Unauthenticated user on any SME Mart route triggers redirect to branded login URL
    - Login URL includes redirect query parameter pointing to original URL
    - Fallback login URL works when branded subdomain is unavailable
  artifacts:
    - path: "src/environments/environment.ts"
      provides: "Typed environment config with brandedLoginSubdomain and defaultLoginUrl fields"
    - path: "src/app/core/services/app-init.service.ts"
      provides: "Extended or new branded-login redirect logic (whoAmI check → unauthenticated → redirect)"
  key_links:
    - from: "app-init.service.ts"
      to: "environment.ts"
      via: "read brandedLoginSubdomain and defaultLoginUrl"
    - from: "app-init.service.ts"
      to: "location.href"
      via: "redirect with redirect=<currentUrl> query string"
---

<objective>
Add environment configuration for branded login URL and implement unauthenticated-user redirect in the app bootstrap.

Purpose: Comply with AR-01 (unauthenticated users redirect to branded login). Route users to W3Geekery-branded login page (`https://w3geekery.uat.zerobias.com/login` if available, else ZB platform default).

Output: Environment fields + session-detection logic in app-init, tested to redirect 401/unauthenticated to the correct login URL with `redirect=<current-url>` query parameter.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
@.planning/phases/27-auth-onboarding-guard/27-CONTEXT.md — user decisions (locked)
@.planning/phases/27-auth-onboarding-guard/27-RESEARCH.md — technical research
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/director/phase-27-brief.md — AR-01 requirement spec
@.planning/director/DECISIONS.md "Marketplace tagType Is Preferred for New Tags" — tag decision context
@.planning/docs/MODERNIZATION_GUIDE.md — Angular 21 patterns (inject(), not constructor params)
@src/app/core/app-init.service.ts — existing auth bootstrap pattern (lines 32–40 — branded-login redirect reuses/extends this)
@src/app/app.config.ts — provideAppInitializer wire-up point
@src/environments/environment.ts — baseline environment template
</context>

<interfaces>
<!-- Extract existing app-init.service.ts pattern for executor reference -->

From src/app/core/app-init.service.ts (lines 32–40):
The existing `init()` method calls `whoAmI()` and has a redirect fallback for localhost dev. The branded-login redirect should extend this pattern — same session-check logic, different redirect URL.

From src/environments/environment.ts (current):
New fields to add:
- `brandedLoginSubdomain?: string` — optional subdomain for W3Geekery login (fallback if not available)
- `defaultLoginUrl: string` — canonical ZB platform login URL (fallback)

Both fields are strings; the actual redirect URL construction uses the `brandedLoginSubdomain` if provided, otherwise `defaultLoginUrl`.

</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add environment config fields for branded login</name>
  <files>
    src/environments/environment.ts
    src/environments/environment.uat.ts
    src/environments/environment.vercel.ts
    src/environments/environment.dev.ts
  </files>
  <read_first>
    src/environments/environment.ts — current baseline
    27-CONTEXT.md section "Branded login URL resolution at runtime" — exact field shape and URL pattern
  </read_first>
  <action>
Add two new typed fields to the environment interface in `environment.ts`:

```typescript
brandedLoginSubdomain?: string;  // e.g., "https://w3geekery.uat.zerobias.com"
defaultLoginUrl: string;         // fallback: e.g., "https://uat.zerobias.com/login"
```

Then populate in each environment file:

- **environment.ts** (prod): `brandedLoginSubdomain: "https://w3geekery.zerobias.com"` (or empty/null if Andrey subdomain not yet provisioned), `defaultLoginUrl: "https://app.zerobias.com/login"`
- **environment.uat.ts** (UAT): `brandedLoginSubdomain: "https://w3geekery.uat.zerobias.com"`, `defaultLoginUrl: "https://uat.zerobias.com/login"`
- **environment.vercel.ts** (Vercel): `brandedLoginSubdomain: "https://w3geekery.uat.zerobias.com"` (points to UAT per Vercel config), `defaultLoginUrl: "https://uat.zerobias.com/login"`
- **environment.dev.ts** (local dev): `brandedLoginSubdomain: null` (no subdomain locally), `defaultLoginUrl: "http://localhost:4200"` (or whatever the current fallback is per app-init.service.ts)

Do NOT hardcode subdomains in source code — they belong ONLY in environment files.
  </action>
  <acceptance_criteria>
    - TypeScript compile: `npx tsc --noEmit` exits 0
    - All four environment files have `brandedLoginSubdomain` and `defaultLoginUrl` fields with the correct types
    - `brandedLoginSubdomain` is optional (`?:`) on all environments
    - `defaultLoginUrl` is required (no `?:`) on all environments
    - grep: `grep -n "brandedLoginSubdomain\|defaultLoginUrl" src/environments/*.ts` returns 8 matches (2 per environment: one declare, one initialize)
  </acceptance_criteria>
  <behavior>
    - Test 1: Environment loads without TypeScript errors
    - Test 2: All four environment files have both fields populated with non-empty strings
  </behavior>
  <verify>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <done>
    All four environment files have typed, populated `brandedLoginSubdomain` and `defaultLoginUrl` fields. TypeScript compiles.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement branded-login redirect in app-init service</name>
  <files>
    src/app/core/services/app-init.service.ts
    src/app/core/services/app-init.service.spec.ts
  </files>
  <read_first>
    src/app/core/services/app-init.service.ts — existing init() method (lines 32–40), current redirect pattern
    27-CONTEXT.md "Branded login URL resolution at runtime" — exact redirect URL construction
    27-RESEARCH.md "Session detection" section — SDK call shape (whoAmI)
    src/app/core/services/vendor-profile.service.ts:153-159 — error pattern to mirror (if SDK call fails)
  </read_first>
  <action>
Extend `AppInitService.init()` to detect unauthenticated session and redirect to the branded login URL:

1. Read environment fields: `const subdomain = environment.brandedLoginSubdomain ?? null; const fallback = environment.defaultLoginUrl;`
2. After the existing `whoAmI()` call (or as a check-and-redirect before it), if the session is unauthenticated (401 response), construct the redirect URL:
   ```typescript
   const target = subdomain
     ? `${subdomain}/login?redirect=${encodeURIComponent(location.href)}`
     : `${fallback}?redirect=${encodeURIComponent(location.href)}`;
   location.href = target;
   ```
3. The redirect MUST encode `location.href` (the current full URL) as the `redirect=` query parameter so the login page can return the user to their starting point.
4. Do NOT use `this.router.navigate()` — this is a full-page redirect that happens before routing is ready. Use `location.href` assignment directly.
5. Follow Angular 21 modernization: use `inject(environment)` for environment access, NOT constructor params.

Expected behavior: On app load, if `whoAmI()` rejects with 401 or returns null, the browser immediately redirects to the branded login URL (or fallback) with the current URL encoded in the `redirect` query parameter.

Mock shapes: In unit tests, mock `ZerobiasClientApi.getWhoAmI()` to reject with a 401 or similar; assert `location.href` is set to the expected branded login URL with `redirect=` query string intact.
  </action>
  <acceptance_criteria>
    - `app-init.service.ts` contains new logic after the `whoAmI()` call to check session status
    - If unauthenticated (401), `location.href` is assigned to the branded login URL (or fallback)
    - Redirect URL includes `?redirect=${encodeURIComponent(location.href)}`
    - `environment.brandedLoginSubdomain` and `environment.defaultLoginUrl` are read via `inject(environment)`, not constructor params
    - Unit test mocks `whoAmI()` returning 401 → asserts `location.href` set to expected URL
    - grep: `grep -n "location.href.*redirect" src/app/core/services/app-init.service.ts` returns ≥1 match with `redirect=` and `encodeURIComponent` visible
    - `npm test -- --include='**/app-init.service.spec.ts'` exits 0
  </acceptance_criteria>
  <behavior>
    - Test 1: Authenticated session (whoAmI returns principal) → init() completes normally, no redirect
    - Test 2: Unauthenticated session (whoAmI rejects with 401) → location.href set to branded login URL with redirect query param
    - Test 3: Fallback path (no brandedLoginSubdomain) → location.href set to defaultLoginUrl with redirect query param
  </behavior>
  <verify>
    <automated>npm test -- --include='**/app-init.service.spec.ts'</automated>
  </verify>
  <done>
    `app-init.service.ts` redirects unauthenticated users to branded login URL with `redirect=<current-url>` query parameter. Fallback to `defaultLoginUrl` when subdomain unavailable. Unit tests cover both auth and unauth paths.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Environment config fields for branded login URL + redirect logic in app-init service. Both authenticated and unauthenticated paths tested.
  </what-built>
  <how-to-verify>
    1. **Code inspection:** Check `app-init.service.ts` contains the new redirect logic (diff against `HEAD` before changes).
    2. **Local test (manual):** In a local dev session, add a `debugger` breakpoint in the auth-check code. Observe that unauthenticated load triggers redirect to `defaultLoginUrl` (since local dev won't have subdomain).
    3. **UAT manual test (post-deploy):** Verify that visiting `https://uat.zerobias.com/sme-mart/` (or deployed URL) as an unauthenticated user redirects to `https://w3geekery.uat.zerobias.com/login?redirect=...` (if subdomain live) or `https://uat.zerobias.com/login?redirect=...` (if fallback).
  </how-to-verify>
  <resume-signal>Type "approved" if both code and manual verification pass. Describe any issues if test fails.</resume-signal>
</task>

</tasks>

<verification>
AR-01 verification path:

| Requirement | Evidence |
|---|---|
| AR-01: Unauthenticated users redirected to branded login | Unit test: mock whoAmI() 401 → assert location.href set to branded login URL. Manual test: access app URL unauthenticated → observe redirect to branded login (or fallback). Grep: `location.href.*redirect` present in source. |

Post-merge on UAT, full end-to-end test will cover the actual redirect behavior once Phase 27 guard is wired into routing.
</verification>

<success_criteria>
1. All environment files have `brandedLoginSubdomain` and `defaultLoginUrl` fields, typed and populated.
2. `app-init.service.ts` redirects unauthenticated sessions to branded login URL with `redirect=` query parameter.
3. Fallback to `defaultLoginUrl` when subdomain unavailable.
4. TypeScript compiles cleanly (`npx tsc --noEmit`).
5. Unit tests pass for both authenticated and unauthenticated paths.
6. No hardcoded subdomain URLs in source code — all in environment files.
</success_criteria>

<output>
After completion, create `.planning/phases/27-auth-onboarding-guard/27-01-branded-login-redirect-SUMMARY.md` with:
- Environment fields added (list all four files + their values)
- Redirect logic summary (whoAmI → check session → redirect URL construction)
- Unit test coverage (2 tests: auth + unauth)
- No open issues
</output>
