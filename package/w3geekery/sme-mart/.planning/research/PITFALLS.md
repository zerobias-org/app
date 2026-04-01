# Domain Pitfalls: Neon → AuditgraphDB Pipeline+GQL Migration

**Domain:** Angular 21 marketplace app migrating from Neon SQL to ZeroBias AuditgraphDB (async Pipeline writes + GraphQL reads)
**Researched:** 2026-03-18
**Context:** 8 existing entities (Engagement, Bid, BidResponse, ServiceOffering, Note, NoteFolder, Review, SmeMartDocument) moving from Neon tables to AuditgraphDB via Receiver Differential Pipeline. 9 new Project Bloom entities built directly on Pipeline+GQL.
**15 hrs/week contractor budget — time is constrained.**

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, silent inconsistencies, or architectural rework.

### Pitfall 1: Async Write Visibility Delay — Orphaned UI State

**What goes wrong:**
Pipeline writes are async. A user creates an Engagement, component saves it locally optimistically, then navigates to the detail page. GraphQL query returns empty while the Pipeline ingestion is still in flight. User sees "not found" error or blank page, resubmits the same data, creating duplicates.

**Root cause:**
Confusing "write accepted" (Pipeline HTTP 202) with "data queryable" (AuditgraphDB indexed). The pipeline batching layer adds 100ms–2s latency between `addBatchItem` call and data visibility in GQL.

**Consequences:**
- Duplicate entities in AuditgraphDB (user resubmits thinking first failed)
- Poor UX (loading spinner → not found → retry loop)
- Hard to debug (appears intermittent in dev, consistent under load)
- Breaks demo mode if demo data seeding doesn't wait for indexing

**Prevention:**
1. **Explicit optimistic updates in UI:** Component receives data from POST response (not re-queried). Return the full entity from `PipelineWriteService.createEntity()`.
2. **No refetch immediately after write:** Don't query for the just-created object right after `pushEntity()` call. Trust the local model.
3. **Deferred consistency checks:** If a detail page must verify data exists, use a 1-second retry with exponential backoff (poll max 3 times, then give up with "data not ready" message).
4. **Test visibility delay:** In integration tests, mock GraphQL latency. Create an entity, immediately query — it should return the local model, not hit GraphQL yet.

**Detection:**
- User submits form, sees "loading", then "404" instead of detail page
- Duplicate entities in AuditgraphDB with same content but different IDs
- Demo mode seeding script creates 100 Engagements but GQL query only returns 50

**Phase mapping:**
- **Phase 1 (Wave 1 Engagement/Bid migration):** Must establish optimistic update pattern before cutover — HIGH PRIORITY
- **Phase 2 (demo data seeding):** Update script to push data through pipeline but use local model for verification, not GQL queries
- **Phase 5+ (all new Bloom entities):** Built with optimistic updates from day 1

---

### Pitfall 2: Field Mapping Bugs — Silent Data Loss or Type Mismatches

**What goes wrong:**
Neon columns use `snake_case` (`budget_min`, `response_deadline`). GraphQL fields use `camelCase` (`budgetMin`, `responseDeadline`). During migration:
- Developer forgets to map `response_deadline` → `responseDeadline` in Engagement create
- Data gets written to AuditgraphDB with snake_case keys (invalid for GQL)
- GQL queries return null for those fields (no error thrown)
- User sees missing budget in UI; can't filter by deadline

**Root cause:**
No centralized field mapping. Mapping lives in multiple places (service files, constants, tests). Easy to miss one entity or one field per entity.

**Consequences:**
- Silent field loss (no error, just null values in GQL)
- Users can't query/filter by missing fields
- Old Neon data is correct; new data via Pipeline is broken — inconsistency
- Discovered in QA testing (expensive to fix after code review)

**Prevention:**
1. **Single source of truth for mapping:** Create `src/app/core/mappers/field-mapping.ts` with constants:
   ```typescript
   export const ENGAGEMENT_FIELD_MAP = {
     neonToGql: {
       budget_min: 'budgetMin',
       budget_max: 'budgetMax',
       response_deadline: 'responseDeadline',
       // ...all 20+ fields
     },
     gqlToNeon: { /* reverse map */ }
   };
   ```
