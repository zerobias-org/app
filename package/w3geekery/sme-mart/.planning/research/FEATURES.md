# Feature Landscape: Neon → AuditgraphDB Migration

**Project:** SME Mart (W3Geekery)
**Migration Scope:** 8 existing entities (Neon tables) → Pipeline writes + GraphQL reads
**Researched:** 2026-03-18
**Confidence:** HIGH — Based on proven migration patterns, ZeroBias architecture docs, and production platform capabilities

---

## Table Stakes

Features that must work or the migration breaks. Absence = loss of functionality or data integrity.

| Feature | Why Expected | Complexity | Status |
|---------|--------------|------------|--------|
| **Field mapping (snake_case → camelCase)** | Neon tables use `budget_min`, `response_deadline`; GraphQL schema uses `budgetMin`, `responseDeadline`. Must map automatically or migration is silent data loss. | Low | ✅ Defined in Plan 059 |
| **Write path via Receiver Pipeline** | Pipeline is the only way to push data into AuditgraphDB. Without this, no persistence. | Low | ✅ PipelineWriteService exists |
| **Batch API for bulk entity pushes** | Migrating 50+ entities one-at-a-time via single-item calls is inefficient. `SimpleBatch` with array payload required. | Low | ✅ SimpleBatch used in service |
| **Read path via GraphQL query** | GraphQL is auto-generated, read-only API. Must support filters, pagination, relationship traversal. Without this, no data retrieval. | Low | ✅ Blocked on schema PR merge; design complete |
| **Schema class IDs available** | Each entity class (Engagement, Bid, Note, etc.) has a UUID in AuditgraphDB. These IDs must be correct or pushes go to wrong classes. | Low | ✅ All 8 class IDs documented in PipelineWriteService |
| **Relationship traversal via GraphQL** | Neon used JOINs; GraphQL uses nested queries. `Engagement { id bids { id status } }` must work or linked-data queries fail. | Medium | ⚠️ Needs schema PR merge + pod restart |
| **Schema inheritance from Object base class** | All 8 entities extend `Object` (id, name, description, dates, metadata, tags, links). No need to redefine these. | Low | ✅ Plan 034 Phase 2 complete |
| **Differential batch mode for upserts** | Pipeline set to "differential" — data with same `id` triggers update, not duplicate creation. Critical for re-runs and data consistency. | Low | ✅ Pipeline configured (Plan 034 Phase 4) |
| **Entity schema validation** | Each entity must conform to its YAML schema — fields present, types correct, required fields non-null. Garbage in = garbage out. | Medium | ✅ GQL schema validation available post-merge |
| **Tag assignment via Object.tag\[\]** | Neon stored tags in separate `sme_resource_tags` table. AuditgraphDB uses native `tag[]` array on Object. Tags must push correctly. | Low | ✅ Supported via SimpleBatch tagIds param |
| **Eventual consistency visibility** | Pipeline is async. Data may not be queryable via GraphQL immediately after write. UI must handle this or show stale data. | Medium | ⚠️ Needs optimistic updates + polling if issues arise |
| **Data snapshot before cutover** | Must export all Neon entity data to known state (CSV, JSON) before deletion. Rollback safety net. | Low | ⚠️ Needs migration script |
| **Demo data ingestion via Pipeline** | Current demo uses Neon SQL inserts. Must update to use `pushEntities()` so demo also validates Pipeline path. | Low | ⚠️ Needs script update |

---

## Differentiators

