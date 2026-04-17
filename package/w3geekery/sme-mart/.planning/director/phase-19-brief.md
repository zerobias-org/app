# Phase 19 — zbb Local Dev Stacks with Unified-Origin Reverse Proxy

**Milestone:** v1.3
**Est:** 10–14 hrs (architecture revised 2026-04-17; was 7–10 before reverse-proxy discovery)
**Repos:** `app/` (SME Mart), `login/` (white-label login)
**Status:** REPLAN (Phase 19 v1 reverted; see errata 017 for systemic miss)

---

## Goal

Compose `zbb` stacks that let SME Mart + login run locally against the real UAT backend with real auth — single-origin, real cookies, real session, multi-user. The stack reproduces production serving shape (CloudFront → S3 with `try_files` fallback) PLUS unified-origin API proxy so browser auth, cookies, `BroadcastChannel`, WebSockets, and iframe navigation all work the same locally as in CI/QA/prod.

**Non-goal:** simulating the ZeroBias backend locally. Backend stays on `uat.zerobias.com`. The local stack only unifies the origin.

---

## Locked Architecture (2026-04-17 after errata 017)

### The pattern: unified-origin reverse proxy, not static-only serving

Reference: `~/Projects/zb/ui/scripts/gateway.js` — canonical node/http-proxy that unifies zb/ui's apps under one port. SME Mart's `cloudfront-sim` mirrors this pattern with **nginx + S3 buckets** instead of node + dev-server ports.

```
localhost:<CLOUDFRONT_SIM_PORT>   (single nginx origin, single stack)
  ├── /login/*       → minio bucket sme-mart-login   (static files)
  ├── /sme-mart/*    → minio bucket sme-mart-app     (static files)
  ├── /api/*         → reverse-proxy https://uat.zerobias.com/api/
  ├── /dana/*        → reverse-proxy https://uat.zerobias.com/dana/
  └── /app/session   → reverse-proxy https://uat.zerobias.com/app/session (ws upgrade)
```

### Critical nginx directives

```nginx
proxy_cookie_domain uat.zerobias.com localhost;    # rewrite Set-Cookie Domain
proxy_cookie_flags ~ nosecure;                      # UAT uses Secure; localhost is http
proxy_set_header Host uat.zerobias.com;             # preserve target host for TLS/routing
proxy_ssl_server_name on;                           # SNI for uat.zerobias.com cert
proxy_http_version 1.1;                             # for ws upgrade on /app/session
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection $connection_upgrade;

# SPA try_files fallback per location
location /sme-mart/ {
  error_page 404 =200 /sme-mart/index.html;
  # ... proxy_pass to minio bucket
}
```

### No API key. No dana-org-id cookie injection. Real login.

- Browser hits `localhost:<port>/sme-mart/` → SPA loads
- SPA calls `whoAmI()`, gets 401 → redirects to real login page
- Real login page at `localhost:<port>/login/` → POSTs to `localhost:<port>/dana/me/session/login?next=X&cookieDomain=localhost`
- Proxy forwards to `uat.zerobias.com`; cookies come back scoped to `uat.zerobias.com`; nginx rewrites `Domain=localhost`
- Browser stores cookies on localhost; subsequent SPA requests include them
- Multi-user testing works natively (each browser profile = separate session)

### Angular environment for stack mode

New file: `src/environments/environment.stack.ts`

```typescript
export const environment = {
  production: false,
  isLocalDev: false,                         // <-- critical: use real login flow, not proxy-injected
  apiHostname: 'http://localhost:<PORT>',    // same origin as serving; injected at build time
  basePath: '/sme-mart',
  // ... other fields to match production shape
};
```

`isLocalDev: false` is the key. `zerobias-client-app.ts` routes to `redirectLogin()` with cookieDomain param when `isLocalDev: false` — that's the real login flow.

Login built with `npm run build` (NOT `--local`) so paths rewrite to `/login/assets/*` and `/api/dana/api/*`.

---

## Sub-plans (estimated 4–5 plans; exact breakdown for gsd-plan)

