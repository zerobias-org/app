# Plan 011: RFP → Engagement Lifecycle + User Role Toggle

**Status:** Ready to implement
**Created:** 2026-02-09
**Branch:** `poc/sme-mart`

## Context

Refactor the engagement lifecycle: buyers create an **RFP (Request for Proposal)** first. The RFP phase ends when the buyer accepts a proposal — at that point a **ZeroBias Tag** is created, graduating the RFP to an **Engagement**. The presence of `engagementTag` on the record is the source of truth for lifecycle phase. No additional DB columns needed.

Also adds a **user role toggle** (buyer/provider/both) as a PKV-backed UI preference in UserProfileDropdown, and provider-specific filtering on the browse page.

## Key Design Decisions

1. **Lifecycle detection:** `engagementTag` is null → RFP phase. `engagementTag` exists → Engagement phase. No boolean column needed.
2. **Tag creation moves to proposal acceptance:** Currently POST /api/engagements creates the ZeroBias Tag immediately. Refactor: tag creation happens in PUT /api/proposals/[id] when buyer accepts a proposal. The tag represents the engagement contract, not the RFP.
3. **Browse toggle applies to ALL users:** Both buyers and providers see the RFPs | Engagements | All toggle.
4. **Provider-specific filter:** "My Proposals" toggle on browse page — shows only RFPs where the current provider has submitted proposals. Allows providers to monitor their active proposals from the main browse page (in addition to their Profile proposals tab).
5. **Role toggle:** buyer/provider/both stored in PKV, controls which UI elements are visible. Users can switch freely.
6. **Cancelled bucketing:** If `engagementTag` exists → cancelled Engagement. If null → cancelled RFP.

---

## Phase 1: Move Tag Creation to Proposal Acceptance

### 1a. Modify POST /api/engagements (`src/app/api/engagements/route.ts`)

**Remove** ZeroBias Tag creation from POST handler. The tag is no longer created when an RFP is posted. Keep the ZeroBias Task creation (tasks track the RFP from the start).

Changes:
- Remove `danaOld.getTagApi().createTag()` call
- Remove `zerobiasTagId` from insert (stays null until acceptance)
- Keep `engagementTag` field in schema but don't set it on POST (null initially)
- Update `buildTaskDescription()`: rename "Engagement Details" → "RFP Details"

### 1b. Modify PUT /api/proposals/[id] (`src/app/api/proposals/[id]/route.ts`)

When a proposal is accepted (status = 'accepted'):
1. Generate BIP39 tag via `generateEngagementTag()`
2. Create ZeroBias Tag via SDK (`danaOld.getTagApi().createTag()`)
3. Update the work request with `engagementTag`, `zerobiasTagId`, and `status: 'in_progress'`

```typescript
if (status === 'accepted' && proposal.requestId) {
  // Generate engagement tag + create ZeroBias Tag
  const engagementTag = generateEngagementTag();
  let zerobiasTagId: string | null = null;

  try {
    const sdk = await getConnectedSdk();
    const tag = await sdk.danaOld.getTagApi().createTag({
      name: engagementTag,
      description: `Engagement: ${proposal.request.title}`,
      type: 'other' as unknown as Nmtoken,
    });
    zerobiasTagId = String(tag.id);
    await sdk.disconnect();
  } catch (err) {
    console.error('Failed to create ZeroBias tag on acceptance:', err);
  }

  await db.update(workRequests)
    .set({ status: 'in_progress', engagementTag, zerobiasTagId })
    .where(eq(workRequests.id, proposal.requestId));
}
```

---

## Phase 2: Engagement Lifecycle Helpers

Create `src/lib/engagement-lifecycle.ts`:

```typescript
/** RFP phase: no engagement tag yet (draft, open, or cancelled before acceptance) */
export function isRfpPhase(engagementTag: string | null): boolean {
  return !engagementTag;
}

/** Engagement phase: has engagement tag (in_progress, completed, or cancelled after acceptance) */
export function isEngagementPhase(engagementTag: string | null): boolean {
  return !!engagementTag;
}

/** Get the lifecycle label for display */
export function getLifecycleLabel(engagementTag: string | null): string {
  return isRfpPhase(engagementTag) ? 'RFP' : 'Engagement';
}
```

---

## Phase 3: `useUserRole` Hook (PKV-backed)

Create `src/hooks/useUserRole.ts` — follows the PKV pattern from `useFilterPreferences`:

- PKV key: `sme-mart.user-role`
- localStorage key: `sme-mart-user-role` (mock mode fallback)
- Returns: `{ role, setRole, loading }` where role is `'buyer' | 'provider' | 'both'`
- Default: `'both'`
- Debounced save (same pattern as `useFilterPreferences` lines 158-185)

**Pattern reference:** `src/hooks/useFilterPreferences.ts`

---

## Phase 4: Role Toggle in UserProfileDropdown

Modify `src/components/layout/UserProfileDropdown.tsx`:

Add a role toggle section between "Edit Profile"/"Admin" and "Dark Theme":
- MUI `ToggleButtonGroup` with `exclusive` mode, small size
- Three options: Buyer | Provider | Both
- Icons: `ShoppingCart` (buyer), `Engineering` (provider), `SwapHoriz` (both)
- Don't close menu on toggle (same UX as dark theme)

---

## Phase 5: Browse Page Updates

Modify `src/app/engagements/page.tsx`:

### 5a. Lifecycle Toggle (all users)

`ToggleButtonGroup` with: **RFPs** | **Engagements** | **All**
- Position: filter bar row
- Default: `'all'`
- Local state (not persisted)

