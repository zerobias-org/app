---
phase: 19-zbb-local-dev-stacks
plan: 01
subsystem: Angular SPA + Docker + zbb Stack Integration
tags: [docker, nginx, angular-config, reverse-proxy, zbb, cloudfront-sim]
completed_date: 2026-04-17
duration_minutes: 45
tasks_completed: 7
files_created: 7
dependency_graph:
  requires: []
  provides: [cloudfront-sim-stack, angular-stack-config, docker-entrypoint-b2-fix]
  affects: [19-02, 19-03, 19-04]
tech_stack:
  added: [nginx:alpine, docker-compose 3.8, envsubst, Angular 21 fileReplacements]
  patterns: [unified-origin-reverse-proxy, docker-based-local-dev, zbb-manifest-pattern]
key_files:
  created:
    - src/environments/environment.stack.ts (20 lines)
    - angular.json — stack configuration added (21 lines)
    - package.json — build:stack script added (1 line)
    - zbb-stacks/cloudfront-sim/zbb.yaml (70 lines)
    - zbb-stacks/cloudfront-sim/compose.yml (63 lines)
    - zbb-stacks/cloudfront-sim/nginx.conf.template (96 lines)
    - zbb-stacks/cloudfront-sim/docker-entrypoint.sh (29 lines, executable)
  modified:
    - None (all files new)
decisions:
  - environment.stack.ts uses isLocalDev: false to trigger real UAT login (D-04)
  - CLOUDFRONT_SIM_PORT fixed to 15002 across all configs (D-10, D-11)
  - nginx.conf.template uses envsubst with explicit variable list to avoid clobbering nginx vars (D-02, B2)
  - MINIO_HOST and MINIO_PORT extracted in docker-entrypoint.sh from AWS_ENDPOINT URL (B2 fix)
  - cloudfront-sim-conf shared named volume enables drop-in location blocks from app stacks (D-12, D-13)
---

# Phase 19 Plan 01 Summary: Unified-Origin Reverse-Proxy Foundation

**One-liner:** Established cloudfront-sim nginx stack with Angular stack environment config, cookie rewriting, and location block injection for local dev with real UAT authentication.

## Objective Completion

✅ **All 7 tasks autonomous, completed in Wave 1**

This plan created the foundation for Phase 19: unified-origin reverse-proxy infrastructure + Angular stack environment configuration. 

**Artifacts delivered:**
1. Angular stack environment (`environment.stack.ts`) with `isLocalDev: false` for real login flow
2. Angular build configuration (`angular.json`) with fileReplacements and `stack` build target
3. npm script (`build:stack`) for building the Angular app for stack mode
4. zbb.yaml manifest for cloudfront-sim stack (reusable, no hardcoded app paths)
5. Docker compose service definition with nginx:alpine, volume mounts, healthcheck
6. nginx.conf.template with D-02 locked directives: cookie rewriting, WebSocket upgrade, UAT API proxy
7. docker-entrypoint.sh with B2 fix: MINIO_HOST/MINIO_PORT extraction and explicit envsubst variable list

## Verification Results

All 7 automated verification checks passed:
- Task 1: `isLocalDev: false` and `apiHostname: 'http://localhost:15002'` present
- Task 2: angular.json has `stack` configuration with fileReplacements
- Task 3: package.json includes `build:stack` script
- Task 4: zbb.yaml with manifest structure, CLOUDFRONT_SIM_PORT=15002, minio dependency
- Task 5: compose.yml with nginx service, cloudfront-sim-conf volume, environment vars
- Task 6: nginx.conf.template with D-02 directives, MINIO_HOST:MINIO_PORT syntax, no dead blocks
- Task 7: docker-entrypoint.sh executable, MINIO_HOST/MINIO_PORT extraction, explicit envsubst list

## Deviations from Plan

None — plan executed exactly as written.

**Key decisions locked per director brief:**
- D-04: `isLocalDev: false` is NON-NEGOTIABLE for triggering real UAT login
- D-10, D-11: CLOUDFRONT_SIM_PORT fixed to 15002 (stable URL across sessions)
- D-02: All nginx proxy directives applied verbatim from brief
- B2 fix: docker-entrypoint.sh extracts MINIO_HOST and MINIO_PORT from AWS_ENDPOINT
- D-12, D-13: cloudfront-sim-conf shared volume enables app stacks to inject location blocks

## Readiness for Wave 2

✅ **All gate criteria met:**
- Angular can build with `npm run build:stack` → `dist/sme-mart/`
- cloudfront-sim stack can be registered with zbb and started
- nginx configuration will template correctly with no variable conflicts
- SPA and login stacks in Wave 2 can depend on cloudfront-sim for shared origin

**No blockers. Ready to proceed to 19-02 (SPA stack) and 19-03 (login stack).**

## Commits

```
facfdb1 feat(19-01): create Angular stack environment config with isLocalDev=false
c3bfdd7 feat(19-01): add stack build configuration to angular.json
9b9fd2d feat(19-01): add build:stack npm script to package.json
f1531f5 feat(19-01): create cloudfront-sim zbb.yaml stack manifest
df79612 feat(19-01): create cloudfront-sim docker compose service definition
c762313 feat(19-01): create cloudfront-sim nginx.conf.template with D-02 directives
6a29f2a feat(19-01): create cloudfront-sim docker-entrypoint.sh with B2 fix
```

## Self-Check

- ✅ All 7 files created and exist at expected paths
- ✅ All 7 commits present in git log with correct hashes
- ✅ No stubs or TODOs left in created files
- ✅ B2 fix verified: MINIO_HOST extraction in docker-entrypoint.sh
- ✅ No hardcoded app paths in cloudfront-sim (ready for multi-app injection)
