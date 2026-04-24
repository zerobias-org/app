# Phase 14: Invitation Controls - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 14-invitation-controls
**Areas discussed:** Entity model, RFP lifecycle, Invitation flow, Access control gate, RFP listing filters, Notification strategy

---

## Entity Model

### Invitation Data Location

| Option | Description | Selected |
|--------|-------------|----------|
| New RfpInvitation entity (Recommended) | Separate schema class linked to SmeMartProject. Each row = one vendor invitation with status/timestamps. | ✓ |
| JSON array on SmeMartProject | Store invitations as JSON blob. Simpler schema but harder to query from vendor side. | |
| Linked via hydra resources | Use ZB platform resource linking. Lightweight but limited metadata. | |

**User's choice:** New RfpInvitation entity
**Notes:** Follows existing entity-per-concern pattern (Bid, Review, etc.)

### isInvitationOnly Flag

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit boolean (Recommended) | Add `isInvitationOnly` field to SmeMartProject. Clear, queryable. | ✓ |
| Inferred from invitations | If RfpInvitation records exist → invitation-only. No extra field. | |

**User's choice:** Explicit boolean

### RfpInvitation Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal — basics only (Recommended) | id, projectId, vendorOrgId, status, invitedAt, respondedAt | |
| Add expiration | Basics + expiresAt field | |
| Add message field | Basics + invitationMessage (text) | ✓ |

**User's choice:** Add message field — buyer can include a personal note with the invitation

---

## RFP Lifecycle

### Invitation Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Anytime while open (Recommended) | Buyer can invite before or after publishing. Blocked when closed/archived. | ✓ |
| Only in draft | Must finalize invitation list before publishing. | |
| Draft + grace period | Can invite during draft and for N days after publishing. | |

**User's choice:** Anytime while open

### Revocation

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, revoke anytime (Recommended) | Can revoke pending or accepted. Bid remains if already submitted. | ✓ |
| Only if pending | Can revoke only unresponded invitations. | |
| No revocation | Once sent, invitation stands until RFP closes. | |

**User's choice:** Revoke anytime

### Close Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-expire pending (Recommended) | Pending invitations become 'expired' on RFP close. Accepted stay accepted. | ✓ |
| Leave as-is | Invitation statuses don't change on close. | |
| Auto-decline all | All non-accepted become 'declined'. | |

**User's choice:** Auto-expire pending

---

## Invitation Flow

### Management Location

| Option | Description | Selected |
|--------|-------------|----------|
| Invited Vendors tab on RFP detail (Recommended) | Tab on project detail page. Available for draft and published. | ✓ |
| Wizard step + detail tab | Add step to wizard PLUS detail tab. Duplicates UI. | |
| Post-publish dialog only | Prompt after publishing. Limited. | |

**User's choice:** Invited Vendors tab

### Vendor Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Autocomplete search (Recommended) | Type org name, autocomplete from platform orgs. | ✓ |
| Browse vendor directory | Full vendor browsing UI with filters. Significantly more work. | |
| Manual org ID entry | Paste vendor org ID. Poor UX. | |

**User's choice:** Autocomplete search

### Vendor Response

| Option | Description | Selected |
|--------|-------------|----------|
| Action buttons on My Invitations page (Recommended) | Accept/Decline buttons on invitation cards. | |
| Inline on RFP detail | Accept/decline banner at top of RFP detail. | |
| Both | My Invitations page + inline banner on RFP detail. | ✓ |

**User's choice:** Both — My Invitations page for discovery + inline banner on RFP detail

---

## Access Control Gate

### Enforcement Location

| Option | Description | Selected |
|--------|-------------|----------|
| Service-level + UI disable (Recommended) | BidsService validates + UI disables Submit Bid button. Defense in depth. | ✓ |
| UI only | Hide/disable UI. No backend protection. | |
| Service-level only | BidsService rejects. Worse UX. | |

**User's choice:** Service-level + UI disable

### Uninvited Vendor View

| Option | Description | Selected |
|--------|-------------|----------|
| Full RFP visible, bid blocked (Recommended) | Can read RFP but Submit Bid disabled with message. | |
| RFP hidden entirely | Only invited vendors see invitation-only RFPs. | |
| Teaser only | Title + summary visible. Request Invitation button. | ✓ |

**User's choice:** Teaser only — show enough to understand opportunity without revealing requirements

### Request Invitation Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Teaser + Request workflow in Phase 14 | Full flow: vendor requests → buyer reviews → approves/declines. | ✓ |
| Teaser view only, no request button | Static "invitation only" message. No request mechanism. | |
| Teaser + simple request (no approval) | Request creates pending invitation. No separate approval. | |

**User's choice:** Full request workflow in Phase 14

---

## RFP Listing Filters

### Listing Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Show all with badge (Recommended) | Invitation-only RFPs appear with lock icon + chip. Teaser for uninvited. | ✓ |
| Separate tab/filter | Add Open / Invitation Only filter toggle. | |
| Hide from uninvited | Only invited vendors see them. Per-vendor filtering. | |

**User's choice:** Show all with badge

---

## Notification Strategy

### Discovery Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| My Invitations page only (Recommended) | Vendor checks My Invitations page. No push notifications for v1.2. | |
| In-app notification badge | Bell icon badge + notification entry. Requires notification infrastructure. | |
| Defer notifications entirely | No mechanism at all. | |

**User's choice:** My Invitations page + TODO stubs at notification trigger points
**Notes:** Add TODO/stub comments where notifications would fire (invitation sent, request received, request approved/declined, invitation revoked) for future notification center integration.

---

## Claude's Discretion

- RfpInvitation status transition validation
- Autocomplete search implementation details
- Teaser view layout and copy
- Request Invitation confirmation dialog design
- Invitation card layout on My Invitations page
- Badge/chip colors for invitation statuses

## Deferred Ideas

- Notification center integration — future phase, stubs in Phase 14
- Per-invitation expiration dates — not in v1.2
