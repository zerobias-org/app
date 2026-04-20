# Implementation Plan: zbb Local Stack Composition for SME Mart (Plan 086)

**Date:** 2026-04-13
**Branch:** `poc/sme-mart`
**Source:** `/plan` agent output, hand-off to Clark for confirmation before any code changes.

## Overview

Build a complete local zbb stack that mirrors production SME Mart deployment, enabling end-to-end validation of the published SPA shape, Hub module integration, and CloudFront/S3 asset serving. This unblocks development against the unmerged SME Mart Hub module PR and validates the complete SPA deployment pipeline before publishing is unlocked. Stack composition: `postgres` + `minio` + `registry` (built-in) + `hub-server` + custom `cloudfront-sim` (nginx proxy). Effort: 7-10 hours total (Hub module hosting 4-6 hrs, S3/CloudFront sim 3-4 hrs).

## Requirements

- Spin up Neon stand-in (built-in `postgres`) for SME Mart schema
- Host the unmerged SME Mart Hub module locally via Verdaccio without waiting on upstream PR merge
- Stand up local hub-server that loads SME Mart module from local registry
- Build SPA (app + login repos), push to MinIO S3 bucket, serve via nginx with SPA fallback
- Validate end-to-end: SPA route fallback → hub-server discovery → module API calls → postgres queries
- Enable iteration on basePath, asset URLs, module registration, and Hub module API contracts
- Document deployment shape so we publish immediately once platform unlock happens
- Support both SME Mart `app/` (Angular 21) and `login/` (Metalsmith/Handlebars) SPA paths

## Architecture Changes

- **New custom stack:** `cloudfront-sim` (nginx + SPA fallback + MinIO reverse proxy)
  - Location: `.zbb/stacks/cloudfront-sim/`
  - Compose: `compose.yml`, nginx config, `zbb.yaml` manifest
- **Hub module local publishing workflow** (existing registry stack + new docs)
  - Workflow doc: `.claude/notes/zbb-hub-module-local-publish.md`
  - Hub module source: `~/Projects/w3geekery/zerobias-org-forks/module/package/w3geekery/sme-mart/`
- **SPA build & deployment scripts**
  - Build script: `.zbb/scripts/build-spa.sh` (builds app + login, collects artifacts)
  - Deploy script: `.zbb/scripts/deploy-to-minio.sh` (pushes to MinIO, creates S3 buckets)
- **Test/validation documentation**
  - End-to-end validation guide: `.claude/notes/zbb-sme-mart-e2e-validation.md`
  - Troubleshooting: `.claude/notes/zbb-sme-mart-troubleshooting.md`

## Implementation Steps

### Phase 1: Setup & Infrastructure (Goal: postgres + minio + registry running, SPA buckets bootstrapped)

1. **Create `.zbb/stacks/` directory structure** (`.zbb/stacks/cloudfront-sim/`)
   - Action: Create directories: `cloudfront-sim/`, `cloudfront-sim/nginx/`, `cloudfront-sim/scripts/`
   - Why: Organize custom stack alongside built-in stacks per zbb convention
   - Risk: Low

2. **Write `cloudfront-sim` zbb.yaml manifest** (`.zbb/stacks/cloudfront-sim/zbb.yaml`)
   - Action: Define stack metadata, dependencies (minio, postgres), env vars, exports (CLOUDFRONT_SIM_URL, CLOUDFRONT_SIM_PORT), lifecycle (start/stop/health), logs. Depend on postgres + minio + registry (auto-start). Export `CLOUDFRONT_SIM_URL = "http://localhost:${CLOUDFRONT_SIM_PORT}"`.
   - Why: Declares the stack to zbb, defines ports and exports for consumers (hub-server will import CLOUDFRONT_SIM_URL)
   - Risk: Low — copy postgres pattern, extend with exports

3. **Write nginx.conf for SPA fallback** (`.zbb/stacks/cloudfront-sim/nginx/nginx.conf`)
   - Action: nginx reverse proxy: upstream minio on port 9000, `try_files $uri /index.html` for SPA routes, cache headers for assets, gzip compression. Serve `/app/` (app SPA) and `/login/` (login SPA). Both fallback to index.html for unmapped routes.
   - Why: Simulates CloudFront + S3 behavior
   - Risk: Medium — nginx config syntax. Validate with `nginx -t` before starting.

4. **Write compose.yml for cloudfront-sim** (`.zbb/stacks/cloudfront-sim/compose.yml`)
   - Action: Single nginx service, ports `${CLOUDFRONT_SIM_PORT}:8080`, mount nginx.conf as read-only, depends_on minio, labels for zbb slot tracking.
   - Why: Docker Compose orchestration, integrates with slots shared network
   - Risk: Low

