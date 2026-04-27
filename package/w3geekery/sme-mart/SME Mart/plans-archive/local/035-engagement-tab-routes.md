# Plan: Engagement Detail Tab Routes Refactor

**Status:** Complete
**Priority:** High (blocks Notes feature)
**Branch:** `poc/sme-mart`

## Summary

Refactor engagement detail page from query-param-based `mat-tab-group` tabs to Angular child routes with `mat-tab-nav-bar` + `<router-outlet>`.

## Target Architecture

```
/rfps/:id                → EngagementDetail (layout shell)
/rfps/:id/overview       → OverviewTabComponent
/rfps/:id/details        → DetailsTabComponent
/rfps/:id/tasks          → TasksTabComponent
/rfps/:id/timeline       → TimelineTabComponent
/rfps/:id/notes          → (future — Notes feature)
```

- Parent loads engagement data, shares via `EngagementContextService`
- `mat-tab-nav-bar` with `routerLink` + `routerLinkActive` for tab navigation
- `<router-outlet>` lazy-instantiates child components
- RFP view (no `engagement_tag`) keeps inline layout — no tabs, no child routes

## Phases

### Phase 1: Route Structure & Shared Context
1. Create `engagement.routes.ts` with child route definitions
2. Create `EngagementContextService` (signal-based shared state)
3. Update `app.routes.ts` — add `children` to `rfps/:id`
4. Update `my-engagements.routes.ts` — add same `children` to `:id`

### Phase 2: Extract Tab Components
5. Create `tabs/overview-tab.component.ts` + `.html`
6. Create `tabs/details-tab.component.ts` + `.html`
7. Create `tabs/tasks-tab.component.ts` + `.html`
8. Create `tabs/timeline-tab.component.ts` + `.html`

### Phase 3: Refactor Parent Shell
9. Replace `mat-tab-group` with `mat-tab-nav-bar` + `<router-outlet>`
10. Remove `selectedTabIndex`, `TAB_NAMES`, `onTabChange()`, query param logic
11. Move engagement data into `EngagementContextService`
12. Keep RFP view unchanged

### Phase 4: Cleanup
13. Remove dead imports, signals, methods from parent
14. Verify both `/rfps/:id` and `/my/engagements/:id` work

## New Files

| File | Purpose |
|------|---------|
| `pages/engagements/engagement.routes.ts` | Child route definitions |
| `core/services/engagement-context.service.ts` | Shared engagement state |
| `pages/engagements/tabs/overview-tab.component.ts` | Overview tab |
| `pages/engagements/tabs/overview-tab.component.html` | Overview template |
| `pages/engagements/tabs/details-tab.component.ts` | Details tab |
| `pages/engagements/tabs/details-tab.component.html` | Details template |
| `pages/engagements/tabs/tasks-tab.component.ts` | Tasks tab |
| `pages/engagements/tabs/tasks-tab.component.html` | Tasks template |
| `pages/engagements/tabs/timeline-tab.component.ts` | Timeline tab |
| `pages/engagements/tabs/timeline-tab.component.html` | Timeline template |

## Modified Files

| File | Changes |
|------|---------|
| `app.routes.ts` | Add `children` import for `rfps/:id` |
| `my-engagements.routes.ts` | Add `children` import for `:id` |
| `engagement-detail.component.ts` | Simplify to layout shell (~200 lines from 355) |
| `engagement-detail.component.html` | Replace mat-tab-group with mat-tab-nav-bar + router-outlet |

## Key Decisions

- **EngagementContextService** (not resolver) — parent loads data once, children read signals
- **`mat-tab-nav-bar`** (not `mat-tab-group`) — Material's router-compatible tab component
- **Reusable routes** — same `ENGAGEMENT_ROUTES` array used by both `/rfps/:id` and `/my/engagements/:id`
- **RFP view unchanged** — conditional rendering in parent template, no child routes for RFP mode
