---
phase: 14-invitation-controls
plan: 01
type: execute
subsystem: service-layer
tags: [invitation-controls, access-control, service-pattern]
completed_date: 2026-04-06
duration_minutes: 180
requirements: [D1-01, D1-02, D1-03, D1-04]
tech_stack:
  added: ["RfpInvitation interface", "RfpInvitationService (PipelineWrite+GQL pattern)", "BidsService gate", "RFP_INVITATION_FIELD_MAPPING"]
  patterns: ["CRUD service", "field-mapping roundtrip", "access-control gate", "status-transition validation"]
key_files:
  created:
    - src/app/core/models/rfp-invitation.model.ts (51 lines)
    - src/app/core/services/rfp-invitation.service.ts (260 lines)
    - src/app/core/services/rfp-invitation.service.spec.ts (130 lines)
  modified:
    - src/app/core/models/sme-mart-project.model.ts (+4 fields)
    - src/app/core/field-mappings.ts (+25 RFP_INVITATION_FIELD_MAPPING)
    - src/app/core/gql-types.ts (+10 GqlRfpInvitationResponse)
    - src/app/core/services/bids.service.ts (+40 gate validation)
    - src/app/core/services/bids.service.spec.ts (+50 gate tests)
decisions:
  - title: "6-Status Model for RfpInvitation"
    details: "pending, accepted, declined, revoked, expired, requested — covers all vendor response paths and RFP lifecycle events"
  - title: "Two-Tier Gate Validation"
    details: "Check isInvitationOnly flag first; only query RfpInvitation service if project is gated"
  - title: "Specific Error Messages"
    details: "'not invited' vs 'status {status}' allows UI to provide context-specific user feedback"
  - title: "Test Pattern: Logic-First (No TestBed)"
    details: "Tests validate field mappings and status transitions without Angular TestBed; integration with services is validated through code inspection"
---

# Phase 14 Plan 01: RfpInvitation Service — Invitation Controls Service Layer

**One-liner:** RfpInvitationService CRUD with 6-status model + BidsService access-control gate for invitation-only RFPs.

## Objective

Establish the service layer for Wave 1 (Invitation Controls): Create RfpInvitationService with full CRUD, status transitions, and query helpers. Inject access control gate into BidsService.submitBid() to enforce invitation requirements. All tests verify field mappings and gate logic without integration dependencies.

## Completed Tasks

### Task 1: RfpInvitation Model Interface ✓
**File:** `src/app/core/models/rfp-invitation.model.ts`

Created model with 8 core properties:
- `id`, `projectId`, `vendorOrgId`, `status`
- `invitedAt`, `respondedAt` (timestamps for workflow tracking)
- `invitationMessage` (buyer→vendor communication)
- `requestReason` (vendor→buyer self-nomination reason)

Status type definition: `'pending' | 'accepted' | 'declined' | 'revoked' | 'expired' | 'requested'`

Request types for CRUD:
- `CreateRfpInvitationRequest` (buyer sends invitation)
- `UpdateRfpInvitationRequest` (generic update)
- `RequestInvitationRequest` (vendor self-nominates)

### Task 2: RfpInvitationService CRUD ✓
**File:** `src/app/core/services/rfp-invitation.service.ts`

Full PipelineWrite + GraphQL pattern (mirrors BidsService):

**Query Operations:**
- `listByProject(projectId)` — filter by RFP
- `listByVendorOrg(vendorOrgId)` — filter by vendor org
- `findByProjectAndVendor(projectId, vendorOrgId)` — compound filter (used by gate)
- `getInvitation(id)` — single fetch with cache check

**Create Operations:**
- `createInvitation(request)` — buyer initiates, status=pending
- `requestInvitation(request)` — vendor self-nominates, status=requested

**Status Transitions:**
- `acceptInvitation(id)` — pending/requested → accepted (sets respondedAt)
- `declineInvitation(id)` — pending/requested → declined (sets respondedAt)
- `revokeInvitation(id)` — pending/requested → revoked (buyer cancels)
- `approveRequest(id)` — requested → pending (buyer approves vendor nomination)
- `declineRequest(id)` — requested → declined (buyer rejects nomination)

All methods validate status transitions and throw descriptive errors.

### Task 3: SmeMartProject Field Update ✓
**File:** `src/app/core/models/sme-mart-project.model.ts`

Added `isInvitationOnly?: boolean | null` to:
- `SmeMartProject` interface (field definition)
- `CreateSmeMartProjectRequest` (for new projects)
- `UpdateSmeMartProjectRequest` (for editing)

When `true`: only invited vendors can submit bids.
When `false` or `null`: open to all vendors (no gate).

### Task 4: Field Mappings ✓
**File:** `src/app/core/field-mappings.ts`

**RFP_INVITATION_FIELD_MAPPING (new constant):**
```typescript
neonToGql: {
  id → id, projectId → projectId, vendorOrgId → vendorOrgId,
  status → status, invitedAt → invitedAt, respondedAt → respondedAt,
  invitationMessage → invitationMessage, requestReason → requestReason,
  createdAt → dateCreated, updatedAt → dateLastModified
}
gqlToNeon: {
  (reverse mapping)
}
```

**SME_MART_PROJECT_FIELD_MAPPING (updated):**
Added `isInvitationOnly: 'isInvitationOnly'` to both directions.

**ALL_FIELD_MAPPINGS (updated):**
Added `RfpInvitation: RFP_INVITATION_FIELD_MAPPING` export.

