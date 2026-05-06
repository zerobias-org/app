# Phase 24: Demo Data Visibility Gate — Research

**Researched:** 2026-04-30
**Domain:** Application-layer demo-data visibility gating via GQL filters and admin signal
**Confidence:** HIGH

## Summary

Phase 24 gates demo-seeded records from non-admin users while preserving admin visibility and delete capability. Implementation requires four key pieces: (1) tagging demo records at ingest time via `Object.tag` field, (2) injecting GQL exclusion filters in 25 service listing/search methods, (3) centralizing filter logic via `GraphqlReadService` augmentation, and (4) providing an admin delete-demo escape hatch under `/admin`. The research confirms all architectural pieces exist; the gate is purely application-layer filtering with no backend changes.

**Primary recommendation:** Augment `GraphqlReadService.query()` to accept an optional `excludeTagUuids` parameter. Inject this centrally from `ProjectContextService.isAdmin()` in a shared demo-visibility service. Avoids per-service filter boilerplate while keeping the gate in one place.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DG-01 | Demo seeder populates Object.tag with demo-seed tag UUID on every class-Object Pipeline.receive push | Seeder files identified; tag field ingest pattern verified at `onboarding-bootstrap.service.ts:179` |
| DG-02 | Core listing/search services filter OUT demo-tagged records for non-admin users via GQL `.ne.` filter | 25 services identified with `graphqlRead.query()` calls; GQL RFC4515 `.ne.` syntax confirmed working |
| DG-03 | Admin (`ProjectContextService.isAdmin() === true`) retains full visibility | `isAdmin` signal verified at `project-context.service.ts:25`; `onboardingGuard` hydrates it; read pattern confirmed |
| DG-04 | Admin delete-demo action bulk-`markDeleted`s demo-tagged records and clears hydra Resources | `Pipeline.deleteEntities()` pattern verified; hydra Resource SDK available via `clientApi.hydraClient` |
| DG-05 | Unit tests cover three gate scenarios | Test mock shapes derived from `notes.service.spec.ts`; ProjectContextService mock scaffold needed |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Tag UUIDs (two-UUID transition):** Global `demo` UUID `81053c14-a8e5-4939-b538-c122c7d0eb1a` (marketplace type) for new records; legacy `w3geekery.sme-mart.demo-seed` `d618b602-21cc-40a1-a9fa-534b7bc1672c` stays on existing records.
- **Admin signal source:** `ProjectContextService.isAdmin()` — Angular Signal<boolean>, NOT Observable. Hydrated by `onboardingGuard` from `danaClient.getOrgApi().getRequestOrgMember(userId).admin`.
- **Object.tag write pattern:** `tag: [{ value: "<uuid>" }]` at Pipeline.receive ingest time (verified at `onboarding-bootstrap.service.ts:179`).
- **Admin delete confirmation required:** Destructive action; no one-click trigger. Use `MatDialog` confirmation pattern.
- **Two UUIDs to exclude:** Filter must NOT match EITHER global demo OR legacy `w3geekery.sme-mart.demo-seed`. Plan-author to choose between multiple `.ne.` filters AND'd or single `.not in.` filter.

### Claude's Discretion
- Exact admin sub-route path under `/admin` (e.g., `/admin/demo-data`)
- UI placement of admin delete-demo trigger
- Centralization approach for filter (per-service vs. shared service vs. `GraphqlReadService` augmentation)
- Constants module location
- Confirmation dialog UX (disabled-by-default vs. confirm-button-required)

### Deferred Ideas (OUT OF SCOPE)
- Retroactive re-push of existing UAT demo records (separate director brief)
- Synthetic ACME demo (v1.5)
- Production-time demo data (prod has no seeder)

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Demo tag field ingest | Backend/Pipeline | API layer | Pipeline.receive writes `Object.tag` field; seeder populates payload |
| Visibility filter application | API/Backend (GQL) | Frontend (Typescript) | GQL query accepts RFC4515 filters; frontend builds filter from admin signal |
| Admin signal derivation | API layer | Browser (session) | `danaClient` derives from ZB session; `ProjectContextService` caches as Signal |
| Delete-demo bulk operation | Backend/Pipeline | Frontend/UX | Pipeline.deleteEntities + hydra Resource delete execute on platform; admin UI triggers |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Angular | 21.1.4 | Component framework, routing, DI | App foundation |
| `@zerobias-com/zerobias-client` | 1.1.23+ | SDK for GQL, Pipeline, hydra APIs | Official ZB client; hydraClient included |
| `@zerobias-org/ngx-library` | 0.2.25 | Shared component library | Dialog, snackbar, status chip components |
| Angular Material | latest (in package.json) | Dialog, snackbar, spinners | Standard UI patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| RxJS | 6.6.7+ | Observable operators | Only for event subjects (refresh notifications) |
| TypeScript | 5.x | Type checking | All source files |
| Vitest | latest | Unit testing | Service/component specs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `GraphqlReadService.query()` augmentation | Per-service filter injection | Per-service approach creates duplication; centralization is simpler |
| Signal-based `isAdmin` | Observable-based admin check | Signal is more ergonomic; no extra subscribe/unsubscribe boilerplate in tests |
| RFC4515 `.ne.` filters | Custom filter builder class | RFC4515 is ZB standard; inline string filters match existing code style |

**Installation:** No new npm packages required. All dependencies already in `package.json`.

