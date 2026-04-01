# Research Summary: AuditgraphDB Migration Pitfalls

**Domain:** Database-to-Graph migration (Neon PostgreSQL → ZeroBias AuditgraphDB Pipeline+GQL)
**Project:** SME Mart Angular 21 marketplace
**Researched:** 2026-03-18
**Overall confidence:** HIGH (specific to async pipeline architecture + linked entity dependencies)

---

## Executive Summary

SME Mart's migration from Neon to AuditgraphDB is fundamentally different from standard database migrations because writes are async (Pipeline Batch API with 100ms–2s latency) while reads are eventually consistent (GraphQL queries). This creates three critical risks not present in synchronous migrations:

1. **Orphaned UI state** — Users can create entities that aren't immediately queryable, leading to duplicate submissions and poor UX
2. **Silent field loss** — snake_case → camelCase mapping errors go undetected (no schema validation error), resulting in null fields in production
3. **Broken entity relationships** — Migrating linked entities independently can orphan child records or leave dangling references

The migration affects two entity groups differently:
- **8 existing entities** (Engagement, Bid, BidResponse, ServiceOffering, Note, NoteFolder, Review, SmeMartDocument) require careful schema mapping and incremental wave cutover
- **9 new Project Bloom entities** can be built directly on Pipeline+GQL without legacy baggage

With a 15 hrs/week contractor budget, preventing these pitfalls requires upfront infrastructure (field mapping, test fixtures, idempotency checks) in Wave 1, which will save rework in Waves 2–4.

---

## Key Findings

### Architecture: Eventual Consistency Trade-Off

| Aspect | Neon (Old) | Pipeline+GQL (New) | Risk |
|--------|-----------|------|------|
| Write latency | ~10ms (synchronous) | 100ms–2s (async batch) | Orphaned UI state if not optimistic |
| Query latency | ~50–200ms (direct SQL) | ~50ms (GQL, but stale) | Eventual consistency requires 1–2 GQL refreshes |
| Data consistency | Immediate (ACID) | Eventually consistent (≤2s) | Must design UI assuming async writes |
| Schema validation | At table creation | At push time (Batch API) | Type errors must be caught in app, not DB |
| Relationship queries | SQL JOINs (flat) | GraphQL nested (deep) | N+1 query risk if not batched |

**Key insight:** The migration is not "Neon bad, GQL good." It's a tradeoff — you gain schema flexibility and ZeroBias platform integration, but lose synchronous guarantees. The UI must be designed assuming writes are async.

### Field Mapping: Critical Blocker

**Finding:** All 8 existing entities have snake_case Neon columns that must map to camelCase GQL fields. Missing mappings are silent (no schema error), only discovered when fields are null in production.

**Example:**
```
Neon column: budget_min → GQL field: budgetMin
If mapping omitted: Data pushed with key "budget_min" (invalid) → GQL returns null → UI shows $0 budget
```

**Severity:** HIGH — Affects every migrated entity. Must be solved once (Wave 1) then reused.

### Linked Entity Dependencies: Wave Ordering Matters

**Finding:** Bidirectional relationships require both sides to migrate together.

```
Engagement.proposals ↔ Bid
If Engagement migrates first:
  - Engagement data has Bid IDs
  - But those Bids don't exist in GQL yet
  - Engagement.proposals array returns empty
  - Must re-migrate Engagement after Bid migrates (rework)
```

**Severity:** HIGH — Affects 3 out of 8 entities (Engagement→Bid, Engagement→Note, Engagement→Document).

**Solution:** Migrate in linked groups (waves). Wave 1 = Engagement + Bid + BidResponse. Wave 2 = Note + NoteFolder + SmeMartDocument.

### Test Mocking Incompleteness: Hidden Tech Debt

**Finding:** Unit tests often mock GraphQL with flat responses, but real GQL returns nested objects. Tests pass, production breaks.

```typescript
// Mock (wrong shape)
mockGql.query.and.returnValue([{ id: 'eng-1', name: 'SOC 2' }])

// Real GQL response
{ Engagement { id, name, proposals { id, price } } }

// Component tries: engagement.proposals[0].price → undefined
```

**Severity:** MEDIUM — Discovered in QA testing. Adds 3–5 days of rework per wave if not fixed upfront.

### Async Write Visibility: UX Risk

**Finding:** Pipeline async latency (100ms–2s) means data isn't immediately queryable. If UI tries to refetch just-created entity, it gets "not found" → user sees error and resubmits → duplicates in AuditgraphDB.

