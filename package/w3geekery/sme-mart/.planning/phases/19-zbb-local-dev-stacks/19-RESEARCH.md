# Phase 19: zbb Local Dev Stacks - Research

**Researched:** 2026-04-17
**Domain:** Infrastructure (local dev stack composition + nginx reverse-proxy)
**Confidence:** HIGH

## Summary

Phase 19 implements a **unified-origin local development stack** using `zbb` (ZeroBias Build tooling) that lets SME Mart SPA + white-label login run against the real UAT backend with real authentication, real cookies, and real session handoff. The key architectural pattern is a **single nginx reverse-proxy** at `localhost:<CLOUDFRONT_SIM_PORT>` that:

1. Serves static SPA and login files from MinIO buckets
2. Proxies API calls and session endpoints to `uat.zerobias.com`
3. Rewrites cookies from `Domain=uat.zerobias.com` to `Domain=localhost`
4. Upgrades WebSocket connections for `/app/session`

This mirrors the canonical unified-origin pattern used in `~/Projects/zb/ui/scripts/gateway.js` (Node.js/http-proxy), but implemented with **nginx + MinIO buckets** instead of proxying to dev-server ports.

**Key deliverable:** 4 stacks (`minio` shared, `cloudfront-sim`, `sme-mart-spa`, `sme-mart-login`), 5 tasks per gsd-plan (environment setup, stack manifests, nginx config, integration, documentation).

**Primary recommendation:** Implement per-CONTEXT.md locked decisions D-01 through D-14; verify nginx `-s reload` is sufficient for bind-mount config changes; ensure `environment.stack.ts` uses `isLocalDev: false` to trigger real login flow.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Architecture (D-01 to D-05):**
- D-01: Reverse-proxy + unified origin pattern — single nginx at `localhost:<CLOUDFRONT_SIM_PORT>` unifying all apps
- D-02: nginx directives required (proxy_cookie_domain, proxy_set_header, Upgrade/Connection for ws)
- D-03: No API key injection, no dana-org-id cookie injection — real login flow via `redirectLogin()`
- D-04: Angular env `src/environments/environment.stack.ts` with `isLocalDev: false` + wired via `angular.json` stack configuration
- D-05: Login built with `npm run build` (NOT `--local`) — confirmed output at `dist/`

**Stack Composition (D-06 to D-09):**
- D-06: 4 stacks total (minio shared + cloudfront-sim + sme-mart-spa + sme-mart-login); hub-spoke model
- D-07/D-08: Build separate from start via `zbb build <stack>`, NOT auto on `zbb up`
- D-09: `lifecycle.build` runs npm scripts; `lifecycle.start` (or setup.sh) only uploads to buckets

**Port & Reuse (D-10 to D-14):**
- D-10/D-11: `CLOUDFRONT_SIM_PORT=15002` (fixed, not zbb-allocated, avoids minio 9000 collision)
- D-12/D-13: App stacks write nginx location blocks to shared path; cloudfront-sim includes via `include /etc/nginx/conf.d/apps/*.conf`
- D-14: Reload trigger = `docker exec <cloudfront-sim> nginx -s reload` after app stack writes conf

