---
phase: 26-seed-provider-zb-as-provider
plan: 04
subsystem: pipeline-write-canonical-class-ids
tags: [class-id-correction, silent-failure-fix, tdd, uat-verified]

# Dependency graph
requires: [26-02]
provides:
  - "Canonical platform-assigned class ids for MarketplaceProfileItem + EngagementVettingItem"
  - "Test-pinned canonical UUIDs (regression caught at commit time)"
  - "UAT proof: Pipeline.receive accepts both class ids; GQL read-back confirms materialization"
affects:
  - "vendor-profile.service.ts (every MPI write was failing silently — now lands)"
  - "vetting.service.ts (every EngagementVettingItem write was failing silently — now lands)"
  - "Director Phase 20 silent-failure audit (separate plan)"

# Tech tracking
tech-stack:
  modified:
    - "src/app/core/services/pipeline-write.service.ts (2 const swaps + comment refresh)"
    - "src/app/core/services/pipeline-write.service.spec.ts (new describe block, 2 tests)"
  added:
    - ".planning/phases/26-seed-provider-zb-as-provider/26-04-CLEANUP-QUEUE.md"
  patterns:
    - "TDD red->green at the const-correction layer (2 failing tests, then green)"
    - "MCP-direct UAT verification (sanctioned path) over UI-path triggering"
    - "Test-pinned UUIDs prevent silent regression of platform-assigned ids"

key-files:
  modified:
    - "src/app/core/services/pipeline-write.service.ts"
    - "src/app/core/services/pipeline-write.service.spec.ts"
  created:
    - ".planning/phases/26-seed-provider-zb-as-provider/26-04-CLEANUP-QUEUE.md"

key-decisions:
  - "MarketplaceProfileItem class id locked to 7bcf86a5-91dc-520d-b9bf-e308b1078d46 (was fictional ee1e68b7-...)"
  - "EngagementVettingItem class id locked to 21f5841f-dd27-53ef-a0f5-6a816ec7f7e1 (was fictional 66fa174f-...)"
  - "Both ids platform-assigned at class registration; deterministic UUID v5 derivation does not match"
  - "MCP-direct verification preferred over UI-path triggering (Director refinement)"
  - "UI-path verification (vendor-profile.create + vetting.initializeVetting) deferred to Director close-out"

requirements-completed: []  # Plan 26-04 has no SP-* requirement IDs (defect remediation)

# Metrics
completed: 2026-04-28
test_files: 1 (pipeline-write.service.spec.ts)
test_cases_added: 2
test_status: 16 passed (was 14, +2 new canonical-UUID assertions)
build_status: ng build --configuration=development PASSING
tsc_status: tsconfig.app.json + tsconfig.spec.json both clean
uat_verification: COMPLETE (1 MPI + 1 EVI written, GQL read-back confirmed)
commits: 2 (red, green)
---

# Plan 26-04 — Correct Fictional Class IDs in PipelineWriteService

Two `SME_MART_CLASS_IDS` consts in `pipeline-write.service.ts` were fictional UUID-v5 hashes that the platform never registered. Pipeline.receive rejected both with "No such Class". Every MPI write through `vendor-profile.service.ts` and every EngagementVettingItem write through `vetting.service.ts` was failing silently because both call sites swallow errors via `.catch(err => console.error(...))`. Plan replaces both consts with the canonical platform-assigned IDs and pins them in tests.

## Tasks (3/3 complete)

### Task 1 — Red phase: pin canonical UUIDs in tests

**Commit:** `7a9e274` `test(26-04): add canonical UUID assertions for MPI + vetting class ids (wave 0, red phase)`

Appended a new `describe('SME_MART_CLASS_IDS canonical UUIDs', ...)` block to `pipeline-write.service.spec.ts` with two tests asserting the canonical class IDs via `batch.classId.toString()`. Mock shape mirrors the existing `beforeEach` exactly — `platformClient` property accessor + `getPipelineApi()` method + `receive(pipelineId, batch)` two-arg call where batch is a `SimpleBatch` instance. Reference: `feedback_tests_passing_against_wrong_shape_mocks.md`.

Confirmed RED: 2 new failures with diagnostic clarity:
```
× MarketplaceProfileItem must use canonical class id 7bcf86a5-...
  Expected: "7bcf86a5-91dc-520d-b9bf-e308b1078d46"
  Received: "ee1e68b7-f003-5f5f-a111-7ec93b37681c"

× EngagementVettingItem must use canonical class id 21f5841f-...
  Expected: "21f5841f-dd27-53ef-a0f5-6a816ec7f7e1"
  Received: "66fa174f-86b2-5854-b7c1-7ffe26fcaa46"
```
14 existing tests continued passing — no regression.

### Task 2 — Green phase: replace consts + refresh comments

**Commit:** `b1e997b` `fix(26-04): replace fictional class ids with canonical platform-assigned uuids (green phase)`

Replaced two consts in `SME_MART_CLASS_IDS`:

| Class | Before (fictional) | After (canonical) |
|-------|-------------------|-------------------|
| EngagementVettingItem | `66fa174f-86b2-5854-b7c1-7ffe26fcaa46` | `21f5841f-dd27-53ef-a0f5-6a816ec7f7e1` |
| MarketplaceProfileItem | `ee1e68b7-f003-5f5f-a111-7ec93b37681c` | `7bcf86a5-91dc-520d-b9bf-e308b1078d46` |

