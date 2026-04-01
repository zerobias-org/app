# Phase 4: Wave 3 - Standalone Entities - Research

**Researched:** 2026-03-18
**Domain:** Angular 21 service migration (SmeMartDbService → Pipeline + GraphQL)
**Confidence:** HIGH

## Summary

Phase 4 migrates two standalone entities—**ServiceOffering** (catalog listings) and **Review** (provider ratings)—from Neon PostgreSQL to AuditgraphDB using the proven Phase 2-3 swap pattern. No complex relationships, no hierarchies, no new problems. Both field mappings and GQL types already exist from Phase 1. The pattern is battle-tested from Phase 2 (Engagement/Bid).

**Primary recommendation:** Execute as two straightforward service swaps using the exact Phase 2 pattern. ServiceOfferingsService and ReviewsService are ready for mechanical transformation: inject PipelineWriteService + GraphqlReadService, replace SmeMartDbService calls, apply field mappings, verify with unit tests.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **Follow Phase 2-3 swap pattern exactly** — Do not invent new approaches. The pattern proven in Phase 2 (Engagement/Bids) works. Apply it identically.
2. **ServiceOffering migration approach** — Swap SmeMartDbService inject with PipelineWriteService + GraphqlReadService. Catalog filters (category, pricingType) translate to GQL RFC4515 filters.
3. **Review entity scope** — Migrate what exists (ReviewsService already uses SmeMartDbService). If Review service doesn't exist in full form, ensure GQL types and field mappings are ready. **Do NOT build a full ReviewService from scratch if one doesn't exist** — that's future scope.
4. **Review → Task approval workflow is deferred** — The Review schema includes a `linkTo: Task` for approval workflow, but that's Phase 7 scope (per Plan 034). Don't implement that link now.

### Claude's Discretion