1. **cloudfront-sim** — nginx container with multi-location config: 2 static buckets + 3 reverse-proxy locations + cookie-domain rewriting + ws upgrade. Template-based config with `envsubst` for `${BASE_PATH}`, `${UAT_ORIGIN}`, `${MINIO_*}`. Reusable (not SME Mart-specific — location block names are the only SME Mart tie, parameterize if that becomes a constraint).
2. **sme-mart-spa stack** — minio bucket `sme-mart-app`, upload SPA build, depends on cloudfront-sim. Angular build uses `environment.stack.ts` configuration.
3. **sme-mart-login stack** — minio bucket `sme-mart-login`, upload login build, depends on cloudfront-sim. Login built with `npm run build` (NOT `--local`).
4. **Angular environment.stack.ts** — new env config file; `angular.json` build configuration entry; `package.json` script (e.g., `npm run build:stack`).
5. **STACKS.md** — real auth flow documented end-to-end: bring-up, login flow trace, cookie inspection, iteration workflow, teardown, troubleshooting.

gsd-plan may consolidate (2)+(4) or split (1) into manifest+nginx-config — Clark's discretion.

---

## Requirements

- **LS-01:** `zbb up sme-mart-spa` brings cloudfront-sim + minio online; `curl http://localhost:<port>/sme-mart/` returns SPA index.html; deep-route refresh (`/sme-mart/rfps/abc123`) returns index.html via `try_files` fallback.
- **LS-02:** ~~Hub module + Verdaccio~~ **DEFERRED to backlog 089** (blocked on Kevin confirming hub-server runtime). SME Mart works fine against real UAT backend without local Hub module.
- **LS-03:** Login served at `localhost:<port>/login/`; user logs in with real UAT credentials; cookies land on `localhost`; navigating to SPA at `localhost:<port>/sme-mart/` has valid session (browser auto-includes cookies); `whoAmI()` returns the logged-in user.
- **LS-04:** `cloudfront-sim` stack reusable — location blocks and backend targets parameterized. Future apps can consume the same stack by specifying their minio bucket + basePath.
- **LS-05:** Env var import/export between stacks follows zbb conventions (`BASE_PATH`, `UAT_ORIGIN`, `MINIO_BUCKET`, etc.).
- **LS-06:** STACKS.md documents bring-up, real auth flow (including cookie inspection in DevTools), iteration (edit SPA → `npm run build:stack` → re-upload → refresh browser), teardown, troubleshooting.

---

## Verification

**Director UAT (before phase close):**
1. `zbb up sme-mart-spa && zbb up sme-mart-login` — both stacks healthy
2. `curl -i http://localhost:<port>/sme-mart/` — 200 + HTML
3. `curl -i http://localhost:<port>/sme-mart/rfps/test-route` — 200 + index.html (deep-route fallback)
4. `curl -i http://localhost:<port>/login/` — 200 + login page HTML
5. Browser: open `http://localhost:<port>/login/`, log in with UAT credentials
6. Browser DevTools → Application → Cookies → verify `Domain: localhost` (not `uat.zerobias.com`)
7. Navigate to `http://localhost:<port>/sme-mart/` — SPA loads with valid session; Network tab shows requests going to `localhost` with cookies attached
8. `zbb stop sme-mart-spa sme-mart-login` — clean teardown

**NOT config-only verification. Stacks MUST actually run.** (WATCH-LIST: "Tests verify code, not feature.")

---

## Out of scope

- Production `zbb` stack configuration (local dev only)
- Hub module local hosting (backlog 089)
- Full backend simulation (UAT is the backend)
- CI integration (future)
- WebSocket-intensive flows (ws upgrade is configured for completeness but not load-tested)

---

## References

**Canonical — must read before planning:**
- `~/Projects/zb/ui/scripts/gateway.js` — reference architecture (node/http-proxy pattern we're mirroring with nginx)
- `~/Projects/zb/ui/src/scripts/proxy-dev.conf.js` — API proxy config (read for contrast; we do NOT inject API keys)
- `~/Projects/zb/clients/packages/zerobias-client/src/zerobias-client-app.ts` — `init()` / `redirectLogin()` / `cookieDomain` flow
- `~/Projects/w3geekery/zerobias-org-forks/login/` — login build output (verify actual path: `dist/` vs `build/`)

**zbb:**
- `~/Projects/zb/zerobias-org/util/packages/zbb/design/{stacks-guide.md, stacks-spec.md, registry-spec.md}`

**Process:**
- `.planning/director/errata/017-phase19-missed-reverse-proxy-pattern.md` — why this is a replan
- Kevin McCarthy Slack 2026-04-13 (backlog 086) — zbb approach sanctioned
- Backlog 089 — deferred hub-server + Verdaccio extension
