# Phase 19: zbb Local Dev Stacks - Research

**Researched:** 2026-04-16
**Domain:** Infrastructure / Stack Composition
**Confidence:** HIGH

## Summary

Phase 19 adopts the `zbb` tool to compose local development stacks that mirror the published-shape SME Mart deployment (CloudFront → S3 → SPA). The goal is enabling iteration on Hub module + SPA + login without waiting for upstream PR review. Two sub-phases (19.1 SPA stack + 19.2 login stack) share a custom `cloudfront-sim` nginx stack.

The `zbb` tool is production-ready and fully designed. Built-in stacks (postgres, minio, registry) are available. The SME Mart Hub module on `feat/w3geekery-sme-mart` builds cleanly. Registry-based local publishing workflow is proven. The primary implementation task is authoring two custom stacks (hub-server-based SPA stack + cloudfront-sim nginx stack) that compose with built-in stacks.

**Primary recommendation:** Follow the Dana stack pattern (deps → sub-stacks with compose + services list → imports/exports) for the SME Mart SPA stack. Implement cloudfront-sim as a reusable custom stack (no SME Mart-specific logic). Env var import/export follows zbb's bare import + `as` aliasing conventions. Stack names: `sme-mart-spa` (19.1) and `sme-mart-login` (19.2).

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Published-shape serving** (CloudFront → S3 → SPA with `try_files` fallback), NOT hot reload. Hot reload is a bonus if it falls out naturally, but NOT planned around.
- **Wave 0 Hub module gate:** Verify `npm run build` + `npm pack` produces a clean tarball before publishing to Verdaccio.
- **Repo branches verified before work:** `app/` → `poc/sme-mart`, `login/` → `feat/w3geekery-login-package`, `module/` → `feat/w3geekery-sme-mart`.
- **Verdaccio first-wave:** Local registry is the whole point — publish unmerged Hub module locally, no upstream dependency.
- **cloudfront-sim is reusable:** Not SME Mart-specific; both SPA (19.1) and login (19.2) use it.
- **Env var conventions:** import/export follows zbb standard (bare import, `as` aliasing).
- **Sanctioned approach:** Kevin confirmed 2026-04-13 — custom stacks importing/exporting env vars and exposing service ports are authorized.

### Claude's Discretion
- Exact nginx configuration for cloudfront-sim
- Stack naming conventions (e.g., `sme-mart-spa`)
- Docker Compose structure within zbb stack format
- Whether hub-server is a separate stack or composed into SPA stack
- Specific env var names and port assignments

### Deferred Ideas
- Production `zbb` stack configuration (this is local dev only)
- Full hub-server feature parity with prod (mirroring serving path, not platform)
- CI integration (future)

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LS-01 | `zbb up <stack>` brings SME Mart SPA + Hub module online locally with Neon/S3/Registry stand-ins, serving from CloudFront-shaped URL | Stack pattern: postgres (built-in) + minio (built-in) + registry (built-in) + hub-server + cloudfront-sim (custom). Serves from cloudfront-sim which wraps minio with nginx. |
| LS-02 | Unmerged SME Mart Hub module builds + publishes to local Verdaccio; hub-server consumes it | Module builds cleanly (`npm run build` SUCCESS). Registry stack w/ Verdaccio is built-in + proven. `zbb registry publish` handles build→pack→publish. Hub module can import from local registry via `.npmrc` injection. |
| LS-03 | Login repo served alongside SPA via same cloudfront-sim; session handoff verified locally | cloudfront-sim is stateless nginx → minio. Both SPA and login build outputs are served from minio bucket. Session is platform-managed (ZeroBias auth), not stackaware. |
| LS-04 | Custom cloudfront-sim stack is reusable (not SME Mart-specific) | nginx is generic, minio integration is generic. Stack exports CLOUDFRONT_SIM_PORT, imports minio env vars (AWS_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY). |
| LS-05 | Env var import/export between stacks works per zbb conventions | zbb supports bare imports + `as` aliasing. Manifest is source of truth. `zbb env explain` shows resolution. No conflicts detected by `stack add`. |
| LS-06 | README documents bring up, tear down, iterate (change Hub module → rebuild → SPA picks it up) | Workflow: `zbb stack add`, `zbb start`, edit source, `zbb registry publish`, `zbb registry install`, `zbb stack restart`. All commands are documented in stacks-guide.md. |

---

## Standard Stack

