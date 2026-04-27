# Plan 022: Engagement → Project UI Restructuring

**Status:** Ready to build — Phase 1
**Phase:** 5 (Engagements & Admin)
**Created:** 2026-02-25 (stub)
**Revised:** 2026-03-24 (full rewrite — top-level project routes, access control, board=tasks)
**Depends on:** Plan 057 (Project Bloom MVP — boards/activities/workflows), Plan 059 (AuditgraphDB migration)
**Blockers:** None — schema PRs #7, #8 merged, GQL types live
**Source:** Brian CEO directive 2026-03-06, Clark architecture session 2026-03-24

---

## Purpose

Restructure the Engagement UI to reflect the **Engagement = agreement, Project = work** separation. Projects get their own **top-level route** (`/project/:projId/`) — not nested under engagements. Engagements show a project list; clicking a project opens it at the top level with a back-link to the governing engagement.

## Route Structure

### Engagement Routes (agreement-level)

```
/my/engagements/                       → Engagement list
/my/engagements/:engId/                → Engagement detail shell
  /overview                            → Relationship summary (buyer/provider orgs, status)
  /vetting                             → Corporate vetting checklist (Plan 063)
  /projects                            → Project list table/cards (DEFAULT landing)
  /messages                            → Cross-project message center (Plan 065)
  /dashboard                           → Configurable engagement dashboard (Plan 066)
  /notes                               → Engagement Notebook
```

### Project Routes (top-level — NOT nested under engagement)

```
/project/:projId/                      → Project detail shell
  /overview                            → Summary, boundary links, team leads (DEFAULT landing)
  /boards                              → Default board (all tasks) + board switcher
  /boards/:boardId                     → Specific board view
  /prd                                 → Product Requirements Document sections
  /plan                                → Milestones, approach, dependencies
  /notes                               → Project Notebook (1:1, read-up to engagement/org)
  /documents                           → Project-scoped document shares
  /timeline                            → Activity feed + schedule (may converge — TBD)
  /members                             → Team from boundary membership (Plan 064)
  /messages                            → Project-scoped thread (Plan 065)
  /dashboard                           → Configurable project dashboard (widgets)
  /financials                          → Billing, invoices, budget (Plan 068)
  /compliance                          → Framework control linkage (Plan 069/071)
  /reviews                             → PM retrospectives (Plan 070)
```

### My Projects (primary nav — same level as My Engagements)

```
/my/projects                           → All projects I own or am a member of
```

### Key Design Decisions

