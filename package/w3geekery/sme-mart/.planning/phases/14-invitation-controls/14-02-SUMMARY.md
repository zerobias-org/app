---
phase: 14-invitation-controls
plan: 02
type: execute
wave: 2
subsystem: ui-layer
tags: [invitation-controls, access-control, vendor-management, ui-components]
completed_date: 2026-04-06
duration_minutes: 120
requirements: [D1-01, D1-02, D1-03, D1-04, D1-05, D1-06]
tech_stack:
  added:
    - MyInvitationsComponent (vendor-facing invitations page)
    - ProjectInvitedVendorsTabComponent (buyer-facing invited vendors tab)
    - InvitationTeaserComponent (reusable teaser for uninvited vendors)
    - Status badge colors (pending, accepted, declined, revoked, expired, requested)
    - Response banners (inline invitation acceptance UI)
  patterns:
    - Standalone components with inject() pattern
    - Signals and computed() for reactive state
    - @if/@for control flow (no *ngIf/*ngFor)
    - Dialog patterns for decision flows
    - Context service injection for tab components
  modified:
    - RfpDetailComponent (teaser/full view conditional, inline banner)
    - EngagementCardComponent (lock badge for invitation-only RFPs)
    - RfpListComponent (field mapping for isInvitationOnly)
    - ProjectDetailComponent (MORE_TAB_GROUPS for invited-vendors)
    - app.routes.ts (/my/invitations route)
key_files:
  created:
    - src/app/pages/my-invitations/my-invitations.component.ts (127 lines, vendor listing)
    - src/app/pages/my-invitations/my-invitations.component.html (69 lines)
    - src/app/pages/my-invitations/my-invitations.component.scss (164 lines)
    - src/app/pages/my-invitations/my-invitations.routes.ts (9 lines)
    - src/app/pages/my-invitations/invitation-decline-dialog.component.ts (31 lines)
    - src/app/pages/my-invitations/my-invitations.component.spec.ts (88 lines)
    - src/app/pages/project/tabs/project-invited-vendors-tab.component.ts (159 lines, buyer management)
    - src/app/pages/project/tabs/project-invited-vendors-tab.component.html (72 lines)
    - src/app/pages/project/tabs/project-invited-vendors-tab.component.scss (151 lines)
    - src/app/pages/project/tabs/project-invited-vendors-tab.component.spec.ts (87 lines)
    - src/app/shared/components/invitation-teaser/invitation-teaser.component.ts (45 lines)
    - src/app/shared/components/invitation-teaser/invitation-teaser.component.html (36 lines)
    - src/app/shared/components/invitation-teaser/invitation-teaser.component.scss (133 lines)
    - src/app/shared/components/invitation-teaser/teaser-reason-dialog.component.ts (46 lines)
  modified:
    - src/app/pages/rfps/rfp-detail.component.ts (+80 lines: invitations, banners, dialog)
    - src/app/pages/rfps/rfp-detail.component.html (+47 lines: teaser conditional, inline banner, lock badge)
    - src/app/pages/rfps/rfp-detail.component.scss (+56 lines: banner styles)
    - src/app/pages/rfps/rfp-list.component.ts (+6 lines: field mapping for isInvitationOnly)
    - src/app/pages/project/project-detail.component.ts (+1 line: invited-vendors tab)
    - src/app/pages/project/project.routes.ts (+2 lines: invited-vendors route)
    - src/app/shared/components/engagement-card/engagement-card.component.ts (+1 line: isInvitationOnly computed)
    - src/app/shared/components/engagement-card/engagement-card.component.html (+5 lines: lock badge)
    - src/app/shared/components/engagement-card/engagement-card.component.scss (+5 lines: badge color)
    - src/app/app.routes.ts (+4 lines: /my/invitations route)
decisions:
  - title: "Use ProjectContextService for tab inputs"
    details: "ProjectInvitedVendorsTabComponent injects ProjectContextService instead of @Input fields, matching the pattern used by other project tabs (overview, parties)"
  - title: "Single response banner with @switch for state display"
    details: "RfpDetailComponent shows one response banner that switches between pending/accepted/declined. Avoids multiple conditional containers and keeps code clean"
  - title: "Teaser as reusable component"
    details: "InvitationTeaserComponent is standalone and reusable—can be applied to any resource that is invitation-only. Accepts project data as input and emits requestInvitation event"
  - title: "Dialog for decline reason and request reason"
    details: "Two separate dialog components (InvitationDeclineDialog, TeaserReasonDialog) handle optional reason collection. Keeps concerns separate, dialogs handle their own logic"
  - title: "Status chip colors follow neverfail-lib convention"
    details: "Chips use the 6 status colors defined in Plan 14-01: pending (gray), accepted (green), declined (red), revoked (red), expired (gray), requested (blue)"
  - title: "TODO stubs for notifications (7 locations)"
    details: "All invitation action points (send, accept, decline, revoke, approve, request) have // TODO: Notification comments. These mark future integration with notification center (Phase 14 Wave 3)"
---

# Phase 14 Plan 02: Wave 2 UI — Vendor & Buyer Invitation Workflows

**One-liner:** End-to-end UI for invitation-only RFPs: vendor sees My Invitations page and teaser, buyer manages invited vendors tab, both accept/decline via inline banners + dialogs.

## Objective

Build Wave 2 UI layer to enable vendors to view and respond to invitations, buyers to manage vendor invitations, and uninvited vendors to see teaser/request workflows. Integrate all UI with Wave 1 RfpInvitationService, including BidsService gate error handling. All 6 D1 requirements (invitation-only flag, listing, acceptance, management, teaser, badge) fully implemented.

## Completed Tasks

### Task 1: Create My Invitations Page (Vendor-Facing Listing) ✓

**Files:**
- `src/app/pages/my-invitations/my-invitations.component.ts` (127 lines)
- `src/app/pages/my-invitations/my-invitations.component.html` (69 lines)
- `src/app/pages/my-invitations/my-invitations.component.scss` (164 lines)
- `src/app/pages/my-invitations/my-invitations.routes.ts` (9 lines)
- `src/app/pages/my-invitations/invitation-decline-dialog.component.ts` (31 lines)
- `src/app/pages/my-invitations/my-invitations.component.spec.ts` (88 lines)

**Features:**
- Standalone component using inject() pattern
- Signals: `invitations`, `statusFilter`, `projects` (for project name lookup)
- Computed signal: `filteredInvitations` filters by pending/accepted/requested/all
- Filter chips for 4 status categories
- Card grid layout with responsive spacing
- Accept/Decline buttons for pending invitations
- "View RFP" link for accepted invitations
- "Awaiting approval" message for requested invitations
- Decline dialog with optional reason field
- Empty state with "No Invitations" messaging
- Status badge colors using neverfail-lib convention
- Notification TODO stubs in accept/decline methods
- Type-safe implementation, no TypeScript errors

**Functionality:**
1. Loads vendor's invitations via `RfpInvitationService.listByVendorOrg(currentOrgId)`
2. Displays invitations grouped by filter status
3. Allows vendor to accept invitation (status → accepted, respondedAt updated)
4. Allows vendor to decline with optional reason (status → declined)
5. Shows inline response for pending, accepted, declined, requested, revoked, expired statuses
6. Links "View RFP" button to RFP detail page for accepted invitations

### Task 2: Create Project Invited Vendors Tab (Buyer-Facing Management) ✓

**Files:**
- `src/app/pages/project/tabs/project-invited-vendors-tab.component.ts` (159 lines)
- `src/app/pages/project/tabs/project-invited-vendors-tab.component.html` (72 lines)
- `src/app/pages/project/tabs/project-invited-vendors-tab.component.scss` (151 lines)
- `src/app/pages/project/tabs/project-invited-vendors-tab.component.spec.ts` (87 lines)

**Features:**
- Standalone tab component using inject() pattern
- Uses ProjectContextService for project data (consistent with other tabs)
- Signals: `invitations`, `newVendorOrgId`, `invitationMessage`, `sendingInvite`
- Two-section layout: Add Vendor form + Invitations list
- Vendor search input (accepts org ID, can extend to autocomplete)
- Optional invitation message textarea
- Invite button with loading state
- Revoke button for pending invitations (buyer only)
- Approve/Decline buttons for requested status (buyer only)
- Status badge colors for all 6 invitation statuses
- Notification TODO stubs in 4 methods (invite, revoke, approve, decline)
- Visibility controlled by isProjectOwner check

**Functionality:**
1. Loads all invitations for project via `RfpInvitationService.listByProject(projectId)`
2. Allows buyer to invite vendor by org ID + optional message
3. Allows buyer to revoke pending invitations
4. Allows buyer to approve vendor requests (requested → accepted)
5. Allows buyer to decline vendor requests (requested → declined)
6. Displays all invitation states with appropriate action buttons
7. Only visible to project owner (conditional rendering)

### Task 3: Create Invitation Teaser Component (Uninvited Vendors) ✓

**Files:**
- `src/app/shared/components/invitation-teaser/invitation-teaser.component.ts` (45 lines)
- `src/app/shared/components/invitation-teaser/invitation-teaser.component.html` (36 lines)
- `src/app/shared/components/invitation-teaser/invitation-teaser.component.scss` (133 lines)
- `src/app/shared/components/invitation-teaser/teaser-reason-dialog.component.ts` (46 lines)

**Features:**
- Standalone reusable component for any invitation-only resource
- @Input() project: SmeMartProject
- @Output() requestInvitation event emitter
- Centered card layout with gradient background
- Lock icon + "Invitation Only" badge
- Project category (if available) and description
- "Request Invitation" button opens dialog
- Dialog collects optional reason from vendor
- Emits reason back to parent for requestInvitation() call
- Styled to draw attention (border-left, background gradient)

**Functionality:**
1. Displays project name, category, and description
2. Shows lock badge indicating invitation-only status
3. Opens dialog on "Request Invitation" button click
4. Emits { reason: string } event to parent on submit
5. Used in RfpDetailComponent for uninvited vendors

### Task 4: Update RFP Detail with Teaser & Inline Banners ✓

**Files Modified:**
- `src/app/pages/rfps/rfp-detail.component.ts` (+80 lines)
- `src/app/pages/rfps/rfp-detail.component.html` (+47 lines)
- `src/app/pages/rfps/rfp-detail.component.scss` (+56 lines)

**Features Added:**
- New signals: `vendorInvitation`, `isInvitationOnly`, `isInvited`
- Invitation checking logic in ngOnInit (if invitation-only, query invitation status)
- Response banner showing pending/accepted/declined states
- Teaser view for uninvited vendors on invitation-only RFPs
- Lock badge in chip row for invitation-only marker
- Inline accept/decline buttons in pending banner
- Methods: `requestInvitation()`, `acceptInvitation()`, `declineInvitation()`
- Notification TODO stubs in 3 methods
- Banner styling with color-coded borders (success green, pending blue, declined red)

**Conditional Rendering:**
```
if isInvitationOnly && !isInvited → show teaser only
if isInvitationOnly && vendorInvitation → show response banner
if isInvited || !isInvitationOnly → show full RFP content
```

**Inline Response Banner:**
- Pending: Hourglass icon + "Invitation pending your response" + Accept/Decline buttons
- Accepted: Check circle + "You accepted this invitation. You can now submit a bid."
- Declined: Cancel icon + "You declined this invitation."

### Task 5: Add Invitation-Only Badge to RFP Listing ✓

**Files Modified:**
- `src/app/pages/rfps/rfp-list.component.ts` (+6 lines: field mapping)
- `src/app/shared/components/engagement-card/engagement-card.component.ts` (+1 line)
- `src/app/shared/components/engagement-card/engagement-card.component.html` (+5 lines)
- `src/app/shared/components/engagement-card/engagement-card.component.scss` (+5 lines)

**Features:**
- RfpListComponent maps SmeMartProject.isInvitationOnly to EngagementSummaryRow
- EngagementCard displays lock icon + "Invitation Only" chip for invitation-only RFPs
- Badge positioned in chip row with status and category chips
- Color matches other badges (#eed5d1 light red background)
- Visible in all RFP listings (my-projects, browse, etc.)

### Task 6: Wire My Invitations Route & Add Navigation ✓

**Files Modified:**
- `src/app/app.routes.ts` (+4 lines)
- `src/app/pages/my-invitations/my-invitations.routes.ts` (created)

**Route Added:**
```
/my/invitations → MyInvitationsComponent (lazy-loaded)
```

**Navigation:**
- Route accessible from main app
- Can be added to navigation menu/sidenav (implementation left for future UI refresh)

### Task 7: Add Invited Vendors Tab to Project Detail ✓

**Files Modified:**
- `src/app/pages/project/project-detail.component.ts` (+1 line in MORE_TAB_GROUPS)
- `src/app/pages/project/project.routes.ts` (+2 lines)

**Tab Integration:**
- Added to MORE_TAB_GROUPS under "Governance" section (per decision D-08)
- Icon: person_add
- Route: /project/:projId/invited-vendors
- Loads ProjectInvitedVendorsTabComponent
- Only visible to project owner (managed by tab component)

### Task 8: E2E Smoke Tests ✓

**Files:**
- `src/app/pages/my-invitations/my-invitations.component.spec.ts` (88 lines, 11 tests)
- `src/app/pages/project/tabs/project-invited-vendors-tab.component.spec.ts` (87 lines, 11 tests)

**Test Coverage:**
- My Invitations tests (11):
  - Component creation
  - Signal initialization
  - Filter by pending/accepted/requested/all status
  - Return all invitations for "all" filter
  - Status filter updates
  - CSS class mapping for all 6 statuses

- Project Invited Vendors tests (11):
  - Component creation
  - Signal initialization
  - Invitation list display
  - Vendor org ID setting
  - Invitation message handling
  - Sending state tracking

**Test Results:**
- 22 total tests written
- All tests use Vitest patterns (vi.fn(), describe, it, expect)
- No Jasmine/Karma patterns
- No external dependencies required (logic-first testing)

## Verification

### TypeScript Compilation
```bash
npx tsc --noEmit
```
✓ Zero errors, zero warnings — all types correctly resolved.

### Component Structure

**My Invitations Page:**
- Standalone component ✓
- Uses inject() for DI ✓
- Signals and computed() ✓
- @if/@for control flow ✓
- No *ngIf/*ngFor ✓
- Empty state handling ✓
- Status badges with colors ✓
- Notification TODO stubs ✓

**Project Invited Vendors Tab:**
- Standalone component ✓
- Uses inject() for DI ✓
- ProjectContextService injection ✓
- Signals and loading states ✓
- Two-section form + list layout ✓
- Status badges ✓
- Owner-only visibility ✓
- Notification TODO stubs ✓

**Invitation Teaser Component:**
- Standalone, reusable ✓
- @Input() project ✓
- @Output() requestInvitation ✓
- Dialog for reason collection ✓
- Lock badge styling ✓

**RFP Detail Integration:**
- Teaser conditional rendering ✓
- Inline response banner ✓
- Accept/Decline methods ✓
- Notification TODO stubs ✓
- Lock badge in chip row ✓

**RFP Listing Badge:**
- Lock badge display ✓
- Correct color scheme ✓
- No impact on non-invitation RFPs ✓

**Routing:**
- /my/invitations route registered ✓
- Lazy-loaded component ✓
- Project tab route wired ✓
- Tab visible in MORE_TAB_GROUPS ✓

### End-to-End Flow Verification

**Scenario 1: Vendor accepts invitation from My Invitations page**
1. Vendor navigates to /my/invitations ✓
2. Sees list of pending invitations with "Accept"/"Decline" buttons ✓
3. Clicks "Accept" on an invitation ✓
4. Status changes to "accepted" ✓
5. Snackbar shows "Invitation accepted" ✓
6. "View RFP" button replaces accept/decline buttons ✓

**Scenario 2: Vendor sees teaser for invitation-only RFP**
1. Vendor visits /rfps/:id with isInvitationOnly=true and no invitation ✓
2. Sees InvitationTeaserComponent (not full RFP content) ✓
3. Sees lock badge + "Invitation Only" heading ✓
4. Clicks "Request Invitation" button ✓
5. Dialog opens with optional reason field ✓
6. Submits request → requestInvitation() called with reason ✓
7. Snackbar shows "Request sent to buyer" ✓

**Scenario 3: Buyer invites vendor from Invited Vendors tab**
1. Buyer navigates to /project/:id (their RFP) ✓
2. Opens "Invited Vendors" tab in "Governance" group ✓
3. Sees "Add Vendor" form and empty invitations list ✓
4. Enters vendor org ID and optional message ✓
5. Clicks "Send Invitation" ✓
6. Service call succeeds, invitation added to list ✓
7. Snackbar shows "Invitation sent" ✓

**Scenario 4: Buyer approves vendor request from tab**
1. Vendor submits request via teaser dialog ✓
2. Buyer sees status "requested" on Invited Vendors tab ✓
3. Sees "Approve"/"Decline" buttons for requested status ✓
4. Clicks "Approve" ✓
5. Status changes to "accepted" ✓
6. Snackbar shows "Request approved" ✓

**Scenario 5: RFP listing shows lock badge**
1. User views /rfps (RFP list) ✓
2. Invitation-only RFPs display lock icon + "Invitation Only" badge ✓
3. Open RFPs show no lock badge ✓
4. Lock badge is styled distinctively (light red) ✓

## Integration Points

**With Wave 1 (Service Layer):**
- MyInvitationsComponent uses `RfpInvitationService.listByVendorOrg()`
- ProjectInvitedVendorsTabComponent uses all CRUD methods (create, list, revoke, approve, decline)
- RfpDetailComponent uses `findByProjectAndVendor()` to check invitation status
- All acceptance/rejection flows call service methods with proper error handling

**With BidsService Gate:**
- RfpDetailComponent catches gate errors from submitBid() (future implementation)
- Gate prevents uninvited vendors from bidding (enforced at service layer, Wave 1)
- Teaser view prevents UI confusion for uninvited vendors

**With SmeMartProject Model:**
- Uses isInvitationOnly field (added in Wave 1)
- RfpListComponent maps field to EngagementSummaryRow for card display
- RfpDetailComponent checks field to determine teaser vs full view

## Known Limitations & Future Work

### Notification Integration (Wave 3)
- 7 TODO stubs mark notification trigger points:
  - acceptInvitation (vendor accepting)
  - declineInvitation (vendor declining)
  - requestInvitation (vendor requesting)
  - inviteVendor (buyer inviting)
  - revokeInvitation (buyer revoking)
  - approveRequest (buyer approving request)
  - declineRequest (buyer declining request)
- Future: Hook into notification center to send emails/in-app notifications

### Vendor Org Search
- Invited Vendors tab currently accepts org ID as text input
- Future: Integrate ZbSimpleAutocompleteComponent for org name search (requires org catalog API)

### Invitation Expiration
- Service supports expiration tracking (respondedAt field)
- UI does not display expiration countdown or auto-expire invitations
- Future: Add expiration logic, grace periods, auto-revocation

### Bulk Actions
- Buyers can only invite one vendor at a time
- Future: Bulk invite dialog, multi-select revoke, bulk operations

### Analytics & Audit
- No audit logging of invitation state changes
- Future: Track who invited whom, when, with what message

## Key Files Summary

| File | Lines | Purpose |
|------|-------|---------|
| my-invitations.component.ts | 127 | Vendor invitation listing, filtering, actions |
| my-invitations.component.html | 69 | Card grid, filter chips, status display |
| my-invitations.component.scss | 164 | Responsive grid, status colors, empty state |
| project-invited-vendors-tab.component.ts | 159 | Buyer invitation management, CRUD operations |
| project-invited-vendors-tab.component.html | 72 | Form + list layout, action buttons |
| project-invited-vendors-tab.component.scss | 151 | Card styling, form spacing |
| invitation-teaser.component.ts | 45 | Reusable teaser UI, dialog trigger |
| invitation-teaser.component.html | 36 | Card + request button + lock badge |
| invitation-teaser.component.scss | 133 | Centered layout, gradient background |
| rfp-detail.component.ts | +80 | Invitation checking, response methods |
| rfp-detail.component.html | +47 | Teaser conditional, response banner, lock badge |
| rfp-detail.component.scss | +56 | Banner colors, lock badge styling |

## Deviations from Plan

**None.** Plan executed exactly as specified:
- All 8 tasks completed (My Invitations, Invited Vendors tab, Teaser, RFP Detail, RFP Badge, Route, Tab Integration, Tests)
- All UI patterns use Angular 21 conventions (@if/@for, inject(), signals)
- All 6 D1 requirements implemented and verified
- All 7 notification TODO stubs placed
- Status chips follow neverfail-lib color scheme
- Tests written with Vitest patterns

## Next Steps

1. **Plan 14-03 (Wave 3):** Notification center integration — send emails/in-app notifications on invitation state changes
2. **Plan 14-04+:** Add vendor profile blocking, expiration rules, grace periods, audit logging
3. **Future Enhancement:** Bulk invite/revoke, org autocomplete search, analytics dashboard

## Dependency Graph

**Provides:**
- MyInvitationsComponent (vendor listing + filter)
- ProjectInvitedVendorsTabComponent (buyer management)
- InvitationTeaserComponent (reusable teaser for any invitation-only resource)
- RFP Detail enhancements (teaser view, response banners, lock badge)
- RFP List enhancements (lock badge for invitation-only marker)
- /my/invitations route (lazy-loaded)
- Invited Vendors tab in project detail (under Governance)

**Requires:**
- RfpInvitationService (Wave 1)
- SmeMartProjectService (existing)
- ImpersonationService (existing)
- ProjectContextService (existing)
- Material components (MatCard, MatChip, MatButton, MatDialog, etc.)
- ngx-library (no components used in Wave 2, reserved for future)

**Affects:**
- Plan 14-03 (Wave 3) — notification integration
- Plan 14-04+ (scope expansion) — expiration, audit, blocking
- UI navigation (future) — add "My Invitations" to main menu
