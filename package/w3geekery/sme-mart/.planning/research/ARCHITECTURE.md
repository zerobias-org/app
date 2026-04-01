# Architecture: Dual-Path Data Layer (Pipeline Writes + GQL Reads)

**Project:** SME Mart Engagement Marketplace
**Date:** 2026-03-18
**Mode:** Incremental migration from Neon PostgreSQL → AuditgraphDB

## Executive Summary

SME Mart's data layer is transitioning from a single Neon PostgreSQL database to a dual-path architecture:
- **Writes** via Receiver Differential Pipeline (batch API) → AuditgraphDB
- **Reads** via auto-generated GraphQL API → boundary-scoped queries

This architecture cleanly separates concerns while maintaining backward compatibility. Domain services swap their internals from `SmeMartDbService` (Neon) to `PipelineWriteService` (writes) + `GraphqlReadService` (reads). Component APIs remain unchanged.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Angular 21 Components                         │
│  (ProviderList, EngagementDetail, BidWizard, NotesPanel, etc.)   │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┴─────────────────┐
        │                                  │
        ▼                                  ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│   Domain Services        │    │   Context/State          │
│ (WorkRequestsService,    │    │ (EngagementContextSvc,   │
│  BidsService,            │    │  RfpWizardService)      │
│  NotesService, etc.)     │    │                          │
└────┬─────────────────────┘    └──────────────────────────┘
     │
     ├─────────────────────────────────────────────────┐
     │                                                 │
     ▼ (swap internals)                                │
┌────────────────────────────────────────┐             │
│   Pipeline Write Service                │             │
│ • pushEntity()                          │             │
│ • pushEntities()                        │             │
│ • deleteEntity()                        │             │
│ • deleteEntities()                      │             │
│                                         │             │
│ Maps: Entity name → Class ID            │             │
│ Batch format: SimpleBatch               │             │
└────────┬─────────────────────────────────┘             │
         │                                              │
         ▼                                              │
┌────────────────────────────────────────┐             │
│  ZeroBias Client API                    │             │
│  platformClient.getPipelineApi()        │             │
│  + Hudson receiver pipeline connector   │             │
└────────┬─────────────────────────────────┘             │
         │                                              │
         ▼                                              │
┌──────────────────────────┐                          │
│  AuditgraphDB Pipeline   │                          │
│  ID: 091d5068-0527...    │                          │
│  Mode: receiver/diff/json│                          │
└─────────────────────────┘  ◄──────────────────────────┘
                                                        │
        ┌───────────────────────────────────────────────┘
        │
        ▼ (reads + indexing)
┌──────────────────────────────────────────────────────┐
│          AuditgraphDB                                │
│  • Engagement, Bid, BidResponse, Note, etc.         │
│  • Auto-indexed via dataloader                      │
│  • Schema classes = YAML definitions (schema repo)  │
│  • All 17 entity types stored here                  │
└───────────┬───────────────────────────────────────────┘
            │
            ▼ (GQL queries)
    ┌──────────────────────────────────┐
    │  GraphQL Read Service             │
    │ • query()                         │
    │ • getById()                       │
    │ • rawQuery()                      │
    │                                  │
    │ Builds: RFC4515 filters → GQL   │
    │ Boundary: 2842fab1-ceff...      │
    └──────────────────────────────────┘
