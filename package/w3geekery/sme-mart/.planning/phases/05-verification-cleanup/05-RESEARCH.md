# Phase 5: Verification & Cleanup - Research

**Researched:** 2026-03-19
**Domain:** AuditgraphDB Migration verification, demo data seeding, test infrastructure auditing, and SmeMartDbService cleanup
**Confidence:** HIGH

## Summary

Phase 5 is primarily a **verification + cleanup phase**, not new feature work. Phases 2–4 have already migrated all 8 core entities (Engagement, Bid, BidResponse, Note, NoteFolder, SmeMartDocument, ServiceOffering, Review) to use PipelineWriteService (writes) and GraphqlReadService (reads). Tests have been updated to mock Pipeline + GraphQL services.

Phase 5's work items are:
1. **Demo data seeding** — Migrate seed data from Neon SQL inserts to PipelineWriteService.pushEntities()
2. **Test verification** — Confirm all migrated service tests use Pipeline+GQL mocks (already done by Phases 2–4)
3. **SmeMartDbService removal** — Remove from migrated services only; keep for non-migrated features
4. **Neon archival** — Mark as "scheduled" (2-week observation period before actual archival)

**Primary recommendation:** Scan codebase for lingering Neon SQL inserts (demo data), update to Pipeline API, run test suite, document archival timeline in comments.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Neon Table Archival:** Wait 2 weeks after Phase 5 completion before archiving Neon tables. Tables stay accessible as safety net during verification period. Actual archival is a future task (DATA-03 marked "scheduled").
- **SmeMartDbService Removal:** Remove from migrated services only (EngagementsService, BidsService, NotesService, OrgDocumentService, ServiceOfferingsService, ReviewsService, NoteFolderService). Keep SmeMartDbService for non-migrated features (categories, notifications, provider profiles, app settings, marketplace users).
- **Demo Data Seeding:** Update demo data to use PipelineWriteService.pushEntities() for all 8 migrated entities. Replace Neon SQL inserts for: Engagement, Bid, BidResponse, Note, NoteFolder, SmeMartDocument, ServiceOffering, Review. Non-migrated demo data (categories, providers, etc.) stays on Neon.
- **Test Updates:** All specs for migrated services must mock PipelineWriteService + GraphqlReadService. No SmeMartDbService mocks in migrated service specs. Non-migrated service specs keep SmeMartDbService mocks.

### Claude's Discretion
- Exact demo data seeding implementation (structure, batch sizes, tagging approach)
- Which test files need updating (scan for any lingering SmeMartDbService mocks in migrated service specs)
- Whether to add scheduled reminder/comment for 2-week archival

### Deferred Ideas
- Neon table archival (scheduled for 2 weeks after Phase 5 completion)

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Demo data seeded via PipelineWriteService.pushEntities() instead of Neon SQL inserts | PipelineWriteService API verified with pushEntities(className, data[], tagIds[]); demo data exists in .planning/notes/demo-data-guide.md; 5 active engagements with bids, providers, service categories documented |
| DATA-02 | All existing unit tests updated to mock PipelineWriteService + GraphqlReadService instead of SmeMartDbService | All migrated service specs (.spec.ts) already use fakePipelineWriteService() + fakeGraphqlReadService(); no SmeMartDbService mocks found in migrated service specs; test-helpers provide standardized mocks |
| DATA-03 | Neon entity tables archived (renamed to *_archived) after 2-4 week verification period | Decision: mark as "scheduled" not "done"; 2-week clock starts when Phase 5 completes; operational archival plan deferred to Phase 6 or later |
| DATA-04 | SmeMartDbService removed from all fully-migrated domain services | 8 migrated services identified; 9 non-migrated services still use SmeMartDbService correctly (categories, notifications, provider profiles, impersonation, note-hierarchy, resource, admin, bid-response fallback, document fallback) |

---

## Standard Stack

### Core Migration Services (Read-Only, No Changes)
| Service | Purpose | API |
|---------|---------|-----|
| PipelineWriteService | Pushes entities to AuditgraphDB via Receiver Pipeline | `pushEntity(className, data, tagIds[])`, `pushEntities(className, data[], tagIds[])`, `deleteEntity(className, id)`, `deleteEntities(className, ids[])` |
| GraphqlReadService | Queries entities from AuditgraphDB via GraphQL | `query(entityName, fields[], options)`, `getById(entityName, id)`, `rawQuery(gql)` |
| Field Mapping Constants | Snake_case ↔ camelCase transformation | `ENTITY_FIELD_MAPPING.neonToGql`, `ENTITY_FIELD_MAPPING.gqlToNeon` |

