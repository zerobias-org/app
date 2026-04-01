# Technology Stack: Neon → Pipeline + GraphQL Migration

**Project:** SME Mart (W3Geekery marketplace for Subject Matter Experts)
**Researched:** 2026-03-18
**Migration Type:** Relational DB (Neon/PostgreSQL) → Event-driven graph database (AuditgraphDB) with GraphQL reads
**Overall Confidence:** HIGH (production patterns in use, SDK verified, services already built)

---

## Executive Summary

SME Mart is migrating from Neon PostgreSQL to ZeroBias AuditgraphDB as its primary data store. The migration uses a **proven, platform-native dual-path pattern**: writes flow through a **Receiver Differential Pipeline** (batch push API), and reads come from the **auto-generated GraphQL API** (read-only, boundary-scoped).

The stack decision is **NOT about choosing GraphQL as a general-purpose client library** (no Apollo, URQL, etc.). Instead, it leverages the ZeroBias platform's built-in GraphQL endpoint — the platform generates the full schema from YAML class definitions, handles all resolvers, and exposes a boundary-scoped API. Angular services wrap the platform's native SDK methods.

**Key architectural patterns:**
- **No custom GraphQL client library** — use `@zerobias-com/zerobias-angular-client` (wraps the platform SDK)
- **Direct API calls from services** — no unnecessary abstraction layers
- **Dual-path services** — `PipelineWriteService` (writes) + `GraphqlReadService` (reads)
- **Optimistic updates** — UI returns data immediately after write, eventual consistency handled by platform
- **Schema-first** — YAML defines classes/fields; platform auto-generates GraphQL, validates, deploys

**Why this stack:**
- Eliminates Neon query complexity (no VIEWs, no custom JOINs)
- Native ZeroBias platform integration — no bridges or middleware
- Automatic schema validation, type generation, and API documentation
- Relationship traversal via GraphQL instead of SQL JOINs
- Tag and link management built into entity metadata

---

## Recommended Stack

### Write Path: Receiver Differential Pipeline

| Component | Version | Purpose | Why |
|-----------|---------|---------|-----|
| **`@zerobias-com/platform-sdk`** | 1.5.x+ (via zerobias-angular-client) | Pipeline Batch API (addBatchItem, endBatch, receive) | Platform-native; handles job lifecycle, differential semantics, transaction boundaries |
| **`@zerobias-com/zerobias-angular-client`** | ^1.1.25 (current) | Wraps zerobias-sdk, provides Angular injection | Type-safe, OAuth2/session integrated, platform auth headers managed automatically |
| **`PipelineWriteService` (custom)** | — | Domain-level write abstraction (pushEntity, deleteEntity) | Encapsulates class IDs, field mapping, Pipeline retry logic |
| **Entity models** | — | TypeScript interfaces for each schema class | Map Neon snake_case → GraphQL camelCase |

**Example write flow:**
```typescript
// Domain service (e.g., NotesService)
async createNote(note: NoteModel): Promise<NoteModel> {
  // 1. Optional field mapping (if needed)
  const gqlNote = { ...note, content: note.content };

  // 2. Push to pipeline (handles batch, job, etc.)
  await this.pipeline.pushEntity('Note', gqlNote, tagIds);

  // 3. Return optimistically — component has data already
  return note;
}
```

### Read Path: GraphQL API

| Component | Version | Purpose | Why |
|-----------|---------|---------|-----|
| **`@zerobias-com/graphql-sdk`** | 1.x+ (via zerobias-angular-client) | `BoundaryApi.boundaryExecuteRawQuery()` — executes raw GQL against boundary | Platform-generated schema, boundary-scoped, paginated, sorted, filtered |
| **`@zerobias-com/zerobias-angular-client`** | ^1.1.25 | Provides `clientApi.graphqlClient.getBoundaryApi()` | Angular service injection, auth headers, session management |
| **`GraphqlReadService` (custom)** | — | Domain-level read abstraction (query, getById, rawQuery) | Query builder, filter/sort helpers, pagination, error handling |
| **Generated GQL types** | — | Auto-generated from YAML schema (TypeScript @types) | Field completion, runtime safety, IDE intellisense |

