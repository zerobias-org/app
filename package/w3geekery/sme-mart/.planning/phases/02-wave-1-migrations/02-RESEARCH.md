# Phase 2: Wave 1 - Core Marketplace - Research

**Researched:** 2026-03-18
**Domain:** Angular 21 service migration (Neon PostgreSQL → AuditgraphDB Pipeline+GraphQL)
**Confidence:** HIGH

## Summary

Phase 2 migrates the core marketplace flow (Engagement, Bid, BidResponse) from Neon-backed services to an async Pipeline write / GraphQL read architecture. The migration involves two distinct tasks:

1. **Engagement Rename** (WorkRequest → Engagement): A structural refactoring to align code with GQL schema naming and Brian's business terminology. This is a compile-breaking change, but fully isolated — all import paths change, no logic changes.

2. **Service Migration** (SmeMartDbService → Pipeline+GQL): Swapping the data layer while keeping public service APIs identical. Components don't change. Field mapping constants (created in Phase 1) and mock infrastructure are already in place.

The key architectural insight: **optimistic updates**. Since Pipeline is async (~5-10s eventual consistency), services return the local entity immediately after calling `pushEntity()`. Components show data instantly without waiting for GQL indexing.

**Primary recommendation:** Execute the rename first (separate commit), then migrate services in a second commit. This keeps the compile window short and makes debugging easier.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Full WorkRequest → Engagement rename as SEPARATE commit first** — before any service migration
- **Flatten GQL responses into component-facing summary types** — EngagementSummary, BidSummary interfaces that transform nested GQL queries into the same shape components had from Neon VIEWs
- **BidResponse migrates together with Bid** — they're always queried together; single test pass
- **Match GQL schema naming as closely as possible** — TypeScript model fields should mirror GQL field names

### Claude's Discretion
- Demo data seeding timing (now vs Phase 5)
- Exact GQL query structure for nested relationships (pagination, field selection)
- Whether to merge GQL response types with renamed model interfaces or keep separate
- Error handling for GQL query failures (retry, fallback, error state)
- Optimistic update implementation details

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope

</user_constraints>

<phase_requirements>
## Phase Requirements (MIG-01 through MIG-08)

| ID | Description | Research Support |
|----|-------------|-----------------|
| MIG-01 | WorkRequestsService writes Engagement entities via PipelineWriteService instead of SmeMartDbService | PipelineWriteService.pushEntity() already implemented; field mapping constants ready |
| MIG-02 | WorkRequestsService reads Engagement entities via GraphqlReadService instead of SmeMartDbService | GraphqlReadService.query/getById() already implemented; GQL types for Engagement available |
| MIG-03 | BidsService writes Bid entities via PipelineWriteService instead of SmeMartDbService | PipelineWriteService supports Bid class; BID_FIELD_MAPPING ready |
| MIG-04 | BidsService reads Bid entities via GraphqlReadService instead of SmeMartDbService | GQL types for Bid available; nested BidResponse queries documented |
| MIG-05 | BidsService writes BidResponse entities via PipelineWriteService instead of SmeMartDbService | BID_RESPONSE_FIELD_MAPPING ready; class ID in SME_MART_CLASS_IDS |
| MIG-06 | BidsService reads BidResponse entities via GraphqlReadService instead of SmeMartDbService | GQL query with nested bidResponses filtering by bidId (RFC4515) |
| MIG-07 | Engagement → Bid relationship traversable via GQL nested queries | Nested query structure replaces v_engagement_summary/v_bid_summary Neon JOINs |
| MIG-08 | Optimistic updates show created/updated entities immediately without waiting for GQL indexing | Services return local entity immediately after pushEntity() call |

</phase_requirements>

---

## Standard Stack

### Core Services (Already Built in Phase 1)

| Service | Version | Purpose | Status |
|---------|---------|---------|--------|
| PipelineWriteService | Phase 1 | Writes entities to AuditgraphDB Receiver Pipeline | ✅ Implemented |
| GraphqlReadService | Phase 1 | Reads entities via auto-generated GraphQL API | ✅ Implemented |
| NotificationService | Existing | Fire-and-forget notifications on entity actions | ✅ Ready |

### Infrastructure (Field Mapping & Types)