Features that make the migration robust, production-ready, and operationally safe. Not strictly required but prevent problems.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Incremental entity waves (not big-bang)** | Migrate linked entities together (Engagement+Bids, then Notes+Docs). Reduces risk, allows testing per wave. | Medium | ✅ Plan 059 defines wave strategy (4 waves) |
| **Public API stability guarantee** | All domain services (NotesService, BidsService, etc.) keep identical public API during migration. Zero component changes needed. | Medium | ✅ Architecture decision made in Plan 059 |
| **Dual-write validation phase (optional)** | Write to both Neon and Pipeline in parallel for N days, then compare row counts and spot-check data. Catches bugs before cutover. | High | ⚠️ Not in Plan 059; GitHub's approach; optional |
| **Optimistic updates in UI** | After `pushEntity()` returns, immediately update local state with returned model. Don't wait for GQL query. Hides Pipeline async delay. | Medium | ✅ Referenced in Plan 059; not yet implemented |
| **Schema version tracking** | Store the schema package version used for each entity migration wave. Helps debug "entity created in v1, queried with v2" issues. | Low | ⚠️ Not explicitly planned |
| **Field mapping validation tests** | Unit tests for each entity's Neon↔GQL field mapping. Catches snake/camelCase bugs before production. | Medium | ⚠️ Should be in Wave 1 testing |
| **Relationship link validation** | Test that `Engagement.bids` traversal works via GraphQL, matches Neon JOIN results. Catch broken linkTo YAML. | Medium | ⚠️ Needs specific test cases |
| **Batch size tuning** | Test optimal batch sizes (10, 50, 100 items) to find throughput sweet spot without triggering rate limits. | Low | ⚠️ Not yet tested |
| **Data archival strategy** | After 30 days stable, move old Neon tables to archive schema (rename to `*_archived`). Keeps DB clean, preserves audit trail. | Low | ⚠️ Documented in Plan 034 Phase 8 |
| **Cutover runbook** | Written step-by-step procedure: stop writes, run final migration, enable Pipeline writes, validate counts, rollback procedure. | Medium | ⚠️ Not yet written |
| **Monitoring/alerting on write failures** | Pipeline errors (network, schema violation, quota) should surface to ops. Dashboard or log alerts needed. | Medium | ⚠️ ZB platform likely has this; needs discovery |
| **Migration progress tracking** | Counter: "Migrated X of 500 Engagements, Y of 800 Bids." Visible in admin UI or logs. Helps manage long migrations. | Low | ⚠️ Not yet planned |
| **Rollback data snapshot** | If migration fails partway, need to reset AuditgraphDB state and retry. Snapshot before each wave. | Medium | ⚠️ Needs automation |
| **Entity ID collision detection** | If an entity ID exists in both Neon and AuditgraphDB, pipeline treats it as an update. Collision detection prevents silent overwrites. | Medium | ⚠️ Needs pre-migration audit |
| **GQL performance profiling** | Nested query performance (Engagement + related Bids + related Proposals). Ensure sub-second response times. | Medium | ⚠️ Deferred to post-migration testing |

---

## Anti-Features

Things to deliberately NOT build during migration. Scope creep kills timelines.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Database adapter pattern** | Tempting to create `DbService` interface with Neon and Pipeline implementations, swap at runtime. Adds 20–30% complexity. | Direct swap in each domain service. If logic is identical, extract it. But keep it simple. |
| **GraphQL mutation layer** | GraphQL is read-only from auto-generation. Don't build mutations on top. | Use Pipeline (batch API) for writes. GraphQL is for reads only. |
| **Change Data Capture (CDC) from Neon** | Fancy approach: tail Neon WAL, replicate changes to Pipeline in real-time. Overkill for a one-time cutover. | Snapshot before cutover, push once via batch, validate, archive Neon. |
| **Field-level encryption mapping** | If Neon has encrypted fields, don't add new encryption during migration. Migrate as-is, handle encryption policy separately. | Push encrypted data verbatim. If re-encryption needed, do it post-migration with separate process. |
| **Custom query translation layer** | Don't build a layer that translates Neon SQL to GraphQL queries. Components should call GraphQL directly. | Teach domain services to call GraphQL natively. Simple queries only — if complex, use nested GraphQL. |
| **Automatic rollback on query mismatch** | Tempting: "If GQL row count doesn't match Neon, auto-rollback." Too risky and opaque. | Manual validation + human decision. Logging + alerts, not automation. |
| **Real-time sync daemon (post-cutover)** | After cutover, don't run a background service syncing Neon→Pipeline. Neon is archived. | Once cutover verified, Neon tables are read-only history. Done. |
| **Backward-compat adapter for old Neon schema** | Don't support old `SmeMartDbService` calls for migrated entities. Delete the code. | Delete `SmeMartDbService` methods for migrated entities once tests pass. Reduces tech debt. |
| **Custom metrics/dashboards** | Don't build a new dashboard for migration progress. Leverage ZB platform's existing logging/monitoring. | Use ZB audit logs, pipeline job status API. If insufficient, file feature request. |
| **Schema versioning system** | Don't implement a home-grown schema versioning scheme. Schema repo is the source of truth. | Rely on schema repo branch (dev/qa/main) as version. Document which branch each entity uses. |
| **Neon-side migration triggers** | Don't add database triggers on Neon tables to auto-push changed rows to Pipeline. Out of scope. | Manual migration script handles all ingestion. |

---

## Feature Dependencies

