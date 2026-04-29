# Monday AM Testing Checklist — 2026-03-24

## Context

On 2026-03-20 we fixed a systemic GQL filtering bug across all SME Mart services. Previously every service used `filters: {}` because `linkTo` relationships aren't filterable — causing cross-engagement data leaking (e.g., every engagement's "General" notebook showing in every Notes tab).

**Schema PR #15** merged to zerobias-org/schema (dev + main). New scalar properties confirmed queryable on UAT.

**App code changes** (uncommitted on `poc/sme-mart` branch):
- `field-mappings.ts` — fixed `zerobiasBoundaryId` bug, `serviceIncludes`/`serviceRequirements` rename
- `note-folder.service.ts` — `engagementId` filter
- `notes.service.ts` — `engagementId` + `archived` + `folderId` filters
- `bids.service.ts` — `engagementId` + `providerId` filters
- `reviews.service.ts` — `providerId` filter
- `org-document.service.ts` — `engagementId` + `archived` filters
- `service-offerings.service.ts` — `isActive` filter

## Testing Plan

### 1. Pre-flight
- [ ] `npm run dev` starts clean (UAT target)
- [ ] Build passes (`ng build`)
- [ ] Schema properties confirmed on UAT (already verified 2026-03-20 via ZB MCP)

### 2. Notes Tab (original bug)
- [ ] Open engagement "Crystal Harbor" → Notes tab
- [ ] Verify ONLY Crystal Harbor notebooks appear (not notebooks from other engagements)
- [ ] Click "General" — should NOT spawn duplicate notebooks
- [ ] Create a new note → verify it appears only in this engagement
- [ ] Switch to a different engagement → verify its own notebooks, not Crystal Harbor's

### 3. Bids
- [ ] Open engagement detail → Bids tab
- [ ] Verify only bids for THIS engagement appear (not all bids in boundary)
- [ ] Bid wizard → verify draft lookup filters by engagement + provider

### 4. Documents
- [ ] Open engagement detail → Documents tab
- [ ] Verify only documents for THIS engagement appear
- [ ] Archived documents should NOT show by default

### 5. Reviews
- [ ] Provider profile → reviews list
- [ ] Verify only reviews for THAT provider appear

### 6. Service Offerings
- [ ] Services page
- [ ] Verify only active offerings appear (inactive filtered out)
- [ ] Provider detail → verify only that provider's offerings

### 7. Commit & Push
- [ ] After testing passes, commit app changes
- [ ] Push to `poc/sme-mart` branch
- [ ] Verify git workflow hook fires (should check upstream sync, fork usage)

## Files Changed (uncommitted)

```
M package/w3geekery/sme-mart/src/app/core/field-mappings.ts
M package/w3geekery/sme-mart/src/app/core/services/bids.service.ts
M package/w3geekery/sme-mart/src/app/core/services/note-folder.service.ts
M package/w3geekery/sme-mart/src/app/core/services/notes.service.ts
M package/w3geekery/sme-mart/src/app/core/services/org-document.service.ts
M package/w3geekery/sme-mart/src/app/core/services/reviews.service.ts
M package/w3geekery/sme-mart/src/app/core/services/service-offerings.service.ts
M package/w3geekery/sme-mart/CLAUDE.md
```

## Resume

```bash
claude --resume poc/sme-mart
```