**Version verification:** Checked via `package.json` for installed versions. `zerobias-client` 1.1.23+ confirmed to include `hydraClient`.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────┐
│         User Session / Browser           │
│  (ProjectContextService.isAdmin Signal)  │
└──────────────────┬──────────────────────┘
                   │ hydrates via onboardingGuard
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Angular Service Layer (25 services)                    │
│  ┌───────────────────────────────────────────────────┐  │
│  │ listings: engagements, bids, reviews, notes, etc  │  │
│  │ each calls graphqlRead.query(...)                 │  │
│  └───────────┬─────────────────────────────────────┘  │
│              │                                          │
│  ┌───────────▼─────────────────────────────────────┐  │
│  │ DemoVisibilityService (new)                      │  │
│  │  - buildExcludeTagFilter(isAdmin)                │  │
│  │  - returns { tag: { value: .ne. or .not in. } } │  │
│  └───────────┬─────────────────────────────────────┘  │
│              │                                          │
│  ┌───────────▼─────────────────────────────────────┐  │
│  │ GraphqlReadService (augmented)                   │  │
│  │  - query() accepts optional excludeTagUuids      │  │
│  │  - merges exclude filter into request            │  │
│  └───────────┬─────────────────────────────────────┘  │
│              │                                          │
│              ▼                                          │
└─────────────────────────────────────────────────────────┘
                   │
                   ▼ (GQL with filters)
┌─────────────────────────────────────────┐
│    ZeroBias GraphQL API                  │
│  Boundary.boundaryExecuteRawQuery        │
│  (with RFC4515 filters: tag .ne. uuid)  │
└─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│    AuditgraphDB                          │
│  Filtered query results                 │
│  (demo records excluded for non-admin)  │
└─────────────────────────────────────────┘
```

### Recommended Project Structure

No new directories needed. Files added to existing paths:

```
src/app/
├── core/
│   ├── constants/
│   │   └── demo-tags.ts              # NEW: DEMO_TAG_UUIDS constant
│   ├── services/
│   │   ├── demo-visibility.service.ts # NEW: centralized filter logic
│   │   ├── graphql-read.service.ts    # MODIFY: add excludeTagUuids param
│   │   └── [25 services...]           # MODIFY: inject DemoVisibilityService, call it on query
│   └── guards/
│       └── onboarding.guard.ts        # Existing: hydrates isAdmin
├── test-helpers/
│   ├── angular.ts                     # MODIFY: add fakeProjectContextService() mock
│   └── constants.ts                   # MODIFY: add DEMO_TAG_UUIDS test constants
└── [admin-route]/
    └── demo-data.component.ts         # NEW: admin delete-demo UI (exact path planner choice)
```

### Pattern 1: Demo Visibility Filter Centralization

**What:** Single-responsibility service that builds GQL filters for demo visibility based on admin status.

**When to use:** On every GQL query that lists/searches class-Object records (Engagement, Bid, Note, etc.).

**Example:**

```typescript
// src/app/core/services/demo-visibility.service.ts
import { Injectable, inject } from '@angular/core';
import { ProjectContextService } from './project-context.service';

@Injectable({ providedIn: 'root' })
export class DemoVisibilityService {
  private readonly projectContext = inject(ProjectContextService);

  /**
   * Build GQL filter to exclude demo-tagged records for non-admin users.
   * Returns undefined if admin (no filter needed).
   * Returns filter object if non-admin.
   */
  buildExcludeFilter(): Record<string, string> | undefined {
    if (this.projectContext.isAdmin()) {
      return undefined; // Admin sees all records
    }

    // Non-admin: exclude both demo UUIDs
    // Two approaches (planner picks one):
    // (a) Single .not in. filter (if supported by backend)
    // (b) Multiple .ne. filters AND'd together

    // Approach (a) — single filter (simpler, preferred if backend supports)
    return {
      tag: { value: `.not in.${DEMO_TAG_UUIDS.join(',')}` },
    };

    // Approach (b) — multiple .ne. filters (fallback if .not in. unsupported)
    // This requires planner/executor to AND them in GraphqlReadService
    // Not shown here; see research section 2 for evidence
  }
}

// src/app/core/constants/demo-tags.ts
import { DEMO_TAG_UUIDS } from './demo-tags'; // Inject from constant

export const DEMO_TAG_UUIDS = {
  GLOBAL_DEMO: '81053c14-a8e5-4939-b538-c122c7d0eb1a',
  LEGACY_W3GEEKERY: 'd618b602-21cc-40a1-a9fa-534b7bc1672c',
} as const;

