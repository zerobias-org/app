---
phase: 18
plan: 3
subsystem: org-switcher
type: hotfix
date_completed: "2026-04-16"
duration_minutes: 45
tasks_completed: 3
files_modified: 4
commits: 3
tags: [filter-removal, ui-fix, docs]
decisions: 
  - 2026-04-15 org-list no-filter policy (tracking errata 014)
metrics:
  service_lines_of_code: 79
  spec_test_count: 8
  build_status: success
---

# Phase 18 Plan 3: Drop Org List Filters + Remove Double Chevron — Summary

## One-Liner

Stripped all filtering rules from OrgSwitcherService.orgs$ (hidden:true, System Org, ops-org), removed explicit submenu caret icon from user-profile-dropdown template, and recorded 2026-04-15 policy decision in DECISIONS.md.

## Objective

Three surgical edits to resolve UAT issues:
1. **Filter mask hiding legitimate orgs** — Platform sets `hidden:true` universally on UAT; client-side filters were masking all valid orgs from the switcher. Solution: drop all filters. Admin marketplace usage doesn't require filtering.
2. **Double-chevron rendering** — Explicit `<mat-icon matMenuTriggerIcon>arrow_right</mat-icon>` rendered alongside Material's default submenu caret. Solution: delete the explicit icon; Material default caret stays.
3. **Documentation drift** — DECISIONS.md "Org List Filtering Rules" entry still reflected the old filter-based policy. Solution: append 2026-04-15 addendum noting the no-filter policy change and errata 014 tracker.

## Work Completed

### Task 1: Strip Filters from OrgSwitcherService + Prune Spec

**Files Modified:**
- `src/app/core/services/org-switcher.service.ts` (79 lines, -3 imports implicit)
- `src/app/core/services/org-switcher.service.spec.ts` (-101 lines, 8 tests remain)

**Changes:**
- Removed `SYSTEM_ORG_ID` constant (line 14)
- Deleted private methods: `isHiddenOrg`, `isSystemOrg`, `isOpsOrg` (lines 86–107)
- Replaced `orgs$` body with unfiltered sort: `this.rawOrgs().sort((a, b) => a.name.localeCompare(b.name))`
- Deleted entire `describe('Filter Rules', ...)` block (3 tests: hidden orgs, System Org, ops-org filtering)
- Simplified `describe('orgs$ signal', ...)` test to verify sort-only on 3-item fixture (no hidden/system entries to "filter out")

**Verification:**
- `grep -n "\.filter("` → 0 matches ✓
- `grep -n "isHiddenOrg\|isSystemOrg\|isOpsOrg\|SYSTEM_ORG_ID"` → 0 matches ✓
- `grep -n "Filter Rules"` → 0 matches ✓
- `npm test -- --include='**/org-switcher.service.spec.ts' --watch=false` → **8 tests PASS** ✓
  - 2 × loadOrgs regression (empty array, error handling)
  - 1 × orgs$ signal (sort order)
  - 5 × switchTo (no-op, dialog open, selectOrg call, success, error)

**Commit:** `3feb4b6` — `refactor(org-switcher): drop all org list filters — admin sees everything (errata 014 tracker)`

### Task 2: Remove Explicit Submenu Caret Icon

**Files Modified:**
- `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html` (-1 line)

**Changes:**
- Deleted line 38: `<mat-icon matMenuTriggerIcon>arrow_right</mat-icon>`
- Kept `<mat-icon>switch_account</mat-icon>` (leading icon) and `<span>Switch Organization</span>` intact
- Material `[matMenuTriggerFor]` directive auto-renders default submenu caret

**Verification:**
- `grep -n "matMenuTriggerIcon\|arrow_right"` → 0 matches ✓
- `npm run build` → **success** (no template errors) ✓
- Component spec has no caret icon assertions to update ✓

**Commit:** `5f4c0e1` — `fix(user-profile-dropdown): remove explicit submenu caret — Material default stays`

### Task 3: Update DECISIONS.md "Org List Filtering Rules"

**Files Modified:**
- `.planning/director/DECISIONS.md` (+4 lines)

