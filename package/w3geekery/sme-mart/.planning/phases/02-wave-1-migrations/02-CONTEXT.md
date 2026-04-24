# Phase 2: Wave 1 - Core Marketplace - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate Engagement (WorkRequest), Bid, and BidResponse services from SmeMartDbService (Neon) to PipelineWriteService (writes) + GraphqlReadService (reads). Zero component changes required — domain service public APIs remain unchanged. Includes a full WorkRequest → Engagement rename to align with GQL schema.

</domain>

<decisions>
## Implementation Decisions

### Engagement Rename (Task 1 — separate commit)
- **Full rename** as a separate commit BEFORE any service migration
- Rename model file: `work-request.model.ts` → `engagement.model.ts`, interface `WorkRequest` → `Engagement`
- Rename service: `work-requests.service.ts` → `engagements.service.ts`, class `WorkRequestsService` → `EngagementsService`
- Rename spec: `work-requests.service.spec.ts` → `engagements.service.spec.ts`
- Rename mapper: `work-request-resource.mapper.ts` → `engagement-resource.mapper.ts`
- Rename test helper: `makeWorkRequest()` → `makeEngagement()`
- Update all imports across ~15-20 files
- **Match GQL schema naming as closely as possible** — the TypeScript model should mirror the GQL `Engagement` class fields
- Neon table names (`work_requests`) stay unchanged — database-side, cleaned up in Phase 5
- Route URLs already use `/rfps/` and `/engagements/` — no URL changes needed

### VIEW Replacement Strategy
- **Flatten GQL responses into component-facing summary types** (Option 2)
- Create `EngagementSummary` interface mirroring what `v_engagement_summary` returned (bid_count, pending_bid_count, accepted_provider_name, etc.)
- Create `BidSummary` interface mirroring what `v_bid_summary` returned (compliance rollups, provider info, cost sums)
- Service fetches GQL nested queries, transforms into summary interfaces before returning to components
- Components get the exact same data shape — truly zero component changes
- At SME Mart's scale, over-fetching nested bids for rollup computation is negligible

### BidResponse Handling
- **Migrate BidResponse together with Bid** — they're always queried together
- Bid detail view shows compliance breakdown (per-requirement met/not_met/partial)
- One migration, one test pass — no split data path

### Demo Data Migration
- **Claude's discretion** — decide based on testing value vs effort tradeoff

### Claude's Discretion
- Demo data seeding timing (now vs Phase 5)
- Exact GQL query structure for nested relationships
- Whether to merge GQL response types with renamed model interfaces or keep them separate
- Error handling for GQL query failures (retry, fallback, error state)
- Optimistic update implementation details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Infrastructure (dependencies)
- `src/app/core/field-mappings.ts` — Bidirectional field mapping constants for all 8 entities (ENGAGEMENT_FIELD_MAPPING, BID_FIELD_MAPPING, BID_RESPONSE_FIELD_MAPPING)
- `src/app/core/gql-types/engagement.types.ts` — GqlEngagementResponse interface
- `src/app/core/gql-types/bid.types.ts` — GqlBidResponse interface
- `src/app/core/gql-types/bid-response.types.ts` — GqlBidResponseResponse interface
- `src/app/test-helpers/angular.ts` — fakePipelineWriteService(), fakeGraphqlReadService() mock factories
- `src/app/test-helpers/gql-fixtures.ts` — Realistic GQL response fixtures

### Services being migrated
- `src/app/core/services/work-requests.service.ts` — Current Neon-backed engagement service (to be renamed + migrated)
- `src/app/core/services/bids.service.ts` — Current Neon-backed bids service (to be migrated)
- `src/app/core/services/work-requests.service.spec.ts` — Current tests (to be renamed + updated)
- `src/app/core/services/bids.service.spec.ts` — Current tests (to be updated)

### Services used (not modified)
- `src/app/core/services/pipeline-write.service.ts` — Write path (pushEntity, pushEntities, deleteEntity)
- `src/app/core/services/graphql-read.service.ts` — Read path (query, getById, rawQuery)

### Models being renamed
- `src/app/core/models/work-request.model.ts` — WorkRequest, EngagementSummaryRow, EngagementDetailRow
- `src/app/core/models/bid.model.ts` — Bid, BidSummaryRow, BidWizardData
- `src/app/core/models/bid-response.model.ts` — BidResponse model

### Existing mappers (rename + possibly repurpose)
- `src/app/core/mappers/work-request-resource.mapper.ts` — workRequestToResource()
- `src/app/core/mappers/bid-resource.mapper.ts` — bidToResource()

### Schema reference
- `.claude/plans/local/034-gql-schema-migration.md` — GQL schema YAML definitions, class IDs, field definitions, link relationships
- `.claude/notes/sme-mart-resource-types-summary.md` — Resource type inventory

### Migration approach
- `.planning/research/ARCHITECTURE.md` — Dual-path architecture, data flow patterns
- `.planning/research/PITFALLS.md` — Field mapping pitfalls, eventual consistency handling

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **PipelineWriteService** (`pipeline-write.service.ts`): Already built — pushEntity, pushEntities, deleteEntity, deleteEntities. Uses SME_MART_CLASS_IDS constant.
- **GraphqlReadService** (`graphql-read.service.ts`): Already built — query<T>, getById<T>, rawQuery. Has GqlQueryResult<T>, GqlQueryOptions interfaces.
- **Field mappings** (`field-mappings.ts`): Bidirectional mapping constants + helper functions for all 8 entities. Created in Phase 1.
- **GQL types** (`gql-types/`): TypeScript interfaces for all 8 entity GQL response shapes. Created in Phase 1.
- **Mock factories** (`test-helpers/angular.ts`): fakePipelineWriteService() and fakeGraphqlReadService() ready for use.
- **GQL fixtures** (`test-helpers/gql-fixtures.ts`): Realistic response data for all entities.

### Established Patterns
- **Service injection**: `inject()` function (Angular 21)
- **Signals**: Services use Angular signals for reactive state (loading, engagements, etc.)
- **Test setup**: `TestBed.configureTestingModule()` with `useValue` providers
- **SmeMartDbService API**: `listRows()`, `searchRows()`, `getRow()`, `createRow()`, `updateRow()` — this is what gets replaced

### Integration Points
- **Components consuming services**: EngagementListComponent, EngagementDetailComponent, BidWizardComponent, BidComparisonComponent, etc. — these inject WorkRequestsService/BidsService and call public methods. They must NOT change.
- **EngagementContextService**: Shares engagement data between parent and tab components. Consumes WorkRequestsService (will become EngagementsService).
- **NotificationService**: Fires notifications on engagement/bid actions. Service calls stay the same.

</code_context>

<specifics>
## Specific Ideas

- Match GQL schema naming as closely as possible — TypeScript interfaces should mirror GQL field names
- The rename is a ~30 minute compile-breaking window, then everything works again
- EngagementSummary and BidSummary interfaces give components the same data shape they had from Neon VIEWs
- PR #9 is publishing after dev→main merge; once verified, PR #8 (Bloom entities) can proceed (relevant for Phase 6, not this phase)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-wave-1-migrations*
*Context gathered: 2026-03-18*