### 5b. Provider "My Proposals" Toggle

When current user has a provider profile, show an additional toggle:
- "My Proposals" chip/toggle — filters to only show RFPs where provider has submitted proposals
- Requires API change: GET /api/engagements needs to include proposal provider IDs (or a separate query)
- Implementation: fetch `/api/profile?zerobiasUserId={userId}&lookup=true` to get provider ID, then filter client-side against proposals array

**API enhancement needed:** GET /api/engagements should include `proposals` relation (at minimum `providerId` per proposal) to enable client-side "My Proposals" filtering. Update the Drizzle query:
```typescript
const allEngagements = await db.query.workRequests.findMany({
  orderBy: (r, { desc }) => [desc(r.createdAt)],
  with: { proposals: { columns: { id: true, providerId: true, status: true } } },
});
```

### 5c. Filtering Logic

```typescript
// Lifecycle filter
if (lifecycleFilter === 'rfp') {
  result = result.filter(e => isRfpPhase(e.engagementTag));
} else if (lifecycleFilter === 'engagement') {
  result = result.filter(e => isEngagementPhase(e.engagementTag));
}

// Provider "My Proposals" filter
if (myProposalsOnly && currentProviderId) {
  result = result.filter(e =>
    e.proposals?.some(p => p.providerId === currentProviderId)
  );
}
```

### 5d. Dynamic Header

- RFPs: "Requests for Proposals" / "Browse open RFPs from organizations seeking compliance expertise"
- Engagements: "Active Engagements" / "Browse engagements with work in progress"
- All: "Engagements" / "Browse RFPs and engagements across the marketplace"

### 5e. CTA Button

"Post an Engagement" → "Post an RFP"

---

## Phase 6: Terminology Updates

### 6a. New RFP Form (`src/app/engagements/new/page.tsx`)

- Title: "Post an Engagement" → "Post an RFP"
- Submit: "Post Engagement" → "Post RFP"
- Submitting: "Creating engagement..." → "Creating RFP..."
- Back button: stays "Back to Engagements" (section name)

### 6b. Detail Page (`src/app/engagements/[engagementId]/page.tsx`)

- Add lifecycle label chip (RFP or Engagement) using `getLifecycleLabel(engagement.engagementTag)`
- Chip color: `info` for RFP, `primary` for Engagement
- Actions: "Cancel Engagement" → "Cancel RFP" / "Cancel Engagement" contextually

### 6c. EngagementCard (`src/components/marketplace/EngagementCard.tsx`)

- Add lifecycle label chip in header row
- Include `proposals` summary in `EngagementCardData` interface for "My Proposals" filtering

### 6d. API Route (`src/app/api/engagements/route.ts`)

- POST: Remove tag creation, update task description wording ("RFP Details")
- GET: Include proposals relation for browse page filtering

---

## Files Modified

| File | Change |
|------|--------|
| `src/app/api/engagements/route.ts` | POST: remove tag creation, keep task. GET: include proposals |
| `src/app/api/proposals/[id]/route.ts` | On accept: generate tag, create ZB tag, update engagement |
| `src/lib/engagement-lifecycle.ts` | **NEW** — `isRfpPhase()`, `isEngagementPhase()`, `getLifecycleLabel()` |
| `src/hooks/useUserRole.ts` | **NEW** — PKV-backed role preference |
| `src/components/layout/UserProfileDropdown.tsx` | Add role toggle (ToggleButtonGroup) |
| `src/app/engagements/page.tsx` | Lifecycle toggle, "My Proposals" filter, dynamic header, rename CTA |
| `src/app/engagements/new/page.tsx` | Terminology: RFP |
| `src/app/engagements/[engagementId]/page.tsx` | Lifecycle label chip, contextual actions |
| `src/components/marketplace/EngagementCard.tsx` | Lifecycle label, proposals in interface |

---

## Execution Order

| # | Step | Risk |
|---|------|------|
| 1 | Create `engagement-lifecycle.ts` | None (new utility) |
| 2 | Move tag creation from POST engagements to PUT proposals | Medium (SDK call in new location) |
| 3 | Update GET /api/engagements to include proposals | Low |
| 4 | Create `useUserRole.ts` hook | None (new hook) |
| 5 | Add role toggle to UserProfileDropdown | Low (additive UI) |
| 6 | Update browse page (lifecycle toggle, My Proposals, header, CTA) | Medium |
| 7 | Update EngagementCard (lifecycle label) | Low |
| 8 | Update new engagement page (terminology) | Cosmetic |
| 9 | Update detail page (lifecycle label, contextual actions) | Low |

---

## Verification

1. `npm run dev:ci` — app starts clean
2. **Post an RFP:** `/engagements/new` → page says "Post an RFP" → submit → no engagement tag (it's an RFP), ZeroBias Task created
3. **Browse page:** Toggle RFPs/Engagements/All → correct items in each tab
4. **Provider "My Proposals":** Log in as provider, submit proposal, toggle "My Proposals" → only that RFP shows
5. **Accept proposal:** As buyer, accept proposal → engagement tag generated, ZeroBias Tag created, lifecycle label changes from RFP to Engagement
6. **Cancel RFP:** Cancel an open RFP (no tag) → shows in RFPs tab with "Cancelled"
7. **Cancel Engagement:** Cancel in_progress (has tag) → shows in Engagements tab with "Cancelled"
8. **Role toggle:** UserProfileDropdown → switch roles → persists on reload
9. `next build` passes clean