2. **Apply mapping in one place:** `PipelineWriteService.createEntity()` applies the map before pushing to pipeline.
3. **Type-safe mapping:** Use a mapper function that's typed against both Neon models and GQL types. TypeScript will catch unmapped fields at compile time.
4. **Test each entity roundtrip BEFORE cutover:**
   - Create a Neon object with all fields populated
   - Transform via field mapper
   - Mock Pipeline push, verify shape
   - Mock GQL response with transformed shape
   - Verify component renders correctly
5. **Document mapping per entity:** In each domain service file, add a comment listing which Neon fields map to which GQL fields. Future refactors won't break.

**Detection:**
- GQL queries return null for fields that should have values
- Filtering/sorting by a field returns 0 results post-migration
- Unit tests pass, but QA finds null fields in UI

**Phase mapping:**
- **Pre-wave 1:** Build field mapper constants + test utilities
- **Wave 1 (Engagement/Bid):** Apply mapping, test roundtrip, document
- **Wave 2–3:** Reuse mapping pattern, add new field maps as needed

---

### Pitfall 3: Linked Entity Cascade — Orphaned Children or Broken References

**What goes wrong:**
Engagement links to 3 Bids via `Engagement.proposals`. During migration:
- Migrate Engagement first (now in AuditgraphDB)
- Bid still in Neon (not migrated yet)
- Engagement links to Bid IDs that don't exist in AuditgraphDB
- Or: Migrate Bid, but Engagement's `proposals` link isn't updated to point to new GQL Bid

**Root cause:**
Linked entities have dependencies. Migrating one before its linked entity breaks the reference. Schema defines `linkTo: Bid` as a one-way pointer; if Bid data is missing, the link resolves to null.

**Consequences:**
- Engagements in GQL have empty `proposals` array (data loss)
- Bids exist but aren't discoverable via Engagement traversal
- Must re-migrate Engagement after Bid migrates (re-work)
- Bidirectional links fail to sync if only one side migrates

**Prevention:**
1. **Migrate entities as linked groups (waves):** Wave 1 = Engagement + Bid + BidResponse together. Wave 2 = Note + NoteFolder together. Wave 3 = standalone entities (ServiceOffering, Review).
2. **Verify link integrity before cutover:** Query linked entities via GQL, verify all parent IDs have corresponding children. If Engagement.proposals has 50 proposal IDs, verify all 50 Proposal objects exist in GQL.
3. **Test bidirectional links:** If schema defines `linkTo: Engagement.id.proposals` (reverse), verify both directions work:
   - Query Engagement.proposals → returns all linked Proposals
   - Query Proposal.engagement → returns parent Engagement
4. **Handle orphans gracefully:** If a parent migrates before children, either:
   - Defer parent cutover until children ready (safer)
   - Track orphaned links in logs, re-link after children migrate
5. **Update linking logic post-migration:** If Neon used foreign key IDs, GQL uses `linkTo` defined in schema. Ensure domain service creates links correctly via pipeline.

**Detection:**
- Engagement detail page shows 0 proposals (should show 15)
- Bid can't be queried via parent Engagement, but querying Bid directly works
- Old Neon data has proposals; new Pipeline data has empty proposals array

**Phase mapping:**
- **Wave 1 (Engagement+Bid):** Define and test bidirectional link structure. Document link creation in domain service.
- **Wave 2 (Note+NoteFolder):** Reuse pattern (hierarchical links); test circular references.
- **Wave 3 (standalone):** No link dependencies; can migrate independently.

---

### Pitfall 4: Test Mocking Incompleteness — Migration Breaks at Runtime

**What goes wrong:**
Developer writes unit tests for migrated Engagement service:
```typescript
// Test mocks GraphqlReadService
const mockGql = { query: jasmine.createSpy().and.returnValue(Promise.resolve([])) };
// Test passes locally
```

