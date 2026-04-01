---
phase: 01-infrastructure-setup
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/core/field-mappings.ts
  - src/app/test-helpers/angular.ts
  - src/app/core/services/engagement.roundtrip.spec.ts
  - src/app/core/services/bid.roundtrip.spec.ts
  - src/app/core/services/bid-response.roundtrip.spec.ts
  - src/app/core/services/note.roundtrip.spec.ts
  - src/app/core/services/note-folder.roundtrip.spec.ts
  - src/app/core/services/service-offering.roundtrip.spec.ts
  - src/app/core/services/review.roundtrip.spec.ts
  - src/app/core/services/document.roundtrip.spec.ts
  - src/app/core/gql-types/engagement.types.ts
  - src/app/core/gql-types/bid.types.ts
  - src/app/core/gql-types/bid-response.types.ts
  - src/app/core/gql-types/note.types.ts
  - src/app/core/gql-types/note-folder.types.ts
  - src/app/core/gql-types/service-offering.types.ts
  - src/app/core/gql-types/review.types.ts
  - src/app/core/gql-types/document.types.ts
  - src/app/test-helpers/gql-fixtures.ts
autonomous: true
requirements:
  - INFRA-01
  - INFRA-02
  - INFRA-03
  - INFRA-04
  - INFRA-05
must_haves:
  truths:
    - All 8 entity types have explicit field mapping constants (snake_case Neon → camelCase GQL)
    - Unit tests can mock PipelineWriteService and GraphqlReadService without real API calls
    - Roundtrip tests verify no fields are lost in Neon → GQL → Neon transformation cycle
    - GraphQL response shapes are documented with TypeScript interfaces for type safety
    - Test fixtures match real GQL response structures (including nested relationships)
  artifacts:
    - path: "src/app/core/field-mappings.ts"
      provides: "Field mapping constants for all 8 entities (ENGAGEMENT_FIELD_MAPPING, BID_FIELD_MAPPING, etc.)"
      min_lines: 200
    - path: "src/app/test-helpers/angular.ts"
      provides: "Mock factories for PipelineWriteService and GraphqlReadService"
      exports: ["fakePipelineWriteService()", "fakeGraphqlReadService()"]
    - path: "src/app/test-helpers/gql-fixtures.ts"
      provides: "GQL response shape fixtures for all 8 entities"
      exports: ["ENGAGEMENT_GQL_FIXTURE", "BID_GQL_FIXTURE", "etc"]
    - path: "src/app/core/gql-types/*.types.ts"
      provides: "TypeScript interfaces for GQL response types (8 files, one per entity)"
      min_lines: 30
    - path: "src/app/core/services/*.roundtrip.spec.ts"
      provides: "Field validation tests for all 8 entities (8 files)"
      pattern: "describe.*roundtrip.*neon.*gql"
  key_links:
    - from: "src/app/core/field-mappings.ts"
      to: "src/app/core/services/*.roundtrip.spec.ts"
      via: "imported in roundtrip tests"
      pattern: "import.*FIELD_MAPPING"
    - from: "src/app/test-helpers/angular.ts"
      to: "src/app/core/services/*.roundtrip.spec.ts"
      via: "mock providers in TestBed"
      pattern: "fake(Pipeline|Graphql)ReadService"
    - from: "src/app/core/gql-types/*.types.ts"
      to: "src/app/test-helpers/gql-fixtures.ts"
      via: "fixture shapes match type contracts"
      pattern: "satisfies.*GqlResponse"

---

<objective>
Establish field mapping infrastructure and test mocks for migrating 8 SME Mart entity types from Neon PostgreSQL to AuditgraphDB. This phase creates no entity migrations — only the tooling foundation that Phases 2–4 depend on.

Purpose: Prevent silent field loss, enable parallel Wave 1–3 migrations, ensure test mocks match real GQL response shapes.

Output:
- Field mapping constants (8 entities)
- Mock service factories for Pipeline and GraphQL
- GQL response type interfaces
- Roundtrip field validation tests (8 entities)
- Test fixtures with realistic GQL response shapes
</objective>

<execution_context>
@/Users/cstacer/.claude/get-shit-done/workflows/execute-plan.md
@/Users/cstacer/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-infrastructure-setup/01-CONTEXT.md
@.planning/phases/01-infrastructure-setup/01-RESEARCH.md

**Canonical reference files (MUST read before implementing):**
@.claude/plans/local/034-gql-schema-migration.md — Full schema YAML for all 8 entity classes
@.claude/plans/local/059-auditgraph-migration.md — Migration approach and field mapping examples

**Existing implementation references:**
@src/app/core/services/pipeline-write.service.ts — PipelineWriteService (already built)
@src/app/core/services/graphql-read.service.ts — GraphqlReadService (already built)
@src/app/core/mappers/bid-resource.mapper.ts — Example mapper pattern
@src/app/test-helpers/angular.ts — Existing test helper factories (fakeSmeMartDb pattern)
@src/app/core/models/work-request.model.ts — WorkRequest/Engagement model (Neon shape)
@src/app/core/models/bid.model.ts — Bid model
</context>

<interfaces>
**Existing Service Signatures (from PipelineWriteService, GraphqlReadService):**

