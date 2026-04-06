# Phase 14: Invitation Controls - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable closed, invitation-only RFPs with vendor invitation management and access control gates. Buyer can mark an RFP as invitation-only, invite vendors, manage invitation statuses, and revoke invitations. Vendors see a "My Invitations" feed and can accept/decline. Uninvited vendors see a teaser view with "Request Invitation" workflow. Service-level gate blocks bid submission from uninvited vendors.

</domain>

<decisions>
## Implementation Decisions

### Entity Model
- **D-01:** New `RfpInvitation` schema class (separate entity linked to SmeMartProject). One row per vendor invitation with status tracking. Follows existing entity-per-concern pattern (Bid, Review, etc.).
- **D-02:** Fields: `id`, `projectId` (link to SmeMartProject), `vendorOrgId`, `status` (pending/accepted/declined/revoked/expired/requested), `invitedAt`, `respondedAt`, `invitationMessage` (optional text from buyer).
- **D-03:** Explicit `isInvitationOnly` boolean field on SmeMartProject. Buyer toggles during RFP creation. Queryable, works even before invitations are added.
- **D-04:** Schema change required — new RfpInvitation class in YAML schema + `isInvitationOnly` field on SmeMartProject.

### RFP Lifecycle
- **D-05:** Buyer can invite vendors anytime while RFP is open (draft, published, active). Invitations blocked when RFP is closed/archived.
- **D-06:** Buyer can revoke invitations anytime (pending or accepted). Sets status to `revoked`. If vendor already submitted a bid, bid remains but vendor sees revoked status.
- **D-07:** When RFP is closed/archived, pending invitations auto-expire (status → `expired`). Accepted invitations stay accepted as historical record.

### Invitation Flow
- **D-08:** Buyer manages invitations from "Invited Vendors" tab on RFP detail page (project-detail). No wizard step — tab available for both draft and published RFPs.
- **D-09:** Buyer selects vendors via autocomplete search (org name). Uses `ZbSimpleAutocompleteComponent` from ngx-library or similar pattern. Add button sends invitation with optional message.
- **D-10:** Vendor responds via BOTH: (a) "My Invitations" page (`/my-invitations`) with Accept/Decline action buttons, AND (b) inline banner on RFP detail page when visiting an invitation-only RFP they're invited to.
- **D-11:** Decline shows optional reason field. Accept navigates to full RFP detail.

### Access Control Gate
- **D-12:** Defense in depth — BidsService validates invitation status before creating bid (throws error if uninvited/not accepted) AND UI disables "Submit Bid" button with tooltip for uninvited vendors.
- **D-13:** Uninvited vendors see teaser view: RFP title, summary, and "Invitation Only" badge. Detailed requirements hidden. "Request Invitation" button to express interest.
- **D-14:** Full request workflow in Phase 14: vendor clicks "Request Invitation" → creates RfpInvitation with status `requested` → buyer sees request on Invited Vendors tab → buyer can approve (sets status to `pending`/`accepted`) or decline.

### RFP Listing
- **D-15:** Invitation-only RFPs appear in public RFP listing with visual badge (lock icon + "Invitation Only" chip). Clicking shows teaser view for uninvited vendors, full view for invited vendors.

### Notification Strategy
- **D-16:** My Invitations page is the primary discovery mechanism for v1.2. No push notifications or notification center integration yet.
- **D-17:** Add TODO/stub comments in code at all notification trigger points: invitation sent, request received, request approved, request declined, invitation revoked. These stubs mark where notification center integration will be added in a future phase.

### Claude's Discretion
- RfpInvitation status transition validation (which transitions are valid)
- Autocomplete search implementation details (debounce, min chars, result limit)
- Teaser view layout and copy
- "Request Invitation" confirmation dialog design
- Invitation card layout on My Invitations page
- Badge/chip colors for invitation statuses

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Models & Services
- `src/app/core/models/sme-mart-project.model.ts` — SmeMartProject interface, add `isInvitationOnly` field
- `src/app/core/services/sme-mart-project.service.ts` — Pipeline write + GQL read pattern to follow for new fields
- `src/app/core/services/bids.service.ts` — Bid creation logic, add invitation gate validation here
- `src/app/core/field-mappings.ts` — Bidirectional field mappings, add new fields here
- `src/app/core/gql-types.ts` — GQL response types, update for new fields