```

## Component Boundaries

### 1. Domain Services (High-Level Business Logic)

**What they do:**
- Implement marketplace operations (create engagement, submit bid, add note, etc.)
- Provide public APIs consumed by components and other services
- Manage state signals for loading/UI updates
- Fire-and-forget notifications

**Current examples:**
- `WorkRequestsService` — RFP creation, engagement status transitions
- `BidsService` — Bid creation, draft management, submissions
- `NotesService` — Note CRUD, folder hierarchy
- `DocumentService` — Document upload/storage
- `CatalogService` — Service offering browsing

**After migration:**
- **No component API changes** — backward compatible
- Internal swap: `this.db.*()` → `this.pipeline.pushEntity()` + `this.gql.query()`
- Public methods remain identical signature

**Build order implication:** Domain services are the primary migration surface. Test each one independently before moving to the next entity.

### 2. Pipeline Write Service

**Responsibility:** Ingest entity data into AuditgraphDB via Receiver Differential Pipeline.

**Key features:**
- Single pipeline for all SME Mart entities (Pipeline ID: `091d5068-0527-4f45-9839-37f6d5c1669e`)
- Class ID mapping (hardcoded, from schema repo)
- Upsert semantics (update if `id` exists, create if new)
- Delete support (mark objects as deleted in differential mode)
- Optional tag attachment on write

**Public API:**
```typescript
async pushEntity(className: SmeMartClassName, data: Record<string, unknown>, tagIds?: string[]): Promise<void>
async pushEntities(className: SmeMartClassName, data: Record<string, unknown>[], tagIds?: string[]): Promise<void>
async deleteEntity(className: SmeMartClassName, id: string): Promise<void>
async deleteEntities(className: SmeMartClassName, ids: string[]): Promise<void>
```

**Communicates with:**
- `ZerobiasClientApi.platformClient.getPipelineApi()`

**Constraints:**
- Must wait for caller to provide data in correct camelCase shape (no field mapping)
- No validation — garbage in, garbage out
- Pipeline is async — data may not be immediately queryable

### 3. GraphQL Read Service

**Responsibility:** Query indexed entity data from AuditgraphDB via GraphQL API.

**Key features:**
- Boundary-scoped queries (boundary ID: `2842fab1-ceff-4ec4-bf09-ce5e7c33c3e2`)
- RFC4515-style filters (same format as Neon SmeMartDbService)
- Pagination, sorting, field selection
- Relationship traversal (nested GQL queries)
- Raw query support for complex relationships

**Public API:**
```typescript
async query<T>(className: SmeMartClassName, fields: string[], options?: GqlQueryOptions): Promise<GqlQueryResult<T>>
async getById<T>(className: SmeMartClassName, id: string, fields: string[]): Promise<T | null>
async rawQuery(query: string, pageNumber?: number, pageSize?: number): Promise<Record<string, unknown>>
```

**Communicates with:**
- `ZerobiasClientApi.graphqlClient.getBoundaryApi()`

**Constraints:**
- Reads only — no mutations
- Must wait for GQL types to be indexed (eventual consistency delay)
- Pagination is mandatory (no "fetch all" pattern)
- Filters must be pre-built (no dynamic filter builders)

### 4. SmeMartDbService (Legacy Neon)

**Status:** Remains for non-migrated entities during the incremental migration.

**What's staying:**
- Entities NOT in Wave 1-3: temporarily bypass `PipelineWriteService`/`GraphqlReadService`
- Entities in Wave 4 (Project Bloom): **never touch SmeMartDbService** — built directly against Pipeline+GQL

**Will be removed:**
- After all 8 original entities complete Wave 1-3 migration
- Neon tables archived to backup (not deleted immediately)

## Data Flow Patterns

### Pattern 1: Create Entity (Write Path)

**Sequence:**
```
Component/Service
  ↓ calls
WorkRequestsService.createRfp(data)
  ↓