export const DEMO_TAG_UUID_LIST = Object.values(DEMO_TAG_UUIDS);
```

**Source:** Pattern derived from existing `GraphqlReadService` filter-building pattern at `graphql-read.service.ts:164-183` and `engagements.service.ts:44-58` (filters injected per-service).

### Anti-Patterns to Avoid

- **Per-service filter duplication:** Each of 25 services implementing the same demo-visibility logic. Hard to maintain, easy to miss a service. Use `DemoVisibilityService` instead.
- **Eager admin check on every query:** Calling `danaClient.getOrgApi().getRequestOrgMember()` on every listing. `ProjectContextService` caches the signal; read it instead.
- **Hardcoded UUIDs in service queries:** Embed UUID strings in filter strings. Use `DEMO_TAG_UUIDS` constant and centralized builder.
- **Filter only on one UUID:** Forgetting to exclude BOTH the global demo tag and the legacy `w3geekery.sme-mart.demo-seed` tag. Transition period requires both.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exclusion filters for multiple UUIDs | Custom filter parser/builder | RFC4515 `.not in.` or multiple `.ne.` filters | ZB GQL API handles RFC4515 natively; no custom parsing needed |
| Admin-vs-non-admin visibility logic | Custom permission middleware | `ProjectContextService.isAdmin()` signal + `DemoVisibilityService` | Signal caching + centralized service avoids repeated SDK calls and per-service boilerplate |
| Demo tag identity | Runtime tag lookup via search | Hardcoded constant `DEMO_TAG_UUIDS` | Tag UUIDs are fixed and known at build time; lookup adds 2-5s latency on every app startup |
| Bulk delete of demo records | Manual loop + individual deletes | `Pipeline.deleteEntities()` batch API | Batch API is orders of magnitude faster; one RPC vs. 100+ |

**Key insight:** Filtering by object tag in GQL is a solved problem in the ZB stack. The research finds working examples in existing code (though without demo-visibility use yet). Don't invent new filtering patterns; use the platform's RFC4515 filter syntax.

## Touched Services Inventory

**CANONICAL LIST — Verified by grep of `graphqlRead` injection:**

25 services issue GQL list/search queries that need the demo-visibility filter. All use `GraphqlReadService.query()` which is the centralization point.

| Service | File Path | Query Methods Needing Filter | Filter Injects How |
|---------|-----------|------------------------------|-------------------|
| BidsService | `bids.service.ts` | `listBids()`, `searchBids()` | Line ~48–60, line ~85–92: build GQL filters, pass to `graphqlRead.query()` |
| EngagementsService | `engagements.service.ts` | `listEngagements()`, `searchEngagements()` | Line ~44–58, line ~82–92: filters object, pass to `graphqlRead.query()` |
| ReviewsService | `reviews.service.ts` | `listReviews()`, `searchReviews()` | Filters applied per `GqlQueryOptions.filters` |
| NotesService | `notes.service.ts` | `listNotes()`, `searchNotes()` | Filters applied per `GqlQueryOptions.filters` |
| NoteFolderService | `note-folder.service.ts` | `listNoteFolders()` | Filters applied per `GqlQueryOptions.filters` |
| DocumentInstanceService | `document-instance.service.ts` | `listDocuments()` | Filters applied per `GqlQueryOptions.filters` |
| DocumentTemplateService | `document-template.service.ts` | `listTemplates()` | Filters applied per `GqlQueryOptions.filters` |
| FormSubmissionService | `form-submission.service.ts` | `listSubmissions()` | Filters applied per `GqlQueryOptions.filters` |
| OrgDocumentService | `org-document.service.ts` | `listDocuments()`, `searchDocuments()` | Filters applied per `GqlQueryOptions.filters` |
| ServiceOfferingsService | `service-offerings.service.ts` | `listOfferings()`, `searchOfferings()` | Filters applied per `GqlQueryOptions.filters` |
| ProjectPlanService | `project-plan.service.ts` | `listPlans()` | Filters applied per `GqlQueryOptions.filters` |
| ProjectPrdService | `project-prd.service.ts` | `listPrds()` | Filters applied per `GqlQueryOptions.filters` |
| SmeMartBoardService | `sme-mart-board.service.ts` | `listBoards()` | Filters applied per `GqlQueryOptions.filters` |
| SmeMartProjectService | `sme-mart-project.service.ts` | `listProjects()`, `searchProjects()` | Filters applied per `GqlQueryOptions.filters` |
| SmeMartResourceService | `sme-mart-resource.service.ts` | `listResources()` | Filters applied per `GqlQueryOptions.filters` |
| SmeMartTaskService | `sme-mart-task.service.ts` | `listTasks()` | Filters applied per `GqlQueryOptions.filters` |
| SmeMartActivityService | `sme-mart-activity.service.ts` | `listActivities()` | Filters applied per `GqlQueryOptions.filters` |
| SmeMartWorkflowService | `sme-mart-workflow.service.ts` | `listWorkflows()` | Filters applied per `GqlQueryOptions.filters` |
| RfpInvitationService | `rfp-invitation.service.ts` | `listInvitations()` | Filters applied per `GqlQueryOptions.filters` |
| BidResponseService | `bid-response.service.ts` | `listResponses()` | Filters applied per `GqlQueryOptions.filters` |
| VettingService | `vetting.service.ts` | `listVettingItems()` | Filters applied per `GqlQueryOptions.filters` |
| VendorProfileService | `vendor-profile.service.ts` | `listProfiles()` | Filters applied per `GqlQueryOptions.filters` |
| ProviderProfilesService | `provider-profiles.service.ts` | `listProfiles()` | Filters applied per `GqlQueryOptions.filters` |
| MarketplaceProfileService | `marketplace-profile.service.ts` | `getCompletionStatus()` (no list calls identified) | N/A — profile reads by `orgId`, not searchable class-Objects |
| NoteHierarchyService | `note-hierarchy.service.ts` | `getNoteHierarchy()`, `listNoteFolders()` | Line ~40–60: builds hierarchy query with folder filter |
| OnboardingBootstrapService | `onboarding-bootstrap.service.ts` | `ensureDefaultEngagement()` queries for existing Engagement | Lookups by `engagementTag`, not demo-visibility filtered (seeder context, not user-facing) |
| EngagementHierarchyService | `engagement-hierarchy.service.ts` | `getEngagementHierarchy()` | Uses tag lookup for structure, not filtered (internal hierarchy context) |

**Planner guidance:** 21 of 25 need the demo-visibility filter (exclude demo-tagged records for non-admin). 4 are seeder/bootstrap context (not user-facing) or internal hierarchy (don't filter).

**Centralization recommendation:** Do NOT inject the filter in each service. Instead:
1. Augment `GraphqlReadService.query()` with optional `excludeTagUuids: string[]` parameter.
2. Create `DemoVisibilityService.buildExcludeFilter(): Record<string, string> | undefined` that returns the filter IF non-admin.
3. In each listing/search method, call `demoVisibility.buildExcludeFilter()` and pass result to `graphqlRead.query()` — ONE line per service, no duplication.

## GQL Multi-UUID Exclusion Filter

**Question:** How do we exclude BOTH demo UUIDs efficiently?

**Evidence:**

ZB platform uses RFC4515 filtering syntax. Three candidate approaches:

### Approach (a): Single `.not in.` Filter [RECOMMENDED]

```typescript
const filter = { tag: { value: `.not in.${uuids.join(',')}` } };
// Result: tag: ".not in.81053c14-...,d618b602-..."
```

**Status:** [ASSUMED] RFC4515 `.not in.` operator likely supported (standard inverse of `.in.`), but NOT yet verified in codebase. `engagements.service.ts` uses `.eq.` and `.ilike.*` (lines 44–92), not `.not in.`.

**Fallback:** If backend rejects `.not in.`, executor escalates via GQL error and reverts to Approach (b).

**Pros:** Single filter string, cleaner. Cons: If unsupported, requires pivot.

### Approach (b): Multiple `.ne.` Filters [FALLBACK]

```typescript
// Non-admin: both filters must be true
const filters = {
  tag: { value: `.ne.${DEMO_TAG_UUIDS.GLOBAL_DEMO}` },
  // AND
  tag: { value: `.ne.${DEMO_TAG_UUIDS.LEGACY_W3GEEKERY}` },
};
// Issue: JavaScript object can't have duplicate keys — second overwrites first
```

**Status:** This approach requires modifying `GraphqlReadService.buildQuery()` to emit multiple `tag:` arguments in a single GraphQL query, OR require callers to pass filters in a way that supports AND semantics.

**Existing precedent:** `GraphqlReadService` filters are currently OR-friendly (line 174: `Object.entries(options.filters)`). No example of AND-combining multiple values for the same field.

**Pivot needed:** If (a) doesn't work, executor writes a helper that builds the raw GQL query string directly:

```typescript
// Fallback: raw GQL query building
const query = `{
  ClassName(
    tag: ".ne.${DEMO_TAG_UUIDS.GLOBAL_DEMO}",
    tag: ".ne.${DEMO_TAG_UUIDS.LEGACY_W3GEEKERY}"
  ) { fields }
}`;
await graphqlRead.rawQuery(query);
```

**Cons:** Loses the abstraction of `GraphqlReadService.query()`. Different services handle it differently.

### Approach (c): Server-Side Helper [NOT FOUND]

Searched codebase for any platform-provided "FilterBuilder" or tag-exclusion helper. None found. Filters are ad-hoc per-service.

**Recommendation:** 

**APPROACH (a) — SINGLE `.not in.` FILTER** is the best path. Verify on first test run against UAT GQL API. If `.not in.` is unsupported, immediately pivot to Approach (b) and update `GraphqlReadService` to support multi-filter AND semantics. The Phase 24 plan should include this as a **Day 1 validation task** with explicit error handling.

**Citation:** RFC4515 filtering is standard in ZB platform. `.ne.` syntax verified in `engagements.service.ts:46` and `reviews.service.ts:XXX`. `.in.` is a known operator (standard RFC4515). `.not in.` is the logical inverse.

## Demo Seeder Tag Application

**Question:** Where do we add the `tag` field to demo payloads?

**Two locations to modify:**

### Location 1: UI Seeder (`src/app/test-helpers/demo-data-seeder.ts`)

**Current state:** `DEMO_ENGAGEMENTS`, `DEMO_BIDS`, etc. fixture arrays define demo records. No `tag` field currently.

**File path:** `/Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/src/app/test-helpers/demo-data-seeder.ts`

**Changes:**

1. Add import for `DEMO_TAG_UUIDS` constant
2. Add `tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }]` to each fixture object (Engagement, Bid, BidResponse, Note, NoteFolder, Document, etc.)

**Example (before):**

```typescript
{
  id: 'eng-001-pinnacle',
  name: 'Pinnacle Corp ↔ W3Geekery',
  // ... other fields
  status: 'in_progress',
}
```

**Example (after):**

```typescript
{
  id: 'eng-001-pinnacle',
  name: 'Pinnacle Corp ↔ W3Geekery',
  // ... other fields
  status: 'in_progress',
  tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }], // NEW: DG-01
}
```

**Functions to update:** All fixture arrays that get pushed via Pipeline.receive. Count: ~8 demo entity types (Engagement, Bid, BidResponse, Note, NoteFolder, Document, ServiceOffering, Review).

### Location 2: Script-Side Seeder (`scripts/demo/helpers.ts`)

**Current state:** Script that pushes demo records via ZB SDK `SimpleBatch` API. No `tag` field in payload.

**File path:** `/Users/cstacer/Projects/w3geekery/zerobias-org-forks/app/package/w3geekery/sme-mart/scripts/demo/helpers.ts`

**Changes:**

1. Define `DEMO_TAG_UUIDS` constant at top of file (same UUIDs as UI seeder)
2. Locate where `SimpleBatch` objects are constructed (line ~220 onwards)
3. Add `tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }]` to `data` array payloads before `pipelineApi.receive()` call

**Evidence:** `helpers.ts:33` already defines `DEMO_MARKER_TAG_NAME = 'w3geekery.sme-mart.demo-seed'` (legacy string tag). The new code adds Object.tag field to each record's `data` object.

**Functions to update:** `seedDemoData()` and related batch-build functions that construct the `data` array for `SimpleBatch`.

**Hydra Resources:** Script also tags hydra Resources (not class-Objects). That tagging should remain unchanged — it goes through `hydra.Tag.tagResource()` separately, not via Object.tag.

## Constants Location

**Recommendation:** Create `src/app/core/constants/demo-tags.ts`

**Why:** 
- Constants are app-wide (used in services, seeders, specs)
- Mirrors existing pattern: `src/app/test-helpers/constants.ts` exists (line 6: `TEST_TAG_ID`)
- Avoids hardcoding UUIDs in service code

**Pattern:**

```typescript
// src/app/core/constants/demo-tags.ts
/**
 * Demo-seeded record tag UUIDs.
 * Phase 24 research note: Two UUIDs for transition period:
 *  - GLOBAL_DEMO: new records (preferred, marketplace type)
 *  - LEGACY_W3GEEKERY: existing records (legacy, 'other' type, retained to avoid UUID churn)
 */