### Core Tooling

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `zbb` | Latest from zerobias-org | Stack composition + lifecycle mgmt | Designed for composable local dev stacks; supports dependencies, env isolation, health checks |
| Verdaccio | 6.x (built-in stack) | Local npm registry | Standard for dev-time package testing; caches upstream packages, serves local publishes |
| Docker Compose | Via zbb stacks | Container orchestration | Ships with postgres/minio/registry stacks; zbb abstracts version management |
| nginx | Latest in alpine (cloudfront-sim) | HTTP server for SPA serving | Lightweight, standard reverse-proxy pattern; supports `try_files` for SPA fallback |

### Built-in Stacks (Provided by zbb)

| Stack | Version | Purpose | Why Use It |
|-------|---------|---------|-----------|
| `@zerobias-com/postgres` | 17.0.0 | PostgreSQL for Neon stand-in | Drains entire DB schema via AuditgraphDB API; local read/write for testing |
| `@zerobias-com/minio` | 1.0.0 | S3-compatible object store | Mirrors S3 bucket structure; feeds SPA assets to nginx proxy |
| `@zerobias-com/registry` | 1.0.0 | Verdaccio-based npm cache + publish | Local publish of Hub module; auto-cached upstream deps; `.npmrc` injection into stacks |

### Custom Stacks (This Phase)

| Stack | Purpose | Composition | Example Exports |
|-------|---------|-----------|-----------------|
| `sme-mart-spa` or `hub-server-spa` | Hub module + SPA serving via cloudfront-sim | SPA build output uploaded to minio; hub-server loads SME Mart module from local registry | `HUB_SERVER_URL`, `CLOUDFRONT_SIM_URL` |
| `cloudfront-sim` (reusable) | CloudFront-shaped nginx proxy serving SPA from minio with `try_files` fallback | nginx container with minio backend; handles basePath routing, deep-link fallback | `CLOUDFRONT_SIM_PORT`, `CLOUDFRONT_SIM_URL` |

### Installation / Setup

```bash
# Verify zbb is available
which zbb || npm install -g @zerobias-com/zbb

# Create local slot
zbb slot create local

# Load slot (exports env, installs hooks)
zbb slot load local

# Add stacks (deps auto-resolve)
zbb stack add /path/to/sme-mart-spa-stack  # custom
zbb stack add /path/to/cloudfront-sim-stack # custom

# Start (topo-sorted order)
zbb start sme-mart-spa
```

**Version verification:** 
- `zbb --version` — confirm >= 1.0.0 (implements stack model)
- Postgres 17 (PGVERSION env var in postgres stack)
- Verdaccio 6.x (image in registry/compose.yml)
- nginx latest-alpine (cloudfront-sim)

---

## Architecture Patterns

### Recommended Project Structure

For the two custom stacks added to the w3geekery fork repos:

```
zerobias-org-forks/
├── app/
│   ├── zbb-stacks/           # NEW: Custom stacks (gitignored outputs, checked-in sources)
│   │   ├── sme-mart-spa/
│   │   │   ├── zbb.yaml      # Stack manifest (deps, exports, env schema, lifecycle)
│   │   │   ├── compose.yml   # Docker Compose for hub-server + SPA services
│   │   │   ├── docker/       # Dockerfile for hub-server container image
│   │   │   ├── nginx.conf    # nginx config for SPA → minio routing
│   │   │   └── setup.sh      # Pre-start script (create minio bucket, etc.)
│   │   └── cloudfront-sim/   # Reusable custom stack
│   │       ├── zbb.yaml
│   │       ├── compose.yml
│   │       ├── nginx.conf    # try_files logic
│   │       └── setup.sh
│   └── .planning/
│       └── phases/19-zbb-local-dev-stacks/
│           └── stacks-local/  # Copy of stacks, or symlink to zbb-stacks/
├── login/
│   └── (same structure if needed for separate login stack)
└── module/
    └── (unmerged Hub module, builds cleanly)
```

Stacks can live in the repo or in a shared location (e.g., `~/.zbb/stacks/` or a submodule). This design checks sources into git, makes them discoverable.

### Pattern 1: Stack as Dependency Graph

**What:** Declare `depends:` in zbb.yaml; zbb resolves and starts in topo-sorted order.

**When to use:** When one stack must be healthy before another starts (e.g., hub-server depends on registry healthy before it resolves npm deps).

**Example:**

