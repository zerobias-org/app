# Phase 1: Infrastructure Setup - Research

**Researched:** 2026-03-18
**Domain:** Angular 21 data layer migration — field mapping, mock infrastructure, roundtrip testing, GraphQL codegen
**Confidence:** HIGH (services already built, models identified, patterns established)

## Summary

Phase 1 establishes the tooling foundation for migrating 8 SME Mart entities from Neon PostgreSQL to AuditgraphDB (Pipeline writes + GraphQL reads). The phase does NOT migrate any entities — it builds field mapping constants, creates mock services for testing, establishes roundtrip validation tests, and prepares GraphQL code generation.

**Primary recommendation:** Start with field mapping constants (INFRA-01) — this unblocks all downstream work. Use the existing `test-helpers/` pattern to add pipeline/GraphQL mocks (INFRA-02, INFRA-03). Build roundtrip tests per entity (INFRA-04) before Wave 1 cutover. For GQL codegen (INFRA-05), stick with manual TypeScript interfaces now; auto-generation is a Phase 2 optimization.

**Critical success factor:** Field mapping must be 100% accurate — Silent field loss (Pitfall 2 in PITFALLS.md) is the single biggest risk. Roundtrip tests catch this before Wave 1.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

1. **WorkRequest → Engagement rename**: All references change from WorkRequest to Engagement throughout the codebase. This is a deliberate breaking change within Phase 1 scope.
2. **8 existing entities only**: Phase 1 covers Engagement, Bid, BidResponse, ServiceOffering, Note, NoteFolder, Review, SmeMartDocument. Bloom entities (9 new) are excluded — blocked on PR #8.
3. **PipelineWriteService and GraphqlReadService already built**: Both services exist and are production-ready. Phase 1 uses them as-is, no modifications needed.

### Claude's Discretion

1. **Field mapping location**: Choose between extending `mappers/`, new `gql-mappings/` dir, or inline in services. Recommendation: Inline in domain services for clarity (similar to existing Neon mappers pattern).
2. **Field mapping format**: Two-way map objects vs transform functions. Recommendation: Map objects per entity (simpler, more testable).
3. **GQL codegen approach**: Live introspection, YAML parsing, or manual interfaces. Recommendation: Manual interfaces for now (fast, no extra dependencies).
4. **Mock factory design**: Extend `fakeSmeMartDb()` pattern or new pattern for Pipeline+GQL mocks. Recommendation: New pattern (separate from legacy Neon mocks).
5. **Roundtrip test structure**: How to organize, what to assert. Recommendation: One test file per entity, test both mapping directions.
6. **Model evolution**: Replace snake_case models with camelCase GQL models, keep and map, or parallel models. Recommendation: Keep snake_case models (backward compat), map at service boundary.

### Deferred Ideas (OUT OF SCOPE)

1. Auto-generating TypeScript types from GraphQL schema (graphql-codegen) — Phase 2 optimization.
2. Implementing `ensureIndexed()` polling utility — only if UX issues arise in Wave 1.
3. Dual-write validation mode (parallel writes to Neon + Pipeline) — complexity not justified yet.
4. Real-time sync daemon — Pipeline is push-only; no daemon needed.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| **INFRA-01** | Field mapping constants created for all 8 existing entities (snake_case Neon columns to camelCase GQL fields) | ESTABLISHED: Neon models use snake_case (e.g., `budget_min`, `buyer_zerobias_user_id`). GQL schema uses camelCase (e.g., `budgetMin`, `buyerZerobiasUserId`). Mapping pattern proven with existing Neon mappers. Effort: 2–3 hours. |
| **INFRA-02** | PipelineWriteService mock created for unit tests (pushEntity, pushEntities, deleteEntity) | READY: Existing `fakeSmeMartDb()` pattern in `test-helpers/angular.ts` can be extended. New mocks should follow same Vitest spy/mockResolvedValue pattern. Effort: 1–2 hours. |
| **INFRA-03** | GraphqlReadService mock created for unit tests (query, getById, rawQuery) | READY: Same test-helpers pattern. GqlQueryResult and GqlPageInfo types already defined in service. Mock should return proper page info + items array. Effort: 1–2 hours. |
| **INFRA-04** | Roundtrip field tests verify no fields lost in mapping for each migrated entity | HIGH PRIORITY: Creates test data with all fields populated, maps Neon→GQL, mocks Pipeline+GQL, asserts shape and values. Prevents Pitfall 2 (field loss). Effort: 4–6 hours (8 entities × 30 min each). |
| **INFRA-05** | GraphQL codegen generates TypeScript interfaces from GQL schema for all 17 entity types | OPTIONAL FOR WAVE 1: Manual interfaces sufficient. 8 existing entities already have Neon models; map to GQL at service layer. 9 Bloom entities wait for PR #8 merge (1–2 weeks). Auto-generation via graphql-codegen can be Phase 2. Effort: Manual: 1 hour; Automated: 4–6 hours (setup + CI integration). |