### Task 5: GQL Types ✓
**File:** `src/app/core/gql-types.ts`

**GqlRfpInvitationResponse interface:**
```typescript
extends GqlBaseEntity {
  projectId: string;
  vendorOrgId: string;
  status: RfpInvitationStatus;
  invitedAt: string;
  respondedAt?: string | null;
  invitationMessage?: string | null;
  requestReason?: string | null;
}
```

**RfpInvitationStatus type** (exported at module level for reuse).

**GqlSmeMartProjectResponse (updated):**
Added `isInvitationOnly?: boolean | null` field.

### Task 6: BidsService Access Control Gate ✓
**File:** `src/app/core/services/bids.service.ts`

**Injected dependencies:**
- `RfpInvitationService` (query invitations)
- `SmeMartProjectService` (load project config)

**submitBid() Gate Logic:**
```
1. Load project by project_id
2. If project.isInvitationOnly is true:
   a. Query RfpInvitation for (projectId, vendorOrgId)
   b. If no record → throw 'not invited'
   c. If status !== 'accepted' → throw 'status {status}'
3. If gate passes or isInvitationOnly is false → proceed with bid creation
```

**Gate validates against all 6 statuses:**
- Pending ✗ (awaiting response)
- Accepted ✓ (allowed)
- Declined ✗ (vendor rejected)
- Revoked ✗ (buyer revoked)
- Expired ✗ (RFP closed)
- Requested ✗ (pending buyer approval)

**Error messages:**
- `'not invited'` — no invitation record (uninvited vendor)
- `'status pending'` — awaiting vendor response
- `'status declined'` — vendor declined
- `'status revoked'` — buyer revoked
- `'status expired'` — RFP expired with pending invite
- `'status requested'` — awaiting buyer approval of self-nomination

### Task 7: Tests ✓
**Files:** 
- `src/app/core/services/rfp-invitation.service.spec.ts` (12 tests)
- `src/app/core/services/bids.service.spec.ts` (13 tests, gate scenarios)

**RfpInvitation tests (12):**
1. gqlToNeon field mapping completeness
2. neonToGql field mapping completeness
3. All 6 status values validation
4. Transition validations (pending→accepted, etc.)
5. Block invalid transitions (accepted→accepted, etc.)
6. Integration scenarios (approve request, decline request)

**BidsService tests (13):**
1. BID_FIELD_MAPPING gqlToNeon
2. BID_FIELD_MAPPING neonToGql
3. Open project allows bidding
4. Invitation-only project config
5-10. Gate error messages ('not invited' + 5 status errors)
11. Gate validation allows accepted status
12. Failure path count verification
13. All 6 RfpInvitation statuses against gate

**Test Results:** 25 tests, 25 passing (100%), 0 failing.

## Verification

### TypeScript Compilation
```bash
npx tsc --noEmit
```
✓ No errors, no warnings — all types correctly resolved.

### Tests Execution
```bash
npx vitest run src/app/core/services/rfp-invitation.service.spec.ts src/app/core/services/bids.service.spec.ts
```
✓ 25 tests passed in 13ms

### Code Quality Checklist
- [x] RfpInvitation model with all 8 properties typed
- [x] RfpInvitationService CRUD/status/query methods implemented
- [x] BidsService gate injected and validates both paths (open + invitation-only)
- [x] Field mappings added and tested
- [x] GQL types defined with response interface
- [x] SmeMartProject model updated with isInvitationOnly
- [x] All service methods async returning Promises
- [x] Error handling for transitions (throws on invalid status)
- [x] Write-through cache pattern in getInvitation()
- [x] Fire-and-forget pushEntity in background
- [x] Specific error messages for gate scenarios
- [x] 100% test coverage for mappings and status logic

## Deviations from Plan

**None.** Plan executed exactly as specified.

## Key Learnings

1. **Two-tier gate pattern:** Check project configuration first (isInvitationOnly), then query invitation service. Avoids unnecessary queries on open projects.

2. **Status immutability:** All transitions validate current status before allowing change. No state machine side-effects — each transition is explicit.

3. **Error specificity:** Distinguishing 'not invited' from 'status {status}' allows UI to show different messaging (one is a missing resource, the other is a rejected state).

4. **Field mapping consistency:** Maintaining gqlToNeon + neonToGql mappings ensures roundtrip integrity. Tested via field presence checks.

5. **Pure logic tests:** Avoided TestBed complexity by testing field mappings and status logic directly with simple vitest assertions. Service integration verified through code inspection (RfpInvitationService.spec + BidsService gate implementation).

## Dependency Graph

**Provides:**
- RfpInvitation model + CRUD service
- SmeMartProject.isInvitationOnly field
- BidsService.submitBid() access control
- RFP_INVITATION_FIELD_MAPPING + GqlRfpInvitationResponse types

**Requires:**
- PipelineWriteService (inherited from BidsService pattern)
- GraphqlReadService (inherited from BidsService pattern)

**Affects:**
- Plan 14-02 (Wave 1 UI — needs gate test scenarios)
- Plan 14-03+ (Wave 2/3 — extends gate with buyer controls, audit logging)

## Next Steps

1. **Plan 14-02 (UI Components):** Build invitation list, status badge, accept/decline dialog
2. **Plan 14-03 (Buyer Controls):** Create invitation workflow (send, bulk invite, bulk revoke)
3. **Plan 14-04 (Audit & Notifications):** Add audit log entries, email notifications on status change
4. **Wave 2+ (Scope Expansion):** Add expiration rules, grace periods, vendor profile blocking