### Test Infrastructure (Verified in Use)
| Mock | Purpose | Verified Location |
|------|---------|------------------|
| `fakePipelineWriteService()` | Unit test mock for Pipeline writes | `src/app/test-helpers/angular.ts:187–194` |
| `fakeGraphqlReadService()` | Unit test mock for GraphQL reads | `src/app/test-helpers/angular.ts:208–217` |
| Field mapping test fixtures | GQL response shapes | `src/app/test-helpers/gql-fixtures.ts` (referenced in all migrated service specs) |

### SmeMartDbService (Kept for Non-Migrated Features)
| Service | Remaining Use Cases |
|---------|-------------------|
| SmeMartDbService | Categories, Notifications, Provider Profiles, Impersonation context, Note hierarchy cache, Admin settings, Resource management, Marketplace users |

---

## Architecture Patterns

### Demo Data Seeding via Pipeline (NEW Pattern for Phase 5)

**What:** Replace Neon SQL `INSERT` statements with batch calls to PipelineWriteService.pushEntities()

**When to use:** Any initial data loading that needs to be in AuditgraphDB for the app to function

**Pattern:**
```typescript
// ❌ OLD: Neon SQL inserts (Phase 1–4)
const result = await this.db.createRow<Engagement>('work_requests', {
  id: engagement.id,
  title: engagement.title,
  // ...
});

// ✅ NEW: Pipeline pushEntities (Phase 5)
const engagementsToSeed = [
  {
    id: 'eng-001',
    name: 'SOC 2 Type I Fast-Track Assessment',
    // ...
  },
  {
    id: 'eng-002',
    name: 'NIST CSF Implementation Advisor',
    // ...
  },
];

const tagIds = ['tag-uuid-1', 'tag-uuid-2']; // Optional: tag resources
await this.pipelineWrite.pushEntities('Engagement', engagementsToSeed, tagIds);
```

**Key points:**
- Single API call for multiple entities (batch)
- Objects must conform to GQL field names (camelCase): `id`, `name`, custom fields
- `tagIds` optional parameter for resource tagging (empty array if unused)
- Fire-and-forget — no need to await; Pipeline handles async ingestion
- Upsert semantics: matches by `id` field, creates or updates

### Test Mocking Pattern (Verified in Place)

**All migrated service specs use:**
```typescript
const mockPipeline = fakePipelineWriteService();
const mockGql = fakeGraphqlReadService();

TestBed.configureTestingModule({
  providers: [
    EngagementsService,
    { provide: PipelineWriteService, useValue: mockPipeline },
    { provide: GraphqlReadService, useValue: mockGql },
    // ... other providers (NOT SmeMartDbService)
  ],
});
```

**Non-migrated service specs continue to use:**
```typescript
const mockDb = fakeSmeMartDb();
TestBed.configureTestingModule({
  providers: [
    CategoriesService,
    { provide: SmeMartDbService, useValue: mockDb },
    // ...
  ],
});
```

### SmeMartDbService Removal Pattern

**Safe removal checklist:**
1. ✓ Service no longer imports SmeMartDbService
2. ✓ Service injects PipelineWriteService + GraphqlReadService instead
3. ✓ All CRUD methods use Pipeline API (pushEntity/deleteEntity for writes, graphqlRead.query for reads)
4. ✓ Field mapping applied at service boundary (mapNeonToGql for writes, mapGqlToNeon for reads)
5. ✓ Service tests mock Pipeline + GQL, not SmeMartDbService
6. ✓ Codebase grep shows no remaining SmeMartDbService references in service file

**DO NOT remove SmeMartDbService from:**
- CategoriesService
- NotificationService
- ProviderProfilesService
- ImpersonationService
- NoteHierarchyService
- AdminService
- SmeMartResourceService
- BidResponseService (has SmeMartDbService fallback for backward compat)
- DocumentService (has SmeMartDbService fallback for backward compat)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|------------|-------------|-----|
| Demo data ingestion | Custom SQL INSERT scripts | PipelineWriteService.pushEntities() | Pipeline handles schema validation, class routing, eventual consistency; custom SQL bypasses validation and indexing |
| Field name mapping | Manual property reassignment | ENTITY_FIELD_MAPPING constants + mapNeonToGql/mapGqlToNeon | Prevents typos, centralizes transformation logic, makes roundtrip tests possible |
| Test mocks for Pipeline/GQL | Custom vitest.fn() chains | fakePipelineWriteService() + fakeGraphqlReadService() | Consistent API surface across all specs; matches production interfaces; shared fixtures reduce maintenance |
| Batch writes | Multiple pushEntity() calls | Single pushEntities() with array | Single API call is more efficient; Pipeline processes as one batch; fewer network roundtrips |

