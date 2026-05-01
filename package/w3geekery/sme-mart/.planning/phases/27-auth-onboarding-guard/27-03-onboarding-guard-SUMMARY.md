---
phase: 27-auth-onboarding-guard
plan: 03
subsystem: auth
tags: [angular-21, can-activate-fn, dana-sdk, signals, project-context]

requires:
  - phase: 27
    provides: OnboardingBootstrapService (Plan 02), AppInitService SDK init (Plan 01)
  - phase: 28
    provides: MarketplaceProfileService.getCompletionStatus
provides:
  - onboardingGuard CanActivateFn (5-step orchestration: session -> orgId/partyId -> admin -> bootstrap -> completion -> route)
  - OnboardingBootstrapShellComponent (loading + bootstrap-failure surface)
  - Admin detection wired to ProjectContextService.setIsAdmin
affects: [phase-27-04-routing, phase-30-board, downstream-admin-aware-components]

tech-stack:
  added: []
  patterns:
    - "Functional CanActivateFn with field-level inject() inside the function body"
    - "Admin probe via clientApi.danaClient.getOrgApi().getRequestOrgMember(userId).admin (MCP-verified contract)"
    - "ProjectContextService.setIsAdmin hydrated post-resolve so downstream consumers read a signal instead of re-calling the SDK"
    - "Bootstrap failure surface at /onboarding/bootstrap?error=bootstrap-failed (no recursion — guard not on this route)"

key-files:
  created:
    - src/app/core/guards/onboarding.guard.ts
    - src/app/core/guards/onboarding.guard.spec.ts
    - src/app/onboarding/onboarding-bootstrap-shell.component.ts
    - src/app/onboarding/onboarding-bootstrap-shell.component.html
    - src/app/onboarding/onboarding-bootstrap-shell.component.scss
    - src/app/onboarding/onboarding-bootstrap-shell.component.spec.ts
  modified: []

key-decisions:
  - "Functional CanActivateFn over class-based guard: matches Angular 21 idiom, simpler DI via inject() inside body"
  - "Admin probe runs after session/orgId/partyId resolution but BEFORE bootstrap and completion checks — admin short-circuits to /admin without consuming bootstrap recipe"
  - "Admin probe failure defaults to non-admin (fail-safe) so transient SDK errors never accidentally promote a user"
  - "Bootstrap failure routes to /onboarding/bootstrap with ?error=bootstrap-failed query param; the shell component reads the param and renders a Retry button"
  - "Shell's Retry navigates to /login to restart the flow (full session reset is the safest recovery)"

patterns-established:
  - "MCP-verified SDK accessor pattern: zerobias_describe('danaOld.Org.getRequestOrgMember') confirmed contract; node_modules/@zerobias-com/dana-sdk/dist/api/index.d.ts:42 confirmed accessor location before code lands"
  - "Standalone shell components import only what the template uses (no CommonModule); @if control flow only"

requirements-completed: [AR-02, AR-04, AR-05, AR-06, AR-09]

duration: ~70min
completed: 2026-04-30
---

# Phase 27-03: Onboarding Guard Summary

**Functional CanActivateFn orchestrating session → admin probe → bootstrap → completion → route, with a standalone shell for the bootstrap-failure escape hatch.**

## Performance

- **Duration:** ~70 min (initial implementation) + Director-mandated patches (admin wiring, CommonModule removal, lint cleanup)
- **Completed:** 2026-04-30
- **Tasks:** 6 implementation + 3 patches landed
- **Files modified:** 7

## Accomplishments

- `onboardingGuard` functional CanActivateFn at `src/app/core/guards/onboarding.guard.ts` orchestrating the 5-step flow.
- Admin detection wired via MCP-verified `clientApi.danaClient.getOrgApi().getRequestOrgMember(userId).admin`. Admin -> `/admin` bypasses bootstrap and completion entirely.
- `ProjectContextService.setIsAdmin(boolean)` hydrated on every guard run so downstream components read the signal instead of re-calling the SDK.
- `OnboardingBootstrapShellComponent` (standalone, mat-progress-spinner, no CommonModule) renders during bootstrap and surfaces a Retry button on `?error=bootstrap-failed`.
- Spec coverage: 14 tests in onboarding.guard.spec.ts (5 admin-branch + 9 original) + 5 tests in onboarding-bootstrap-shell.component.spec.ts.

## Task Commits

Initial implementation batched into a single commit; Director called this out as a deviation from per-task discipline. Subsequent Wave 3 (27-04) restored per-task atomic commits.