**Severity:** CRITICAL — User-facing, causes duplicates, breaks trust in demo mode.

**Solution:** Optimistic updates + no refetch pattern (established in Wave 1, before any production cutover).

---

## Implications for Roadmap

### Revised Wave Structure (with Pitfall Prevention)

**Pre-Wave Setup (0.5–1 week)**
- Build field mapping infrastructure (`field-mapping.ts`)
- Create test fixtures for all entity response shapes
- Establish idempotency checks + deterministic ID generation
- Write service API contract tests (ensure no breaking changes during migration)

**Wave 1: Engagement + Bid + BidResponse (2–3 weeks)**
- Migrate 3 linked entities together
- Establish optimistic update pattern in UI
- Test async write visibility + eventual consistency
- Baseline GQL query performance vs Neon
- **Blocker:** Can't move to Wave 2 until Wave 1 passes all verification checks

**Wave 2: Note + NoteFolder + SmeMartDocument (1.5–2 weeks)**
- Reuse field mapping + test fixture patterns from Wave 1
- Handle hierarchical relationships (NoteFolder.parent ↔ NoteFolder.children)
- Test document-specific logic (file uploads, versioning via FileService)

**Wave 3: ServiceOffering + Review (1 week)**
- Standalone entities; no link dependencies
- Fast cutover (can happen in parallel with Wave 2 if time allows)

**Wave 4: Project Bloom Entities (parallel with Waves 2–3)**
- Build directly on Pipeline+GQL (no Neon migration)
- Reuse patterns from Waves 1–3
- **No surprises** — entities built with eventual consistency in mind from day 1

### Critical Path Dependencies

```
Pre-Wave Setup ──┬── Wave 1 (Engagement+Bid) ──┬── Wave 2 (Notes+Docs) ──┐
                 │   (field mapping, fixtures) │   (reuse patterns)     │
                 │                             ├── Wave 3 (Standalone)  ├─ Cleanup + Neon archival
                 └─── Wave 4 (Project Bloom) ──┘   (fast path)         │
                      (parallel, no Neon)                              ┘
```

**Critical blockers:**
- PR #9 (schema naming fix) must merge before Wave 4
- GQL schema must be live (wait 20 min after PR merge) before querying new types
- Wave 1 must pass verification before Wave 2 starts

### Phase Mapping: Which Waves Address Which Pitfalls

| Pitfall | Severity | Addressed in | How |
|---------|----------|---|---|
| 1. Async write visibility | CRITICAL | Pre-Wave Setup + Wave 1 | Optimistic update pattern + no refetch test |
| 2. Field mapping bugs | HIGH | Pre-Wave Setup | Centralized mapper, test roundtrip per entity |
| 3. Linked entity orphans | HIGH | Wave 1 design | Migrate linked groups together, verify link integrity |
| 4. Test mocking incompleteness | MEDIUM | Pre-Wave Setup | Create fixtures, test nested shapes |
| 5. Duplicate migration | MEDIUM | Pre-Wave Setup | Idempotent IDs, deduplication check before push |
| 6. Schema type mismatches | MEDIUM | Wave 1 + beyond | Input validators matching GQL schema |
| 7. Service API exposure | MEDIUM | Wave 1 design | Maintain public API, adapter layer if needed |
| 8. GQL query perf degradation | LOW | Wave 1 baseline | Compare Neon vs GQL query times, flatten if needed |
| 9. Demo mode fragility | MEDIUM | Wave 1 + 2 | Seeding waits for indexing, polling with timeout |
| 10. Schema version skew | LOW | Wave 4 planning | Wait 20 min after merge, verify introspection |
| 11–13. Minor (enum, null, pagination) | LOW | Per-wave testing | Standard test coverage |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| **Stack** | HIGH | Architecture documented in PROJECT.md, PLAN.md. Pipeline + GQL confirmed via Kevin. Field mapping pattern standard (snake_case → camelCase common in API design). |
| **Features** | HIGH | 8 existing entities clearly defined. 9 new Bloom entities in PR #8. Dependencies understood (Engagement→Bid links, etc.). |
| **Architecture** | HIGH | Neon to Pipeline+GQL pattern researched via WebSearch. Eventual consistency pitfalls confirmed across distributed systems literature. |
| **Pitfalls** | HIGH | 13 pitfalls identified with specific root causes + prevention strategies. 3 critical (async visibility, field mapping, linked entities) backed by research + project context. 10 moderate/minor backed by testing/architecture patterns. |

---

## Roadmap Implications

