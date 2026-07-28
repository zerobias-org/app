# Smoke Test: RFP Invitations (Phase 14)

> **Status:** Draft — baseline from UAT verification 2026-04-07
> **Prerequisite:** `npm run dev` running on localhost:4200, test data pushed via pipeline

## Steps

### 1. My Invitations page (vendor-facing)
- Navigate to `http://localhost:4200/my/invitations`
- **Expect:** "My Invitations" heading, filter chips (All, Pending, Accepted, Requested)
- **Expect (no data):** Empty state "No Invitations" + "You haven't been invited to any RFPs yet."
- **Expect (with data):** Invitation cards with status chips, dates, buyer messages, action buttons

### 2. RFP List — lock badge
- Navigate to `http://localhost:4200/rfps`
- **Expect:** RFPs with `isInvitationOnly=true` show lock icon + "Invitation Only" chip
- **Expect:** Open RFPs show no lock badge

### 3. Project Detail — Invited Vendors tab
- Navigate to `http://localhost:4200/project/{projectId}`
- Click "More" tab dropdown
- **Expect:** "Invited Vendors" appears in the menu (under Governance group)
- Click "Invited Vendors"
- **Expect:** "Invite Vendor" form with Vendor Organization ID input, Message textarea, Send Invitation button
- **Expect:** "Invitations" section with list or "No invitations sent yet." empty state

### 4. Invite a vendor (buyer action)
- On Invited Vendors tab, enter vendor org ID + optional message
- Click "Send Invitation"
- **Expect:** Snackbar "Invitation sent", invitation appears in list with status "pending"

### 5. Vendor sees invitation
- Switch to vendor persona
- Navigate to `http://localhost:4200/my/invitations`
- **Expect:** New invitation card with project name, status "pending", buyer message, Accept/Decline buttons

### 6. Vendor accepts invitation
- Click "Accept" on pending invitation
- **Expect:** Snackbar "Invitation accepted", status changes to "accepted", "View RFP" button appears

### 7. Teaser for uninvited vendor
- Switch to a different vendor (one without invitation)
- Navigate to `http://localhost:4200/rfps/{invitationOnlyProjectId}`
- **Expect:** InvitationTeaserComponent shown instead of full RFP content
- **Expect:** Lock badge, project name/category/description, "Request Invitation" button

### 8. Request invitation (uninvited vendor)
- Click "Request Invitation" on teaser
- **Expect:** Dialog opens with optional reason field
- Submit
- **Expect:** Snackbar "Request sent to buyer"

### 9. Buyer approves request
- Switch back to buyer persona
- Navigate to project Invited Vendors tab
- **Expect:** Vendor request with status "requested", Approve/Decline buttons
- Click "Approve"
- **Expect:** Status changes to "accepted", snackbar "Request approved"

### 10. Buyer revokes invitation
- On Invited Vendors tab, find a pending invitation
- Click revoke (X icon)
- **Expect:** Snackbar "Invitation revoked", status changes to "revoked"

### 11. Vendor decline with reason
- Switch to vendor, navigate to My Invitations
- Click "Decline" on a pending invitation
- **Expect:** Dialog opens with optional reason textarea
- Enter reason, submit
- **Expect:** Snackbar "Invitation declined", status changes to "declined"

### 12. RFP detail — inline response banner
- Vendor with accepted invitation navigates to invitation-only RFP detail
- **Expect:** Full RFP content visible (not teaser)
- **Expect:** Banner: check icon + "You accepted this invitation. You can now submit a bid."

## Chrome DevTools MCP Steps (Automated Baseline)

```
# 1. List pages / confirm browser connected
mcp: list_pages

# 2. Navigate to My Invitations
mcp: navigate_page → http://localhost:4200/my/invitations
mcp: take_snapshot
# Assert: heading "My Invitations", buttons "All"/"Pending"/"Accepted"/"Requested"
# Assert (empty): heading "No Invitations"

# 3. Navigate to RFP list
mcp: navigate_page → http://localhost:4200/rfps
mcp: take_snapshot
# Assert: RFP cards visible
# Assert: invitation-only RFPs have "Invitation Only" chip (when data exists)

# 4. Click into an RFP → project detail
mcp: navigate_page → http://localhost:4200/project/{projectId}
mcp: take_snapshot
# Assert: tabs visible (Overview, Boards, Notes, Documents, More)

# 5. Open More menu → click Invited Vendors
mcp: click → "More" tab
mcp: take_snapshot
# Assert: menuitem "Invited Vendors" exists
mcp: click → "Invited Vendors"
# Wait 3s
mcp: take_snapshot
# Assert: heading "Invite Vendor", textbox "Vendor Organization ID", button "Send Invitation"
# Assert: heading "Invitations", text "No invitations sent yet."
```

## Test Data Requirements

- At least 1 project with `isInvitationOnly: true`
- At least 1 RfpInvitation with status `pending` (for accept/decline/revoke flows)
- At least 1 RfpInvitation with status `accepted` (for view RFP / banner flow)
- At least 1 RfpInvitation with status `requested` (for buyer approve/decline flow)
- 2+ vendor personas (one invited, one uninvited) for teaser test
