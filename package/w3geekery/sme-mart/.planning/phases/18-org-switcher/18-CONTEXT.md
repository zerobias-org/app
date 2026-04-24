# Phase 18: Org Switcher - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning
**Source:** /gsd:discuss-phase 18

<domain>
## Phase Boundary

Add a first-class organization switcher to SME Mart's existing user-profile-dropdown so users can change their active org without DevTools intervention. The switcher updates the Dana cookie + `zb-current-dana-org-id` sessionStorage via the ZB SDK so subsequent API calls carry the new `dana-org-id` header.

**In scope (OS-01..OS-05):**
- Org list surfaced inside the existing user menu
- `app.selectOrg(org)` integration via SDK
- Filtering (hidden, System Org, ops orgs)
- Visual indication of the current org
- Post-switch refresh sufficient to pick up new org context

**Out of scope:**
- Creating/editing orgs (existing /orgs page handles this)
- Per-org settings or theming
- Cross-org search or aggregated views

</domain>

<decisions>
## Implementation Decisions

### Placement & UX
- **Nested submenu**: Single "Switch Organization" item in the existing `UserProfileDropdown` mat-menu opens a side submenu (`matMenuTriggerFor`) containing the org list. Keeps the main menu compact while keeping the feature one click deep.
- **Suggested location in main menu**: directly above or replacing the current `My Organizations` link, or as a sibling — planner's call.
- **Search input**: Always-visible filter input at the top of the submenu. Filters the rendered list client-side by org name (case-insensitive substring). Required because some users belong to 20+ orgs.
- **Sort order**: Alphabetical by `org.name` (matches ZB portal `OrganizationSwitcherComponent`).
- **Current org indicator**: Bold name + leading dot (`•` or material `circle` icon). Click is **still allowed** — re-firing `selectOrg` on the current org is a no-op from the user's perspective and avoids a "why is this disabled" confusion.

### Service Shape
- **New `OrgSwitcherService` in `src/app/core/services/`**:
  - Wraps `ZerobiasClientApp.listMyOrgs()` / `selectOrg()` / `getCurrentOrg()`.
  - Exposes a filtered `orgs$` observable (or signal) — applies the OS-04 filter rules in one place.
  - Exposes `switchTo(org): Promise<void>` that handles the dialog-spinner + post-switch reload flow.
  - Unit-testable: filter rules are pure and verifiable without mounting the component.

### Refresh Strategy (post-switch)
- **Match ZB portal exactly**:
  1. On click, open a blocking "Switching Organization" dialog (spinner, no actions, `disableClose: true`) with message `Please wait while we load {org.name}.`
  2. Call `app.selectOrg(org, callback)`.
  3. In the post-switch callback, run a `doPostOrgSwitch()`-equivalent — close the dialog and trigger a refresh hard enough to drop all cached app state (CatalogService, ImpersonationService, UserPreferencesService, in-flight requests).