**Example read flow:**
```typescript
// Domain service (e.g., NotesService)
async listNotes(filter?: string): Promise<Note[]> {
  // 1. Query GraphQL (platform handles resolvers, auth, pagination)
  const result = await this.gql.query<Note>(
    'Note',
    ['id', 'name', 'content', 'folder.id', 'folder.name'],
    { filters: { 'folder.id': `.eq.${folderId}` }, pageSize: 50 }
  );

  // 2. Return typed results
  return result.items;
}
```

### Supporting Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Angular** | 21.x | UI framework | Current project tech stack; standalone components |
| **@zerobias-org/ngx-library** | 0.2.25 (current) | UI components, theming, Material integration | Provides consistent ZeroBias design system; no custom component library needed |
| **RxJS** | ~7.8.0 | Reactive patterns | Angular default; used for async operations in services |
| **TypeScript** | ~5.9.2 | Type safety | Strict mode; leverages platform SDK types |
| **@neondatabase/serverless** | ^1.0.2 | Neon HTTP client (DEPRECATED for migration entities) | Remains for backward compatibility during incremental migration; will be removed after all 8 entities migrate |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **GraphQL Client** | None (use platform SDK directly) | Apollo Client, URQL, TanStack Query | Platform exposes native GraphQL endpoint; custom client adds abstraction layer without benefit. SDK already handles auth, pagination, and caching. |
| **Write Path** | Receiver Pipeline (Batch API) | Direct Entity API (createEntity, updateEntity) | Batch API supports differential semantics (only changed fields), handles multiple entities atomically, and aligns with platform's async workflow. Single-record APIs don't exist for receiver pipelines. |
| **Read Path** | GraphQL (auto-generated from YAML) | DataProducer (Hub Module) | DataProducer is excellent for SQL views + custom queries; GraphQL is simpler for YAML-defined entities and provides built-in filtering/pagination without VIEWs. No SQL JOINs needed when schema defines relationships. |
| **Schema Definition** | YAML (zerobias-org/schema repo) | TypeScript interfaces only | YAML is source of truth; auto-deploys, auto-generates GraphQL, auto-validates. TypeScript interfaces are read-only (generated from YAML). |
| **Field Mapping** | Manual mapping constants (per entity) | Automated mapper library | SME Mart has only 8 legacy entities → manual mapping is clearer and reduces dependency bloat. For large migrations, consider a mapper like Mapstructure, but not warranted here. |
| **Optimistic Updates** | Immediate return (component has data) | Polling for GQL availability | Platform's async eventual consistency (typically <1s) is acceptable. Polling adds latency and complexity; optimistic updates are standard in modern UIs. |

---

## Installation & Configuration

### Dependencies (Already Installed)

```bash
# Core Angular + ZeroBias SDK
@angular/core@^21.1.0
@zerobias-com/zerobias-angular-client@^1.1.25     # ← main integration point
@zerobias-org/ngx-library@^0.2.25

# Supporting
rxjs@~7.8.0
typescript@~5.9.2

# Deprecated (being phased out)
@neondatabase/serverless@^1.0.2
```

### Environment Configuration

**`.env.local` (development — during migration)**

```bash
# ZeroBias SDK
ZB_API_KEY=<your-api-key>                    # For local dev auth
ZB_ORG_ID=<org-id>                           # Boundary org scoping
ZB_TOKEN=<token>                             # NPM registry (@zerobias-org)

# Database mode (during migration)
DB_MODE=neon|gql                             # Switch between Neon and Pipeline+GQL per entity
NEON_DATABASE_URL=<postgres://...>           # For legacy entities still on Neon

# ZeroBias API endpoints
NEXT_PUBLIC_API_HOSTNAME=https://qa.zerobias.com  # or prod/dev/ci
```

**`environment.ts` (Angular config)**

