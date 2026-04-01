# Research Summary: AuditgraphDB Data Layer Architecture

**Project:** SME Mart Engagement Marketplace
**Domain:** Dual-path data layer (Pipeline writes + GraphQL reads)
**Researched:** 2026-03-18
**Overall confidence:** HIGH

## Executive Summary

SME Mart is migrating its data layer from a monolithic Neon PostgreSQL database to a dual-path AuditgraphDB architecture. This architecture cleanly separates data ingestion (via Receiver Differential Pipeline) from querying (via auto-generated GraphQL API).

The migration is **incremental and backward-compatible**. Domain services swap their internals from `SmeMartDbService` (Neon) to `PipelineWriteService` (writes) + `GraphqlReadService` (reads), but their public APIs remain unchanged. Components require zero modifications.

**Key architectural insight:** This pattern mirrors event sourcing — writes are side-effect-generating (pipeline ingestion), reads are eventual-consistent (GQL indexing). Optimistic updates in components mask the consistency delay, providing instant feedback to users.

The system handles 8 existing entities (migrate from Neon) plus 9 new Project Bloom entities (built directly on Pipeline+GQL). No hybrid data paths after Wave 3 completion.

## Key Findings

**Stack:**
- **Writes:** Receiver Differential Pipeline (batch API) via `ZerobiasClientApi.platformClient.getPipelineApi()`
- **Reads:** GraphQL (auto-generated from YAML schema classes) via `ZerobiasClientApi.graphqlClient.getBoundaryApi()`
- **Field transformation:** Neon snake_case → GQL camelCase (service-level mapping)
- **Pagination:** RFC4515 filters + pageNumber/pageSize pagination (same format as Neon)

**Architecture:**
- Domain services are the primary migration surface (no component changes needed)
- Two new injectable services: `PipelineWriteService`, `GraphqlReadService`
- `SmeMartDbService` phases out after Wave 3 (stays during incremental migration)
- Relationships handled via nested GQL queries (replaces Neon JOINs)

**Critical pitfall:**
- Field name mismatches between snake_case (Neon table columns) and camelCase (GQL schema). Must create explicit field mapping constants per entity.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Infrastructure (Prep)
- Create field mapping constants for Wave 1 entities (Engagement, Bid, BidResponse)
- Add unit test infrastructure (PipelineWriteService mocks, GraphqlReadService mocks)
- Document field transformations in ARCHITECTURE.md (✓ complete)

**Addresses:** Reduces rework during Wave 1 migration
**Avoids:** Field mapping bugs, misaligned tests

### Phase 2: Wave 1 Migration (Core Marketplace)
- Migrate `WorkRequestsService` (Neon `work_requests` → Pipeline `Engagement`)
- Migrate `BidsService` (Neon `bids` + `bid_responses` → Pipeline `Bid` + `BidResponse`)
- Replace view aggregations (`v_engagement_summary`, `v_bid_summary`) with nested GQL queries
- Test roundtrip: push → query → verify field names

**Addresses:** Core marketplace flow (most usage, most critical)
**Avoids:** Breaking engagement creation, bid submission flows

### Phase 3: Wave 2 Migration (Attachments)
- Migrate `NotesService` (Neon `notes` + `note_folders` → Pipeline `Note` + `NoteFolder`)
- Migrate `DocumentService` (Neon `documents` → Pipeline `SmeMartDocument`)
- Handle folder hierarchy relationships via GQL nesting
- Update demo data seeding

**Addresses:** Depends on Wave 1 stability; linked to Engagement
**Avoids:** Orphaned notes/documents after engagement migration

### Phase 4: Wave 3 Migration (Standalone)
- Migrate `CatalogService` (Neon `service_offerings` → Pipeline `ServiceOffering`)
- Migrate future `ReviewsService` (Neon `reviews` → Pipeline `Review`)
- No dependencies on other entities
- Light testing (no complex relationships)

**Addresses:** Remaining legacy entities
**Avoids:** Technical debt accumulation

### Phase 5: Cleanup & Archive
- Verify all 8 original entities stable in production (2-4 weeks observation)
- Remove `SmeMartDbService` from migrated services
- Backup Neon tables (archival, not deletion)
- Update service documentation

**Addresses:** Reduces codebase complexity, eliminates dual data paths
**Avoids:** Confusion about which path to use

### Phase 6: Project Bloom Services (NEW)
- Build 9 new services directly against Pipeline+GQL (no Neon, no SmeMartDbService)
- Part of Plan 057 (Project Bloom MVP)
- Depends on: Schema PR #8 merged + GQL pod running fresh schema

**Addresses:** New feature development on clean foundation
**Avoids:** Legacy patterns, re-architecting later

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Both services exist, tested with sample data (1 Engagement pushed + queried successfully) |
| **Architecture** | HIGH | Clear component boundaries, explicit data flows, documented field transformations |
| **Pipeline semantics** | HIGH | Receiver differential mode verified; upsert via `id`, delete via markDeleted |
| **GQL queries** | MEDIUM | Schema classes defined (YAML), but GQL types blocked on PR #7 merge. Expect to resolve once schema loads. RFC4515 filters identical to Neon (low risk). |
| **Eventual consistency** | MEDIUM | Indexing delays observed (5-10s typical). Optimistic updates handle UX impact. Polling fallback untested. |
| **Migration effort** | MEDIUM | Field mappings for 8 entities require manual review. No code generator (low complexity, high volume). Test infrastructure ready. |
| **Pitfalls** | MEDIUM | Field mapping bugs highly likely without rigorous testing. Differential delete semantics untested. View aggregation complexity varies by entity. |

## Gaps to Address

1. **GQL types availability:** PR #7 merge blocks Wave 1 testing with real GQL queries. Recommend shadow-testing against mock GQL service in parallel.

2. **Polling strategy:** `ensureIndexed()` utility not implemented. If UX issues arise (user can't see their creation immediately), will need to add. Recommend defer until actual problem observed.

3. **Relationship cardinality:** Some relationships may be one-to-many (e.g., Engagement → many Bids). GQL nested query pagination needs validation per entity.

4. **Demo data consistency:** Current demo seeding uses Neon SQL. Transition plan assumes Pipeline seeding works end-to-end. Recommend early smoke test: create 1 demo engagement via pipeline, query via GQL.

5. **Archive strategy:** Neon tables remain after Wave 3. Recommend: cold backup to S3, keep in DB for 2-4 weeks read-only, then drop. Need ops planning.

## Phase Ordering Rationale

**Why this order:**

1. **Infrastructure first** — Field mappings prevent rework; mock infrastructure enables parallel work
2. **Wave 1 first** — Core flow must work before attachments (dependencies); highest usage = highest testing priority
3. **Wave 2 second** — Depends on Wave 1 stable; medium complexity (relationships)
4. **Wave 3 third** — No dependencies; can run in parallel with Wave 2 if capacity allows
5. **Cleanup after** — Only after stable in production; reduces risk of rollback need
6. **Bloom services last** — New greenfield work; no risk of breaking existing flows; depends on Wave 1-3 foundation

**Total effort:** 27-38 hours over 2-3 weeks at 15 hrs/week (Clark's allocation)

---

**Last updated:** 2026-03-18
**Next action:** Begin Phase 1 (field mappings) once PR #7 merges