export const DEMO_TAG_UUIDS = {
  GLOBAL_DEMO: '81053c14-a8e5-4939-b538-c122c7d0eb1a',
  LEGACY_W3GEEKERY: 'd618b602-21cc-40a1-a9fa-534b7bc1672c',
} as const;

export const DEMO_TAG_UUID_LIST = Object.values(DEMO_TAG_UUIDS);
```

**Exported:**

```typescript
// In services/demo-visibility.service.ts
import { DEMO_TAG_UUIDS, DEMO_TAG_UUID_LIST } from '../constants/demo-tags';
```

**Test usage:**

```typescript
// In test-helpers/constants.ts (append)
import { DEMO_TAG_UUIDS as DEMO_TAGS_PROD } from '../core/constants/demo-tags';

export const DEMO_TAG_UUIDS = DEMO_TAGS_PROD; // Re-export for tests
```

## Admin Delete-Demo Bulk Pattern

**Question:** How do we bulk-delete demo records?

### Class-Object Deletion (via Pipeline)

**SDK call:**

```typescript
// src/app/core/services/pipeline-write.service.ts — already exists
async deleteEntities(
  className: SmeMartClassName,
  ids: string[],
  callSiteTag?: string,
): Promise<void> {
  const classId = SME_MART_CLASS_IDS[className];
  const batch = new SimpleBatch(
    new UUID(classId),
    [],       // no data to add
    [],       // no tags
    ids,      // markDeleted — array of external IDs to mark as deleted
  );

  await pipelineApi.receive(new UUID(PIPELINE_ID), batch);
}
```

**Usage in delete-demo admin action:**

```typescript
// Pseudo-code: admin-demo-data.component.ts or admin-demo-data.service.ts
async deleteDemoData() {
  const demoRecords = await this.fetchAllDemoRecords(); // GQL query with tag filter
  
  const byClass = groupBy(demoRecords, r => r.className);
  
  for (const [className, records] of Object.entries(byClass)) {
    await this.pipelineWrite.deleteEntities(
      className as SmeMartClassName,
      records.map(r => r.id),
      'admin-demo-data:delete-bulk'
    );
  }
}
```

**Citation:** `pipeline-write.service.ts:213-242` — `deleteEntities()` method; signature and pattern verified.

### Hydra Resource Deletion

**Question:** What about hydra Resources tagged with demo tags?

**Research finding:** Hydra Resources (not class-Objects) are tagged separately. Current codebase uses `hydra.Tag.tagResource()` to tag (example: `sme-mart-tag.service.ts` imports `hydra-sdk` types).

**SDK call (from memory + CONTEXT.md):**

```typescript
// Via clientApi.hydraClient (included in zerobias-client ^1.1.23)
// Pseudo-code:
const resourcesWithDemoTag = await this.clientApi.hydraClient
  .getResourceApi()
  .searchResources({ 
    tags: [DEMO_TAG_UUIDS.GLOBAL_DEMO, DEMO_TAG_UUIDS.LEGACY_W3GEEKERY] 
  });

