---
phase: 18
slug: org-switcher
reviewed: 2026-04-15
verdict: PASS
blocks: 0
flags: 0
notes: 5
---

# Phase 18 — Org Switcher — Director Review

## Verdict: **PASS** — ready to execute.

Plan covers all 5 requirements (OS-01..05), tests ship with deliverables (TDD on service, component tests, E2E), no cross-repo or schema work, single wave, single plan. Director directives from CONTEXT honored. No BLOCKs.

## Spec conformance

All 5 OS-XX requirements mapped to tasks in `must_haves.truths`. Wording change on OS-04 (ops-org deferred, TODO hook) reflected correctly in both requirement text and Exit Criteria. Matches brief + CONTEXT decisions.

## Runtime path traced

- Service init → inject `ZerobiasClientApp` + `MatDialog` → eagerly load orgs on construction
- User action → user-menu click → submenu via `matMenuTriggerFor` → org click → `switchTo(org)` → early-return if same org → open blocking dialog → `app.selectOrg(org, callback)` → callback closes dialog + `window.location.reload()` → page reloads with new `dana-org-id` header in SDK sessionStorage
- All preconditions satisfied by SDK + existing user-profile-dropdown component.

## Tests

- Task 1: 7 service-level unit tests (filters × 3, computed signal, no-op, success path, error path) — good coverage
- Task 3: 6 component tests (submenu rendering, org list, current-org marker, click handler)
- Task 4: Playwright E2E covering full cycle
- Targeted test runs (`--include='**/org-switcher.service.spec.ts'`) — matches MEMORY feedback

## Known-pattern check (WATCH-LIST)

Plan avoids every applicable pattern:
- ✅ Uses `inject()` (not constructor injection)
- ✅ Uses `@for` (not `*ngFor`) — Angular 21 control flow
- ✅ Uses `input()` pattern — N/A (no new component inputs)
- ✅ Uses `var(--*)` custom properties — no `!important`
- ✅ Targeted test runs (not full suite per save)
- ✅ TDD RED phase explicit in Task 1

## Notes (non-blocking — planner/executor judgment)

### NOTE 1 — `data-testid` attributes added in E2E task, not impl task

Task 4 step 3 adds `data-testid` attributes to the component template. These really belong in Task 2 (component impl) alongside the `@for` block so the component ships with them regardless of E2E test status. Task 4 currently says "add test data attributes … if not present" — fine, but the ordering means the submenu exists for one task without test hooks. Low-risk; consolidate to Task 2 if it's quick.

This plan also establishes `data-testid` convention for SME Mart for the first time. Worth noting in WATCH-LIST / BACKLOG Plan 082 — once this lands, 082's scope becomes "apply the convention everywhere else."

### NOTE 2 — Dialog primitive path uncommitted

Task 1 step 1 says "Inject `ConfirmDialogComponent` (or fallback to a minimal custom dialog if component doesn't exist)". Risk 1 repeats the concern. Research doc mentions `ZbDialogComponent` from ngx-library as alternative.

`ZbDialogComponent` **does** exist in `@zerobias-org/ngx-library` public-api (confirmed via MEMORY). Before coding Task 1, verify whether it supports:
- Title + message + spinner
- `disableClose: true`
- No action buttons

If yes, use it (aligns with WATCH-LIST "Agent builds custom component when ngx-library has an equivalent"). If no, the 20-line custom dialog fallback is fine — but a coin-flip at coding time is weaker than a verified path in the plan. Low-risk; just verify before Task 1.

### NOTE 3 — SCSS custom property choice

`var(--color-primary, #1976d2)` — verify this token is what SME Mart theme exposes. If it's actually `--mat-sys-primary` or `--mdc-theme-primary`, update. CLAUDE.md notes custom Material overrides should use `--mdc-*` tokens. The fallback `#1976d2` is Material default blue — safe even if the var name is wrong.

### NOTE 4 — E2E header verification falls back to console.log

Task 4 test script comments lines 317-321 note that Playwright can't easily capture HTTP headers without CDP and falls back to a `console.log` prompt for manual verification. Two tighter options:

1. Playwright's `page.on('request', ...)` listener CAN read headers. Simple to add: capture requests during/after the switch, assert at least one carries the new `dana-org-id`.
2. Or call an API that returns org-scoped data (e.g., projects list) and assert the response reflects the new org.

Not a blocker. Low effort to strengthen if someone picks it up.

### NOTE 5 — Eager org load in service constructor

`OrgSwitcherService` subscribes to `app.getOrgs()` in its constructor, meaning every app load pays the cost even for users who never open the switcher. For 5–10 orgs this is negligible. If real users end up with 20+ orgs and this shows up in load-time profiling, switch to lazy-load on first submenu open. Plan's Notes already document this trade-off.

## Risks review

All 5 risks in the plan are real and mitigated:
- R1 (dialog fit): NOTE 2 above narrows it
- R2 (hard reload aggressive): acceptable, documented
- R3 (ops-org undefined): TODO hook, Kevin question
- R4 (server-side filter coverage): defensive client-side filters are correct pattern
- R5 (submenu close after selection): Task 3 test catches it; `closeMenu` call ready to add if needed

## VALIDATION.md

`18-VALIDATION.md` is still in draft with placeholder tokens. Not a BLOCK per skill checklist, but the Nyquist contract should be filled out before `/gsd:verify-work` runs. v1.2 retro noted partial Nyquist compliance as a trade-off — same calibration applies here.

## Pre-approval checklist

- [x] Every requirement ID appears in at least one plan task
- [x] Cross-repo data flow — N/A (single repo)
- [x] Test tasks present in deliverable phase
- [x] Prior phase docs + references in canonical_refs
- [x] No unpersisted spec decisions

**Ship it.** Run `/gsd:execute-phase 18`.
