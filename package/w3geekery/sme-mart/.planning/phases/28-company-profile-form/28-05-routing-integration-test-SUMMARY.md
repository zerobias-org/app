---
phase: 28-company-profile-form
plan: 05
subsystem: onboarding
tags: [routing, integration, test]
type: test
status: complete
duration: 12m
completed_date: 2026-04-30
key_files:
  - modified: src/app/onboarding/company-profile-form.component.spec.ts
  - modified: .planning/phases/28-company-profile-form/28-VALIDATION.md
commits:
  - hash: 216ab62
    message: "test(28-05): add routing-integration test for CP-07 (repeat-login-skip via completion status)"
  - hash: 064705e
    message: "docs(28-05): append CP-08 Flow Coverage Map to validation artifact"
requirements_delivered:
  - CP-07
  - CP-08
---

# Phase 28 Plan 05: Routing Integration Test Summary

**Wave 5 Test Layer: Routing integration test for repeat-login-skip flow + CP-08 flow documentation.**

## One-Liner

Added routing-integration tests to CompanyProfileFormComponent.spec.ts verifying that the MarketplaceProfileService.getCompletionStatus() method correctly signals when the onboarding_complete marker is present/absent; appended CP-08 Flow Coverage Map to 28-VALIDATION.md documenting all four flows across two spec files.

## Deliverables

### 1. Routing Integration Tests (src/app/onboarding/company-profile-form.component.spec.ts)

**New describe block: `routing integration (CP-07: repeat-login-skip)`**

Two test cases validating the service-level signal that Phase 27's routing guard will consume:

1. **"should recognize when onboarding_complete marker is present (completion status true)"**
   - Sets up mock GraphqlReadService to return items array containing `{ section: 'onboarding_complete', status: 'active', data: '2026-04-30' }`
   - Creates fresh MarketplaceProfileService with mocked dependencies via TestBed.resetTestingModule()
   - Calls `service.getCompletionStatus(orgId)` → expects `true`
   - Verifies GraphqlReadService.query() was called with correct filters (orgId, section)

2. **"should recognize when onboarding_complete marker is absent (completion status false)"**
   - Sets up mock GraphqlReadService to return empty items array
   - Creates fresh MarketplaceProfileService via TestBed.resetTestingModule()
   - Calls `service.getCompletionStatus(orgId)` → expects `false`

**Test coverage summary:**
- ✓ CP-07 assumption documented: Phase 27 guard will call `getCompletionStatus()` to decide routing
- ✓ Phase 28 only tests the service signal, not the actual Phase 27 guard (not built yet)
- ✓ Both true/false cases covered for completion status determination
- ✓ Integration seam clearly documented in test comments

**Imports added:**
```typescript
import { GraphqlReadService } from '../core/services/graphql-read.service';
import { PipelineWriteService } from '../core/services/pipeline-write.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
```

### 2. CP-08 Flow Coverage Map (.planning/phases/28-company-profile-form/28-VALIDATION.md)

**New section: `## CP-08 Flow Coverage Map`**

Single-source-of-truth table documenting all four flows across spec files:

| # | Flow | describe() block | Spec file |
|---|------|------------------|-----------|
| 1 | Pre-fill (MPI + org fallback + please-provide) | readProfileForOrg + pre-fill annotations | marketplace-profile.service.spec.ts + company-profile-form.component.spec.ts |
| 2 | Save (dirty-diff + batched pushEntities + onboarding_complete marker) | save (CP-04, CP-05) | marketplace-profile.service.spec.ts |
| 3 | Skip-for-now (router navigate, no write) | skip-for-now flow (CP-06) | company-profile-form.component.spec.ts |
| 4 | Repeat-login-skip (completion status signal Phase 27 will consume) | routing integration (CP-07) + getCompletionStatus (CP-07) | company-profile-form.component.spec.ts + marketplace-profile.service.spec.ts |

**Ownership clarification:**
- Phase 27 owns the actual guard implementation that consumes `getCompletionStatus()` to decide routing
- Phase 28 owns the signal contract + the unit tests that verify the signal returns the right boolean given input MPI records

## Contract Integrity