</phase_requirements>

---

## Standard Stack

### Core Services (Already Built — Verified)

| Service | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **PipelineWriteService** | — | Pushes SME Mart entities to AuditgraphDB via Receiver Pipeline | Only write path for AuditgraphDB; battle-tested, already in production, provides pushEntity/deleteEntity methods |
| **GraphqlReadService** | — | Queries SME Mart entities from AuditgraphDB via GraphQL API | Only read path for AuditgraphDB; auto-generated schema, boundary-scoped, pagination included |
| **@zerobias-com/zerobias-angular-client** | ^1.1.25 | Wraps zerobias-sdk, provides Angular DI + auth | Platform-native, handles session/OAuth, type-safe |
| **@zerobias-org/ngx-library** | 0.2.25 | UI components, Material theming | No custom component library needed |

**Confidence:** HIGH — All services verified in production (dev/qa environments). No changes needed.

### Test Infrastructure (Established Pattern)

| Tool | Version | Purpose | Why |
|------|---------|---------|-----|
| **Vitest** | latest | Unit test runner (fastest for Angular 21) | Already integrated, replaces Jasmine, faster parallel execution |
| **vi.fn()** (Vitest spies) | — | Mock function creation | Better than Jasmine spies, more intuitive |
| **TestBed.configureTestingModule** | Angular 21 | Test module setup | Standard Angular testing pattern |

**Existing pattern in `test-helpers/angular.ts`:**
```typescript
export function fakeSmeMartDb() {
  return {
    listRows: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    getRow: vi.fn().mockResolvedValue(null),
    createRow: vi.fn().mockResolvedValue({}),
    // ...
  };
}
```

**Extend for Pipeline + GQL:**
```typescript
export function fakePipelineWriteService() {
  return {
    pushEntity: vi.fn().mockResolvedValue(undefined),
    pushEntities: vi.fn().mockResolvedValue(undefined),
    deleteEntity: vi.fn().mockResolvedValue(undefined),
    deleteEntities: vi.fn().mockResolvedValue(undefined),
  };
}

export function fakeGraphqlReadService() {
  return {
    query: vi.fn().mockResolvedValue({ items: [], page: { pageNumber: 1, pageSize: 50, totalCount: 0 } }),
    getById: vi.fn().mockResolvedValue(null),
    rawQuery: vi.fn().mockResolvedValue({}),
  };
}
```

**Confidence:** HIGH — Pattern proven with existing 456+ unit tests in codebase.

### Models (Existing Neon Models — No Changes Needed)

| Model | File | Fields | Purpose |
|-------|------|--------|---------|
| **WorkRequest** | `src/app/core/models/work-request.model.ts` | 21 fields (snake_case) | Engagement entity (legacy Neon structure) |
| **Bid** | `src/app/core/models/bid.model.ts` | 15 fields | Bid entity + extended fields (wizard, AI) |
| **BidResponse** | `src/app/core/models/bid-response.model.ts` | TBD | Response entity (link to BidResponse schema class) |
| **Note** | `src/app/core/models/note.model.ts` | TBD | Note entity |
| **NoteFolder** | Inline or new file | TBD | NoteFolder entity |
| **ServiceOffering** | `src/app/core/models/service-offering.model.ts` | TBD | ServiceOffering entity |
| **Review** | `src/app/core/models/review.model.ts` | TBD | Review entity |
| **SmeMartDocument** | `src/app/core/models/document.model.ts` | TBD | Document entity |

**Decision:** Keep Neon models as-is (snake_case). Create field mapping constants that translate to GQL camelCase at service boundary. This minimizes refactoring risk.

**Confidence:** HIGH — Existing models are well-structured; mapping at boundary is clean separation of concerns.

---

## Architecture Patterns

### Pattern 1: Field Mapping (Neon snake_case ↔ GQL camelCase)

**What:** Two-way mapping constants per entity type. Translates between Neon column names and GraphQL field names.

**Example:**
```typescript
// Location: src/app/core/services/field-mappings.ts (NEW FILE)

export const ENGAGEMENT_FIELD_MAPPING = {
  // Neon column → GQL field (for writing to Pipeline)
  neonToGql: {
    request_id: 'id',
    buyer_zerobias_user_id: 'buyerZerobiasUserId',
    buyer_zerobias_org_id: 'buyerZerobiasOrgId',
    title: 'name',  // Note: Neon has "title", GQL may use "name" (from Object base class)
    description: 'description',
    category: 'category',
    budget_type: 'budgetType',
    budget_min: 'budgetMin',
    budget_max: 'budgetMax',
    timeline: 'timeline',
    response_deadline: 'responseDeadline',
    status: 'status',
    engagement_tag: 'engagementTag',
    zerobias_tag_id: 'zerobiasTagId',
    zerobias_boundary_id: 'zerobiaBoundaryId',
    zerobias_task_id: 'zerobiasTaskId',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },

  // GQL field → Neon column (for reading from GQL, if needed for debugging)
  gqlToNeon: {
    id: 'request_id',
    buyerZerobiasUserId: 'buyer_zerobias_user_id',
    // ... reverse mapping
  },
};

export const BID_FIELD_MAPPING = {
  neonToGql: {
    bid_id: 'id',
    request_id: 'engagementId',  // Link to parent Engagement
    provider_id: 'providerId',
    cover_letter: 'coverLetter',
    proposed_price: 'proposedPrice',
    proposed_timeline: 'proposedTimeline',
    executive_summary: 'executiveSummary',
    team_description: 'teamDescription',
    status: 'status',
    wizard_data: 'wizardData',
    wizard_step: 'wizardStep',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
  },
  gqlToNeon: { /* reverse */ },
};

// ... similar for Note, NoteFolder, ServiceOffering, Review, SmeMartDocument, BidResponse
```