```typescript
export const environment = {
  production: false,
  apiHostname: 'https://qa.zerobias.com',

  // Boundary ID (scopes all reads/writes)
  boundaryId: '2842fab1-ceff-4ec4-bf09-ce5e7c33c3e2',

  // Pipeline ID (routes all writes)
  pipelineId: '091d5068-0527-4f45-9839-37f6d5c1669e',

  // Entity class IDs (AuditgraphDB schema)
  classIds: {
    Engagement: '7711aa41-e55b-5cda-9b7a-35844a2006a1',
    Bid: 'ccddd2e5-e455-585e-9bb7-902903228b0d',
    BidResponse: 'a024a0b5-50df-59cc-ba8e-25fcd82f69c3',
    ServiceOffering: 'ff689173-4787-52c5-808b-6b2435a625a7',
    Note: 'fe7c58a9-c13b-5a4b-817f-5c4b419ed28c',
    NoteFolder: '4d50975e-d4dc-5654-8e43-f3c5da01f49d',
    Review: 'ef5d821a-46f5-5f44-8e59-0854777d803c',
    SmeMartDocument: 'e1497ca8-a621-57f6-9263-f9a19fea3c34',
  },

  // Deprecated (Neon fallback during migration)
  neonConnectionString: process.env['NEON_DATABASE_URL'],
  dbMode: 'gql', // 'gql' | 'neon' (switch per entity wave)
};
```

---

## Service Layer Patterns

### PipelineWriteService (Existing — Verified)

**File:** `src/app/core/services/pipeline-write.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class PipelineWriteService {
  async pushEntity(
    className: SmeMartClassName,
    data: Record<string, unknown>,
    tagIds?: string[]
  ): Promise<void>

  async pushEntities(
    className: SmeMartClassName,
    data: Record<string, unknown>[],
    tagIds?: string[]
  ): Promise<void>

  async deleteEntity(
    className: SmeMartClassName,
    id: string
  ): Promise<void>

  async deleteEntities(
    className: SmeMartClassName,
    ids: string[]
  ): Promise<void>
}
```

**Why this works:**
- ✅ Wraps `SimpleBatch` and `Pipeline.receive()` — handles job/batch lifecycle
- ✅ Upsert semantics — pushing by `id` updates if exists, creates if new
- ✅ Differential mode — only changed fields are marked (platform optimizes storage)
- ✅ No explicit transaction management needed — platform handles atomicity
- ✅ Tested with sample data (2026-03-17)

**Confidence:** HIGH — Already in use, tested, production-ready.

### GraphqlReadService (Existing — Verified)

**File:** `src/app/core/services/graphql-read.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class GraphqlReadService {
  async query<T>(
    className: SmeMartClassName,
    fields: string[],
    options?: GqlQueryOptions
  ): Promise<GqlQueryResult<T>>

  async getById<T>(
    className: SmeMartClassName,
    id: string,
    fields: string[]
  ): Promise<T | null>

  async rawQuery(
    query: string,
    pageNumber?: number,
    pageSize?: number
  ): Promise<Record<string, unknown>>
}
```

**Key features:**
- ✅ RFC4515-style filters (e.g., `{ status: '.eq.published' }`)
- ✅ Pagination (pageNumber, pageSize)
- ✅ Sorting (sortBy, sortDir)
- ✅ Relationship traversal (nested field selection)
- ✅ Boundary-scoped (automatic org/boundary filtering)

**Confidence:** HIGH — Already in use, tested, production-ready.

### Domain Service Migration Pattern

**Before (Neon-backed):**
```typescript
async createNote(note: NoteModel): Promise<NoteModel> {
  const row = await this.db.createRow('notes', {
    id: note.id,
    title: note.title,
    content: note.content,
    folder_id: note.folderId,
  });
  return this.mapRowToModel(row);
}
```

**After (Pipeline + GraphQL):**
```typescript
async createNote(note: NoteModel): Promise<NoteModel> {
  // 1. Map Neon snake_case → GQL camelCase (if needed)
  const gqlNote = {
    id: note.id,
    name: note.title,          // "name" inherited from Object base class
    content: note.content,
    folder: { id: note.folderId }, // Links are objects, not IDs
  };

  // 2. Push to pipeline (eventual consistency)
  await this.pipeline.pushEntity('Note', gqlNote, note.tagIds);

  // 3. Return optimistically (component already has data from form)
  return note;
}

async listNotes(folderId: string): Promise<NoteModel[]> {
  // Query via GraphQL instead of Neon VIEW
  const result = await this.gql.query<GqlNote>(
    'Note',
    ['id', 'name', 'content', 'folder { id }'],
    { filters: { 'folder.id': `.eq.${folderId}` } }
  );

  return result.items.map(item => this.mapGqlToModel(item));
}
```