1. **ReviewService structure** — Whether to create a minimal ReviewService (if it doesn't fully exist) or just verify types/mappings are present
2. **Catalog filter implementation details** — How GQL query structure maps category/pricingType filters to RFC4515 format
3. **Test coverage scope for Review** — If ReviewService doesn't exist, just verify types compile. If it does, migrate with full test parity.

### Deferred Ideas (OUT OF SCOPE)

1. Review → Task approval workflow (Phase 7 scope per Plan 034)
2. Any new Review functionality beyond migration of existing code
3. Enhanced catalog filtering (category browsing, price ranges, etc.) — out of scope for migration

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MIG-16 | CatalogService writes ServiceOffering entities via PipelineWriteService instead of SmeMartDbService | ServiceOfferingsService exists, currently injects SmeMartDbService; swap to PipelineWriteService for all create/update operations |
| MIG-17 | CatalogService reads ServiceOffering entities via GraphqlReadService instead of SmeMartDbService | ServiceOfferingsService.listServices(), getServicesByProvider() replaced with GQL queries; GqlServiceOfferingResponse type exists with all fields mapped |
| MIG-18 | Review entity writes via PipelineWriteService (future ReviewsService) | ReviewsService exists; injects SmeMartDbService for create/approve/reject; swap to PipelineWriteService for all mutations |
| MIG-19 | Review entity reads via GraphqlReadService (future ReviewsService) | ReviewsService.listReviewsByProvider() and admin list operations replaced with GQL queries; GqlReviewResponse type exists with all fields mapped |

</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Angular | 21 | Framework (standalone components, signals, ChangeDetectionStrategy.OnPush) | Project constraint; all SME Mart services use Angular 21 |
| ZerobiasClientApi | ^1.1.23 | SDK accessor for Platform API, GraphQL, Pipeline | Wraps @zerobias-com/zerobias-client; provides graphqlClient, platformClient accessors |
| PipelineWriteService | Local (src/app/core/services/) | Write entities to AuditgraphDB via Receiver Pipeline | Built in Phase 1; uses platform.Pipeline.receive with SimpleBatch |
| GraphqlReadService | Local (src/app/core/services/) | Read entities from AuditgraphDB via GraphQL | Built in Phase 1; uses graphqlClient.getBoundaryApi().executeRawGraphqlQuery |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @zerobias-org/data-utils | Latest | QueryOptions type (pageNumber, pageSize, filters) | Type definitions for query parameters |
| @zerobias-org/types-core-js | Latest | PagedResults<T>, UUID | Common data structures; PagedResults for pagination |
| signals (Angular) | Built-in | Reactive state management | All SME Mart services use signal() for state (loading, error, items) |

### Field Mapping & Types (Existing — Phase 1)
| Asset | Purpose |
|-------|---------|
| SERVICE_OFFERING_FIELD_MAPPING | Maps Neon snake_case columns to GQL camelCase (providerId, isActive, etc.) |
| REVIEW_FIELD_MAPPING | Maps Neon snake_case columns to GQL camelCase (providerId, reviewerZerobiasUserId, engagementId, etc.) |
| GqlServiceOfferingResponse | GQL response type for ServiceOffering (id, title, description, providerId, category, pricingType, includes, etc.) |
| GqlReviewResponse | GQL response type for Review (id, providerId, reviewerZerobiasUserId, engagementId, rating, reviewText, approved, etc.) |
| mapNeonToGql(), mapGqlToNeon() | Bidirectional mapping helper functions (verified in Phase 1 roundtrip tests) |

### Test Infrastructure (Existing — Phase 1)
| Asset | Purpose |
|-------|---------|
| fakePipelineWriteService() | Mock PipelineWriteService.pushEntity(), pushEntities(), deleteEntity() |
| fakeGraphqlReadService() | Mock GraphqlReadService.query(), getById(), rawQuery() with typed responses |
| SERVICE_OFFERING_GQL_FIXTURE | Pre-built GQL response for ServiceOffering roundtrip tests |
| REVIEW_GQL_FIXTURE | Pre-built GQL response for Review roundtrip tests |

---

## Architecture Patterns

### Recommended Project Structure
```
src/app/core/services/
├── service-offerings.service.ts      ← MIGRATE: inject PipelineWriteService + GraphqlReadService
├── reviews.service.ts                ← MIGRATE: inject PipelineWriteService + GraphqlReadService
├── pipeline-write.service.ts         ← USE: shared write layer
├── graphql-read.service.ts           ← USE: shared read layer
└── sme-mart-db.service.ts            ← REMOVE from service-offerings and reviews (kept for Phase 5 cleanup)

src/app/core/models/
├── service-offering.model.ts         ← EXISTING: no changes
├── review.model.ts                   ← EXISTING: no changes

src/app/core/gql-types/
├── service-offering.types.ts         ← EXISTING: GqlServiceOfferingResponse interface
├── review.types.ts                   ← EXISTING: GqlReviewResponse interface

src/app/core/field-mappings.ts
├── SERVICE_OFFERING_FIELD_MAPPING    ← EXISTING: complete mapping
├── REVIEW_FIELD_MAPPING              ← EXISTING: complete mapping
└── mapNeonToGql(), mapGqlToNeon()    ← EXISTING: transformation helpers
```

### Pattern 1: Service Migration (Proven in Phase 2)

**What:** Swap SmeMartDbService injection for PipelineWriteService + GraphqlReadService. Calls to db.createRow() become pipelineWrite.pushEntity(). Calls to db.listRows() become graphqlRead.query().

**When to use:** Every domain service that currently reads/writes to Neon (ServiceOfferingsService, ReviewsService).

**Example (ServiceOfferingsService):**

```typescript
// BEFORE (Phase 1)
@Injectable({ providedIn: 'root' })
export class ServiceOfferingsService {
  private readonly db = inject(SmeMartDbService);

  async createService(
    providerId: string,
    data: Omit<ServiceOffering, 'id' | 'provider_id' | 'created_at'>,
  ): Promise<ServiceOffering> {
    return this.db.createRow<ServiceOffering>('service_offerings', {
      provider_id: providerId,
      ...data,
    });
  }
}

// AFTER (Phase 4)
@Injectable({ providedIn: 'root' })
export class ServiceOfferingsService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);

  async createService(
    providerId: string,
    data: Omit<ServiceOffering, 'id' | 'provider_id' | 'created_at'>,
  ): Promise<ServiceOffering> {
    // Build GQL data with camelCase field names
    const gqlData: Record<string, unknown> = {
      id: crypto.randomUUID(),
      providerId,
      title: data.title,
      description: data.description ?? null,
      category: data.category,
      subcategory: data.subcategory ?? null,
      pricingType: data.pricing_type,
      price: data.price ?? null,
      deliveryTime: data.delivery_time ?? null,
      includes: data.includes ?? null,
      requirements: data.requirements ?? null,
      isActive: data.is_active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Fire-and-forget Pipeline push
    this.pipelineWrite.pushEntity('ServiceOffering', gqlData).catch(err => {
      console.error('Failed to push service offering to Pipeline:', err);
    });

    // Return optimistically (transform GQL to Neon shape)
    const neonData = mapGqlToNeon<ServiceOffering>(gqlData, SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon);
    return neonData;
  }

  async listServices(options?: QueryOptions): Promise<PagedResults<ServiceOffering>> {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    const gqlOptions: GqlQueryOptions = {
      filters: { isActive: '.eq.true' },
      pageNumber,
      pageSize,
    };

    const result = await this.graphqlRead.query<GqlServiceOfferingResponse>(
      'ServiceOffering',
      [
        'id', 'providerId', 'title', 'description',
        'category', 'subcategory', 'pricingType',
        'price', 'deliveryTime', 'includes', 'requirements',
        'isActive', 'createdAt', 'updatedAt'
      ],
      gqlOptions,
    );

    // Transform GQL responses to Neon shape
    const items = result.items.map(gql => mapGqlToNeon<ServiceOffering>(gql, SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon));
    return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
  }
}
```

**Key points:**
- Generate new UUID for each entity (using `crypto.randomUUID()`)
- Build GQL object with camelCase field names (using field mapping constants)
- Fire-and-forget Pipeline push (return immediately with optimistic data)
- Query uses GQL filters in RFC4515 format (`.eq.`, `.ilike.*`, etc.)
- Transform GQL responses back to Neon shape for component compatibility

### Pattern 2: Catalog Filtering with RFC4515

**What:** ServiceOffering catalog filtering (by category, pricingType, search term) maps to GQL RFC4515 filter syntax.

**When to use:** listServices() with optional filters; searchServices() by title/description.

**Example:**

```typescript
// Query with category filter: only 'compliance' offerings
const result = await this.graphqlRead.query<GqlServiceOfferingResponse>(
  'ServiceOffering',
  fields,
  {
    filters: { category: '.eq.compliance' },
    pageSize: 25,
  }
);

// Query with multiple filters: compliance offerings under $5000
const result = await this.graphqlRead.query<GqlServiceOfferingResponse>(
  'ServiceOffering',
  fields,
  {
    filters: {
      category: '.eq.compliance',
      price: '.lt.5000', // Less than operator
    },
    pageSize: 25,
  }
);

// Search by title (ILIKE for fuzzy matching)
const result = await this.graphqlRead.query<GqlServiceOfferingResponse>(
  'ServiceOffering',
  fields,
  {
    filters: {
      title: `.ilike.%${searchTerm}%`,
    },
    pageSize: 25,
  }
);
```

**RFC4515 operators available in GraphqlReadService:**
- `.eq.` — Exact match
- `.ilike.` — Case-insensitive substring match
- `.lt.` — Less than
- `.gt.` — Greater than
- `.lte.` — Less than or equal
- `.gte.` — Greater than or equal

### Pattern 3: Optimistic Updates (Critical for UX)

**What:** Return data immediately without waiting for GQL indexing (~5-10s delay). Components show created/updated entities instantly, then Pipeline processes in background.

**Why it matters:** Reviews and ServiceOfferings have fast create/edit flows. Users expect immediate feedback.

**Example:**

```typescript
async createService(...): Promise<ServiceOffering> {
  const gqlData = { ... };

  // Push to Pipeline (don't await)
  this.pipelineWrite.pushEntity('ServiceOffering', gqlData).catch(err => {
    console.error('Pipeline error:', err);
    // Could emit notification here if needed
  });

  // Return immediately with Neon shape (components show it right away)
  const neonData = mapGqlToNeon<ServiceOffering>(gqlData, SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon);
  return neonData;
}
```

### Anti-Patterns to Avoid

- **❌ Awaiting Pipeline push:** `await this.pipelineWrite.pushEntity(...)` blocks UI. Only await if you need to verify success before responding to user.
- **❌ Mixing Neon and GQL reads:** Don't fallback to `this.db.listRows()` if GQL fails. Either keep SmeMartDbService for that phase, or implement proper error handling.
- **❌ Forgetting field mapping:** Creating GQL object with Neon field names (provider_id instead of providerId) causes schema validation errors.
- **❌ Ignoring RFC4515 syntax:** Using plain `.filter(item => item.category === cat)` client-side instead of passing `.eq.cat` to GQL means full dataset fetches.
- **❌ Modifying GQL types directly:** Don't edit GqlServiceOfferingResponse or GqlReviewResponse by hand. They're generated; regenerate them if schema changes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Field name translation | Custom mapper functions | mapNeonToGql() / mapGqlToNeon() from field-mappings.ts | Already tested, prevents typos, centralizes mappings |
| GQL query building | String concatenation | GraphqlReadService.query() with filters object | Prevents injection bugs, handles pagination, strongly typed |
| Pagination | Manual offset/limit | PagedResults.fromArray() | Handles total count, page size normalization |
| Mock services in tests | Fake fetch responses | fakePipelineWriteService(), fakeGraphqlReadService() | Already written, follows Phase 1 pattern |
| Service offering catalog UI | Custom filter component | CatalogFiltersComponent (existing) + RFC4515 filters | Already exists, just swap backend calls |
| Review approval flow | Custom approval UI | Defer to Phase 7 (Task linking) | Out of scope; don't build now |

**Key insight:** The Pattern 2 swap is so mechanical that it's harder to build wrong than right, IF you follow the field mapping rules and use the existing test helpers.

---

## Common Pitfalls

### Pitfall 1: Field Name Mismatch in GQL Objects

**What goes wrong:** Create a ServiceOffering with Neon field names instead of camelCase. Pipeline rejects it or stores garbage.

```typescript
// ❌ WRONG
const gqlData = {
  provider_id: providerId,  // Should be providerId
  is_active: true,          // Should be isActive
};
```

**Why it happens:** Brain is still in Neon mode; field mapping constants aren't top-of-mind.

**How to avoid:** Use field mapping constants explicitly. Copy the SERVICE_OFFERING_FIELD_MAPPING comment to the service file. Build gqlData by looking at the neonToGql keys, then do the inverse.

**Warning signs:**
- Pipeline.receive() throws validation error about missing fields
- Created entities appear in GQL but have null/undefined values
- Roundtrip test failures (Neon → GQL → Neon doesn't match)

### Pitfall 2: Forgetting Filter Transform

**What goes wrong:** Catalog filter for category='compliance' is passed to GQL as a plain string. GQL query doesn't filter.

```typescript
// ❌ WRONG
const filters = { category: 'compliance' };  // Missing .eq. operator

// ✓ RIGHT
const filters = { category: '.eq.compliance' };
```

**Why it happens:** RFC4515 syntax isn't obvious. Looks like it should work intuitively.

**How to avoid:** Document the pattern in service. Create a helper function if filters are complex.

```typescript
private buildFilters(category?: string, pricingType?: string): Record<string, string> {
  return {
    ...(category && { category: `.eq.${category}` }),
    ...(pricingType && { pricingType: `.eq.${pricingType}` }),
  };
}
```

**Warning signs:**
- Catalog page shows all items regardless of selected filter
- console shows GQL query without filter clauses

### Pitfall 3: Missing Optimistic Update

**What goes wrong:** User creates a ServiceOffering, has to wait 5-10s for GQL indexing before it appears in the list.

**Why it happens:** Forgot to return the gqlData immediately; instead, waiting for GQL.getById() confirmation.

**How to avoid:** Always return mapGqlToNeon(gqlData) right after pushEntity(), with fire-and-forget error handling.

**Warning signs:**
- "Create" button disabled for 5+ seconds
- Users complain about slow creation feedback
- Catalog refresh is needed to see new items

### Pitfall 4: Confusing ReviewsService.createReview() with Task Approval

**What goes wrong:** Implement a full approval workflow (Review → Task linking) because the field exists.

**Why it happens:** Schema shows `linkTo: Task` and it's tempting to wire it up.

**How to avoid:** Check CONTEXT.md: Review → Task approval is Phase 7 deferred. Don't implement it. Just migrate the existing Neon review schema as-is.

**Warning signs:**
- Adding Task-related parameters to createReview()
- Writing tests for approval workflow
- Spending more than 1-2 hours on review service

### Pitfall 5: Not Handling Null/Optional Fields

**What goes wrong:** ServiceOffering.price can be null (pricing on request). GQL object has price: undefined, Pipeline fails.

**Why it happens:** Rushing the field mapping; not checking Neon schema for nullable columns.

**How to avoid:** Look at ServiceOffering model — see `price: string | null`. Explicitly set null in gqlData for optional fields.

```typescript
const gqlData: Record<string, unknown> = {
  ...
  price: data.price ?? null,  // Ensure null, not undefined
  deliveryTime: data.delivery_time ?? null,
  includes: data.includes ?? null,
  ...
};
```

**Warning signs:**
- "undefined is not a valid value for field X" errors from Pipeline
- Optional fields always appear as null in GQL, even when provided

---

## Code Examples

Verified patterns from existing Phase 2 implementations:

### ServiceOfferingsService: List with Filtering

```typescript
// Source: Phase 2 pattern (EngagementsService.listEngagements)
async listServices(options?: QueryOptions): Promise<PagedResults<ServiceOffering>> {
  this.loading.set(true);
  try {
    const pageNumber = options?.pageNumber ?? 1;
    const pageSize = options?.pageSize ?? 50;

    const gqlOptions: GqlQueryOptions = {
      filters: { isActive: '.eq.true' },
      pageNumber,
      pageSize,
    };

    const result = await this.graphqlRead.query<GqlServiceOfferingResponse>(
      'ServiceOffering',
      [
        'id', 'providerId', 'title', 'description',
        'category', 'subcategory', 'pricingType',
        'price', 'deliveryTime', 'includes', 'requirements',
        'isActive', 'createdAt', 'updatedAt'
      ],
      gqlOptions,
    );

    const items = result.items.map(gql =>
      mapGqlToNeon<ServiceOffering>(gql, SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon)
    );

    return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
  } finally {
    this.loading.set(false);
  }
}

async getServicesByProvider(providerId: string): Promise<ServiceOffering[]> {
  const gqlOptions: GqlQueryOptions = {
    filters: { providerId: `.eq.${providerId}` },
    pageSize: 100,
  };

  const result = await this.graphqlRead.query<GqlServiceOfferingResponse>(
    'ServiceOffering',
    ['id', 'providerId', 'title', 'description', 'category', 'pricingType', 'isActive', 'createdAt'],
    gqlOptions,
  );

  return result.items.map(gql =>
    mapGqlToNeon<ServiceOffering>(gql, SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon)
  );
}
```

### ServiceOfferingsService: Create with Optimistic Update

```typescript
// Source: Phase 2-3 pattern (NotesService.createNote)
async createService(
  providerId: string,
  data: Omit<ServiceOffering, 'id' | 'provider_id' | 'created_at'>,
): Promise<ServiceOffering> {
  const now = new Date().toISOString();

  // Build GQL data with camelCase field names
  const gqlData: Record<string, unknown> = {
    id: crypto.randomUUID(),
    providerId,
    title: data.title,
    description: data.description ?? null,
    category: data.category,
    subcategory: data.subcategory ?? null,
    pricingType: data.pricing_type,
    price: data.price ?? null,
    deliveryTime: data.delivery_time ?? null,
    includes: data.includes ?? null,
    requirements: data.requirements ?? null,
    isActive: data.is_active ?? true,
    createdAt: now,
    updatedAt: now,
  };

  // Fire-and-forget Pipeline push
  this.pipelineWrite.pushEntity('ServiceOffering', gqlData).catch(err => {
    console.error('Failed to push service offering to Pipeline:', err);
  });

  // Return optimistically (transform GQL to Neon shape)
  const neonData = mapGqlToNeon<ServiceOffering>(gqlData, SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon);
  return neonData;
}
```

### ReviewsService: List with Status Filtering

```typescript
// Source: Phase 2-3 pattern adapted for Review entity
async listReviewsByProvider(providerId: string, approvedOnly = true): Promise<Review[]> {
  const filters: Record<string, string> = {
    providerId: `.eq.${providerId}`,
  };

  if (approvedOnly) {
    filters.approved = '.eq.true';
  }

  const result = await this.graphqlRead.query<GqlReviewResponse>(
    'Review',
    [
      'id', 'providerId', 'reviewerZerobiasUserId', 'engagementId',
      'rating', 'reviewText', 'approved', 'approvedAt', 'approvedBy',
      'createdAt', 'updatedAt'
    ],
    {
      filters,
      pageSize: 100,
    },
  );

  return result.items.map(gql =>
    mapGqlToNeon<Review>(gql, REVIEW_FIELD_MAPPING.gqlToNeon)
  );
}

async createReview(data: {
  provider_id: string;
  reviewer_zerobias_user_id: string;
  request_id?: string;
  rating: number;
  review_text?: string;
}): Promise<Review> {
  const now = new Date().toISOString();

  const gqlData: Record<string, unknown> = {
    id: crypto.randomUUID(),
    providerId: data.provider_id,
    reviewerZerobiasUserId: data.reviewer_zerobias_user_id,
    engagementId: data.request_id ?? null,
    rating: data.rating,
    reviewText: data.review_text ?? null,
    approved: false,
    approvedAt: null,
    approvedBy: null,
    createdAt: now,
    updatedAt: now,
  };

  this.pipelineWrite.pushEntity('Review', gqlData).catch(err => {
    console.error('Failed to push review to Pipeline:', err);
  });

  const neonData = mapGqlToNeon<Review>(gqlData, REVIEW_FIELD_MAPPING.gqlToNeon);
  return neonData;
}
```

### Unit Test Pattern (Using Mocks)

```typescript
// Source: Phase 2 pattern
import { TestBed } from '@angular/core/testing';
import { ServiceOfferingsService } from './service-offerings.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { fakePipelineWriteService, fakeGraphqlReadService } from '@/test-helpers';

describe('ServiceOfferingsService', () => {
  let service: ServiceOfferingsService;
  let pipelineWrite: PipelineWriteService;
  let graphqlRead: GraphqlReadService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ServiceOfferingsService,
        { provide: PipelineWriteService, useValue: fakePipelineWriteService() },
        { provide: GraphqlReadService, useValue: fakeGraphqlReadService() },
      ],
    });

    service = TestBed.inject(ServiceOfferingsService);
    pipelineWrite = TestBed.inject(PipelineWriteService);
    graphqlRead = TestBed.inject(GraphqlReadService);
  });

  it('should create a service offering and push to pipeline', async () => {
    const providerId = 'provider-001';
    const data = {
      title: 'HIPAA Audit',
      description: 'Full audit',
      category: 'compliance',
      subcategory: null,
      pricing_type: 'fixed',
      price: '5000',
      delivery_time: '30 days',
      includes: ['Assessment', 'Report'],
      requirements: null,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const result = await service.createService(providerId, data);

    expect(result.id).toBeDefined();
    expect(result.provider_id).toBe(providerId);
    expect(result.title).toBe('HIPAA Audit');
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith('ServiceOffering', expect.any(Object));
  });

  it('should list services from graphql', async () => {
    const result = await service.listServices({ pageNumber: 1, pageSize: 25 });

    expect(result.items.length).toBeGreaterThan(0);
    expect(graphqlRead.query).toHaveBeenCalledWith(
      'ServiceOffering',
      expect.any(Array),
      expect.any(Object)
    );
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SmeMartDbService.createRow('service_offerings', ...) | PipelineWriteService.pushEntity('ServiceOffering', ...) | Phase 2-4 | All writes now async batch-ingested; GQL indexing delay ~5-10s |
| db.searchRows() with generic RFC4515 strings | GraphqlReadService.query() with typed filters object | Phase 2-4 | Filters are now type-safe (field names checked), pagination is explicit |
| Neon VIEWs for catalog (e.g., v_service_offerings) | Direct GQL queries to ServiceOffering class | Phase 1-4 | No JOINs; schema classes handle relationships; simpler query language |
| Neon transactions for related entity updates | Fire-and-forget Pipeline pushes | Phase 2-4 | Optimistic updates provide immediate feedback; eventual consistency within 5-10s |

**Deprecated/outdated:**
- **SmeMartDbService direct usage** (in ServiceOfferingsService, ReviewsService) — migrate to Pipeline+GraphQL
- **Admin review VIEW queries** (v_admin_reviews) — replace with GQL filtered query on Review class with joined provider fields (deferred if not in scope)

---

## Open Questions

1. **Does ReviewsService have full implementation or just stubs?**
   - **What we know:** ReviewsService exists at `src/app/core/services/reviews.service.ts`; uses SmeMartDbService for CRUD + admin list operations
   - **What's unclear:** Whether admin moderation UI exists (approve/reject flows) that depend on v_admin_reviews VIEW
   - **Recommendation:** Check if admin-dashboard.component.ts or my-profile-moderate-reviews.component.ts exist and consume ReviewsService. If they do, migrate those queries. If they don't, just migrate the basic ReviewsService for future use.

2. **How deep are the ServiceOffering -> Provider relationships?**
   - **What we know:** ServiceOffering has provider_id foreign key; no nested queries in Phase 2
   - **What's unclear:** Whether catalog page needs provider avatar, name, or rating in the service card
   - **Recommendation:** Check service-card.component.ts. If it needs provider info, add those fields to GQL query or fetch provider separately. If not, just query ServiceOffering fields.

3. **Are there any admin filtering/moderation views for ServiceOffering?**
   - **What we know:** ServiceOffering has is_active flag
   - **What's unclear:** Whether admins filter by status, pricing type, or date range
   - **Recommendation:** Check admin-dashboard.component.ts for any ServiceOffering filtering. If there are custom filters, add them to GraphqlReadService.query() filters parameter.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + Angular TestBed (Angular 21) |
| Config file | `vite.config.ts` (vitest section) |
| Quick run command | `npm test -- src/app/core/services/service-offerings.service.spec.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIG-16 | ServiceOfferingsService.createService() pushes entity to Pipeline | unit | `npm test -- service-offerings.service.spec.ts -t "createService"` | ✅ (Phase 1 roundtrip; needs migration test) |
| MIG-16 | ServiceOfferingsService.updateService() pushes updates to Pipeline | unit | `npm test -- service-offerings.service.spec.ts -t "updateService"` | ❌ Wave 0 |
| MIG-16 | ServiceOfferingsService.deleteService() deletes via Pipeline | unit | `npm test -- service-offerings.service.spec.ts -t "deleteService"` | ❌ Wave 0 |
| MIG-17 | ServiceOfferingsService.listServices() queries via GraphQL | unit | `npm test -- service-offerings.service.spec.ts -t "listServices"` | ❌ Wave 0 |
| MIG-17 | ServiceOfferingsService.getServicesByProvider() filters by providerId via GQL | unit | `npm test -- service-offerings.service.spec.ts -t "getServicesByProvider"` | ❌ Wave 0 |
| MIG-18 | ReviewsService.createReview() pushes entity to Pipeline | unit | `npm test -- reviews.service.spec.ts -t "createReview"` | ❌ Wave 0 |
| MIG-18 | ReviewsService.approveReview() / rejectReview() update via Pipeline | unit | `npm test -- reviews.service.spec.ts -t "approveReview"` | ❌ Wave 0 |
| MIG-19 | ReviewsService.listReviewsByProvider() queries via GraphQL with approved filter | unit | `npm test -- reviews.service.spec.ts -t "listReviewsByProvider"` | ❌ Wave 0 |
| MIG-19 | ReviewsService.listAdminReviews() queries Review via GQL (no VIEW) | unit | `npm test -- reviews.service.spec.ts -t "listAdminReviews"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- src/app/core/services/service-offerings.service.spec.ts`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

#### Existing (already covered from Phase 1)
- ✅ SERVICE_OFFERING_FIELD_MAPPING and mapNeonToGql/mapGqlToNeon validation
- ✅ REVIEW_FIELD_MAPPING and roundtrip transformation tests
- ✅ GqlServiceOfferingResponse and GqlReviewResponse types exist
- ✅ fakePipelineWriteService() and fakeGraphqlReadService() mocks available

#### Missing (to be created in Wave 1)
- [ ] `src/app/core/services/service-offerings.service.spec.ts` — full service test suite (create, read, update, delete, list, filter)
- [ ] `src/app/core/services/reviews.service.spec.ts` — full service test suite (create, approve, reject, list, admin list)
- [ ] `src/app/core/models/service-offering.enums.ts` — PricingType enum if not already present
- [ ] ServiceCatalogComponent integration tests (if needed)
- [ ] MyProfileReviewsComponent integration tests (if needed)

**Framework install:** `npm install` (vitest already installed from Phase 1)

---

## Sources

### Primary (HIGH confidence)
- **Codebase files inspected:**
  - `src/app/core/services/service-offerings.service.ts` (current SmeMartDbService impl)
  - `src/app/core/services/reviews.service.ts` (current SmeMartDbService impl)
  - `src/app/core/models/{service-offering,review}.model.ts` (type definitions)
  - `src/app/core/gql-types/{service-offering,review}.types.ts` (GQL response types)
  - `src/app/core/field-mappings.ts` (bidirectional mapping constants)
  - `src/app/core/services/{pipeline-write,graphql-read}.service.ts` (Phase 1 infrastructure)
  - `.planning/CONTEXT.md` (phase constraints and decisions)
  - `.planning/REQUIREMENTS.md` (requirement traceability)

- **Verified against Phase 2 reference:**
  - `src/app/core/services/engagements.service.ts` (Phase 2 migration pattern)
  - `src/app/core/services/notes.service.ts` (Phase 2-3 migration pattern)
  - Roundtrip test patterns for both ServiceOffering and Review

### Secondary (MEDIUM confidence)
- **Schema reference:** `.planning/phases/04-wave-3-standalone-entities/04-CONTEXT.md` (canonical refs list)
- **Plan reference:** `.planning/ROADMAP.md` (phase structure, dependencies, success criteria)

---

## Metadata

**Confidence breakdown:**
- **Standard Stack:** HIGH — All libraries exist, versions verified, used in Phases 1-3
- **Architecture:** HIGH — Pattern proven in Phase 2 (Engagement/Bids) and Phase 3 (Notes). No new challenges for standalone entities.
- **Pitfalls:** MEDIUM-HIGH — Pitfall #1-2 (field mapping, filter syntax) are the main risks; preventable with discipline
- **Validation:** HIGH — Test infrastructure from Phase 1 is complete; wave 0 gaps are mechanical (test file creation)

**Research date:** 2026-03-18
**Valid until:** 2026-04-01 (two weeks; stable domain; no fast-moving dependencies)

---

*Phase: 04-wave-3-standalone-entities*
*Research completed: 2026-03-18*