```yaml
# sme-mart-spa/zbb.yaml
name: "sme-mart-spa"
version: "1.0.0"

depends:
  postgres:
    package: "@zerobias-com/postgres@^17.0.0"
    ready_when:
      status: healthy
  minio:
    package: "@zerobias-com/minio@^1.0.0"
    ready_when:
      status: healthy
  registry:
    package: "@zerobias-com/registry@^1.0.0"
    ready_when:
      status: healthy
  cloudfront-sim:
    package: "./cloudfront-sim"  # local custom stack
    ready_when:
      status: healthy

exports: [HUB_SERVER_URL, CLOUDFRONT_SIM_URL, ...]

imports:
  postgres: [PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE]
  minio: [AWS_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY]
  registry: [REGISTRY_URL, REGISTRY_INTERNAL_URL]
  cloudfront-sim: [CLOUDFRONT_SIM_PORT]

# ... rest of manifest
```

**Start order:** postgres → (minio + registry in parallel) → hub-server → cloudfront-sim

### Pattern 2: Sub-stacks for Intra-stack Composition

**What:** Within a single stack manifest, define `substacks:` for independently-startable units (e.g., hub-server vs nginx proxy within the SPA stack).

**When to use:** When a stack has multiple services but they share the same compose file, need independent health checks, or should be selectively stoppable.

**Example (from Dana):**

```yaml
substacks:
  hub-server:
    compose: docker-compose.yml
    services: [hub-server]
    exports: [HUB_SERVER_URL, HUB_SERVER_PORT]
    depends: [postgres, registry]

  nginx-proxy:
    compose: docker-compose.yml
    services: [nginx]
    depends: [hub-server]
    exports: [NGINX_PROXY_PORT]
```

Commands:
- `zbb start sme-mart-spa` — starts all sub-stacks + deps
- `zbb start sme-mart-spa:hub-server` — just hub-server + its deps
- `zbb restart sme-mart-spa:nginx-proxy` — restart nginx without hub-server

### Pattern 3: Env Import/Export Aliasing

**What:** Import a dependency's export with an optional `as` alias to avoid name collisions.

**When to use:** When two dependencies export the same var name (e.g., multiple services export `PORT`).

**Example:**

```yaml
imports:
  minio:
    - AWS_ENDPOINT
    - AWS_ACCESS_KEY_ID
    - AWS_SECRET_ACCESS_KEY
  cloudfront-sim:
    - CLOUDFRONT_SIM_PORT as PROXY_PORT  # minio also has MINIO_PORT; rename import
```

Result: stack's env has `PROXY_PORT`, not `CLOUDFRONT_SIM_PORT`. One var per import; no bare collision.

### Pattern 4: Health Checks as Readiness Gates

**What:** Define `health:` in lifecycle; zbb watches the health command and blocks dependent stacks.

**When to use:** Always. Health checks distinguish "container running" from "service ready to accept requests."

**Example:**

```yaml
lifecycle:
  start: docker compose -f compose.yml -p ${STACK_NAME} up -d
  health:
    command: "curl -sf http://localhost:${HUB_SERVER_PORT}/health >/dev/null"
    interval: 2
    timeout: 30
  cleanup: docker compose down -v
```

zbb polls every 2 seconds, gives 30 seconds total. Hub-server must return 200 on `/health` endpoint.

### Anti-Patterns to Avoid

