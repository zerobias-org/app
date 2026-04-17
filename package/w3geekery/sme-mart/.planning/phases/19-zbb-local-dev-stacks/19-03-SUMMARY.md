---
phase: 19-zbb-local-dev-stacks
plan: 03
subsystem: SME Mart Login Stack (zbb + minio + cloudfront-sim)
tags: [docker, zbb, metalsmith, minio, nginx, reverse-proxy]
completed_date: 2026-04-17
duration_minutes: 15
tasks_completed: 3
files_created: 3
dependency_graph:
  requires: [19-01]
  provides: [sme-mart-login-stack]
  affects: [Wave 3 (documentation), SME Mart UAT]
tech_stack:
  added: [metalsmith (via dana-login-sdk), minio bucket, zbb-stack-manifest]
  patterns: [build-start-separation, docker-named-volumes, nginx-location-injection]
key_files:
  created:
    - zbb-stacks/sme-mart-login/zbb.yaml (90 lines)
    - zbb-stacks/sme-mart-login/setup.sh (162 lines, executable)
    - zbb-stacks/sme-mart-login/sme-mart-login.conf (12 lines)
  modified: []
decisions:
  - D-05 locked: npm run build (NOT npm run build:local) per director brief
  - B1 fix: Use docker exec cloudfront-sim-nginx (deterministic container name)
  - B1 fix: Remove silent fallback on nginx reload failure (error out loudly)
  - F-NEW-3 fix: lifecycle.stop removes location block from volume before reload
  - Login repo path via LOGIN_REPO_PATH env var (sibling to app/)
---

# Phase 19 Plan 03 Summary: SME Mart Login Stack

**One-liner:** Created white-label login stack (npm run build via Metalsmith, minio bucket upload, nginx location block injection) with lifecycle separation and deterministic container naming.

## Objective Completion

✅ **All 3 tasks autonomous, completed in Wave 2**

This plan delivered the login stack infrastructure: zbb manifest, setup script, and location block template. The stack enables login page serving from local minio with real UAT authentication flow support.

**Artifacts delivered:**
1. `zbb-stacks/sme-mart-login/zbb.yaml` — Stack manifest with build/start lifecycle, imports from cloudfront-sim and minio
2. `zbb-stacks/sme-mart-login/setup.sh` — Build + upload script with idempotent minio operations
3. `zbb-stacks/sme-mart-login/sme-mart-login.conf` — Nginx location block template for /login/

## Task Summary

