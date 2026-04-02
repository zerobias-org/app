# Phase 12: Project-Centric Boundary Model - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Surface internal/external org membership distinction and project boundary parties in the UI. My Orgs cards get Internal/External badges and engagement/project counts. `/orgs/:orgId` overview gets a Projects panel (grouped by engagement). Project detail replaces `members` stub with read-only `parties` tab showing boundary parties, roles, and teams per boundary. All read-only — no boundary CRUD in SME Mart.

</domain>

<decisions>
## Implementation Decisions

### Org Card Enhancements (My Orgs List)
- **D-01:** Internal/External badge using `ZbResourceStatusComponent` chip. Internal = green, External = blue. Detection: `whoAmI().ownerId === org.id` → Internal, otherwise → External.
- **D-02:** Engagement and project counts as inline metrics row below org name: "3 Engagements · 5 Projects" style. Compact, scannable.
- **D-03:** Table view also gets new columns for Internal/External and Engagement/Project counts. Parity between card and table views.

### Org Overview Expansion (`/orgs/:orgId`)
- **D-04:** Single "Projects" `ZbSimplePanelComponent` section. Projects are grouped by parent engagement. Each engagement is a group header (name as link to `/engagement/:id`). Under each engagement: small `ZbCustomizableTableComponent` with project rows. Row click navigates to `/project/:id`.
- **D-05:** No separate "Engagements" panel — the grouped Projects panel shows engagements as group headers, which is sufficient.

### Parties Tab (Project Detail)
- **D-06:** Route changes from `members` to `parties`. URL becomes `/project/:id/parties`. Tab label says "Parties".
- **D-07:** Accordion per boundary. Each boundary gets a collapsible section header with boundary name. Inside: `ZbCustomizableTableComponent` with columns: Party Name, Roles (comma-separated or chips), Teams.
- **D-08:** All read-only. No create/edit/delete boundary operations. Boundary admin stays in ZB Governance app.

### Data Fetching
- **D-09:** Engagement/project counts fetched via GQL queries per org using existing `GraphqlReadService` pattern. Filter by org ID. Count from result length or pagination total.
- **D-10:** Boundary party data fetched lazily — only when user clicks the Parties tab. Show loading spinner on first visit.
- **D-11:** New `BoundaryService` (`boundary.service.ts`) wrapping `platform.Boundary.*` APIs: `listBoundaryParties`, `listBoundaryPartyRoles`, `listBoundaryTeams`. Dedicated service for clean separation and reuse.

### Claude's Discretion
- Exact columns in the parties table (Party Name + Roles + Teams is the minimum, can add more if API provides useful data)
- Loading/empty states for the parties tab and projects panel
- Whether to cache whoAmI ownerId or fetch each time (likely already cached in ImpersonationService)
- Accordion expand/collapse default state (first boundary auto-expanded?)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Director Design Decisions
- `.planning/director/DECISIONS.md` — Internal vs External detection logic, Project Members → Parties rename, Boundary Admin read-only scope, Org list filtering rules
- `.planning/director/SESSION-STATE.md` — ZB APIs confirmed available (boundary party/role/team endpoints with exact method names), existing codebase notes (SmeMartProject.boundaryIds, project.routes.ts members stub)

### Phase 7 Context (foundation)
- `.planning/phases/07-org-navigation/07-CONTEXT.md` — Org list/overview decisions: ZbSimplePanelComponent sections, read-only constraint, card/table toggle, search bar, UserPreferencesService

### Existing Components (modify)
- `src/app/pages/orgs/org-list.component.ts` — OrgListComponent with `allOrgs` signal, `OrgListItem` interface. Needs `ownerId` and counts added.
- `src/app/pages/orgs/org-list.component.html` — Card/table template. Needs badge + metrics row.
- `src/app/pages/orgs/org-detail.component.ts` — Org overview. Needs Projects panel.
- `src/app/pages/project/project.routes.ts` — `members` route → `ProjectComingSoonTab`. Replace with parties component.
- `src/app/pages/project/tabs/project-coming-soon-tab.component.ts` — Generic stub. The `members` usage gets replaced.

### SDK / API References
- `ZerobiasClientApp.getWhoAmI()` — Observable returning user with `ownerId` field
- `ImpersonationService` (`src/app/core/services/impersonation.service.ts`) — Already subscribes to `getWhoAmI()`, stores `realUserId`
- `platform.Boundary.listBoundaryParties` — Returns parties for a boundary ID
- `platform.Boundary.listBoundaryPartyRoles` — Returns roles for a party
- `platform.Boundary.listBoundaryTeams` — Returns teams for a boundary

### ngx-library Components (use these)
- `ZbResourceStatusComponent` — For Internal/External badge chips
- `ZbSimplePanelComponent` — For Projects section on org overview
- `ZbCustomizableTableComponent` — For project rows and party rows

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ZbResourceStatusComponent` — already used for boundary status chips in Phase 7 org overview
- `ZbCustomizableTableComponent` — available from ngx-library, used in other parts of the app
- `ZbSimplePanelComponent` — already used for all org overview sections
- `GraphqlReadService` — established pattern for GQL entity queries
- `ImpersonationService` — already has `getWhoAmI()` subscription with user identity data
- `UserPreferencesService` — already handles card/table toggle persistence

### Established Patterns
- Standalone components with signals, `ChangeDetectionStrategy.OnPush`
- `inject()` for DI
- File naming: `foo.component.ts` / `.html` / `.scss` (suffixed)
- Lazy loading via `loadComponent` in routes
- `toSignal()` for observable-to-signal conversion (established in Phase 7)

### Integration Points
- `OrgListComponent` — extend `OrgListItem` interface with engagement/project counts + add whoAmI ownerId comparison
- `org-detail.component.ts` — add Projects panel section (same pattern as Members, Groups, Boundaries)
- `project.routes.ts` — replace `members` → `parties` route pointing to new component
- `project-detail.component.ts` — update tab configuration (rename Members → Parties)

</code_context>

<specifics>
## Specific Ideas

- Projects panel on org overview: engagements as group headers (linked), projects as table rows underneath. Click row → navigate to `/project/:id`. Like a grouped/sectioned table.
- Internal/External badge: `zb-resource-status` already does `toUpperCase()` on label input. Pass `"INTERNAL"` or `"EXTERNAL"` directly. May need custom color mapping if the default status colors don't include these values.
- `whoAmI().ownerId` is the user's home org ID. This is already available via `ImpersonationService` or can be fetched once and cached as a signal.
- Boundary accordion: most projects will have exactly 1 boundary. The accordion pattern handles multi-boundary gracefully but the common case should look clean (auto-expand single boundary, collapse all if multiple).

</specifics>

<deferred>
## Deferred Ideas

- **Project context switcher** — Replaces org switcher, groups by engagement. Needs more UX design. Per Brian, wanted but not blocking.
- **Sub-project nesting** — Projects within projects. Platform doesn't model this yet.
- **Permission cascading** — Boundary role → app feature gating. Business logic for later.
- **Boundary admin in SME Mart** — Creating parties, assigning roles. Stays in ZB Governance app.
- **Engagement detail party view** — No stubs to replace on engagement detail. Only project detail gets the parties tab.

</deferred>

---

*Phase: 12-project-centric-boundary-model*
*Context gathered: 2026-04-01*
