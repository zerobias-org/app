# Phase 3: Service Layer

**Date:** 2026-02-18
**Status:** In progress

## Context

Phase 2 complete — `SmeMartDbService` connected to QA Generic SQL Hub Module, TypeScript models defined, 6 Neon VIEWs created. Phase 3 builds the domain service layer on top of this: platform services (via ZeroBias SDK) and database services (via SmeMartDbService).

## Step 0: Extend SmeMartDbService with Write Operations

`data-utils` CollectionsApi only exposes reads. The underlying Hub SDK (`DataproducerHubImpl`) has full CRUD: `addCollectionElement`, `updateCollectionElement`, `deleteCollectionElement`, `getCollectionElement`. Access via `client.getDataProducer().getCollectionsApi()`.

**Add to `sme-mart-db.service.ts`:**
- `createRow<T>(tableName, data)` — calls `addCollectionElement`
- `updateRow<T>(tableName, rowId, data)` — calls `updateCollectionElement`
- `deleteRow(tableName, rowId)` — calls `deleteCollectionElement`
- `getRowByKey<T>(tableName, rowId)` — calls `getCollectionElement`

**Risk:** Need to verify `getDataProducer()` exposes the collections API at runtime. Fallback: access `client['_dataProducer']` or use bulk operations.

**Test:** After adding, verify with a test read via `getRowByKey` on `v_admin_stats`.

## Step 1: CatalogService (HIGH — needed by filters + expertise pickers)

**File:** `src/app/core/services/catalog.service.ts`

Uses ZeroBias SDK directly (no SmeMartDbService). Fetches and caches the 6 catalog types + products.

**SDK paths:**
- Roles: `clientApi.auditmationPlatform.getCatalogRoleApi().list(1, 1000)`
- Skills: `clientApi.auditmationPlatform.getCatalogRoleApi().listRoleQualifications(1, 1000, 'skill')`
- Frameworks: `clientApi.portalClient.getFrameworkApi().search({}, 1, 100)`
- Segments: `clientApi.auditmationPlatform.getSegmentApi().list(1, 1000)`
- Service Segments: `clientApi.auditmationPlatform.getTagApi().listTags(1, 100, ['service-segment'])`
- Products: `clientApi.portalClient.getProductApi().search({ productServiceFilter: 'product' }, 1, 1000)`

**State:** `signal()` for each catalog type. Load once, cache in memory.

**Methods:** `loadAll()`, individual `loadRoles()` etc., `findRole(id)` lookups, `filterItems(items, search)` for autocomplete.

**New model file:** `src/app/core/models/catalog.model.ts` — types for each catalog item.

## Step 2: UserPreferencesService (HIGH — role toggle on every page)

**File:** `src/app/core/services/user-preferences.service.ts`

PKV-backed persistence via `clientApi.danaClient.getPkvApi()`.

**Keys:** `sme-mart.user-role`, `sme-mart.catalog-filters`

**Methods:** `loadPreferences()`, `setUserRole(role)`, `setCatalogFilters(filters)`, `clearAllFilters()`

**State:** Signals. Debounced PKV save (500ms).

**New model file:** `src/app/core/models/filter-preferences.model.ts`

## Step 3: ProviderProfilesService (HIGH — core marketplace)

**File:** `src/app/core/services/provider-profiles.service.ts`

**Reads** from VIEWs: `v_provider_directory`, `v_provider_detail`
**Writes** to tables: `provider_profiles` + 6 relation tables

**Methods:**
- `listProviders(options)`, `searchProviders(filter, options)`, `getProvider(id)`, `getProviderByUserId(zbUserId)`
- `updateProfile(id, data)`
- Expertise CRUD: `addSkill/deleteSkill`, `addRole/deleteRole`, `addProduct/deleteProduct`, `addFramework/deleteFramework`, `addSegment/deleteSegment`, `addServiceSegment/deleteServiceSegment`
- `parseViewJson<T>(jsonStr)` helper for VIEW JSON aggregations

## Step 4: ServiceOfferingsService (MEDIUM)

**File:** `src/app/core/services/service-offerings.service.ts`

CRUD on `service_offerings` table. `listServices()`, `getServicesByProvider(providerId)`, `createService()`, `updateService()`, `deleteService()`.

## Step 5: WorkRequestsService (MEDIUM)

**File:** `src/app/core/services/work-requests.service.ts`

**Reads** from: `v_engagement_summary`, `v_engagement_detail`
**Writes** to: `work_requests`

`listEngagements()`, `getEngagement(id)`, `createRfp(data)`, `updateRfp(id, data)`, `graduateToEngagement(id, tag, tagId)`, `cancelEngagement(id)`, `completeEngagement(id)`

## Step 6: ProposalsService (MEDIUM)

**File:** `src/app/core/services/proposals.service.ts`

CRUD on `proposals` table. `listProposalsByRequest(requestId)`, `submitProposal(data)`, `acceptProposal(id)`, `rejectProposal(id)`, `withdrawProposal(id)`.

## Step 7: EngagementLifecycleService (MEDIUM)

**File:** `src/app/core/services/engagement-lifecycle.service.ts`

BIP39 tag generation, phase detection helpers, orchestrated acceptance workflow.

`isRfpPhase(tag)`, `isEngagementPhase(tag)`, `generateEngagementTag()`, `acceptProposal(proposalId, requestId)` — orchestrates: generate tag → create ZB Tag → accept proposal → graduate work request.

Port BIP39 word list from Next.js `src/lib/bip39-tags.ts`.

## Step 8: ReviewsService (LOW)

**File:** `src/app/core/services/reviews.service.ts`

**Reads** from: `v_admin_reviews` (admin), direct `reviews` table (provider)
**Writes** to: `reviews`

`listReviewsByProvider()`, `listAdminReviews()`, `createReview()`, `approveReview()`, `rejectReview()`

## Step 9: CategoriesService (LOW)

**File:** `src/app/core/services/categories.service.ts`

CRUD on `categories` table + hierarchy helpers (`getRootCategories()`, `getChildren(parentId)`, `buildTree()`).

## Step 10: AdminService (LOW)

**File:** `src/app/core/services/admin.service.ts`

`getStats()` from `v_admin_stats`, `getSettings()`/`updateSetting()` on `app_settings`, `listUsers()` on `marketplace_users`.

## New Model Files

- `src/app/core/models/catalog.model.ts` — CatalogRole, CatalogSkill, CatalogFramework, CatalogSegment, ServiceSegment, CatalogProduct
- `src/app/core/models/filter-preferences.model.ts` — EnabledFilters, CatalogFiltersState, FilterType, defaults

Update `src/app/core/models/index.ts` barrel export.

## Tooling Note

Use the **ZeroBias MCP tool** (`zerobias` MCP server) as needed during development — e.g., to query the Neon database directly, inspect Hub module data, or verify service behavior against the live QA environment.

## Verification

1. **Step 0:** Call `db.getRowByKey('app_settings', someId)` — verify write API access works
2. **Step 1:** Call `catalogService.loadAll()` in AppInitService after db.connect() — verify roles/skills/products load from SDK
3. **Step 2:** Call `preferencesService.loadPreferences()` — verify PKV read/write roundtrip
4. **Step 3:** Call `providerProfilesService.listProviders()` — verify VIEW data returns with parsed JSON aggregations
5. **Browser console:** All services log their initialization; no errors
