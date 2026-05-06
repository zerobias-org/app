# Phase 30: Default Project Board + Coming Soon Placeholders — Context

**Gathered:** 2026-05-01
**Status:** Ready for planning
**Source:** Director brief (`.planning/director/phase-30-brief.md`) + verified codebase state

<domain>
## Phase Boundary

Authenticated, onboarded users land on a default project board route owned by Phase 27 (`/projects`). The board renders the seeded default engagement + project (Phase 26) and exposes three navigable placeholder surfaces (Org Documents 046, Engagement Dashboard 066, Message Center 065) as honest "Coming Soon" components. No half-built functional UI in the placeholders. No tier display (deferred).

In scope: route + component for default project board, three placeholder components + routes, navigation integration from board to placeholders, deep-link parity, unit tests.

Out of scope: real implementation of 046/066/065 (v1.5+), tier banner (PB-05 dropped — Brian decision), multi-engagement switching, board widget customization, tier enforcement / billing.

</domain>

<decisions>
## Implementation Decisions

### Routing & Entry Point — LOCKED CONTRACT FROM PHASE 27

Phase 27 Wave 3 (commit `3756443`, merged 2026-04-30) routes onboarded users to `/projects` and currently registers it as a `ComingSoon` placeholder in `src/app/app.routes.ts:51`. Phase 30 replaces that placeholder with the real default project board.

- **Route path:** `/projects` (verified from `src/app/app.routes.ts:51`). Do NOT redefine; do NOT pin a different route.
- The route is a child of the guarded `AppShell` route, so `onboardingGuard` already protects it.
- Plan author MUST update `src/app/app.routes.ts` to swap the existing `ComingSoon` placeholder for the new component (or `loadComponent` lazy-load if the implementation grows large).

### SmeMartProject Rendering — DISCOVERY VERIFIED

Existing rendering EXISTS and is reusable. Estimate (6–8 hrs) is VALID — proceed.

- **Component:** `ProjectDetail` at `src/app/pages/project/project-detail.component.ts`.
- **Routes:** `PROJECT_ROUTES` at `src/app/pages/project/project.routes.ts`, mounted under `/project/:projId/*` (top-level, NOT nested under engagements).
- **Tabs:** `overview`, `boards`, `notes`, `documents`, `parties`, `invited-vendors`, plus `ProjectComingSoonTab`-backed surfaces (`prd`, `plan`, `timeline`, `messages`, `dashboard`, `financials`, `compliance`, `reviews`).
- **Loader:** `SmeMartProjectService.getProject(projId)` (`src/app/core/services/sme-mart-project.service.ts:103`). Returns `SmeMartProject | null`.
- **Default project board strategy:** the default-project-board component fetches the default engagement + project, renders the engagement header + a project summary, and links/redirects into the existing `ProjectDetail` tabs at `/project/:projId/overview` for full project content. **Do NOT re-implement project rendering from scratch.** Plan author chooses between:
  - (a) Render engagement header + summary on `/projects`, with prominent "Open Project" link to `/project/:projId/overview`; OR
  - (b) Resolve default project, then `router.navigate(['/project', projId, 'overview'], { replaceUrl: true })` from the board so users land directly in the existing ProjectDetail UI.
  Either is acceptable; pick whichever requires the LESS NEW UI surface area while satisfying PB-02 ("default project content … renders for the seeded default project") and PB-03 (3 Coming Soon surfaces visible from the board entry point).

### Discovery Queries — REUSE EXISTING PATTERNS, DO NOT REINVENT

The exact GQL filter syntax already exists in `OnboardingBootstrapService` and is the canonical pattern:

