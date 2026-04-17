# Phase 19: zbb Local Dev Stacks - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning (replan after errata 017)

<domain>
## Phase Boundary

Compose `zbb` stacks that serve SME Mart SPA + white-label login against the real UAT backend through a **single unified origin** (`localhost:<port>`) with nginx reverse-proxy, cookie-domain rewriting, and static-bucket serving. Real login, real cookies, real session — multi-user capable. Backend stays on `uat.zerobias.com`. Hub module local hosting deferred to backlog 089.

</domain>

<decisions>
## Implementation Decisions

### Architecture (locked in brief; see `.planning/director/phase-19-brief.md`)
- **D-01:** Reverse-proxy + unified origin pattern — single nginx at `localhost:<CLOUDFRONT_SIM_PORT>` with location blocks routing to static buckets (`/login/*`, `/sme-mart/*`) AND reverse-proxy to `uat.zerobias.com` (`/api/*`, `/dana/*`, `/app/session`).
- **D-02:** nginx directives required: `proxy_cookie_domain uat.zerobias.com localhost`, `proxy_cookie_flags ~ nosecure`, `proxy_set_header Host uat.zerobias.com`, `proxy_ssl_server_name on`, `proxy_http_version 1.1` + Upgrade/Connection for ws on `/app/session`. SPA try_files fallback per static location.
- **D-03:** No API key injection, no dana-org-id cookie injection. Real login flow — SDK's `redirectLogin()` sends user to `/dana/me/session/login?next=X&cookieDomain=localhost`.
- **D-04:** New Angular env `src/environments/environment.stack.ts` with `isLocalDev: false` + `apiHostname: 'http://localhost:<port>'`. Wire via `angular.json` `stack` build configuration + `npm run build:stack` script.
- **D-05:** Login built with `npm run build` (NOT `--local`) — output at `dist/` (confirmed via `login/package/w3geekery/package.json`).

### Stack Composition (Gray Area A — picked A1 hub-spoke)
- **D-06:** Three stacks:
  1. `@zerobias-com/minio` (shared, existing package) — provides minio instance
  2. `sme-mart-spa` — imports minio + cloudfront-sim; creates bucket `sme-mart-app`; uploads Angular build; writes nginx location conf for `/sme-mart/`
  3. `sme-mart-login` — imports minio + cloudfront-sim; creates bucket `sme-mart-login`; uploads login build; writes nginx location conf for `/login/`
  4. `cloudfront-sim` (new, reusable) — imports minio; runs nginx; includes app-written location conf files via `include /etc/nginx/conf.d/*.conf`; owns the reverse-proxy locations (`/api/`, `/dana/`, `/app/session`)

### Build vs. Upload Split (Gray Area B — picked B1 with adjustment)
- **D-07:** Build is user-invoked via `zbb build <stack>`, NOT auto on `zbb up`. Rationale: Angular builds are 30–90s; login builds a few seconds but cross-repo shell-out shouldn't block a `zbb up`.
- **D-08:** `lifecycle.build` hook runs `npm run build` (or `npm run build:stack` for SPA). `lifecycle.start` (or `setup.sh`) only does `mc cp --recursive <dist>/ local/<bucket>/`.
- **D-09:** Same pattern for SPA and login. `LOGIN_REPO_PATH` + `SPA_REPO_PATH` env vars (or derivable from known zbb slot / repo layout) point the build hook at the right source tree.