But in integration test or QA:
- GraphQL returns nested objects (Engagement with linked Bids)
- Mock only handles flat responses
- Component tries to access `engagement.proposals[0].price` → undefined
- Works in mock, breaks in real GQL API

**Root cause:**
Incomplete mocking. Neon had JOINs (flat results); GraphQL has nested relationships. Mocks don't account for nested structure or lazy loading.

**Consequences:**
- Tests pass, production breaks
- Missing test coverage for nested data traversal
- Hours spent debugging "works in test, fails in prod"
- Refactoring assumptions about data shape break undetected

**Prevention:**
1. **Mock full response shapes:** When mocking GraphQL, include nested objects:
   ```typescript
   const mockEngagement = {
     id: 'eng-123',
     name: 'SOC 2 Assessment',
     proposals: [
       { id: 'prop-1', price: 25000, status: 'accepted' }
     ]
   };
   ```
2. **Test actual GraphQL queries in integration tests:** Use a test GraphQL endpoint (or static fixtures) to verify real response shapes.
3. **Verify field mappings in tests:** For each migrated entity, create a test that:
   - Pushes data via `PipelineWriteService` with all fields
   - Queries via `GraphqlReadService`
   - Asserts all fields are present in response
4. **Test component rendering against real-shaped data:** Components should render with nested objects, not flat mocks.
5. **Establish mock governance:** Document expected response shapes per query in a shared test fixtures file. Version it like schema changes.

**Detection:**
- Tests pass locally, fail in QA environment
- Component errors like "Cannot read property 'price' of undefined"
- Null values in UI that shouldn't be null

**Phase mapping:**
- **Pre-wave 1:** Create test fixtures file with sample responses from GraphQL for each entity type
- **Wave 1:** All tests use fixtures; mock responses must match real shape
- **Waves 2–3:** Extend fixtures as new entities migrate

---

### Pitfall 5: Duplicate Migration or Lost Batches — Data Integrity Gaps

**What goes wrong:**
Demo data migration script runs twice (accidental re-run or flaky CI):
- First run: 100 Engagements pushed via pipeline
- Second run: Same 100 Engagements pushed again with same IDs
- Pipeline sees duplicate IDs in Differential mode — overwrites or errors
- End state: duplicates in AuditgraphDB, or first batch lost

**Root cause:**
Pipeline batching semantics unclear. Differential mode is supposed to be idempotent (pushing the same object twice = no change), but without explicit idempotency keys or deduplication, you can get duplicates or silent overwrites.

**Consequences:**
- Duplicate entities in AuditgraphDB
- Demo mode broken (loading 200 entities instead of 100)
- Old Neon data coexists with Pipeline data (no clean cutover)
- Hard to roll back without manual AuditgraphDB edits

