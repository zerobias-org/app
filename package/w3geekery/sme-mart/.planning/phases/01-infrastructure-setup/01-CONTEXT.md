# Phase 1: Infrastructure Setup - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Create field mapping constants, test mock infrastructure, roundtrip field tests, and GQL codegen for the 8 existing entity types. This is the foundation that enables Waves 1-3 (entity migrations in Phases 2-4). No entity migration happens in this phase — only tooling.

Bloom entity types (9 new) are excluded from this phase — they're blocked on PR #8 and will be handled in Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Field Mapping Location
- Claude's discretion on where to place mapping constants (options: extend mappers/, new gql-mappings/ dir, or inline in services)
- Claude's discretion on mapping format (two-way map objects vs transform functions)

### GQL Codegen Approach
- Claude's discretion on codegen source (live introspection, YAML parsing, or manual interfaces)
- Bloom entity interfaces: **wait for PR #8** — don't stub them. Phase 1 covers only the 8 existing entities.

### Model Evolution
- **WorkRequest → Engagement rename**: Align code with GQL schema name and Brian's terminology. All references to WorkRequest become Engagement. This is a deliberate breaking change within the codebase.
- Model naming convention: Claude decides whether to replace snake_case models with camelCase GQL models, keep snake_case and map at service layer, or use parallel models. The key constraint is: **Engagement** is the name, not WorkRequest.

### Claude's Discretion
- Field mapping file location and structure
- Codegen tooling choice and source
- Whether to replace existing snake_case models or map at service boundary
- Mock factory design (extend existing `fakeSmeMartDb()` pattern or new pattern for Pipeline+GQL)
- Roundtrip test structure and assertion strategy

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema Definitions
- `.claude/plans/local/034-gql-schema-migration.md` — Full schema YAML for all 8 entity classes (fields, enums, links, viewProperties)
- `.claude/plans/local/059-auditgraph-migration.md` — Migration approach, wave order, field mapping examples

### Existing Services (swap targets)
- `src/app/core/services/pipeline-write.service.ts` — PipelineWriteService (already built, uses SimpleBatch + receive API)
- `src/app/core/services/graphql-read.service.ts` — GraphqlReadService (already built, query/getById/rawQuery)
- `src/app/core/services/sme-mart-db.service.ts` — SmeMartDbService being replaced (hub + neon modes)

### Existing Models (migration source)
- `src/app/core/models/work-request.model.ts` — WorkRequest, EngagementSummaryRow, EngagementDetailRow (snake_case)
- `src/app/core/models/bid.model.ts` — Bid, BidSummaryRow, TaskTypePricing (snake_case)
- `src/app/core/models/note.model.ts` — Note model
- `src/app/core/models/document.model.ts` — Document model
- `src/app/core/models/service-offering.model.ts` — ServiceOffering model
- `src/app/core/models/review.model.ts` — Review model

### Existing Mappers (pattern reference)
- `src/app/core/mappers/work-request-resource.mapper.ts` — Example of existing snake→resource mapping
- `src/app/core/mappers/bid-resource.mapper.ts` — Bid mapper pattern
- `src/app/core/mappers/index.ts` — Mapper barrel exports

### Test Infrastructure
- `src/app/test-helpers/factories.ts` — makeWorkRequest(), makeEngagementSummaryRow(), etc.
- `src/app/test-helpers/angular.ts` — fakeSmeMartDb(), fakeNotificationService() mock factories
- `src/app/core/services/work-requests.service.spec.ts` — Example test using fakeSmeMartDb pattern

### Research
- `.planning/research/STACK.md` — Technology recommendations
- `.planning/research/ARCHITECTURE.md` — Dual-path architecture patterns
- `.planning/research/PITFALLS.md` — Field mapping pitfalls, prevention strategies

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **PipelineWriteService** (`pipeline-write.service.ts`): Already built with pushEntity, pushEntities, deleteEntity, deleteEntities. Uses SME_MART_CLASS_IDS constant.
- **GraphqlReadService** (`graphql-read.service.ts`): Already built with query<T>, getById<T>, rawQuery. Has GqlQueryResult<T>, GqlQueryOptions interfaces.
- **Mappers** (`core/mappers/`): 6 existing entity-to-SmeMartResource mappers. Pattern: function that takes entity row, returns SmeMartResource. These may be repurposed or replaced.
- **Test helpers** (`test-helpers/`): Factory functions (makeWorkRequest, etc.) and Angular mock providers (fakeSmeMartDb, etc.). Pattern to extend for Pipeline+GQL mocks.

### Established Patterns
- **Service injection**: `inject()` function (Angular 21), not constructor injection
- **Test setup**: `TestBed.configureTestingModule()` with `useValue` providers from factory functions
- **Signals**: Services use Angular signals (`signal()`) for reactive state (loading, connected, etc.)
- **Model files**: One file per entity in `core/models/`, snake_case field names matching Neon columns

### Integration Points
- **SME_MART_CLASS_IDS** in `pipeline-write.service.ts`: Already has all 8 class UUIDs. Bloom entities will need to be added (Phase 6).
- **BOUNDARY_ID** in `graphql-read.service.ts`: Already set to prod boundary UUID.
- **SmeMartClassName type**: Union type exported from pipeline-write.service.ts. New Bloom types will extend this.

</code_context>

<specifics>
## Specific Ideas

- Rename WorkRequest → Engagement throughout the codebase to match GQL schema and Brian's consistent use of "Engagement" terminology.
- PR #9 (schema naming fix) is currently publishing after dev→main merge. Once verified, PR #8 (Bloom entities) can proceed. Phase 1 should not wait for either — the 8 original entities already have GQL types from PR #7.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-infrastructure-setup*
*Context gathered: 2026-03-18*