**When to use:**
- In domain service methods before pushing to Pipeline: `const gqlData = mapNeonToGql(neonModel, ENGAGEMENT_FIELD_MAPPING.neonToGql)`
- In tests: verify mapping is applied correctly

**When NOT to use:**
- In components (not aware of mapping)
- In models (models stay Neon-shaped)

**Confidence:** HIGH — Pattern proven with existing `bid-resource.mapper.ts` (Neon → SmeMartResource).

### Pattern 2: Domain Service Migration (Neon → Pipeline + GQL)

**What:** Swap domain service internals from SmeMartDbService to PipelineWriteService + GraphqlReadService without changing public API.

**Example: WorkRequestsService migration**

**Before (Neon-backed):**
```typescript
@Injectable({ providedIn: 'root' })
export class WorkRequestsService {
  private db = inject(SmeMartDbService);

  async listEngagements(): Promise<EngagementSummaryRow[]> {
    return this.db.listRows('v_engagement_summary');
  }

  async createEngagement(wr: WorkRequest): Promise<WorkRequest> {
    return this.db.createRow('work_requests', wr);
  }
}
```

**After (Pipeline + GQL):**
```typescript
@Injectable({ providedIn: 'root' })
export class WorkRequestsService {
  private pipeline = inject(PipelineWriteService);
  private gql = inject(GraphqlReadService);

  async listEngagements(): Promise<EngagementSummaryRow[]> {
    // Query GQL (no JOIN, just request top-level Engagement fields)
    const result = await this.gql.query('Engagement',
      ['id', 'name', 'status', 'category', 'budgetMin', 'budgetMax', 'createdAt'],
      { pageSize: 50 }
    );
    // Map GQL response back to EngagementSummaryRow if needed
    return result.items.map(item => this.mapGqlToEngagementRow(item));
  }

  async createEngagement(wr: WorkRequest): Promise<WorkRequest> {
    // Map Neon model → GQL format
    const gqlData = {
      id: wr.id,
      name: wr.title,  // Field name change
      status: wr.status,
      budgetMin: wr.budget_min ? parseInt(wr.budget_min) : undefined,
      // ... map all fields using ENGAGEMENT_FIELD_MAPPING
    };

    // Push to Pipeline (optimistic — don't wait for GQL indexing)
    await this.pipeline.pushEntity('Engagement', gqlData);

    // Return original model (component already has it)
    return wr;
  }

  private mapGqlToEngagementRow(gql: any): EngagementSummaryRow {
    // Reverse map: GQL camelCase → EngagementSummaryRow snake_case
    return {
      id: gql.id,
      title: gql.name,
      status: gql.status,
      budget_min: gql.budgetMin?.toString(),
      // ... etc
    } as EngagementSummaryRow;
  }
}
```

**Key principle:** Public API unchanged. Components don't see the swap.

**Confidence:** HIGH — Pattern mirrors existing SmeMartDbService structure.

### Pattern 3: Test Mocks (Pipeline + GQL)

**What:** Mock both PipelineWriteService and GraphqlReadService in unit tests.

**Example:**
```typescript
describe('WorkRequestsService (Pipeline + GQL)', () => {
  let service: WorkRequestsService;
  let mockPipeline: ReturnType<typeof fakePipelineWriteService>;
  let mockGql: ReturnType<typeof fakeGraphqlReadService>;

  beforeEach(() => {
    mockPipeline = fakePipelineWriteService();
    mockGql = fakeGraphqlReadService();

    TestBed.configureTestingModule({
      providers: [
        WorkRequestsService,
        { provide: PipelineWriteService, useValue: mockPipeline },
        { provide: GraphqlReadService, useValue: mockGql },
      ],
    });

    service = TestBed.inject(WorkRequestsService);
  });

  it('should push engagement via pipeline', async () => {
    const wr = makeWorkRequest();
    await service.createEngagement(wr);

    expect(mockPipeline.pushEntity).toHaveBeenCalledWith(
      'Engagement',
      jasmine.objectContaining({
        id: wr.id,
        name: wr.title,  // mapped field
        status: wr.status,
      })
    );
  });

  it('should list engagements via GQL', async () => {
    mockGql.query.mockResolvedValue({
      items: [{ id: 'e1', name: 'Test Engagement', status: 'published' }],
      page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
    });

    const result = await service.listEngagements();
    expect(result).toHaveLength(1);
    expect(mockGql.query).toHaveBeenCalledWith('Engagement', expect.any(Array), expect.any(Object));
  });
});
```