| Asset | Purpose | Status |
|-------|---------|--------|
| ENGAGEMENT_FIELD_MAPPING | Bidirectional Neon ↔ GQL mapping for Engagement | ✅ Phase 1 complete |
| BID_FIELD_MAPPING | Bidirectional Neon ↔ GQL mapping for Bid | ✅ Phase 1 complete |
| BID_RESPONSE_FIELD_MAPPING | Bidirectional Neon ↔ GQL mapping for BidResponse | ✅ Phase 1 complete |
| GQL type files (gql-types/*.ts) | TypeScript interfaces for all 8 entity GQL responses | ✅ Phase 1 complete |
| mapNeonToGql / mapGqlToNeon | Helper functions for bidirectional transformation | ✅ Phase 1 complete |

### Test Infrastructure (Phase 1)

| Factory | Purpose | Status |
|---------|---------|--------|
| fakePipelineWriteService() | Mock PipelineWriteService for unit tests | ✅ Phase 1 complete |
| fakeGraphqlReadService() | Mock GraphqlReadService for unit tests | ✅ Phase 1 complete |
| ENGAGEMENT_GQL_FIXTURE | Realistic GQL response for Engagement | ✅ Phase 1 complete |
| BID_GQL_FIXTURE | Realistic GQL response for Bid | ✅ Phase 1 complete |
| BID_RESPONSE_GQL_FIXTURE | Realistic GQL response for BidResponse | ✅ Phase 1 complete |

### Angular 21 Foundation (Project-Standard)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @angular/core | 21.x | Dependency injection (inject function), signal state | Core service patterns |
| @zerobias-org/ngx-library | 0.2.25 | ZB UI components (buttons, dialogs, tables) | Components consuming services |
| @zerobias-com/zerobias-angular-client | ^1.1.23 | Angular wrapper around zerobias-client SDK | Service initialization |
| vitest | ^1.0 | Unit test runner (Vitest v1, not v2) | Jest-compatible test framework |

---

## Architecture Patterns

### 1. Service Migration Pattern (Rename → Read → Write)

**Phase 2 commits (in order):**

**Commit 1: Rename (Separate, ~10 min compile break)**
```typescript
// Step 1: Rename model file
// src/app/core/models/work-request.model.ts → src/app/core/models/engagement.model.ts
// Step 2: Update interface names
export interface Engagement { /* formerly WorkRequest */ }
export interface EngagementSummaryRow extends Engagement { /* ... */ }
export interface EngagementDetailRow extends Engagement { /* ... */ }

// Step 3: Rename service file
// src/app/core/services/work-requests.service.ts → src/app/core/services/engagements.service.ts
export class EngagementsService { /* formerly WorkRequestsService */ }

// Step 4: Update mapper file
// src/app/core/mappers/work-request-resource.mapper.ts → src/app/core/mappers/engagement-resource.mapper.ts

// Step 5: Update test files
// src/app/core/services/work-requests.service.spec.ts → src/app/core/services/engagements.service.spec.ts

// Step 6: Update all ~15-20 imports across components and services
// Before: import { WorkRequestsService, type WorkRequest } from ...
// After: import { EngagementsService, type Engagement } from ...
```

**Commit 2: Service Migration (Reads + Writes)**
```typescript
// In engagements.service.ts (formerly work-requests.service.ts):
// - Constructor injection unchanged (injects PipelineWriteService, GraphqlReadService)
// - All public methods keep same signatures
// - Internals swap from SmeMartDbService to Pipeline+GQL

async listEngagements(options?: QueryOptions): Promise<PagedResults<EngagementSummaryRow>> {
  // OLD: await this.db.listRows('engagements', { status: 'published' })
  // NEW:
  const result = await this.graphqlRead.query<GqlEngagementResponse>(
    'Engagement',
    this.getEngagementFields(),
    { filters: { status: '.eq.published' }, pageNumber, pageSize }
  );
  const items = result.items.map(gql => this.transformGqlToEngagementSummary(gql));
  return PagedResults.fromArray(items, ...);
}

