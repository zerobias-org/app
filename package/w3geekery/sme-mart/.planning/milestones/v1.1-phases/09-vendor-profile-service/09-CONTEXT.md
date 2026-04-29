# Phase 9: Vendor Profile Service - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Service layer for `MarketplaceProfileItem` CRUD — read from GQL via GraphqlReadService, write via PipelineWriteService, with bidirectional field mapping and roundtrip validation. Follows the established VettingService pattern exactly.

</domain>

<decisions>
## Implementation Decisions

### JSON Data Handling
- **D-01:** Typed interfaces per section. Service parses `data` JSON string on read into typed interfaces (`InsuranceData`, `AttestationData`, `CorporateIdentityData`, `ReferenceData`, `PersonnelData`, `FinancialData`). Service validates/serializes on write. Strong typing flows down to UI (Phase 10).

### Org Scoping
- **D-02:** Caller passes `orgId` explicitly to all query methods. Service does NOT auto-filter by current session org. This keeps the service flexible for Phase 12 (cross-org viewing) without refactoring.

### Class ID Discovery
- **D-03:** Hardcode the deterministic UUID v5 class ID in field-mappings.ts. Zero runtime cost, consistent with all 17 existing entity mappings. Same across all environments.

### Carried Forward from Phase 8
- **D-04:** Single `MarketplaceProfileItem` class with section discriminator (Phase 8 D-01)
- **D-05:** 5 typed fields: section (enum), expiresAt (string/date), status (string), orgId (string), data (string/JSON) (Phase 8 D-04–D-08)
- **D-06:** No links — scalar orgId, no bidirectional relationships (Phase 8 D-09)
- **D-07:** Inherited from Object: id, name, description, dateCreated, dateLastModified

### Claude's Discretion
- Section-specific data interface shapes (what fields each section type contains)
- Whether to add helper methods (e.g., `listBySection()`, `listExpired()`) or keep generic query with filters
- Test fixture data shapes for roundtrip specs
- Error handling strategy for malformed JSON in `data` field

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Service Pattern Reference (closest analog)
- `src/app/core/services/vetting.service.ts` — VettingService: exact pattern to follow (PipelineWriteService + GraphqlReadService + field mappings + typed models)
- `src/app/core/services/bids.service.ts` — BidsService: another CRUD service example
- `src/app/core/services/document.service.ts` — DocumentService: file entity service

### Infrastructure Services
- `src/app/core/services/pipeline-write.service.ts` — PipelineWriteService: all writes go through this
- `src/app/core/services/graphql-read.service.ts` — GraphqlReadService: all reads go through this

### Field Mappings
- `src/app/core/field-mappings.ts` — 17 existing entity mappings. Add MarketplaceProfileItem mapping here.

### GQL Types
- `src/app/core/gql-types/` — Existing GQL response type definitions. Add `marketplace-profile-item.types.ts`.

### Models
- `src/app/core/models/` — Domain model interfaces. Add `MarketplaceProfileItem` model + section data interfaces.

### Roundtrip Test Pattern
- `src/app/core/services/bid.roundtrip.spec.ts` — Roundtrip test pattern: GQL→domain→Pipeline→GQL cycle
- `src/app/core/services/document.roundtrip.spec.ts` — Another roundtrip example
- `src/app/core/services/bid-response.roundtrip.spec.ts` — Third example

### Schema Context
- `.planning/docs/SCHEMA_CHANGE_PROCESS.md` — Schema field names for Pipeline push data
- `.planning/notes/zb-graphql-custom-schema-howto.md` — GQL query patterns, filtering, pagination

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PipelineWriteService` — handles all Pipeline writes (fire-and-forget async)
- `GraphqlReadService` — handles all GQL reads with filtering, pagination, sorting
- `mapGqlToNeon()` / `mapNeonToGql()` — bidirectional field mapping utilities (naming is legacy, still used)
- `ImpersonationService` — used by some services for identity context
- Existing roundtrip test helpers and patterns

### Established Patterns
- Every domain service injects `PipelineWriteService` + `GraphqlReadService`
- Field mapping constants defined in `field-mappings.ts` with `GQL_FIELD` → `DOMAIN_FIELD` mapping
- GQL type interfaces in `gql-types/` directory
- Domain models in `models/` directory
- CRUD methods: `list*()`, `get*()`, `create*()`, `update*()`, `delete*()`
- All methods are `async` returning `Promise<T>`

### Integration Points
- Service will be `@Injectable({ providedIn: 'root' })` — available app-wide
- Phase 10 (UI) will consume this service directly from components
- Phase 11 (Vetting Pre-Fill) will use this service to query profile items by section

</code_context>

<specifics>
## Specific Ideas

- Follow VettingService structure exactly — it's the closest analog (same entity pattern: typed metadata + engagement reference)
- 6 section data interfaces should capture the common fields each section type needs (e.g., InsuranceData: policyNumber, carrier, coverageAmount, effectiveDate, expirationDate)
- The `data` field round-trips as: domain object → JSON.stringify → Pipeline push → GQL returns string → JSON.parse → domain object
- Roundtrip tests should cover at least 2-3 different section types to verify JSON serialization fidelity

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-vendor-profile-service*
*Context gathered: 2026-04-01*