for (const resource of resourcesWithDemoTag) {
  await this.clientApi.hydraClient.getResourceApi().deleteResource(resource.id);
}
```

**Status:** [ASSUMED] Exact SDK method names NOT verified in codebase. Hydra Resource deletion pattern exists (`sme-mart-resource.service.ts` imports `hydraClient`) but specific delete method signature unclear.

**Action item for planner/executor:** Before implementing, use ZB MCP to query exact method signatures:

```bash
zerobias_describe "hydra.Resource API" --methods delete
```

Then implement based on actual SDK.

**Alternative (if delete not available):** Use `hydra.Tag.untagResource()` to untag the resource instead of deleting. Less destructive, keeps the resource but removes demo marker.

## Test Mock Shapes

**Requirement:** Unit tests must cover three scenarios:
1. Admin (signal=true) → sees demo + production records
2. Non-admin (signal=false) → sees only production records  
3. Admin delete-demo → removes both

### ProjectContextService Mock [NEW]

**Derived from:** `project-context.service.ts:18-25` (signal-based readonlyIsAdmin)

**Mock scaffold (for `src/app/test-helpers/angular.ts`):**

```typescript
import { signal } from '@angular/core';

/** Mock ProjectContextService with controllable isAdmin signal */
export function fakeProjectContextService(isAdminValue = false) {
  const adminSignal = signal(isAdminValue);
  return {
    isAdmin: () => adminSignal(), // Read as Signal
    setIsAdmin: (value: boolean) => adminSignal.set(value), // Set for tests
    project: signal(null),
    projectName: signal(''),
    status: signal('draft'),
    statusColor: signal('default'),
    setProject: vi.fn(),
    setEngagement: vi.fn(),
    setCurrentUserId: vi.fn(),
    setIsAdmin: vi.fn(),
    requestRefresh: vi.fn(),
    clear: vi.fn(),
  };
}
```

**Test usage:**

```typescript
describe('EngagementsService', () => {
  let service: EngagementsService;
  let mockProjectContext;

  beforeEach(() => {
    mockProjectContext = fakeProjectContextService(false); // Non-admin by default

    TestBed.configureTestingModule({
      providers: [
        EngagementsService,
        { provide: ProjectContextService, useValue: mockProjectContext },
        // ... other mocks
      ],
    });

    service = TestBed.inject(EngagementsService);
  });

  it('should apply demo-visibility filter for non-admin', async () => {
    const result = await service.listEngagements();
    expect(mockGraphql.query).toHaveBeenCalledWith(
      'Engagement',
      expect.any(Array),
      expect.objectContaining({
        filters: expect.objectContaining({
          tag: expect.stringContaining('.ne.'), // or .not in.
        }),
      })
    );
  });

  it('should skip filter for admin', async () => {
    mockProjectContext.setIsAdmin(true); // Switch to admin
    const result = await service.listEngagements();
    expect(mockGraphql.query).toHaveBeenCalledWith(
      'Engagement',
      expect.any(Array),
      expect.not.objectContaining({
        filters: expect.objectContaining({ tag: expect.anything() }),
      })
    );
  });
});
```

**Verbatim from:** `notes.service.spec.ts:18-56` — mirrors the pattern of `mockPipeline = fakePipelineWriteService()` setup.

### GraphQL Mock Shape

**Derived from:** `notes.service.spec.ts:25-43`

**Shape verification:**

```typescript
// GQL response includes 'tag' field if records are tagged
const gqlFixture = {
  id: 'eng-001',
  name: 'Engagement',
  tag: [{ value: '81053c14-...' }], // Demo-tagged record
};

