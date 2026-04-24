---
phase: 19-zbb-local-dev-stacks
plan: 04
subsystem: Documentation, Smoke Tests & Integration Verification
tags: [documentation, smoke-tests, shell-scripts, integration, operational-guide]
completed_date: 2026-04-17
duration_minutes: 2
tasks_completed: 5
files_created: 5
dependency_graph:
  requires: [19-01, 19-02, 19-03]
  provides: [stacks-operator-guide, smoke-test-suite, phase-19-ready-for-uat]
  affects: [director-verification, UAT-readiness]
tech_stack:
  added: [shell-smoke-tests, markdown-operator-guide]
  patterns: [orchestrated-health-checks, port-variable-override, executable-shell-scripts]
key_files:
  created:
    - zbb-stacks/STACKS.md (327 lines)
    - zbb-stacks/smoke-all.sh (66 lines, executable)
    - zbb-stacks/cloudfront-sim/smoke.sh (32 lines, executable)
    - zbb-stacks/sme-mart-spa/smoke.sh (46 lines, executable)
    - zbb-stacks/sme-mart-login/smoke.sh (32 lines, executable)
  modified: []
decisions:
  - F-NEW-1 fix: All smoke scripts honor CLOUDFRONT_SIM_PORT override via PORT environment variable
  - smoke-all.sh orchestrates parallel testing of 3 stacks with per-stack smoke.sh invocation
  - STACKS.md combines operator guide, auth flow documentation, iteration workflow, troubleshooting
  - Troubleshooting section extracted from 19-RESEARCH.md common pitfalls (5 issues + fixes)
  - Manual verification checklist in STACKS.md matches director brief Verification section (steps 1-7)
---

# Phase 19 Plan 04 Summary: Documentation, Smoke Tests & UAT Integration Readiness

**One-liner:** Created operator guide (STACKS.md), master orchestrator (smoke-all.sh), and per-stack health-check scripts with PORT variable support (F-NEW-1 fix) — Phase 19 ready for director UAT verification.

## Objective Completion

✅ **All 5 tasks autonomous, completed in Wave 3**

This plan delivered the documentation and automated testing infrastructure required to operate the zbb local dev stacks safely and verify all LS-01 through LS-06 requirements are met.

**Artifacts delivered:**

1. **zbb-stacks/STACKS.md** (327 lines) — Comprehensive operator guide covering:
   - Quick start (3 commands to bring up all stacks)
   - Architecture diagram (unified-origin reverse proxy pattern)
   - Real login flow end-to-end (4 steps with curl examples + browser verification)
   - Iteration workflow (edit SPA/login code → rebuild → refresh)
   - Cookie inspection guide (DevTools verification of Domain=localhost)
   - 5-section troubleshooting FAQ (502 errors, deep-route fallback, cookie issues, build failures, missing repos)
   - Teardown + cleanup instructions
   - Environment variable reference table
   - Performance expectations and references

2. **zbb-stacks/smoke-all.sh** (66 lines, executable) — Master orchestrator with:
   - F-NEW-1 fix: reads CLOUDFRONT_SIM_PORT env var, defaults to 15002 if not set
   - Orchestrates per-stack smoke tests (cloudfront-sim, sme-mart-spa, sme-mart-login)
   - Passes PORT env var to each smoke script via `PORT="$PORT" bash`
   - Supports testing all stacks or one specific stack
   - Aggregates results with clear PASS/FAIL summary
   - Exits non-zero if any test fails

3. **zbb-stacks/cloudfront-sim/smoke.sh** (32 lines, executable) — Health checks:
   - Test 1: Verifies cloudfront-sim-nginx container running (docker ps)
   - Test 2: Verifies nginx responds on configured PORT (curl -sf)
   - F-NEW-1 fix: PORT variable override support

4. **zbb-stacks/sme-mart-spa/smoke.sh** (46 lines, executable) — SPA endpoint tests:
   - Test 1: Verifies /sme-mart/ returns HTML (LS-01 requirement)
   - Test 2: Verifies deep-route fallback (curl /sme-mart/rfps/test-route returns index.html, not 404)
   - F-NEW-1 fix: PORT variable override support

5. **zbb-stacks/sme-mart-login/smoke.sh** (32 lines, executable) — Login page test:
   - Test 1: Verifies /login/ returns HTML (LS-03 requirement)
   - F-NEW-1 fix: PORT variable override support

## Verification Results

All automated verification checks passed:

**Task 1: STACKS.md**
- ✅ 327 lines (well above 80-line minimum)
- ✅ Contains 'Real Login Flow' section
- ✅ Contains 'localhost:15002' references
- ✅ Contains 'proxy_cookie_domain' (nginx directive)
- ✅ References 'smoke-all.sh' for verification
- ✅ Contains 'troubleshooting' section with 5 issues

**Task 2: smoke-all.sh**
- ✅ PORT variable declaration with CLOUDFRONT_SIM_PORT default
- ✅ STACKS_TO_TEST array with all 3 stacks
- ✅ Loop over per-stack smoke.sh invocation
- ✅ PORT="$PORT" bash invocation pattern (F-NEW-1 fix)
- ✅ exit 1 on failure, exit 0 on success
- ✅ Executable with correct shebang

**Task 3: cloudfront-sim/smoke.sh**
- ✅ PORT variable declaration with default
- ✅ docker ps check for cloudfront-sim-nginx
- ✅ curl -sf "http://localhost:${PORT}/" endpoint check
- ✅ Executable with correct shebang