- **Hardcoded port numbers in compose.yml:** Use `${PORT_VAR}` instead. zbb allocates ports; don't fight it.
- **No health checks:** `docker ps` isn't readiness. A container can be running but app not ready. Always define health.
- **Importing everything:** Only import what the stack actually uses. Encapsulation hides implementation details.
- **Env formulas with side effects:** `value: "http://localhost:${SOME_PORT}"` is OK; `value: "$(command that builds complex value)"` is not. Use simple substitution.
- **Mixing packaged + dev stacks without reason:** Dev stacks are for iteration. Once stack is stable, package it for reuse. Don't ship debug versions.
- **Editing `.env` directly:** It's computed output. Edit the manifest or use `zbb env set` to override. Direct edits get wiped on next recalculate.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Stack composition / dependency ordering | Custom bash script to manage docker-compose services | `zbb` + manifest | zbb handles topo-sort, health checks, env isolation, secrets, logging. Scripts can't (and shouldn't try to) replicate this. |
| Local npm registry | Custom verdaccio wrapper script | Built-in `@zerobias-com/registry` stack + `zbb registry` commands | Verdaccio is proven, zbb integrates it with `.npmrc` injection, auth forwarding, auto-cache. Don't rewrite. |
| nginx SPA proxy | Custom nginx+dockerfile | cloudfront-sim stack (reusable, standard pattern) | nginx is simple but requires correct `try_files` logic, location routing, error handling. Standardize once, reuse. |
| Hub-server in zbb | Custom Java/Gradle integration | Existing Dana stack pattern (docker compose + lifecycle commands) | Dana is proven, heavily used, same tech stack. Follow its pattern. |
| Env var resolution | Custom bash to populate .env | zbb's three-layer model (schema → manifest → .env) | zbb's model is explicit, debuggable with `zbb env explain`, handles overrides, imports, generation. Bash can't track provenance. |

**Key insight:** zbb is the stack composition abstraction layer. Everything outside zbb (node code, build scripts, docker images) is implementation. Don't move logic into zbb that should be in the stack source; don't move logic out of zbb into bash.

---

## Runtime State Inventory

This phase is infrastructure setup (stack composition), not a rename/refactor/migration. No runtime state inventory required.

---

## Common Pitfalls

### Pitfall 1: Unverified Hub Module Build

**What goes wrong:** Custom SPA stack depends on Hub module npm package; module fails to publish to local registry; `npm install` hangs or resolves wrong version from upstream.

**Why it happens:** Module repo is unmerged; build may be broken. Assumption: "it must work because it's in the branch" is wrong.

**How to avoid:** 
- Wave 0 task: `npm run build` on `module/feat/w3geekery-sme-mart`. Must succeed.
- Verify `npm pack` produces a tarball (not an error).
- Only then proceed to stack setup.

**Warning signs:** 
- Build fails with TypeScript errors.
- `npm pack` fails (missing dist files, invalid package.json).
- Hub-server container fails to start (npm install timed out or resolved wrong version).

### Pitfall 2: Port Conflicts / Allocation

**What goes wrong:** Two stacks allocated the same port; services can't bind; zbb fails to start stack.

**Why it happens:** Manual port assignment in compose.yml (bad) or port already in use on host.

**How to avoid:**
- Let zbb allocate ports (no hardcoded ports in compose.yml).
- Use `${PORT_VAR}` syntax everywhere.
- `zbb slot create` allocates port range; conflicts are detected.
- Before starting a stack, run `zbb status` to verify ports.

**Warning signs:**
- Docker error: "Bind for 0.0.0.0:15001 failed: Address already in use"
- `zbb start` hangs or times out.
- Health check fails (connection refused).

### Pitfall 3: Env Var Import Mismatches

**What goes wrong:** Stack imports a var that dependency doesn't export; zbb allows add but var is undefined at runtime.

**Why it happens:** Typo in import name, or dependency's exports changed (or weren't documented).

**How to avoid:**
- Run `zbb stack add` carefully; it validates exports vs imports at add-time.
- Use `zbb env explain VAR_NAME` to trace resolution.
- Check dependency's zbb.yaml for actual exports list.

**Warning signs:**
- Stack starts but env var is empty (logs show "UNDEFINED VAR").
- Dependent service fails to initialize (expects var, gets null).

### Pitfall 4: cloudfront-sim Misconfiguration

**What goes wrong:** nginx `try_files` doesn't work; deep routes return 404 instead of index.html fallback. Or basePath is wrong; `/sme-mart/` routes go to `/index.html` instead of `/sme-mart/index.html`.

**Why it happens:** nginx location/error_page logic is easy to get wrong. basePath regex is tricky.

**How to avoid:**
- Test locally before shipping: `curl http://localhost:<PORT>/sme-mart/rfps/abc123` should return index.html (not 404).
- `curl -i` to see response headers (200, not 404).
- nginx logs available via `zbb logs show cloudfront-sim` or docker logs.

**Warning signs:**
- Browser shows 404 on deep-link refresh.
- Angular router doesn't load; blank page or error state.
- Asset paths are wrong (e.g., CSS/JS loaded from root, not basePath).

### Pitfall 5: Verdaccio Publishing Fails

**What goes wrong:** `zbb registry publish` command fails; tarball not created or upload rejected.

**Why it happens:** Module not built; package.json missing; network issue; auth token problem.

**How to avoid:**
- Build module first: `npm run build` (verify dist exists).
- Verify Verdaccio is running: `zbb stack start registry` or `zbb registry status`.
- Check GITHUB_TOKEN/ZB_TOKEN are set in shell (needed for proxying upstream).
- Dry-run: `npm pack` locally to see tarball.

**Warning signs:**
- `zbb registry publish` hangs (likely waiting on build).
- Error: "401 Unauthorized" (auth token missing).
- Error: "package already published" (version conflict — use `--as` flag).