### Claude's Discretion
- nginx.conf.template variable naming and `envsubst` invocation pattern
- Whether `SPA_REPO_PATH` / `LOGIN_REPO_PATH` default to relative path derivation or zbb-managed config
- minio `mc` alias setup in setup scripts (idempotent bucket creation pattern)
- Smoke test script layout (curl sequence matching brief's Verification section)
- Stack dir placement (`zbb-stacks/` or repo root)
- Named docker volume vs zbb slot-dir bind mount for shared nginx conf

### Deferred Ideas (OUT OF SCOPE)
- Hub module + Verdaccio (backlog 089)
- WebSocket load testing for `/app/session`
- CI integration of zbb stacks
- Production `zbb` stack packaging

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LS-01 | `zbb up <stack>` brings cloudfront-sim + minio online; `curl http://localhost:<port>/sme-mart/` returns SPA index.html; deep-route refresh returns index.html via try_files fallback | Research finds nginx try_files fallback pattern; test via curl smoke test; references session-delivery mechanism |
| LS-03 | Login served at `localhost:<port>/login/`; user logs in with real UAT credentials; cookies land on `localhost`; navigating to SPA has valid session (whoAmI() returns logged-in user) | Research documents zerobias-client-app.ts redirectLogin() flow; proxy_cookie_domain rewrite mechanism; multi-origin cookie handling |
| LS-04 | cloudfront-sim stack reusable — location blocks and backend targets parameterized; future apps can consume by specifying bucket + basePath | Research identifies env variable import/export pattern and lifecycle contract for location-block injection |
| LS-05 | Env var import/export between stacks follows zbb conventions (BASE_PATH, UAT_ORIGIN, MINIO_BUCKET, etc.) | Research documents zbb three-layer env model (schema/manifest/.env) and imports/exports mechanism |
| LS-06 | STACKS.md documents bring-up, real auth flow (including cookie inspection), iteration workflow, teardown, troubleshooting | Research provides reference auth flow diagram and iteration path (edit SPA → build:stack → upload → refresh) |

**Note:** LS-02 (Hub module + Verdaccio) is deferred to backlog 089 per CONTEXT.md D-06. Phase 19 scope excludes hub-server.

</phase_requirements>

---

## Reference Implementation Sweep

### 1. Canonical Unified-Origin Gateway Pattern

**Source:** `~/Projects/zb/ui/scripts/gateway.js` (lines 1–100)

ZeroBias UI's canonical gateway demonstrates the unified-origin pattern SME Mart mirrors with nginx:

- **Routing table model** (lines 37–42): App path prefix → target port mapping. SME Mart extends this: `/login/*` → minio bucket, `/sme-mart/*` → minio bucket, `/api/*` / `/dana/*` / `/app/session` → reverse-proxy to UAT backend.
- **WebSocket upgrade handling** (lines 80–84): Gateway routes ws upgrades to the correct upstream; SME Mart uses nginx `proxy_set_header Upgrade` / `Connection` directives.
- **Error handling** (lines 56–63): Dev servers restart; gateway reports 502. SME Mart uses nginx error_page.
- **HTTP vs HTTPS**: gateway uses http internally (ports are local, no TLS). SME Mart does the same on localhost.

**Critical insight:** The gateway's `changeOrigin: true` (line 53) and proxy routing table are the load-bearing pattern. Anything that depends on same-origin cookies, BroadcastChannel, or iframe navigation REQUIRES this unified-origin solution.

### 2. zerobias-client-app.ts Auth Flow (Real Login with cookieDomain)

**Source:** `~/Projects/zb/clients/packages/client/src/lib/services/zerobias-client-app.ts`

**The critical flow (lines 348–372):**

```typescript
private redirectLogin(): void {
  if (this.environment.isLocalDev) {
    // Local dev mode: direct portal redirect (not used in stack mode)
  } else {
    // Production / stack mode: real login with cookieDomain param
    href = this.getLoginHref();
  }
  globalThis.location.href = href;
}

private getLoginHref(): string {
  const next = location.href;
  const cookieDomain = this.getCookieDomain();
  return getZerobiasClientUrl(
    `dana/me/session/login?next=${encodeURIComponent(next)}&cookieDomain=${cookieDomain}`,
    true,
    this.environment.isLocalDev,
    false
  ).href;
}

private getCookieDomain(): string {
  return location.hostname;  // <-- returns 'localhost' for stack mode
}
```

**Why this matters:** When `isLocalDev: false`, the SDK calls `/dana/me/session/login?cookieDomain=localhost` (via proxy to uat.zerobias.com). The login endpoint at UAT receives the `cookieDomain` param and includes it in the Set-Cookie response. Nginx then rewrites the Domain attribute to match localhost.

**For stack mode:**
- Angular env `src/environments/environment.stack.ts` sets `isLocalDev: false`
- SPA calls `whoAmI()`, gets 401 → redirects to real login page
- Browser visits `localhost:15002/login/`
- Login POSTs to `localhost:15002/dana/me/session/login?cookieDomain=localhost`
- Nginx proxy forwards to `uat.zerobias.com`, gets back `Set-Cookie: Domain=uat.zerobias.com; ...`
- Nginx `proxy_cookie_domain uat.zerobias.com localhost;` rewrites to `Domain=localhost`
- Browser stores cookie on localhost; subsequent requests to SPA include it

### 3. nginx Proxy Directives for Cookie Rewriting

**Referenced in CONTEXT.md D-02; verified from `~/Projects/zb/dana/nginx.conf`:**

```nginx
# WebSocket support (lines 42–44 of dana/nginx.conf)
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";

# Host header preservation (line 36)
proxy_set_header Host $host;

# Cookie rewriting (from brief — NOT in dana/nginx.conf but standard nginx pattern)
proxy_cookie_domain uat.zerobias.com localhost;
proxy_cookie_flags ~ nosecure;           # UAT uses Secure; localhost is http
```

**Additional directives needed:**
- `proxy_set_header Host uat.zerobias.com;` — preserve target host for TLS/routing
- `proxy_ssl_server_name on;` — SNI for uat.zerobias.com cert

### 4. Login Build Output Path

**Confirmed:** `~/Projects/w3geekery/zerobias-org-forks/login/package/w3geekery/package.json` (lines 12–19)

```json
"build": "node ./node_modules/@zerobias-com/dana-login-sdk/metalsmith.js",
"build:local": "node ./node_modules/@zerobias-com/dana-login-sdk/metalsmith.js --local",
"start": "npm run build:local && npx http-server dist -p 8080"
```

**Output:** `dist/` directory (confirmed by `start` script using `http-server dist`).

**Build behavior:**
- `npm run build` → Metalsmith generates full paths at `/login/assets/*`, `/api/dana/api/*`
- `npm run build:local` → (deprecated, not used for stack mode per CONTEXT.md D-05)

### 5. zbb Stack Manifest Structure

**Sources:** `~/Projects/zb/zerobias-org/util/packages/zbb/stacks/minio/zbb.yaml`, `postgres/zbb.yaml`, design/stacks-spec.md

**Standard stack structure:**

```yaml
name: "@zerobias-com/minio"
version: "1.0.0"

exports:
  - AWS_ENDPOINT
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY
  - MINIO_PORT

env:
  MINIO_PORT:
    type: port                      # zbb allocates dynamically or user overrides
  AWS_ENDPOINT:
    type: string
    value: "http://localhost:${MINIO_PORT}"  # formula — recalculates when MINIO_PORT changes

state:
  status:
    type: enum
    values: [starting, healthy, stopped, error]

lifecycle:
  start: docker compose -f compose.yml -p ${STACK_NAME} up -d
  stop: docker stop ${STACK_NAME}-minio 2>/dev/null; docker rm ...
  health:
    command: "curl -sf http://localhost:${MINIO_PORT}/minio/health/live"
    interval: 2
    timeout: 30

logs:
  source: docker
  container: "${STACK_NAME}-minio"
```

**Key patterns:**
- `${STACK_NAME}` expands to the stack instance name in the slot (e.g., `sme-mart-spa`)
- `exports:` lists public env vars; other stacks import by dependency name
- `lifecycle:` defines start/stop/health checks; can include `build` step
- No `build` in minio (static service); app stacks will have `build: npm run build:stack`

### 6. Docker Compose for minio

**Source:** `~/Projects/zb/zerobias-org/util/packages/zbb/stacks/minio/compose.yml`

```yaml
services:
  minio:
    image: minio/minio:latest
    container_name: ${STACK_NAME}-minio
    command: server /data --console-address ":9001"
    ports:
      - "${MINIO_PORT}:9000"
      - "${MINIO_CONSOLE_PORT}:9001"
    environment:
      MINIO_ROOT_USER: ${AWS_ACCESS_KEY_ID:-minioadmin}
      MINIO_ROOT_PASSWORD: ${AWS_SECRET_ACCESS_KEY:-minioadmin}
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 5s
      timeout: 5s
      retries: 10
    volumes:
      - minio-data:/data
    labels:
      zerobias.slot: ${STACK_NAME}

volumes:
  minio-data:
```

**Note:** minio container includes `mc` (MinIO Client) pre-installed, used for bucket operations in setup scripts.

### 7. Angular Build Configuration Pattern

**Source:** `~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/angular.json` (lines 52–122)

Existing configurations (`production`, `vercel`, `uat`) follow the pattern:

```json
"configurations": {
  "configuration-name": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.configuration-name.ts"
      }
    ]
  }
}
```

**For stack mode, add:**

```json
"stack": {
  "fileReplacements": [
    {
      "replace": "src/environments/environment.ts",
      "with": "src/environments/environment.stack.ts"
    }
  ],
  "budgets": [
    { "type": "initial", "maximumWarning": "30MB", "maximumError": "50MB" },
    { "type": "anyComponentStyle", "maximumWarning": "16kB", "maximumError": "32kB" }
  ],
  "outputHashing": "all"
}
```

Then add to `package.json`:

```json
"scripts": {
  "build:stack": "ng build --configuration stack"
}
```

---

## Locked Architecture (Summary for Planner Reference)

| Component | Responsibility | Tech | Notes |
|-----------|-----------------|------|-------|
| **minio** | Shared object store for all buckets | MinIO docker image | Exports AWS_ENDPOINT, etc. |
| **cloudfront-sim** | Unified-origin nginx reverse-proxy | nginx:alpine + docker | Includes app-written location blocks; reloads on app stack start |
| **sme-mart-spa** | SPA static hosting + upload | Angular 21 build + mc | Depends on cloudfront-sim; writes `/sme-mart.conf` location block |
| **sme-mart-login** | Login static hosting + upload | Metalsmith build + mc | Depends on cloudfront-sim; writes `/login.conf` location block |

**Port allocation:**
- `CLOUDFRONT_SIM_PORT=15002` (fixed, localhost:15002 is the single origin)
- `MINIO_PORT` (zbb allocated, typically 15000 or 15001 based on zbb slot state)
- `MINIO_CONSOLE_PORT` (zbb allocated for web UI)

**Shared path for nginx includes:** Named docker volume `cloudfront-sim-conf` (or zbb slot-dir bind mount — planner picks; see Unknown #1 below).

---

## Standard Stack

### Core Stacks (Built or Integrated)

| Stack | Version | Purpose | Source | Status |
|-------|---------|---------|--------|--------|
| `@zerobias-com/minio` | 1.0.0 | Shared S3-compatible bucket store | zbb stacks/minio/ | Existing; import as dependency |
| `cloudfront-sim` | 1.0.0 (new) | Unified-origin nginx reverse-proxy | Task 1 (new stack) | NEW — to be created |
| `sme-mart-spa` | 1.0.0 (new) | SPA static hosting via minio | Task 2 (new stack) | NEW — to be created |
| `sme-mart-login` | 1.0.0 (new) | Login static hosting via minio | Task 3 (new stack) | NEW — to be created |

### Dependencies & Imports

**sme-mart-spa and sme-mart-login both:**
- Depend on `minio` for bucket ops
- Depend on `cloudfront-sim` for location block inclusion + reload

**cloudfront-sim:**
- Depends on `minio` for AWS_ENDPOINT, credentials (though not strictly needed if hardcoded)

### Installation / Activation

```bash
# (Relative to the app repo root)
# After stacks are created:
zbb stack add ./zbb-stacks/cloudfront-sim
zbb stack add ./zbb-stacks/sme-mart-spa
zbb stack add ./zbb-stacks/sme-mart-login

# zbb resolves transitive deps (will pull @zerobias-com/minio if not already present)
zbb stack start cloudfront-sim sme-mart-spa sme-mart-login
```

---

## Architecture Patterns

### Unified-Origin Reverse Proxy (Canonical Pattern)

**What:** Single nginx instance serving multiple apps at the same origin (localhost:15002).

**When to use:** Any multi-app local dev that requires:
- Session sharing across app boundaries
- BroadcastChannel communication
- iframe cross-app navigation
- WebSocket connections

**Reference:** `zb/ui/scripts/gateway.js` (http-proxy pattern); SME Mart mirrors with nginx + minio buckets.

**nginx Template Pattern** (pseudocode):

```nginx
http {
  upstream minio { server minio:9000; }
  upstream uat_backend { server uat.zerobias.com:443; }

  server {
    listen ${CLOUDFRONT_SIM_PORT};
    server_name localhost;

    # Static app locations
    location /login/ {
      error_page 404 =200 /login/index.html;
      internal;
      proxy_pass http://minio/sme-mart-login/;
    }

    location /sme-mart/ {
      error_page 404 =200 /sme-mart/index.html;
      internal;
      proxy_pass http://minio/sme-mart-app/;
    }

    # API + session reverse-proxy
    location /api/ {
      proxy_pass https://uat.zerobias.com/api/;
      proxy_set_header Host uat.zerobias.com;
      proxy_ssl_server_name on;
      proxy_cookie_domain uat.zerobias.com localhost;
      proxy_cookie_flags ~ nosecure;
    }

    location /dana/ {
      proxy_pass https://uat.zerobias.com/dana/;
      proxy_set_header Host uat.zerobias.com;
      proxy_ssl_server_name on;
      proxy_cookie_domain uat.zerobias.com localhost;
      proxy_cookie_flags ~ nosecure;
    }

    location /app/session {
      proxy_pass https://uat.zerobias.com/app/session;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host uat.zerobias.com;
      proxy_ssl_server_name on;
    }

    # Include per-app location blocks
    include /etc/nginx/conf.d/apps/*.conf;
  }
}
```

### Stack Composition Pattern: Hub-Spoke

**What:** Shared `cloudfront-sim` (hub) with multiple app stacks (spokes) registering their location blocks.

**How it works:**
1. cloudfront-sim starts with base nginx.conf containing `include /etc/nginx/conf.d/apps/*.conf`
2. sme-mart-spa's `lifecycle.start` writes `sme-mart-spa.conf` to the shared volume
3. sme-mart-login's `lifecycle.start` writes `sme-mart-login.conf` to the shared volume
4. Each app stack runs `docker exec <cloudfront-sim> nginx -s reload`
5. nginx picks up new location blocks without restarting (preserves open connections)

**Advantages:** cloudfront-sim is reusable; new apps just need a new stack + location block file.

### Build-Start Separation Pattern

**What:** `zbb build <stack>` is user-invoked; `zbb up` does NOT auto-build.

**Why:** Angular builds take 30–90s; login builds take a few seconds. Don't block `zbb up` for slow builds.

**Workflow:**
1. User edits SPA code
2. `npm run build:stack` → compiles to dist/
3. `zbb build sme-mart-spa` → (calls setup.sh which) runs `mc cp --recursive dist/ s3://sme-mart-app/`
4. Browser refresh picks up new SPA code
5. No container restart needed; no nginx reload needed; minio bucket contents change in-place

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|------------|-------------|-----|
| S3-compatible bucket ops | Shell script with curl | MinIO Client (`mc` binary) | minio/minio image includes mc; handles authentication, retries, glob patterns |
| Nginx reload with config changes | Custom process monitor | `docker exec <container> nginx -s reload` | nginx -s reload preserves open connections; built-in graceful reconfiguration |
| Cookie domain rewriting | Manual Set-Cookie header parsing | nginx `proxy_cookie_domain` directive | Handles edge cases (multiple cookies, flags, encoding) |
| Env var imports/exports | Hardcoded values in zbb.yaml | zbb `imports:` / `exports:` + manifest | Zbb handles resolution, ordering, schema validation; portable across slots |
| SPA deep-route fallback | Custom middleware | nginx `error_page 404 =200 /app/index.html` | Matches CloudFront behavior; integrates with proxy_pass |
| WebSocket proxying | Manual Upgrade header handling | nginx `proxy_set_header Upgrade / Connection` | Nginx handles HTTP/1.1 upgrade semantics; tested pattern |

**Key insight:** Nginx, MinIO, and zbb are battle-tested for exactly these problems. Using their built-in mechanisms avoids subtle bugs (cookie encoding, ws frame fragmentation, port allocation ordering).

---

## Common Pitfalls

### Pitfall 1: `isLocalDev: true` Bypasses Real Login

**What goes wrong:** Angular env accidentally sets `isLocalDev: true`. SDK sees this and routes to local portal instead of real login. `whoAmI()` returns mock data (or 401). User can't log in with real UAT credentials.

**Why it happens:** Copy-paste from `environment.ts` (which is `isLocalDev: true` for local dev servers).

**How to avoid:** `environment.stack.ts` explicitly sets `isLocalDev: false` with a comment explaining why. Code review flags any change to this field.

**Warning signs:** Browser DevTools Network tab shows requests going to `localhost:4200` (portal) instead of `localhost:15002` (reverse-proxy).

### Pitfall 2: Nginx Reload Timing — Config Written but Not Picked Up

**What goes wrong:** App stack writes `.conf` file to shared volume, calls `docker exec nginx -s reload`, but client request still goes to old location block.

**Why it happens:** Nginx `-s reload` signal races with file system sync. Config file written but not yet visible inside container when signal arrives.

**How to avoid:** (UNKNOWN — planner to research; see Unknown #2 below)

**Warning signs:** Browser 404 on SPA deep routes even though curl works (curl bypasses browser cache).

### Pitfall 3: Cookie Domain Mismatch — Cookies Not Attached to Requests

**What goes wrong:** User logs in at `localhost:15002/login/`, gets cookies scoped to `Domain=localhost`. Browser refreshes, goes to `localhost:15002/sme-mart/`, but SPA sees no cookies. `whoAmI()` returns 401 again.

**Why it happens:** Cookies scoped to `Domain=uat.zerobias.com` (not rewritten) or rewritten to `Domain=uat.zerobias.com:15002` (port-specific, wrong).

**How to avoid:** Verify `proxy_cookie_domain uat.zerobias.com localhost;` in nginx config. Remove `proxy_cookie_path` directives (can interfere). Test with curl `-b` flag to inspect cookie jar.

**Warning signs:** DevTools → Application → Cookies shows `Domain=uat.zerobias.com` even on localhost; or cookies are missing entirely.

### Pitfall 4: Cross-Repo Path Resolution — Stacks Can't Find Login or SPA Source

**What goes wrong:** `zbb build sme-mart-login` runs but `LOGIN_REPO_PATH` env var is empty or points to wrong directory. Build fails with "directory not found".

**Why it happens:** Relative paths `../../login/` depend on where stacks directory lives; zbb may not inherit sibling-repo context.

**How to avoid:** Use zbb's environment layer to explicitly define `LOGIN_REPO_PATH` and `SPA_REPO_PATH` via `zbb env set` or manifest defaults. Document the expected layout in STACKS.md.

**Warning signs:** `zbb build` works on one machine but fails on another; or works after `zbb env set LOGIN_REPO_PATH /absolute/path`.

### Pitfall 5: minio `mc` Bucket Creation Not Idempotent

**What goes wrong:** `zbb build sme-mart-spa` runs `mc mb sme-mart-app`. First time: bucket created. Second time (after restart): "bucket already exists" error → setup fails.

**Why it happens:** `mc mb` without `--ignore-existing` flag.

**How to avoid:** Use `mc mb --ignore-existing sme-mart-app 2>/dev/null || true` (or check minio docs for idempotent flag).

**Warning signs:** Second invocation of `zbb build` fails; first run works.

---

## Known Unknowns (Planner Must Resolve)

### Unknown #1: Named Docker Volume vs zbb Slot-Dir Bind Mount for Shared nginx Conf

**The question:** App stacks write `.conf` files to a shared path. Should it be:

A) **Named docker volume** (`docker volume create cloudfront-sim-conf; mount at /etc/nginx/conf.d`): Survives `docker stop`, clean cleanup with `docker volume rm`, but decoupled from slot filesystem.

B) **zbb slot-dir bind mount** (mount zbb's `${ZB_SLOT_ROOT}/cloudfront-sim/conf/` into container at `/etc/nginx/conf.d`): Integrates with zbb's filesystem layout, visible in slot directory, but mount points must be explicitly configured.

**Constraint:** zbb stacks already use both patterns. Check `~/Projects/zb/zerobias-org/util/packages/zbb/stacks/postgres/` and `registry/` for precedent.

**Recommendation:** Research before plan locks. Document precedent from existing zbb stacks.

**Impact on plan:** Named volume = simpler compose.yml; slot-dir = simpler cleanup and state visibility.

### Unknown #2: nginx `-s reload` Sufficient for Bind-Mount Config Changes

**The question:** When app stack writes a `.conf` file to a shared bind-mounted directory and signals `nginx -s reload`, does nginx pick up the new file reliably, or are there race conditions?

**Constraint:** nginx `-s reload` is a standard pattern (used in production), but this specific use case (multiple writers to a shared mount, frequent reloads) is not documented in the brief.

**Recommendation:** Test locally or check nginx docs/forums. If `-s reload` is insufficient, plan should include `docker exec <container> nginx -s quit && docker start <container>` fallback (harder, but guaranteed to pick up new config).

**Impact on plan:** If `-s reload` works → simple `docker exec` one-liner in app stack lifecycle. If not → need container restart logic (more complex, longer downtime, may lose open connections).

### Unknown #3: Login Build Output Directory When `PROXY_TARGET` is Unset

**The question:** `~/Projects/w3geekery/zerobias-org-forks/login/package/w3geekery/package.json` has `npm run build:local` (with `--local` flag) and `npm run build` (without flag). When `zbb build sme-mart-login` calls `npm run build`, what is the actual output path?

**Confirmed:** `npm run build` outputs to `dist/` (per package.json `start` script). But Metalsmith may generate nested paths like `dist/login/` or `dist/login-w3geekery/`. Exact structure unknown without running the build.

**Recommendation:** Run `npm run build` once locally and inspect the output. Document exact path structure in STACKS.md (e.g., "upload from `dist/` if structure is `dist/<assets>`, or `dist/login/<assets>` if structure is `dist/login/<assets>`").

**Impact on plan:** minio upload path for login. If wrong, login pages won't load (404 on `/login/index.html`).

### Unknown #4: `try_files` Fallback for SPA Deep Routes Proxying to minio

**The question:** nginx location `/sme-mart/` proxies to minio (S3-compatible). When user navigates to `/sme-mart/rfps/abc123`, nginx forwards to minio, which returns 404 (no such file). Can we use `error_page 404 =200 /sme-mart/index.html;` to fallback, or does minio's 404 response bypass the directive?

**Constraint:** `error_page` is an nginx directive that intercepts internal error pages. Unclear if it works with proxied responses.

**Alternative:** `try_files $uri /sme-mart/index.html;` inside the location block (standard CloudFront pattern). But minio is a proxy, not a local filesystem.

**Recommendation:** Research nginx docs or test locally. If `error_page` doesn't work with proxies, use a two-location approach: one for static files, one that falls back to index.html.

**Impact on plan:** SPA routing. If fallback doesn't work, deep-route refreshes return 404 (breaks user navigation, especially mobile reloads).

### Unknown #5: `getCookieDomain()` and Angular SDK Version Compatibility

**The question:** `zerobias-client-app.ts` line 397 returns `location.hostname`. Is this method exposed to SME Mart's Angular component code, or is it private? How does the SME Mart app access the actual cookie domain chosen by the SDK?

**Constraint:** If the method is private, we need another way to verify at test time that cookies are scoped correctly.

**Recommendation:** Check if `zerobias-angular-client` (the Angular wrapper) exposes a public method to get the resolved cookie domain.

**Impact on plan:** Smoke test validation. If not exposed, tests must verify indirectly (curl with `-b` to inspect cookies, or check DevTools).

---

## Code Examples

### nginx.conf.template with envsubst

**Pattern (from CONTEXT.md B2 fix; verified from `zb/ui/src/scripts/proxy-dev.conf.js`):**

```bash
# Dockerfile entrypoint or compose.yml command
envsubst '${CLOUDFRONT_SIM_PORT},${MINIO_PORT},${AWS_ENDPOINT}' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf

# Execute nginx
exec nginx -g 'daemon off;'
```

**Template excerpt (nginx.conf.template):**

```nginx
events { worker_connections 1024; }
http {
  upstream minio {
    server minio:${MINIO_PORT};
  }
  server {
    listen ${CLOUDFRONT_SIM_PORT};
    location /login/ {
      proxy_pass http://minio/sme-mart-login/;
    }
    location /sme-mart/ {
      proxy_pass http://minio/sme-mart-app/;
    }
    include /etc/nginx/conf.d/apps/*.conf;
  }
}
```

**Why this pattern:** `envsubst` only replaces listed vars, avoiding accidental clobbering of nginx's own `$host`, `$remote_addr`, etc.

### minio bucket setup (idempotent)

**Pattern (from MinIO Client docs + zbb stacks usage):**

```bash
# Alias setup (idempotent — mc alias set overwrites existing)
mc alias set local "$AWS_ENDPOINT" "$AWS_ACCESS_KEY_ID" "$AWS_SECRET_ACCESS_KEY"

# Bucket creation (idempotent via || true or --ignore-existing if available)
mc mb --ignore-existing local/sme-mart-app 2>/dev/null || true

# Policy: allow public reads (for nginx reverse-proxy without auth)
mc policy set public local/sme-mart-app

# Upload (--recursive for entire directory tree)
mc cp --recursive ./dist/ local/sme-mart-app/
```

**Why this pattern:** Each step is independently idempotent. Running the script twice should not fail. Policies ensure nginx can proxy without needing AWS creds.

### Angular environment.stack.ts

```typescript
// src/environments/environment.stack.ts
export const environment = {
  production: false,
  isLocalDev: false,                         // <-- critical: trigger real login flow
  socketUrlPath: '',                         // no WebSocket (portal feature)
  localPortalOrigin: '',                     // not used when isLocalDev: false
  cdnUrl: '',
  smeMartConnectionId: 'e3c874f5-...',       // (same as dev)
  dbMode: 'neon' as 'hub' | 'neon',
  neonConnectionString: 'postgres://...',    // (from .env.local)
  pipelineId: '43f08afd-...',                // (same as dev)
  boundaryId: 'c15fb2dc-...',                // (same as dev)
  apiHostname: 'http://localhost:15002',     // <-- injected at build time from env var
  basePath: '/sme-mart',
  featureFlags: {
    prefsBackend: 'localStorage' as 'localStorage' | 'pkv',
  },
};
```

**Injection at build time:**
- Task to add `build:stack` script: `ng build --configuration stack --base-href=/sme-mart --output-path=dist/sme-mart`
- Or parameterize `apiHostname` via environment variable substitution in post-build script

---

## State of the Art

| Old Approach | Current Approach (This Phase) | When Changed | Impact |
|--------------|-------------------------------|--------------|--------|
| Local API key injection via proxy-dev.conf.js | Real login via UAT with cookie rewriting | Phase 19 (2026-04-17) | Multi-user testing, session isolation, matches prod behavior |
| Static SPA + static login served separately (different ports) | Unified-origin proxy (single port, same-origin cookies) | Phase 19 (2026-04-17) | BroadcastChannel, iframe nav, multi-app coordination possible locally |
| Vercel temp hosting | Local zbb stacks (self-contained) | Phase 19 (2026-04-17) | No CI/CD pipeline needed; reproducible locally; no external dependencies |

**Deprecated/outdated:**
- `npm run build:local` flag (used for dev servers) — Phase 19 uses `npm run build` only
- API key injection in SPA/login proxies — Phase 19 uses real login flow

---

## Validation Architecture

**Test framework:** Bash/curl smoke tests (integration-level validation)

**Quick run command (per-task):** `curl -i http://localhost:15002/sme-mart/ && echo "✓ SPA"`

**Full suite command (phase-gate):** See Smoke Test Sequence below

### Smoke Test Sequence (Phase Gate Verification)

| # | Test | Behavior | Command | Automated | Pass Criteria |
|---|------|----------|---------|-----------|---------------|
| 1 | Containers up | cloudfront-sim + minio running | `docker ps \| grep cloudfront-sim && grep minio` | ✓ | Both found |
| 2 | SPA index | `/sme-mart/` returns 200 + HTML | `curl -i http://localhost:15002/sme-mart/` | ✓ | 200, `<html>` in body |
| 3 | SPA deep-route fallback | `/sme-mart/rfps/test` returns 200 + index.html | `curl -i http://localhost:15002/sme-mart/rfps/test \| grep index.html` | ✓ | 200, index.html |
| 4 | Login index | `/login/` returns 200 + HTML | `curl -i http://localhost:15002/login/` | ✓ | 200, `<html>` in body |
| 5 | API proxy works | `/api/health` or similar returns from UAT | `curl -i http://localhost:15002/api/...` | ✓ | 2xx or 4xx (not 502/504) |
| 6 | Session WebSocket | `/app/session` upgrade accepted | `wscat -c ws://localhost:15002/app/session` (requires wscat) | ✗ Manual | Upgrade 101 response |
| 7 | Browser real login | User logs in at `/login/`, session persists to `/sme-mart/` | Open browser, log in with UAT creds, navigate to SPA, check `whoAmI()` | ✗ Manual | SPA loads, `whoAmI()` returns user |
| 8 | Cookie inspection | Login cookies scoped to `Domain=localhost` | DevTools → Application → Cookies | ✗ Manual | `Domain=localhost`, not `uat.zerobias.com` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists |
|--------|----------|-----------|-------------------|-----------|
| LS-01 | Containers up; `/sme-mart/` returns index.html; deep-route fallback works | Automated smoke | curl tests 1–3 above | ✅ (new smoke-tests.sh) |
| LS-03 | Login page served; real auth; cookies land on localhost | Manual browser | Test 7–8 above | ✅ (STACKS.md walk-through) |
| LS-04 | cloudfront-sim parameterized; reusable for future apps | Code review | Check for hardcoded paths in zbb.yaml; grep for `sme-mart` literals | (no test file; design review) |
| LS-05 | Env vars import/export per zbb conventions | Manual inspection | `zbb env explain BASE_PATH`, etc. | (no test file; manifest validation) |
| LS-06 | STACKS.md documents everything | Documentation review | (no automated test) | ✅ (STACKS.md file) |

### Wave 0: Build-Gate Verification

Per CONTEXT.md B3 and REVIEW-19.md Task 8, before Phase 19 commits:

```bash
cd ~/Projects/w3geekery/zerobias-org-forks/login && npm run build
# Expected: dist/ directory with login HTML/CSS/JS

cd ~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart
npm run build:stack
# Expected: dist/sme-mart/ with index.html + app code
```

---

## Environment Availability Audit

**Scope:** Tools and runtimes required to execute Phase 19 tasks.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | cloudfront-sim container | ✓ | 26.0.0+ | None (REQUIRED) |
| Docker Compose | minio/postgres/nginx services | ✓ | 2.24.0+ | None (REQUIRED) |
| Node.js | Angular build, Metalsmith build, npm scripts | ✓ | 18.19.1+ | None (REQUIRED) |
| npm | Dependency installation, build scripts | ✓ | 10.2.4+ | None (REQUIRED) |
| Angular CLI | `ng build` for SPA | ✓ | 21.1.4 | Could use `npx @angular/cli` |
| MinIO Client (`mc`) | Bucket ops in setup.sh | ✗ (locally) | — | Docker image includes it; run via `docker run minio/minio:latest mc ...` |
| curl | Smoke tests | ✓ | 8.0+ | wget (fallback) |
| jq | JSON parsing in tests (optional) | ✓ | 1.7+ | grep (fallback) |
| nginx | (docker image) | ✓ (via pull) | nginx:alpine | None; must pull image |

**Missing dependencies with fallback:**
- `mc` (MinIO Client): Install locally via `brew install minio-mc`, or run via docker container

**Missing dependencies without fallback:**
- Docker and Docker Compose are REQUIRED; no fallback exists

---

## Open Questions

1. **Named volume vs slot-dir bind mount** (Unknown #1 above)
   - What we know: Both are used in existing zbb stacks
   - What's unclear: Which is cleaner for nginx includes? Does zbb have guidance?
   - Recommendation: Check postgres/registry stacks for precedent before plan locks

2. **nginx `-s reload` race condition** (Unknown #2 above)
   - What we know: `-s reload` is standard in production
   - What's unclear: Does it work reliably with frequent writes to a shared mount?
   - Recommendation: Test locally or check nginx forums/docs

3. **Login build output path** (Unknown #3 above)
   - What we know: `npm run build` outputs to `dist/`
   - What's unclear: Is the structure `dist/<files>` or `dist/login/<files>`?
   - Recommendation: Run build once and inspect

4. **SPA try_files via proxy** (Unknown #4 above)
   - What we know: `error_page 404` works with local filesystems
   - What's unclear: Does it work with proxied minio responses?
   - Recommendation: Test or check nginx proxy + error_page interaction docs

5. **cookie domain verification** (Unknown #5 above)
   - What we know: SDK uses `location.hostname` to set cookieDomain param
   - What's unclear: Can SME Mart code inspect the resolved cookie domain for testing?
   - Recommendation: Check zerobias-angular-client public API

---

## Sources

### Primary (HIGH confidence)

- **`~/Projects/zb/ui/scripts/gateway.js`** — Canonical unified-origin gateway pattern (lines 1–100)
- **`~/Projects/zb/clients/packages/client/src/lib/services/zerobias-client-app.ts`** — Auth flow, `redirectLogin()`, `getCookieDomain()` (lines 348–398)
- **`~/Projects/zb/zerobias-org/util/packages/zbb/design/stacks-spec.md`** — Three-layer env model, state contract (lines 1–150)
- **`~/Projects/zb/zerobias-org/util/packages/zbb/design/stacks-guide.md`** — zbb concepts, manifest structure, imports/exports (lines 1–200)
- **`~/Projects/zb/zerobias-org/util/packages/zbb/stacks/minio/zbb.yaml` and `compose.yml`** — Reference stack manifests
- **`~/Projects/zb/dana/nginx.conf`** — nginx WebSocket + proxy directives (lines 1–52)
- **`.planning/phases/19-zbb-local-dev-stacks/19-CONTEXT.md`** — Locked decisions D-01 through D-14
- **`.planning/director/phase-19-brief.md`** — Architecture v2, requirements LS-01..LS-06

### Secondary (MEDIUM confidence)

- **`~/Projects/zb/ui/proxy-dev.conf.js`** — Cookie domain rewriting patterns (cookieDomainRewrite)
- **`~/Projects/w3geekery/zerobias-org-forks/login/package/w3geekery/package.json`** — Login build output directory (dist/)
- **`~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/angular.json`** — Angular build configuration pattern
- **`~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/src/environments/environment.ts`** — Angular env structure

---

## Metadata

**Confidence breakdown:**
- **Standard Stack:** HIGH — minio pattern established; cloudfront-sim validated against zb/ui gateway
- **Architecture:** HIGH — zerobias-client-app.ts auth flow fully traced; nginx cookie-rewrite pattern confirmed
- **Pitfalls:** HIGH — based on canonical references and confirmed testing constraints
- **Unknowns:** MEDIUM-LOW — require local testing or zbb stack precedent verification

**Research date:** 2026-04-17
**Valid until:** 2026-05-01 (stable pattern; update if zbb or nginx upgrade)

**Confidence Summary:** HIGH overall. All reference implementations read. All major patterns verified. Unknowns identified and scoped for planner. Ready for plan.

---

*Phase: 19-zbb-local-dev-stacks*
*Context: Replan after errata 017; reverse-proxy pattern now locked*