5. **Write SPA build script** (`.zbb/scripts/build-spa.sh`)
   - Action: Build Angular app via `cd app/package/w3geekery/sme-mart && npm run build`. Build login via `cd login/package/w3geekery && npm run build`. Collect dist artifacts into `.zbb/dist/app/` and `.zbb/dist/login/`. Output manifest with built files, versions, build timestamp.
   - Why: Prepare SPA artifacts for deployment to MinIO
   - Risk: Medium — app build config varies (vercel vs standard).

6. **Write MinIO deployment script** (`.zbb/scripts/deploy-to-minio.sh`)
   - Action: Create S3 buckets `sme-mart-app` and `sme-mart-login` in MinIO. Enable CORS. Upload `.zbb/dist/app/` → `sme-mart-app/app/` (prefix). Upload `.zbb/dist/login/` → `sme-mart-login/login/`. Validate via list/head calls.
   - Why: Mirror prod S3 bucket structure and CORS config
   - Risk: Medium — CORS headers, bucket naming, S3 API syntax.

7. **Bootstrap MinIO buckets on cloudfront-sim start** (`.zbb/stacks/cloudfront-sim/scripts/bootstrap.sh`)
   - Action: Called in lifecycle.start. Create buckets, set CORS, set public-read ACL on `/app/` and `/login/` prefixes. Idempotent.
   - Why: Ensure MinIO is ready for SPA artifacts on first startup
   - Risk: Medium — S3 API auth, ACL handling, idempotency.

8. **Validate Phase 1 gate** (manual)
   - Action: `zbb slot create local && zbb slot load local && zbb stack add ./.zbb/stacks/cloudfront-sim && zbb start postgres minio registry cloudfront-sim`. Confirm: postgres healthy (pg_isready), minio healthy, registry healthy, cloudfront-sim nginx responding. Verify MinIO buckets exist.
   - Risk: Low

### Phase 2: Hub Module Local Publishing (Goal: SME Mart Hub module in local Verdaccio, discoverable by hub-server)

9. **Document hub-server registration discovery** (`.claude/notes/zbb-hub-module-discovery.md`)
   - Action: Explain hub-server module discovery: manifest registration API (POST /modules), module metadata from package.json / module.yml, connection profile discovery (GET /modules/{moduleId}/connections). Include SME Mart specifics: package `@zerobias-org/module-w3geekery-sme-mart`, version from package.json, DataProducer (generic SQL) endpoints.
   - Why: Clarify the contract for hub-server to load our local module version
   - Risk: Low — verify against ZB hub-server source

10. **Document SME Mart Hub module local publish workflow** (`.claude/notes/zbb-hub-module-local-publish.md`)
    - Action: Step-by-step: load slot, cd to module source, npm run build, `zbb registry publish`, `zbb registry list` to verify, hub-server pulls from local registry on next npm install. Document same-version override (Verdaccio serves local 1.0.0 instead of upstream 1.0.0), how to switch back to upstream.
    - Why: Enable dev workflow for unmerged Hub module PR
    - Risk: Low

11. **Publish SME Mart Hub module to local registry** (manual execution)
    - Action: `cd module/package/w3geekery/sme-mart && zbb registry publish`. Verify with `zbb registry list`. Confirm `@zerobias-org/module-w3geekery-sme-mart@1.0.0` shows.
    - Risk: Medium — module build may fail on unresolved deps from unmerged PR.

### Phase 3: Hub Server Integration (Goal: local hub-server running, exposing SME Mart module via HTTP)

12. **Add hub-server stack to zbb composition** (`.zbb/stacks/hub-server/zbb.yaml`)
    - Action: Create hub-server stack (or reference if built-in exists). Depends on: registry, postgres, minio, cloudfront-sim. Exports: HUB_SERVER_URL, HUB_SERVER_PORT. Env: HUB_REGISTRY_URL (import from registry), HUB_PORT. Lifecycle: npm install (uses local registry), npm start. Health: `curl -sf http://localhost:${HUB_SERVER_PORT}/health`.
    - Why: Host the Hub API so SME Mart SPA and local testing can call hub modules
    - Risk: High — hub-server initialization, connection profiles, Neon auth.