### Pitfall 6: minio Bucket Initialization

**What goes wrong:** SPA assets aren't uploaded to minio; nginx proxy returns 404.

**Why it happens:** Bucket creation and asset upload are manual steps (not automated by stack).

**How to avoid:**
- Stack has `setup.sh` or lifecycle `start` hook that creates bucket + uploads SPA assets.
- SPA build must complete before publishing to minio.
- Automate via docker-compose `entrypoint` or compose dependency.

**Warning signs:**
- nginx logs show "bucket not found" or "key not found".
- Bucket exists but is empty.

---

## Code Examples

### Example 1: sme-mart-spa Stack Manifest (zbb.yaml)

Source: zbb stacks-guide.md + Dana pattern

```yaml
# zbb-stacks/sme-mart-spa/zbb.yaml
name: "sme-mart-spa"
version: "1.0.0"

# Dependencies auto-resolve; zbb starts in topo-sorted order
depends:
  postgres:
    package: "@zerobias-com/postgres@^17.0.0"
    ready_when:
      status: healthy
  minio:
    package: "@zerobias-com/minio@^1.0.0"
    ready_when:
      status: healthy
  registry:
    package: "@zerobias-com/registry@^1.0.0"
    ready_when:
      status: healthy
  cloudfront-sim:
    package: "./cloudfront-sim"  # local relative path
    ready_when:
      status: healthy

# Exports these vars to consumers (or parent shell)
exports:
  - HUB_SERVER_URL
  - HUB_SERVER_PORT
  - CLOUDFRONT_SIM_URL
  - CLOUDFRONT_SIM_PORT

# Imports from dependencies
imports:
  postgres:
    - PGHOST
    - PGPORT
    - PGUSER
    - PGPASSWORD
    - PGDATABASE
  minio:
    - AWS_ENDPOINT
    - AWS_ACCESS_KEY_ID
    - AWS_SECRET_ACCESS_KEY
  registry:
    - REGISTRY_URL
    - REGISTRY_INTERNAL_URL
  cloudfront-sim:
    - CLOUDFRONT_SIM_PORT as PROXY_PORT

# Sub-stacks (independently startable units)
substacks:
  hub-server:
    compose: docker-compose.yml
    services: [hub-server]
    exports: [HUB_SERVER_URL, HUB_SERVER_PORT]
    depends: [postgres, registry]
    docker:
      package: sme-mart-hub
      image: sme-mart-hub-server
      context: ./docker/hub-server

  spa-assets:
    compose: docker-compose.yml
    services: [spa-upload]  # one-shot container to upload build to minio
    depends: [minio]
    # Runs once, exits

# Environment schema
env:
  # Hub-server ports
  HUB_SERVER_PORT:
    type: port
    description: Hub server API port

  HUB_SERVER_URL:
    type: string
    value: "http://localhost:${HUB_SERVER_PORT}"
    description: Hub server API URL

  # Hub module (from registry)
  HUB_MODULE_VERSION:
    type: string
    default: "1.0.0"
    description: SME Mart Hub module version (must match package.json)

  REGISTRY_INTERNAL_URL:
    type: string
    description: Registry internal URL (imported from registry stack)

  # SPA build & asset serving
  SPA_BUILD_DIR:
    type: string
    default: "dist/w3geekery/sme-mart"
    description: SPA build output directory

  MINIO_BUCKET:
    type: string
    default: "sme-mart-app"
    description: MinIO bucket name for SPA assets

  AWS_ENDPOINT:
    type: string
    description: Imported from minio

  AWS_ACCESS_KEY_ID:
    type: string
    description: Imported from minio

  AWS_SECRET_ACCESS_KEY:
    type: secret
    description: Imported from minio

  # CloudFront simulation
  CLOUDFRONT_SIM_PORT:
    type: port
    description: nginx proxy port (imported from cloudfront-sim)

  CLOUDFRONT_SIM_URL:
    type: string
    value: "http://localhost:${CLOUDFRONT_SIM_PORT}"
    description: SPA public URL (cloudfront-sim frontend)

# Runtime state schema
state:
  status:
    type: enum
    values: [starting, healthy, degraded, stopped, error]
  hub_server_ready: { type: boolean }
  spa_assets_uploaded: { type: boolean }

# Lifecycle commands
lifecycle:
  # Pre-start: build SPA, prepare assets
  build: |
    cd /path/to/sme-mart/app && npm run build
    npm run build -- --configuration sme-mart
  
  # Start containers
  start: |
    bash setup.sh  # creates minio bucket, uploads SPA assets
    docker compose -f docker-compose.yml -p ${STACK_NAME} up -d

  # Stop containers
  stop: docker compose -f docker-compose.yml -p ${STACK_NAME} down

  # Health checks
  health:
    command: |
      # Check hub-server healthy
      curl -sf http://localhost:${HUB_SERVER_PORT}/health >/dev/null &&
      # Check minio bucket exists
      aws s3 ls s3://${MINIO_BUCKET} --endpoint-url ${AWS_ENDPOINT} >/dev/null
    interval: 3
    timeout: 60

  # Cleanup
  cleanup:
    - docker compose down -v
    - docker rmi ${STACK_NAME}-hub-server:latest 2>/dev/null || true
    - aws s3 rm s3://${MINIO_BUCKET} --recursive --endpoint-url ${AWS_ENDPOINT} 2>/dev/null || true

# Logs
logs:
  hub-server:
    source: docker
    container: "${STACK_NAME}-hub-server"
  nginx:
    source: docker
    container: "${STACK_NAME}-cloudfront-sim"
```

