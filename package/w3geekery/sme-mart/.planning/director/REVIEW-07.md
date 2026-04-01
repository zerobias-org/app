# Director Review — Phase 7: Org Navigation

**Reviewed:** 2026-03-31
**Verdict:** PASS with 4 FLAGs

## Flags (executor should read before starting)

**FLAG-1: `isOpsOrg()` filter is too loose.**
Plan says `name.includes('ops')` — would incorrectly filter orgs like "Desktop Operations LLC" or "Co-ops United". Use `slug.includes('operations.')` or match System Org by UUID (`00000000-0000-0000-0000-000000000000`). Match full word "Operations" with capital O, not substring "ops".

**FLAG-2: `listMyOrgs()` return type — verify before coding.**
MCP shows `danaOld.Me.listMyOrgs` returns `Promise<Array<DanaOrg>>`. The Angular client wrapper may return an Observable or a Promise. Check the actual type from `@zerobias-com/zerobias-angular-client` before using `toSignal()` — may need `from()` wrapper for Promise.

**FLAG-3: Boundaries data source — resolved, partially stubbed.**
`platform.Boundary.listBoundaries` (`GET /boundaries`) exists but has NO org filter param. It returns boundaries scoped to the current session org (via `dana-org-id` header). Response includes `ownerId` for client-side filtering.
- **Current org:** Call `listBoundaries()`, filter results by `ownerId === orgId`. Works.
- **Non-current org:** API will return the *active* org's boundaries, not the viewed org's. No cross-org boundary listing exists. **Stub this section** with empty state or "Switch to this org to view boundaries."
- `platform.Admin.listBoundaryMetrics` takes explicit `orgId` but returns metrics only, and is an admin endpoint.

**FLAG-4: `org-detail` reactive data loading pattern.**
Plan uses `combineLatest` with `this.orgId()` evaluated eagerly. But `orgId` comes from route params — needs to re-fire when route changes. Use `switchMap` from the param observable, not a computed snapshot. Otherwise navigating between `/orgs/abc` and `/orgs/def` won't reload data.

## Notes (minor, executor will likely self-correct)

- Test scaffold mocks use `{ subscribe: () => ({}) }` — should be `of([])` from rxjs
- `user-profile-dropdown.component.html` line 28 reference — verify actual line number
- Good: uses `UserPreferencesService` for view mode persistence (consistent pattern)