### Port Strategy (Gray Area C — picked C1 with adjustment)
- **D-10:** `CLOUDFRONT_SIM_PORT` default **15002** (avoids minio's default 9000 collision; matches prior VALIDATION.md smoke tests). User override via `zbb env set CLOUDFRONT_SIM_PORT <N>` supported.
- **D-11:** Fixed (not zbb-allocated) so URL stays stable session-to-session — prevents cookie/session churn during dev.

### cloudfront-sim Parameterization / Reuse (Gray Area D — picked D1 with clarification)
- **D-12:** **Shared drop-in mechanism** — app stacks write their location block `.conf` file to a shared path mounted into the nginx container. cloudfront-sim's `nginx.conf` contains `include /etc/nginx/conf.d/apps/*.conf`. Each app stack owns one file (e.g., `sme-mart-spa.conf`, `sme-mart-login.conf`).
- **D-13:** Shared path mechanism: **named docker volume** `cloudfront-sim-conf` (or zbb slot-dir bind mount — planner to pick the cleaner option given zbb conventions). Volume is writable by app stack setup scripts, read-only-mounted into nginx container.
- **D-14:** **Reload trigger: nginx reload on app stack start.** App stack `lifecycle.start` appends its `.conf` to the volume, then executes `docker exec <cloudfront-sim-container> nginx -s reload`. Avoids restart and preserves open connections. Planner to verify nginx `-s reload` is sufficient with bind-mount changes.

### Claude's Discretion
- nginx.conf.template variable naming, exact `envsubst` invocation (review B2 fix pattern), container entrypoint layout
- Whether `SPA_REPO_PATH` / `LOGIN_REPO_PATH` default to `$(realpath ../../..)` style or zbb-managed config
- Exact minio `mc` alias setup in setup scripts
- Smoke test script layout (curl sequence matching brief's Verification section)
- Stack dir placement inside the app repo (prior plans used `zbb-stacks/`; planner to confirm or pick)

### Folded Todos
None identified for this phase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture (locked)
- `.planning/director/phase-19-brief.md` — locked architecture v2 (reverse-proxy pattern)
- `.planning/director/errata/017-phase19-missed-reverse-proxy-pattern.md` — root cause of replan; research MUST grep/subagent-sweep `~/Projects/zb/ui/` for gateway/proxy/cookie patterns
- `.planning/director/REVIEW-19.md` — prior review flags/notes (F2 now resolved as D-12, F6 resolved as D-05, N1 resolved as D-10)

### Canonical Reference Code
- `~/Projects/zb/ui/scripts/gateway.js` — canonical unified-origin gateway pattern (node/http-proxy). SME Mart mirrors this with nginx.
- `~/Projects/zb/ui/proxy-dev.conf.js` — API proxy reference. Do NOT replicate API key injection or dana-org-id cookie injection in stack mode.
- `~/Projects/zb/clients/packages/client/src/lib/services/zerobias-client-app.ts` — `init()` / `redirectLogin()` / `getLoginHref()` / `getCookieDomain()` flow. Confirms `isLocalDev: false` routes through real login with `cookieDomain=<location.hostname>`.

### Login Repo (confirmed output dir)
- `~/Projects/w3geekery/zerobias-org-forks/login/package/w3geekery/package.json` — `build` script: `node ./node_modules/@zerobias-com/dana-login-sdk/metalsmith.js`; `start` script confirms output = `dist/`.

### zbb Design Docs
- `~/Projects/zb/zerobias-org/util/packages/zbb/design/stacks-guide.md`
- `~/Projects/zb/zerobias-org/util/packages/zbb/design/stacks-spec.md` — env three-layer model, state model, dependency `ready_when` contract
- `~/Projects/zb/zerobias-org/util/packages/zbb/design/registry-spec.md`

### Existing zbb Stack Examples
- `~/Projects/zb/zerobias-org/util/packages/zbb/stacks/minio/zbb.yaml` + `compose.yml` — reference shape for new stack manifests
- `~/Projects/zb/zerobias-org/util/packages/zbb/stacks/postgres/` — another reference
- `~/Projects/zb/zerobias-org/util/packages/zbb/stacks/registry/` — Verdaccio-style precedent (registry stack = deferred to backlog 089)

### Backlog
- Backlog 089 — deferred hub-server + Verdaccio extension
- `~/.claude/projects/*/memory/reference_zbb_local_stack.md` — zbb local stack priors

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@zerobias-com/minio` stack — exports `MINIO_PORT`, `AWS_ENDPOINT`, `AWS_ACCESS_KEY_ID`, etc. All three new stacks import from here.
- SME Mart `angular.json` already has `dev`, `qa`, `prod`, `vercel` configurations — add `stack` config pointing at `environment.stack.ts`.
- Login's `package/w3geekery/` is the only package currently built; `npm run build` at login repo root runs `lerna run build` which covers it.

### Established Patterns
- Existing zbb stacks use `docker compose` with `${STACK_NAME}` container naming and labels `zerobias.slot: ${STACK_NAME}`.
- Health checks use curl against a known endpoint with interval/timeout in `zbb.yaml` lifecycle section.
- State file contract: `status`, `schema_applied` (n/a for this phase), `endpoints` — cloudfront-sim publishes `endpoints.url = http://localhost:${CLOUDFRONT_SIM_PORT}`.

### Integration Points
- Angular `angular.json` — add `stack` build configuration with `fileReplacements` for `environment.ts` → `environment.stack.ts`.
- `package.json` — add `build:stack` script.
- New directory at repo root or under `zbb-stacks/` holding the three new stack dirs (`cloudfront-sim/`, `sme-mart-spa/`, `sme-mart-login/`). Planner picks final location.

</code_context>

<specifics>
## Specific Ideas

- Mirror `zb/ui/scripts/gateway.js` routing table style in the nginx config — explicit location blocks for `/login/`, `/sme-mart/`, and each upstream prefix.
- Cookie-domain rewrite is the load-bearing line — don't let any plan task drop it.
- Smoke tests must actually curl `localhost:<port>/sme-mart/<deep-route>` and confirm index.html (verify try_files), not just confirm containers are up.

</specifics>

<deferred>
## Deferred Ideas

- Hub module + Verdaccio local stack (backlog 089; blocked on Kevin confirming hub-server runtime).
- WebSocket load testing for `/app/session` upgrade (config is in, not exercised).
- CI integration of zbb stacks.
- Production `zbb` stack packaging.

</deferred>

---

*Phase: 19-zbb-local-dev-stacks*
*Context gathered: 2026-04-17*
