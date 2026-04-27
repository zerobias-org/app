# AuditgraphDB Migration Plan — Neon → Pipeline + GQL

> **Status:** Waves 1-4 DONE — Wave 5 (SmeMartResourceService partial migration) in progress
> **Created:** 2026-03-17
> **Updated:** 2026-03-23
> **Session:** `claude --resume poc/sme-mart`
> **Depends on:** ~~PR #7~~ (merged), ~~PR #8~~ (merged)
> **Relates to:** Plan 034 (GQL Schema Migration, Phases 1-4 done), Plan 057 (Project Bloom MVP)

---

## Overview

Migrate SME Mart's data layer from Neon PostgreSQL to ZeroBias AuditgraphDB. Writes go through a Receiver Differential Pipeline; reads use the auto-generated GraphQL API. Migration is **incremental** — one entity at a time, direct swap in each domain service, no adapter abstraction layer.

## Architecture Decision

**Direct swap, one entity at a time.** Each domain service is already isolated — swap its internals from SmeMartDbService (Neon) to PipelineWriteService (writes) + GraphqlReadService (reads) directly. No adapter pattern, no hybrid mode. Test in dev/qa, then cut over.

SmeMartDbService stays for entities that haven't migrated yet. Fully migrated services bypass it and call Pipeline+GQL directly.

---

## Schema Entities (17 total)

### Original 8 (PR #3, merged — PR #7 fixes package name)

| Class | ID | Neon Table | Domain Service |
|-------|----|------------|---------------|
| Engagement | `7711aa41-...` | `work_requests` | WorkRequestsService |
| Bid | `ccddd2e5-...` | `bids` | BidsService |
| BidResponse | `a024a0b5-...` | `bid_responses` | BidsService |
| ServiceOffering | `ff689173-...` | `service_offerings` | CatalogService |
| Note | `fe7c58a9-...` | `notes` | NotesService |
| NoteFolder | `4d50975e-...` | `note_folders` | NotesService |
| Review | `ef5d821a-...` | `reviews` | (future) |
| SmeMartDocument | `e1497ca8-...` | `documents` | DocumentService |

### New 9 from PR #8 (Project Bloom — Plan 057)

| Class | Purpose | Domain Service |
|-------|---------|---------------|
| SmeMartProject | Scoped work container | ProjectService (new) |
| SmeMartBoard | Structural task container — rank, issue #, permissions | BoardService (new) |
| SmeMartActivity | Work type blueprint — workflow, RACI, issue prefix | ActivityService (new) |
| SmeMartWorkflow | Statuses + transitions | WorkflowService (new) |
| SmeMartTask | Task on a board under an activity, subtask hierarchy | TaskService (new) |
| ProjectPrd | Product Requirements Document | PrdService (new) |
| PrdSection | PRD section (overview, objectives, etc.) | PrdService (new) |
| ProjectPlan | Project plan with approach + milestones | PlanService (new) |
| PlanMilestone | Individual milestone with target date + status | PlanService (new) |

**Key insight:** The 9 new entities from PR #8 have **no Neon tables** — they'll be built directly against Pipeline+GQL from the start. No migration needed for these. Only the original 8 entities need Neon→AuditgraphDB migration.

---

## What's Already Built

- `PipelineWriteService` — `pushEntity()`, `pushEntities()`, `deleteEntity()`, `deleteEntities()`
- `GraphqlReadService` — `query()`, `getById()`, `rawQuery()`
- Receiver Pipeline (`091d5068-0527-4f45-9839-37f6d5c1669e`) — tested with 2 Engagement objects
- Pipeline + GQL class IDs for all 8 original entities

---

## Migration Order

Migrate linked entities together. Order by dependency:

### Wave 1: Engagement + Bids (core marketplace flow)
**Why first:** Most critical path, most usage, linked via `Engagement.bids ↔ Bid.engagement`

1. **Engagement** (WorkRequestsService)
2. **Bid** + **BidResponse** (BidsService)

### Wave 2: Notes + Documents (engagement attachments)
**Why second:** Linked to Engagement via `Engagement.notes`, `Engagement.documents`

3. **Note** + **NoteFolder** (NotesService)
4. **SmeMartDocument** (DocumentService)

### Wave 3: Standalone entities
**No link dependencies — can migrate anytime**

5. **ServiceOffering** (CatalogService)
6. **Review** (future service)

### Wave 4: Project Bloom entities (NEW — no migration needed)
**Built directly against Pipeline+GQL from day one**

7. SmeMartProject, SmeMartBoard, SmeMartActivity, SmeMartWorkflow, SmeMartTask, ProjectPrd, PrdSection, ProjectPlan, PlanMilestone

---

## Per-Entity Migration Steps

For each entity being migrated from Neon:

### 1. Field Mapping (snake_case → camelCase)

Create a mapping constant in the domain service or a shared file:

```typescript
// Example: Engagement field mapping
const ENGAGEMENT_FIELDS = {
  neonToGql: {
    budget_min: 'budgetMin',
    budget_max: 'budgetMax',
    budget_type: 'budgetType',
    response_deadline: 'responseDeadline',
    // ... etc
  }
};
```

### 2. Swap Write Path

Replace `this.db.createRow('table', data)` with `this.pipeline.pushEntity('ClassName', gqlData)`.

### 3. Swap Read Path

Replace `this.db.listRows('table', options)` / `this.db.searchRows('table', filter)` with `this.gql.query('ClassName', fields, options)`.

### 4. Handle View Aggregations

Replace Neon view queries (`v_engagement_summary`, `v_bid_summary`) with GQL queries + relationship traversal:

```graphql
{
  Engagement(status: ".eq.published") {
    id name status category budgetMin budgetMax
    bids { id status price }
  }
}
```