```
Core Table Stakes (must exist first)
├── Field mapping (Neon → GQL)
├── Receiver Pipeline configured ✅
├── Schema class IDs documented ✅
└── Schema PR merged (schema.yml)
    ├── ✅ GQL types auto-generated
    ├── ✅ Relationship traversal works
    └── ✅ Validation rules available

Domain Service Refactor (depends on table stakes)
├── PipelineWriteService created ✅
├── GraphqlReadService created ✅
├── Each domain service swaps internals
└── Tests mock new services

Data Migration Waves (depends on domain service changes)
├── Wave 1: Engagement + Bids
├── Wave 2: Notes + Documents
├── Wave 3: ServiceOffering + Review
└── Wave 4: Project Bloom entities (no Neon)

Demo Data (depends on migration script)
├── Export Neon to JSON
├── Push via PipelineWriteService
└── Verify GQL query returns correct data

Validation & Testing (parallel with migration)
├── Field mapping tests
├── Relationship link tests
├── Batch API throughput tests
├── Cutover readiness checklist
```

---

## Feature Complexity Breakdown

### High Complexity (3–5+ days each)

- **Public API stability** — Requires careful refactoring of all domain services. Worth the effort for zero component changes.
- **Incremental waves** — Planning dependency graph, testing per wave, managing state between waves. Complex but essential for risk management.
- **Dual-write validation** — Running parallel writes, comparing results, debugging mismatches. Adds 30% to timeline but catches subtle bugs.

### Medium Complexity (1–3 days each)

- **Optimistic updates** — UI state management, local cache invalidation, eventual consistency handling. Standard pattern but needs careful testing.
- **Field mapping validation tests** — Systematic test for each entity's snake↔camelCase mapping. Boring but critical.
- **Cutover runbook** — Procedure documentation, step validation, rollback instructions. Takes discipline but prevents panic.
- **Relationship traversal tests** — GQL nested queries vs. Neon JOINs. Must match 1:1 or data is wrong.

### Low Complexity (<1 day each)

- **Data snapshot before cutover** — Export Neon tables to JSON/CSV. Standard tool (pg_dump, jq). 2 hours max.
- **Batch size tuning** — Try 10, 50, 100 items. Measure throughput. Pick winner.
- **Schema version tracking** — Add a comment in migration script: "Using schema@v1.0.0-rc.1 from zerobias-org/schema".
- **Demo data seeding update** — Replace `db.createRow()` calls with `pipeline.pushEntities()`. Mostly find-replace.

---

## MVP Recommendation

**Migrate in waves. Focus on Wave 1 (Engagement + Bids) with high confidence, then proceed.**

### Prioritize (Wave 1):

1. ✅ Field mapping for Engagement and Bid (map Neon → GQL fields)
2. ✅ Relationship traversal tests (Engagement.bids via GraphQL)
3. ✅ Optimistic updates in UI (hide Pipeline async delay)
4. ✅ Data snapshot before cutover (safety net)
5. ✅ Cutover runbook (step-by-step procedure)

### Defer (post-Wave 1):

- Dual-write validation (if Wave 1 goes smoothly, may not need it)
- GQL performance profiling (test in Wave 1, optimize post-cutover)
- Batch size tuning (find empirically during Wave 1; generalize later)
- Data archival strategy (after all waves stable)

### Skip (explicitly):

- Database adapter pattern (overkill; direct swap is cleaner)
- GraphQL mutations (Pipeline handles writes)
- Change Data Capture (one-time cutover, not streaming)
- Real-time sync daemon (not needed)

---

## Effort Estimate

| Wave | Entities | Hours | Effort Breakdown |
|------|----------|-------|------------------|
| **1** | Engagement, Bid, BidResponse | 8–12 | Field mapping (2h), tests (3h), optimistic updates (2h), cutover runbook (2h), validation (1–2h) |
| **2** | Note, NoteFolder, SmeMartDocument | 6–8 | Field mapping (1h), tests (2h), folder hierarchy validation (2h), demo update (1h), validation (1h) |
| **3** | ServiceOffering, Review | 3–4 | Field mapping (0.5h), tests (1h), approval workflow setup (1.5h), validation (1h) |
| **4** | Project Bloom (9 entities) | 0 | Built directly against GQL — no migration needed |
| **Testing** | All waves | 6–8 | Roundtrip tests (3h), relationship tests (2h), performance baseline (2h), edge cases (1h) |
| **Demo data** | All | 2–3 | Script update (1h), seeding verification (1–2h) |
| **Cleanup** | Neon archives | 2–3 | Archive tables (0.5h), documentation (1h), verification (1–1.5h) |
| **Blockers/Contingency** | — | 2–4 | Schema PR delays, GQL pod issues, unforeseen bugs |
| **Total** | **8 entities** | **27–38** | ~2–2.5 weeks at 15 hrs/week |

