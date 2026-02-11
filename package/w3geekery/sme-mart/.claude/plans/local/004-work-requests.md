# Plan: Work Requests (Phase 2.3)

> **Status:** Planned (2026-01-30)

## Goal
Build the buyer-side work request flow — posting jobs, browsing open requests, and viewing request details. This is the core marketplace transaction that connects buyers to providers.

## What We're Building

1. **`/requests` page** — Browse all open work requests (buyer & provider view)
2. **`/requests/new` page** — Multi-step form to create a work request
3. **`/requests/[requestId]` page** — Request detail view
4. **API routes** for CRUD operations on work requests

## Existing Schema (already in Neon)

```
workRequests: id, buyerZerobiasUserId, buyerZerobiasOrgId, title, description,
              category, budgetType (fixed|hourly|negotiable), budgetMin, budgetMax,
              timeline, status (open|in_progress|completed|cancelled),
              zerobiasBoundaryId, zerobiasTaskId, createdAt
```

## Files to Create

### API Routes
1. **`src/app/api/requests/route.ts`**
   - `GET` — list all work requests (optional `?status=open&category=X`)
   - `POST` — create a new work request (requires auth: `buyerZerobiasUserId`)

2. **`src/app/api/requests/[id]/route.ts`**
   - `GET` — single request by ID with proposals count
   - `PUT` — update status (cancel, mark complete) — owner only

### Pages
3. **`src/app/requests/page.tsx`** — Browse requests
   - Search bar (title/description)
   - Category filter chips (same set)
   - Status filter (Open, In Progress, All)
   - Budget type filter dropdown
   - Sort: Newest, Budget High→Low
   - Request cards in a grid
   - "Post a Request" button (links to `/requests/new`)

4. **`src/app/requests/new/page.tsx`** — Create request form
   - Single-page form (not multi-step for POC — simpler)
   - Fields: title, description (multiline), category (select), budget type, budget min/max, timeline
   - Submit creates via POST `/api/requests`
   - Redirect to `/requests/[id]` on success

5. **`src/app/requests/[requestId]/page.tsx`** — Request detail
   - Full request info (title, description, category, budget, timeline, status)
   - Posted by / date
   - Status badge
   - If owner: Cancel button
   - "Submit Proposal" button (placeholder for Phase 3.1)
   - Proposals section (placeholder — "No proposals yet")

### Components
6. **`src/components/marketplace/RequestCard.tsx`** — Reusable card
   - Title, category chip, budget range, timeline, status badge, posted date

### Navigation
7. **`src/components/layout/AppTopBar.tsx`** — Add "Requests" nav link

## Implementation Details

### RequestCard
- Shows: title, category chip, budget (formatted as range or single value), timeline, status chip (color-coded: open=success, in_progress=info, completed=default, cancelled=error), posted date
- Links to `/requests/[id]`

### Browse Page (`/requests`)
- Same filter pattern as Providers and Services pages
- Default filter: Open requests only
- "Post a Request" button prominent at top

### Create Form (`/requests/new`)
- Requires authenticated user (`useZeroBias`)
- Category select with same CATEGORIES list
- Budget: type select + min/max fields (conditionally shown)
- On submit: POST to API, redirect on success
- Error/loading states

### Detail Page (`/requests/[requestId]`)
- Left column: full request details
- Right column: status card, actions, proposals placeholder
- Owner sees Cancel button; others see Submit Proposal (placeholder)

## Files Modified
- `src/components/layout/AppTopBar.tsx` — Add "Requests" nav item

## Verification
1. `npm run dev` → navigate to `/requests` — see empty state or seeded requests
2. Click "Post a Request" → fill form → submit → redirected to detail page
3. Detail page shows all fields correctly
4. Back to `/requests` — new request appears
5. Filter by category, status, search
6. Nav link active state works
7. Cancel button works for request owner