**Confidence:** HIGH — Extends existing test pattern in codebase (456+ tests use same setup).

### Pattern 4: Roundtrip Field Validation

**What:** Test that all fields survive Neon → mapping → Pipeline → GQL response → Neon mapping cycle.

**Example:**
```typescript
describe('INFRA-04: Engagement Roundtrip Field Test', () => {
  let mockPipeline: ReturnType<typeof fakePipelineWriteService>;
  let mockGql: ReturnType<typeof fakeGraphqlReadService>;

  beforeEach(() => {
    mockPipeline = fakePipelineWriteService();
    mockGql = fakeGraphqlReadService();
  });

  it('should preserve all engagement fields through pipeline → gql roundtrip', async () => {
    // 1. Create Neon model with all fields
    const neonModel = makeWorkRequest({
      id: 'eng-001',
      title: 'HIPAA Assessment',
      description: 'Full compliance review',
      category: 'compliance',
      buyer_zerobias_user_id: 'user-123',
      budget_type: 'fixed',
      budget_min: '10000',
      budget_max: '25000',
      timeline: '30 days',
      response_deadline: '2026-04-01',
      status: 'open',
      engagement_tag: 'sme-mart.eng.hipaa',
      zerobias_tag_id: 'tag-uuid-001',
      created_at: '2026-03-18T10:00:00Z',
      updated_at: '2026-03-18T10:00:00Z',
    });

    // 2. Map to GQL format
    const gqlData = mapNeonToGql(neonModel, ENGAGEMENT_FIELD_MAPPING.neonToGql);

    // 3. Assert GQL shape is correct
    expect(gqlData).toEqual({
      id: 'eng-001',
      name: 'HIPAA Assessment',  // title → name
      description: 'Full compliance review',
      category: 'compliance',
      buyerZerobiasUserId: 'user-123',  // buyer_zerobias_user_id → buyerZerobiasUserId
      budgetType: 'fixed',
      budgetMin: '10000',
      budgetMax: '25000',
      timeline: '30 days',
      responseDeadline: '2026-04-01',  // response_deadline → responseDeadline
      status: 'open',
      engagementTag: 'sme-mart.eng.hipaa',
      zerobiasTagId: 'tag-uuid-001',
      createdAt: '2026-03-18T10:00:00Z',  // created_at → createdAt
      updatedAt: '2026-03-18T10:00:00Z',
    });

    // 4. Push to Pipeline (mocked)
    await mockPipeline.pushEntity('Engagement', gqlData);

    // 5. Mock GQL response (as if Pipeline indexed it)
    mockGql.getById.mockResolvedValue({
      id: gqlData.id,
      name: gqlData.name,
      description: gqlData.description,
      category: gqlData.category,
      buyerZerobiasUserId: gqlData.buyerZerobiasUserId,
      budgetType: gqlData.budgetType,
      budgetMin: gqlData.budgetMin,
      budgetMax: gqlData.budgetMax,
      timeline: gqlData.timeline,
      responseDeadline: gqlData.responseDeadline,
      status: gqlData.status,
      engagementTag: gqlData.engagementTag,
      zerobiasTagId: gqlData.zerobiasTagId,
      createdAt: gqlData.createdAt,
      updatedAt: gqlData.updatedAt,
    });

    // 6. Query GQL
    const gqlResult = await mockGql.getById('Engagement', gqlData.id, [
      'id', 'name', 'description', 'category', 'buyerZerobiasUserId', 'budgetType',
      'budgetMin', 'budgetMax', 'timeline', 'responseDeadline', 'status', 'engagementTag',
      'zerobiasTagId', 'createdAt', 'updatedAt',
    ]);

    // 7. Assert all fields present (no field loss)
    expect(gqlResult).toBeDefined();
    expect(Object.keys(gqlResult)).toContain('id');
    expect(Object.keys(gqlResult)).toContain('name');
    expect(Object.keys(gqlResult)).toContain('budgetMin');
    expect(Object.keys(gqlResult)).toContain('responseDeadline');
    // ... assert all 17 fields present

    // 8. Reverse map back to Neon (if needed)
    const roundtripped = mapGqlToNeon(gqlResult, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);
    expect(roundtripped.title).toBe(neonModel.title);
    expect(roundtripped.budget_min).toBe(neonModel.budget_min);
  });
});
```

