# Retrospective

## Milestone: v1.1 — Org Navigation & Vendor Profile

**Shipped:** 2026-04-02
**Phases:** 6 | **Plans:** 8

### What Was Built

- Three-tier org navigation (`/orgs` list, `/orgs/:orgId` detail, `/org` edit) with members, groups, boundaries
- MarketplaceProfileItem GQL schema entity with 6-section discriminator and JSON data blob
- VendorProfileService with full CRUD (GQL reads + Pipeline writes), bidirectional field mapping
- Corporate Profile tab with add/edit/delete, expiration indicators, renewal prompts
- Vetting pre-fill suggestion panel with section-to-vetting-type matching, pointer-based attachments
- Internal/External org badges, engagement/project counts, boundary parties tab with roles

### What Worked

- **Schema PR first** — getting MarketplaceProfileItem merged to `zerobias-org/schema:dev` before phases 9-11 unblocked the entire vendor profile pipeline cleanly
- **Phase 12 parallel execution** — boundary model ran independently of vendor profile phases, maximizing throughput
- **Single entity with section discriminator** — simpler than per-section classes, JSON data blob gave flexibility without schema proliferation
- **Pointer-based attachments** — vetting pre-fill references live profile data, no stale copies to maintain
- **Director review workflow** — `/meta:director` checkpoint and review modes caught issues early (e.g., parallelized metrics loading, proper ownerId filters)

### What Was Inefficient

- **REQUIREMENTS.md checkboxes stale again** — 18/33 checkboxes unchecked despite being verified satisfied. Same pattern as v1.0. Traceability auto-update still not implemented.
- **Phase 8 missing VERIFICATION.md** — schema phase was small (3 min execution) but should still have had formal verification for audit compliance
- **Nyquist partial compliance** — only Phase 7 fully compliant. Phases 8-12 have VALIDATION.md files but were not brought to formal compliance. Process overhead vs value trade-off.
- **Gap closure plans** — Phases 10 and 12 both needed follow-up plans to fix TypeScript errors. Root cause: initial execution plans didn't account for SDK type mismatches.

### Patterns Established

- **MarketplaceProfileItem** as the template for future org-scoped GQL entities with section discriminators
- **Section-to-vetting-type mapping** utility for cross-entity matching
- **Reference counting** before delete — `getProfileItemReferenceCount()` pattern for pointer integrity
- **Internal/External org detection** via `whoAmI().ownerId === org.id` comparison
- **BoundaryService** abstraction for platform boundary API calls (parties, roles, teams)

### Key Lessons

1. **Bookkeeping automation is overdue** — two milestones with stale checkboxes. Either automate or remove the requirement.
2. **Small phases still need VERIFICATION.md** — audit compliance shouldn't be optional regardless of phase size.
3. **SDK type alignment should be a plan step** — gap closure plans were predictable and could have been prevented by verifying SDK types before implementation.
4. **Director review adds value** — FLAG items caught real issues (5x perf improvement from parallelized loading, accurate counts from ownerId filters).

### Cost Observations

- Sessions: ~6-8 Claude Code sessions over 3 days
- Notable: Full vendor profile pipeline (schema → service → UI → vetting integration) shipped in ~2 calendar days. Boundary model ran in parallel, completing same day.

---

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

| Metric | v1.0 | v1.1 |
|--------|------|------|
| Phases | 6 | 6 |
| Plans | 9 | 8 |
| Tasks | 22 | 26 |
| Commits | 58 | 56 |
| Calendar days | 2 | 3 |
| Requirements satisfied | 32/32 | 33/33 |
| Tech debt items | 3 | 4 |
| Gap closure plans needed | 0 | 2 |