### UI Components (existing patterns)
- `src/app/pages/project/project-detail.component.ts` — Tab pattern (PRIMARY_TABS + MORE_TAB_GROUPS), add "Invited Vendors" tab
- `src/app/pages/project/project.routes.ts` — Route definitions for project detail tabs
- `src/app/pages/rfps/rfp-list.component.ts` — RFP listing, add invitation-only badge
- `src/app/pages/rfps/rfp-detail.component.ts` — RFP detail, add teaser view + request invitation + inline accept/decline banner
- `src/app/pages/my-projects/my-project-list.component.ts` — "My X" page pattern to follow for My Invitations

### Related Services
- `src/app/core/services/engagement-lifecycle.service.ts` — Engagement flow reference, shows bid→engagement orchestration
- `src/app/core/services/pipeline-write.service.ts` — Pipeline write pattern for new RfpInvitation entity
- `src/app/core/services/graphql-read.service.ts` — GQL read pattern for invitation queries

### Director Flags
- `.planning/director/v1.2-discuss-flags.md` — D1-01 entity model question (resolved: explicit boolean + separate entity) and RFP status lifecycle questions (resolved: invite anytime, revoke anytime, auto-expire on close)

### Requirements
- `.planning/REQUIREMENTS.md` — D1-01 through D1-06 (RFP Access Controls requirements)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Tab pattern on project-detail:** `MORE_TAB_GROUPS` with grouped tabs — add "Invited Vendors" to Governance group
- **My Projects page:** Card/table layout with status filters — reuse pattern for My Invitations
- **ZbSimpleAutocompleteComponent:** ngx-library autocomplete — use for vendor search on Invited Vendors tab
- **ZbResourceStatusComponent:** Status badge component — use for invitation status chips
- **Status chip pattern:** project-card already renders mat-chip with status-based CSS — extend for invitation-only badge

### Established Patterns
- **Pipeline write + GQL read:** All entities use PipelineWriteService (writes) + GraphqlReadService (reads)
- **Optimistic updates:** PipelineWriteCache (60s TTL) masks Pipeline async delay
- **Field mappings:** Bidirectional snake_case ↔ camelCase mapping in field-mappings.ts
- **Entity service pattern:** Model interface + Service class + GQL types + field mapping constants

### Integration Points
- **Project detail tabs:** Add `invited-vendors` route to project.routes.ts
- **RFP detail page:** Add teaser/full view conditional + inline accept/decline banner
- **BidsService:** Add invitation validation gate in bid creation methods
- **RFP listing:** Add invitation-only badge to RFP cards/list items
- **New route:** `/my-invitations` page for vendor-facing invitation feed
- **Schema repo:** New RfpInvitation class + isInvitationOnly field on SmeMartProject

</code_context>

<specifics>
## Specific Ideas

- Invitation message field lets buyers personalize outreach — nice for vendor relationships
- TODO stubs at notification trigger points (invitation sent, request received, request approved/declined, invitation revoked) — mark where notification center hooks go later
- "Request Invitation" workflow is full-cycle in Phase 14: vendor requests → buyer reviews → approves/declines
- Teaser view shows enough to understand the opportunity without revealing detailed requirements

</specifics>

<deferred>
## Deferred Ideas

- **Notification center integration** — future phase, stubs placed in Phase 14 code
- **Invitation expiration dates** — per-invitation expiry (auto-expire if vendor doesn't respond by date). Noted but not in v1.2 scope.
- **Invitation status enum refinement** — the `requested` status and approval sub-workflow may evolve. Phase 14 covers the basic flow.

</deferred>

---

*Phase: 14-invitation-controls*
*Context gathered: 2026-04-03*