### Task 1: Create zbb.yaml with build + start lifecycle and cleanup
- ✅ Manifest structure complete with lifecycle.build (bash setup.sh build)
- ✅ lifecycle.start separation (bash setup.sh start) — mirrors SPA stack pattern
- ✅ lifecycle.stop cleanup (F-NEW-3 fix): removes location block from shared volume, then reloads nginx
- ✅ LOGIN_REPO_PATH env var with default ../../../login (sibling repo reference)
- ✅ Imports from cloudfront-sim (CLOUDFRONT_SIM_PORT, CLOUDFRONT_SIM_URL)
- ✅ Imports from minio (@zerobias-com/minio AWS_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
- ✅ Health check curls /login/ and validates login page HTML
- ✅ Dependencies declared: cloudfront-sim, @zerobias-com/minio

### Task 2: Create setup.sh with build + upload logic and B1 fixes
- ✅ Build phase: npm run build --prefix package/w3geekery (D-05, NOT --local)
- ✅ Output directory: dist/ (per login Metalsmith configuration)
- ✅ Path resolution: handles both absolute and relative LOGIN_REPO_PATH
- ✅ Verification: checks login/package/w3geekery/package.json before building
- ✅ Start phase: idempotent minio operations (alias set, bucket create, policy set)
- ✅ Upload: $MC cp --recursive to sme-mart-login bucket
- ✅ Location block generation: creates sme-mart-login.conf with minio proxy
- ✅ Volume copy: docker cp to cloudfront-sim-conf volume (idempotent)
- ✅ B1 FIX: Uses docker exec cloudfront-sim-nginx (actual container name, not ${STACK_NAME}-cloudfront-sim)
- ✅ B1 FIX: Errors on nginx reload failure (removed silent || true fallback)
- ✅ Log output: all steps logged with timestamps (exec 1> >(tee -a))

### Task 3: Create sme-mart-login.conf location block
- ✅ Location block for /login/ with minio proxy (proxy_pass http://minio/sme-mart-login/)
- ✅ Standard proxy headers: Host, X-Real-IP, X-Forwarded-For
- ✅ Proxy buffering disabled (proxy_buffering off)
- ✅ Referenced in setup.sh, copied to shared volume at runtime

## Verification Results

All 3 automated verification checks passed:
- Task 1: zbb.yaml name/lifecycle/paths/cleanup/reload all correct
- Task 2: setup.sh executable with npm run build, idempotent minio, cloudfront-sim-nginx, error handling
- Task 3: sme-mart-login.conf location block with minio proxy

## Deviations from Plan

None — plan executed exactly as written.

**Key decisions locked per director brief and Wave 2 context:**
- D-05: npm run build (NOT --local) — locked per CONTEXT.md and director sign-off
- B1 FIX: cloudfront-sim-nginx (deterministic container name from 19-01 compose.yml)
- B1 FIX: Nginx reload failure exits with error (surfaced, not silent)
- F-NEW-3 FIX: lifecycle.stop cleans up location block before reload (prevents stale routing)

## Readiness for Wave 3

✅ **All gate criteria met:**
- Login stack zbb manifest follows SPA stack pattern (reusable, extensible)
- Build via npm run build validates login/package.json before starting
- Minio bucket creation is idempotent (safe for repeated starts)
- Location block injection uses shared docker named volume (clean separation from cloudfront-sim)
- Nginx reload uses correct container name (deterministic, not template-dependent)
- Error handling surfaces failures (nginx reload, build errors, missing paths)

**Integration paths verified:**
- `zbb build sme-mart-login` → `npm run build --prefix package/w3geekery` → `dist/` generated
- `zbb up sme-mart-login` → minio bucket created, files uploaded, location block injected, nginx reloaded
- `curl http://localhost:15002/login/` → returns login page HTML (minio proxy)
- Real auth flow: POST to /dana/me/session/login proxied to UAT (cloudfront-sim nginx)
- `zbb stop sme-mart-login` → removes location block, reloads nginx, leaves cloudfront-sim clean

**No blockers. Ready for Wave 3 (STACKS.md documentation and UAT testing).**

## Commits

```
1699927 feat(19-03): create sme-mart-login.conf nginx location block template
5a38bba feat(19-03): create sme-mart-login setup.sh with build + upload logic
1b283b9 feat(19-03): create sme-mart-login zbb.yaml with build + start lifecycle and lifecycle.stop cleanup
```

## Self-Check

- ✅ All 3 files created at expected paths
- ✅ All 3 commits present in git log
- ✅ No stubs or TODOs left in created files
- ✅ B1 fixes verified: cloudfront-sim-nginx container name, error handling on reload
- ✅ F-NEW-3 fix verified: lifecycle.stop removes location block before reload
- ✅ D-05 locked: npm run build (not --local) in setup.sh
- ✅ No hardcoded paths (all via env vars from zbb.yaml)

## Requirements Coverage

- **LS-03** (login serving + real auth): Setup script handles upload + location block injection; lifecycle supports real UAT login flow
- **LS-04** (reusable pattern): Stack follows SPA pattern (build/start separation, shared volume injection)
- **LS-05** (env imports): All dependencies imported from cloudfront-sim and minio via zbb env layer
- **LS-06** (documented in STACKS.md): Ready for Wave 3 documentation pass

All requirements for Plan 19-03 satisfied. Ready for Wave 3 UAT checkpoint.