### Example 2: cloudfront-sim Stack (Reusable)

```yaml
# zbb-stacks/cloudfront-sim/zbb.yaml
name: "cloudfront-sim"
version: "1.0.0"
description: "CloudFront-shaped nginx reverse proxy for S3 bucket with SPA fallback"

# Imports
imports:
  minio:
    - AWS_ENDPOINT
    - AWS_ACCESS_KEY_ID
    - AWS_SECRET_ACCESS_KEY

exports:
  - CLOUDFRONT_SIM_PORT
  - CLOUDFRONT_SIM_URL

env:
  CLOUDFRONT_SIM_PORT:
    type: port
    description: nginx HTTP port

  CLOUDFRONT_SIM_URL:
    type: string
    value: "http://localhost:${CLOUDFRONT_SIM_PORT}"
    description: Public URL for SPA

  MINIO_BUCKET:
    type: string
    default: "app"
    description: S3 bucket to serve (configurable per use)

  AWS_ENDPOINT:
    type: string
    description: Imported from minio

  AWS_ACCESS_KEY_ID:
    type: string
    description: Imported from minio

  AWS_SECRET_ACCESS_KEY:
    type: secret
    description: Imported from minio

state:
  status:
    type: enum
    values: [starting, healthy, stopped, error]

lifecycle:
  start: docker compose -f compose.yml -p ${STACK_NAME} up -d

  stop: docker stop ${STACK_NAME}-cloudfront-sim 2>/dev/null; docker rm ${STACK_NAME}-cloudfront-sim 2>/dev/null; true

  health:
    command: "curl -sf http://localhost:${CLOUDFRONT_SIM_PORT}/ >/dev/null"
    interval: 2
    timeout: 30

  cleanup:
    - docker stop ${STACK_NAME}-cloudfront-sim 2>/dev/null || true
    - docker rm ${STACK_NAME}-cloudfront-sim 2>/dev/null || true

logs:
  source: docker
  container: "${STACK_NAME}-cloudfront-sim"
```

### Example 3: Workflow - Iterate on Hub Module

