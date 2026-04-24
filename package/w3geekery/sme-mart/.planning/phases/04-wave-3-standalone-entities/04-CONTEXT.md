# Phase 4: Wave 3 - Standalone Entities - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate ServiceOffering (CatalogService) and Review entities from SmeMartDbService to PipelineWriteService + GraphqlReadService. These are standalone entities with no cross-entity dependencies. No hierarchy, no special patterns — direct application of the proven Phase 2-3 swap approach.

</domain>

<decisions>
## Implementation Decisions

### ServiceOffering Migration
- Follow Phase 2-3 pattern exactly: swap SmeMartDbService inject, replace with PipelineWriteService + GraphqlReadService
- Catalog filters (category, pricingType) translate to GQL RFC4515 filters
- Field mappings already exist from Phase 1 (SERVICE_OFFERING_FIELD_MAPPING)

### Review Entity
- **Migrate what exists** — if any Review-related code uses SmeMartDbService, migrate it. If no service exists yet, ensure GQL types and field mappings are ready for when reviews are needed.
- Do NOT build a full ReviewService from scratch if one doesn't exist — that's future scope.
- The Review schema includes a `linkTo: Task` for approval workflow (Phase 7 scope per Plan 034) — don't implement that link now.

### Claude's Discretion
- Whether to create a minimal ReviewService or just verify types/mappings are ready
- Catalog filter implementation details (GQL query structure)
- Test coverage scope for Review (if service doesn't exist, just verify types compile)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Infrastructure
- `src/app/core/field-mappings.ts` — SERVICE_OFFERING_FIELD_MAPPING, REVIEW_FIELD_MAPPING constants
- `src/app/core/gql-types/service-offering.types.ts` — GqlServiceOfferingResponse interface
- `src/app/core/gql-types/review.types.ts` — GqlReviewResponse interface
- `src/app/test-helpers/angular.ts` — fakePipelineWriteService(), fakeGraphqlReadService()

### Services being migrated
- `src/app/core/services/catalog.service.ts` — Current ServiceOffering service (if exists)
- `src/app/core/services/reviews.service.ts` — Review service (may not exist — check)

### Prior phase patterns
- `src/app/core/services/engagements.service.ts` — Phase 2 migration reference
- `src/app/core/services/notes.service.ts` — Phase 3 migration reference

### Schema
- `.claude/plans/local/034-gql-schema-migration.md` — ServiceOffering and Review YAML definitions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All infrastructure from Phases 1-3: field mappings, GQL types, mocks, fixtures
- Proven swap pattern: 3 phases of successful migration

### Established Patterns
- SmeMartDbService → PipelineWriteService + GraphqlReadService injection swap
- Field mapping via constants (mapNeonToGql / mapGqlToNeon)
- Optimistic updates (return immediately, fire-and-forget Pipeline push)
- RFC4515 GQL filters for search/list operations

### Integration Points
- ServiceCatalog page consumes CatalogService
- Provider profile pages may reference ServiceOffering
- Review display components (if they exist) consume reviews data

</code_context>

<specifics>
## Specific Ideas

- This is the simplest phase — two standalone entities, no relationships, proven pattern.
- Should be completable in a single plan with 2-3 tasks.

</specifics>

<deferred>
## Deferred Ideas

- Review → Task approval workflow (Plan 034 Phase 7 scope)

</deferred>

---

*Phase: 04-wave-3-standalone-entities*
*Context gathered: 2026-03-18*