✓ CP-07 test verifies that `getCompletionStatus()` returns `true` when onboarding_complete marker is present in GQL response
✓ CP-07 test verifies that `getCompletionStatus()` returns `false` when onboarding_complete marker is absent
✓ Phase 27 integration assumption clearly documented (guard will consume this signal)
✓ No essay-length comments added to spec files (describe block names + CP-08 map are sufficient)
✓ All four CP-08 flows documented with owning describe() blocks and spec file locations
✓ CP-08 documentation lives in validation artifact (28-VALIDATION.md), not in spec files
✓ TypeScript compilation clean (`tsc --noEmit` passes)
✓ All Phase 28 tests passing (25/25 across both spec files)

## Test Results

**Component spec (company-profile-form.component.spec.ts):** 11 tests passing
- 9 existing tests (CP-01, CP-03, CP-06 coverage)
- 2 new routing-integration tests (CP-07 coverage)

**Service spec (marketplace-profile.service.spec.ts):** 14 tests passing
- Pre-existing tests for pre-fill, save, completion status
- New completion status tests integrated into existing describe block

**Total Phase 28 test coverage:** 25 tests passing

## Deviations from Plan

**None — plan executed exactly as written.**

All hard rules satisfied:
1. ✓ CP-07 routing-integration test added to component spec
2. ✓ Test verifies MarketplaceProfileService.getCompletionStatus() correctly identifies marker presence
3. ✓ Phase 27 assumption documented (guard will use this signal to route)
4. ✓ CP-08 flow documentation added to 28-VALIDATION.md (not duplicated in spec files)
5. ✓ No essay-length narrative comments in spec files (one-line comment on Phase 27 guard acceptable)
6. ✓ All four flows (pre-fill, save, skip, repeat-login-skip) covered by unit tests
7. ✓ TypeScript compilation clean
8. ✓ All tests passing (25/25)

## Verification

✓ `npm test -- --include='src/app/onboarding/**/*.spec.ts' --include='src/app/core/services/marketplace-profile.service.spec.ts' --watch=false` — 25/25 passing
✓ `npx tsc --noEmit -p tsconfig.json` — 0 errors
✓ Routing-integration tests validate getCompletionStatus() returns true/false
✓ CP-08 flow map documents all four flows with owning test blocks
✓ Phase 27 integration assumption documented in test comments
✓ No unused imports (TS6133 clean)
✓ Commit hash: 216ab62 (test commit)
✓ Commit hash: 064705e (docs commit)

## Downstream Integration

**Phase 27 (Auth Gate + Onboarding Routing):**
- Will implement the onboarding guard that calls `marketplaceProfile.getCompletionStatus(orgId)`
- Guard will route to `/projects` if true (user already completed onboarding)
- Guard will route to `/onboarding/company-profile` if false (user needs to complete form)
- Phase 28 tests validate the service-level signal contract only

**Phase 30 (Projects Board Landing Page):**
- Receives users post-save or post-skip
- No dependency on Phase 28 completion status tests (Phase 27 owns routing decision)

## Known Stubs

**None.** All four CP-08 flows are covered by passing unit tests. No hardcoded empty values, placeholder text, or stub components identified.

## Self-Check

**Files modified:**
- ✓ `src/app/onboarding/company-profile-form.component.spec.ts` — added routing-integration describe block with 2 test cases
- ✓ `.planning/phases/28-company-profile-form/28-VALIDATION.md` — appended CP-08 Flow Coverage Map section

**Commits verified:**
- ✓ 216ab62 — test(28-05): add routing-integration test for CP-07
- ✓ 064705e — docs(28-05): append CP-08 Flow Coverage Map to validation artifact

**Test results:**
- ✓ 25/25 tests passing (component + service spec files)
- ✓ 0 TypeScript errors

**Requirements delivered:**
- ✓ CP-07: Routing-integration test for repeat-login-skip via completion status
- ✓ CP-08: All four flows documented in single-source-of-truth table

---

*Phase: 28-company-profile-form | Plan: 05 | Wave: 5 Test Layer*
*Completed: 2026-04-30 21:22 UTC | Duration: 12m | Commits: 2 | Tests: 25/25 passing | TS errors: 0*