13. **Configure hub-server module registration** (`.zbb/stacks/hub-server/config/modules.json` or equivalent)
    - Action: Register SME Mart module with hub-server. Either auto-discovery via node_modules scan, or explicit registration via manifest/config. Embed DataProducer connection profile with `${PGHOST}`, `${PGPORT}`, `${PGUSER}`, `${PGPASSWORD}`.
    - Why: Hub-server wont expose the module API unless it knows about it
    - Risk: High — discovery mechanism may differ from assumptions. Verify against ZB hub-server codebase.

14. **Validate Phase 3 gate** (manual)
    - Action: `zbb start hub-server`. Logs: module registered, postgres connection established, listening on HUB_SERVER_PORT. `curl http://localhost:${HUB_SERVER_PORT}/modules` lists SME Mart module. DataProducer endpoint returns schema/root objects. Confirm local module version is in use.
    - Risk: Medium

### Phase 4: SPA Build & Deployment (Goal: SPA artifacts in MinIO, served via cloudfront-sim, loading from hub-server)

15. **Build SME Mart app SPA** (refines `.zbb/scripts/build-spa.sh`)
    - Action: `cd app/package/w3geekery/sme-mart && npm run build`. Verify build target (dev/qa/vercel/prod). Collect dist into `.zbb/dist/app/`. Confirm output: index.html with correct basePath `/app/`, all bundles with correct paths.
    - Risk: Medium — build config and output path vary.

16. **Build SME Mart login SPA** (refines `.zbb/scripts/build-spa.sh`)
    - Action: `cd login/package/w3geekery && npm run build`. Collect output into `.zbb/dist/login/`.
    - Risk: Medium — Metalsmith build process specifics.

17. **Deploy SPA to MinIO** (executes `.zbb/scripts/deploy-to-minio.sh`)
    - Action: Upload `.zbb/dist/app/` → `s3://sme-mart-app/app/`. Upload `.zbb/dist/login/` → `s3://sme-mart-login/login/`. Cache headers: HTML (no-cache), JS/CSS (1 year). Confirm bucket contents and nginx reverse-proxy serving.
    - Risk: Medium

18. **Test SPA routes via cloudfront-sim** (manual)
    - Action: Browser: `http://localhost:${CLOUDFRONT_SIM_PORT}/app/` loads index.html, resolves assets from MinIO. Unmapped route `/app/some-fake-path` falls back to index.html. Same for `/login/`. No 404s. HUB_SERVER_URL correct in app config.
    - Risk: Medium — SPA basePath, CORS, hub-server URL.

### Phase 5: End-to-End Integration (Goal: SPA → hub-server → postgres chain working)

19. **Configure SPA hub-server endpoint** (`.zbb/scripts/set-spa-config.sh` or build-time env)
    - Action: SPA needs HUB_SERVER_URL. Options: build-time env, runtime injection via nginx (replace placeholder in index.html), or hardcode for local. Recommended: script that updates index.html or config JSON before deploy. Example: `sed "s|http://localhost:PLACEHOLDER|${HUB_SERVER_URL}|g" .zbb/dist/app/index.html`.
    - Risk: Medium — verify SPA actually uses injected URL, not hardcoded fallback.

20. **Write end-to-end validation script** (`.zbb/scripts/validate-e2e.sh`)
    - Action: Automated checks: (1) curl cloudfront-sim → 200, contains index.html; (2) curl hub-server /modules → 200, lists SME Mart; (3) call DataProducer API; (4) postgres queries via hub-server (list tables, sample query); (5) optional Playwright SPA load. Output pass/fail summary, latency, errors. Save to `.zbb/validation-results.json`.
    - Risk: Low

21. **Document end-to-end test procedure** (`.claude/notes/zbb-sme-mart-e2e-validation.md`)
    - Action: Step-by-step: build SPA, start stacks, deploy to MinIO, run validation script, interpret results, troubleshoot common failures (hub-server discovery, postgres conn refused, nginx 502, SPA fallback).
    - Risk: Low

22. **Validate Phase 5 gate** (manual)
    - Action: Open SPA in browser, navigate engagement list (requires hub-server call), verify data loads. Network tab shows API requests to hub-server. Hub-server logs show postgres queries. No CORS errors, 404s, or timeouts. Validation script passes.
    - Risk: High

### Phase 6: Documentation & CI Integration (Goal: clear runbook, CI workflow, published docs)

23. **Write quick-start runbook** (`.claude/notes/zbb-sme-mart-quick-start.md`)
    - Action: 5-10 min setup: `zbb slot create local`, `zbb stack add ./.zbb/stacks/cloudfront-sim`, `zbb start`, `bash .zbb/scripts/build-spa.sh && bash .zbb/scripts/deploy-to-minio.sh`, `cd module/... && zbb registry publish`, browser → cloudfront-sim. Outcome: SPA loads, marketplace visible.
    - Risk: Low