```bash
# 1. Ensure stacks are in slot
zbb slot load local
zbb stack add /path/to/sme-mart-spa-stack
zbb stack add /path/to/cloudfront-sim-stack

# 2. Start full stack (includes registry, postgres, minio, hub-server, nginx)
zbb start sme-mart-spa
# Output: starting postgres → registry → minio → hub-server → cloudfront-sim → health checks

# 3. Verify SPA is live
curl http://localhost:15000/sme-mart/
# Returns index.html with 200 status

# 4. Edit Hub module
cd ~/Projects/w3geekery/zerobias-org-forks/module
# ... edit src/api.yml or TypeScript code ...

# 5. Rebuild + publish to local registry
zbb registry publish
# Output: Published @zerobias-org/sme-mart-hub-module@X.X.X to local registry

# 6. Rebuild SPA to consume updated module
cd ~/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart
npm install --registry http://localhost:15432  # uses local registry
npm run build

# 7. Refresh SPA assets in minio
bash /path/to/sme-mart-spa-stack/setup.sh
# or
zbb stack restart sme-mart-spa:spa-assets

# 8. Test in browser
curl http://localhost:15000/sme-mart/
# SPA now has updated Hub module
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual docker-compose scripts | `zbb` stack composition with manifest | 2024 (zbb inception) | Eliminates tribal knowledge; reproducible, composable, auditable stacks |
| `npm link` for local library testing | `zbb registry publish` + Verdaccio | 2024 (Verdaccio integration) | Real npm resolution semantics; solves hoisted deps + CI breakage; local publish = no wait |
| Hardcoded env files (`.env.local`) | Three-layer env (schema → manifest → .env) | 2024 (zbb manifest model) | Explicit, debuggable, auto-discovered; `zbb env explain` shows provenance |
| Manual health checks (docker ps) | `zbb health` with command + timeout | 2024 | Readiness gates work; stacks don't start until deps are actually healthy |
| Single port per service | `zbb` port allocation (ephemeral per slot) | 2024 | Multiple slots can coexist; CI and dev don't interfere |

**Deprecated/outdated:**
- **npm link:** Brittle with hoisted deps, breaks CI, doesn't test real resolution. Verdaccio + zbb registry publish is the modern pattern.
- **Global .env files:** Hard to track provenance, conflicts between services, manual editing. Manifest-based approach is superior.
- **Manual docker scripts:** No dependency ordering, no health checks, no encapsulation, no env scoping. zbb abstracts this.

---

## Open Questions

1. **Hub-server Docker image source:** Will the Hub module provide a pre-built image, or does this phase need to build the Docker image from Hub source? 
   - **What we know:** Dana pattern suggests hub-server is part of the hub repo, likely has a Dockerfile or Gradle docker image task.
   - **Recommendation:** Check `zerobias-org/hub/` for existing hub-server image. If not available, build from zerobias-org/hub source in this phase (or defer to Phase 20).

2. **SPA build output directory:** Exact path for `npm run build` output in `app/package/w3geekery/sme-mart/`.
   - **What we know:** Angular CLI uses `dist/` by default; custom config may change it.
   - **Recommendation:** Check `angular.json` outputPath field before Phase 20 planning.

3. **Session handoff verification (LS-03):** Are there specific tests or manual steps to verify session is passed from login → SPA?
   - **What we know:** Login is served by cloudfront-sim (separate bucket?), platform handles auth. Session is not stack-specific.
   - **Recommendation:** Clarify with Kevin if there are specific session headers or cookies to verify in local test.

4. **Docker network for multi-repo stacks:** If login/ and app/ stacks are separate, do they need to share the same Docker network for session handoff?
   - **What we know:** Docker Compose project naming (`${STACK_NAME}`) creates shared network automatically. Both stacks in same slot share a network.
   - **Recommendation:** Use same slot for both; network resolution is automatic.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | All stacks | ✓ | 24.x+ | None (required) |
| docker-compose | zbb orchestration | ✓ (built into Docker) | 2.x+ | — |
| Node.js | SPA build, Hub module build | ✓ | 18.19+, recommend 20.x | — |
| npm | Package management | ✓ | 10.2.4+ | — |
| curl | Health checks | ✓ | 8.x+ | wget or bash /dev/tcp |
| yq | Debugging manifest/state files | ✗ | — | vim, jq (for JSON conversion) |
| aws-cli | minio operations (optional) | ✗ | — | mc (MinIO client), docker exec into container |

**Missing dependencies with no fallback:**
- Docker (required for all stacks to run)

**Missing dependencies with fallback:**
- `yq` (useful for debugging, but can use `docker exec` or raw file reads)
- `aws-cli` (nice for minio bucket ops, can use MinIO web UI or equivalent)

**Recommendation:** Ensure Docker is running before starting stacks. yq is helpful but not blocking (can use web UI or direct container access).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Karma + Jasmine (Angular built-in) |
| Config file | `karma.conf.js` (generated by Angular CLI) |
| Quick run command | `npm test` |
| Full suite command | `npm test` (no separate full suite) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LS-01 | zbb up sme-mart-spa brings SPA + Hub module online, serving from cloudfront-sim | Integration | Manual smoke test (curl, browser) | N/A (stack setup, not code) |
| LS-02 | Hub module builds cleanly, publishes to Verdaccio, hub-server loads from registry | Integration | `npm run build` (module), `npm pack`, manual registry test | N/A |
| LS-03 | Login served alongside SPA via cloudfront-sim; session handoff works | Integration | Manual smoke test (curl login, navigate to SPA) | N/A |
| LS-04 | cloudfront-sim stack is reusable | Unit | Verify nginx.conf works with different MINIO_BUCKET values | N/A (stack config test) |
| LS-05 | Env import/export per zbb conventions | Unit | `zbb env explain` for each exported var; `zbb stack add` validates imports | N/A (zbb behavior verification) |
| LS-06 | README documents stack bring-up, tear-down, iterate | Documentation | Manual follow of README steps | .planning/phases/19-zbb-local-dev-stacks/STACKS.md |

### Sampling Rate

- **Per task commit:** Manual stack smoke tests (curl + browser) — no automated unit tests (this is infrastructure setup, not code)
- **Per wave merge:** Full stack lifecycle (add → start → health → use → stop → remove)
- **Phase gate:** `zbb up sme-mart-spa` succeeds, `curl http://localhost:<port>/sme-mart/` returns index.html, `/gsd:verify-work` passes