**Task 4: sme-mart-spa/smoke.sh**
- ✅ PORT variable declaration with default
- ✅ curl to /sme-mart/ with HTML validation
- ✅ curl to /sme-mart/rfps/test-route with deep-route fallback verification (LS-01)
- ✅ Executable with correct shebang

**Task 5: sme-mart-login/smoke.sh**
- ✅ PORT variable declaration with default
- ✅ curl to /login/ with HTML validation
- ✅ Executable with correct shebang

## Deviations from Plan

None — plan executed exactly as written.

**All locked decisions honored:**
- F-NEW-1 fix: PORT variable support on all smoke scripts — allows CLOUDFRONT_SIM_PORT override
- STACKS.md: 80+ lines with all required sections (bring-up, auth flow, iteration, teardown, troubleshooting)
- Manual verification checklist: matches director brief §Verification (steps 1-7)
- Smoke test integration: orchestrator passes PORT to per-stack scripts

## Requirements Coverage

| Requirement | Coverage | Verification |
|-------------|----------|--------------|
| **LS-01** (SPA deep-route fallback) | ✅ Smoke script tests /sme-mart/rfps/test-route | sme-mart-spa/smoke.sh test 2 |
| **LS-03** (Real login, cookies on localhost) | ✅ STACKS.md documents real login flow + cookie inspection | STACKS.md §Real Login Flow + §Cookie Inspection |
| **LS-04** (Reusable stack pattern) | ✅ Documented in STACKS.md Architecture + Iteration Workflow | STACKS.md §Architecture + §Iteration Workflow |
| **LS-05** (Env var import/export) | ✅ STACKS.md documents all env vars and zbb defaults | STACKS.md §Environment Variables Reference |
| **LS-06** (STACKS.md documentation) | ✅ Complete operator guide with troubleshooting | STACKS.md (all sections) |

## Key Implementation Details

**F-NEW-1 Fix: PORT Variable Override Pattern**

All smoke scripts follow the same pattern:
```bash
PORT="${PORT:-15002}"
# ... tests use $PORT instead of hardcoded 15002
```

smoke-all.sh passes PORT through:
```bash
PORT="$PORT" bash "$SMOKE_SCRIPT"
```

This enables:
- Default behavior: PORT=15002 (from CLOUDFRONT_SIM_PORT env var or hardcoded default)
- Override behavior: `PORT=15003 bash zbb-stacks/smoke-all.sh` for non-default ports
- Integration: smoke-all.sh respects CLOUDFRONT_SIM_PORT env var, passes to per-stack scripts

**Manual Verification Checklist (STACKS.md §Manual Verification)**

Matches director brief Verification section exactly:
1. docker ps | grep containers → verify 2+ containers running
2. curl /sme-mart/ → verify 200 + HTML
3. curl /sme-mart/rfps/test-route → verify 200 + index.html (deep-route fallback)
4. curl /login/ → verify 200 + login-related HTML
5. Browser login (manual, requires UAT credentials)
6. DevTools Cookies inspection → verify Domain=localhost (not uat.zerobias.com)
7. Navigate to SPA after login → verify session persists (no redirect to login)

## Readiness for Director UAT

✅ **All gate criteria met:**

- STACKS.md is a user-facing operator guide (not in .planning/, lives in zbb-stacks/ for quick reference)
- Smoke tests are automated (curl-based assertions, clear pass/fail exit codes)
- PORT variable support allows smoke tests to work with any CLOUDFRONT_SIM_PORT value (F-NEW-1 fix)
- Manual verification steps are documented and actionable (no vague "verify it works" instructions)
- Troubleshooting section covers all common pitfalls from 19-RESEARCH.md
- Auth flow documentation is end-to-end (login page → UAT endpoint → cookie rewriting → session persistence)
- Iteration workflow is documented (edit → build → refresh cycle with timing expectations)

**Phase 19 is complete and ready for director verification.** Operator can now:
1. Read STACKS.md for operational guidance
2. Run `bash zbb-stacks/smoke-all.sh` to verify health (automated)
3. Follow manual verification steps (browser-based) to confirm auth flow works

No blockers. No stubs. No TODOs left in created files.

## Commits

```
330fd50 feat(19-04): add STACKS.md operator guide with auth flow, iteration, troubleshooting
```

Commit contains all 5 files (STACKS.md + 4 smoke scripts) as a single atomic unit.

## Self-Check

- ✅ All 5 files created at expected paths under zbb-stacks/
- ✅ All files committed with correct format and descriptive message
- ✅ STACKS.md has 327 lines (well above 80-line minimum)
- ✅ All 4 smoke scripts are executable (chmod +x)
- ✅ PORT variable declaration present and correct in all scripts
- ✅ smoke-all.sh orchestration logic verified (loop, per-stack invocation, summary reporting)
- ✅ No stubs, TODOs, or placeholder text in any file
- ✅ F-NEW-1 fix (PORT variable override) verified across all scripts
- ✅ Troubleshooting section covers all 5 common pitfalls from 19-RESEARCH.md
- ✅ Manual verification checklist matches director brief §Verification exactly

## Handoff to Director

Phase 19 Wave 3 execution complete. All artifacts ready for director UAT verification.

**Director next steps:**
1. Verify commit exists: `git log --oneline | grep "330fd50"`
2. Read STACKS.md for operational context
3. Run automated smoke tests: `bash zbb-stacks/smoke-all.sh`
4. Follow manual verification steps in STACKS.md §Manual Verification (browser-based)
5. Sign off Phase 19 complete in STATE.md

**No further work needed.** Phase 19 ready for closure.