---

## Critical Success Factors

### Data Integrity

- Every entity migrated must be queryable via GQL with identical data to Neon source.
- Spot-check 10% of records (random sample) post-migration.
- Links (Engagement.bids) must be traversable and complete.

### Zero Component Impact

- Domain services swap internals; components call identical APIs.
- No component refactoring or testing changes (except mocks).
- Proves abstraction boundaries are solid.

### Visibility During Migration

- Entity counts per wave tracked and logged.
- Pre/post row count comparison. Alerts on mismatches.
- Cutover timeline and decision points clear to stakeholders.

### Rollback Safety

- Neon data stays read-only for 30 days post-cutover.
- Full export captured before cutover.
- If GQL issues arise, can read from Neon snapshot without code changes.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Schema/Class IDs** | HIGH | All 8 classes defined in Plan 034, IDs documented in PipelineWriteService |
| **Field mapping** | HIGH | Plan 059 documents mapping strategy; conversion is straightforward |
| **Pipeline write path** | HIGH | PipelineWriteService implemented and tested; Receiver Pipeline confirmed working with sample data |
| **GQL read path** | MEDIUM | Auto-generated from schema; needs PR #9 merge + PR #8 rebase + pod restart. Design solid, execution pending. |
| **Relationship traversal** | MEDIUM | Nested GQL queries designed; needs testing post-schema merge. No known blockers. |
| **Eventual consistency handling** | MEDIUM | Optimistic updates recommended but not yet implemented. Pattern well-known; execution specific to SME Mart UI. |
| **Incremental wave strategy** | HIGH | Dependency graph clear; proven pattern (Engagement → Bids → Notes → Docs). Low risk. |
| **Dual-write validation (optional)** | MEDIUM | Optional feature; GitHub's approach is sound but adds complexity. Deferring to post-Wave 1 decision. |

---

## Gaps to Address

- **GQL pod restart timing** — Schema changes require pod restart. Is this automatic on merge? Verify with Kevin.
- **Batch API rate limits** — Not documented. What's max throughput? Test with Wave 1.
- **Optimistic update state management** — Design needed for UI cache invalidation after eventual consistency settling.
- **Cutover runbook specifics** — Who runs migration? What's rollback procedure if GQL issues found? Document before Wave 1.
- **Dual-write approach decision** — Needed for Wave 1? Gauge complexity vs. risk tolerance before starting.

---

## Sources

- [Plan 059: AuditgraphDB Migration](file://./.claude/plans/local/059-auditgraph-migration.md) — Migration approach, entity mapping, effort estimate
- [Plan 034: GQL Schema Migration](file://./.claude/plans/local/034-gql-schema-migration.md) — Schema design, pipeline setup, phase breakdown
- [PipelineWriteService](file://./src/app/core/services/pipeline-write.service.ts) — Service implementation with class IDs and batch API usage
- [Demo Data Guide](file://./.claude/notes/demo-data-guide.md) — Existing demo entities and ZB integration points
- Database Migration Best Practices ([Lumitech](https://lumitech.co/insights/data-migration-guide), [Streamkap](https://streamkap.com/resources-and-guides/data-migration-best-practices-2025), [Google Cloud Docs](https://docs.cloud.google.com/architecture/database-migration-concepts-principles-part-1)) — Table stakes, incremental strategies, eventual consistency patterns
- API-Driven Batch Ingestion ([The New Stack](https://thenewstack.io/unify-the-data-stack-for-ai-with-incremental-cloud-migrations/), [OneUptime](https://oneuptime.com/blog/post/2026-02-16-how-to-implement-incremental-data-ingestion-with-delta-lake-in-azure-databricks/view)) — Batch vs. CDC strategies, zero-downtime approaches
- Data Seeding Strategies ([Medium](https://medium.com/@malif.al/automating-data-seeding-enhancing-testing-and-development-d05a5a405ad8), [Muhammad Hilal](https://medium.com/@hilalfauzan9/mastering-database-management-a-complete-guide-to-automatic-data-seeding-and-migration-59fdff63a0c3)) — Test fixtures, demo data patterns, environment-specific approaches

---

**Last updated:** 2026-03-18
**Session:** `claude --resume poc/sme-mart`