24. **Write troubleshooting guide** (`.claude/notes/zbb-sme-mart-troubleshooting.md`)
    - Action: Common issues: nginx 502 (minio not ready), hub-server 404 (module not registered), SPA blank (fallback broken), postgres conn refused, npm install fails (registry token missing). Symptom → root cause → fix. Include log locations, env checks, health checks.
    - Risk: Low

25. **Add GitHub Actions CI workflow (optional)** (`.github/workflows/zbb-e2e.yml`)
    - Action: GHA job: `zbb slot create --ephemeral ci`, add stack, start, build SPA, deploy, validate. Output to PR summary or artifact.
    - Risk: Medium — Docker-in-Docker for zbb in GHA.
    - Note: Phase 6 optional.

26. **Create architecture diagram** (`.claude/notes/zbb-sme-mart-architecture.md`)
    - Action: ASCII or visual diagram: postgres → hub-server, registry → hub-server, minio ↔ nginx (cloudfront-sim) ↔ browser. Show ports, data flows, repo contributions, slot env vars.
    - Risk: Low

## Testing Strategy

- **Unit tests:** None (infrastructure stack)
- **Integration tests (manual):**
  - Phase 1: postgres + minio + registry health, bucket bootstrap
  - Phase 3: hub-server module registration, postgres connection
  - Phase 4: SPA build artifacts, nginx asset serving, SPA route fallback
  - Phase 5: SPA → hub-server, hub-server → postgres, full request latency
- **E2E tests:**
  - Phase 5 validation script (curl + checks)
  - Browser test: load SPA, navigate engagement list, confirm data
  - Optional GHA CI workflow on PR
- **Performance baseline (local):** SPA load ~500ms, API call ~200ms, postgres query ~100ms. No SLOs; just confirm no hangs/timeouts.

## Risks & Mitigations

### Risk 1: Hub-server module discovery mechanism differs from assumptions
- **Symptom:** hub-server starts but SME Mart module not in `/modules`
- **Mitigation:** Before Phase 3, inspect ZB hub-server source to confirm discovery contract. Adapt config/script to actual mechanism. If API-based, add registration call to bootstrap.

### Risk 2: Nginx route fallback breaks SPA routing
- **Symptom:** `/app/some-route` shows 404 instead of index.html
- **Mitigation:** Use proven `try_files $uri $uri/ /index.html =404;`. Test unmapped route in Phase 4 step 18. Check nginx error log on failure.

### Risk 3: MinIO CORS blocks SPA API calls to hub-server
- **Symptom:** "CORS error on http://hub-server/modules" in browser console
- **Mitigation:** Enable `Access-Control-Allow-Origin: *` on MinIO buckets (local dev). If still blocked, route hub-server through nginx (same origin) or proxy via nginx. Ensure SPA HUB_SERVER_URL matches origin.

### Risk 4: Postgres connection from hub-server fails
- **Symptom:** "Connection refused: localhost:5432"
- **Mitigation:** `depends_on: postgres` with `ready_when: status=healthy`. Use container DNS name (`${STACK_NAME}-postgres`) inside compose network, not localhost.

### Risk 5: SPA build config differs from assumed target
- **Symptom:** Wrong output location, or build uses wrong env (vercel vs standard)
- **Mitigation:** Inspect `app/package/w3geekery/sme-mart/angular.json` build target before scripting. If only vercel config exists, add `ng build --configuration dev` target or accept Vercel output and place at `.zbb/dist/app/`.

### Risk 6: SME Mart Hub module build fails on unresolved deps in PR
- **Symptom:** `npm run build` in module → dependency not found in local registry
- **Mitigation:** If `zbb registry publish` fails, distinguish build error vs missing dep. Publish stub for missing dep, or update package.json to available version. Fallback: mock hub-server with test stub.

### Risk 7: Docker network isolation causes cross-stack connectivity issues
- **Symptom:** nginx cant reach minio; hub-server cant reach postgres
- **Mitigation:** All compose files share project name (`-p ${STACK_NAME}`) for shared `${STACK_NAME}_default` network. Use container DNS in nginx upstream and DB connection (e.g., `${STACK_NAME}-minio:9000`).

