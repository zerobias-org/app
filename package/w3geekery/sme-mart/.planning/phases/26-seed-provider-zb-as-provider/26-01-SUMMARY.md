---
phase: 26-seed-provider-zb-as-provider
plan: 01
subsystem: director-decisions
tags: [company-info, platform-provider, distinguisher, decision-locked]

# Dependency graph
requires: []
provides:
  - "company_info convention canonical 17-section catalog (ratified, no -DRAFT suffix)"
  - "Platform-provider distinguisher decision locked: option-b (MPI provider_type section)"
  - "Forward path documented: zerobias-com/tag#1 PR (marketplace TagType) enables v1.5 migration"
affects: 
  - "Phase 26-02 (seed batch must include provider_type section)"
  - "Phase 26-03 (Browse Providers uses provider_type for discovery)"
  - "Phase 28 (form schema must filter out provider_type section)"

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - ".planning/director/COMPANY-INFO-CONVENTION.md"
    - ".planning/director/DECISIONS.md"

key-decisions:
  - "Ratified company_info convention: 17-section canonical catalog approved, no structural changes"
  - "Platform-provider distinguisher locked (option-b): MPI provider_type section with data='platform'"
  - "Rejected option-a: TagType registration (zerobias-com/tag#1 PR cycle time unknown, blocks v1.4)"
  - "Rejected option-c: Hardcoded orgId (env-fragile, doesn't generalize)"

patterns-established: []

requirements-completed: ["SP-01"]

# Metrics
duration: 15min
completed: 2026-04-28
---

# Phase 26 Plan 01: Ratify Company Info Convention & Lock Distinguisher Summary

**Company info convention ratified with canonical 17-section catalog; platform-provider distinguisher locked on option-b (MPI provider_type section with data='platform'); zerobias-com/tag#1 PR (marketplace TagType) documented as forward path for v1.5 migration.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-04-27 20:00 UTC
- **Completed:** 2026-04-28 03:45 UTC
- **Tasks:** 3 (1 ratification + 1 checkpoint resolved + 1 decision lock)
- **Files modified:** 2

## Accomplishments

- **Task 1 (completed prior agent run):** Company-info convention ratified and renamed (drop -DRAFT suffix)
  - File exists at `.planning/director/COMPANY-INFO-CONVENTION.md`
  - All 17 sections present with exact canonical names from RESEARCH.md
  - Pre-fill and save patterns documented for Phase 28 consumption
  - Frontmatter updated: `status: ratified`, `phase_ratified: 26`, `ratified_date: 2026-04-28`
  - Commit: `9d57f11` (docs(26-01): ratify company-info convention drop -DRAFT suffix)

- **Task 2 (Director decision):** Platform-provider distinguisher mechanism selected
  - Director Parks chose option-b (MPI provider_type section approach)
  - Option-a rejected: hydra `marketplace` TagType registration requires zerobias-com/tag#1 PR (cycle time unknown)
  - Option-c rejected: hardcoded orgId is env-fragile and doesn't generalize
  - Decision rationale documented in DECISIONS.md

- **Task 3 (this continuation):** Distinguisher decision locked in DECISIONS.md
  - New section: "## Platform-Provider Distinguisher (Phase 26 Plan 01)"
  - Included all required content: date, decision, mechanism, why other options rejected, forward path, anti-pattern, how to apply, test coverage
  - Forward path documented: zerobias-com/tag#1 PR (when merged) enables v1.5 migration via Pipeline.receive batch (add Object.tag, drop section)
  - Commit: `cfa38a7` (docs(26-01): lock platform-provider distinguisher decision option-b)

## Task Commits

1. **Task 1: Ratify company_info convention** — `9d57f11` (docs)
   - Verified present in prior agent run
   - File renamed from -DRAFT, frontmatter updated, ratification note added

2. **Task 2: Distinguisher checkpoint:decision** — (no commit, Director call)
   - Director Parks decided option-b
   - Decision recorded in this summary and locked in Task 3

3. **Task 3: Lock distinguisher decision in DECISIONS.md** — `cfa38a7` (docs)
   - New section added with complete rationale, mechanism, forward path
   - All required content present per plan spec

**Plan closeout metadata:** (this file, no separate commit)

## Files Created/Modified

- `.planning/director/COMPANY-INFO-CONVENTION.md` (modified Task 1 — prior agent)
  - Renamed from -DRAFT suffix
  - Ratification note added
  - Status set to `ratified`

- `.planning/director/DECISIONS.md` (modified Task 3 — this run)
  - New section: "## Platform-Provider Distinguisher (Phase 26 Plan 01)"
  - Date: 2026-04-28
  - Decision: option-b (MPI provider_type section)
  - Full rationale, mechanism, forward path documented

## Decisions Made

1. **Company info convention is stable:** 17-section canonical catalog locked without structural changes. Phase 28 form schema and Phase 22 template library can consume it as-is.

2. **Platform-provider distinguisher: option-b (MPI provider_type section):** Stays entirely within MPI class shape; simpler than option-a (requires unknown TagType registration cycle); more generalizable than option-c (hardcoded UUID). Trade-off: Phase 28 form must explicitly skip/hide the provider_type section (one-line filter). Phase 26-03 Browse Providers filter uses section presence for discovery.

3. **Forward path to v1.5:** zerobias-com/tag#1 PR (opened 2026-04-27, pending merge) introduces `marketplace` TagType with `platform_provider` global tag. If/when merged + published, v1.5 can migrate via one-shot Pipeline.receive batch: add `Object.tag` field, drop `provider_type` section. Migration is idempotent and not blocking v1.4.

## Deviations from Plan

None - plan executed exactly as written.

**Note:** Task 1 was completed in a prior agent run (commit `9d57f11` verified present). Task 2 was a decision checkpoint resolved by Director Parks at 2026-04-28. Task 3 (lock decision in DECISIONS.md) completed in this continuation agent run.

## Issues Encountered

None. Continuation executed cleanly.

## Next Phase Readiness

**Phase 26-02 (seed batch) readiness:** 
- Convention and distinguisher locked; can proceed with concrete implementation
- Seed batch must include one additional MPI record per ZB org: `{ section: "provider_type", data: "platform", ... }`
- Must also include `markDeleted` cleanup for UAT test residue (mpi-test-a-cd7105df, mpi-test-b-cd7105df per DECISIONS.md note)

**Phase 26-03 (Browse Providers) readiness:**
- Distinguisher mechanism locked; can implement provider filtering
- Filter logic: check for presence of `provider_type` section in MPI records
- GQL discovery path: `MarketplaceProfileItem(orgId: ".eq.<orgId>", section: ".eq.provider_type") { data }` OR filter client-side

**Phase 28 (company profile form) readiness:**
- Convention and distinguisher locked
- Must add filter to form schema: skip/hide `provider_type` section from form rendering
- Pre-fill logic will receive provider_type section from GQL but must not surface it to user

**Side-channel tracking:**
- zerobias-com/tag#1 PR opened 2026-04-27 — requested `marketplace` TagType with `platform_provider` tag
- If/when PR merges: log migration plan in Phase 26-02 commit for v1.5 actionability
- No blocking dependency on PR for v1.4 (option-b works standalone)

---

*Phase: 26-seed-provider-zb-as-provider*
*Plan: 01*
*Completed: 2026-04-28*