- **Refresh implementation**: planner to choose between `window.location.reload()` (safest) or `router.navigateByUrl('/', { onSameUrlNavigation: 'reload' })` + explicit cache invalidation. Recommendation: `window.location.reload()` unless the planner can prove all caches reset cleanly under router refresh.
- **Reuse existing dialog primitive** if SME Mart already has a confirm/spinner dialog; otherwise build a minimal one (don't pull in a portal-only `SimpleConfirmDialogComponent`).

### Filtering (OS-04)
- **Rules in scope**:
  - Hide orgs where `org.hidden === true`.
  - Hide System Org (`00000000-0000-0000-0000-000000000000`).
  - Hide "ops orgs".
- **"Ops orgs" rule is undefined** — see Open Questions. Planner should:
  - Mirror whatever ZB portal's `portalService.getOrgs()` filter does if that source is reachable from the SDK. (The ZB `portalService.getOrgs()` lives in `~/Projects/zb/ui/projects/zb-ui-lib`; the actual filter is server-side or in the platform-private accessor — SDK consumers may already get a pre-filtered list.)
  - If `app.listMyOrgs()` already returns a filtered list (i.e., hidden + System Org + ops are excluded server-side), then OS-04 is implicitly satisfied and the client only needs to handle defensive client-side filtering as a belt-and-suspenders measure.
- **Defensive minimum**: even if SDK pre-filters, still apply `hidden:true` + System Org UUID filter client-side so a misbehaving SDK release doesn't leak ops orgs into the menu.

### Claude's Discretion
- Exact icon choice for the menu trigger row (`switch_account`, `business`, etc.) and the current-org leading marker.
- Submenu width / max-height (recommend max-height ~400px with native scroll).
- Whether to debounce the search input.
- Loading state inside the submenu (spinner row vs disabled rows vs skeleton) while `listMyOrgs()` is in flight on first open.
- Empty-list state copy ("No other organizations available").
- Error state copy if `listMyOrgs()` fails.
- Where `OrgSwitcherService` calls `listMyOrgs()` — eagerly on construction vs lazily on first submenu open. Lazy is fine; planner's call.
- Whether to cache the org list (TTL) or refetch on each open.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing SME Mart code (modify / extend)
- `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.ts` — Component to extend; already injects `ZerobiasClientApp` and subscribes to `getCurrentOrg()`.
- `src/app/shared/components/user-profile-dropdown/user-profile-dropdown.component.html` — Mat-menu structure to add the org submenu trigger into.
- `src/app/layout/app-shell.component.ts` — Hosts the dropdown; no changes expected.
- `src/app/core/services/` — Where the new `OrgSwitcherService` belongs (sibling to `CatalogService`, `ImpersonationService`, `UserPreferencesService`).

### ZB portal reference (READ — do not copy)
- `~/Projects/zb/ui/projects/portal/src/app/portal/components/organization-switcher/organization-switcher.component.ts` — Canonical pattern: dialog spinner, `selectOrg(org, callback)`, `doPostOrgSwitch()`, `menuTrigger.closeMenu()`, alpha sort.
- `~/Projects/zb/ui/projects/portal/src/app/portal/components/organization-switcher/organization-switcher.component.html` — Template reference for menu structure.
- `~/Projects/zb/ui/projects/portal/src/app/portal/components/organization-switcher/organization-switcher.component.spec.ts` — Test patterns (mocks `getOrgs` / `selectOrg`).
- `~/Projects/zb/ui/projects/zb-ui-lib/src/lib/zerobias-services/navigation/org-switching.service.ts` — Sibling service for navigation-time org switching (different surface; informs but does not replace).

### Project conventions
- `package/w3geekery/sme-mart/CLAUDE.md` — SME Mart conventions (Angular 21, standalone, ngx-library, no Nx).
- `.claude/skills/sme-mart-architect.md` (if present) — project-specific patterns to follow.
- MEMORY.md entry "ZeroBias SDK — Org Selection & `dana-org-id`" — confirms the SDK sets the header client-side from the cached `zb-current-dana-org-id` sessionStorage value populated by `selectOrg()`.

</canonical_refs>

<specifics>
## Specific Ideas

- The submenu is a native `mat-menu` opened via `matMenuTriggerFor` on a parent `mat-menu-item`. Standard Material pattern — no custom overlay.
- The "Switching Organization" dialog should match ZB portal's UX so users coming from the portal see a familiar pattern.
- Filter input should not autofocus aggressively — it's inside a submenu and stealing focus on hover would break keyboard nav of the parent menu.
- `OrgSwitcherService.switchTo(org)` should reject/no-op silently if `org.id === currentOrg.id` to avoid an unnecessary reload even though the UI allows the click.

</specifics>

<deferred>
## Deferred Ideas

- Recently-used orgs section at top of submenu (would need persistence; nice for power users with many orgs but not OS-01..05).
- Cross-org notifications / "switch to org X to view this resource" deep-link handling — covered partially by ZB portal's `OrgSwitchingService.checkOrgSwitch()` but out of scope for SME Mart Phase 18.
- Per-org branding (logo/colors) in the menu rows.
- Org creation shortcut from inside the switcher.
- Telemetry / analytics on switch frequency.

</deferred>

<open_questions>
## Open Questions (resolve during research/planning, escalate to Kevin if needed)

1. **"Ops orgs" filter definition** — What identifies an ops org? Tag? Name pattern? `org.kind`? Server-side filter on `app.listMyOrgs()` already? **Action:** Planner/researcher should first check whether `app.listMyOrgs()` returns a pre-filtered list. If yes, document and move on. If no, escalate to Kevin before implementing a client-side rule.
2. **Existing dialog primitive** — Does SME Mart already have a spinner/blocking dialog component we can reuse, or do we build a minimal `SwitchingOrgDialog`? Quick scan of `src/app/shared` should answer this.
3. **`router.navigateByUrl` vs `window.location.reload()`** — Verify whether SME Mart's services (CatalogService, ImpersonationService, UserPreferencesService, etc.) need a hard reload to drop org-scoped state. If any service caches by org id without a reset hook, hard reload is mandatory.

</open_questions>

<director_notes>
## Director Review (2026-04-15)

Reviewed and approved with non-blocking notes. Plan-phase may proceed.

1. **Search input — confirm scale before wiring.** Brief didn't request it. If typical user has 5–10 orgs, search is overkill and adds surface area. Planner should sanity-check expected org count (ask Clark or check seeded data) before pulling in `zb-search-input` or building a filter input. Threshold suggestion: skip search if <15 orgs typical; include if 20+ realistic.
2. **OS-04 wording must match what ships.** With "ops orgs" rule deferred, do NOT claim full OS-04 satisfaction. Update OS-04 in PLAN.md / verification to read along the lines of "filtering applied per available rules — hidden + System Org enforced; ops-org filter pending Kevin clarification (TODO hook in `OrgSwitcherService`)."
3. **Open question routing:**
   - **Ops-org definition** — do NOT block plan. Ship hidden + System Org filters; leave a TODO hook in `OrgSwitcherService` for the future filter rule. Kevin question is async.
   - **Existing dialog primitive** — check `~/Projects/zb/zerobias-org/ngx-library/projects/ngx-library/src/public-api.ts` FIRST (per WATCH-LIST pattern). `ZbDialogComponent` is exported and may be a direct fit. Only build a minimal local dialog if `ZbDialogComponent` doesn't fit a spinner+blocking use case.
   - **Hard-reload necessity** — DEFAULT TO `window.location.reload()` to mirror ZB portal exactly. If planner is tempted to use router refresh as an optimization, require an explicit UAT test proving no stale `dana-org-id` state remains anywhere (CatalogService, ImpersonationService, UserPreferences, in-flight requests, sessionStorage, cookies). Otherwise hard reload.

</director_notes>

---

*Phase: 18-org-switcher*
*Context gathered: 2026-04-15 via /gsd:discuss-phase*
*Director reviewed: 2026-04-15*