```typescript
// From src/app/core/services/pipeline-write.service.ts
export interface PipelineWriteService {
  pushEntity(className: SmeMartClassName, entity: unknown): Promise<void>;
  pushEntities(className: SmeMartClassName, entities: unknown[]): Promise<void>;
  deleteEntity(className: SmeMartClassName, id: string): Promise<void>;
  deleteEntities(className: SmeMartClassName, ids: string[]): Promise<void>;
}

// From src/app/core/services/graphql-read.service.ts
export interface GraphqlReadService {
  query<T>(
    className: string,
    fields: string[],
    options?: GqlQueryOptions
  ): Promise<GqlQueryResult<T>>;

  getById<T>(
    className: string,
    id: string,
    fields: string[]
  ): Promise<T | null>;

  rawQuery<T>(query: string): Promise<T>;
}

export interface GqlQueryResult<T> {
  items: T[];
  page: GqlPageInfo;
}

export interface GqlPageInfo {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}
```

**Key constants from PipelineWriteService:**
- `SME_MART_CLASS_IDS` — Record mapping class name to UUID
- `SmeMartClassName` — Union type of all class names ('Engagement' | 'Bid' | etc.)
- `BOUNDARY_ID` — Production boundary UUID for GQL queries
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Create field mapping constants for all 8 entities</name>
  <files>src/app/core/field-mappings.ts</files>
  <read_first>
    @src/app/core/models/work-request.model.ts
    @src/app/core/models/bid.model.ts
    @src/app/core/models/note.model.ts
    @src/app/core/models/document.model.ts
    @src/app/core/models/service-offering.model.ts
    @src/app/core/models/review.model.ts
    @.claude/plans/local/034-gql-schema-migration.md
  </read_first>
  <action>
    Create a new file `src/app/core/field-mappings.ts` containing two-way field mapping constants for all 8 entity types. Each entity gets a mapping object with `neonToGql` and `gqlToNeon` properties.

    **Entities to map (in order):**
    1. Engagement (from WorkRequest model — this is the rename)
    2. Bid
    3. BidResponse
    4. Note
    5. NoteFolder
    6. ServiceOffering
    7. Review
    8. SmeMartDocument

    **Mapping structure for each entity:**
    ```typescript
    export const ENGAGEMENT_FIELD_MAPPING = {
      neonToGql: {
        // Neon column (snake_case) → GQL field (camelCase)
        request_id: 'id',
        buyer_zerobias_user_id: 'buyerZerobiasUserId',
        // ... all fields from WorkRequest model
      },
      gqlToNeon: {
        // Reverse mapping for testing
        id: 'request_id',
        buyerZerobiasUserId: 'buyer_zerobias_user_id',
        // ...
      },
      // Document source and last verified date
      sourceSchema: 'zerobias-org/schema PR #7',
      lastVerified: '2026-03-18',
    };
    ```

    **Field mapping rules:**
    - Read actual column names from existing Neon models (work-request.model.ts, bid.model.ts, etc.)
    - Read actual GQL field names from schema YAML (034-gql-schema-migration.md)
    - For enum fields (status, budgetType, etc.): Document which enums need uppercase normalization
    - For complex fields (JSON arrays like `pricing_breakdown`): Document that they need JSON.parse()
    - For link fields (foreign keys like `request_id` → engagement link): Document the pattern
    - For timestamp fields (created_at, updated_at): Keep as string in both directions (service handles parsing)

    **Special handling:**
    - **WorkRequest → Engagement**: The Neon model is called WorkRequest; GQL entity is Engagement. Map accordingly (this is the breaking change).
    - **Title → Name**: Work requests have `title` field; Engagement GQL entity uses `name` (or check schema for correct field)
    - **JSON fields**: Document which fields need JSON.parse() / JSON.stringify()
    - **Enum normalization**: Note which enums (status, budgetType, etc.) need value transformation

    **Export all constants from file:**
    - ENGAGEMENT_FIELD_MAPPING
    - BID_FIELD_MAPPING
    - BID_RESPONSE_FIELD_MAPPING
    - NOTE_FIELD_MAPPING
    - NOTE_FOLDER_FIELD_MAPPING
    - SERVICE_OFFERING_FIELD_MAPPING
    - REVIEW_FIELD_MAPPING
    - DOCUMENT_FIELD_MAPPING (for SmeMartDocument)

    **Verify field counts match source:** For each entity, count fields in neonToGql and ensure they match the number of fields in the Neon model + all GQL schema fields. Document any field additions/removals (e.g., metadata fields added in GQL).

    **Include a helper function for mapping:**
    ```typescript
    export function mapNeonToGql<T>(
      neonModel: unknown,
      fieldMapping: Record<string, string>
    ): T {
      const gqlData: Record<string, unknown> = {};
      for (const [neonField, gqlField] of Object.entries(fieldMapping)) {
        if (neonField in (neonModel as Record<string, unknown>)) {
          gqlData[gqlField] = (neonModel as Record<string, unknown>)[neonField];
        }
      }
      return gqlData as T;
    }

    export function mapGqlToNeon<T>(
      gqlModel: unknown,
      fieldMapping: Record<string, string>
    ): T {
      const neonData: Record<string, unknown> = {};
      for (const [gqlField, neonField] of Object.entries(fieldMapping)) {
        if (gqlField in (gqlModel as Record<string, unknown>)) {
          neonData[neonField] = (gqlModel as Record<string, unknown>)[gqlField];
        }
      }
      return neonData as T;
    }
    ```
  </action>
  <verify>
    - File exists: `src/app/core/field-mappings.ts`
    - Contains 8 export constants: ENGAGEMENT_FIELD_MAPPING, BID_FIELD_MAPPING, etc.
    - Each constant has neonToGql and gqlToNeon objects
    - mapNeonToGql and mapGqlToNeon helper functions exported
    - No TypeScript errors: `npx tsc --noEmit src/app/core/field-mappings.ts`
  </verify>
  <done>
    Field mapping constants created for all 8 entities with bidirectional mappings. Helper functions mapNeonToGql() and mapGqlToNeon() are exported and callable from services and tests.
  </done>
