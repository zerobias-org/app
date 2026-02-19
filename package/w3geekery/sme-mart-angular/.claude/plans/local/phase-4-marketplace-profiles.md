# Phase 4: Feature Migration — Marketplace & Profiles

**Date:** 2026-02-18
**Status:** Complete

## Context

Phases 1–3 complete — project scaffolded, SmeMartDbService connected to Neon via Generic SQL, all 10 domain services built with models. Phase 4 implements the marketplace browsing pages, provider profiles, service catalog, and provider self-management (my-profile).

## What Was Built

### Pages

#### 4.1 Home / Landing Page (`pages/home/`)
- Hero section with `ZbSearchInputComponent` — search navigates to `/providers?q=term`
- Category cards from `CategoriesService.getRootCategories()` (max 6), Material icons mapped per slug
- Featured providers grid (top 6 from `ProviderProfilesService.listProviders()`)
- Uses `ZbEmptyStateContainerComponent` from ngx-library
- `ChangeDetectionStrategy.OnPush`, signals for all state

#### 4.2 Provider Directory (`pages/providers/provider-list`)
- Card grid via `ProviderCard` shared component
- **6-type catalog filter panel** via `CatalogFilters` component (sidebar)
- `ZbSearchInputComponent` with debounced search → client-side filter on `display_name` + `headline`
- Sort dropdown: name, rating, jobs completed
- Mobile-responsive: `BreakpointObserver` detects handset → `MatSidenav` drawer mode
- Filter badge count on mobile toggle button via `MatBadge`
- Catalog filter persistence via `UserPreferencesService` (PKV-backed)
- `FilterEnabler` to toggle which filter categories are visible
- Client-side filtering on VIEW JSON aggregations (skills, roles) with `parseJson<T>()` helper
- Query param `?q=` support from home page search

#### 4.3 Provider Detail (`pages/providers/provider-detail`)
- Route param `:id` via `toSignal(route.paramMap.pipe(...))`
- Parallel data load: provider detail (VIEW) + service offerings + reviews
- Parsed expertise sections: skills, roles, products, frameworks
- `StarRating` component for rating display
- `ServiceCard` components for provider's active services
- Reviews list (approved only, from `ReviewsService`)
- Avatar initials fallback
- `MatChips` for expertise tags, `MatDivider` for sections

#### 4.4 Service Catalog (`pages/services/service-catalog`)
- All active service offerings via `ServiceOfferingsService.listServices()`
- Category chip filter from `CategoriesService.getRootCategories()`
- `ZbSearchInputComponent` for text search (title + description)
- `computed()` for filtered list (search + category)
- Query param `?category=` support from home page category click
- Click service → navigate to provider detail

#### 4.5 My Profile — Layout (`pages/my-profile/my-profile`)
- Wrapper component with sidebar navigation via `my-profile.routes.ts`
- Lazy-loaded route group (`MY_PROFILE_ROUTES`)
- Child routes: `overview`, `expertise`, `services`, `reviews`
- Default redirect to `/my-profile/overview`

#### 4.6 My Profile — Overview (`pages/my-profile/my-profile-overview`)
- Edit provider profile: display name, headline, about, hourly rate, availability
- Loads current user via `ZerobiasClientApp.getWhoAmI()` → finds provider by userId

#### 4.7 My Profile — Expertise (`pages/my-profile/my-profile-expertise`)
- **6 autocomplete pickers** via `ZbSimpleAutocompleteComponent` from ngx-library
- Each section: skills, roles, products, frameworks, segments, service segments
- Search functions return `Observable<CatalogItem[]>` from `CatalogService.filterItems()`
- Add: calls `ProviderProfilesService.addSkill/addRole/addProduct/etc.`
- Remove: calls `ProviderProfilesService.deleteSkill/deleteRole/etc.`
- `MatSnackBar` feedback on add/remove
- `ExpertiseSection` interface: `{ title, type, items[] }`
- `buildSections()` parses VIEW JSON aggregations into UI sections

#### 4.8 My Profile — Services (`pages/my-profile/my-profile-services`)
- CRUD for productized service offerings
- Via `ServiceOfferingsService`

#### 4.9 My Profile — Reviews (`pages/my-profile/my-profile-reviews`)
- View own reviews via `ReviewsService.listReviewsByProvider()`

### Shared Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ProviderCard` | `shared/components/provider-card/` | Card for provider grid listings — avatar, name, headline, rating, skills count |
| `ServiceCard` | `shared/components/service-card/` | Service offering card — title, pricing, delivery time |
| `StarRating` | `shared/components/star-rating/` | Reusable star rating display |
| `UserProfileDropdown` | `shared/components/user-profile-dropdown/` | User menu — avatar, role toggle, edit profile, admin link, theme toggle, logout |
| `CatalogFilters` | `shared/components/catalog-filters/` | 6-type filter panel with `FilterEnabler` integration |
| `CatalogFilterSection` | `shared/components/catalog-filter-section/` | Individual filter section (autocomplete + chip list) |
| `FilterEnabler` | `shared/components/filter-enabler/` | Toggle which filter categories are visible |

### Routes

```typescript
// app.routes.ts
{ path: '', component: Home },
{ path: 'providers', component: ProviderList },
{ path: 'providers/:id', component: ProviderDetail },
{ path: 'services', component: ServiceCatalog },
{ path: 'engagements', component: EngagementList },  // Phase 5 partial
{ path: 'my-profile', loadChildren: () => MY_PROFILE_ROUTES },
{ path: 'admin', loadChildren: () => ADMIN_ROUTES },  // Phase 5 partial
```

## Patterns Established

- **Standalone components only** — no NgModules
- **`inject()` function** — no constructor injection
- **`ChangeDetectionStrategy.OnPush`** on every component
- **Signals** for component state (`signal()`, `computed()`, `toSignal()`)
- **`@if`/`@for` control flow** — no `*ngIf`/`*ngFor`
- **ngx-library components first** — `ZbSearchInputComponent`, `ZbEmptyStateContainerComponent`, `ZbSimpleAutocompleteComponent`
- **VIEW JSON parsing** — `parseJson<T>()` helper for Neon VIEW aggregated JSON columns
- **Service injection** — services from `core/services/`, consumed via `inject()`
- **Parallel data loading** — `Promise.all()` in `ngOnInit()` for concurrent API calls
- **Query param integration** — `ActivatedRoute.snapshot.queryParams` for cross-page navigation context

## What Deferred to Later Phases

- **Moderate reviews** — approve/reject before public display (Phase 5 admin)
- **Engagement detail** — dual view RFP / Transparency Center (Phase 5)
- **Engagement form** — create/edit RFP (Phase 5)
- **Proposal form/card** — submit/accept/reject/withdraw (Phase 5)
- **Admin panel full implementation** — users, categories CRUD, reviews bulk, settings (Phase 5)
- **Role toggle persistence** — wired in UserProfileDropdown but needs PKV roundtrip verification
- **Pagination** — all list pages load full dataset (pageSize: 100/200), no infinite scroll yet (Phase 6)
