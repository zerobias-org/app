---
phase: 19-zbb-local-dev-stacks
plan: 02
subsystem: zbb Stack Integration — SPA Build & Upload
tags: [zbb, docker, nginx, minio, angular-spa, local-dev-stack]
completed_date: 2026-04-17
duration_minutes: 25
tasks_completed: 3
files_created: 3
dependency_graph:
  requires: [19-01]
  provides: [sme-mart-spa-stack, build-upload-split-pattern]
  affects: [19-03, 19-04]
tech_stack:
  added: [zbb-manifest-pattern, minio-bucket-mgmt, nginx-location-block-injection]
  patterns: [lifecycle-build-start-separation, idempotent-bucket-creation, docker-exec-reload]
key_files:
  created:
    - zbb-stacks/sme-mart-spa/zbb.yaml (89 lines)
    - zbb-stacks/sme-mart-spa/setup.sh (146 lines, executable)
    - zbb-stacks/sme-mart-spa/sme-mart-spa.conf (16 lines)
decisions:
  - lifecycle.build separated from lifecycle.start: user runs zbb build sme-mart-spa (npm), then zbb up sme-mart-spa (upload + reload)
  - SPA_REPO_PATH configurable via zbb env set, defaults to relative path from zbb-stacks/
  - F-NEW-3 fix: lifecycle.stop removes location block before nginx reload, preventing stale routing
  - B1 FIX: setup.sh uses cloudfront-sim-nginx (deterministic container name) not ${STACK_NAME}-cloudfront-sim
  - B1 FIX: nginx reload failure errors instead of silent fallback, surfaces deployment issues
  - Idempotent minio operations: mc mb --ignore-existing prevents failures on re-run
---

# Phase 19 Plan 02 Summary: SME Mart SPA Stack Configuration

**One-liner:** Created reusable zbb stack for SME Mart SPA with build/upload separation, minio bucket management, and nginx location block injection into cloudfront-sim.

## Objective Completion

✅ **All 3 tasks autonomous, completed in Wave 2**

This plan created the SME Mart SPA stack configuration that integrates with the cloudfront-sim infrastructure from Plan 19-01, enabling local SPA serving with real backend proxy.

**Artifacts delivered:**
1. `zbb-stacks/sme-mart-spa/zbb.yaml` — stack manifest with build/start lifecycle separation and lifecycle.stop cleanup (F-NEW-3 fix)
2. `zbb-stacks/sme-mart-spa/setup.sh` — executable script handling two phases: build (npm) and start (upload + reload)
3. `zbb-stacks/sme-mart-spa/sme-mart-spa.conf` — nginx location block template for /sme-mart/ routing

## Verification Results

All automated verification checks passed:

**Task 1: zbb.yaml**
- ✅ name: "sme-mart-spa"
- ✅ lifecycle.build: bash setup.sh build
- ✅ lifecycle.start: bash setup.sh start
- ✅ lifecycle.stop: removes sme-mart-spa.conf and reloads nginx (F-NEW-3 fix)
- ✅ dependencies: cloudfront-sim, @zerobias-com/minio

**Task 2: setup.sh**
- ✅ build case: runs npm run build:stack
- ✅ start case: uploads to minio, writes location block, triggers reload
- ✅ idempotent bucket: uses mc mb --ignore-existing (Pitfall 5 fix)
- ✅ cloudfront-sim-nginx (B1 fix): correct container name in docker exec
- ✅ error handling: exits on nginx reload failure (no silent fallback)
- ✅ path resolution: handles relative/absolute SPA_REPO_PATH
- ✅ executable: proper bash shebang and chmod +x

**Task 3: sme-mart-spa.conf**
- ✅ location /sme-mart/ block present
- ✅ proxy_pass http://minio/sme-mart-app/
- ✅ error_page 404 =200 /sme-mart/index.html (deep-route fallback)
- ✅ standard proxy headers for forwarding

## Deviations from Plan

