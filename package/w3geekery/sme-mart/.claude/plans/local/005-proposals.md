# 005 — Proposals (Phase 3.1)

**Status:** Planned
**Created:** 2026-01-30

## Goal

Let providers submit proposals on open work requests, and let buyers review/accept/reject them from the request detail page.

## What Exists

- **Schema:** `proposals` table fully defined in Drizzle with `proposalStatusEnum` (pending, accepted, rejected, withdrawn), foreign keys to `workRequests` and `providerProfiles`, and cascade deletes
- **Relations:** `workRequests → many proposals`, `providerProfiles → many proposals`, `proposals → one request, one provider`
- **GET `/api/requests/[id]`** already fetches proposals via `with: { proposals: true }` — but only returns `{ id: string }[]` (minimal typing)
- **Request detail page** has a placeholder proposals section showing count + "coming soon" message
- **"Submit Proposal" button** exists but shows a snackbar toast — needs to open the real form

## Files to Create

### 1. `src/app/api/proposals/route.ts`
- **POST** — Create a proposal
  - Body: `{ requestId, providerId, coverLetter, proposedPrice, proposedTimeline }`
  - Validate: request exists, is `open` status, provider hasn't already submitted
  - Returns created proposal

### 2. `src/app/api/proposals/[id]/route.ts`
- **PUT** — Update proposal status
  - Buyer can accept/reject: `{ status: 'accepted' | 'rejected', buyerZerobiasUserId }`
  - Provider can withdraw: `{ status: 'withdrawn', providerId }`
  - When a proposal is accepted, update the work request status to `in_progress`
- **DELETE** — Provider can delete their own pending proposal

### 3. `src/components/marketplace/ProposalForm.tsx`
- Dialog/modal form for submitting a proposal
- Fields: cover letter (multiline), proposed price, proposed timeline
- Requires provider profile — if user has no profile, show message to create one first
- Submit calls POST `/api/proposals`

### 4. `src/components/marketplace/ProposalCard.tsx`
- Displays a single proposal in the request detail page
- Shows: provider name/avatar, proposed price, proposed timeline, cover letter excerpt, status chip, submitted date
- Buyer view: Accept / Reject buttons (if pending)
- Provider view: Withdraw button (if pending, own proposal)

## Files to Modify

### 5. `src/app/requests/[requestId]/page.tsx`
- Expand `WorkRequest` interface to include full proposal data (not just `{ id: string }[]`)
- Replace placeholder proposals section with real `ProposalCard` list
- Replace snackbar "Submit Proposal" button with `ProposalForm` dialog trigger
- Show "You've already submitted a proposal" if provider already proposed
- When buyer accepts a proposal, update request status to `in_progress` in local state

### 6. `src/app/api/requests/[id]/route.ts`
- Expand the proposals relation to include provider profile info:
  ```
  with: { proposals: { with: { provider: true } } }
  ```
  So each proposal includes the provider's displayName, avatarUrl, ratingAverage, etc.

## Data Flow

1. **Provider views open request** → sees "Submit Proposal" button
2. **Provider clicks button** → ProposalForm dialog opens
3. **Provider submits** → POST `/api/proposals` → proposal appears in list
4. **Buyer views request** → sees list of ProposalCards with accept/reject buttons
5. **Buyer accepts** → PUT `/api/proposals/[id]` with `status: 'accepted'` → request moves to `in_progress`
6. **Buyer rejects** → PUT `/api/proposals/[id]` with `status: 'rejected'`
7. **Provider withdraws** → PUT `/api/proposals/[id]` with `status: 'withdrawn'`

## Authorization Rules

- Only providers (users with a `providerProfile`) can submit proposals
- Only the request owner (`buyerZerobiasUserId`) can accept/reject
- Only the proposal owner (`providerId`) can withdraw/delete
- One proposal per provider per request
- Can only propose on `open` requests

## Verification

1. Navigate to `/requests/[id]` for an open request
2. As a provider: submit a proposal with price, timeline, cover letter
3. Proposal appears in the proposals list
4. As the buyer: see the proposal card with Accept / Reject buttons
5. Accept a proposal → request status changes to "In Progress"
6. Reject a proposal → status chip updates
7. As provider: withdraw own pending proposal
8. TypeScript check: `npx tsc --noEmit`