1. **Tasks 1-6: Initial guard + shell implementation** — `1c5e3b2` (feat) — single batch commit covering guard.ts, guard.spec.ts, shell .ts/.html/.scss/.spec.ts.
2. **Lint cleanup: TS6133/TS6198** — `ee0fdde` (fix) — unused route/state params, unused destructure, unused result, unused afterEach.
3. **Modernization Patch 1: CommonModule removal** — `6bc9c7d` (fix) — drop CommonModule from shell component imports.
4. **Modernization Patch 2: real admin detection** — `d4c542e` (feat) — replace AR-02 TODO with MCP-verified getRequestOrgMember; add 5 admin-branch tests; wire setIsAdmin.

## Files Created

- `src/app/core/guards/onboarding.guard.ts` — Functional CanActivateFn (5-step orchestration).
- `src/app/core/guards/onboarding.guard.spec.ts` — 14 tests covering session, orgId, partyId, admin (5 cases), bootstrap, completion (Promise + Observable), error paths.
- `src/app/onboarding/onboarding-bootstrap-shell.component.ts` — Standalone component, field-level inject(), `@if` control flow.
- `src/app/onboarding/onboarding-bootstrap-shell.component.html` — `@if` for loading/error states; `<mat-progress-spinner>` (canonical name).
- `src/app/onboarding/onboarding-bootstrap-shell.component.scss` — Loading + error sections styling.
- `src/app/onboarding/onboarding-bootstrap-shell.component.spec.ts` — 5 tests covering rendering, error query param detection, Retry behavior.

## Decisions Made

- **Functional guard, not class-based.** Angular 21 idiom; `inject()` inside the function body keeps DI explicit.
- **Admin probe before bootstrap.** Admin users should never run bootstrap (creating a default engagement in an org they're administrating-but-not-in is wrong); short-circuit early.
- **Probe failure defaults to non-admin.** Fail-safe: a transient SDK error must never accidentally elevate a user.
- **Shell's Retry navigates to `/login`.** Full session reset is the safest recovery from an unknown bootstrap failure mode.

## Deviations from Plan

### Auto-fixed Issues

**1. [Modernization] CommonModule in standalone shell component**
- **Found by:** Director review
- **Issue:** `import { CommonModule }` and `imports: [CommonModule, ...]` in shell component despite using `@if` (built-in control flow does not require CommonModule).
- **Fix:** Removed both lines. Sweep of remaining Phase 27 files confirmed no other CommonModule, *ngIf/*ngFor, @Input/@Output, mat-spinner alias, or constructor-DI violations.
- **Committed in:** `6bc9c7d`

**2. [Requirement] AR-02 admin detection left as TODO**
- **Found by:** Director review
- **Issue:** Initial implementation deferred admin detection with a TODO comment, awaiting "getPrincipal().isAdmin" SDK API.
- **Fix:** MCP-verified the canonical contract (`mcp__zerobias__zerobias_describe danaOld.Org.getRequestOrgMember` returns `{ admin: boolean }`). Verified SDK accessor location (`node_modules/@zerobias-com/dana-sdk/dist/api/index.d.ts:42` and `zerobias-client-api.d.ts:36`). Wired `clientApi.danaClient.getOrgApi().getRequestOrgMember(clientApi.toUUID(userId))` after session resolution; admin === true short-circuits to `/admin`. Added 5 admin-branch tests + ProjectContextService.setIsAdmin call.
- **Committed in:** `d4c542e`

**3. [Lint hygiene] TS6133/TS6198 in initial commit**
- **Found by:** post-commit diagnostics
- **Issue:** Unused CanActivateFn route/state params (TS6133), unused destructure of bootstrap return (TS6198), unused result binding in test (TS6133), unused afterEach import in shell spec (TS6133).
- **Fix:** Underscore-prefix unused params; drop unused destructure; remove unused bindings/imports.
- **Committed in:** `ee0fdde`

### Process deviation

- Tasks 1-6 batched into a single commit (`1c5e3b2`) instead of per-task atomic commits. Director accepted the deviation but required Wave 3 (27-04) to return to per-task discipline. No code rollback needed.

## Issues Encountered

None — all auto-fixes addressed in the patches above.

## Next Phase Readiness

- Wave 3 (27-04 routing) consumed this plan's exports and wired `onboardingGuard` at the AppShell route. `OnboardingBootstrapShellComponent` is registered at `/onboarding/bootstrap` (no guard — the failure-surface route).
- Phase 30 (Default Project Board) will consume `ProjectContextService.isAdmin` signal to gate admin-only board controls without re-calling the SDK.

---
*Phase: 27-auth-onboarding-guard*
*Completed: 2026-04-30*