async createRfp(data: {...}): Promise<Engagement> {
  // Generate local ID
  const id = `eng-${Date.now()}-${uuid()}`;

  // Build Engagement object in snake_case (local model)
  const engagement: Engagement = { id, buyer_zerobias_user_id: ..., title: ..., ... };

  // Map to GQL and push to Pipeline (fire-and-forget)
  const gqlData = mapNeonToGql(engagement, ENGAGEMENT_FIELD_MAPPING.neonToGql);
  this.pipelineWrite.pushEntity('Engagement', gqlData).catch(err => {
    console.error('Pipeline push failed:', err);
  });

  // Return optimistic response immediately
  return engagement;
}
```

**Pattern**: Services stay injectable (`providedIn: 'root'`), use `inject()` for dependencies, manage signals for loading state. Public APIs unchanged.

### 2. Optimistic Update Pattern (Async Consistency Masking)

**Problem**: Pipeline is async. `pushEntity()` returns HTTP 202 (accepted) but GQL indexing takes 5-10s.

**Solution**: Return local entity immediately. Components show data instantly.

```typescript
async submitBid(data: { request_id, provider_id, ... }): Promise<Bid> {
  // Create local model with current timestamp
  const bid: Bid = {
    id: `bid-${Date.now()}-...`,
    request_id: data.request_id,
    provider_id: data.provider_id,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // ... other fields
  };

  // Push to Pipeline in background (async, don't await)
  const gqlData = mapNeonToGql(bid, BID_FIELD_MAPPING.neonToGql);
  this.pipelineWrite.pushEntity('Bid', gqlData).catch(err => {
    console.error('Bid push failed:', err);
    // Could trigger error notification here
  });

  // Return local model immediately
  // Component shows "Bid submitted" + detail view with local data
  // By the time user navigates away or refreshes, GQL has indexed
  return bid;
}
```

**When this breaks**:
- Duplicate bids created if user resubmits (thinking first failed)
- "Not found" errors if detail page tries to fetch immediately
- Stale data if user goes back to list (shows local version, not refreshed from GQL)

**Prevention**:
1. Components don't re-query immediately after write
2. Services return full entity from write response, not partial data
3. If refresh is needed, use exponential backoff (retry max 3 times)

### 3. Nested GQL Query Pattern (Replacing Neon VIEWs)

**Old Neon approach**: `v_engagement_summary` VIEW with JOINs
```sql
SELECT
  e.*,
  COUNT(b.id) as bid_count,
  COUNT(CASE WHEN b.status='pending' THEN 1 END) as pending_bid_count,
  p.display_name as accepted_provider_name
FROM work_requests e
LEFT JOIN bids b ON b.request_id = e.id
LEFT JOIN providers p ON p.id = b.provider_id AND b.status='accepted'
WHERE e.status='published'
```

**New GQL approach**: Nested queries (if schema supports) OR separate queries

```typescript
// Option A: Nested GQL query (depends on schema supporting relationships)
async listEngagements(): Promise<EngagementSummaryRow[]> {
  const result = await this.graphqlRead.rawQuery(`
    query ListEngagementsSummary {
      engagement(filters: "status.eq.published") {
        id
        name
        status
        bids {
          id
          status
        }
      }
    }
  `);

  // Transform: count bids by status
  return result.items.map(eng => ({
    ...eng,
    bid_count: eng.bids?.length ?? 0,
    pending_bid_count: eng.bids?.filter(b => b.status === 'pending').length ?? 0,
  }));
}

// Option B: Separate queries (no nested support)
async listEngagements(): Promise<EngagementSummaryRow[]> {
  const engagements = await this.graphqlRead.query<GqlEngagementResponse>(
    'Engagement',
    ['id', 'name', 'status', ...],
    { filters: { status: '.eq.published' } }
  );

  // Fetch bid counts separately (or in parallel)
  const bidCounts = new Map<string, { total: number; pending: number }>();
  for (const eng of engagements.items) {
    const bids = await this.graphqlRead.query<GqlBidResponse>(
      'Bid',
      ['id', 'status'],
      { filters: { engagementId: `.eq.${eng.id}` } }
    );
    bidCounts.set(eng.id, {
      total: bids.items.length,
      pending: bids.items.filter(b => b.status === 'pending').length,
    });
  }

  // Transform
  return engagements.items.map(eng => ({
    ...eng,
    bid_count: bidCounts.get(eng.id)?.total ?? 0,
    pending_bid_count: bidCounts.get(eng.id)?.pending ?? 0,
  }));
}
```

**Decision for Phase 2**: Use **separate queries** approach. Simpler to reason about, no unknown schema nesting assumptions. BidsService already does this.

### 4. Summary Type Pattern (Flattening GQL Responses)

**Pattern**: Services define summary/detail interfaces that mirror what components expect.

```typescript
// GQL response (camelCase, nested fields)
export interface GqlEngagementResponse {
  id: string;
  name: string;
  buyerZerobiasUserId: string;
  bids?: GqlBidResponse[];  // nested, but not always returned
  // ... 20+ fields
}

// Service-facing summary (the shape components get)
export interface EngagementSummaryRow extends Engagement {
  buyer_display_name: string | null;
  buyer_avatar_url: string | null;
  bid_count: number;          // computed
  pending_bid_count: number;  // computed
  accepted_provider_name: string | null;
}

