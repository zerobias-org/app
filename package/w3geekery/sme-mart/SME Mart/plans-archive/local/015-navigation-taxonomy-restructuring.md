# Plan 015 — Navigation Taxonomy Restructuring

> **Status:** Implemented
> **Date:** 2026-02-19

## Summary

Restructure the top-level navigation from `Providers | Services | RFPs & Engagements` to:

```
Home | Services | RFPs | [user dropdown → My Engagements]
```

**Rationale:** Providers and Services are two dimensions of the same catalog (who vs what). The primary browse path is by service/skill, with provider as a secondary facet. Engagements are private sandboxes (buyer + provider), not a public browse destination.

---

## Decisions (resolved 2026-02-19)

1. **Provider click on service cards** → Context menu with two choices: "Services by this Provider" (`/services?provider=:id`) | "View Provider Profile" (`/providers/:id`)
2. **`/providers` list page** → Keep as a route, add footer link. Page gets full filter treatment: mat-sidenav drawer with filter panel toggle, multi-select Provider autocomplete, plus Skill/Product/Framework filters. May add links elsewhere later.
3. **My Engagements** → Always visible in user dropdown. Show `ZbEmptyStateContainerComponent` when no engagements. The list page will have its own filters: date ranges, providers, orgs, SME Mart users associated with engagement, and potentially more.

---

## Current State

### Nav Items (`app-shell.component.ts`)
```typescript
readonly navItems: NavItem[] = [
  { label: 'Providers', path: '/providers', icon: 'people' },
  { label: 'Services', path: '/services', icon: 'storefront' },
  { label: 'RFPs & Engagements', path: '/engagements', icon: 'assignment' },
];
```

### Routes (`app.routes.ts`)
| Route | Component | Status After |
|-------|-----------|-------------|
| `/` | `Home` | Keep |
| `/providers` | `ProviderList` | **Remove from nav** (keep route, add footer link) |
| `/providers/:id` | `ProviderDetail` | Keep (linked from service cards + context menu) |
| `/services` | `ServiceCatalog` | **Promoted to primary catalog** |
| `/engagements` | `EngagementList` | **Becomes `/rfps`** (public RFP browse) |
| `/engagements/new` | `EngagementNew` | **Dead code** (replaced by RfpDialog) |
| `/engagements/:id` | `EngagementDetail` | **Split — see below** |
| `/engagements/:id/edit` | `EngagementEdit` | Moves under `/my/engagements/:id/edit` |
| `/my-profile/**` | Lazy MyProfile | Keep |
| `/admin/**` | Lazy Admin | Keep |

### User Dropdown (`user-profile-dropdown.component.html`)
Currently has: Role toggle, Theme, My Profile, Admin.
**Needs:** "My Engagements" link added.

---

## Target State

### New Nav Items
```typescript
readonly navItems: NavItem[] = [
  { label: 'Services', path: '/services', icon: 'storefront' },
  { label: 'RFPs', path: '/rfps', icon: 'assignment' },
];
```

### New Route Structure
```
/                         → Home
/services                 → ServiceCatalog (primary catalog, provider as facet)
/services?provider=:id    → ServiceCatalog filtered to one provider
/providers                → ProviderList (footer link, full filter panel)
/providers/:id            → ProviderDetail (linked from service card context menu)
/rfps                     → RfpList (public RFP browse, renamed from EngagementList)
/rfps/:id                 → RfpDetail (public view of an RFP + proposals)
/my/engagements           → MyEngagementList (private, always in user dropdown)
/my/engagements/:id       → EngagementDetail (private workspace)
/my/engagements/:id/edit  → EngagementEdit
/my-profile/**            → (unchanged)
/admin/**                 → (unchanged)
```

### User Dropdown Additions
```html
<mat-divider />
<a mat-menu-item routerLink="/my/engagements">
  <mat-icon>work</mat-icon>
  <span>My Engagements</span>
</a>
<!-- existing My Profile + Admin links -->
```

### Footer
```html
<footer class="app-footer">
  <a routerLink="/providers">Browse Providers</a>
  <!-- other footer links as needed -->
</footer>
```

---

## Implementation Steps

### Step 1 — Route & Nav Rename (low risk, mechanical)

**Files changed:**
- `app-shell.component.ts` — update `navItems` array
- `app.routes.ts` — rename routes, add redirects for old URLs

**Details:**
1. Change navItems to `Services` + `RFPs`
2. Rename `/engagements` → `/rfps` in routes
3. Add redirects: `{ path: 'engagements', redirectTo: 'rfps' }`, `{ path: 'engagements/:id', redirectTo: 'rfps/:id' }`
4. Remove `/engagements/new` route (dead — RfpDialog handles creation)
5. Keep `/providers` and `/providers/:id` routes (remove from nav only)

### Step 2 — RFP List Page (refactor EngagementList)

**Files changed:**
- Rename `engagement-list.component.*` → `rfp-list.component.*`
- Move from `pages/engagements/` → `pages/rfps/`

**Details:**
1. Rename class `EngagementList` → `RfpList`, selector `app-rfp-list`
2. Remove the lifecycle toggle (all/rfp/engagement) — this page shows RFPs only
3. Remove "My Proposals" chip (moves to My Engagements)
4. Update page title: "RFPs" instead of "RFPs & Engagements"
5. Keep: search, status filter, sort, catalog filter drawer, "Post an RFP" button
6. Rename `filteredEngagements` → `filteredRfps`, remove engagement-specific filter logic