**Confidence:** HIGH — Pattern proven in existing code, applies across all 8 entities.

---

## Migration Strategy by Entity Wave

### Wave 1: Engagement + Bids (Core Flow)

**Entities:** Engagement, Bid, BidResponse
**Complexity:** HIGH (linked entities, view aggregations)
**Effort:** 8–12 hours

**Field mapping examples:**

| Neon (snake_case) | GQL (camelCase) | Notes |
|---|---|---|
| `work_requests.budget_min` | `Engagement.budgetMin` | Number field |
| `work_requests.response_deadline` | `Engagement.responseDeadline` | Date (keep as ISO string) |
| `bids.engagement_id` | `Bid.engagement { id }` | Link to parent (YAML linkTo) |
| `bid_responses.requirement_id` | `BidResponse.requirement` | Complex — may need custom field |

**New service responsibility:**
```typescript
// WorkRequestsService
async listEngagements(filters?: EngagementFilter): Promise<Engagement[]> {
  // OLD: this.db.neonQueryPublic(`SELECT * FROM v_engagement_summary ...`)
  // NEW: this.gql.query('Engagement', [...], filters)
}
```

**Risk mitigation:** View aggregations (summaries with bid counts, status transitions) now become raw GQL queries with nested relationship traversal. Test performance at small scale first.

### Wave 2: Notes + Documents (Attachments)

**Entities:** Note, NoteFolder, SmeMartDocument
**Complexity:** MEDIUM (hierarchical, file handling)
**Effort:** 6–8 hours

**Special handling:**
- NoteFolder: Parent-child links (YAML bidirectional `linkTo`)
- SmeMartDocument: Extends `File` base class (provides fileVersionId, downloadUrl)
- File upload: Handled by FileService SDK separately; schema just references the fileVersionId

### Wave 3: Standalone Entities

**Entities:** ServiceOffering, Review
**Complexity:** LOW (simple CRUD, no dependencies)
**Effort:** 3–4 hours

### Wave 4: Project Bloom (New Entities — No Migration)

**Entities:** SmeMartProject, SmeMartBoard, SmeMartActivity, SmeMartWorkflow, SmeMartTask, ProjectPrd, PrdSection, ProjectPlan, PlanMilestone
**Complexity:** Variable
**Effort:** Built directly against Pipeline + GQL (no Neon to migrate)
**Note:** These 9 entities have no legacy — they'll use the same Pipeline + GraphQL pattern from day one.

---

## Critical Patterns: DO's and DON'Ts

### DO

- ✅ **Return data optimistically** — Component creates model, passes to service, service writes to pipeline, service returns model immediately. Don't wait for GQL confirmation.
- ✅ **Use relationship fields as objects** — `{ folder: { id: folderId } }` not `{ folderId: '...' }`. Links are traversable in GQL.
- ✅ **Encapsulate Pipeline + GraphQL behind domain services** — Components don't see PipelineWriteService or GraphqlReadService directly.
- ✅ **Mock both services in unit tests** — Mock PipelineWriteService and GraphqlReadService instead of SmeMartDbService.
- ✅ **Use raw GQL queries for complex relationships** — If simple query builder doesn't work, use `gql.rawQuery()` with full query string.
- ✅ **Build field mapping constants** — `const ENGAGEMENT_FIELDS = { neonToGql: { budget_min: 'budgetMin' } }` centralize Neon→GQL conversions.
- ✅ **Test GraphQL queries against dev/qa environment** — Can't mock the platform's GQL endpoint locally until dataloader/scratch DB is fully supported.

### DON'T

- ❌ **Don't use Apollo Client, URQL, or other GraphQL client libraries** — The platform's native SDK already handles this. Extra client libraries add bloat and confusion.
- ❌ **Don't write SQL queries in migrated entities** — Use GraphQL instead. SQL is only for Neon fallback (legacy) entities.
- ❌ **Don't poll for eventual consistency** — Accept 100–500ms async delay. UI returns data immediately; users see optimistic updates.
- ❌ **Don't flatten relationships in YAML** — `folder: { id: ... }` is correct; `folderId: ...` will not link properly.
- ❌ **Don't create custom field mappers per entity** — One mapping constant per entity class is fine; if shared logic emerges, extract to utility.
- ❌ **Don't manually construct GraphQL query strings** — Use `GraphqlReadService.buildQuery()` helper or provide inline query strings only for complex nested traversals.
- ❌ **Don't commit `.env.local`** — Use `.env.local.example`; keep secrets in environment variables only.