</task>

<task type="auto">
  <name>Task 2: Extend test helpers with Pipeline and GraphQL mock factories</name>
  <files>src/app/test-helpers/angular.ts</files>
  <read_first>
    @src/app/test-helpers/angular.ts
    @src/app/core/services/pipeline-write.service.ts
    @src/app/core/services/graphql-read.service.ts
  </read_first>
  <action>
    Extend the existing `src/app/test-helpers/angular.ts` file with two new mock factory functions that follow the established pattern of `fakeSmeMartDb()`.

    **Add these exports to angular.ts (append to file, do not remove existing fakes):**

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
          page: { pageNumber: 1, pageSize: 50, totalCount: 0 },
        }),
        getById: vi.fn().mockResolvedValue(null),
        rawQuery: vi.fn().mockResolvedValue({}),
      };
    }
    ```

    **Type annotations (use ReturnType for consistency):**
    - fakePipelineWriteService should be typed as if it returns the PipelineWriteService interface (use vi.fn with generic MockedFunction types if available, or just return untyped like existing fakes)
    - fakeGraphqlReadService should return a GqlQueryResult-like shape

    **Pattern matching:** Ensure these follow the same vi.fn().mockResolvedValue pattern as existing fakeSmeMartDb() — no async functions, just spy objects.

    **Placement:** Add these new functions at the end of the file, after existing fake factories.
  </action>
  <verify>
    - `src/app/test-helpers/angular.ts` contains `export function fakePipelineWriteService()`
    - `src/app/test-helpers/angular.ts` contains `export function fakeGraphqlReadService()`
    - Both functions return objects with vi.fn() mocks for all service methods
    - No TypeScript errors: `npx tsc --noEmit src/app/test-helpers/angular.ts`
    - Existing fakes (fakeSmeMartDb, etc.) remain unchanged
  </verify>
  <done>
    Mock factory functions for PipelineWriteService and GraphqlReadService are exported from test-helpers and can be used in unit tests via TestBed.configureTestingModule providers.
  </done>
</task>

<task type="auto">
  <name>Task 3: Create GQL response type interfaces for all 8 entities</name>
  <files>
    src/app/core/gql-types/engagement.types.ts
    src/app/core/gql-types/bid.types.ts
    src/app/core/gql-types/bid-response.types.ts
    src/app/core/gql-types/note.types.ts
    src/app/core/gql-types/note-folder.types.ts
    src/app/core/gql-types/service-offering.types.ts
    src/app/core/gql-types/review.types.ts
    src/app/core/gql-types/document.types.ts
  </files>
  <read_first>
    @.claude/plans/local/034-gql-schema-migration.md
    @src/app/core/field-mappings.ts (from Task 1)
  </read_first>
  <action>
    Create a new directory `src/app/core/gql-types/` and generate one TypeScript interface file per entity. These interfaces describe the shape of GQL responses.

    **For each entity, create a file with:**
    - A `Gql{EntityName}Response` interface matching the GQL schema fields
    - Include all fields that will be queried (use camelCase field names per GQL schema)
    - Mark optional fields with `?`
    - Include nested relationship fields if applicable (e.g., `bids?: GqlBidResponse[]` for Engagement)

    **Files to create (one per entity):**

    1. **engagement.types.ts** — Engagement response type
       - Fields: id, name, description, category, buyerZerobiasUserId, budgetType, budgetMin, budgetMax, timeline, responseDeadline, status, engagementTag, zerobiasTagId, zerobiasTaskId, createdAt, updatedAt
       - Optional nested: bids?: GqlBidResponse[]

    2. **bid.types.ts** — Bid response type
       - Fields: id, engagementId, providerId, coverLetter, proposedPrice, proposedTimeline, executiveSummary, teamDescription, status, wizardData, wizardStep, createdAt, updatedAt
       - Optional nested: engagement?: GqlEngagementResponse

    3. **bid-response.types.ts** — BidResponse type
       - Fields: TBD (check schema YAML for BidResponse class fields)

    4. **note.types.ts** — Note response type
       - Fields: TBD

    5. **note-folder.types.ts** — NoteFolder response type
       - Fields: TBD
       - Optional nested: notes?: GqlNoteResponse[], parentFolder?: GqlNoteFolderResponse

    6. **service-offering.types.ts** — ServiceOffering response type
       - Fields: TBD

    7. **review.types.ts** — Review response type
       - Fields: TBD

    8. **document.types.ts** — SmeMartDocument response type
       - Fields: TBD

    **General pattern for each file:**
    ```typescript
    // src/app/core/gql-types/engagement.types.ts
    export interface GqlEngagementResponse {
      id: string;
      name: string;
      description?: string;
      category?: string;
      buyerZerobiasUserId: string;
      budgetType?: string;
      budgetMin?: number | string;
      budgetMax?: number | string;
      timeline?: string;
      responseDeadline?: string;
      status: string;
      engagementTag?: string;
      zerobiasTagId?: string;
      zerobiasTaskId?: string;
      createdAt: string;
      updatedAt: string;
      // Optional nested relationships
      bids?: GqlBidResponse[];
    }

    export interface GqlBidResponse {
      id: string;
      engagementId: string;
      providerId: string;
      coverLetter?: string;
      proposedPrice?: number | string;
      proposedTimeline?: string;
      executiveSummary?: string;
      teamDescription?: string;
      status: string;
      wizardData?: unknown; // JSON object
      wizardStep?: number | string;
      createdAt: string;
      updatedAt: string;
      // Optional reverse relationship
      engagement?: GqlEngagementResponse;
    }
    ```

    **Field type guidelines:**
    - IDs: `string` (UUID)
    - Dates: `string` (ISO 8601)
    - Numbers: `number` or `string` (depending on how GQL returns them; budget fields may be strings)
    - JSON objects: `unknown` (or typed if structure is known)
    - Enums: `string` (actual enum values: 'PUBLISHED', 'DRAFT', etc.)
    - Relationships: Optional nested object or array

    **Create a barrel export file for convenience:**
    Create `src/app/core/gql-types/index.ts` that exports all types:
    ```typescript
    export * from './engagement.types';
    export * from './bid.types';
    export * from './bid-response.types';
    export * from './note.types';
    export * from './note-folder.types';
    export * from './service-offering.types';
    export * from './review.types';
    export * from './document.types';
    ```
  </action>
  <verify>
    - Directory `src/app/core/gql-types/` exists
    - 8 type files created (engagement.types.ts, bid.types.ts, etc.)
    - Barrel export file exists: `src/app/core/gql-types/index.ts`
    - No TypeScript errors: `npx tsc --noEmit src/app/core/gql-types/`
    - Each interface can be imported: `import { GqlEngagementResponse } from '@/core/gql-types'`
  </verify>
  <done>
    TypeScript interfaces defined for all 8 GQL entity response types. Nested relationships are documented. Barrel export enables clean imports in tests and services.
  </done>
</task>

<task type="auto">
  <name>Task 4: Create GQL response fixtures matching real GraphQL shapes</name>
  <files>src/app/test-helpers/gql-fixtures.ts</files>
  <read_first>
    @src/app/core/gql-types/index.ts (from Task 3)
    @.claude/plans/local/034-gql-schema-migration.md
  </read_first>
  <action>
    Create a new file `src/app/test-helpers/gql-fixtures.ts` containing realistic GQL response fixtures for all 8 entity types. These fixtures are used by roundtrip tests to mock GraphQL responses.

    **Pattern for fixtures:**
    ```typescript
    // src/app/test-helpers/gql-fixtures.ts
    import type { GqlEngagementResponse, GqlBidResponse } from '@/core/gql-types';

    // Engagement with nested Bids (realistic nested structure)
    export const ENGAGEMENT_GQL_FIXTURE: GqlEngagementResponse = {
      id: 'eng-001',
      name: 'HIPAA Compliance Assessment',
      description: 'Full compliance review for healthcare provider',
      category: 'compliance',
      buyerZerobiasUserId: 'user-buyer-001',
      budgetType: 'fixed',
      budgetMin: '10000',
      budgetMax: '25000',
      timeline: '30 days',
      responseDeadline: '2026-04-01',
      status: 'PUBLISHED',  // Enum: uppercase
      engagementTag: 'sme-mart.engagement.hipaa',
      zerobiasTagId: 'tag-uuid-001',
      zerobiasTaskId: 'task-uuid-001',
      createdAt: '2026-03-18T10:00:00Z',
      updatedAt: '2026-03-18T10:00:00Z',
      bids: [
        {
          id: 'bid-001',
          engagementId: 'eng-001',
          providerId: 'provider-001',
          coverLetter: 'We specialize in healthcare compliance...',
          proposedPrice: 18000,
          proposedTimeline: '4 weeks',
          executiveSummary: 'Complete HIPAA audit',
          teamDescription: '5 person team with 20+ years experience',
          status: 'PENDING',
          wizardData: { taskTypes: ['audit', 'documentation'] },
          wizardStep: 5,
          createdAt: '2026-03-18T11:00:00Z',
          updatedAt: '2026-03-18T11:00:00Z',
        },
      ],
    };

    // Standalone Bid (flat, no nested Engagement)
    export const BID_GQL_FIXTURE: GqlBidResponse = {
      id: 'bid-002',
      engagementId: 'eng-001',
      providerId: 'provider-002',
      coverLetter: 'Alternative proposal...',
      proposedPrice: 15000,
      proposedTimeline: '6 weeks',
      executiveSummary: 'Phased HIPAA implementation',
      teamDescription: '3 person consulting team',
      status: 'PENDING',
      wizardData: { taskTypes: ['implementation', 'training'] },
      wizardStep: 3,
      createdAt: '2026-03-18T12:00:00Z',
      updatedAt: '2026-03-18T12:00:00Z',
    };

    // Note with NoteFolder parent (relationship example)
    export const NOTE_GQL_FIXTURE: GqlNoteResponse = {
      id: 'note-001',
      engagementId: 'eng-001',
      title: 'Initial Assessment',
      content: 'Preliminary findings...',
      noteFolderId: 'folder-001',
      createdAt: '2026-03-18T13:00:00Z',
      updatedAt: '2026-03-18T13:00:00Z',
      noteFolder: {
        id: 'folder-001',
        name: 'Assessment Phase',
        parentFolderId: null,
        createdAt: '2026-03-18T12:00:00Z',
        updatedAt: '2026-03-18T12:00:00Z',
      },
    };

    // NoteFolder with parent/child hierarchy
    export const NOTE_FOLDER_GQL_FIXTURE: GqlNoteFolderResponse = {
      id: 'folder-001',
      engagementId: 'eng-001',
      name: 'Assessment Phase',
      parentFolderId: null,
      createdAt: '2026-03-18T12:00:00Z',
      updatedAt: '2026-03-18T12:00:00Z',
      notes: [
        {
          id: 'note-001',
          title: 'Initial Assessment',
          content: 'Findings...',
          noteFolderId: 'folder-001',
          createdAt: '2026-03-18T13:00:00Z',
          updatedAt: '2026-03-18T13:00:00Z',
        },
      ],
    };

    // ServiceOffering (standalone catalog item)
    export const SERVICE_OFFERING_GQL_FIXTURE: GqlServiceOfferingResponse = { /* ... */ };

    // Review (simple rating entity)
    export const REVIEW_GQL_FIXTURE: GqlReviewResponse = { /* ... */ };

    // SmeMartDocument (file/document attachment)
    export const DOCUMENT_GQL_FIXTURE: GqlDocumentResponse = { /* ... */ };

    // BidResponse (response to a bid)
    export const BID_RESPONSE_GQL_FIXTURE: GqlBidResponseResponse = { /* ... */ };
    ```

    **Fixture design rules:**
    - Include all non-null fields (matching schema requirements)
    - Use realistic test data (e.g., "HIPAA Assessment" not "Test Engagement")
    - Include one nested relationship example per entity (to test relationship traversal)
    - Use realistic UUIDs (generated or placeholder format)
    - Use ISO 8601 timestamps
    - Document nested structure with comments
    - Export each fixture with a descriptive name (e.g., ENGAGEMENT_GQL_FIXTURE not just FIXTURE)

    **For entities with TBD fields:** Reference the schema YAML (034-gql-schema-migration.md) to determine actual field names and types, then create fixtures accordingly.
  </action>
  <verify>
    - File exists: `src/app/test-helpers/gql-fixtures.ts`
    - Exports 8 fixtures (ENGAGEMENT_GQL_FIXTURE, BID_GQL_FIXTURE, etc.)
    - Each fixture is typed with corresponding GQL interface from gql-types
    - Fixtures include realistic data and nested relationships
    - No TypeScript errors: `npx tsc --noEmit src/app/test-helpers/gql-fixtures.ts`
  </verify>
  <done>
    GQL response fixtures created for all 8 entities, including nested relationship examples. Fixtures are typed with GQL interfaces and ready for use in roundtrip tests.
  </done>
</task>

<task type="auto">
  <name>Task 5: Create roundtrip field validation tests for Engagement and Bid (Wave 1 entities)</name>
  <files>
    src/app/core/services/engagement.roundtrip.spec.ts
    src/app/core/services/bid.roundtrip.spec.ts
  </files>
  <read_first>
    @src/app/core/field-mappings.ts
    @src/app/test-helpers/angular.ts
    @src/app/test-helpers/gql-fixtures.ts
    @src/app/core/gql-types/index.ts
    @src/app/core/models/work-request.model.ts
    @src/app/core/models/bid.model.ts
  </read_first>
  <action>
    Create two roundtrip test files that validate field mapping for Engagement and Bid (Wave 1 entities). These tests verify that no fields are lost in the Neon → GQL → Neon transformation cycle.

    **Test structure for engagement.roundtrip.spec.ts:**
    ```typescript
    import { describe, it, expect, beforeEach } from 'vitest';
    import { mapNeonToGql, mapGqlToNeon, ENGAGEMENT_FIELD_MAPPING } from '@/core/field-mappings';
    import { ENGAGEMENT_GQL_FIXTURE } from '@/test-helpers/gql-fixtures';
    import type { GqlEngagementResponse } from '@/core/gql-types';
    import { makeWorkRequest } from '@/test-helpers/factories';

    describe('INFRA-04: Engagement Roundtrip Field Validation', () => {
      describe('Neon → GQL transformation', () => {
        it('should map all Neon WorkRequest fields to GQL camelCase', () => {
          const neonModel = makeWorkRequest({
            id: 'eng-001',
            title: 'HIPAA Assessment',
            description: 'Compliance review',
            category: 'compliance',
            buyer_zerobias_user_id: 'user-123',
            budget_type: 'fixed',
            budget_min: '10000',
            budget_max: '25000',
            timeline: '30 days',
            response_deadline: '2026-04-01',
            status: 'published',
            engagement_tag: 'sme-mart.eng.hipaa',
            zerobias_tag_id: 'tag-001',
            zerobias_task_id: 'task-001',
            created_at: '2026-03-18T10:00:00Z',
            updated_at: '2026-03-18T10:00:00Z',
          });

          const gqlData = mapNeonToGql<GqlEngagementResponse>(
            neonModel,
            ENGAGEMENT_FIELD_MAPPING.neonToGql
          );

          // Verify critical fields are mapped
          expect(gqlData.id).toBe('eng-001');
          expect(gqlData.name).toBe('HIPAA Assessment');  // title → name
          expect(gqlData.description).toBe('Compliance review');
          expect(gqlData.category).toBe('compliance');
          expect(gqlData.buyerZerobiasUserId).toBe('user-123');
          expect(gqlData.budgetType).toBe('fixed');
          expect(gqlData.budgetMin).toBe('10000');
          expect(gqlData.budgetMax).toBe('25000');
          expect(gqlData.timeline).toBe('30 days');
          expect(gqlData.responseDeadline).toBe('2026-04-01');
          expect(gqlData.status).toBe('published');
          expect(gqlData.engagementTag).toBe('sme-mart.eng.hipaa');
          expect(gqlData.zerobiasTagId).toBe('tag-001');
          expect(gqlData.zerobiasTaskId).toBe('task-001');
          expect(gqlData.createdAt).toBe('2026-03-18T10:00:00Z');
          expect(gqlData.updatedAt).toBe('2026-03-18T10:00:00Z');
        });

        it('should not lose fields in Neon → GQL mapping', () => {
          const neonModel = makeWorkRequest({
            id: 'eng-001',
            title: 'Test',
            description: 'Desc',
            category: 'cat',
            buyer_zerobias_user_id: 'user-123',
            budget_type: 'fixed',
            budget_min: '1000',
            budget_max: '5000',
            timeline: '2 weeks',
            response_deadline: '2026-04-01',
            status: 'published',
            engagement_tag: 'tag',
            zerobias_tag_id: 'tag-id',
            zerobias_task_id: 'task-id',
            created_at: '2026-03-18T10:00:00Z',
            updated_at: '2026-03-18T10:00:00Z',
          });

          const gqlData = mapNeonToGql(neonModel, ENGAGEMENT_FIELD_MAPPING.neonToGql);
          const gqlKeys = Object.keys(gqlData || {});

          // Verify key field counts (should have all mapped fields)
          expect(gqlKeys.length).toBeGreaterThanOrEqual(15); // At least 15 fields

          // Verify no undefined values for critical fields
          expect(gqlData.id).toBeDefined();
          expect(gqlData.name).toBeDefined();
          expect(gqlData.status).toBeDefined();
          expect(gqlData.createdAt).toBeDefined();
        });
      });

      describe('GQL → Neon reverse transformation', () => {
        it('should reverse-map all GQL fields back to Neon snake_case', () => {
          const gqlData = ENGAGEMENT_GQL_FIXTURE;

          const neonModel = mapGqlToNeon(gqlData, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);

          expect(neonModel.request_id || neonModel.id).toBeDefined();
          expect(neonModel.title || neonModel.name).toBeDefined();
          expect(neonModel.description).toBeDefined();
          expect(neonModel.buyer_zerobias_user_id || neonModel.buyerZerobiasUserId).toBeDefined();
          expect(neonModel.budget_min || neonModel.budgetMin).toBeDefined();
        });
      });

      describe('Roundtrip: Neon → GQL → Neon', () => {
        it('should preserve all fields in complete roundtrip cycle', () => {
          // 1. Start with Neon model
          const originalNeon = makeWorkRequest({
            id: 'eng-001',
            title: 'HIPAA Assessment',
            description: 'Full compliance review',
            category: 'compliance',
            buyer_zerobias_user_id: 'user-buyer-001',
            budget_type: 'fixed',
            budget_min: '10000',
            budget_max: '25000',
            timeline: '30 days',
            response_deadline: '2026-04-01',
            status: 'published',
            engagement_tag: 'sme-mart.eng.hipaa',
            zerobias_tag_id: 'tag-uuid-001',
            zerobias_task_id: 'task-uuid-001',
            created_at: '2026-03-18T10:00:00Z',
            updated_at: '2026-03-18T10:00:00Z',
          });

          // 2. Map to GQL
          const gqlData = mapNeonToGql<GqlEngagementResponse>(
            originalNeon,
            ENGAGEMENT_FIELD_MAPPING.neonToGql
          );
          expect(gqlData.id).toBe('eng-001');
          expect(gqlData.name).toBe('HIPAA Assessment');

          // 3. Map back to Neon
          const roundtrippedNeon = mapGqlToNeon(gqlData, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);

          // 4. Verify key fields survived roundtrip
          expect(roundtrippedNeon.id || roundtrippedNeon.request_id).toBe('eng-001');
          expect(roundtrippedNeon.title).toBe('HIPAA Assessment');
          expect(roundtrippedNeon.budget_min).toBe('10000');
          expect(roundtrippedNeon.response_deadline).toBe('2026-04-01');
        });
      });
    });
    ```

    **Test structure for bid.roundtrip.spec.ts:**
    - Similar pattern to engagement.roundtrip.spec.ts
    - Test all Bid model fields (bid_id, request_id, provider_id, cover_letter, proposed_price, proposed_timeline, executive_summary, team_description, status, wizard_data, wizard_step, created_at, updated_at)
    - Include a test for JSON field handling (wizard_data should be parsed/stringified correctly)
    - Test the engagement_id → engagement link mapping (if applicable)

    **Key testing rules:**
    - Use `makeWorkRequest()` and `makeBid()` from factories to create test data
    - Use fixtures (ENGAGEMENT_GQL_FIXTURE, BID_GQL_FIXTURE) to mock real GQL responses
    - Assert that all fields are present (not undefined, not null unless schema allows)
    - Test enum value handling (uppercase/lowercase normalization if needed)
    - For complex fields (JSON, arrays), verify they're parsed correctly
    - Test relationship fields (e.g., bid.engagement link)
  </action>
  <verify>
    - Files exist: `src/app/core/services/engagement.roundtrip.spec.ts` and `bid.roundtrip.spec.ts`
    - Both files describe roundtrip tests for field mapping
    - Tests use makeWorkRequest/makeBid factory functions
    - Tests assert no field loss in Neon → GQL → Neon cycle
    - Tests import and use field mapping constants
    - Tests run and pass: `npm test -- --run engagement.roundtrip.spec.ts bid.roundtrip.spec.ts`
  </verify>
  <done>
    Roundtrip field validation tests created for Engagement and Bid (Wave 1 entities). Tests verify that no fields are lost in transformation cycles and that field mappings are accurate.
  </done>
</task>

<task type="auto">
  <name>Task 6: Create roundtrip tests for remaining 6 entities (Wave 2 & 3)</name>
  <files>
    src/app/core/services/bid-response.roundtrip.spec.ts
    src/app/core/services/note.roundtrip.spec.ts
    src/app/core/services/note-folder.roundtrip.spec.ts
    src/app/core/services/service-offering.roundtrip.spec.ts
    src/app/core/services/review.roundtrip.spec.ts
    src/app/core/services/document.roundtrip.spec.ts
  </files>
  <read_first>
    @src/app/core/field-mappings.ts
    @src/app/test-helpers/gql-fixtures.ts
    @src/app/core/gql-types/index.ts
    @src/app/core/services/engagement.roundtrip.spec.ts (pattern reference from Task 5)
  </read_first>
  <action>
    Create 6 additional roundtrip test files following the same pattern as engagement.roundtrip.spec.ts and bid.roundtrip.spec.ts. Each file validates field mapping for one entity type.

    **Files to create (in order):**
    1. bid-response.roundtrip.spec.ts — BidResponse entity tests
    2. note.roundtrip.spec.ts — Note entity tests
    3. note-folder.roundtrip.spec.ts — NoteFolder entity tests
    4. service-offering.roundtrip.spec.ts — ServiceOffering entity tests
    5. review.roundtrip.spec.ts — Review entity tests
    6. document.roundtrip.spec.ts — SmeMartDocument entity tests

    **For each test file, follow this structure:**
    ```typescript
    import { describe, it, expect } from 'vitest';
    import { mapNeonToGql, mapGqlToNeon, [ENTITY]_FIELD_MAPPING } from '@/core/field-mappings';
    import { [ENTITY]_GQL_FIXTURE } from '@/test-helpers/gql-fixtures';
    import type { Gql[Entity]Response } from '@/core/gql-types';
    import { make[Entity] } from '@/test-helpers/factories'; // Use appropriate factory

    describe('INFRA-04: [Entity] Roundtrip Field Validation', () => {
      describe('Neon → GQL transformation', () => {
        it('should map all Neon [Entity] fields to GQL camelCase', () => {
          // Create test model with all fields
          const neonModel = make[Entity]({
            // All fields populated
          });

          const gqlData = mapNeonToGql<Gql[Entity]Response>(
            neonModel,
            [ENTITY]_FIELD_MAPPING.neonToGql
          );

          // Assert all critical fields are mapped
          expect(gqlData.id).toBeDefined();
          expect(gqlData.createdAt).toBeDefined();
          // ... assert other key fields
        });

        it('should not lose fields in Neon → GQL mapping', () => {
          const neonModel = make[Entity]();
          const gqlData = mapNeonToGql(neonModel, [ENTITY]_FIELD_MAPPING.neonToGql);
          const gqlKeys = Object.keys(gqlData || {});

          // Should have minimum expected field count
          expect(gqlKeys.length).toBeGreaterThanOrEqual(5); // Adjust per entity
        });
      });

      describe('GQL → Neon reverse transformation', () => {
        it('should reverse-map all GQL fields back to Neon snake_case', () => {
          const gqlData = [ENTITY]_GQL_FIXTURE;
          const neonModel = mapGqlToNeon(gqlData, [ENTITY]_FIELD_MAPPING.gqlToNeon);

          // Verify reverse mapping works
          expect(neonModel).toBeDefined();
          // Check a few key fields exist in snake_case
        });
      });

      describe('Roundtrip: Neon → GQL → Neon', () => {
        it('should preserve all fields in complete roundtrip cycle', () => {
          const originalNeon = make[Entity]({ /* full data */ });
          const gqlData = mapNeonToGql<Gql[Entity]Response>(
            originalNeon,
            [ENTITY]_FIELD_MAPPING.neonToGql
          );
          const roundtrippedNeon = mapGqlToNeon(gqlData, [ENTITY]_FIELD_MAPPING.gqlToNeon);

          // Verify key fields survived
          expect(roundtrippedNeon.id).toBe(originalNeon.id);
          // ... assert other critical fields
        });
      });
    });
    ```

    **Entity-specific considerations:**

    **BidResponse:** Test that it maps correctly to a response entity (confirm field names from schema YAML). If it links to Bid, test the relationship.

    **Note:** Test title, content, folder relationship (parentFolderId). Verify optional fields (if structure allows null/undefined).

    **NoteFolder:** Test parent-child hierarchy (parentFolderId), and verify folder nesting is preserved in GQL response. Include nested notes in fixture.

    **ServiceOffering:** Test catalog fields (title, description, price, availability, etc.). Likely simpler than Engagement with fewer relationships.

    **Review:** Test rating, reviewer ID, content fields. Verify link to engagement/bid/provider if applicable.

    **SmeMartDocument:** Test file metadata (name, size, mimeType, url), engagement/note attachment links. Verify JSON fields if any (metadata object).

    **Special handling per entity:**
    - **Nested relationships:** Include assertions that parent/child links are preserved
    - **JSON fields:** Add explicit JSON.parse/JSON.stringify assertions if applicable
    - **Enum fields:** Document enum normalization (uppercase, etc.)
    - **File paths/URLs:** Ensure string fields are preserved without truncation
  </action>
  <verify>
    - 6 files created: bid-response.roundtrip.spec.ts, note.roundtrip.spec.ts, etc.
    - Each file has describe block: "INFRA-04: [Entity] Roundtrip Field Validation"
    - Each file tests both neonToGql and gqlToNeon mappings
    - Each file includes roundtrip test (Neon → GQL → Neon)
    - All tests import from field-mappings, gql-fixtures, gql-types
    - All 8 roundtrip tests pass: `npm test -- --run '*.roundtrip.spec.ts'`
  </verify>
  <done>
    Roundtrip field validation tests created for all 6 remaining entities. Complete test coverage for INFRA-04 across all 8 entity types (Wave 1, 2, and 3).
  </done>
</task>

</tasks>

<verification>
**Phase 1 Infrastructure Complete when:**

1. **INFRA-01 (Field Mapping Constants):**
   - `src/app/core/field-mappings.ts` exists
   - All 8 entities have neonToGql and gqlToNeon mappings
   - mapNeonToGql() and mapGqlToNeon() helper functions exported
   - No TypeScript errors

2. **INFRA-02 (PipelineWriteService Mock):**
   - `src/app/test-helpers/angular.ts` exports `fakePipelineWriteService()`
   - Mock has pushEntity, pushEntities, deleteEntity, deleteEntities methods
   - All are vi.fn().mockResolvedValue() spies
   - Used in TestBed providers: `{ provide: PipelineWriteService, useValue: fakePipelineWriteService() }`

3. **INFRA-03 (GraphqlReadService Mock):**
   - `src/app/test-helpers/angular.ts` exports `fakeGraphqlReadService()`
   - Mock has query, getById, rawQuery methods
   - Returns GqlQueryResult shape with items array and page info
   - Used in TestBed providers

4. **INFRA-04 (Roundtrip Field Validation):**
   - 8 roundtrip test files created (one per entity)
   - Each test validates Neon → GQL → Neon transformations
   - Tests assert no fields are lost
   - All tests pass: `npm test -- --run '*.roundtrip.spec.ts'`
   - Pattern: makeEntity() → mapNeonToGql() → assert → mapGqlToNeon() → assert

5. **INFRA-05 (GQL Codegen / Type Interfaces):**
   - `src/app/core/gql-types/` directory created
   - 8 TypeScript interface files created (one per entity)
   - Each interface matches GQL response structure (camelCase fields)
   - Barrel export `src/app/core/gql-types/index.ts` exists
   - No TypeScript errors: `npx tsc --noEmit src/app/core/gql-types/`

**Automated verification commands (run at end of phase):**
```bash
npm test -- --run '*.roundtrip.spec.ts'  # All roundtrip tests pass
npx tsc --noEmit                         # No TypeScript errors
grep -r "ENGAGEMENT_FIELD_MAPPING\|BID_FIELD_MAPPING" src/app/core/field-mappings.ts  # All 8 mappings exist
```
</verification>

<success_criteria>
**Phase 1 is complete when:**

✓ All 8 entities have bidirectional field mapping constants (INFRA-01)
✓ PipelineWriteService and GraphqlReadService mocks created for unit tests (INFRA-02, INFRA-03)
✓ Roundtrip field validation tests verify no fields lost in Neon → GQL → Neon cycle (INFRA-04)
✓ GraphQL response type interfaces defined for all 8 entities (INFRA-05)
✓ Test fixtures with realistic GQL response shapes created (supporting INFRA-04)
✓ All roundtrip tests pass with 100% field coverage
✓ Zero TypeScript compilation errors
✓ Phase 1 unblocks Phase 2: Wave 1 service migrations can now begin (workRequestsService, bidsService)

**Ready for Phase 2 when:**
- All 5 INFRA requirements satisfied
- All roundtrip tests green
- No undefined field mappings (all 8 entities covered)
- Mapping constants documented with schema version and last verified date
</success_criteria>

<output>
After completion, create `.planning/phases/01-infrastructure-setup/01-PLAN-SUMMARY.md` documenting:
1. What was built (field mappings, mocks, roundtrip tests)
2. How many entities covered (8/8)
3. Test coverage (all roundtrip tests passing)
4. Blockers removed (field mapping prevents Pitfall 2: field loss)
5. What Phase 2 depends on (all INFRA artifacts now available)
</output>
