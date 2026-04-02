# Phase 7: Org Navigation - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Three-tier org navigation: `/orgs` (list all user's orgs), `/orgs/:orgId` (read-only overview), and existing `/org` (current org editing, unchanged). Org switching is stubbed (disabled button with tooltip).

</domain>

<decisions>
## Implementation Decisions

### Org List Layout (`/orgs`)
- **D-01:** Card/table toggle view — user can switch between card grid and table. Persist preference via `UserPreferencesService`.
- **D-02:** Pre-filter hidden:true, System Org, and ops orgs before rendering. No "show all" toggle.
- **D-03:** Search bar for filtering org names. No sort controls.
- **D-04:** Current active org gets a subtle border or "Active" chip on its card.
- **D-05:** Single org still shows the list normally (no auto-redirect).

### Card Content
- **D-06:** Claude's discretion on card fields — pick what makes sense from `listMyOrgs` API data (name, description snippet, member count, etc.)

### Table Columns
- **D-07:** Claude's discretion on table columns — will tweak later as needed.

### Org Overview (`/orgs/:orgId`)
- **D-08:** Single scrollable page with `ZbSimplePanelComponent` sections (not tabs). Sections: Org Info, Members, Groups, Boundaries.
- **D-09:** Members: simple list with avatars + name + role.
- **D-10:** Groups: simple list with name + member count.
- **D-11:** Boundaries: list with `zb-resource-status` chips for state.
- **D-12:** Org metadata in header — Claude's discretion on what's available from API.
- **D-13:** Strictly read-only — no edit controls on this page.

### Navigation & Routing
- **D-14:** "My Organizations" link already exists in user profile dropdown — update its route from `/org` to `/orgs`.
- **D-15:** Do NOT add to top nav bar. Keep top nav as-is (Services, RFPs only).
- **D-16:** Three routes coexist: `/orgs` (list), `/orgs/:orgId` (read-only overview), `/org` (current org editing, unchanged).

### Org Switching Stub
- **D-17:** Disabled "Switch to Org" button on `/orgs/:orgId` header only (not on list cards). Tooltip: "Available when session auth is enabled".
- **D-18:** Current org overview shows info banner "This is your active org" + prominent "Go to Org Profile" button linking to `/org`.
- **D-19:** Non-current org overview shows disabled "Switch to Org" button instead.

### Claude's Discretion
- Card field selection (D-06) and table columns (D-07)
- Org header metadata fields (D-12)
- Exact visual styling of active org indicator

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Org Page (reference for patterns)
- `src/app/pages/org/org.component.ts` — Current org page with tab nav, uses `app.getCurrentOrg()`
- `src/app/pages/org/org.routes.ts` — Existing org routes (Documents, Engagements, Projects, Members, Settings tabs)

### Layout & Navigation
- `src/app/layout/app-shell.component.ts` — `navItems` array, top nav bar, mobile sidenav
- `src/app/layout/app-shell.component.html` — Template with nav rendering, user-profile-dropdown

### Routing
- `src/app/app.routes.ts` — All app routes, `/org` is lazy-loaded child

### Shared Components
- `src/app/shared/components/list-page/` — Reusable list page shell (for `/orgs` list)

### ngx-library Components (use these)
- `ZbSimplePanelComponent` — Section panels for overview page
- `ZbSearchInputComponent` — Search input for org list
- `ZbAvatarLabelComponent` — Member list display
- `ZbResourceStatusComponent` — Boundary status chips

### Hydra APIs (data sources)
- `hydra.Org.listOrgMembers` — Members for any org (confirmed working cross-org)
- `hydra.Org.listGroups` — Groups for any org (confirmed working cross-org)
- `danaOld.Org.listMyOrgs` — All user's orgs
- `danaOld.Org.selectOrg` — Stubbed/placeholder endpoint (do NOT implement, just reference in tooltip)

### User Preferences
- `src/app/core/services/` — `UserPreferencesService` for persisting card/table toggle

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `list-page` shared component: generic list page shell, can be reused for `/orgs`
- `ZbSimplePanelComponent` from ngx-library: section panels for the overview page
- `ZbSearchInputComponent`: search input already available
- `ZbAvatarLabelComponent`: member display with avatar
- `ZbResourceStatusComponent`: status chips for boundaries
- `UserPreferencesService`: already handles preference persistence

### Established Patterns
- Standalone components with signals (`signal()`, `computed()`, `effect()`)
- Class names without suffix (`OrgPage`, not `OrgPageComponent`)
- File names with suffix (`org.component.ts`)
- `inject()` for DI, `@Injectable({ providedIn: 'root' })`
- `ChangeDetectionStrategy.OnPush` on all components
- Lazy loading via `loadChildren` / `loadComponent` in routes

### Integration Points
- `app.routes.ts` — Add `/orgs` and `/orgs/:orgId` routes (lazy-loaded)
- User profile dropdown — Update "My Organization" link to point to `/orgs`
- `ZerobiasClientApp` — `getCurrentOrg()` observable for identifying active org
- `listMyOrgs` via SDK for the org list data

</code_context>

<specifics>
## Specific Ideas

- Use `ZbSimplePanelComponent` for overview sections (Clark specified this explicitly)
- "My Organizations" link already in user dropdown — just change route target, don't add to top nav

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-org-navigation*
*Context gathered: 2026-03-30*