1. **Projects are top-level routes** — `/project/:projId/` not nested under engagements. Short URLs, bookmarkable.
2. **`/my/projects` is a primary nav item** — same level as `/my/engagements`. Projects are independent entities, not children of engagements. (Kevin 2026-03-25)
3. **Engagement → Projects tab is a filtered view** — shows projects linked via `relates_to` resource links to this engagement. Not a parent-child list.
4. **Project shows related engagement chips** — 0 or more engagement links (many-to-many). Click chip → navigates to engagement.
4. **Boards = Tasks** — no separate `/tasks` route. Boards ARE the task interface. Default board may show all project tasks. Custom boards/views filter from there.
5. **Timeline ≈ Schedule** — may converge into a unified chronological view (activity history + scheduled events). Explore later.
6. **Project gets its own dashboard** — configurable widgets: assigned tasks, @mentions, milestone progress, board snapshots, compliance status. Same pattern as engagement dashboard.
7. **Default board is TBD** — might be "All Tasks" or might be the first board. Fuzzy until Kevin/Chris build platform Board/Project classes. We build the shell now, semantics refine later.
8. **No sidebar nav** — SME Mart will run inside Portal iframe (Kevin's phased approach). Portal has its own sidebar. Double sidebar = bad UX.
9. **Horizontal tabs + grouped "More" dropdown** — Top bar shows 4 primary tabs (Overview, Boards, Notes, Documents). All other sections in a grouped "More" dropdown (Work, Collaborate, Track, Govern). No overflow scrolling, no second nav level.
10. **Phase 2: customizable tab bar** — users can promote/demote tabs from More to top bar. Persistence via PKV when available, localStorage fallback.

## Access Control

Access depends on project ownership and boundary association.

### Flow

1. User navigates to `/project/:projId`
2. `ProjectAccessGuard` checks (in order):
   a. Is user the owner? (ownerType=user, ownerId matches) → full access
   b. Is user in the owning org? (ownerType=org, ownerId matches user's org) → org-level access
   c. Is user a member of any boundary associated with this project? → boundary-scoped access
3. **If yes to any** → render project, load `ProjectContextService`
4. **If no** → show "You don't have access" page with "Request Access" button
5. **Request Access** → creates a ZB Task (type: access request) assigned to project admin
6. Admin adds user to boundary governance → user gains access on next check

### Implementation

```typescript
// project-access.guard.ts
// Check boundary membership for all boundaries linked to this project
// Uses: boundaryClient.getUsersInBoundary(boundaryId) for each project boundary
// Admin check: user has admin role in any project boundary
```

No separate permission layer — boundaries handle it all.

## Data Model

SmeMartProject GQL schema (PR #8, merged):

```yaml
SmeMartProject:
  - name           # Project title
  - description    # SOW summary
  - status         # draft | active | completed | cancelled
  - engagementId   # link to parent Engagement
  - boundaryIds    # 1+ ZB Boundary references
  - buyerOrgId
  - providerOrgId
  - startDate
  - targetEndDate
  - budget         # allocated budget for this project
```

## Implementation Phases

### Phase 1: Project Shell + Routes + Access Guard (THIS PHASE)

**Goal:** Project has its own top-level route, shell with tab nav, context service, access guard, and a project list under engagements.

Components:
- `ProjectDetailComponent` — shell with `mat-tab-nav-bar` + `<router-outlet>`
- `ProjectContextService` — injectable, loads project by ID from GQL, shares between tabs
- `ProjectAccessGuard` — boundary membership check, "request access" fallback
- `ProjectAccessDeniedComponent` — "no access" page with request access button
- `ProjectListComponent` — toggleable table/cards view. Used in TWO contexts: (1) `/my/projects` showing all user's projects, (2) `/my/engagements/:engId/projects` showing projects linked to that engagement via `relates_to`. User preference persisted (localStorage). Table columns: name, status, owner, boundary count, start date, target end date, related engagements.
- `ProjectCardComponent` — card for project list (status chip, progress bar, boundary tag, date range, owner, engagement chips)
- Route config: `/my/projects` as primary nav route (same level as `/my/engagements`)
- Route config: top-level `/project/:projId/` with lazy-loaded child routes
- Route config: `/my/engagements/:engId/projects` as engagement child route (filtered by relates_to)
- Project detail shows related engagement chips (0+, many-to-many)

Services:
- `ProjectService` — CRUD for SmeMartProject via PipelineWriteService (writes) + GraphqlReadService (reads). No Neon — GQL from day one.

### Phase 2: Move Existing Tabs to Project

Move Tasks, Timeline, Notes from Engagement level to Project level.

- **Boards:** Current `EngagementTasksComponent` becomes `ProjectBoardsComponent` (scoped by project's boards). Engagement loses its tasks tab entirely.
- **Timeline:** Current `TimelineViewComponent` moves to `ProjectTimelineComponent` (scoped by project).
- **Notes:** Clone/refactor for Project-level notebook. Engagement keeps its own notebook.

### Phase 3: New Engagement Tabs

Replace moved tabs with engagement-appropriate views.

- **Overview** — refactor to focus on relationship summary
- **Vetting** — stub for Plan 063
- **Projects** — project list table/cards (make this the default landing)
- **Messages** — stub for Plan 065
- **Dashboard** — stub for Plan 066
- **Notes** — stays, properly scoped to engagement level

### Phase 4: Project Stubs

Wire up remaining project tabs as stubs:

- **Overview** — project summary with boundary links, PRD snapshot, milestone progress
- **Boards** — delegate to Plan 057 board components (default board TBD)
- **PRD** — delegate to Plan 057 PRD components
- **Plan** — delegate to Plan 057 Plan components
- **Documents** — reuse existing doc components with project scope filter
- **Dashboard** — configurable widgets (same pattern as Plan 066)
- **Members** — stub for Plan 064
- **Messages** — stub for Plan 065
- **Financials** — stub for Plan 068
- **Compliance** — stub for Plan 069/071
- **Reviews** — stub for Plan 070

## Ownership Model (Kevin, 2026-03-25)

**Projects are independent entities, not children of engagements.**

- Projects owned by Org (shared) or User (private)
- Project ↔ Engagement linked via `relates_to` resource links (many-to-many)
- A project can relate to 0, 1, or many engagements
- An engagement can relate to 0, 1, or many projects
- Documents/files can be owned by Org, Engagement, OR Project

### Bid Acceptance Flow

When a Bid is accepted:
1. Check if buyer_org + provider_org already have an Engagement
2. If no → create Engagement (triggers corp vetting flow)
3. Create SmeMartProject (owned by buyer org)
4. Link project to engagement via `hydra.Resource.linkResources` with `relates_to` link type
5. Project appears in both `/my/projects` and the engagement's Projects tab

## Migration Considerations

- Current `EngagementDetailComponent` routes need restructuring (child routes change)
- `EngagementContextService` stays for engagement-level data
- New `ProjectContextService` for project-level data
- Existing services (WorkRequestsService, etc.) continue serving Engagement data
- New `ProjectService` for SmeMartProject CRUD (Pipeline+GQL from day one)
- No Neon tables for projects — built directly against AuditgraphDB

## Effort Estimate

| Phase | Hours | Notes |
|-------|-------|-------|
| 1 — Project Shell + Routes + Access | 4-6 | Shell, context service, guard, project list, ProjectService |
| 2 — Move Existing Tabs | 6-8 | Refactor board/timeline/notes components |
| 3 — New Engagement Tabs | 4-6 | Overview refactor, stubs |
| 4 — Project Stubs | 3-4 | Wire remaining tabs as placeholders |
| **Total** | **17-24** | ~2 weeks at 15 hrs/week |

## Open Questions (Resolved)

| Question | Resolution |
|----------|-----------|
| ~~URL depth~~ | **Top-level** `/project/:projId/` — not nested under engagements |
| ~~Default landing for Engagement~~ | **Projects list** — the primary thing you want to see |
| ~~Separate /tasks route~~ | **No** — boards ARE the task interface |

## Open Questions (Still Open)

1. **Default board:** "All Tasks" view? First board? Platform Board semantics TBD — Kevin/Chris.
2. **Timeline vs Schedule:** May converge. Explore when building timeline component.
3. **Project creation:** Manual from engagement? Or only via Bid acceptance (Project Bloom)?
4. **`/my/projects` flat list:** Add later as a convenience route? Shows all projects across engagements.

---

*Session: `claude --resume poc/sme-mart`*