### Risk 8: Publishing to Verdaccio without correct scope auth
- **Symptom:** `npm publish` → "not authorized: you are not allowed to access @zerobias-org"
- **Mitigation:** Document `zbb registry publish` uses pre-seeded htpasswd (user `zbb`, pass `zbb`). On failure, set `.npmrc`: `//localhost:${REGISTRY_PORT}/:_authToken=fake-local-token`. Debug with `--loglevel verbose`.

### Risk 9: Effort estimate exceeds 10 hours
- **Mitigation:** Prioritize Phase 1 (infra) + Phase 4 (SPA serving) as must-haves. Phases 3, 5 deferrable. Checkpoint after Phase 1. If Phase 3 stalls, mock hub-server stub instead of full integration.

## File Manifest

### New Files

#### `.zbb/stacks/cloudfront-sim/`
- `zbb.yaml` — stack manifest (deps, exports, lifecycle, logs)
- `compose.yml` — nginx service
- `nginx/nginx.conf` — SPA fallback + reverse proxy
- `scripts/bootstrap.sh` — MinIO bucket bootstrap on stack start
- `scripts/setup.sh` — pre-start setup (may be empty or call bootstrap)

#### `.zbb/stacks/hub-server/` (new, or reference built-in if exists)
- `zbb.yaml`
- `compose.yml`
- `config/modules.json`

#### `.zbb/scripts/`
- `build-spa.sh` — build app + login, collect to `.zbb/dist/`
- `deploy-to-minio.sh` — upload SPA, set cache headers
- `validate-e2e.sh` — full-stack validation
- `set-spa-config.sh` — inject HUB_SERVER_URL into SPA config

#### `.claude/notes/`
- `zbb-sme-mart-architecture.md`
- `zbb-hub-module-discovery.md`
- `zbb-hub-module-local-publish.md`
- `zbb-sme-mart-e2e-validation.md`
- `zbb-sme-mart-quick-start.md`
- `zbb-sme-mart-troubleshooting.md`

#### Optional CI
- `.github/workflows/zbb-e2e.yml`

### Directory Structure (post-implementation)

```
.zbb/
├── stacks/
│   ├── cloudfront-sim/
│   │   ├── zbb.yaml
│   │   ├── compose.yml
│   │   ├── nginx/nginx.conf
│   │   └── scripts/{bootstrap.sh,setup.sh}
│   └── hub-server/
│       ├── zbb.yaml
│       ├── compose.yml
│       └── config/modules.json
├── scripts/
│   ├── build-spa.sh
│   ├── deploy-to-minio.sh
│   ├── validate-e2e.sh
│   └── set-spa-config.sh
├── dist/                        # runtime, created by build script
│   ├── app/
│   └── login/
└── validation-results.json      # runtime, created by validate script

.claude/notes/
├── zbb-sme-mart-architecture.md
├── zbb-hub-module-discovery.md
├── zbb-hub-module-local-publish.md
├── zbb-sme-mart-e2e-validation.md
├── zbb-sme-mart-quick-start.md
└── zbb-sme-mart-troubleshooting.md
```

## Success Criteria

- [ ] Phase 1: postgres, minio, registry, cloudfront-sim healthy; MinIO buckets created
- [ ] Phase 2: SME Mart Hub module published to local Verdaccio; visible in `zbb registry list`
- [ ] Phase 3: hub-server starts, loads SME Mart module from local registry; GET /modules returns it
- [ ] Phase 4: SPA (app + login) builds; deployed to MinIO; nginx serves via cloudfront-sim; SPA route fallback works
- [ ] Phase 5: SPA loads in browser; engagement list works without JS errors; API hits hub-server; hub-server queries postgres; validation script passes
- [ ] Phase 6: quick-start runbook 5-10 min end-to-end; troubleshooting covers top 5 issues; architecture diagram clear; optional CI workflow on PR
- [ ] Documentation matches actual implementation
- [ ] App + login serve from `http://localhost:CLOUDFRONT_SIM_PORT/app/` and `/login/` with correct basePath
- [ ] Team can spin up stack in <15 min with 0 surprises

## Implementation Order (Critical Path)

1. **Phase 1** (infrastructure) — prerequisite for all others
2. **Phase 4** (SPA build + serving) — parallelizable with Phase 2-3 after Phase 1
3. **Phase 2** (Hub module publish) — prerequisite for Phase 3
4. **Phase 3** (hub-server) — depends on Phase 2
5. **Phase 5** (e2e validation) — requires Phases 1, 3, 4
6. **Phase 6** (docs + optional CI)

**Parallelizable:** Phases 2 and 4 can develop concurrently after Phase 1.

---

**Status:** Awaiting Clark confirmation before any code changes.