---

## Common Pitfalls

### Pitfall 1: Demo Data Using Neon Field Names (snake_case)

**What goes wrong:** Demo data object keys don't match GQL schema, pipeline rejects or misindexes fields.

**Why it happens:** Field mapping is easy to miss when moving from Neon to Pipeline; old SQL has snake_case columns, GQL schema has camelCase.

**How to avoid:**
- Always transform demo objects via `mapNeonToGql()` before pushing
- Or write demo data in camelCase from the start (matches GQL schema directly)
- Run `npm test` — roundtrip tests verify field mapping correctness for each entity

**Warning signs:**
- Pipeline API call succeeds but GQL queries return empty/missing fields
- Test fixtures fail in roundtrip specs (e.g., `engagement.roundtrip.spec.ts`)

### Pitfall 2: Forgetting SmeMartDbService Remains for Non-Migrated Features

**What goes wrong:** Delete SmeMartDbService entirely, breaking categories, notifications, provider profiles.

**Why it happens:** Phases 2–4 remove SmeMartDbService from migrated services; assumption it's completely gone.

**How to avoid:**
- Check CONTEXT.md locked decision: "keep SmeMartDbService for non-migrated features"
- Grep all service files: any service still using it should be left alone
- List non-migrated services: categories, notifications, provider profiles, impersonation, note-hierarchy, admin, resource, marketplace users

**Warning signs:**
- App fails to load categories on startup
- Notifications don't poll
- Provider search returns 0 results

### Pitfall 3: Test Specs Still Referencing SmeMartDbService Mocks

**What goes wrong:** Unit tests for migrated services fail because they mock SmeMartDbService instead of Pipeline+GQL.

**Why it happens:** Specs copied from older services, mocks not updated during Phase 2–4 migrations.

**How to avoid:**
- Scan all migrated service .spec.ts files for SmeMartDbService imports
- Replace with fakePipelineWriteService() + fakeGraphqlReadService()
- Use `npm test` to catch failures early

**Warning signs:**
- Tests for EngagementsService, BidsService, NotesService, OrgDocumentService, ServiceOfferingsService, ReviewsService pass locally but grep shows SmeMartDbService in their specs

### Pitfall 4: Demo Data Not Tagged (if Resource Tagging Required)

**What goes wrong:** Demo engagements/bids appear in AuditgraphDB but don't have resource tags, so they're not discoverable via tag search in the UI.

**Why it happens:** PipelineWriteService.pushEntities() has optional `tagIds` parameter; easy to forget.

**How to avoid:**
- For demo engagements: ensure they're tagged with `sme-mart.eng.*` tags (see demo-data-guide.md)
- Call: `await this.pipelineWrite.pushEntities('Engagement', engagements, ['tag-uuid-1', 'tag-uuid-2'])`
- If no tags needed: pass empty array `[]`

**Warning signs:**
- Demo data loads but doesn't appear in marketplace search
- UI search by tag returns 0 results for demo entities

---

## Code Examples

### Verified Code: PipelineWriteService API

**Source:** `src/app/core/services/pipeline-write.service.ts`

```typescript
// Push multiple entities in one batch
async pushEntities(
  className: SmeMartClassName,
  data: Record<string, unknown>[],
  tagIds: string[] = [],
): Promise<void> {
  const classId = SME_MART_CLASS_IDS[className];
  const pipelineApi = this.clientApi.platformClient.getPipelineApi();
  const batch = new SimpleBatch(
    new UUID(classId),
    data,
    tagIds.map(id => new UUID(id)),
  );
  await pipelineApi.receive(new UUID(PIPELINE_ID), batch);
}

// Push single entity (wrapper)
async pushEntity(
  className: SmeMartClassName,
  data: Record<string, unknown>,
  tagIds: string[] = [],
): Promise<void> {
  await this.pushEntities(className, [data], tagIds);
}
```

### Verified Code: Field Mapping Example (EngagementsService)

**Source:** `src/app/core/services/engagements.service.ts:160–170`