**Changes:**
- Appended 2026-04-15 update under the existing "Anti-pattern:" line of the "Org List Filtering Rules" decision entry
- Addendum text (verbatim from plan):
  ```
  **Update 2026-04-15:** As of Phase 18 Plan 18-03, **no filtering is applied** in SME Mart. 
  Platform `hidden: true` flag is effectively useless (universal `true` on UAT orgs), System Org 
  and ops-org exclusions are not worth the code for admin-only marketplace usage. 
  `OrgSwitcherService.orgs$` and `org-list.component.ts` both surface the full `listMyOrgs()` 
  result (alphabetical). Revisit when Kevin/Chris clarify platform `hidden` semantics — 
  tracking **errata 014** + Chris Slack thread.
  ```
- Preserved original 2026-03-30 decision text

**Verification:**
- `grep -n "2026-04-15"` → match in DECISIONS.md (line 99) ✓
- `grep -n "errata 014"` → match in DECISIONS.md (line 99) ✓

**Commit:** `e4ad1ee` — `docs(director): record 2026-04-15 no-filter policy on Org List Filtering Rules`

## Test Results

| Test File | Result | Details |
|-----------|--------|---------|
| `org-switcher.service.spec.ts` | **PASS** (8/8) | 2 loadOrgs regression + 1 orgs$ sort + 5 switchTo tests |
| Build (`npm run build`) | **SUCCESS** | No TS errors; standard ESM warnings only |

## Requirements Met

| Req | Status | Evidence |
|-----|--------|----------|
| OS-01 (visual) | ✓ | Double-chevron caret removed; Material default renders single caret |
| OS-04 (list content) | ✓ | orgs$ now unfiltered; all orgs from listMyOrgs visible (sorted alphabetically) |

## Known Stubs / Deferred Work

**None.** All filter removal is complete. Filtering logic was completely deleted; no stub placeholders remain.

### Out of Scope (Confirmed)

- **`src/app/pages/orgs/org-list.component.ts`** — Unchanged. Page uses its own narrower filter set (SYSTEM_ORG_ID + name==='Operations' + search). Left alone per plan instructions.
- **Platform `hidden:true` semantics** — Deferred to errata 014 (owner: Kevin/Chris). Plan tracks this explicitly.

## Deviations from Plan

**None.** Plan executed exactly as written. Three surgical edits completed; no bugs encountered, no critical missing functionality discovered.

## Phase 18 Status

**Phase 18 Completion Gate:** Director UAT review (screenshot verification) required before ROADMAP checkbox flips. This plan (18-03) is the final plan in Phase 18; Phase 18 Plans 18-01 and 18-02 landed 2026-04-15 (prior to this hotfix).

**What Director needs to verify (UAT):**
1. Populated org list (≥2 orgs, including ones previously hidden by `hidden:true` on UAT)
2. Single chevron on "Switch Organization" button (Material default, no explicit arrow_right)
3. Alphabetical sort order preserved
4. Clicking org triggers spinner dialog + reload; new `dana-org-id` header applies to subsequent requests

## Files Created/Modified

| File | Type | Change | Size |
|------|------|--------|------|
| `src/app/core/services/org-switcher.service.ts` | service | Deleted filters, SYSTEM_ORG_ID, 3 methods | 79 lines |
| `src/app/core/services/org-switcher.service.spec.ts` | test | Deleted Filter Rules block, simplified orgs$ test | 240 lines (was 352) |
| `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html` | template | Removed arrow_right icon line | 115 lines (was 116) |
| `.planning/director/DECISIONS.md` | doc | Appended 2026-04-15 addendum | 103 lines (was 99) |

## Commits

1. **`3feb4b6`** — `refactor(org-switcher): drop all org list filters — admin sees everything (errata 014 tracker)`
   - Removes SYSTEM_ORG_ID, isHiddenOrg/isSystemOrg/isOpsOrg
   - Simplifies orgs$ to unfiltered sort
   - Deletes Filter Rules spec block
   
2. **`5f4c0e1`** — `fix(user-profile-dropdown): remove explicit submenu caret — Material default stays`
   - Removes explicit arrow_right icon
   
3. **`e4ad1ee`** — `docs(director): record 2026-04-15 no-filter policy on Org List Filtering Rules`
   - Appends policy update to DECISIONS.md

## Session Metadata

- **Executor:** Claude Haiku 4.5 (gsd-execute-phase 18 orchestrator)
- **Plan Type:** hotfix (autonomous, no checkpoints)
- **Autonomous:** true
- **Date Executed:** 2026-04-16
- **Duration:** ~45 minutes
- **Session Resume:** `claude --resume poc/sme-mart`

---

**PLAN EXECUTION COMPLETE** ✓ All three tasks committed. Awaiting Director UAT review for Phase 18 close gate (errata 014 tracking separate).
