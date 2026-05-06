# Phase 24 Plan 03 Wave 2: Demo-Visibility Post-Filter — Summary

**Wave 2 Status:** COMPLETE — 22 of 22 user-facing services addressed (20 wired + 2 correctly skipped)
**Execution Window:** 2026-05-01 to 2026-05-05
**Total Commits:** 20 service-wiring commits + 5 defect-fix commits + 5 errata + this summary
**Strategy:** Option X (client-side post-filter) per Decision-Probe-1 (FAIL on server-side `.ne.`/`.not in.`)

---

## Wired Services (20)

Each wires `DemoVisibilityService.applyVisibility()` into list/search return paths and adds `tag` to GQL field sets. Single-record fetches use `applyVisibility([record])[0] ?? null` to return null for non-admin attempts to fetch demo records by ID. All have the canonical 5-test visibility block in their spec using the real `DemoVisibilityService` (mocking only the GQL boundary and admin signal).

| # | Service | Commit | Notes |
|---|---|---|---|
| 1 | engagements | `fdcb7ba` | First service; canonical exemplar |
| 2 | bids | `ee347ba` | |
| 3 | reviews | `a084514` | |
| 4 | notes | `24681bd` | 4 list paths + getById |
| 5 | note-folder | `ab2625e` | |
| 6 | document-instance | `aa23e9f` (spec rewritten `3b51ef4`) | Defect-fix loop: spec mock pattern |
| 7 | document-template | `3cead50` (spec rewritten `a6d51db`) | Defect-fix loop: spec mock pattern |
| 8 | form-submission | `83fb7c3` (spec rewritten `9f6511c`) | Defect-fix loop: spec mock pattern |
| 9 | bid-response | `1c968e5` (cast fix `4a1177e`) | Defect-fix loop: ComplianceSummary cast |
| 10 | sme-mart-workflow | `9408ef2` | |
| 11 | org-document | `e178215` (param restore `f5c2ef7`) | Defect-fix loop: dropped public-API params |
| 12 | sme-mart-project | `1d591cc` (cast fix `c19f9c9`) | Defect-fix loop: spec fixture cast |
| 13 | sme-mart-task | `be85ec8` | Director-finished |
| 14 | sme-mart-activity | `9c31cc6` | Director-finished |
| 15 | vetting | `1c9784b` | Director-finished |
| 16 | vendor-profile | `d51d99c` | Director-finished |
| 17 | sme-mart-board | `5b1bd2f` | Director-finished |
| 18 | service-offerings | `239aade` | Director-finished |
| 19 | project-plan | `bd3b36e` | Director-finished |
| 20 | project-prd | `da5434a` | Director-finished |
| 21 | rfp-invitation | `aec13b8` | Director-finished; 4 read paths wired |

(Plan 24-03 listed 22 services counting the two hierarchy services discussed in Skips below.)

## Skipped Services (2)

Both correctly skipped after inspection — neither has a user-facing read path that surfaces class-Object records:

- **note-hierarchy.service.ts** — Delegates `getFolderTree()` and tree operations to `NotesService` and `NoteFolderService`, both of which are already wired (entries 4 + 5 above). The only direct GQL call is `moveAllNotes()`, a write-pathway query that fetches IDs to move (not a user-facing list). No additional wrap needed; visibility applied at the lower layer.
- **engagement-hierarchy.service.ts** — Pure tag-parsing utility. Operates on `TagView` (hydra) and `TaskExtended` (platform) SDK objects, not class-Object records. Does not inject `GraphqlReadService` and has no list/search return path. The demo-visibility gate is scoped to class-Objects with a `tag` array; hydra entities are out of scope.

## Defect-Fix Loops (5 errata)

Wave 2 hit five verification-gate-skipping events. Each was caught at Director checkpoint, fix-forward applied, errata filed. Recurring pattern: agent reports clean without running the right invocation. Memory entry `feedback_tsc_spec_config_gate.md` updated; structural fix scheduled as `PRECOMMIT-TSC-GATE-1` BACKLOG entry (high priority, must land before next agent dispatch on TS-touching phases).