1. Call PipelineWriteService.pushEntity('Engagement', mappedData)
2. PipelineWriteService → ZerobiasClientApi → Pipeline.receive()
3. Return optimistically (don't wait for GQL indexing)
4. Fire-and-forget: NotificationService.create()
```

**Key decision:** Return immediately after Pipeline.receive() succeeds. Caller has the data from step 1 — no re-query needed. If visibility is critical, caller uses optimistic update pattern.

**Field mapping required:** Neon schema uses snake_case; GQL expects camelCase.
```typescript
// Example: Neon → Pipeline field mapping
{
  request_id: 'requestId',
  buyer_zerobias_user_id: 'buyerZerobiasUserId',
  budget_min: 'budgetMin',
  budget_max: 'budgetMax',
  response_deadline: 'responseDeadline',
  // ... etc
}
```

### Pattern 2: List Entities (Read Path)

**Sequence:**
```
Component
  ↓ calls
WorkRequestsService.listEngagements(options)
  ↓
1. Call GraphqlReadService.query('Engagement', ['id', 'name', 'status', ...], options)
2. GraphqlReadService → ZerobiasClientApi → GraphQL.boundaryExecuteRawQuery()
3. Deserialize results, return GqlQueryResult
4. Store in signal: this.engagements.set(result.items)
```

**View aggregation (Neon → GQL replacement):**

Before (Neon, using views):
```sql
SELECT * FROM v_engagement_summary  -- JOINs work_requests + bids + requirements
```

After (GQL, nested queries):
```graphql
{
  Engagement(status: ".eq.published") {
    id name status category budgetMin budgetMax
    bids { id status price }
  }
}
```

### Pattern 3: Search/Filter (Read Path)

**Same as Pattern 2, but with filters:**

```typescript
const result = await gql.query('Engagement',
  ['id', 'name', 'status'],
  {
    filters: {
      status: '.eq.published',
      category: '.ilike.*SOC*',
      budgetMin: '.gte.5000'
    },
    pageSize: 25
  }
);
```

Filter format is identical to Neon (RFC4515):
- `.eq.value` — exact match
- `.ilike.*value*` — case-insensitive pattern match
- `.gte.value`, `.lte.value`, `.gt.value`, `.lt.value` — comparisons

### Pattern 4: Update Entity (Write Path)

**Sequence:**
```
Component/Service
  ↓ calls
BidsService.saveDraft(id, wizardData, step)
  ↓
1. Flatten wizardData fields (nested → flat columns)
2. Call PipelineWriteService.pushEntity('Bid', { id, ...flatFields })
3. Pipeline.receive() (upsert by id)
4. Return optimistically
```

**Key:** `id` field is the external ID. Pipeline treats it as the upsert key — if `id` exists in AuditgraphDB, object is updated; otherwise, created.

### Pattern 5: Delete Entity (Write Path)

**Sequence:**
```
Component/Service
  ↓ calls
NotesService.deleteNote(id)
  ↓
1. Call PipelineWriteService.deleteEntity('Note', id)
2. Pipeline marks object as deleted (differential mode)
3. Object no longer appears in GQL queries
```

### Pattern 6: Handle Relationships

**Example:** Query engagements with their bids

**Neon approach:**
```sql
SELECT *, (array_agg(bids)) as bids
FROM work_requests
JOIN bids ON work_requests.id = bids.request_id
```

**GQL approach (nested query):**
```typescript
const result = await gql.rawQuery(`
  {
    Engagement(status: ".eq.published") {
      id name status
      bids { id price status }
    }
  }
`);
```

**Tradeoff:**
- ✅ Simpler (no explicit JOIN syntax)
- ✅ Relationship defined in schema (YAML `linkTo`)
- ✅ Pagination handled per-entity
- ⚠️ GQL queries can be verbose for deep relationships

## Migration Strategy by Entity Wave

### Wave 1: Engagement + Bids (Core Marketplace)

**Entities:**
- `Engagement` (Neon: `work_requests`)
- `Bid` (Neon: `bids`)
- `BidResponse` (Neon: `bid_responses`)

**Services affected:**
- `WorkRequestsService` (list, get, create RFP, update status)
- `BidsService` (list, get, create, submit, draft management)

**Field mapping required:**
```typescript
WORK_REQUEST_FIELDS: {
  request_id → id
  buyer_zerobias_user_id → buyerZerobiasUserId
  buyer_zerobias_org_id → buyerZerobiasOrgId
  title → title
  description → description
  category → category
  budget_type → budgetType
  budget_min → budgetMin
  budget_max → budgetMax
  timeline → timeline
  response_deadline → responseDeadline
  status → status
  created_at → createdAt
  updated_at → updatedAt
  engagement_tag → engagementTag
  zerobias_tag_id → zerobiasTagId
  // ... etc
}

BID_FIELDS: {
  bid_id → id
  request_id → engagementId (or keep as requestId?)
  provider_id → providerId
  status → status
  cover_letter → coverLetter
  proposed_price → proposedPrice
  proposed_timeline → proposedTimeline
  executive_summary → executiveSummary
  team_description → teamDescription
  wizard_step → wizardStep
  wizard_data → wizardData
  ai_assisted → aiAssisted
  ai_model → aiModel
  ai_generated_at → aiGeneratedAt
  created_at → createdAt
  updated_at → updatedAt
  // ... etc
}
```

**View replacements:**
- `v_engagement_summary` → `gql.query('Engagement', fields, filters)`
- `v_engagement_detail` → `gql.getById('Engagement', id, fields)` + nested relationships
- `v_bid_summary` → `gql.rawQuery()` with bids nested under engagement

**Testing:** Roundtrip test for each entity before cutover.

### Wave 2: Notes + Documents (Engagement Attachments)

**Entities:**
- `Note` (Neon: `notes`)
- `NoteFolder` (Neon: `note_folders`)
- `SmeMartDocument` (Neon: `documents`)

**Services affected:**
- `NotesService`
- `DocumentService`

**Dependency:** These link to Engagement via foreign keys. Ensure Wave 1 is stable before migrating.

### Wave 3: Standalone Entities

**Entities:**
- `ServiceOffering` (Neon: `service_offerings`)
- `Review` (Neon: `reviews`)

**Services affected:**
- `CatalogService`
- `ReviewsService` (future)

**Dependency:** No links to other migrated entities. Can migrate anytime after Wave 1 is stable.

### Wave 4: Project Bloom (NEW — No Migration)

**Entities (built directly against GQL from day one):**
- `SmeMartProject`
- `SmeMartBoard`
- `SmeMartActivity`
- `SmeMartWorkflow`
- `SmeMartTask`
- `ProjectPrd`
- `PrdSection`
- `ProjectPlan`
- `PlanMilestone`

**Services (all new):**
- `ProjectService`
- `BoardService`
- `ActivityService`
- `WorkflowService`
- `TaskService`
- `PrdService`
- `PlanService`

**Build order:** These services skip SmeMartDbService entirely. They call `PipelineWriteService` + `GraphqlReadService` directly. No legacy code to migrate — clean slate.

## Eventual Consistency Handling

### The Problem

Pipeline writes are asynchronous. Data pushed to the pipeline may not be immediately queryable via GraphQL due to indexing delays.

**Symptom:** Create an engagement, then immediately query by ID → returns null.

### Solutions

#### 1. Optimistic Updates (Recommended for most cases)

```typescript
// Component already has the data from the create call
async createEngagement(data) {
  const engagement = await this.workRequests.createRfp(data);
  // Component now has `engagement` object — no re-query needed
  this.router.navigate(['/engagement', engagement.id]);
}
```

**Why this works:**
- Component created the object locally, has all the data
- No re-fetch needed for display
- GQL query happens when user navigates or component loads fresh

**Downside:** If component navigates away and returns, may see brief loading state while GQL catches up.

#### 2. Polling for Critical Flows (Use sparingly)

If you absolutely need to wait for GQL indexing (e.g., engagement list must show immediately after create):

```typescript
async ensureIndexed(className: string, id: string, maxWaitMs = 5000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const obj = await this.gql.getById(className, id, ['id']);
    if (obj) return true;
    await new Promise(r => setTimeout(r, 100));
  }
  return false;
}
```

**Use case:** After create, call this before triggering a GQL list query.

**Downside:** Blocking wait, adds latency, may timeout and fail.

**Recommendation:** Don't build this upfront. If we encounter actual UX issues (user can't see their engagement immediately), add it then.

## Build Order & Dependencies

```
1. PipelineWriteService ✓ (already built)
   └─ No dependencies