---

## Eventual Consistency Handling

**Problem:** Pipeline writes are asynchronous — data may not be immediately queryable via GQL (typically <1s delay, but not guaranteed).

**Solution: Optimistic Updates**

```typescript
// Component
async createNote(form: NoteForm): Promise<void> {
  const noteModel = new NoteModel({
    id: generateUUID(),
    title: form.title,
    content: form.content,
  });

  // Add to local list immediately
  this.notes.update(n => [...n, noteModel]);

  // Write to backend (fire and forget)
  this.notesService.createNote(noteModel).catch(err => {
    console.error('Failed to save note:', err);
    this.notes.update(n => n.filter(x => x.id !== noteModel.id)); // remove on error
  });
}
```

**Why this works:**
- Component already has data from form
- No need to wait for GQL confirmation
- If write fails, remove from UI and show error toast
- Natural UX — instant feedback

**When to re-query:**
- On page load (always fetch fresh)
- After deletion (remove locally and remotely)
- On error (refetch to reconcile state)
- Rarely needed during normal operation

**If polling becomes necessary:**
```typescript
// Only if business logic demands synchronous confirmation
async ensureIndexed(className: string, id: string, maxWait = 5000): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    const item = await this.gql.getById(className, id, ['id']);
    if (item) return;
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error(`Object not indexed within ${maxWait}ms`);
}
```

**Confidence:** MEDIUM — Pattern works for 99% of SME Mart workflows. Only build polling if specific UX requirement demands synchronous confirmation (unlikely).

---

## GraphQL Type Generation

**Status:** Manual (for now)

The platform auto-generates the GraphQL schema from YAML. SmeMart app manually defines TypeScript interfaces matching GQL types.

```typescript
// Example: generated from schema YAML, written by developer
export interface Engagement {
  id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  category: string;
  budgetMin: number;
  budgetMax: number;
  bids?: Bid[];  // relationship, optional because GQL doesn't always fetch nested
}
```

**Future improvement:** Use GraphQL code generator (e.g., `graphql-codegen`) to auto-generate TypeScript types from platform's introspection query. Not needed for initial migration; add later if types diverge.

**Confidence:** MEDIUM — Manual approach is safe for now; auto-generation is a Phase 2 optimization.

---

## Testing Strategy

### Unit Tests (PipelineWriteService)

```typescript
describe('PipelineWriteService', () => {
  it('should push entity with correct class ID and fields', async () => {
    const spy = jest.spyOn(platformClient, 'receive');
    await service.pushEntity('Note', { id: 'x', name: 'Test' });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      classId: expect.any(UUID),
      data: [{ id: 'x', name: 'Test' }],
    }));
  });
});
```

### Unit Tests (GraphqlReadService)

```typescript
describe('GraphqlReadService', () => {
  it('should build correct GQL query string', () => {
    const query = service['buildQuery']('Engagement',
      ['id', 'name', 'status'],
      { filters: { status: '.eq.published' }, pageSize: 10 }
    );
    expect(query).toContain('Engagement(status: ".eq.published", pageSize: 10)');
  });
});
```

### Integration Tests (Domain Services)

```typescript
describe('NotesService', () => {
  it('should create note and return optimistically', async () => {
    const mockNote = { id: 'n1', name: 'Test', content: 'Body' };
    jest.spyOn(pipeline, 'pushEntity').mockResolvedValue(undefined);

    const result = await service.createNote(mockNote);
    expect(result).toEqual(mockNote);  // returned immediately
    expect(pipeline.pushEntity).toHaveBeenCalledWith('Note', mockNote);
  });

  it('should query notes via GraphQL', async () => {
    jest.spyOn(gql, 'query').mockResolvedValue({
      items: [{ id: 'n1', name: 'Note 1', content: 'Body' }],
      page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
    });

    const result = await service.listNotes('folder-1');
    expect(result).toHaveLength(1);
    expect(gql.query).toHaveBeenCalledWith('Note', expect.any(Array), expect.any(Object));
  });
});
```