| Errata | Defect | Fix |
|---|---|---|
| 024 | `aad578d` commit body claimed 2-arg SimpleBatch; actual was 3-arg with `[]` | No code fix needed; errata filed for the drift |
| 025 | Wave 2 SUMMARY initially landed at phantom `.planning/phases/24-default-project-board-coming-soon-placeholders/` | `git mv` to correct phase dir at `4232a9e` |
| 026 | 117 tsc-spec errors merged as "clean" — agent ran `tsc --noEmit` (app config, excludes specs) | 3 broken specs rewritten with canonical mock pattern at `3b51ef4`/`a6d51db`/`9f6511c` |
| 027 | `e178215` dropped public-API params from `unshareDocument`/`listShares`, breaking a consumer | Restored params with `_` prefix + enabled `argsIgnorePattern: '^_'` ESLint rule at `f5c2ef7` |
| 028 | `1d591cc` shipped TS2352 in spec; agent reported "Both tsc configs clean" — only ran one | One-line cast fix at `c19f9c9` |

## Phase 27 Onboarding-Guard Loop (Tangential)

While debugging local-dev startup mid-Wave-2, surfaced a separate Phase 27 closure defect: `onboardingGuard` always returned `UrlTree` redirects (never `true`), causing infinite navigation cancellation as redirect targets re-fired the same guard. Fix at commit `51a23cf` adds `alreadyAt(target)` short-circuit. Documented inline in commit body. Not Wave 2 scope but blocked dev verification, so resolved as a side-fix.

## Verification

- **Inject count:** `grep -l "inject(DemoVisibilityService)" src/app/core/services/*.service.ts | wc -l` ≥ 20 ✓
- **applyVisibility call-site count:** ≥ 20 wrapped services ✓
- **No new server-side tag negation:** `grep -rE "tag.*\.not in\.|tag.*\.ne\." src/app/core/services/` returns only the one allowed JSDoc citation in `demo-visibility.service.ts:17` (Decision-Probe-1 reference) ✓
- **Both tsc configs clean** at `aec13b8` HEAD ✓
- **Targeted tests green** for every wired service ✓
- **ESLint clean** for every touched file ✓
- **Pre-push hook full test suite** — to be re-verified at push time

## Documented Limitations

- **Pagination under-fill:** post-filter runs after `pageSize` records fetched; if 3 of 25 are demo, user sees 22 not back-filled 25. v1.4 dataset is small; cosmetic. Do NOT implement compensating over-fetch (escalate to Option Y v1.5 if user-visible).
- **Client-side gate is bypassable in principle** via direct API/curl. Acceptable for v1.4 because demo records on UAT are non-sensitive test fixtures. Escalation path = Option Y (positive include-tag with backfill) where server-side `.eq.<marketplace>` enforces gate at API layer.
- **Three specs (document-instance, document-template, form-submission) over-mocked DemoVisibilityService** during the defect-fix loop. Wiring is verified but predicate logic in those three specs is NOT exercised end-to-end. Predicate IS covered upstream by `demo-visibility.service.spec.ts` (12 cases, Wave 0); integration risk bounded. Flagged for cleanup migration to real-service pattern as low-priority hygiene.

## Task 3 — Manual UAT Verification (Director-Led, Pending)

Plan 24-03 Task 3 (manual UAT smoke against the live app) is Director responsibility, not in this scope. To be run after Wave 2 commits push to a UAT-deployable branch. Verification matrix:

1. Non-admin user navigates to Engagements / Bids / RFPs / Documents lists. Confirm: NO records carrying either demo UUID visible; non-demo records (incl. `tag: null`) ARE visible.
2. Network tab inspection: GQL `boundaryExecuteRawQuery` requests have NO `.not in.` / `.ne.` server-side tag negation.
3. Admin user: same lists. All records visible. GQL request shape identical (no admin-specific filter); bypass happens client-side.
4. Pagination under-fill observation if applicable.

## Dependency Readiness

DG-01 (Wave 1) ✓ + DG-02/DG-03 (Wave 2) ✓ → ready for Wave 3 (Plan 24-04, admin delete-demo escape hatch).

## Pattern Lessons Captured

- The 5-errata pattern triggered errata 028 (recurring instructional intervention with diminishing returns) and BACKLOG `PRECOMMIT-TSC-GATE-1` as the structural fix.
- Touch-It-Fix-It on every modified file caught real lint debt during Director hand-finish (~10 `as any` cleanups, 1 dead variable, 1 dropped public API restore, 1 `let → const`).
- Spec mock pattern: `ReturnType<typeof fakeXService>` (using helpers from `test-helpers/angular.ts`) is canonical; `ReturnType<typeof TestBed.inject<typeof Service>>` is wrong (resolves to class type, breaks every method access).
- Hierarchy services should be inspected before wiring: if they delegate to lower-level services that ARE wired, the wrap applies transitively at the leaf layer (note-hierarchy). If they operate on non-class-Object SDK entities, they're out of scope (engagement-hierarchy).