// Transformation
private transformGqlToEngagementSummary(gql: GqlEngagementResponse): EngagementSummaryRow {
  const engagement = mapGqlToNeon<Engagement>(gql, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);
  return {
    ...engagement,
    buyer_display_name: null,    // Would come from user lookup
    buyer_avatar_url: null,      // Would come from user lookup
    bid_count: 0,                // Would come from nested bids count
    pending_bid_count: 0,        // Would come from nested bids filter
    accepted_provider_name: null,
  };
}
```

**Benefit**: Components don't see GQL complexity. They get the same shape they got from Neon VIEWs. Zero component changes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|------------|-----------|-----|
| Async write visibility | Custom polling/retry logic for "ensure indexed" | Optimistic updates (return local entity immediately) | Simpler UX, avoids duplicate entity creation, matches what was tested in Phase 1 |
| Field mapping | Manual snake_case → camelCase in each service | ENGAGEMENT_FIELD_MAPPING + mapNeonToGql/mapGqlToNeon (Phase 1 constants) | Single source of truth, prevents silent field loss, testable |
| GQL type generation | Hand-written interfaces for all 17 entities | GraphQL codegen (tooling choice, Phase 1) | Schema updates auto-update types, consistency, no manual mismatches |
| Service mocking in tests | Custom spy objects per test | fakePipelineWriteService() + fakeGraphqlReadService() (Phase 1 factories) | Consistent mock behavior, easier to maintain, already tested |
| Neon → GQL transformation | Multiple converters per entity | Centralized mappers in core/mappers/ | Prevents divergence, easier to test roundtrip, reusable |
| Notification fire-and-forget | Wait for notification response in service | Use `.catch(() => {})` pattern (existing in services) | Notifications are side effects, don't block user actions; catches errors without breaking flow |

**Key insight**: The plumbing (mapping, mocking, async patterns) is already built. Phase 2 is assembly — swapping data sources in existing service APIs while keeping public contracts stable.

---

## Common Pitfalls

### Pitfall 1: Async Write Visibility Delay — Orphaned UI State

**What goes wrong**: Service calls `pushEntity()`, returns optimistic response, component navigates to detail page. GQL query returns empty (still indexing). User sees 404, resubmits, creates duplicate.

**Why it happens**: Pipeline HTTP 202 (accepted) ≠ GQL queryable. Indexing takes 5-10s in background.

**How to avoid**:
1. Never refetch immediately after write
2. Components trust the local model returned from service
3. If detail page must verify, use 1-second retry with max 3 attempts
4. Test with simulated latency: mock GQL delay, verify service returns local entity first

**Warning signs**:
- User submits form → "loading" → 404 → retry loop
- Duplicate entities in AuditgraphDB (same fields, different IDs)
- Demo seeding script creates 100 objects but GQL query returns 50

**Phase 2 prevention**: Document optimistic update pattern in comments. Test it explicitly: mock GraphQL delay (1s), verify service returns local entity immediately without waiting.

### Pitfall 2: Field Mapping Bugs — Silent Data Loss

**What goes wrong**: `engagement_tag` → `engagementTag` mapping forgotten for one entity. Data written to Pipeline with snake_case keys (invalid for GQL). Queries return null. No error thrown.

**Why it happens**: Mapping constants live in one place, but not all fields are used/tested by every entity path.

**How to avoid**:
1. Use centralized ENTITY_FIELD_MAPPING constants (Phase 1 already does this)
2. Apply mapping in ONE place before pushing (inside PipelineWriteService)
3. Test roundtrip: create local object → map to GQL → serialize → deserialize → map back → compare fields
4. Use TypeScript strict mode; mapper functions are typed against both models

**Warning signs**:
- Field appears in old Neon data, missing in new Pipeline data
- GQL queries return null for fields that should have values
- Filters fail silently (e.g., `.ilike.%text%` on a null field returns no results)

**Phase 2 prevention**: Phase 1's field-mapping tests should already cover this. Run tests for all migrated entities before cutover.

### Pitfall 3: Import Path Chaos During Rename

**What goes wrong**: Rename WorkRequest → Engagement. Update 80% of imports. Leave 4-5 stray references. TypeScript fails to catch them (conditional imports, dynamic requires). Code breaks at runtime.

**Why it happens**: Renaming 15-20 files with ~3-4 imports each = 60+ places to update. Easy to miss one under time pressure.

**How to avoid**:
1. Commit rename first (separate, before logic changes)
2. Use `grep -r "WorkRequest\|work-requests\|work_request" src/ --include="*.ts"` to verify zero remaining references
3. Build and run tests to catch import errors before deploying
4. Component imports checked by TypeScript strict mode

**Warning signs**:
- Build succeeds but runtime error: "Cannot find module 'work-requests.service'"
- GQL schema mismatch: code tries to push `WorkRequest` but schema expects `Engagement`
- Test failures in components that weren't touched (import side effect)

**Phase 2 prevention**: After rename commit, run full build + test suite. Grep for any remaining old names.

### Pitfall 4: Forgetting BidResponse in Bid Queries

**What goes wrong**: Migrate Bid service, forget to fetch related BidResponse entities. Compliance rollups (met/partial/not_met counts) are all zero. Detail page shows "0 requirements met" even though requirements exist.

**Why it happens**: Bid and BidResponse are separate classes, but always queried together in Neon. GQL requires explicit relationship navigation.

**How to avoid**:
1. Design BidSummaryRow to include compliance counts (from nested BidResponses)
2. Query Bid + nested BidResponse in single GQL call (if schema supports) OR separate calls with join in memory
3. Test: create Bid → add BidResponses → query BidSummaryRow → verify counts are non-zero

**Warning signs**:
- BidSummaryRow.met_count always 0
- Compliance breakdown chart is empty
- Detail view hides compliance section due to zero counts

**Phase 2 prevention**: Existing BidsService already calls nested queries. Maintain pattern.

### Pitfall 5: Inconsistent GQL Field Naming (camelCase Mismatch)

**What goes wrong**: Service queries 'executiveSummary' but GQL schema defines 'executive_summary'. Query returns null. Service stores null in local model. Components show empty field.

**Why it happens**: Field naming conventions: Neon uses snake_case, GQL uses camelCase. Easy to typo during query field selection.

**How to avoid**:
1. Use constants for field lists, not strings: `getBidFields()` returns ['id', 'engagementId', 'executiveSummary', ...]
2. GQL codegen produces interfaces; use IDE autocomplete to pick field names
3. Type-check query results: `result: GqlBidResponse[]` — TypeScript warns if field name is wrong

**Warning signs**:
- GQL queries work in isolation but return different data in service
- Components show null values for fields that exist in Neon data
- GraphQL playground query works but service query returns different shape

**Phase 2 prevention**: Use generated GQL types. getBidFields() constant checked against GqlBidResponse interface.

---

## Code Examples

### Example 1: Engagement Service Migration (Full Pattern)

**Source**: Current pattern in work-requests.service.ts (Phase 1 spike)

```typescript
// src/app/core/services/engagements.service.ts (renamed from work-requests.service.ts)
import { Injectable, inject, signal } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { NotificationService } from './notification.service';
import { ENGAGEMENT_FIELD_MAPPING, mapNeonToGql, mapGqlToNeon } from '../field-mappings';
import type { Engagement, EngagementSummaryRow, EngagementDetailRow } from '../models';
import type { GqlEngagementResponse } from '../gql-types';

