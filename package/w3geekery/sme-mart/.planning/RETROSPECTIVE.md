# Retrospective

## Milestone: v1.0 — AuditgraphDB Migration

**Shipped:** 2026-03-19
**Phases:** 6 | **Plans:** 9

### What Was Built

- Migrated 8 entities from Neon PostgreSQL to AuditgraphDB Pipeline+GQL
- Built 9 new Project Bloom entity services on clean Pipeline foundation
- Created 17 field mapping constants with bidirectional roundtrip validation
- 94+ unit tests for Bloom, 27 for Wave 3, comprehensive mock infrastructure

### What Worked

- **Wave-based migration** — progressing from core flow → attachments → standalone kept risk low and momentum high
- **Direct swap pattern** — domain services were already isolated, so swapping internals was surgical
- **GSD workflow** — 6 phases planned, researched, executed, and verified in 2 days
- **Optimistic updates** — fire-and-forget Pipeline pattern with immediate returns gave good UX despite async writes
- **Field mapping constants first** — Phase 1 infrastructure prevented bugs in all subsequent phases

### What Was Inefficient

- **REQUIREMENTS.md bookkeeping** — checkboxes stopped being updated after Phase 2 (19/32 stale). SUMMARY.md frontmatter `requirements_completed` was never populated. Traceability should be auto-updated by the execution workflow.
- **Phase 6 VERIFICATION.md stale** — verification written before class ID gap was resolved, never updated. Created confusion during audit.
- **Build errors accumulated** — unrelated component build errors (document-share-dialog, rfp-dialog) blocked `npm test` but were never prioritized. Should have been fixed as they appeared.

### Patterns Established

- **Pipeline write + GQL read** as the standard data layer pattern for all SME Mart entities
- **`mapNeonToGql()` / `mapGqlToNeon()`** bidirectional field mapping with explicit constants
- **`fakePipelineWriteService()` / `fakeGraphqlReadService()`** test mock factories
- **Fire-and-forget pushEntity()** with `.catch()` error logging for optimistic updates
- **Flat-fetch + client-side tree rebuild** for hierarchical entities (folders, tasks)

### Key Lessons

1. **Bookkeeping automation matters** — manual checkbox updates don't scale past 2 phases. Future milestones should auto-update traceability.
2. **Fix build errors immediately** — letting them accumulate blocks verification and erodes confidence.
3. **Wave ordering by dependency** was the right call — core flow first proved the pattern, everything after was mechanical.

### Cost Observations

- Sessions: ~4-5 Claude Code sessions over 2 days
- Notable: The entire 8-entity migration + 9 new services shipped in ~2 calendar days — GSD workflow compressed what could have been 2+ weeks of manual planning into structured execution.

---

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 6 |
| Plans | 9 |
| Tasks | 22 |
| Commits | 58 |
| Calendar days | 2 |
| Requirements satisfied | 32/32 |
| Tech debt items | 3 |