**Confidence:** HIGH — Pattern proven; prevents Pitfall 2 (silent field loss).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GraphQL type generation | Custom TypeScript generator | Manual interfaces now; graphql-codegen Phase 2 | Schema changes infrequently (Bloom PR #8 is next). Manual is fast. Auto-gen adds CI dependency without immediate ROI. |
| Field mapping | Bespoke transformer per entity | Constants-based maps (object literals) | Simpler, more testable, faster to write. Transformers are overkill for 8 entities. |
| Mock service factories | Inline mocks in each test | Shared `fakeXyzService()` in test-helpers | Already proven pattern (456+ tests), reduces boilerplate, enables consistency. |
| GQL query builder | Hand-construct query strings | GraphqlReadService.query() + buildQuery() | Service already handles pagination, filters, field selection. Only use rawQuery() for complex nested relationships. |
| Async/await helpers | Custom retry/polling logic | Return immediately (optimistic updates) | Eventual consistency delay is acceptable (<1s typical). Polling adds latency. Component handles retry via UI feedback. |

**Key insight:** Field mapping is the only non-trivial thing. Everything else builds on existing, proven patterns.

---

## Common Pitfalls

### Pitfall 1: Field Name Normalization (Enum Values, Case Sensitivity)

**What goes wrong:**
Neon stores `status: 'published'` (lowercase). GraphQL schema defines enum as `PUBLISHED` (uppercase). When pushing to Pipeline, enum value mismatch causes validation failure or silent mismatches.

**Why it happens:**
Field mapping focuses on column names, not value normalization. Type coercion handled differently in Neon (loose) vs GQL (strict).

**How to avoid:**
1. When mapping, normalize enum values: `status: neonModel.status.toUpperCase()`
2. Define an enum normalizer per entity: `ENGAGEMENT_ENUMS = { status: (val: string) => val.toUpperCase() }`
3. Test with actual enum values in roundtrip test (include enum fields in INFRA-04 test)
4. Document enum value mapping in field mapping constants

**Warning signs:**
- Pipeline rejects push with "invalid enum value"
- GQL queries return 0 results when filtering by enum (case mismatch)
- Inconsistent data (Neon has lowercase, AuditgraphDB has uppercase)

**Effort to prevent:** 30 min (add enum normalizer to field mapping, test 2–3 enums per entity).

**Confidence:** HIGH — Enum issue identified in existing codebase (BidStatus, RequestStatus enums).

### Pitfall 2: Field Loss in Complex Types (Objects, Arrays)

**What goes wrong:**
Neon has `pricing_breakdown: JSON` (array of objects). GraphQL schema defines `pricingBreakdown: TaskTypePricing[]` (typed array). Mapping assumes JSON string → GQL object array, but type coercion is incomplete.

Example:
```typescript
// Neon model
const bid = {
  pricing_breakdown: '[{"taskType":"setup","hours":10,"cost":2000}]'  // JSON string
};

// Bad mapping (missing parse)
const gqlBid = {
  pricingBreakdown: bid.pricing_breakdown  // Still a string!
};

// Result: Pipeline accepts (no validation), but GQL query returns null for pricingBreakdown
```

**Why it happens:**
Object/array fields require explicit serialization/deserialization. Easy to miss in mapping.

**How to avoid:**
1. In field mapping, explicitly handle JSON fields: `pricingBreakdown: JSON.parse(neonModel.pricing_breakdown || '[]')`
2. In roundtrip test, include objects/arrays in test data and assert they deserialize correctly
3. Type the GQL fields strictly: `pricingBreakdown?: TaskTypePricing[] | null` (not `unknown`)

**Warning signs:**
- GQL queries return null for object/array fields that should have values
- Component tries to iterate over pricingBreakdown and gets "cannot iterate over undefined"
- Roundtrip test fails for any entity with nested structures

**Effort to prevent:** 1–2 hours (handle 3–4 complex fields per entity in mapping).

**Confidence:** HIGH — Bid model has `pricing_breakdown` array; BidWizardData has nested objects.

### Pitfall 3: Link Field Mismatch (ID vs Object)

**What goes wrong:**
Neon stores foreign key: `bid.request_id = 'eng-001'` (string ID). GraphQL schema expects link: `bid.engagement = { id: 'eng-001' }` (object). If mapping sends just the ID, GQL link resolution fails.

Example:
```typescript
// Neon model
const bid = {
  bid_id: 'bid-001',
  request_id: 'eng-001',  // FK to work_requests
  status: 'pending'
};

// Bad mapping (just ID)
const gqlBid = {
  id: 'bid-001',
  engagementId: 'eng-001',  // Wrong! Should be { id: 'eng-001' }
  status: 'pending'
};

// Result: GQL schema doesn't recognize engagementId. Bid.engagement link is empty.
```

**Correct mapping:**
```typescript
const gqlBid = {
  id: 'bid-001',
  engagement: { id: 'eng-001' },  // Correct! Link as object.
  status: 'pending'
};
```

**Why it happens:**
YAML schema defines links with `linkTo` syntax. Links are traversable relationships, not plain IDs. Mapping must create the object structure.

**How to avoid:**
1. Identify all FK fields in Neon model (e.g., `request_id`, `folder_id`)
2. In mapping, convert to link object: `folder: { id: neonModel.folder_id }`
3. Document in field mapping which fields are links
4. Test relationship traversal in roundtrip test: push Bid with engagement link, query back, assert engagement object exists

**Warning signs:**
- Engagement detail page shows 0 bids (should show 5)
- Bid can't be queried by engagement ID
- GQL relationship navigation returns null

**Effort to prevent:** 1–2 hours (identify links per entity, test 1 relationship per entity in roundtrip).

**Confidence:** HIGH — Bid→Engagement link is core Wave 1 relationship.

### Pitfall 4: Mock Response Shape Mismatch

**What goes wrong:**
Unit test mocks GraphQL response as flat: `{ id: 'x', name: 'y' }`. Real GQL response is nested: `{ id: 'x', name: 'y', bids: [{ id: 'b1', price: 100 }] }`. Test passes, component breaks at runtime because it expects nested structure.

**How to avoid:**
1. Define test fixtures matching real GQL response shapes in `test-helpers/fixtures.ts`
2. In unit tests, use fixtures instead of inline mocks
3. Document nested structure in fixtures (comments showing schema)
4. Test component rendering with nested data, not just service logic

**Example:**
```typescript
// test-helpers/fixtures.ts (NEW FILE)
export const ENGAGEMENT_GQL_RESPONSE = {
  id: 'eng-001',
  name: 'HIPAA Assessment',
  status: 'published',
  bids: [
    { id: 'bid-001', status: 'accepted', price: 15000 },
    { id: 'bid-002', status: 'pending', price: 18000 },
  ],
  createdAt: '2026-03-18T10:00:00Z',
};

// In test
mockGql.getById.mockResolvedValue(ENGAGEMENT_GQL_RESPONSE);
const result = await service.getEngagement('eng-001');
expect(result.bids).toHaveLength(2);  // Test catches missing structure
```

**Effort to prevent:** 2–3 hours (create fixtures for 8 entities × 3 response shapes each).

**Confidence:** HIGH — Prevents Pitfall 4 from PITFALLS.md.

### Pitfall 5: Mapping Constants Diverge from Schema

**What goes wrong:**
Field mapping constant says `budget_min: 'budgetMin'`, but GQL schema was updated to use `minimumBudget`. Mapping becomes stale, causing silent mismatches.

**How to avoid:**
1. Document mapping source: add comment above constant noting schema version and last sync date
2. After schema changes (PR #7, PR #8 merges), manually verify mapping is still correct
3. Add schema sync notes to CLAUDE.md: "After schema PR merges, wait 15 min for dataloader, then verify mapping against live GQL introspection"

**Example:**
```typescript
// Field mapping constant
// Last verified: 2026-03-18 against schema v1.0.0 (zerobias-org/schema commit abc123)
// TODO: Re-verify after schema PR #8 merges (Bloom entities)
export const ENGAGEMENT_FIELD_MAPPING = {
  neonToGql: {
    budget_min: 'budgetMin',  // GQL: Engagement.budgetMin
    // ...
  }
};
```

**Effort to prevent:** 30 min (add comments, notes to CLAUDE.md).

**Confidence:** MEDIUM — Schema is stable (no major changes planned for 8 original entities until Phase 6).

---

## Code Examples

Verified patterns from existing codebase:

### Example 1: Existing Neon Mapper (Reference)

**Source:** `src/app/core/mappers/bid-resource.mapper.ts`

```typescript
export function mapBidToBidResource(bid: Bid): SmeMartResource {
  return {
    id: bid.id,
    type: 'bid',
    title: bid.provider_id,  // Provider name would come from join
    status: bid.status,
    createdAt: new Date(bid.created_at),
    fields: {
      price: bid.proposed_price,
      timeline: bid.proposed_timeline,
    }
  };
}
```

**How this pattern applies to Phase 1:**
- Use similar function structure for Neon→GQL mapping
- Keep field mapping centralized in one file (or one constant per entity in field-mappings.ts)
- Don't scatter mapping logic across service methods

### Example 2: Existing Test Helper (Reference)

**Source:** `src/app/test-helpers/angular.ts`

```typescript
export function fakeSmeMartDb() {
  return {
    listRows: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    searchRows: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    getRow: vi.fn().mockResolvedValue(null),
    createRow: vi.fn().mockResolvedValue({}),
    updateRow: vi.fn().mockResolvedValue({}),
    deleteRow: vi.fn().mockResolvedValue(undefined),
  };
}
```

**How to extend for Phase 1 (INFRA-02, INFRA-03):**

```typescript
export function fakePipelineWriteService() {
  return {
    pushEntity: vi.fn().mockResolvedValue(undefined),
    pushEntities: vi.fn().mockResolvedValue(undefined),
    deleteEntity: vi.fn().mockResolvedValue(undefined),
    deleteEntities: vi.fn().mockResolvedValue(undefined),
  };
}

export function fakeGraphqlReadService() {
  return {
    query: vi.fn().mockResolvedValue({
      items: [],
      page: { pageNumber: 1, pageSize: 50, totalCount: 0 }
    }),
    getById: vi.fn().mockResolvedValue(null),
    rawQuery: vi.fn().mockResolvedValue({}),
  };
}
```

**Confidence:** HIGH — Pattern proven with 456+ tests in codebase.

### Example 3: Existing Service Test (Reference)

**Source:** `src/app/core/services/work-requests.service.spec.ts` (lines 1–60)

```typescript
describe('WorkRequestsService', () => {
  let service: WorkRequestsService;
  let mockDb: ReturnType<typeof fakeSmeMartDb>;

  beforeEach(() => {
    mockDb = fakeSmeMartDb();
    mockDb.listRows.mockResolvedValue({ items: [makeEngagementSummaryRow()], totalCount: 1 });

    TestBed.configureTestingModule({
      providers: [
        WorkRequestsService,
        { provide: SmeMartDbService, useValue: mockDb },
        { provide: NotificationService, useValue: fakeNotificationService() },
      ],
    });

    service = TestBed.inject(WorkRequestsService);
  });

  describe('listEngagements', () => {
    it('should call listRows on v_engagement_summary', async () => {
      const result = await service.listEngagements();
      expect(mockDb.listRows).toHaveBeenCalledWith('v_engagement_summary', undefined);
      expect(result.items).toHaveLength(1);
    });
  });
});
```

**How to adapt for Phase 1 (INFRA-04 roundtrip test):**

```typescript
describe('INFRA-04: Engagement Field Roundtrip', () => {
  let service: WorkRequestsService;
  let mockPipeline: ReturnType<typeof fakePipelineWriteService>;
  let mockGql: ReturnType<typeof fakeGraphqlReadService>;

  beforeEach(() => {
    mockPipeline = fakePipelineWriteService();
    mockGql = fakeGraphqlReadService();

    TestBed.configureTestingModule({
      providers: [
        WorkRequestsService,
        { provide: PipelineWriteService, useValue: mockPipeline },
        { provide: GraphqlReadService, useValue: mockGql },
      ],
    });

    service = TestBed.inject(WorkRequestsService);
  });

  it('roundtrip: neon → gql mapping → pipeline → gql query', async () => {
    // Setup
    const neonModel = makeWorkRequest({
      id: 'eng-001',
      title: 'HIPAA Assessment',
      budget_min: '10000',
      budget_max: '25000',
      response_deadline: '2026-04-01',
    });

    // Map to GQL
    const gqlData = {
      id: neonModel.id,
      name: neonModel.title,
      budgetMin: neonModel.budget_min,
      budgetMax: neonModel.budget_max,
      responseDeadline: neonModel.response_deadline,
    };

    // Mock GQL response
    mockGql.getById.mockResolvedValue(gqlData);

    // Call service
    const result = await service.getEngagement('eng-001');

    // Assert all fields present
    expect(result).toBeDefined();
    expect(result.name).toBe('HIPAA Assessment');
    expect(result.budgetMin).toBe('10000');
    expect(result.responseDeadline).toBe('2026-04-01');
  });
});
```

**Confidence:** HIGH — Test pattern proven.

---

## Validation Architecture

> Note: workflow.nyquist_validation not found in .planning/config.json. Treating as enabled per default.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (latest) |
| Config file | `vitest.config.ts` (existing) |
| Quick run command | `npm test -- --run src/app/core/services/work-requests.service.spec.ts` |
| Full suite command | `npm test` (all 456+ tests) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| **INFRA-01** | Field mapping constants created for 8 entities | Manual verification + unit | N/A (constant values verified via code review) | ❌ Wave 0 — Create `src/app/core/field-mappings.ts` |
| **INFRA-02** | PipelineWriteService mock works in tests | Unit | `npm test -- test-helpers` | ❌ Wave 0 — Extend `test-helpers/angular.ts` with `fakePipelineWriteService()` |
| **INFRA-03** | GraphqlReadService mock works in tests | Unit | `npm test -- test-helpers` | ❌ Wave 0 — Extend `test-helpers/angular.ts` with `fakeGraphqlReadService()` |
| **INFRA-04a** | Engagement roundtrip (all 15 fields) | Integration | `npm test -- src/app/core/services/engagement.roundtrip.spec.ts -x` | ❌ Wave 0 — Create `engagement.roundtrip.spec.ts` |
| **INFRA-04b** | Bid roundtrip (all 12 fields) | Integration | `npm test -- src/app/core/services/bid.roundtrip.spec.ts -x` | ❌ Wave 0 — Create `bid.roundtrip.spec.ts` |
| **INFRA-04c-h** | Roundtrip for remaining 6 entities (BidResponse, Note, NoteFolder, ServiceOffering, Review, SmeMartDocument) | Integration | `npm test -- '*.roundtrip.spec.ts'` | ❌ Wave 0 — Create per entity |
| **INFRA-05** | GQL types defined for all 8 entities | Manual verification | N/A (types checked at compile time via TypeScript) | ❌ Wave 0 (or Phase 2) — Create `src/app/core/gql-types/` interfaces or use graphql-codegen |

### Sampling Rate

- **Per task commit:** `npm test -- --run` (affected specs only)
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green (all roundtrip tests passing) before Wave 1 implementation

### Wave 0 Gaps

- [ ] `src/app/core/field-mappings.ts` — Constants for 8 entities (INFRA-01)
- [ ] `src/app/test-helpers/angular.ts` extensions — `fakePipelineWriteService()`, `fakeGraphqlReadService()` (INFRA-02, INFRA-03)
- [ ] `src/app/core/services/engagement.roundtrip.spec.ts` — Field validation test (INFRA-04a)
- [ ] `src/app/core/services/bid.roundtrip.spec.ts` — Field validation test (INFRA-04b)
- [ ] `src/app/core/services/{entity}.roundtrip.spec.ts` × 6 — Remaining entities (INFRA-04c-h)
- [ ] `src/app/core/gql-types/` OR run `graphql-codegen` — GQL interfaces (INFRA-05, optional Phase 1)

**Estimated effort:**
- INFRA-01: 2–3 hours
- INFRA-02, INFRA-03: 1–2 hours
- INFRA-04 (all 8 entities): 4–6 hours
- INFRA-05 (manual): 1 hour; (auto via codegen): 4–6 hours

**Total Phase 1: 8–18 hours** depending on codegen choice.

---

## Open Questions

1. **Enum normalization strategy:** Should enum values be normalized to uppercase in mapping, or handled per-entity? Recommendation: Create a separate enums normalizer file (3–4 enums per entity × 8 entities).

2. **Deep object fields (e.g., `pricing_breakdown`):** Should these be parsed in field mapping, or handled in domain service? Recommendation: Handle in mapping (prevents mutation of objects in domain service).

3. **Backwards compatibility during migration:** Services need to support both Neon and Pipeline+GQL during Wave 1–4. Should SmeMartDbService stay injected, or remove? Recommendation: Keep SmeMartDbService until all 8 entities migrated (Phase 5), then remove.

4. **GQL codegen timing:** Should INFRA-05 use graphql-codegen now, or defer to Phase 2? Recommendation: Defer. Manual interfaces are fast for 8 entities. Auto-gen ROI increases after Bloom entities merge (PR #8), which adds 9 more types.

5. **Test fixture versioning:** If schema changes, how to keep test fixtures in sync? Recommendation: Document schema version in fixtures file, re-verify after each schema PR merge.

---

## Sources

### Primary (HIGH confidence)

- **PipelineWriteService**: `src/app/core/services/pipeline-write.service.ts` (verified, tested)
- **GraphqlReadService**: `src/app/core/services/graphql-read.service.ts` (verified, tested)
- **Existing models**: `src/app/core/models/work-request.model.ts`, `bid.model.ts`, etc. (Neon structure)
- **Existing test helpers**: `src/app/test-helpers/angular.ts`, `factories.ts` (456+ tests proven)
- **STACK.md**: `.planning/research/STACK.md` (technology decisions, verified)
- **ARCHITECTURE.md**: `.planning/research/ARCHITECTURE.md` (dual-path pattern, pattern examples)
- **PITFALLS.md**: `.planning/research/PITFALLS.md` (prevention strategies for critical issues)

### Secondary (MEDIUM confidence)

- **@zerobias-com/zerobias-angular-client v1.1.25** — Wraps Platform SDK, provides typed DI
- **@zerobias-org/ngx-library v0.2.25** — UI components, Material integration
- **Vitest** — Unit test framework (docs: vitest.dev)

### Tertiary (Reference only)

- **GraphQL Code Generator docs** (https://www.graphql-code-generator.com/) — if INFRA-05 chooses auto-gen

---

## Metadata

**Confidence breakdown:**
- **Standard Stack:** HIGH — PipelineWriteService and GraphqlReadService already verified in prod
- **Architecture patterns:** HIGH — Field mapping mirrors existing Neon mappers; service pattern proven
- **Test infrastructure:** HIGH — Extends existing 456+ test suite; pattern proven
- **Pitfalls:** HIGH — Identified from production migration patterns and codebase review
- **GQL codegen:** MEDIUM — Tool is stable; timing is question (defer vs now)

**Research date:** 2026-03-18
**Valid until:** 2026-04-08 (3 weeks — covers Wave 1 migration start)

**Next review trigger:**
- After PR #7 or PR #8 merge (schema changes)
- After first Wave 1 service migration (Engagement/Bid)
- If GQL introspection shows unexpected schema structure

---

*Session: `claude --resume poc/sme-mart`*
