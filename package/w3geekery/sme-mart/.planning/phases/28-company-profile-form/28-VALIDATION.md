---
phase: 28
slug: company-profile-form
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-30
---

# Phase 28 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest via `ng test` (Angular 21 CLI default) |
| **Config file** | `angular.json` test target (no separate config required) |
| **Quick run command** | `npm test -- --include='src/app/onboarding/**/*.spec.ts' --include='src/app/core/services/marketplace-profile.service.spec.ts' --watch=false --browsers=ChromeHeadless` |
| **Full suite command** | `npm test -- --watch=false --browsers=ChromeHeadless` |
| **Estimated runtime** | ~10–20 seconds for the targeted Phase 28 specs (full suite is much larger; not gated on by sampling) |

---

## Sampling Rate

- **After every task commit:** Run the **quick run command** (Phase 28-touched specs only).
- **After every plan wave:** Run the quick run command again, plus a `tsc --noEmit` to catch type drift.
- **Before `/gsd:verify-work`:** Phase 28 quick run must be green; plus a successful `npm run build:dev` (or equivalent) to confirm no compilation regressions.
- **Max feedback latency:** ~30 seconds per task (quick run + `tsc --noEmit`).

Rationale: per Clark's directive, Phase 28 is unit-test-scoped to the four CP-08 flows on touched components. The full suite is NOT a Phase 28 gate (test-infra modernization is its own future milestone).

---

## Per-Task Verification Map

(Tasks finalized by `gsd-planner`; this map names the test commands the planner must wire into each task's `<acceptance_criteria>` / `<automated>` field.)

| Plan slot | Wave | Requirement(s) | Test Type | Automated Command | File Exists | Status |
|---|---|---|---|---|---|---|
| 01 (constants + model) | 1 | CP-01 surface area | unit (compile) | `tsc --noEmit -p tsconfig.json` | ❌ Wave 0 | ⬜ pending |
| 02 (MarketplaceProfileService) | 1 | CP-02, CP-04, CP-05 | unit | `npm test -- --include='src/app/core/services/marketplace-profile.service.spec.ts' --watch=false --browsers=ChromeHeadless` | ❌ Wave 0 | ⬜ pending |
| 03 (CompanyProfileFormComponent + template + scss) | 2 | CP-01, CP-03 | unit | `npm test -- --include='src/app/onboarding/company-profile-form.component.spec.ts' --watch=false --browsers=ChromeHeadless` | ❌ Wave 0 | ⬜ pending |
| 04 (skip handler + route wiring) | 2 | CP-06 | unit | `npm test -- --include='src/app/onboarding/company-profile-form.component.spec.ts' -t "skip" --watch=false --browsers=ChromeHeadless` | ❌ Wave 0 | ⬜ pending |
| 05 (completion-status + repeat-login routing test) | 3 | CP-07, CP-08 | unit (with stubbed Phase 27 guard) | `npm test -- --include='src/app/core/services/marketplace-profile.service.spec.ts' -t "completion" --watch=false --browsers=ChromeHeadless` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 in Phase 28 is the act of authoring the spec stubs alongside their implementation files (TDD-leaning; or written immediately after, per Angular team standard). No standalone harness setup is required — Angular CLI's `ng test` configuration is already operational across the app.

- [ ] `src/app/onboarding/company-profile-form.component.spec.ts` — covers CP-01, CP-03, CP-06, and the routing-stub leg of CP-07.
- [ ] `src/app/core/services/marketplace-profile.service.spec.ts` — covers CP-02, CP-04, CP-05, and the completion-status leg of CP-07.
- [ ] (No new fixtures, no shared test factories, no Jest config changes.)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|---|---|---|---|
| End-to-end pre-fill against real UAT data for a logged-in user | CP-02 | Phase 28 unit tests mock `GraphqlReadService` and `danaOld.Org.getOrg`; full SDK round-trip is integration-level | After execute: `npm run dev` (UAT), log in as Clark/W3Geekery, navigate to `/onboarding/company-profile`, confirm `legal_name` populates from `Org.name="W3Geekery"`, all other fields render with "(please provide)" hints (UAT has 0 production MPI records). |
| Save round-trip persistence (write → re-read confirms) | CP-04, CP-05 | Live Pipeline.receive timing + AuditgraphDB materialization happen out-of-process | Edit `legal_name`, click save; wait ~5s; reload form; confirm `legal_name` now shows the new value (pre-fill comes from MPI now, not Org-fallback). Confirm via ZB MCP `graphql.Boundary.boundaryExecuteRawQuery` that `MarketplaceProfileItem(orgId: ".eq.<id>", section: ".eq.onboarding_complete")` returns one record. |
| Phase 27 routing integration (full guard + form chain) | CP-07 | Phase 27 is not yet built; the actual route guard does not exist during Phase 28 execution | Defer to Phase 27 verification. Phase 28's unit test only verifies the service-level completion-status signal that Phase 27's guard will consume. |

---

---

## CP-08 Flow Coverage Map

Phase 28 covers the four CP-08 flows across two spec files. This map is the single source of truth — do NOT duplicate it inside spec files.

| # | Flow | Owning describe() block | Spec file |
|---|------|------------------------|-----------|
| 1 | Pre-fill (MPI + org fallback + please-provide) | `describe('readProfileForOrg ...')` + `describe('pre-fill annotations (CP-03)')` | marketplace-profile.service.spec.ts + company-profile-form.component.spec.ts |
| 2 | Save (dirty-diff + batched pushEntities + onboarding_complete marker) | `describe('save (CP-04, CP-05)')` | marketplace-profile.service.spec.ts |
| 3 | Skip-for-now (router navigate, no write) | `describe('skip-for-now flow (CP-06)')` | company-profile-form.component.spec.ts |
| 4 | Repeat-login-skip (completion status signal Phase 27 will consume) | `describe('routing integration (CP-07: repeat-login-skip)')` + `describe('getCompletionStatus (CP-07)')` | company-profile-form.component.spec.ts + marketplace-profile.service.spec.ts |

Phase 27 owns the actual guard implementation that consumes `getCompletionStatus()` to decide routing. Phase 28 owns the signal contract + the unit tests that verify the signal returns the right boolean given input MPI records.

---

## Validation Sign-Off

- [ ] Every task has an `<automated>` verify command OR an explicit Wave 0 dependency
- [ ] No 3 consecutive tasks without an automated verification step (sampling continuity)
- [ ] Wave 0 spec files exist (or are explicitly created in the same task that introduces the implementation)
- [ ] No `--watch` flag in any automated command (CI-friendly)
- [ ] Feedback latency < 30 seconds for task-scoped quick runs
- [ ] `nyquist_compliant: true` set in frontmatter once the planner has wired the per-task test commands

**Approval:** pending