- **Default engagement:** `GraphqlReadService.query('Engagement', ['id', 'name', 'description', 'tag', 'zerobiasTagId'], { filters: { buyerZerobiasOrgId: '.eq.<orgId>' } })`. Exactly what Step 0 of `OnboardingBootstrapService.ensureDefaultEngagement` uses (`src/app/core/services/onboarding-bootstrap.service.ts:45-50`). Phase 26 guarantees ≥1 record exists. Take `items[0]`.
- **Default project:** `GraphqlReadService.query('SmeMartProject', ['id', 'name', 'description', 'engagementId', 'projectType', 'status'], { filters: { engagementId: '.eq.<engagementId>', projectType: '.eq.project' } })`. Exactly what Step E probe uses (`src/app/core/services/onboarding-bootstrap.service.ts:240-250`). Take `items[0]`.
- **Buyer org id source:** `ZerobiasClientApi.getCurrentOrg()` / `whoAmI()` — use the established pattern from `OnboardingBootstrapService` callers (Phase 27's bootstrap shell). Plan author SHOULD inspect `src/app/onboarding/onboarding-bootstrap-shell.component.ts` for the orgId pattern actually in use.
- **Resolver vs in-component:** plan author's choice. Either an Angular `Resolve` resolver attached to the route, OR a `signal()`-driven async load in `ngOnInit`. Prefer the in-component pattern to match `ProjectDetail`'s established style (`src/app/pages/project/project-detail.component.ts:138-163`).

### Onboarding Completion (Phase 28 Contract — Already Wired)

Phase 28 closed 2026-04-30. `MarketplaceProfileService.getCompletionStatus(orgId)` (`src/app/core/services/marketplace-profile.service.ts:216`) returns boolean. Phase 27's onboarding guard already calls this; Phase 30 does NOT need to re-check it (the guard at `AppShell` already gated entry). DO NOT re-implement completion checks on the board itself.

### Engagement Header Format

`engagement.name` is canonically `<Buyer Name> <- <Provider Name>` (ASCII reverse-arrow, supply-flow direction). Render `engagement.name` and `engagement.description` AS-IS. NO reformatting, NO splitting, NO trimming the arrow.

### Coming Soon Placeholders — Component Strategy

Existing placeholder is a generic `ComingSoon` component (`src/app/pages/coming-soon/coming-soon.component.ts`) reading `route.snapshot.data['title']`. It is too thin for the brief's PB-03 requirements (description paragraph, optional notify-me toast, clearly disabled styling).

**Decision:** create a NEW richer placeholder component (`SmeMartComingSoonComponent` or `FeatureComingSoonComponent`) under `src/app/coming-soon/` (or co-located with the default-project-board). Naming is plan author's choice. Required:
- Inputs (signal-based `input()`): `title: string`, `description: string`, optional `featureKey: string` (used by notify-me toast copy).
- ngx-library: WRAP CONTENT in `<zb-empty-state-container>` from `@zerobias-org/ngx-library` (verified export — `ZbEmptyStateContainerComponent`). Use `<zb-simple-panel>` if a contained card visual is required.
- Iconography: a clock or lock Material icon (`schedule`, `lock_clock`, or `hourglass_empty`).
- Copy:
  - Org Documents (046): "Org Documents — Coming Soon" + "Centralized document management and sharing for your organization is on the roadmap. Once available, you'll be able to upload, organize, and share documents across engagements." (1–2 sentences)
  - Engagement Dashboard (066): "Engagement Dashboard — Coming Soon" + "Aggregated metrics and progress views across all your engagements are coming soon. You'll see status, milestones, and key activity at a glance."
  - Message Center (065): "Message Center — Coming Soon" + "Cross-party messaging across all your engagements is coming soon. Today, conversations live within individual engagements."
- Notify-me button: optional. If implemented, ON CLICK: `MatSnackBar.open("We'll let you know when this is ready", "Dismiss", { duration: 5000 })` — toast-only per brief. NO Pipeline.receive write, NO MPI tag, NO server call.
- "Back to project board" link: `routerLink="/projects"`.

The 3 placeholder ROUTES (one per surface) lazy-load (or eagerly route to) the SAME component with route-data passing the title/description. Three ROUTES, ONE component implementation (DRY).

**Standalone components, signal inputs (`input()`), `inject()`, suffixed filenames (`*.component.ts`), `@if`/`@for` only — NO `*ngIf`/`*ngFor`, NO `@Input()`, NO constructor DI, NO `CommonModule`, NO `<mat-spinner>` (use `<mat-progress-spinner>`).**

### Route Structure for Placeholders

Top-level routes (NOT nested under `/projects`), mounted as siblings of `/projects` so they are deep-linkable:
- `/org-documents` → placeholder for 046
- `/engagement-dashboard` → placeholder for 066
- `/message-center` → placeholder for 065

Each route is a child of the same guarded `AppShell` route in `src/app/app.routes.ts`. Entry from the board is via `routerLink`. Direct URL hits the same placeholder (no 404, no redirect).

### Navigation Integration

The default project board surfaces the 3 placeholders as `routerLink`-style cards, tabs, OR sidebar entries — plan author picks the existing SME Mart pattern most consistent with sibling pages. Material Card grid with icon + title + 1-line teaser is the recommended baseline (low UI cost, matches honest-placeholder framing). DO NOT introduce new tab containers if a card grid suffices.

### Defensive UX — Missing Default Project

If the default engagement OR default project query returns 0 items (Phase 27 should have prevented this — bootstrap fires before this route is reachable), the board renders an inline message: "Default project is missing. Please contact support." inside `<zb-empty-state-container>`. NO redirect, NO crash, NO infinite spinner. Log warn with `callSiteTag: 'default-project-board:missing-default'`.

### Error Handling on Read Queries

Wrap each GQL read in try/catch. On failure: `MatSnackBar.open('Failed to load default project — please retry', 'Dismiss', { duration: 5000 })` AND log `[DEFAULT_PROJECT_BOARD_FAILURE]` with `callSiteTag` AND set the component to a recoverable error state (NOT a crash). Re-throwing is OK after the snackbar (matches Phase 20 pattern). NOTE: GQL READS in this phase, not platform writes — Phase 20 pattern explicitly applies to writes; for reads, snackbar + recoverable state is sufficient.

### Out-of-Scope — Will Be Rejected If Added

- Tier display (PB-05 dropped — Brian).
- Real notify-me persistence (toast only).
- Multi-engagement switcher.
- Board widget arrangement.
- New project-detail component (reuse existing).

### Claude's Discretion

- Component file name(s) under `src/app/default-project-board/` (suggest `default-project-board.component.ts`).
- Naming for the rich placeholder component (`SmeMartComingSoon` vs `FeatureComingSoon` — plan author picks).
- Whether placeholder routes share one component file or live as three thin route entries.
- Card grid vs sidebar vs inline list for the 3 placeholder navs.
- Resolver vs in-component async load (recommend in-component to match ProjectDetail style).
- Whether to redirect from `/projects` into `/project/:projId/overview` after fetching, or render in place (recommend EITHER — pick whichever reduces UI surface).
- Test file co-location (`.spec.ts` next to component is the project convention).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Director Brief
- `.planning/director/phase-30-brief.md` — full goal, deliverables, dependencies, requirements, verification, out-of-scope. **Read first.**

### Project Routing & App Shell
- `src/app/app.routes.ts` — current route table (the file Phase 30 modifies for `/projects` swap + 3 new sibling routes).
- `src/app/layout/app-shell.component.ts` — AppShell wraps the guarded routes.
- `src/app/core/guards/onboarding.guard.ts` — already protects `/projects`; Phase 30 does NOT modify this.
- `.planning/phases/27-auth-onboarding-guard/27-04-routing-SUMMARY.md` — locks `/projects` as the post-onboarding target.

### Existing Project Rendering (REUSE)
- `src/app/pages/project/project.routes.ts` — `PROJECT_ROUTES` (mounted at `/project`).
- `src/app/pages/project/project-detail.component.ts` — `ProjectDetail` (the rendering to reuse).
- `src/app/pages/project/project-detail.component.html` — template for parity reference.
- `src/app/core/services/sme-mart-project.service.ts` — `getProject(id)` loader.

### Discovery Query Patterns (REUSE)
- `src/app/core/services/onboarding-bootstrap.service.ts` — Step 0 (engagement probe lines 45–50) + Step E (project probe lines 240–250). EXACT GQL filter syntax. Copy this pattern.
- `src/app/core/services/graphql-read.service.ts` — `GraphqlReadService.query()` interface.
- `src/app/core/services/marketplace-profile.service.ts:216` — `getCompletionStatus()` (Phase 28 contract; for awareness only — Phase 30 does NOT call this).

### Existing Placeholder & Coming-Soon Patterns
- `src/app/pages/coming-soon/coming-soon.component.ts` — generic placeholder (will be SUPPLEMENTED with a richer component, not replaced — keep it for the other ComingSoon routes).
- `src/app/pages/project/tabs/project-coming-soon-tab.component.ts` — exists for project-detail tabs (NOT relevant to phase 30 surfaces; do not confuse).

### ngx-library
- `~/Projects/zb/zerobias-org/ngx-library/projects/ngx-library/src/public-api.ts` — verified exports `ZbSimplePanelComponent` and `ZbEmptyStateContainerComponent`.

### Project Conventions
- `CLAUDE.md` (sme-mart) — Angular 21 patterns, `MODERNIZATION_GUIDE.md` link, file-naming convention (`.component.ts` suffix), ngx-library-first rule.
- `.planning/docs/MODERNIZATION_GUIDE.md` — non-negotiable patterns (signals, control flow, inject, etc.).
- `.planning/docs/SDK_VERIFICATION_SOURCES.md` — sources of truth (ZB MCP, ZB platform source, SDK source). NEVER cite the deprecated Next.js prototype.

### Decisions
- `.planning/DECISIONS.md` "v1.4 Backlog Adds — 046/066/065 as Coming Soon Placeholders".
- `.planning/DECISIONS.md` "ServiceOfferings Defer With Brian" (why PB-05 is dropped).
- `.planning/DECISIONS.md` "Engagement Naming Convention" (the `Buyer <- Provider` ASCII format).

### Phase 27 / 28 Context (consumed inputs)
- `.planning/phases/27-auth-onboarding-guard/27-04-routing-PLAN.md`
- `.planning/phases/27-auth-onboarding-guard/27-04-routing-SUMMARY.md`
- `.planning/phases/28-company-profile-form/` — Phase 28 plans (for `getCompletionStatus` contract reference).

</canonical_refs>

<specifics>
## Specific Ideas

- **Default board route swap:** in `src/app/app.routes.ts:51`, replace `{ path: 'projects', component: ComingSoon, data: { title: 'Projects' } }` with the new default-project-board entry. Keep it inside the guarded `AppShell` children array.
- **Three placeholder route entries:** add as siblings to `/projects` inside the same AppShell children array. Pattern:
  ```ts
  { path: 'org-documents', component: SmeMartComingSoonComponent, data: { title: 'Org Documents', description: '<copy from CONTEXT>', featureKey: '046' } },
  { path: 'engagement-dashboard', component: SmeMartComingSoonComponent, data: { title: 'Engagement Dashboard', description: '...', featureKey: '066' } },
  { path: 'message-center', component: SmeMartComingSoonComponent, data: { title: 'Message Center', description: '...', featureKey: '065' } },
  ```
  (Component name and route-data style is plan author's choice. Inputs vs route-data is also plan author's choice; prefer signal inputs from a parent if a card-grid embeds the component, route-data if standalone.)
- **Engagement header in board:** `<h1>{{ engagement().name }}</h1><p>{{ engagement().description }}</p>` — plain Angular, OR `<zb-simple-panel>` wrapper for consistency with sibling pages.
- **Card grid for placeholders:** Material `<mat-card>` × 3 with icon + title + 1-line teaser, each `routerLink` to `/org-documents` / `/engagement-dashboard` / `/message-center`.
- **Test stubs:**
  - `default-project-board.component.spec.ts` — renders with mocked engagement + project, shows engagement header + 3 placeholder cards, navigates to placeholder routes.
  - `sme-mart-coming-soon.component.spec.ts` (or whatever the new placeholder component is named) — renders title + description from inputs, optional notify-me triggers MatSnackBar.
- **Route configuration test update:** if `app.routes.spec.ts` exists (it does, per Phase 27 Wave 3), add coverage that `/projects` resolves to the new component AND the 3 new sibling routes exist + are guard-protected.

</specifics>

<deferred>
## Deferred Ideas

- Real implementation of 046/066/065 — v1.5+. (Out of scope per brief and DECISIONS.md.)
- Tier banner / tier display — deferred until Brian confirms tier structure (DECISIONS.md "ServiceOfferings Defer With Brian").
- Notify-me persistence (tagging MPI, Pipeline.receive call) — toast-only for v1.4.
- Multi-engagement switcher on the board — v1.5+.
- Board widget customization / rearrangement — v1.5+.

</deferred>

---

*Phase: 30-default-project-board-coming-soon-placeholders*
*Context gathered: 2026-05-01 from director brief + verified codebase + verified Phase 27/28 contracts*