### 5. Update Tests

Mock PipelineWriteService + GraphqlReadService instead of SmeMartDbService.

### 6. Demo Data

Update demo data seeding to use `PipelineWriteService.pushEntities()` instead of Neon SQL inserts.

---

## Eventual Consistency

Pipeline writes are async — data may not be immediately queryable via GQL.

**Approach:** Return the local model immediately after write. For critical flows (e.g., create engagement then redirect to its detail page), use optimistic updates — the component already has the data from the create call, no need to re-query immediately.

If needed later, add a simple `ensureIndexed()` polling utility. Don't build this upfront — YAGNI until we see actual issues.

---

## Demo Mode

Demo data works the same way — push through the pipeline instead of SQL inserts:

```typescript
// Before (Neon):
await this.db.createRow('work_requests', demoEngagement);

// After (Pipeline):
await this.pipeline.pushEntity('Engagement', demoEngagement);
```

The demo data setup script targets the pipeline. Same data, different ingestion path. Demo mode doesn't need Neon at all once migration is complete.

---

## Blockers

| Blocker | Status | Action |
|---------|--------|--------|
| PR #7 — schema package name fix | Open, CI passed (pre-existing failure) | Kevin/Christopher to merge `dev` → `qa` → `main` |
| PR #8 — Project Bloom entities | Open, blocked on PR #7 | Rebase after PR #7 merges |
| GQL pod restart | Hourly cron | Automatic after merge to main |
| GQL types not appearing | Blocked on PR #7 | Will resolve once package name is correct + pod restarts |

---

## Effort Estimate

| Wave | Entities | Hours | Notes |
|------|----------|-------|-------|
| 1 | Engagement, Bid, BidResponse | 8-12 | Core flow, view aggregation |
| 2 | Note, NoteFolder, SmeMartDocument | 6-8 | Search filters, file handling |
| 3 | ServiceOffering, Review | 3-4 | Simple CRUD |
| 4 | Project Bloom (9 entities) | 0 | Built directly against GQL — no migration |
| Testing | All | 6-8 | Unit + integration tests |
| Demo data | All | 2-3 | Seed script update |
| Cleanup | Neon tables | 2-3 | Archive after 2-4 weeks stable |
| **Total** | | **27-38** | ~2-3 weeks at 15 hrs/week |

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| GQL types blocked (PR #7) | BLOCKING | Awaiting merge |
| Field mapping bugs | HIGH | Test each entity roundtrip before cutover |
| Write visibility delay | MEDIUM | Optimistic updates in UI; add polling only if needed |
| View aggregation perf | LOW | GQL nested queries handle most JOINs; in-memory OK at our scale |
| Demo mode breaks | MEDIUM | Update seed script early in Wave 1 |

---

## Wave 5: SmeMartResourceService Migration (2026-03-23)

### Audit Results — 8 Services Still on Neon

| Service | Verdict | Why |
|---------|---------|-----|
| `bid-response.service.ts` | **DONE — GQL+Pipeline** | 4 methods migrated, reads via GQL, writes via Pipeline |
| `sme-mart-resource.service.ts` | **PARTIAL MIGRATE** ← THIS WAVE | Search → GQL; Tags/Links stay Neon |
| `document.service.ts` | **STAY** | File upload + share permissions |
| `provider-profiles.service.ts` | **NEEDS SCHEMA** | 7 tables + 2 VIEWs, no GQL class |
| `categories.service.ts` | **NEEDS SCHEMA** | No GQL class |
| `admin.service.ts` | **STAY** | Infrastructure (VIEWs, settings, users) |
| `notification.service.ts` | **STAY** | Polling paused, no schema class |
| `impersonation.service.ts` | **STAY** | Dev-only tool |

### SmeMartResourceService — Research Findings

**Tags + Links: STAY on Neon.** AuditgraphDB objects are NOT Hydra resources:
- No resource type registered for our custom classes (checked `hydra.Resource.getResourceTypes`)
- No link types defined for our resource type pairs (checked `hydra.Resource.linkTypeSearch` — 608 types, all platform-native)
- No way to get platform object UUID from GQL queries (GQL only returns user-defined fields)
- `hydraClient.getResourceApi()` methods require Hydra resource UUIDs we don't have

This blocks the original "swap to Hydra" plan. Tags/links remain in Neon `sme_resource_tags` / `sme_resource_links`.

**Search (`searchResourcesByType`): MIGRATE to GQL.** Entities are in AuditgraphDB, queryable via `GraphqlReadService.query()`.

**Tag search (`searchTags`): ALREADY DONE.** Delegates to `EngagementHierarchyService.searchTagsByName()` which uses Hydra.

**`listResourcesByTag`: DEAD CODE.** No callers — removed.

### Wave 5 Changes

1. ✅ Remove dead `listResourcesByTag` method
2. ✅ Migrate `searchResourcesByType` from Neon → `GraphqlReadService.query()`
3. ✅ Add `GraphqlReadService` + `SmeMartTagService` imports
4. Tags (`tagResource`, `untagResource`, `getTagsForResource`) — stay on Neon
5. Links (`linkResources`, `deleteResourceLink`, `listResourceLinks`) — stay on Neon
6. Update comments/jsdoc to reflect current state

---

## Next Steps

1. ~~Wave 5 search migration~~ DONE — `searchResourcesByType` on GQL with Neon fallback
2. ~~BidResponse service migration~~ DONE — reads via GQL, writes via Pipeline
3. Provider profiles schema + migration (needs YAML schema classes first)
4. Categories schema + migration (needs YAML schema classes first)

---

*Session: `claude --resume poc/sme-mart`*