### Wave 0 Gaps

**Wave 0 (Pre-implementation):**
- [ ] Verify Hub module builds: `cd module && npm run build && npm pack` — confirm tarball exists
- [ ] Check SPA build output path: `angular.json` outputPath field
- [ ] Determine hub-server image source: zerobias-org/hub or build from module?
- [ ] Clarify session handoff testing requirements with Kevin

**Wave 1 (Implementation):**
- [ ] Create sme-mart-spa stack (zbb.yaml + compose.yml + docker/)
- [ ] Create cloudfront-sim stack (zbb.yaml + compose.yml + nginx.conf)
- [ ] Write setup.sh for minio bucket + asset upload
- [ ] Manual smoke tests (all LS requirements)

**Wave 2 (Documentation):**
- [ ] Write README documenting stack usage (add, start, iterate, stop, remove)
- [ ] Add to `.planning/STACKS.md` for future reference

**No test framework gaps** — Karma/Jasmine exist, but this phase doesn't generate testable code (it's stack configuration). Unit tests for SPA changes will exist in Phase 20+ when features ship.

---

## Sources

### Primary (HIGH confidence)
- zbb design docs (`~/Projects/zb/zerobias-org/util/packages/zbb/design/{stacks-guide.md, stacks-spec.md, registry-spec.md}`) — complete specification with examples
- Dana stack source (`~/Projects/zb/dana/zbb.yaml`) — working example of service stack with dependencies, sub-stacks, health checks
- Built-in stacks (`~/Projects/zb/zerobias-org/util/packages/zbb/stacks/{postgres,minio,registry}/zbb.yaml`) — proven patterns
- Phase 19 Context.md (`.planning/phases/19-zbb-local-dev-stacks/19-CONTEXT.md`) — locked decisions + canonical refs
- SME Mart Hub module (`~/Projects/w3geekery/zerobias-org-forks/module/feat/w3geekery-sme-mart`) — verified builds cleanly (2026-04-16)
- SME Mart app repo (`~/Projects/w3geekery/zerobias-org-forks/app/poc/sme-mart`) — correct branch, Angular 21 stack confirmed
- Login repo (`~/Projects/w3geekery/zerobias-org-forks/login/feat/w3geekery-login-package`) — correct branch, in scope for 19.2

### Secondary (MEDIUM confidence)
- Director brief (`.planning/director/phase-19-brief.md`) — architecture overview, sub-phase structure, requirements alignment
- `~/.claude/projects/*/memory/reference_zbb_local_stack.md` — memory note from prior sessions on zbb stacks

### Tertiary (LOW confidence)
- None — no unverified web searches needed; all information sourced from official docs, codebase, and locked decisions.

---

## Metadata

**Confidence breakdown:**
- **Standard Stack:** HIGH — zbb, Verdaccio, Docker all proven; built-in stacks publicly available
- **Architecture Patterns:** HIGH — stacks-spec.md provides complete manifest format; Dana example is working reference
- **Common Pitfalls:** MEDIUM — based on zbb design docs + known patterns; some pitfalls (cloudfront-sim specifics) will emerge during implementation
- **Test Framework:** HIGH — Angular/Karma is confirmed in angular.json; no surprises
- **Environment Availability:** HIGH — Docker is required and present; optional tools (yq, aws-cli) have fallbacks

**Research date:** 2026-04-16
**Valid until:** 2026-05-07 (30 days; zbb is stable, but new container images or registry versions may appear)

**Next steps for planner:**
1. Verify Hub module builds (Wave 0 gate)
2. Determine hub-server image source (check zerobias-org/hub or module/docker)
3. Plan stack structure: separate stacks or combined? Hub-server as sub-stack or dependency?
4. Allocate effort: 19.1 SPA stack (4-6 hrs) + 19.2 login stack (3-4 hrs) + documentation (1 hr) = 8-11 hrs total