2. GraphqlReadService ✓ (already built)
   └─ Depends on: GQL pod has indexed schema classes

3. Wave 1 Migration: WorkRequestsService + BidsService
   ├─ Field mapping constants
   ├─ Swap WorkRequestsService internals
   ├─ Swap BidsService internals
   ├─ Unit tests + roundtrip tests
   └─ Demo data seeding script update

4. Wave 2 Migration: NotesService + DocumentService
   ├─ Depends on: Wave 1 stable
   ├─ Field mapping constants
   ├─ Swap internals
   └─ Tests

5. Wave 3 Migration: CatalogService + ReviewsService
   ├─ Depends on: Wave 1 stable
   ├─ Independent of each other (no cross-links)

6. Wave 4: Project Bloom services (new)
   ├─ Depends on: Schema PR #8 merged + GQL pod restarted
   ├─ No migration needed
   ├─ Build directly against Pipeline+GQL
   └─ Part of Plan 057

7. Cleanup
   ├─ Depends on: All 4 waves stable for 2-4 weeks
   ├─ Archive Neon tables (backup, don't delete)
   ├─ Remove SmeMartDbService from migrated services
   ├─ Update documentation
```

## Handling Mixed Environments

During Wave 1-3 migration, some services use Pipeline+GQL, others use SmeMartDbService.

### For components that query both paths:

```typescript
// Example: EngagementListComponent

async loadEngagements() {
  // If service is already migrated (uses GQL):
  const result = await this.workRequests.listEngagements(options);

  // If service is NOT yet migrated (uses SmeMartDbService):
  // Same API — component doesn't know the difference
}
```

**Principle:** Domain services maintain identical public API. Components are unaffected by migration.

### For tests:

```typescript
// OLD: Mock SmeMartDbService
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      { provide: SmeMartDbService, useValue: mockDb },
    ]
  });
});