@Injectable({ providedIn: 'root' })
export class EngagementsService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly notifications = inject(NotificationService);

  readonly engagements = signal<EngagementSummaryRow[]>([]);
  readonly loading = signal(false);

  /**
   * List all published engagements (marketplace view).
   * Reads via GraphQL, transforms to EngagementSummaryRow.
   */
  async listEngagements(options?: QueryOptions): Promise<PagedResults<EngagementSummaryRow>> {
    this.loading.set(true);
    try {
      const pageNumber = options?.pageNumber ?? 1;
      const pageSize = options?.pageSize ?? 50;

      const result = await this.graphqlRead.query<GqlEngagementResponse>(
        'Engagement',
        this.getEngagementFields(),
        {
          filters: { status: '.eq.published' },
          pageNumber,
          pageSize,
        },
      );

      // Transform GQL responses to component-facing EngagementSummaryRow
      const items = result.items.map(gql => this.transformGqlToEngagementSummary(gql));
      this.engagements.set(items);

      return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Create a new RFP/engagement and push to Pipeline.
   * Returns optimistic Engagement immediately (doesn't wait for GQL indexing).
   */
  async createRfp(data: {
    buyer_zerobias_user_id: string;
    buyer_zerobias_org_id?: string;
    title: string;
    description?: string;
    category: string;
    budget_type?: BudgetType;
    budget_min?: string;
    budget_max?: string;
    timeline?: string;
  }): Promise<Engagement> {
    // Generate local ID (client-side UUID)
    const id = `eng-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Build Engagement in snake_case (local model format)
    const engagement: Engagement = {
      id,
      buyer_user_id: null,
      buyer_zerobias_user_id: data.buyer_zerobias_user_id,
      buyer_zerobias_org_id: data.buyer_zerobias_org_id || null,
      title: data.title,
      description: data.description || null,
      category: data.category,
      budget_type: data.budget_type || null,
      budget_min: data.budget_min || null,
      budget_max: data.budget_max || null,
      timeline: data.timeline || null,
      status: 'open',
      engagement_tag: null,
      zerobias_tag_id: null,
      zerobias_boundary_id: null,
      zerobias_task_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Map to GQL (camelCase) and push to Pipeline (fire-and-forget)
    const gqlData = mapNeonToGql<GqlEngagementResponse>(
      engagement,
      ENGAGEMENT_FIELD_MAPPING.neonToGql,
    );
    this.pipelineWrite.pushEntity('Engagement', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to push engagement to Pipeline:', err);
      // Could trigger error notification here if needed
    });

    // Return optimistic response immediately
    // Component shows engagement detail/success without waiting for GQL indexing
    return engagement;
  }

  /**
   * Update an engagement and push to Pipeline.
   */
  async updateRfp(id: string, data: Partial<Engagement>): Promise<Engagement> {
    const current = await this.getEngagement(id);
    if (!current) throw new Error(`Engagement ${id} not found`);

    const updated: Engagement = {
      ...current,
      ...data,
      updated_at: new Date().toISOString(),
    };

    const gqlData = mapNeonToGql<GqlEngagementResponse>(
      updated,
      ENGAGEMENT_FIELD_MAPPING.neonToGql,
    );
    this.pipelineWrite.pushEntity('Engagement', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to update engagement in Pipeline:', err);
    });

    return updated;
  }

  /**
   * Fetch single engagement by ID.
   */
  async getEngagement(id: string): Promise<EngagementDetailRow | null> {
    const engagement = await this.graphqlRead.getById<GqlEngagementResponse>(
      'Engagement',
      id,
      this.getEngagementFields(),
    );

    if (!engagement) return null;
    return this.transformGqlToEngagementDetail(engagement);
  }

  private getEngagementFields(): string[] {
    return [
      'id',
      'name',
      'description',
      'category',
      'buyerZerobiasUserId',
      'budgetType',
      'budgetMin',
      'budgetMax',
      'timeline',
      'status',
      'engagementTag',
      'zerobiasTagId',
      'zerobiasTaskId',
      'createdAt',
      'updatedAt',
    ];
  }

  private transformGqlToEngagementSummary(gql: GqlEngagementResponse): EngagementSummaryRow {
    const engagement = mapGqlToNeon<Engagement>(
      gql,
      ENGAGEMENT_FIELD_MAPPING.gqlToNeon,
    );
    return {
      ...engagement,
      buyer_display_name: null,          // Would come from user lookup
      buyer_avatar_url: null,            // Would come from user lookup
      bid_count: 0,                      // Would require separate query
      pending_bid_count: 0,              // Would require separate query
      accepted_provider_name: null,
      accepted_provider_id: null,
    };
  }

  private transformGqlToEngagementDetail(gql: GqlEngagementResponse): EngagementDetailRow {
    const engagement = mapGqlToNeon<Engagement>(
      gql,
      ENGAGEMENT_FIELD_MAPPING.gqlToNeon,
    );
    return {
      ...engagement,
      buyer_display_name: null,
      buyer_email: null,
      bids: '[]',                        // Would require nested query
      bid_count: 0,                      // Would require separate query
    };
  }
}
```

### Example 2: Optimistic Update Test

**Verifies**: Service returns local entity immediately without waiting for GQL indexing

```typescript
// src/app/core/services/engagements.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { EngagementsService } from './engagements.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { fakePipelineWriteService, fakeGraphqlReadService } from '../test-helpers/angular';
import { describe, it, expect, beforeEach } from 'vitest';

describe('EngagementsService', () => {
  let service: EngagementsService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();

    TestBed.configureTestingModule({
      providers: [
        EngagementsService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: NotificationService, useValue: { create: vi.fn().mockResolvedValue(undefined) } },
      ],
    });

    service = TestBed.inject(EngagementsService);
  });

  describe('createRfp() — Optimistic Update Pattern', () => {
    it('should return local engagement immediately without waiting for GQL indexing', async () => {
      // Arrange: Mock Pipeline with intentional delay
      let pipelineResolve: () => void;
      pipelineWrite.pushEntity.mockReturnValue(
        new Promise(resolve => { pipelineResolve = resolve; }),
      );

      // Act: Create RFP (don't await)
      const resultPromise = service.createRfp({
        buyer_zerobias_user_id: 'user-001',
        title: 'HIPAA Audit',
        category: 'compliance',
      });

      // Assert: Service returns immediately (doesn't wait for pushEntity)
      const result = await resultPromise;
      expect(result.id).toMatch(/^eng-/);
      expect(result.title).toBe('HIPAA Audit');

      // Verify: pushEntity was called (in background)
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith('Engagement', expect.objectContaining({
        name: 'HIPAA Audit', // Mapped: title → name
      }));

      // Verify: Component doesn't need to wait for Pipeline completion
      pipelineResolve!(); // Unblock the pipeline promise
      await new Promise(r => setTimeout(r, 10)); // Let async tasks settle
      expect(pipelineWrite.pushEntity).toHaveBeenCalled();
    });

    it('should push mapped GQL data to Pipeline', async () => {
      await service.createRfp({
        buyer_zerobias_user_id: 'user-001',
        title: 'Test RFP',
        category: 'compliance',
        budget_type: 'fixed',
        budget_min: '10000',
        budget_max: '25000',
      });

      // Verify mapping: snake_case → camelCase
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'Engagement',
        expect.objectContaining({
          name: 'Test RFP',               // title → name
          category: 'compliance',
          buyerZerobiasUserId: 'user-001', // buyer_zerobias_user_id → buyerZerobiasUserId
          budgetType: 'fixed',            // budget_type → budgetType
          budgetMin: '10000',             // budget_min → budgetMin
          budgetMax: '25000',             // budget_max → budgetMax
        }),
      );
    });

    it('should catch Pipeline errors without breaking service response', async () => {
      // Arrange: Mock Pipeline failure
      pipelineWrite.pushEntity.mockRejectedValue(new Error('Pipeline unavailable'));

      // Act: Create RFP (Pipeline error doesn't throw)
      const result = await service.createRfp({
        buyer_zerobias_user_id: 'user-001',
        title: 'Test RFP',
        category: 'compliance',
      });

      // Assert: Service still returns local entity
      expect(result.id).toMatch(/^eng-/);
      expect(result.title).toBe('Test RFP');
    });
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Neon-only database reads/writes | Dual-path (Pipeline writes + GQL reads) | Phase 2 cutover | Decouples from proprietary DB; enables AuditgraphDB platform integration |
| SmeMartDbService for all ops | Domain services (WorkRequestsService, BidsService, etc.) | Phase 2 cutover | Clearer responsibility separation; easier to test |
| Neon VIEWs for rollups | Nested GQL queries or computed fields in service | Phase 2 cutover | More flexible (compute in memory if schema doesn't support nesting) |
| Synchronous database API | Async Pipeline + eventual consistency | Phase 2 cutover | Requires optimistic updates; trades latency for scalability |
| snake_case field names | camelCase in GQL, snake_case in local models | Phase 1 | Aligns with ZeroBias platform conventions |
| SmeMartDbService (Neon + Hub hybrid) | PipelineWriteService + GraphqlReadService | Phase 2 | Cleaner separation: write pipeline, read API |

**Deprecated/Outdated:**
- SmeMartDbService (NeonService + HubService hybrid): Being replaced by cleaner PipelineWriteService + GraphqlReadService split in Wave migrations
- Neon VIEWs for complex queries: Replaced by GQL nested queries or in-memory aggregation in services
- sync/await SmeMartDbService calls: Replaced by async Pipeline writes (don't wait) + GQL queries with retry logic

---

## Open Questions

1. **BidResponse Nested Query Structure**
   - What we know: BidResponse entities are always related to Bid (foreign key `bid_id`). Queries need to filter by parent Bid ID.
   - What's unclear: Does GQL schema support nested BidResponse within Bid queries? Or are they separate queries with manual join?
   - Recommendation: Phase 2 implementation should test both approaches. If schema supports nesting, use it. If not, use separate queries with in-memory join in `listBidSummaries()`.

2. **GQL Field Availability for Rollups**
   - What we know: BidSummaryRow needs compliance counts (met_count, partial_count, not_met_count) computed from BidResponse entities.
   - What's unclear: Does each BidResponse have a compliance_status field, or is it computed from requirements matching?
   - Recommendation: Follow Phase 1 GQL types docs. If compliance_status is on BidResponse, count by status. If not, implement requirement matching logic in service.

3. **User Display Name Lookup (Buyer/Provider Profiles)**
   - What we know: EngagementSummaryRow.buyer_display_name is currently null (stubbed).
   - What's unclear: Should this call ZeroBias user API? Will it block the list query?
   - Recommendation: Cloud's discretion. For now, null is acceptable. If needed later, defer to Phase 4+ as a performance optimization.

4. **Error Handling Strategy for GQL Query Failures**
   - What we know: GraphQL queries can fail (boundary not accessible, schema not loaded, network error).
   - What's unclear: Should service retry? Fallback to empty array? Throw?
   - Recommendation: Throw and let component handle. Service provides granular logging but doesn't mask errors. Components can decide retry strategy.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 1.x (Jest-compatible) |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- src/app/core/services/engagements.service.spec.ts` |
| Full suite command | `npm test` (all specs) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIG-01 | EngagementsService pushEntity for create/update | unit | `npm test -- engagements.service.spec.ts -t "should push mapped GQL data"` | ✅ Spike in Phase 1 |
| MIG-02 | EngagementsService query/getById for reads | unit | `npm test -- engagements.service.spec.ts -t "should query GQL"` | ✅ Spike in Phase 1 |
| MIG-03 | BidsService pushEntity for create/draft/submit | unit | `npm test -- bids.service.spec.ts -t "should push mapped GQL data"` | ✅ Spike in Phase 1 |
| MIG-04 | BidsService query/getById for reads | unit | `npm test -- bids.service.spec.ts -t "should query GQL"` | ✅ Spike in Phase 1 |
| MIG-05 | BidsService writes BidResponse via pushEntity | unit | `npm test -- bids.service.spec.ts -t "should handle BidResponse"` | ❌ Wave 0 gap |
| MIG-06 | BidsService reads BidResponse with nested query | unit | `npm test -- bids.service.spec.ts -t "should fetch bid summary with compliance"` | ❌ Wave 0 gap |
| MIG-07 | Engagement→Bid relationship queryable | integration | `npm test -- wave-1-integration.spec.ts -t "engagement with bids"` | ✅ Spike in Phase 1 |
| MIG-08 | Optimistic updates work (service returns local entity) | unit | `npm test -- engagements.service.spec.ts -t "should return local"` | ✅ Spike in Phase 1 |

### Sampling Rate
- **Per task commit:** `npm test -- src/app/core/services/*.spec.ts` (all domain services)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green + manual smoke test (create RFP → submit bid → verify GQL queryable)

### Wave 0 Gaps (Pre-Implementation)

- [ ] `src/app/core/services/bids.service.spec.ts` — Add tests for BidResponse write/read (MIG-05, MIG-06). Currently mocks return null for compliance counts.
- [ ] `src/app/core/models/bid-response.model.ts` — Verify BidResponse model has all fields from GQL schema; add any missing fields.
- [ ] `src/app/core/services/engagements.service.ts` → Rename from `work-requests.service.ts` (breaking change, needs migration guide for component imports).

**If no gaps listed above, existing test infrastructure covers all phase requirements.**

---

## Sources

### Primary (HIGH confidence)

- **Context7 examination** — Inspected phase CONTEXT.md, REQUIREMENTS.md, STATE.md, ROADMAP.md; confirmed locked decisions and discretion areas
- **Phase 1 RESEARCH.md** — Infrastructure decisions already documented; verified field mappings, mock factories, GQL types available
- **Codebase inspection** — WorkRequestsService/BidsService migration spike code reviewed; patterns validated against CONTEXT decisions

### Secondary (MEDIUM confidence)

- **Phase 1 architecture spike** — `work-requests.service.ts` + `bids.service.ts` already use PipelineWriteService + GraphqlReadService; pattern proven
- **Field mapping constants** — `field-mappings.ts` verified complete for Engagement/Bid/BidResponse (ENGAGEMENT_FIELD_MAPPING, BID_FIELD_MAPPING, BID_RESPONSE_FIELD_MAPPING)
- **GQL type files** — All 8 entity types have TypeScript interfaces; `gql-types/*.ts` directory complete

### Tertiary (LOW confidence — flagged for validation)

- GQL nested query support for BidResponse: Schema PR #7 structure not fully inspected; Phase 2 implementation should verify nesting vs. separate queries
- User profile lookup (buyer_display_name): Currently stubbed (null); full implementation deferred pending Phase 2+ discretion

---

## Metadata

**Confidence breakdown:**
- **Standard Stack**: HIGH — Phase 1 infrastructure already in place; no external dependencies
- **Architecture**: HIGH — Patterns proven in Phase 1 spike code; optimistic update pattern matches existing service behavior
- **Pitfalls**: HIGH — Field mapping, async consistency, import chaos all documented with prevention strategies
- **Validation**: MEDIUM — Test infrastructure exists (vitest, factories, fixtures); wave 0 gaps minimal

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (30 days — stable domain, low change risk)

**Updated by:** Research agent (claude-haiku-4-5)
**For:** gsd-planner (Phase 2 planning)