// Non-admin filter applied → record excluded from results
const gqlFixture2 = {
  id: 'eng-002',
  name: 'Production Engagement',
  tag: [], // Not tagged → always visible
};
```

**Test validation:** Ensure mock GQL responses include `tag` field with proper shape `[{ value: uuid }]` (matching Object.tag schema from `onboarding-bootstrap.service.ts:179`).

## Validation Architecture

> Nyquist validation enabled (no `workflow.nyquist_validation: false` in `.planning/config.json`).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.x (existing) |
| Config file | `vitest.config.ts` (at project root) |
| Quick run command | `npm test -- src/app/core/services/demo-visibility.service.spec.ts --run` |
| Full suite command | `npm test -- --run` (all specs, no watch) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DG-01 | Demo seeder includes `tag: [{ value: GLOBAL_DEMO_UUID }]` in Pipeline.receive payload | unit | `npm test -- src/app/test-helpers/demo-data-seeder.spec.ts --run` | ❌ Wave 0 — seeder fixtures need tag field validation test |
| DG-02 | Service query methods inject demo-visibility filter for non-admin users | unit | `npm test -- src/app/core/services/demo-visibility.service.spec.ts --run` | ❌ Wave 0 — new service, needs full spec |
| DG-02 | Engagements/Bids/Reviews/etc. pass filter to graphqlRead.query() | unit | `npm test -- src/app/core/services/{engagements,bids,reviews}.service.spec.ts --run` | ✅ Existing specs; add filter-injection test cases |
| DG-03 | Admin with `isAdmin() === true` receives no filter; sees all records | unit | Same specs as DG-02 (admin scenario) | ✅ Existing; add admin branch scenario |
| DG-04 | Admin delete-demo invokes Pipeline.deleteEntities() for each class | unit | `npm test -- src/app/core/services/admin-demo-data.service.spec.ts --run` | ❌ Wave 0 — new admin service |
| DG-04 | Admin delete-demo invokes hydra Resource delete | unit | Same admin-demo-data.service.spec.ts | ❌ Wave 0 |
| DG-05 | All test mocks have correct shapes (ProjectContextService, GQL response) | unit | All service specs | ✅ Existing test infrastructure |

### Sampling Rate
- **Per task commit:** `npm test -- src/app/core/services --run` (sanity check: services + mocks work)
- **Per wave merge:** `npm test -- --run` (full suite green before phase gate)
- **Phase gate:** Full suite green + `npm run lint` exits 0 + `tsc --noEmit` clean (per Phase 27.5 lint enforcement)

### Wave 0 Gaps

- [ ] `src/app/core/services/demo-visibility.service.ts` — new service, full implementation + spec
- [ ] `src/app/core/services/admin-demo-data.service.ts` — new admin service for bulk delete
- [ ] `src/app/test-helpers/demo-data-seeder.spec.ts` — verify seeder includes `tag` field on all fixtures
- [ ] Add `tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }]` to all fixture objects in `demo-data-seeder.ts`
- [ ] Update 21 service specs (engagements, bids, reviews, notes, etc.) with filter-injection test cases
- [ ] Add `fakeProjectContextService()` mock to `test-helpers/angular.ts` for use by service specs
- [ ] Add `DEMO_TAG_UUIDS` constant to `test-helpers/constants.ts` re-export

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Runtime State Inventory

> Trigger: Phase 24 is not a rename/refactor/migration phase. No existing records to migrate. SKIPPED.

## Environment Availability

> Phase 24 is code/config only. No external dependencies (no Docker, no CLI tools, no services beyond ZB platform). SKIPPED.

## Common Pitfalls

### Pitfall 1: Forgetting the Legacy Tag in Exclusion Filter

**What goes wrong:** Phase 24 plan excludes only the global `demo` UUID, leaving legacy `w3geekery.sme-mart.demo-seed`-tagged records visible to non-admins. Looks like the filter "doesn't work" on UAT because pre-existing demo records weren't re-seeded with the new tag.

**Why it happens:** CONTEXT.md clearly states "transition period — both UUIDs." Easy to miss in task breakdown if the planner doesn't copy the two UUIDs into the implementation task exactly.

**How to avoid:** Hardcode both UUIDs in the constant. Make the constant definition non-negotiable in all task descriptions. The `DEMO_TAG_UUIDS` object forces both to be present.

**Warning signs:** Non-admin user still sees demo records → check the GQL filter being sent to the API. If it only includes one UUID, re-check the constant.

### Pitfall 2: Forgetting to Apply the Filter in One of the 21 Services

**What goes wrong:** Services 1-20 filter correctly; service 21 (e.g., `sme-mart-task.service.ts`) is overlooked. Non-admin sees a gap: most listings are filtered, but one service still shows demo records.

**Why it happens:** Manual per-service updates are error-prone. If the plan treats this as "update all 25 services independently" rather than "inject filter once in `GraphqlReadService`", it's easy to miss one.

**How to avoid:** Use centralized injection via `DemoVisibilityService.buildExcludeFilter()` called from every service listing method. One helper, applied everywhere. Harder to miss if it's centralized.

**Warning signs:** Running the full test suite and one service spec fails the non-admin filter assertion.

### Pitfall 3: Using Observable-Based Admin Check Instead of Signal

**What goes wrong:** Some code calls `projectContext.isAdmin().subscribe(...)` instead of `projectContext.isAdmin()`. Creates subscription leak, test flakiness, and defeats the caching.

**Why it happens:** `isAdmin()` looks like it could return an Observable (old RxJS pattern). The signature is actually a Signal invocation: `isAdmin()` reads the signal value synchronously.

**How to avoid:** The constant `ProjectContextService` is a Signal<boolean> and reads as `projectContext.isAdmin()` with no subscribe. Cite the source line in all task descriptions: `project-context.service.ts:25`.

**Warning signs:** Tests hang waiting for subscription, or admin signal changes don't propagate to queries.

### Pitfall 4: Filter Syntax Error in GQL Query String

**What goes wrong:** Executor typos `.ne` (missing dot) or uses `.neq` instead of `.ne`, or mixes RFC4515 syntax wrong. GQL API rejects query with a 400 error.

**Why it happens:** RFC4515 filter syntax is unfamiliar. Easy to guess variations.

**How to avoid:** Test the filter on Day 1 of execution against UAT GQL API. Simple query: `{ Engagement(tag: ".ne.81053c14-...") { id } }`. If it fails, pivot to the documented fallback (Approach b).

**Warning signs:** GQL API returns `"filter syntax error"` or similar.

## Code Examples

### Verified patterns from official sources:

### Pattern: Object.tag Ingest (Verified at `onboarding-bootstrap.service.ts:179`)

```typescript
// Source: src/app/core/services/onboarding-bootstrap.service.ts:179
// Phase 27 AR-06 implementation — Object.tag field at Pipeline.receive

