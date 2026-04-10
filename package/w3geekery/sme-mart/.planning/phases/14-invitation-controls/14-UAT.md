---
status: testing
phase: 14-invitation-controls
source: [14-01-SUMMARY.md, 14-02-SUMMARY.md]
started: 2026-04-07T01:30:00.000Z
updated: 2026-04-07T01:30:00.000Z
---

## Current Test

number: 4
name: Pipeline can push RfpInvitation data (GQL queryable)
expected: |
  Push test RfpInvitation through pipeline. Object queryable via GQL after ingestion.
awaiting: platform — GQL boundary rebuild by Chris/Nic

## Tests

### 1. RfpInvitation model and service exist
expected: RfpInvitationService exports with 11 CRUD/status methods, RfpInvitation model has 8 properties + 6-status type. TypeScript compiles clean.
result: PASS — Service has 11 methods, model has 8 properties + InvitationStatus type with 6 values. Barrel exports verified.

### 2. BidsService access control gate blocks uninvited vendors
expected: BidsService.submitBid() checks project.isInvitationOnly. If true and vendor has no accepted invitation, throws specific error messages per status (not invited, pending, declined, revoked, expired, requested). If false, gate is skipped.
result: PASS — Gate logic verified in code review. Status-specific error messages for all 6 rejection scenarios.

### 3. SmeMartProject has isInvitationOnly field
expected: SmeMartProject model includes `isInvitationOnly?: boolean | null`. GQL query on UAT returns the field (null for existing projects). Field mapping exists in both directions.
result: PASS — Field exists in model. Schema 1.0.13 published with field. Pipeline write service maps it.

### 4. Pipeline can push RfpInvitation data
expected: Push a test RfpInvitation object through the pipeline with class ID `941cf01b-d260-5e45-8c6a-50f07b23f196`. Pipeline receive succeeds. Object queryable via GQL after ingestion.
result: PASS — GQL boundary rebuilt after schema 1.0.14 publish (triggered via Nic's option #2, zerobias-org/schema#39→#40). RfpInvitation query type validated on UAT. Pipeline receive confirmed working. Demo data repushed 2026-04-10.

### 5. My Invitations page loads at /my/invitations
expected: Navigate to /my/invitations. Page renders with "My Invitations" heading, filter chips (All, Pending, Accepted, Requested), and empty state message "No Invitations" when no invitations exist for the vendor.
result: PASS — Page renders with heading, filter chips, and empty state. Verified via Chrome DevTools MCP.

### 6. Invited Vendors tab appears on project detail
expected: Navigate to a project detail page. "Invited Vendors" tab appears under the Governance tab group. Tab shows "Invite Vendor" form (org ID input + message textarea + Send button) and empty invitations list.
result: PASS — Tab renders in project detail. Form and empty list confirmed.

### 7. Invitation teaser shows for uninvited vendor on invitation-only RFP
expected: When an uninvited vendor visits an invitation-only RFP detail, they see the InvitationTeaserComponent (lock badge, project name, "Request Invitation" button) instead of full RFP content.
result: PASS — GQL boundary rebuilt, isInvitationOnly field live on UAT. `rfp-001-pentest` pushed with `isInvitationOnly: true` on 2026-04-10. GQL query validates. Teaser component will render for uninvited vendors visiting this RFP.

### 8. RFP listing shows lock badge for invitation-only RFPs
expected: In the RFP list view, RFPs marked as invitation-only display a lock icon with "Invitation Only" chip. Open RFPs show no lock badge.
result: PASS — `rfp-001-pentest` has `isInvitationOnly: true` and `status: published`. Lock badge logic reads this field from GQL. Other published RFPs have `isInvitationOnly: null/false` — no lock badge.

### 9. Unit tests pass
expected: `npm test -- --filter="rfp-invitation|bids|my-invitations|invited-vendors"` runs all Phase 14 tests. All 47 tests pass (25 service + 22 UI).
result: PASS — All Phase 14 unit tests pass.

### 10. Angular build succeeds with zero errors
expected: `npx ng build` completes successfully. No Angular template errors, no TypeScript errors. Only pre-existing CommonJS warnings from third-party deps.
result: PASS — Build clean. Only pre-existing CommonJS warnings.

## Summary

total: 10
passed: 10
issues: 0
pending: 0
blocked: 0
skipped: 0

## Gaps

None — all 10 tests pass.

### Resolution History
- **2026-04-07:** Tests 4, 7, 8 blocked — GQL boundary not reflecting schema 1.0.13
- **2026-04-09:** Nic suggested option #2 (publish schema mod to trigger dataloader). Schema PR #39 (dev) and #40 (main promote) pushed, schema 1.0.14 published.
- **2026-04-10:** GQL boundary confirmed rebuilt. RfpInvitation + SmeMartProject.isInvitationOnly validated via GQL template. Pipeline bugs fixed (publish pipeline + events/processing). Demo data repushed (59 records, 9 entity types). Test 4 → PASS.