**Prevention:**
1. **Idempotent IDs:** Use deterministic IDs (e.g., hash of entity content or UUID v5 from seed). Don't use auto-increment.
2. **Idempotency tracking:** Before pushing a batch, query AuditgraphDB for existing entities. Skip already-migrated objects.
3. **Single-run scripts:** Migration script should:
   - Check if migration already ran (flag in AuditgraphDB or persistent log)
   - Skip if already completed
   - Fail loudly if re-run detected (don't silently skip)
4. **Batch API error handling:** Capture pipeline job ID. If batch fails, log it. Don't blindly retry the same batch twice.
5. **Archive old Neon data before migration:** Rename `engagement_archive` before first push. If migration goes wrong, diff Neon vs AuditgraphDB to find missing rows.

**Detection:**
- Engagement count via GQL > Engagement count in Neon
- Demo mode loads more entities after second deployment
- AuditgraphDB contains entities with identical content/name but different IDs

**Phase mapping:**
- **Pre-wave 1:** Establish deterministic ID generation + idempotency check in migration script
- **Wave 1 cutover:** Archive old Neon tables, run migration once, verify counts match
- **Post-migration:** Keep idempotency flags for 2 weeks in case of rollback need

---

### Pitfall 6: Schema Type Mismatches — Pipeline Rejects Valid Data

**What goes wrong:**
GraphQL schema defines `Engagement.budgetMin` as an `Int`. Code sends `budgetMin: "25000"` (string from form input).
- Pipeline validation rejects: "Invalid type for budgetMin"
- Entity not created
- No error message in UI (just silent failure)
- User thinks form submitted, but nothing happened

**Root cause:**
Type coercion gap. Neon had flexible types (converted on read). GraphQL schema is strict. No input validation layer between form and pipeline.

**Consequences:**
- Silent data loss (form submitted, nothing created, no error)
- Data type mismatches in AuditgraphDB for fields that do get created
- Inconsistent behavior between Neon (loose) and Pipeline (strict)

**Prevention:**
1. **Validate input before pushing to pipeline:** Create validators matching GraphQL schema types:
   ```typescript
   enum EngagementStatus { DRAFT, PUBLISHED, IN_PROGRESS, COMPLETED, CANCELLED }
   validateEngagementData(obj: any): ValidationResult {
     if (typeof obj.budgetMin !== 'number') throw new Error('budgetMin must be a number');
     if (!Object.values(EngagementStatus).includes(obj.status)) throw new Error('invalid status');
   }
   ```
2. **Use TypeScript types:** Define entity models matching GQL schema exactly. Form data flows through model → model is pushed to pipeline (type-safe).
3. **Test schema mismatch scenarios:** Unit test should verify pipeline rejects invalid types with clear error message.
4. **Provide user-facing errors:** When pipeline rejects, catch error and display to user ("Budget must be a number").

**Detection:**
- Silent form submissions (no error, but entity not created)
- Type errors in pipeline logs but not in UI
- Inconsistent data in AuditgraphDB (some entries have string budgets, some numbers)

**Phase mapping:**
- **Pre-wave 1:** Build input validators matching GQL schema
- **Wave 1:** All forms validated before pipeline push
- **Waves 2–3:** Extend validators per entity

---

## Moderate Pitfalls

Mistakes that cause rework, performance issues, or confusing UX, but not data loss.

### Pitfall 7: Service Internal Structure Exposed — Component Coupling

**What goes wrong:**
Developer migrates Engagement service and changes its internal structure:
- Before: `engagementService.findById()` called `this.db.getRow('work_requests', id)`
- After: Calls `this.gql.query('Engagement', { id })`

Component code doesn't change (good), but internal signature does. Some components still call `findById()` with old callback style:
```typescript
// Component assumes callback; new service returns Promise
engagementService.findById(id, (err, data) => { /* ... */ });
```

**Root cause:**
Service refactoring didn't maintain backward compatibility. Direct swap replaced the implementation but changed the API slightly (Promise vs callback, error handling, return shape).

**Consequences:**
- Some components break after migration
- Tests don't catch it (if tests mock the service)
- Refactoring becomes partial, not clean
- Future maintainers confused by inconsistent APIs

**Prevention:**
1. **Maintain service public API exactly:** If service was `findById(id, callback)`, migration should keep that signature. Adapt internally to async/await:
   ```typescript
   findById(id: string, callback?: Callback<Engagement>): Promise<Engagement> {
     return this.gql.query('Engagement', { id })
       .then(([eng]) => { callback?.(null, eng); return eng; })
       .catch(err => { callback?.(err); throw err; });
   }
   ```
2. **Add adapter layer temporarily:** If internal structure changes, create adapter functions that preserve the old interface.
3. **Test component integration, not just service in isolation:** Component + service tests together verify no breakage.
4. **Use TypeScript strict mode:** Incompatible signatures will be caught at compile time.

**Detection:**
- Components fail at runtime after service migration
- Tests pass (because they mock) but QA finds issues
- Multiple call sites using service with different patterns (inconsistency)

**Phase mapping:**
- **Wave 1:** Establish service API contract (never change public signatures)
- **Waves 2–3:** Follow same pattern for new services

---

### Pitfall 8: GQL Query Performance Degradation — Nested Queries Too Deep

**What goes wrong:**
Neon had a single flat `v_engagement_summary` view that JOINed 5 tables, returned 1000 rows in 200ms.

New GraphQL query to replace it:
```graphql
{
  Engagement(status: "published") {
    id name budgetMin status
    proposals {
      id price status
      serviceOffering { id name category }
      buyer { id email avatar }
      createdBy { id email }
    }
  }
}
```

Each Engagement has 10 proposals, each proposal has nested buyer/serviceOffering. GraphQL resolver N+1 queries or loads all relationships. Query time: 5+ seconds (vs 200ms before).

**Root cause:**
GraphQL nested fields don't automatically batch-load child objects. Without batching/loader patterns, each nested object is a separate query. Multiplies by number of parents.

**Consequences:**
- UI hangs loading lists (5s vs 200ms)
- List page unusable (users think app froze)
- Backend database load spikes

**Prevention:**
1. **Flatten queries when possible:** Don't nest relationships if you can flatten:
   ```graphql
   { Engagement { ... }, Proposal { ... } }  # Two separate queries, then join in memory
   ```
2. **Use batching/data loaders on backend:** GraphQL resolvers should batch-load child objects. Kevin/platform team should handle this; verify it's enabled.
3. **Test query performance:** Before cutover, run the list page query and measure execution time. Should be similar to old Neon query (±20%).
4. **Paginate nested results:** If proposals can number in thousands, paginate them:
   ```graphql
   { Engagement { proposals(first: 10) { ... } } }
   ```
5. **Monitor in dev:** Use Chrome DevTools Network tab to see query times. If > 1 second, investigate.

**Detection:**
- List page takes 5+ seconds to load (should be <1s)
- Profiling shows many GQL requests instead of 1–2
- Backend CPU spikes when loading lists

**Phase mapping:**
- **Wave 1:** Baseline performance of old Neon queries. Compare to GQL equivalents post-migration.
- **Waves 2–3:** If slowdown detected, flatten queries or add pagination before full rollout

---

### Pitfall 9: Demo Mode Bootstrap Fragility — Slow Seeding or Partial Data

**What goes wrong:**
Demo mode pushes 50 Engagements via pipeline seeding script. Script runs in <2 seconds locally, but in QA environment (slower network):
- Script finishes
- App boots
- GQL query returns 0 Engagements (still ingesting)
- User sees empty list, thinks demo mode is broken

Or: Seeding partially fails (network timeout on 30th engagement). Script doesn't detect it. 30 entities seeded, 20 missing. Demo flow broken.

**Root cause:**
Demo seeding doesn't wait for pipeline ingestion. Assumes data is immediately queryable (violates eventual consistency).

**Consequences:**
- Demo mode doesn't work (empty lists)
- Slow to debug (intermittent, depends on network)
- Tests might seed data but not wait; tests become flaky

**Prevention:**
1. **Wait for indexing after seeding:** After pushing batch, poll GQL for expected count:
   ```typescript
   async seedDemoData() {
     await this.pipeline.pushEntities('Engagement', demoEngagements);
     // Poll until data visible
     let retries = 0;
     while (retries < 10) {
       const count = await this.gql.query('Engagement');
       if (count.length === demoEngagements.length) break;
       await new Promise(r => setTimeout(r, 500)); // 500ms delay
       retries++;
     }
     if (retries === 10) throw new Error('Demo data seeding timeout');
   }
   ```
2. **Seed data to memory, not GQL:** Don't query GQL to verify seeding. Instead, keep seeded objects in memory and serve from there initially. Once GQL available, switch.
3. **Document demo mode limitations:** In UI, show "Demo mode — data loading" spinner if data not yet queryable.
4. **Test seeding in integration tests:** Seeding should be tested with real (or stubbed) pipeline. Verify count after seeding.

**Detection:**
- Demo mode empty on first load (bounces back after 2–3 seconds)
- Seeding script succeeds but app shows no data
- Flaky tests (seeding not waited for)

**Phase mapping:**
- **Wave 1:** Establish demo seeding pattern with polling/waiting
- **Waves 2–3:** Reuse same pattern for each new entity type

---

### Pitfall 10: GraphQL Schema Version Skew — Entities Defined but Not Queryable

**What goes wrong:**
PR #8 adds 9 new Project Bloom entities to schema repo. CI passes, merged to `dev` branch. Developer starts coding Bloom services, imports types from `@zerobias-org/schema-w3geekery-sme-mart`.

Types import successfully, so developer assumes GQL schema is live. But:
- Platform dataloader runs every 15 minutes
- GQL pod restart is 1 minute after dataloader completes
- Developer tries to query at minute 8 — schema not yet reloaded
- Query fails: "Unknown type SmeMartProject"

**Root cause:**
Schema merge (PR merged) ≠ schema live (dataloader + pod restart + client cache invalidation). These are separate steps with delays and no wait guarantee.

**Consequences:**
- Code imports types successfully (no compile error)
- Query fails at runtime (no obvious error)
- Developer unsure if schema is live or code is wrong
- Wasted time debugging

**Prevention:**
1. **Document schema reload timeline:** In CLAUDE.md, state: "Schema reloads every 15 min after merge. Pod restarts ~1 min later. Wait 20 min before querying new types."
2. **Check schema version in tests:** Before querying new types, verify they exist in GQL introspection:
   ```typescript
   async checkSchemaLive() {
     const schema = await this.gql.introspection();
     if (!schema.types.find(t => t.name === 'SmeMartProject')) {
       throw new Error('SmeMartProject not yet loaded in GQL schema');
     }
   }
   ```
3. **Use schema version in package.json:** Import `@zerobias-org/schema-w3geekery-sme-mart@1.0.5`. Verify version matches deployed schema via introspection.
4. **Verify before rollout:** After schema PR merges, wait 20 min, then manually query new type via GraphQL Playground. Only then start using in code.

**Detection:**
- "Unknown type" error in GQL queries
- Types import successfully but queries fail
- Intermittent errors (schema partially loaded)

**Phase mapping:**
- **Pre-Wave 4 (Bloom entities):** Wait 20 min after PR #8 merges before coding
- **Each new entity class:** Verify GQL introspection includes the type before querying

---

## Minor Pitfalls

Common mistakes with workarounds, not architectural breaks.

### Pitfall 11: Enum Value Mismatch — Queries Return No Results

Neon stored `status: 'published'` (lowercase). GraphQL schema defines enum with uppercase `PUBLISHED`. Query filters `status: "published"` return 0 results (case mismatch).

**Prevention:** Normalize enum values when pushing to pipeline. Align all enums to one style (UPPERCASE recommended for platform consistency).

**Detection:** Filtering by status returns 0 rows (should return many).

---

### Pitfall 12: NULL Field Handling — Silent Data Loss in Aggregations

Neon: Nullable fields default to NULL. Pipeline: Null fields are included in AuditgraphDB, but GQL queries may omit them or return null. Counts/aggregations break.

**Prevention:** Test nullable field behavior in GQL before migration. Ensure pipeline handles nulls correctly.

**Detection:** Counts in GQL < counts in Neon (missing null values).

---

### Pitfall 13: Pagination Offset Differences — Skipped or Duplicate Results

Neon used OFFSET/LIMIT (brittle — rows can move between queries). GQL uses cursor-based pagination. If UI code assumes OFFSET pagination, results will be wrong.

**Prevention:** Switch UI to cursor-based pagination (get from GQL schema). Test list navigation (first page, next, prev).

**Detection:** Duplicate rows in list pagination, or rows skipped when navigating.

---

## Phase-Specific Warnings

| Phase/Topic | Likely Pitfall | Mitigation |
|---|---|---|
| **Wave 1: Engagement+Bid cutover** | Async write visibility → orphaned UI state (Pitfall 1) | Establish optimistic update pattern BEFORE cutover. Test with real pipeline latency. |
| **Wave 1: Field mapping** | Silent field loss (Pitfall 2) | Build field mapper constants. Test roundtrip: Neon → map → pipeline → GQL. |
| **Wave 1: Linked entities** | Proposal links broken (Pitfall 3) | Migrate Engagement + Bid + BidResponse together. Verify link integrity via GQL. |
| **Wave 2: Demo data seeding** | Seeding finishes, GQL returns empty (Pitfall 9) | Wait for indexing after push. Poll for expected count (max 10 retries, 500ms each). |
| **Wave 3: Service refactoring** | Component breakage from API change (Pitfall 7) | Maintain service public API signatures. Adapt internally. Test components + services together. |
| **Wave 4: Project Bloom entities** | Schema not yet live when coding starts (Pitfall 10) | Wait 20 min after schema PR merges. Verify GQL introspection. |
| **All waves: Testing** | Mocks don't match real GQL shape (Pitfall 4) | Create test fixtures with real response shapes. Test nested objects, not flat mocks. |
| **All waves: Query performance** | List page hangs on N+1 nested queries (Pitfall 8) | Baseline Neon query perf. Compare post-migration. Flatten if > 20% slower. |
| **All waves: Idempotency** | Duplicate migration or lost batches (Pitfall 5) | Use deterministic IDs. Check for existing entities before pushing. Archive old Neon data. |

---

## Verification Checklist — Per Wave

Before cutting over a wave to production, verify:

- [ ] Field mapping complete and tested for all entities in wave
- [ ] Linked entities in wave can be queried with full relationships via GQL
- [ ] Optimistic updates working in UI (no "not found" errors after create)
- [ ] Demo data seeding waits for indexing and completes without errors
- [ ] GQL query performance within 20% of old Neon query times
- [ ] All entity tests use fixtures matching real GQL response shapes
- [ ] Deterministic ID generation + idempotency checks in place
- [ ] Service public APIs unchanged; old tests still pass
- [ ] Migration script is idempotent (safe to rerun without duplicates)
- [ ] Old Neon tables archived (renamed to `*_archive`), not deleted
- [ ] GQL schema verified live (introspection includes all new types)

---

## Sources

- [Overcoming Data Consistency Challenges in Cloud Database Migrations](https://www.preprints.org/manuscript/202501.2155)
- [Cache consistency — Apollo GraphQL Docs](https://www.apollographql.com/docs/ios/caching/cache-consistency)
- [Eventual Consistency in Distributed Systems — GeeksforGeeks](https://www.geeksforgeeks.org/system-design/eventual-consistency-in-distributive-systems-learn-system-design/)
- [Deserialize Snake Case to Camel Case With Jackson — Baeldung](https://www.baeldung.com/jackson-deserialize-snake-to-camel-case)
- [Relationships — Dgraph GraphQL Docs](https://dgraph.io/docs/graphql/schema/graph-links)
- [Relationships — AWS Amplify API GraphQL](https://docs.amplify.aws/cli-legacy/graphql-transformer/connection/)
- [How to fix a Race Condition in an Async Architecture — GeeksforGeeks](https://www.geeksforgeeks.org/system-design/how-to-fix-a-race-condition-in-an-async-architecture/)
- [Avoiding Common Foreign Key Mistakes in SQL Databases — CockroachDB](https://www.cockroachlabs.com/blog/common-foreign-key-mistakes/)
- [The Ultimate Checklist for Successful Angular Migrations — Moldstud](https://moldstud.com/articles/p-the-ultimate-checklist-for-successful-angular-migrations-boost-your-projects-efficiency)
- [Advanced Angular Testing: 10+ Real-World Mocking Scenarios — DEV Community](https://dev.to/codewithrajat/advanced-angular-testing-10-real-world-mocking-scenarios-that-actually-work-1no4)
- [Testing Data Migrations — Atlas Guides](https://atlasgo.io/guides/testing/data-migrations)

---

**Downstream use:** This research informs roadmap planning. Each pitfall maps to prevention work in Wave 1–4. Critical pitfalls (1, 2, 3) must be addressed BEFORE any entity cutover. Moderate and minor pitfalls can be handled within each wave's scope or deferred if time-constrained (15 hrs/week budget).

*Session: `claude --resume poc/sme-mart`*