Inline comments refreshed to characterize IDs as platform-assigned (not v5-derived). The "deterministic UUID v5 from schema" claim dropped from both lines. Other 21 class IDs untouched (Director-audited as correct).

Verification chain — all green:
```
$ npx tsc --noEmit -p tsconfig.app.json    # clean
$ npx tsc --noEmit -p tsconfig.spec.json   # clean
$ npx ng build --configuration=development # bundle generation complete (~6.7s)
$ npm test --include='**/pipeline-write.service.spec.ts' # 16 passed
$ npm test --include='**/seed-zb-provider.spec.ts'       # 8 passed (no regression)
```

### Task 3 — UAT verification (MCP-direct per Director refinement)

**No source files modified; produced cleanup queue note.**

Acquired ZB MCP profile lock (`uat-clark-w3geekery`), wrote one record per class via `mcp__zerobias__zerobias_execute platform.Pipeline.receive`, GQL read-back via `graphql.Boundary.boundaryExecuteRawQuery`.

#### MPI write

```
mcp__zerobias__zerobias_execute platform.Pipeline.receive
  pipelineId: 43f08afd-7ab9-4e99-a93c-619c46adaabe
  simpleBatch:
    classId: 7bcf86a5-91dc-520d-b9bf-e308b1078d46
    data: [{
      id: mpi-26-04-uat-verify-cd7105df-test_section,
      orgId: cd7105df-523d-5392-9f9a-3f83d3f30107  (W3Geekery),
      section: test_section,
      data: "26-04 canonical-id verification",
      status: active
    }]
```

Response: `{"success":true,"message":"Operation completed (no content returned)"}` — no "No such Class" error.

GQL read-back (boundary `c15fb2dc-4f8c-48b5-b27a-707bd516b005`):
```graphql
{ MarketplaceProfileItem(id: ".eq.mpi-26-04-uat-verify-cd7105df-test_section")
  { id orgId section data status } }
```
Result: 1 row, all fields match seeded values. ✓

#### EVI write

```
mcp__zerobias__zerobias_execute platform.Pipeline.receive
  pipelineId: 43f08afd-7ab9-4e99-a93c-619c46adaabe
  simpleBatch:
    classId: 21f5841f-dd27-53ef-a0f5-6a816ec7f7e1
    data: [{
      id: evi-26-04-uat-verify-test,
      engagementId: 746010b7-dc99-436b-9142-8c4b85c5e623  (W3Geekery default engagement),
      category: always, vettingType: other, evidenceType: attestation,
      status: pending, direction: buyer_requires, documentIds: "[]"
    }]
```

Response: `{"success":true,"message":"Operation completed (no content returned)"}`.

GQL read-back:
```graphql
{ EngagementVettingItem(id: ".eq.evi-26-04-uat-verify-test")
  { id engagementId status category vettingType } }
```
Result: 1 row, all fields match. ✓ — confirms `21f5841f-...` is the correct canonical UUID for EngagementVettingItem on UAT.

#### Cleanup queue

`.planning/phases/26-seed-provider-zb-as-provider/26-04-CLEANUP-QUEUE.md` records both test IDs for `markDeleted` inclusion in the next real Pipeline.receive batch on each class. Pattern mirrors Plan 26-02 (no delete-only batches; rides with the next real data).

#### Profile lock

Acquired before UAT operations (`gsd-execute` / `uat-clark-w3geekery`); released after.

## Director Close-Out (deferred — not gating Plan 26-04)

Per Director refinement, the UI-path verification pass (`vendorProfile.create` + `vetting.initializeVetting` triggered through the running Angular app, watching browser console for the absence of `[VendorProfileService] Failed ...` and `[VettingService] Failed ...` errors) is a separate Director close-out item. Not blocking plan close. The MCP-direct writes are sufficient proof that Pipeline.receive accepts the corrected IDs.

## Build / Test Status

```
$ npx tsc --noEmit -p tsconfig.app.json     # clean
$ npx tsc --noEmit -p tsconfig.spec.json    # clean
$ npx ng build --configuration=development  # Application bundle generation complete
$ npm test --include='**/pipeline-write.service.spec.ts' # 16 passed (was 14 + 2 new)
$ npm test --include='**/seed-zb-provider.spec.ts'       # 8 passed (no regression)
$ Pipeline.receive (canonical MPI id)       # success
$ Pipeline.receive (canonical EVI id)       # success
$ GQL MPI read-back                         # 1 row, fields match
$ GQL EVI read-back                         # 1 row, fields match
```

## Out of Scope (preserved)

- Phase 20 fire-and-forget audit + remediation (Director planning separately)
- Refactoring `vendor-profile.service.ts` / `vetting.service.ts` `.catch(...)` swallow patterns
- The other 21 entries in `SME_MART_CLASS_IDS` (Director audit confirmed correct)

## Commits

| Commit | Subject |
|--------|---------|
| `7a9e274` | test(26-04): add canonical UUID assertions for MPI + vetting class ids (wave 0, red phase) |
| `b1e997b` | fix(26-04): replace fictional class ids with canonical platform-assigned uuids (green phase) |
| {pending} | docs(26-04): plan summary + cleanup queue (UAT-verified) |

---

*Phase: 26-seed-provider-zb-as-provider*
*Plan: 04*
*Completed: 2026-04-28*
*Status: UAT-VERIFIED — UI-path verification deferred to Director close-out*