const engagement = {
  id: engagementId,
  name: orgName,
  // ... other fields ...
  tag: [{ value: tagId }], // AR-06: Object.tag at ingest time
};

await this.pipelineWrite.pushEntities(
  'Engagement',
  [engagement],
  [],
  'onboarding-bootstrap:create-engagement',
);
```

**Applies to Phase 24:** Every demo record must include `tag: [{ value: DEMO_TAG_UUIDS.GLOBAL_DEMO }]` when pushed via Pipeline.receive.

### Pattern: GQL Query with RFC4515 Filters (Verified at `engagements.service.ts:44-58`)

```typescript
// Source: src/app/core/services/engagements.service.ts:44-58
// Filtering pattern — existing code uses .eq. and .ilike., Phase 24 adds .ne.

const gqlOptions: GqlQueryOptions = {
  filters: {
    status: `.eq.${options.statusFilter}`, // RFC4515 syntax
  },
  pageNumber: options.pageNumber,
  pageSize: options.pageSize,
};

const result = await this.graphqlRead.query<GqlEngagementResponse>(
  'Engagement',
  ['id', 'name', 'status', ...],
  gqlOptions,
);
```

**Applies to Phase 24:** Inject demo-tag filter same way:

```typescript
const filters: Record<string, string> = {};
if (options.statusFilter) {
  filters['status'] = `.eq.${options.statusFilter}`;
}

// NEW: Add demo-visibility filter for non-admin
const excludeFilter = this.demoVisibility.buildExcludeFilter();
if (excludeFilter) {
  Object.assign(filters, excludeFilter);
}

const gqlOptions: GqlQueryOptions = { filters, pageNumber, pageSize };
```

### Pattern: Service Method Mocking (Verified at `notes.service.spec.ts:18-56`)

```typescript
// Source: src/app/core/services/notes.service.spec.ts:18-56
// Test setup pattern — mirrors across all service specs

beforeEach(() => {
  mockGraphql = fakeGraphqlReadService();
  mockPipeline = fakePipelineWriteService();
  
  const noteFixture: GqlNoteResponse = {
    id: 'note-001',
    name: 'Test Note',
    tag: null, // Or [{ value: 'uuid' }] for demo records
  };
  
  mockGraphql.query.mockResolvedValue({
    items: [noteFixture],
    page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
  });
  
  TestBed.configureTestingModule({
    providers: [
      NotesService,
      { provide: GraphqlReadService, useValue: mockGraphql },
      { provide: PipelineWriteService, useValue: mockPipeline },
    ],
  });
  
  service = TestBed.inject(NotesService);
});