// NEW: Mock PipelineWriteService + GraphqlReadService
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      { provide: PipelineWriteService, useValue: mockPipeline },
      { provide: GraphqlReadService, useValue: mockGql },
    ]
  });
});
```

Update tests during Wave 1. Older services can keep SmeMartDbService mocks until Wave 3 complete.

## Pitfalls & Mitigations

### Pitfall 1: Field Name Mismatches (Neon snake_case ↔ GQL camelCase)

**What goes wrong:**
- Service pushes `{ request_id: '123' }` to pipeline
- Pipeline upsert succeeds (external ID mapping)
- But GQL query returns empty — field name mismatch causes filter failure

**Prevention:**
- Create field mapping constants at service level
- Test roundtrip: push → query → verify fields match
- Use TypeScript types to enforce correct shape

**Detection:**
- Unit tests with mock pipeline + GQL
- Test data queries return expected structure

### Pitfall 2: Forgetting Optimistic Updates

**What goes wrong:**
- Component submits bid, waits for GQL query to succeed
- Pipeline is slow (5-10s indexing delay)
- Component shows loading spinner, user thinks app is broken

**Prevention:**
- Design components to use data from create response
- Return immediately from domain service
- Use signals to manage loading state

**Detection:**
- E2E tests — if you see unnecessary loading spinners, optimistic update is missing

### Pitfall 3: Stale View Aggregations

**What goes wrong:**
- Neon view `v_engagement_detail` JOINs all related data
- GQL query `Engagement(id: X)` is nested
- If nesting is incomplete, component shows partial data

**Prevention:**
- Define nested GQL queries explicitly
- Document which relationships must be traversed
- Test detail pages against both Neon (during migration) and GQL

**Detection:**
- Compare Neon view output vs GQL query output
- Check for missing fields or nested objects

### Pitfall 4: Pipeline Batch Size Limits

**What goes wrong:**
- Domain service tries to push 10,000 entities at once
- Pipeline batch API has size limits
- Call fails silently or truncates

**Prevention:**
- Limit `pushEntities()` batch size (e.g., max 1,000 per call)
- Document in service javadoc

**Detection:**
- Demo data seeding: if all entities don't appear in GQL query, likely batch truncation
- Check pipeline logs for errors

### Pitfall 5: GQL Types Not Available Yet

**What goes wrong:**
- Service calls `gql.query('SmeMartProject', ...)` (Wave 4 entity)
- Schema PR #8 hasn't merged yet
- GQL pod doesn't know about SmeMartProject
- Query throws "unknown type" error

**Prevention:**
- Build Wave 4 services AFTER schema PR #8 merges
- Check GQL pod pod logs to confirm schema reload
- Test GQL queries in isolation before integrating with services

**Detection:**
- GraphQL error: "Unknown type: SmeMartProject"
- Verify schema classes are in GQL introspection query

### Pitfall 6: Differential Pipeline Delete Semantics

**What goes wrong:**
- Delete an entity via pipeline
- Component refreshes list → deleted entity still appears
- Pipeline marks as deleted, but GQL doesn't filter it out

**Prevention:**
- Verify GQL queries filter out deleted objects automatically
- If they don't, use explicit filters in queries

**Detection:**
- After deletion, refresh list → deleted item should vanish

## Suggested Testing Strategy

### Unit Tests

**For each migrated service:**
```typescript
describe('WorkRequestsService (Pipeline+GQL)', () => {

  it('creates engagement via pipeline', async () => {
    const mockPipeline = jasmine.createSpyObj('PipelineWriteService', ['pushEntity']);
    const service = new WorkRequestsService(mockPipeline, mockGql, mockNotifications);

    await service.createRfp({
      buyer_zerobias_user_id: '123',
      title: 'Test RFP'
    });

    expect(mockPipeline.pushEntity).toHaveBeenCalledWith(
      'Engagement',
      jasmine.objectContaining({
        buyerZerobiasUserId: '123',
        title: 'Test RFP'
      })
    );
  });

  it('lists engagements via GQL', async () => {
    const mockGql = jasmine.createSpyObj('GraphqlReadService', ['query']);
    mockGql.query.and.returnValue(Promise.resolve({
      items: [{ id: '1', name: 'E1' }],
      page: { pageNumber: 1, pageSize: 50, totalCount: 1 }
    }));

    const service = new WorkRequestsService(mockPipeline, mockGql, mockNotifications);
    const result = await service.listEngagements();

    expect(mockGql.query).toHaveBeenCalledWith(
      'Engagement',
      jasmine.any(Array),
      jasmine.any(Object)
    );
    expect(result.items).toEqual([{ id: '1', name: 'E1' }]);
  });
});
```

### Integration Tests

**Push to pipeline, query via GQL (against actual services):**
```typescript
it('roundtrip: create engagement, query by id', async () => {
  const data = { id: 'test-e1', name: 'Roundtrip Test', ... };

  // Push
  await pipeline.pushEntity('Engagement', data);

  // Wait for indexing (with polling)
  await ensureIndexed('Engagement', 'test-e1', 5000);

  // Query
  const result = await gql.getById('Engagement', 'test-e1', ['id', 'name']);
  expect(result).toBeTruthy();
  expect(result.name).toBe('Roundtrip Test');
});
```

### Demo Data Seeding

**Current (Neon):**
```typescript
const engagements = [
  { request_id: 'demo-1', title: 'SOC 2 Audit', ... },
  { request_id: 'demo-2', title: 'ISO 27001 Prep', ... }
];
await this.db.createRow('work_requests', engagements[0]);
await this.db.createRow('work_requests', engagements[1]);
```

**After (Pipeline):**
```typescript
const engagements = [
  { id: 'demo-1', title: 'SOC 2 Audit', ... },
  { id: 'demo-2', title: 'ISO 27001 Prep', ... }
];
await this.pipeline.pushEntities('Engagement', engagements);
```

## Sources & References

- **Migration Plan:** `.claude/plans/local/059-auditgraph-migration.md`
- **Project Overview:** `.planning/PROJECT.md`
- **Pipeline Service Implementation:** `src/app/core/services/pipeline-write.service.ts`
- **GraphQL Service Implementation:** `src/app/core/services/graphql-read.service.ts`
- **Current Neon Service:** `src/app/core/services/sme-mart-db.service.ts`
- **ZeroBias SDK docs:** `@zerobias-com/zerobias-client` (client API reference)
- **GQL schema repo:** `zerobias-org/schema` — YAML class definitions

---

**Last updated:** 2026-03-18 after Phase 6 research initialization
