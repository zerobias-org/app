# Plan 043 — Proposal-to-Bid Rename Migration (Pre-Compact Context)

**Session:** poc/sme-mart
**Date:** 2026-03-06
**Task:** Execute Plan 043 phases 1-7 (skip Phase 8 GQL schema — Clark working in that folder)

## What's Being Done

Renaming all "Proposal" references to "Bid" across the codebase per Brian's directive.

## Phases & Status

| Phase | Status | Notes |
|-------|--------|-------|
| 1 — Models & Interfaces | IN PROGRESS | Rename files + types |
| 2 — Services | PENDING | `proposals.service.ts` → `bids.service.ts` |
| 3 — Mappers | PENDING | `proposal-resource.mapper.ts` → `bid-resource.mapper.ts` |
| 4 — Components | PENDING | `bid-card/` (renamed), `bid-form/` (renamed) |
| 5 — Routes & Pages | PENDING | Update all page components + UI text |
| 6 — Database & VIEWs | PENDING | Neon VIEWs + table rename |
| 7 — Plan Files | COMPLETE | All 14 plan files updated with bid terminology |
| 8 — GQL Schema | SKIP | Clark is working in schema repo |

## Key Decisions

- **Timeline event types:** `proposal_submitted` → `bid_submitted`, `proposal_accepted` → `bid_accepted` (runtime strings, not DB)
- **Resource type:** `sme-mart:proposal` → `sme-mart:bid`
- **DB-facing fields:** `proposal_count`, `proposals` (JSON), `pending_proposal_count`, `total_proposals` — these match VIEW column names. Need DB VIEW changes in Phase 6 to rename these too.
- **Enum type:** `ProposalStatus` → `BidStatus` (values unchanged: pending/accepted/rejected/withdrawn)

## Files to Rename (git mv)

```
src/app/core/models/proposal.model.ts → bid.model.ts
src/app/core/services/proposals.service.ts → bids.service.ts
src/app/core/mappers/proposal-resource.mapper.ts → bid-resource.mapper.ts
src/app/core/mappers/proposal-resource.mapper.spec.ts → bid-resource.mapper.spec.ts
src/app/shared/components/proposal-card/ → bid-card/
src/app/shared/components/proposal-form/ → bid-form/
```

## All 48 Files That Reference "proposal"

Already read all of them. Content changes needed in:
- Models: enums.ts, index.ts, work-request.model.ts, sme-mart-resource.model.ts, timeline-event.model.ts, app-settings.model.ts
- Services: proposals.service.ts, engagement-lifecycle.service.ts, engagement-context.service.ts, engagement-timeline.service.ts, sme-mart-resource.service.ts
- Mappers: proposal-resource.mapper.ts, proposal-resource.mapper.spec.ts, index.ts
- Components: proposal-card (3 files), proposal-form (3 files), engagement-card (ts+html+scss), timeline-panel.ts, timeline-view (ts+html+scss), timeline-event-card (ts+html+scss)
- Pages: rfp-detail (ts+html+scss), rfp-list.html, engagement-list (ts+html), engagement-new.html, my-engagement-list.html, admin-dashboard.html, details-tab (ts+html), overview-tab (ts+html)
- Shared: index.ts
- Other: document-upload.ts, sme-resource-links-panel.ts

## Plan File Location

`.claude/plans/local/043-proposal-to-bid-rename.md` — already written and added to PLAN.md sub-plans table.

## After Completion

- Run `ng build` to verify compilation
- Run tests if available
- Ask Clark if ready for Phase 8 (GQL schema)