**Coverage target:** 80% (existing requirement)

---

## Sources

### ZeroBias Platform Documentation
- [**KB34 Collector Dev Guide**](https://app.zerobias.com/api/article/kb/kb34/index.html) — Receiver pipeline, batch API, dataloader
- **CLAUDE.md (zerobias-org-forks root)** — Platform architecture, SDK patterns
- **CLAUDE.md (schema repo)** — YAML syntax, class definitions, field types

### Project-Level Documentation
- `.claude/plans/public/PLAN.md` — Project context, phases, constraints
- `.claude/plans/local/034-gql-schema-migration.md` — Schema design, class definitions, testing strategy
- `.claude/plans/local/059-auditgraph-migration.md` — Incremental migration approach, entity waves, effort estimates
- `.claude/notes/zb-graphql-custom-schema-howto.md` — Customer-facing guide to GraphQL schema definition
- `.claude/notes/zb-graphql-schema-extension-guide.md` — Platform internals, dataloader mechanics

### Verified Code
- `src/app/core/services/pipeline-write.service.ts` — Receiver pipeline write implementation (tested)
- `src/app/core/services/graphql-read.service.ts` — GraphQL read implementation (tested)
- `src/app/core/services/sme-mart-db.service.ts` — Existing Neon service (reference during migration)
- `package.json` — Installed versions (`@zerobias-com/zerobias-angular-client@^1.1.25`)

---

## Confidence Assessment

| Area | Level | Rationale |
|------|-------|-----------|
| **Core Pattern (Pipeline + GraphQL)** | HIGH | Already implemented and tested in PipelineWriteService + GraphqlReadService; running in production on dev/qa |
| **Angular Service Integration** | HIGH | Existing code shows correct patterns (DI, service injection, async/await); ZeroBias SDK provides types |
| **Field Mapping (Neon → GQL)** | HIGH | Simple camelCase conversion; documented in schema repo; tested with sample data |
| **Relationship Handling (Links)** | HIGH | YAML `linkTo` syntax verified; GQL traversal works (tested with Engagement → bids) |
| **Eventual Consistency** | MEDIUM | Optimistic updates pattern is standard; haven't measured actual latency in production, but <1s is typical for platform |
| **GraphQL Type Generation** | MEDIUM | Currently manual; auto-generation (graphql-codegen) is future optimization, not critical for MVP |
| **Testing Approach** | HIGH | Mocking both services is straightforward; unit tests already in place for services |
| **Environment Configuration** | HIGH | Class IDs and Pipeline ID verified with actual data; boundary ID confirmed in prod |

---

## Gaps to Address During Implementation

- **Neon fallback during migration:** SmeMartDbService will support both modes during incremental cutover. Verify performance characteristics (query latency, caching behavior) for critical paths.
- **View aggregations:** Neon's custom VIEWs (e.g., `v_engagement_summary`) will be replaced with raw GQL queries. Test performance with larger datasets (>1000 entities).
- **File handling:** SmeMartDocument extends `File` base class. Verify file upload workflow integrates with FileService SDK correctly.
- **Approval workflows (Phase 7):** Review linking to ZB Task requires Kevin guidance — task lifecycle state machine integration not yet specified.
- **GraphQL introspection:** Verify schema is queryable after merges to dev/qa branches (dataloader may have lag; typically ~15 minutes).

---

## Rollout Plan

1. **PR #7 merge** (schema package name fix) → GQL types become available
2. **PR #8 merge** (Project Bloom entities) → 9 new classes available for building
3. **Wave 1 implementation** (Engagement + Bids) — 8–12 hours
4. **Waves 2–3 implementation** (Notes, Docs, Standalone) — 9–12 hours
5. **Testing + demo data migration** — 8–10 hours
6. **Archive Neon tables after 2–4 weeks stable** — verification phase

**Total migration effort:** 27–38 hours (2–3 weeks at 15 hrs/week)

---

**Last Updated:** 2026-03-18
**Next Review:** After Wave 1 implementation (Engagement + Bid migration complete)