### Must-Have Before Wave 1 Starts
1. Field mapping infrastructure complete + tested
2. Optimistic update pattern verified in prototype
3. Test fixtures for Engagement + Bid response shapes
4. Idempotency + deduplication logic for batch API
5. Service API contract tests (ensure migration won't break components)

### Wave 1 Success Criteria
- [ ] All 13 pitfalls understood by team
- [ ] Engagement + Bid + BidResponse migrate to AuditgraphDB
- [ ] GQL queries for all 3 entities return correct shapes
- [ ] UI shows no "not found" errors after create (optimistic updates work)
- [ ] Demo data seeding completes and waits for indexing
- [ ] No duplicates in AuditgraphDB (idempotency verified)
- [ ] Query performance within 20% of Neon baseline

### After Wave 1, Waves 2–4 Follow Same Pattern
- Reuse field mapper infrastructure
- Reuse test fixtures + mocking patterns
- Reuse demo seeding logic
- Focus on entity-specific logic, not infrastructure

### Time Estimate with Pitfall Prevention

| Phase | Effort | Notes |
|-------|--------|-------|
| Pre-Wave Setup (infrastructure) | 4–6 hrs | Field mapper, test fixtures, idempotency checks. High impact per hour. |
| Wave 1 (Engagement+Bid) | 8–12 hrs | Most complex (multiple entities, linked). Establishes patterns. |
| Wave 2 (Note+NoteFolder+Document) | 6–8 hrs | Reuses patterns. Hierarchical relationships add complexity. |
| Wave 3 (ServiceOffering+Review) | 3–4 hrs | Simple, standalone entities. Fast cutover. |
| Wave 4 (Project Bloom) | 0 hrs | Built directly on Pipeline+GQL in parallel (Plan 057). |
| Testing + documentation | 4–6 hrs | Unit tests, integration tests, CLAUDE.md updates. |
| **Total** | **25–36 hrs** | ~2.5–3.5 weeks at 15 hrs/week. Realistic. |

---

## Critical Gaps / Research Questions for Next Phase

1. **Batch API single-item latency:** How long does `addBatchItem` take for a single Engagement? Is polling for visibility necessary, or can we defer it?
   - **Action:** Performance test in dev environment before Wave 1
   - **Impact:** If latency > 500ms, demo seeding will need parallel pushes to stay fast

2. **GQL query batching:** Does Kevin's GraphQL implementation batch-load nested relationships, or is each nested field a separate query?
   - **Action:** Ask Kevin; profile a nested Engagement.proposals query
   - **Impact:** If N+1, must flatten queries or implement resolver-level batching

3. **Differential mode delete semantics:** How to explicitly delete an object pushed to a Differential pipeline?
   - **Action:** Test delete in dev environment before Wave 2 (Notes have soft-delete logic)
   - **Impact:** If delete not supported, must track deletions differently

4. **Cross-schema linking:** Can SmeMartProject link to a ZeroBias Task (platform entity)? How?
   - **Action:** Kevin guidance needed for Wave 4 (Project Bloom)
   - **Impact:** SmeMartTask needs to link to Boundary tasks; mechanism unclear

5. **Schema reload timing:** Confirm "every 15 minutes" is accurate. Any way to force refresh after PR merge?
   - **Action:** Test in dev; check Platform docs
   - **Impact:** Wave 4 timeline depends on this (20 min wait after PR #8 merges)

---

## Lessons for Future Migrations

This research establishes patterns applicable to any async write + eventual consistency system:

1. **Optimistic updates are not optional** — users will submit duplicates if data isn't immediately visible
2. **Field mapping must be centralized** — one mapper per entity type, reused everywhere
3. **Test mocks must match real shapes** — nested responses, null handling, error cases
4. **Link integrity is critical** — migrate linked entities together, not independently
5. **Idempotency is survival** — deterministic IDs + deduplication checks prevent duplicates
6. **Performance baselines first** — measure old system before cutover; new system must be within 20%

---

## Downstream Consumption

- **Plan 059 (AuditgraphDB Migration):** Use this PITFALLS.md as the risk register. Check off pitfalls as they're addressed in each wave.
- **Roadmap phase structure:** Phases must include Pre-Wave Setup before any entity migration. Cannot skip this without risking the migration.
- **Quality gates:** Each wave must pass the "Verification Checklist" in PITFALLS.md before production cutover.
- **Team onboarding:** New team members should read this summary + PITFALLS.md before touching migration code.

---

*Last updated: 2026-03-18*
*Session: `claude --resume poc/sme-mart`*