### Step 3 — My Engagements (new lazy-loaded route group)

**New files:**
- `pages/my-engagements/my-engagements.routes.ts`
- `pages/my-engagements/my-engagement-list.component.ts` / `.html` / `.scss`

**Details:**
1. Create lazy-loaded route group at `/my/engagements`
2. `MyEngagementList` shows only the current user's engagements (filter by `buyer_zerobias_user_id` or `accepted_provider_id` matching effective user)
3. **Filter panel (mat-sidenav drawer)** with:
   - Date range picker (start/end)
   - Provider multi-select autocomplete
   - Org filter
   - SME Mart users associated with engagement
   - Status filter
4. Search bar (`ZbSearchInputComponent`) + sort dropdown
5. Empty state: `ZbEmptyStateContainerComponent` with message like "No engagements yet"
6. Uses shared `EngagementCard` component for grid display
7. Move existing `EngagementDetail` and `EngagementEdit` under this route group as child routes
8. Route in `app.routes.ts`:
   ```typescript
   {
     path: 'my/engagements',
     loadChildren: () =>
       import('./pages/my-engagements/my-engagements.routes').then(m => m.MY_ENGAGEMENTS_ROUTES),
   },
   ```

### Step 4 — User Dropdown: Add "My Engagements" Link

**Files changed:**
- `user-profile-dropdown.component.html`

**Details:**
1. Add "My Engagements" menu item with `work` icon, linking to `/my/engagements`
2. Place between the divider and "My Profile" link
3. Always visible regardless of role or engagement count

### Step 5 — Services Page: Provider Context Menu

**Files changed:**
- `service-catalog.component.ts` / `.html`
- `service-card.component.ts` / `.html` (shared component)

**Details:**
1. Read `?provider=:id` query param on init → filter services to that provider
2. When provider filter is active, show a dismissible chip: "Services by [Provider Name]" with (×) clear
3. **Service card provider click** → opens `MatMenu` context menu with two options:
   - "Services by this Provider" → navigates to `/services?provider=:id`
   - "View Provider Profile" → navigates to `/providers/:id`
4. On ProviderDetail page, add "View all services" link → `/services?provider=:id`

### Step 6 — Providers Page: Enhanced Filter Panel

**Files changed:**
- `provider-list.component.ts` / `.html`

**Details:**
1. Keep existing route at `/providers` (already has mat-sidenav + CatalogFilters)
2. Add Provider multi-select autocomplete search (filter providers by name)
3. Ensure Skill, Product, Framework filters work for provider expertise matching
4. Already has: search bar, sort dropdown, filter drawer toggle with badge count

### Step 7 — RFP Detail (refactor EngagementDetail for public view)

**Files changed:**
- Create `rfp-detail.component.*` in `pages/rfps/`

**Details:**
1. Public-facing RFP detail at `/rfps/:id` — shows RFP info, proposals, status
2. Providers can view and submit proposals from this page
3. Route: `{ path: ':id', component: RfpDetail }` under `/rfps`

### Step 8 — Footer with Providers Link

**Files changed:**
- `app-shell.component.html` — add footer section
- `app-shell.component.scss` — footer styling

**Details:**
1. Add minimal footer below `<main>` with "Browse Providers" link → `/providers`
2. Style: subtle, not prominent. Matches header color scheme.
3. May add more footer links in future

### Step 9 — Clean Up Dead Code & Update Internal Links

**Files to remove:**
- `engagement-new.component.ts` (dead — RfpDialog replaced it)

**Files to update:**
- `home.component.html` — update CTAs ("Browse Engagements" → "Browse RFPs", link to `/rfps`)
- `engagement-card.component.ts` — update `routerLink` logic: RFP cards → `/rfps/:id`, engagement cards → `/my/engagements/:id`
- Any other internal links referencing `/engagements`

### Step 10 — Update Docs & Skill Files

**Files changed:**
- `.claude/skills/sme-mart-angular-architect.md` — update Component Architecture / Layout section with new route table
- `.claude/plans/public/PLAN.md` — update route table and nav description

---

## What Stays Unchanged

- **CatalogFilters** — shared filter component used by Services and RFPs. No changes.
- **RfpDialog** — already built, used from RFP list. No changes.
- **My Profile / Admin** — no changes.
- **EngagementCard** — shared component, used by both RFP list and My Engagements.

## ngx-library Components Used

| Component | Where |
|-----------|-------|
| `ZbSearchInputComponent` | RFP list, Services, My Engagements, Providers |
| `ZbEmptyStateContainerComponent` | Loading/empty states on all list pages (incl. My Engagements empty state) |
| `ZbDialogComponent` | RFP creation dialog (already built) |
| `ZbAvatarLabelComponent` | User dropdown, provider cards |
| `ZbSimpleMultiAutocompleteComponent` | Provider filter on Services page, provider/user filters on My Engagements |
| `CatalogFilters` (custom shared) | Services, RFPs, Providers filter drawers |

No navigation components exist in ngx-library — nav stays as custom `MatToolbar` + `MatMenu` + `routerLinkActive`.

---

## Migration Safety

- **Old URLs preserved:** redirects from `/engagements` → `/rfps` and `/engagements/:id` → `/rfps/:id`
- **No data model changes** — purely routing/UI restructuring
- **Incremental delivery:** Steps 1–4 can ship first (nav + routes + dropdown), Steps 5–9 follow