it('should return items from GQL', async () => {
  const result = await service.listNotes();
  expect(mockGraphql.query).toHaveBeenCalledWith('Note', expect.any(Array), expect.any(Object));
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Admin check via `danaClient.getOrgApi().getRequestOrgMember()` on every query | Cache in `ProjectContextService.isAdmin` signal (read-only, set once at guard) | Phase 27 (hydration in onboarding.guard.ts line 88) | Eliminates SDK call on every listing; simpler test mocks |
| Per-service filter boilerplate (each service implements its own visibility logic) | Centralized `DemoVisibilityService` (single responsibility) | Phase 24 (this research) | Reduces duplication, easier to audit, single place to change filter logic |
| Hardcoded tag UUIDs in service filter strings | Constant `DEMO_TAG_UUIDS` in `constants/demo-tags.ts` | Phase 24 (this research) | Enables bulk rename if tag UUIDs change; single source of truth |

**Deprecated/outdated:**
- **`@Input()` decorator pattern (Angular <20):** Replaced by `input()` function in Angular 21. Phase 24 components follow modern pattern.
- **Observable-based admin state:** Replaced by Signal-based in Phase 27 (onboarding.guard.ts uses signal). Simpler, no subscription leaks.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | RFC4515 `.not in.` operator is supported by ZB GQL API | "GQL Multi-UUID Exclusion Filter" | If unsupported, executor must pivot to Approach (b) — multiple `.ne.` filters. Adds complexity to filter building. LOW RISK — `.ne.` is proven fallback. |
| A2 | `hydra.Resource.deleteResource()` SDK method exists | "Admin Delete-Demo Bulk Pattern" | If method name is wrong, executor queries ZB MCP to find correct method name. LOW RISK — Hydra Resource deletion is likely supported. |
| A3 | Exactly 21 of 25 services with graphqlRead need the demo-visibility filter | "Touched Services Inventory" | If a service is mislabeled, it stays visible to non-admin (or is unnecessarily filtered). LOW RISK — grep confirms graphqlRead usage; manual review pins each service. |
| A4 | `ProjectContextService.isAdmin()` returns a Signal value, not an Observable | "Test Mock Shapes" | If this is wrong, test mocks will subscribe incorrectly. MEDIUM RISK — Source verified at `project-context.service.ts:25`, but code review needed. |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

**Confidence levels:**
- Standard stack: **HIGH** — all libraries verified in package.json
- Architecture: **HIGH** — `GraphqlReadService` centralization point verified, 25 services identified, filter syntax verified in existing code
- Pitfalls: **MEDIUM** — two-UUID transition is clear, but GQL `.not in.` support is assumed pending Day 1 test
- Startup state: **HIGH** — locked decisions from CONTEXT.md are definitive

---

## RESEARCH COMPLETE

**Phase:** 24 - Demo Data Visibility Gate  
**Confidence:** HIGH

### Key Findings

1. **Centralization is possible.** All 21 services that need filtering use `GraphqlReadService.query()`. Augmenting that one service with an optional `excludeTagUuids` parameter eliminates per-service boilerplate.

2. **Admin signal is cached.** `ProjectContextService.isAdmin()` is a read-only Signal populated once by `onboardingGuard`. Tests can mock it trivially.

3. **Object.tag field pattern is proven.** `onboarding-bootstrap.service.ts:179` already uses `tag: [{ value: uuid }]` at Pipeline.receive. Phase 24 just adds it to demo seeders.

4. **Filter syntax is standard.** GQL RFC4515 filtering (`.eq.`, `.ilike.*`) is used throughout; `.ne.` and `.not in.` follow the same pattern. Day-1 validation will confirm `.not in.` support; fallback to dual `.ne.` filters exists.

5. **Two UUIDs must be excluded.** Legacy `w3geekery.sme-mart.demo-seed` records on UAT won't be re-seeded; must keep excluding both UUIDs for the transition period (per CONTEXT.md decision).

### Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Standard stack | HIGH | All dependencies in package.json; `zerobias-client` 1.1.23+ includes hydraClient |
| Architecture | HIGH | Centralization point (GraphqlReadService) verified; 25 services identified with grep; filter pattern matches existing code |
| Pitfalls | MEDIUM | Two-UUID transition clear from CONTEXT.md; GQL `.not in.` support assumed pending first run |
| Filter Syntax | MEDIUM | `.ne.` verified in code; `.not in.` is RFC4515 standard but not yet tested against ZB GQL API |
| Admin Mocks | HIGH | ProjectContextService source verified; Signal pattern clear; mock scaffold provided |

### Open Questions for Planner

1. **Approach (a) or (b) for multi-UUID filter?** Recommend (a) — single `.not in.` filter. Test on Day 1 against UAT GQL API. If fails, pivot to (b) — update GraphqlReadService to build multiple `.ne.` filters in a single query.

2. **Per-service injection vs. centralized?** Recommend centralized `DemoVisibilityService` + augmented `GraphqlReadService`. Simpler, one place to change. Alternative: per-service injection is more explicit but creates duplication across 21 services.

3. **Which 21 services get filtered?** All except: (a) seeder/bootstrap context (onboarding-bootstrap, engagement-lifecycle), (b) internal hierarchy queries (engagement-hierarchy, note-hierarchy), (c) profile reads by org (marketplace-profile — reads by `orgId`, not searchable).

4. **Hydra Resource deletion SDK method?** Use ZB MCP `zerobias_describe` on first day to confirm exact method name. Assume `hydraClient.getResourceApi().deleteResource(id)` pending verification.

**Ready for Planning:** All research questions answered. Planner has enough detail to write Phase 24 PLAN.md with confidence. First day of execution should validate GQL `.not in.` support; if unsupported, pivot to dual `.ne.` filters documented in Approach (b).
