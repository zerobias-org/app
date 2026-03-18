---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-03-18T22:51:47.039Z"
progress:
  total_phases: 6
  completed_phases: 2
  total_plans: 5
  completed_plans: 4
---

# STATE.md — Session Context

**Session Name:** `poc/sme-mart` (SME Mart AuditgraphDB Migration Roadmap)
**Date Created:** 2026-03-18
**Current Focus:** Phase 03 — wave-2-attachments

---

## Project Reference

**Project:** SME Mart AuditgraphDB Migration
**Core Value:** Migrate all 17 SME Mart entity types from Neon PostgreSQL to AuditgraphDB (Pipeline writes + GraphQL reads)

**Roadmap Location:** `.planning/ROADMAP.md`
**Requirements Location:** `.planning/REQUIREMENTS.md`

---

## Current Position

Phase: 03 (wave-2-attachments) — EXECUTING
Plan: 2 of 2 (03-02 COMPLETE)

## Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| 6-phase structure (not 7) | Compressed phases 5-6 into single Verification phase to fit standard granularity with 15 hr/week budget | ✓ Approved in roadmap |
| Field mapping constants first | Prevents rework during wave migrations; enables parallel test infrastructure setup | ✓ Phase 1 dependency |
| Wave 1 (Engagement+Bids) before Wave 2 | Core flow must work first; highest usage = highest testing priority | ✓ Sequencing locked |
| Optimistic updates for consistency | Pipeline async delay (~5-10s); components already have data from create call | ✓ Architectural pattern |
| Direct swap (no adapter pattern) | Domain services already isolated; swapping internals keeps public API unchanged | ✓ Zero component changes needed |
| Archive Neon (Phase 5, not delete) | Cold backup to S3, keep 2-4 weeks read-only, then drop after verification | ✓ Safety-first approach |

---

## Blocked Dependencies

- **Phase 6 (Project Bloom) → Schema PR #8 merge** — GQL types for 9 new entity classes not available until schema repo merges PR #8. Estimate: 1-2 weeks pending Kevin's timeline.

---

## Critical Context

### Architecture Patterns

- **Domain services:** Public API unchanged; internals swap from SmeMartDbService → PipelineWriteService + GraphqlReadService
- **Field mapping:** Snake_case Neon columns (e.g., `engagement_id`) → camelCase GQL fields (e.g., `engagementId`). Explicit mapping constants per entity prevent bugs.
- **Relationships:** Replace Neon JOINs + VIEWs with nested GQL queries. Test for pagination on one-to-many relationships per entity.

### Services Affected (Wave Order)

1. **Wave 1 (Phase 2):** `workRequestsService`, `bidsService`
2. **Wave 2 (Phase 3):** `notesService`, `documentService`
3. **Wave 3 (Phase 4):** `catalogService`, `reviewsService` (future)
4. **New (Phase 6):** 9 Bloom services (no SmeMartDbService)

### GQL & Pipeline References

- **Pipeline ID:** `091d5068-0527-4f45-9839-37f6d5c1669e` (SME Mart Entity Pipeline)
- **Schema Repo:** `zerobias-org/schema` — auto-deploys YAML packages on merge
- **Schema Reload:** Every 15 minutes after merge
- **GQL Endpoint:** Auto-generated from schema classes
- **Client accessor:** `ZerobiasClientApi.graphqlClient.getBoundaryApi()`

---

## Session Continuity

**Resume this session:**

```bash
claude --resume poc/sme-mart
```

**If starting fresh:**

- Read `.planning/ROADMAP.md` for phase structure
- Read `.planning/REQUIREMENTS.md` for full requirement list and traceability
- Check `.planning/research/SUMMARY.md` for architectural decisions and confidence levels
- Review `CLAUDE.md` for project conventions and SmeMartDbService migration patterns

---

## Metrics

| Metric | Value | Note |
|--------|-------|------|
| **Total Requirements** | 32 | v1 scope only |
| **Phases** | 6 | Standard granularity (5-8) |
| **Entities to Migrate** | 8 | Engagement, Bid, BidResponse, ServiceOffering, Note, NoteFolder, Review, SmeMartDocument |
| **Entities to Build** | 9 | Project Bloom new services |
| **Estimated Effort** | 27-38 hrs | Over 2-3 weeks at 15 hrs/week |
| **Test Coverage Target** | ≥80% | Phase 5+ (existing: 456+ unit tests) |

---

## Known Gaps & Workarounds

**Gap 1: GQL types blocked on Schema PR #8 merge**

- Workaround: Shadow-test wave 1 against mock GQL service in parallel
- Resolution: Kevin to merge PR #8 (estimated 1-2 weeks)

**Gap 2: Eventual consistency delay (5-10s)**

- Workaround: Optimistic updates in components show data immediately
- Fallback: `ensureIndexed()` polling utility if UX issues arise (defer to v2 unless needed)

**Gap 3: Neon table archival ops planning**

- Workaround: Keep tables renamed as `*_archived` for 2-4 weeks post-migration
- Resolution: Coordinate with ops for S3 backup + deletion plan (Phase 5)

---

## Next Steps

1. **Approve roadmap** — User reviews ROADMAP.md and confirms 6-phase structure
2. **Create Phase 1 plan** — Field mappings, mock infrastructure, roundtrip tests
3. **Coordinate with Kevin** — Confirm Schema PR #8 timeline for Phase 6 unblocking
4. **Begin Phase 1 implementation** — Set up field mapping constants once REQUIREMENTS.md traceability is finalized

---

**Last Updated:** 2026-03-18T23:05:00Z
**Phase 02-01 Completed:** 2026-03-18T21:40:43Z (Plan executed: 5 tasks, 5 commits, SUMMARY.md created)
**Phase 02-02 Completed:** 2026-03-18T22:45:00Z (Gap closure: 3 blockers fixed, 2 commits, SUMMARY.md created)
**Phase 03-01 Completed:** 2026-03-18T23:00:00Z (Wave 1 tests: 5 tasks, field mapping verification, test infrastructure)
**Phase 03-02 Completed:** 2026-03-18T23:05:00Z (NoteFolderService: 3 tasks, flat-fetch tree rebuild, 8 unit tests, 2 commits)
**Next Phase:** 03-03 (Notes Service migration)
