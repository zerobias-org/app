---
phase: 19
slug: zbb-local-dev-stacks
reviewed: 2026-04-16
verdict: CONDITIONAL PASS
blocks: 0
flags: 3
notes: 3
condition: "B3 hub-server escalation to Kevin must resolve before Task 3 can execute"
---

# Director Review — Phase 19: zbb Local Dev Stacks

**Plans reviewed:** 19-01 (Wave 1, 8 tasks), 19-02 (Wave 2, 4 tasks)
**Supporting artifacts:** 19-CONTEXT.md, 19-RESEARCH.md, 19-VALIDATION.md

## Initial Review (pre-fix)

Three BLOCKs identified, all resolved in plan revision:

| Issue | Category | Fix Applied |
|-------|----------|-------------|
| B1 | nginx.conf hardcoded `/sme-mart/` basePath | `nginx.conf.template` uses `${BASE_PATH}`; acceptance criteria reject app-specific paths via `! grep -qi 'sme.mart'` |
| B2 | nginx env var substitution unresolved | Prescribed `envsubst` in `docker-entrypoint.sh` with explicit var list (avoids clobbering nginx's `$host`/`$remote_addr`) |
| B3 | hub-server runtime unknown | Task 3 replaced with escalation task. BLOCKED until Clark asks Kevin for hub-server image source. No placeholder Dockerfile. |
| F1 | `spa-upload` used `busybox` (no aws-cli) | `setup.sh` uses `minio/mc` (MinIO Client) for bucket ops |
| F4 | No Wave 0 build-gate task | Task 8 is now explicit Wave 0: verify `npm run build` + `npm pack` on `module/` at execution time |
| F5 | `zbb-stacks/` path ambiguous | Both plans have explicit "paths relative to `app/` repo root" comment in frontmatter |

## Remaining FLAGs (non-blocking, executor should be aware)

**F2 — Shared cloudfront-sim instance + two buckets architecturally ambiguous.**
Both SPA and login stacks depend on cloudfront-sim but serve different minio buckets. The plan doesn't resolve whether one nginx instance serves both (multiple location blocks) or two nginx instances run on different ports. Executor will need to decide at implementation time. If one instance, nginx.conf.template needs basePath-aware routing to multiple buckets via `${BASE_PATH}`.

**F3 — Login -> SPA session handoff may not be testable locally.**
LS-03 requires session handoff verification. In prod, both live on `*.zerobias.com` (shared domain). Locally, they're on different ports (different origins). Browser cookies don't cross origins. Without ZeroBias platform auth running locally, the test is limited to "both stacks serve content" — actual auth flow verification requires UAT. Plan should acknowledge this limitation.

**F6 — Login build output path unverified.**
Plan 19-02 assumes `LOGIN_BUILD_DIR: "dist/"`. Login uses Metalsmith (per root CLAUDE.md) — output may be `build/` not `dist/`. Executor should check `login/package.json` before writing the stack manifest.

## Remaining NOTEs

**N1 — Port 15000 hardcoded in smoke tests.** Use `${CLOUDFRONT_SIM_PORT}` — zbb allocates dynamically.
**N2 — `docker-compose.yml` vs `compose.yml` naming inconsistency.** Plan uses legacy name, research shows modern. Pick one.
**N3 — STACKS.md lives in `.planning/`.** Operational docs should live alongside stacks (`zbb-stacks/README.md`) or at repo root. `.planning/` is for project management, not user-facing docs.

## Pre-approval Checklist

- [x] Every requirement ID (LS-01..06) appears in at least one plan task
- [~] Cross-repo data flow traced — Hub module -> Verdaccio -> hub-server traced; session handoff partially traced (F3)
- [x] Test tasks present — manual smoke tests appropriate for infra phase
- [x] Prior phase docs in canonical_refs
- [x] No spec decisions left unpersisted (CONTEXT.md captures all)
- [x] BLOCKs resolved in plan revision

## Verdict

**CONDITIONAL PASS.** Plans are structurally sound after revision. All tasks except Task 3 (hub-server Dockerfile) can execute immediately. Task 3 is blocked on Kevin escalation — once hub-server runtime is known, executor can write the Dockerfile.

Execution can proceed with Tasks 1-2, 4-8 (Wave 0 build gate + all non-hub-server infrastructure). Task 3 slots in when Kevin responds. This doesn't block the critical path — cloudfront-sim, minio setup, nginx config, and Verdaccio publishing all work independently of the hub-server container.