```typescript
// Transform from Neon model to GQL shape before pushing to Pipeline
const gqlData = mapNeonToGql<GqlEngagementResponse>(
  engagement,
  ENGAGEMENT_FIELD_MAPPING.neonToGql,
);

// Push with fire-and-forget error handling
this.pipelineWrite
  .pushEntity('Engagement', gqlData as unknown as Record<string, unknown>)
  .catch(err => {
    console.error('Failed to push engagement to Pipeline:', err);
  });

// Return immediately (optimistic) without awaiting Pipeline
return { ...engagement, id };
```

### Verified Code: Test Mock Usage (from EngagementsService.spec.ts)

**Source:** `src/app/core/services/engagements.service.spec.ts:18–38`

```typescript
describe('EngagementsService (Pipeline + GraphQL)', () => {
  let service: EngagementsService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();

    TestBed.configureTestingModule({
      providers: [
        EngagementsService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: NotificationService, useValue: { create: vi.fn() } },
      ],
    });

    service = TestBed.inject(EngagementsService);
  });

  it('should query GQL for published engagements', async () => {
    const mockResult = {
      items: [ENGAGEMENT_GQL_FIXTURE],
      page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
    };
    graphqlRead.query.mockResolvedValue(mockResult);

    await service.listEngagements({ pageNumber: 1, pageSize: 50 });

    expect(graphqlRead.query).toHaveBeenCalledWith(
      'Engagement',
      expect.any(Array),
      expect.objectContaining({ filters: { status: '.eq.published' } }),
    );
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Neon SQL `INSERT` for all initial data | PipelineWriteService.pushEntities() for migrated entities | Phase 5 | Single-call batch ingestion; validation at Platform boundary; enables differential sync |
| SmeMartDbService in all domain services | Pipeline+GQL for migrated entities; SmeMartDbService only for non-migrated | Phase 2–5 | Migrated services have no database coupling; tests are simpler; feature toggles easier |
| Field mapping as manual property assignment | Explicit ENTITY_FIELD_MAPPING constants + mapNeonToGql/mapGqlToNeon helpers | Phase 1 | Centralizes schema transformation; roundtrip tests guarantee correctness; less error-prone |
| SmeMartDbService for everything | Two-tier: Platform (Pipeline+GQL) for core workflows, SmeMartDbService for operational data | Phase 5+ | Core entities in versioned AuditgraphDB; non-core features still flexible; cleaner architecture |

**Deprecated/Outdated:**
- **Neon SQL `INSERT` for migrated entities** — Replaced by PipelineWriteService; Neon tables kept for 2-week safety net, then archived
- **SmeMartDbService in migrated services** — Removed in Phase 5; no longer needed after field mapping tested

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest with Angular TestBed |
| Config file | `vitest.config.ts` + `karma.conf.js` |
| Quick run command | `npm test -- --run` (headless, exit after first run) |
| Full suite command | `npm test` (watch mode, re-run on change) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Demo data pushes to Pipeline successfully; objects have correct field names | Integration | `npm test -- src/app/core/services/` | ✅ Roundtrip specs (engagement.roundtrip.spec.ts, bid.roundtrip.spec.ts, etc.) |
| DATA-02 | All migrated service specs mock Pipeline+GQL (no SmeMartDbService) | Unit | `npm test -- engagements.service.spec.ts bids.service.spec.ts notes.service.spec.ts org-document.service.spec.ts service-offerings.service.spec.ts reviews.service.spec.ts` | ✅ Verified — no SmeMartDbService mocks in any migrated service specs |
| DATA-03 | Neon tables remain readable (no actual archival in Phase 5) | Manual | Verify Neon HTTP connection still works; query Neon tables directly | N/A (deferred) |
| DATA-04 | SmeMartDbService imports removed from migrated services | Lint | `grep -r "SmeMartDbService" src/app/core/services/{engagements,bids,notes,org-document,service-offerings,reviews,note-folder}.service.ts` — should return 0 matches | ✅ Verified across all 7 migrated services |

### Sampling Rate
- **Per task commit:** Run all 456+ existing unit tests (`npm test -- --run`)
- **Per phase merge:** Full test suite green + grep verification of SmeMartDbService removal
- **Phase gate:** `npm test` passes + `npm run lint` passes + grep confirms no SmeMartDbService in migrated services before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] **Demo data seeding script or test fixture** — No single "seed.ts" file identified; demo data documentation exists (.planning/notes/demo-data-guide.md), but no working seed code yet. Phase 5 must implement.
- [ ] **Neon archival runbook** — Operations plan for backing up and dropping Neon tables deferred; 2-week observation period starts after Phase 5, archival plan needed before week 2 completion.

---

## Code Inventory

### Migrated Services (DATA-04 Removal Targets)
- ✓ `src/app/core/services/engagements.service.ts` — No SmeMartDbService (verified)
- ✓ `src/app/core/services/bids.service.ts` — No SmeMartDbService (verified)
- ✓ `src/app/core/services/notes.service.ts` — No SmeMartDbService (verified)
- ✓ `src/app/core/services/org-document.service.ts` — No SmeMartDbService (verified)
- ✓ `src/app/core/services/service-offerings.service.ts` — No SmeMartDbService (verified)
- ✓ `src/app/core/services/reviews.service.ts` — No SmeMartDbService (verified)
- ✓ `src/app/core/services/note-folder.service.ts` — No SmeMartDbService (verified)

### Non-Migrated Services (DATA-04 Keep Targets)
- ✓ `src/app/core/services/categories.service.ts` — Uses SmeMartDbService (keep)
- ✓ `src/app/core/services/notification.service.ts` — Uses SmeMartDbService (keep)
- ✓ `src/app/core/services/provider-profiles.service.ts` — Uses SmeMartDbService (keep)
- ✓ `src/app/core/services/impersonation.service.ts` — Uses SmeMartDbService (keep)
- ✓ `src/app/core/services/note-hierarchy.service.ts` — Uses SmeMartDbService (keep)
- ✓ `src/app/core/services/admin.service.ts` — Uses SmeMartDbService (keep)
- ✓ `src/app/core/services/sme-mart-resource.service.ts` — Uses SmeMartDbService (keep)

### Test Files Status
- ✅ All 8 migrated service .spec.ts files use fakePipelineWriteService() + fakeGraphqlReadService()
- ✅ No SmeMartDbService mocks found in any migrated service specs (grep verified)
- ✅ Roundtrip test suite present and verified (engagement.roundtrip.spec.ts, bid.roundtrip.spec.ts, etc.)

---

## Sources

### Primary (HIGH confidence)
- **Context7 / Official Codebase** — All service implementations, test helpers, field mappings verified directly from source
  - PipelineWriteService API: `src/app/core/services/pipeline-write.service.ts`
  - GraphqlReadService API: `src/app/core/services/graphql-read.service.ts`
  - Field mappings: `src/app/core/field-mappings.ts`
  - Test helpers: `src/app/test-helpers/angular.ts`
  - Mock implementations: `fakePipelineWriteService()`, `fakeGraphqlReadService()` verified in place
  - Migrated service examples: EngagementsService, BidsService, OrgDocumentService verified with zero SmeMartDbService references
- **Project Documentation**
  - `.planning/CONTEXT.md` — User locked decisions and discretion areas
  - `.planning/REQUIREMENTS.md` — DATA-01 through DATA-04 requirement traceability
  - `.planning/phases/04-wave-3-standalone-entities/04-VERIFICATION.md` — Prior phase verification report (all 8 entities confirmed migrated)
  - `.planning/notes/demo-data-guide.md` — 5 active engagements documented with ZB Task IDs and provider info

### Secondary (MEDIUM confidence)
- **Verification Reports from Phases 2–4**
  - Phase 4 VERIFICATION: ServiceOfferingsService and ReviewsService migrations confirmed; all migrated entities verified; zero SmeMartDbService references in final state
  - Pattern confirms Phase 5 can reuse same verification approach

### Tertiary (Contextual)
- **CLAUDE.md project guidance** — SME Mart architecture, Angular 21 patterns, no Nx structure

---

## Metadata

**Confidence breakdown:**
- **Demo data seeding approach:** HIGH — PipelineWriteService API verified; demo data catalog exists; no blockers identified
- **Test infrastructure:** HIGH — Test helper mocks already in place; migrated service specs verified using correct mocks; no SmeMartDbService references found
- **SmeMartDbService removal:** HIGH — All migrated services verified with zero SmeMartDbService imports; non-migrated services identified and their usage verified
- **Neon archival:** MEDIUM — Decision is to "mark as scheduled" (no actual work); operational runbook deferred; no technical blockers, just timeline management

**Research date:** 2026-03-19
**Valid until:** 2026-04-02 (14 days — stable phase with no fast-moving dependencies)

**Next phase:** Phase 6 (Project Bloom) blocked on Schema PR #8 merge (1–2 weeks pending Kevin's timeline). Phase 5 is independent and can proceed immediately.