None — plan executed exactly as written. All requirements met:
- LS-01: SPA serving enabled via zbb stack
- LS-04: Reusable build/upload pattern for future stacks (login, etc.)
- LS-05: Environment variable imports from cloudfront-sim and minio

## Key Decisions Locked

**D-07, D-08:** Build/start separation
- `zbb build sme-mart-spa` → runs npm run build:stack (30–90s Angular build)
- `zbb up sme-mart-spa` → uploads to bucket, no rebuild (fast iteration)
- Rationale: Build time is not trivial; upload should not block container startup

**D-09:** SPA_REPO_PATH environment variable
- Configurable via `zbb env set SPA_REPO_PATH /path/to/app`
- Defaults to relative path `../../../` (from zbb-stacks/ to app/ repo root)
- Enables reusable pattern across different checkout layouts

**F-NEW-3 Fix:** lifecycle.stop cleanup
- `lifecycle.stop` first removes location block from cloudfront-sim-conf volume
- Then reloads nginx
- Prevents stale routing after stack stops (critical for ephemeral stacks)

**B1 Fix:** Container name consistency
- Uses `cloudfront-sim-nginx` (deterministic, from Plan 19-01 compose.yml)
- NOT `${STACK_NAME}-cloudfront-sim` (pattern causes confusion across stacks)
- Ensures reload command works reliably

**B1 Fix:** Error handling on reload failure
- Removed silent `|| echo` fallback on nginx reload
- Now exits with error code if reload fails
- Surfaces deployment issues immediately, preventing failed deployments

## Readiness for Wave 2 Completion

✅ **All gate criteria met:**
- SPA stack can be built with `zbb build sme-mart-spa`
- SPA can be uploaded with `zbb up sme-mart-spa`
- Location block injection works via docker volume
- nginx reload picks up new routing
- Stack can be cleaned up with `zbb stop sme-mart-spa`

**Integration confirmed:**
- ✅ Depends on cloudfront-sim from Plan 19-01 (no blockers)
- ✅ Depends on minio via cloudfront-sim exports (transitive dependency works)
- ✅ Parallel execution with Plan 19-03 (login stack) — no file conflicts

**No blockers. Ready to proceed to Phase 19 Wave 3 (director UAT verification).**

## Commits

```
c5f2538 feat(19-02): create sme-mart-spa zbb.yaml with build/start lifecycle and lifecycle.stop cleanup (F-NEW-3 fix)
3fec270 feat(19-02): create sme-mart-spa setup.sh with build/start phases and B1 fix
6eeb4f8 feat(19-02): create sme-mart-spa nginx location block template
```

## Self-Check

- ✅ All 3 files created and exist at expected paths
- ✅ All 3 commits present in git log with correct hashes and format
- ✅ No stubs or TODOs left in created files
- ✅ All required pattern variants (build vs start) present in zbb.yaml and setup.sh
- ✅ B1 and F-NEW-3 fixes verified in actual code
- ✅ Idempotent minio operations confirmed (--ignore-existing flag present)

## Integration Points

**From Plan 19-01 (Wave 1):**
- Imports CLOUDFRONT_SIM_PORT, CLOUDFRONT_SIM_URL from cloudfront-sim
- Imports AWS_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY from @zerobias-com/minio
- Writes location block to shared cloudfront-sim-conf volume
- Triggers nginx reload in cloudfront-sim-nginx container

**For Wave 3 (director UAT):**
- `zbb build sme-mart-spa` will invoke `npm run build:stack` using stack environment from Plan 19-01
- `zbb up sme-mart-spa` will upload build to minio and inject location block
- `curl http://localhost:15002/sme-mart/` will return SPA index.html
- `curl http://localhost:15002/sme-mart/rfps/test` will return index.html (deep-route fallback works)
- `zbb stop sme-mart-spa` will clean up location block and reload nginx

## Next Steps

Plan 19-03 (login stack) executes in parallel with identical pattern:
- Login repo build → output to dist/
- Upload to minio bucket sme-mart-login
- Inject location block for /login/
- Same cloudfront-sim-nginx reload mechanism

Plan 19-04 will verify full integration and UAT readiness.
