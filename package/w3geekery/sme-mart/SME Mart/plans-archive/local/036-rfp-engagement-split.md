# Plan: RFP / Engagement Route Split

**Status:** Complete
**Priority:** High (blocks Notes feature)
**Branch:** `poc/sme-mart`

## Summary

Split `EngagementDetail` (which currently serves both RFPs and Engagements via an `isRfp()` flag) into two dedicated components with separate routes.

## Target Routes

```
/rfps              → RfpList (browse open RFPs)
/rfps/:id          → RfpDetail (NEW — proposals, actions, no tabs)
/rfps/:id/edit     → RfpEdit (existing)

/engagements/:id          → EngagementDetail (layout shell — tabs)
/engagements/:id/overview → OverviewTab
/engagements/:id/details  → DetailsTab
/engagements/:id/tasks    → TasksTab
/engagements/:id/timeline → TimelineTab
/engagements/:id/notes    → NotesTab (next feature)

/my/engagements           → MyEngagementList
/my/engagements/:id       → EngagementDetail (same shell, child routes)
```

## Phases

### Phase 1: Create RfpDetail
- New `pages/rfps/rfp-detail.component.ts` + `.html` + `.scss`
- Extract RFP logic from EngagementDetail: bids, publish/close/edit, actions sidebar
- `acceptBid()` navigates to `/engagements/:newId/overview` after success
- RfpDetail does NOT use EngagementContextService — it manages its own local signals

### Phase 2: Simplify EngagementDetail
- Remove entire RFP branch (`@if (isRfp())`) from template
- Remove RFP methods: `openBidDialog`, `acceptBid`, `rejectBid`, `withdrawBid`, `publishRfp`, `closeRfp`, `editRfp`
- Remove RFP-specific imports (BidCard, BidForm, BidsService)
- Remove RFP styles from SCSS
- Always shows breadcrumbs + tab nav + router-outlet

### Phase 3: Update Routes
- `app.routes.ts`: `/rfps/:id` → `RfpDetail`, `/engagements/:id` → `EngagementDetail` with children
- `my-engagements.routes.ts`: already correct (`:id` → EngagementDetail)
- Remove old `/engagements/:id` → `/rfps/:id` redirect

### Phase 4: Update Navigation
- RfpList card click → `/rfps/:id` (RFPs) or `/engagements/:id` (engagements)
- MyEngagementList card click → `/my/engagements/:id`
- Check EngagementCard navigation logic

## New Files

| File | Purpose |
|------|---------|
| `pages/rfps/rfp-detail.component.ts` | RFP detail — proposals, actions |
| `pages/rfps/rfp-detail.component.html` | RFP layout (card + sidebar) |
| `pages/rfps/rfp-detail.component.scss` | RFP-specific styles |

## Modified Files

| File | Changes |
|------|---------|
| `engagement-detail.component.ts` | Remove all RFP logic |
| `engagement-detail.component.html` | Remove RFP branch |
| `engagement-detail.component.scss` | Remove RFP styles |
| `app.routes.ts` | Split routes |
| `rfp-list.component.ts/html` | Navigation to correct route based on type |
| `engagement-lifecycle.service.ts` | Ensure acceptProposal returns new engagement ID |

## Key Decisions

- RfpDetail manages its own signals (no EngagementContextService)
- EngagementContextService stays for engagement tabs only
- Accept bid → navigate to `/engagements/:id/overview`
- RfpList shows both RFPs and engagements, navigates to correct route per item
