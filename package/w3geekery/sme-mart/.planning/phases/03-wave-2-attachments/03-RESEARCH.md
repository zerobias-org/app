# Phase 3: Wave 2 - Attachments - Research

**Researched:** 2026-03-18
**Domain:** Notes, document, and folder hierarchy migration from Neon PostgreSQL to AuditgraphDB (Pipeline writes + GraphQL reads)
**Confidence:** HIGH

## Summary

Phase 3 migrates Notes and Documents from Neon-backed services to AuditgraphDB using the exact same pattern established in Phase 2 (Engagements/Bids migration). The phase has three key deliverables:

1. **NotesService migration** — Replace SmeMartDbService with PipelineWriteService + GraphqlReadService for Note CRUD
2. **NoteFolderService migration** — New service for NoteFolder hierarchy, with flat-fetch + client-side tree rebuilding
3. **OrgDocumentService migration** — Swap metadata storage from Neon to Pipeline+GQL, keeping FileService binaries unchanged

All field mappings exist (Phase 1), GQL types are defined, test fixtures are in place, and the migration pattern from Phase 2 is proven and reusable. **Zero component changes required** — domain service public APIs remain unchanged. The planner can use Phase 2's structure as a direct template.

**Primary recommendation:** Follow Phase 2 pattern exactly (three tasks: service migration + optimistic updates + unit tests), treating Notes and NoteFolder as a single migration unit since they're always queried together. Use flat GQL fetch + client-side tree rebuild algorithm (simple parentId mapping, handles any depth in one query).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Flat fetch NoteFolders + client rebuild:** Fetch all NoteFolders in a single flat GQL query, rebuild tree client-side using parentId. Works at any depth, one round-trip.
- **Document metadata in GQL, files in FileService:** Document metadata (name, type, engagement link, documentType) moves to Pipeline+GQL. Actual file binary stays in ZB FileService. downloadUrl comes from FileService, not GQL.
- **SmeMartDocument extends File in schema:** fileVersionId, mimeType, size come from GQL; downloadUrl/viewUrl from FileService.
- **Use GQL ilike for note search:** RFC4515 ilike filter on note content/name fields. Covers basic substring matching. Less powerful than Neon full-text search but good enough for v1.
- **Same swap pattern as Phase 2:** Service injection swap (SmeMartDbService → PipelineWriteService + GraphqlReadService), flatten GQL responses, optimistic updates.

### Claude's Discretion
- Exact GQL query structure for flat NoteFolder fetch
- Tree rebuild algorithm (parentId → children mapping)
- How to handle notes with sme-doc:// links during migration (link format stays the same)
- Error handling for FileService failures (document metadata exists in GQL but file not found)
- Whether to consolidate Note + NoteFolder into a single service migration or keep separate tasks

### Deferred Ideas (OUT OF SCOPE)
- Demo data seeding (Phase 5)
- Neon table archival (Phase 5)
- Advanced error handling with ensureIndexed polling (v2 only)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MIG-09 | NotesService writes Note entities via PipelineWriteService instead of SmeMartDbService | Field mappings exist (NOTE_FIELD_MAPPING), GQL types defined (GqlNoteResponse), test fixtures available. Pattern verified in Phase 2. |
| MIG-10 | NotesService reads Note entities via GraphqlReadService instead of SmeMartDbService | GraphqlReadService.query() with ilike filters on title/body fields. Supports pagination and search via RFC4515 filters. |
| MIG-11 | NotesService writes NoteFolder entities via PipelineWriteService instead of SmeMartDbService | Field mappings exist (NOTE_FOLDER_FIELD_MAPPING), GQL types defined (GqlNoteFolderResponse), class ID registered in SME_MART_CLASS_IDS. |
| MIG-12 | NotesService reads NoteFolder entities via GraphqlReadService instead of SmeMartDbService | Flat fetch all folders in one query (no parentId filter), client rebuilds tree. Single query = no N+1 problem. |
| MIG-13 | NoteFolder parent/child hierarchy preserved through GQL relationship traversal | Flat fetch + parentId-based tree rebuild in TypeScript. No GQL nested queries needed. Simpler than Engagement/Bid nested fetching. |
| MIG-14 | DocumentService writes SmeMartDocument entities via PipelineWriteService instead of SmeMartDbService | Field mappings exist (DOCUMENT_FIELD_MAPPING), GQL types defined (GqlDocumentResponse), class ID registered. File binary stays in FileService. |
| MIG-15 | DocumentService reads SmeMartDocument entities via GraphqlReadService instead of SmeMartDbService | Metadata-only reads from GQL. FileService provides downloadUrl separately. No file download path changes. |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@zerobias-com/zerobias-client` | Latest from workspace | Platform client SDK for API access | Only official SDK for platform authentication and API calls |
| `@zerobias-com/platform-sdk` | Latest | SimpleBatch for Pipeline writes | Official SDK for AuditgraphDB ingestion |
| `@zerobias-com/graphql-sdk` | Latest | GraphQL query execution | Official SDK for GQL endpoint access |
| Angular signals | 21+ | Reactive state (loading, data lists) | Built-in Angular 21, no external dependencies needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^1.0 | Unit test runner | All service unit tests (matches Phase 2) |
| `@angular/core` testing utilities | 21+ | TestBed, dependency injection mocking | Service test setup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Flat fetch + client tree rebuild | Nested GQL queries with recursive child fetching | Simpler pagination handling but multiple round-trips, N+1 risk at scale |
| ilike filters for note search | Full-text search SQL function | GQL has no full-text FTS operator; ilike is sufficient for MVP |
| Field mappings as constants | Inline field transformation | Constants enable roundtrip tests and prevent field-loss bugs |

**Installation:**
All dependencies are already in `package.json` from Phase 1–2 work. No new installs needed.

**Version verification:** SME_MART_CLASS_IDs and field mappings verified 2026-03-18 against Phase 1 code. GQL types generated from schema PR #7 and confirmed in codebase.

---

## Architecture Patterns

### Recommended Project Structure

Services being migrated:
```
src/app/core/services/
├── notes.service.ts              # NotesService (MIGRATE)
├── notes.service.spec.ts
├── note-folder.service.ts        # NoteFolderService (NEW — same injection as NotesService)
├── note-folder.service.spec.ts
├── org-document.service.ts       # OrgDocumentService (MIGRATE)
├── org-document.service.spec.ts
├── pipeline-write.service.ts     # Already built (Phase 1)
├── graphql-read.service.ts       # Already built (Phase 1)
└── (other services unchanged)
```

Models being used:
```
src/app/core/models/
├── note.model.ts                 # Note, NoteFolder, NoteWithTags, NoteFolderWithCounts
├── org-document.model.ts         # OrgDocument, OrgDocumentDetail, OrgDocumentShare
└── document.model.ts             # EngagementDocument (MIGRATE to SmeMartDocument in GQL)
```

GQL types (already defined):
```
src/app/core/gql-types/
├── note.types.ts                 # GqlNoteResponse, NoteAccessLevel
├── note-folder.types.ts          # GqlNoteFolderResponse
├── document.types.ts             # GqlDocumentResponse, DocumentType
```

### Pattern 1: Service Injection Swap
**What:** Replace SmeMartDbService with PipelineWriteService + GraphqlReadService in constructor. Keep public API unchanged.

**When to use:** All three services in this phase follow this pattern (established in Phase 2).

**Example:**
```typescript
// Before (Neon-backed)
@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly db = inject(SmeMartDbService);

  async createNote(engagementId: string, data: CreateNoteRequest): Promise<Note> {
    return this.db.createRow<Note>('notes', {
      engagement_id: engagementId,
      author_zerobias_user_id: userId,
      title: data.title,
      body: data.body,
      // ... more fields
    });
  }
}

// After (AuditgraphDB-backed)
@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);

  async createNote(engagementId: string, data: CreateNoteRequest): Promise<Note> {
    const gqlData = {
      id: generateUUID(),
      engagementId,
      authorZerobiasUserId: userId,
      title: data.title,
      body: data.body,
      // ... more fields (camelCase)
    };

    // Optimistic update — return immediately
    const note = mapGqlToNeon<Note>(gqlData, NOTE_FIELD_MAPPING.gqlToNeon);

    // Fire-and-forget push to Pipeline (no await)
    this.pipelineWrite.pushEntity('Note', gqlData).catch(err => {
      console.error('Pipeline push failed:', err);
      // Component already displayed data; error logging is enough
    });

    return note; // Return immediately for UI
  }
}
```

### Pattern 2: GQL Response Flattening
**What:** Transform GQL responses (camelCase) into component-facing types (snake_case for internal model compatibility, or keep camelCase for GQL-native types). Use field mapping helpers.

**When to use:** All GQL read operations (query, getById).

**Example:**
```typescript
async searchNotes(engagementId: string, query: string, options?: QueryOptions): Promise<PagedResults<NoteWithTags>> {
  this.loading.set(true);
  try {
    const gqlOptions: GqlQueryOptions = {
      filters: {
        engagementId: `.eq.${engagementId}`,
        // For ilike search: match title OR body
        // GQL doesn't support OR in filters directly, so use two queries or search in component
        title: `.ilike.%${query}%`,
      },
      pageNumber: options?.pageNumber ?? 1,
      pageSize: options?.pageSize ?? 50,
    };

    const result = await this.graphqlRead.query<GqlNoteResponse>(
      'Note',
      ['id', 'title', 'body', 'engagementId', 'folderId', 'authorZerobiasUserId', 'createdAt', 'updatedAt'],
      gqlOptions,
    );

    // Transform GQL → NoteWithTags (keeping tags field from VIEW)
    const items = result.items.map(gql => ({
      ...mapGqlToNeon<Note>(gql, NOTE_FIELD_MAPPING.gqlToNeon),
      tags: null, // Will be populated separately if needed
      tag_count: 0,
      folder_color: null,
      folder_name: null,
    }));

    this.notes.set(items);
    return PagedResults.fromArray(items, gqlOptions.pageNumber, gqlOptions.pageSize, result.page.totalCount);
  } finally {
    this.loading.set(false);
  }
}
```

### Pattern 3: Folder Tree Rebuild (Novel to Phase 3)
**What:** Flat-fetch all NoteFolders for an engagement, rebuild parent-child tree client-side using parentId mapping. No recursive GQL queries.

**When to use:** Any hierarchical folder navigation; getNoteFolderTree() method.

**Example:**
```typescript
async getNoteFolderTree(engagementId: string): Promise<NoteFolderTreeNode[]> {
  // Fetch all folders in one query
  const result = await this.graphqlRead.query<GqlNoteFolderResponse>(
    'NoteFolder',
    ['id', 'engagementId', 'parentId', 'name', 'sortOrder', 'color'],
    {
      filters: { engagementId: `.eq.${engagementId}` },
      pageNumber: 1,
      pageSize: 1000, // Assume <1000 folders per engagement
    },
  );

  // Build parent-child map
  const allFolders = result.items.map(gql =>
    mapGqlToNeon<NoteFolder>(gql, NOTE_FOLDER_FIELD_MAPPING.gqlToNeon)
  );

  const folderMap = new Map(allFolders.map(f => [f.id, f]));
  const rootFolders = allFolders.filter(f => !f.parent_id);

  // Recursive tree builder
  const buildTree = (parent: NoteFolder): NoteFolderTreeNode => ({
    ...parent,
    children: allFolders
      .filter(f => f.parent_id === parent.id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(child => buildTree(child)),
  });

  return rootFolders
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(root => buildTree(root));
}
```

### Pattern 4: Document Metadata-Only Migration
**What:** Document metadata (name, type, engagement link) moves to Pipeline+GQL. File binary stays in FileService. downloadUrl is fetched separately from FileService.

**When to use:** All SmeMartDocument CRUD operations.

**Example:**
```typescript
async uploadDocument(engagementId: string, file: File, opts: { documentType: DocumentType; displayName?: string }): Promise<SmeMartDocument> {
  // Step 1: Upload binary to FileService (existing logic)
  const zbFileId = await this.uploadToFileService(file);

  // Step 2: Push metadata to Pipeline (camelCase)
  const gqlData = {
    id: generateUUID(),
    engagementId,
    zbFileId,
    zbFileVersionId: versionId,
    filename: file.name,
    mimeType: file.type,
    fileSizeBytes: file.size,
    documentType: opts.documentType,
    displayName: opts.displayName || file.name,
    uploadedByZerobiasUserId: userId,
  };

  // Optimistic update
  const doc = mapGqlToNeon<SmeMartDocument>(gqlData, DOCUMENT_FIELD_MAPPING.gqlToNeon);

  // Fire-and-forget push
  this.pipelineWrite.pushEntity('SmeMartDocument', gqlData).catch(err => {
    console.error('Document metadata push failed:', err);
  });

  return doc; // Return immediately
}

// Reading includes downloadUrl from FileService
async getDocument(id: string): Promise<SmeMartDocumentWithUrl | null> {
  const doc = await this.graphqlRead.getById<GqlDocumentResponse>('SmeMartDocument', id, [
    'id', 'engagementId', 'zbFileId', 'zbFileVersionId', 'filename', 'documentType', 'displayName',
  ]);

  if (!doc) return null;

  return {
    ...mapGqlToNeon<SmeMartDocument>(doc, DOCUMENT_FIELD_MAPPING.gqlToNeon),
    downloadUrl: this.getDownloadUrl(doc.zbFileVersionId), // From DocumentService
  };
}
```

### Anti-Patterns to Avoid

- **Nested GQL queries for folder hierarchy:** Don't query parent/children relationships in GQL. Flat fetch + rebuild is simpler and avoids pagination edge cases.
- **Search with OR filters:** GQL RFC4515 filter syntax doesn't support OR natively. Use two separate queries or filter in component.
- **Waiting for Pipeline async on every write:** Don't await pipelineWrite.pushEntity(). It's fire-and-forget by design — optimistic update shows data immediately.
- **Assuming document file exists when metadata exists:** FileService may drop binaries independently. Always handle missing file gracefully in download URLs.
- **Using snake_case in GQL queries:** GQL field names are camelCase (engagementId, not engagement_id). Use field mappings to transform.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Field name transformation (snake→camel, camel→snake) | Custom transformation logic in each service | `mapNeonToGql()` / `mapGqlToNeon()` helper functions from `field-mappings.ts` | Single source of truth; prevents field-loss bugs; enables roundtrip tests |
| Hierarchical folder queries | Recursive REST calls or nested GQL queries | Flat fetch + client-side tree rebuild with parentId mapping | Avoids N+1 queries, handles any depth in one query, simpler pagination |
| Search across multiple fields | Complex GQL filter logic | Multiple simple ilike filters OR client-side filtering | GQL doesn't support OR; multiple filters are clearer |
| Pipeline push error handling | Silent failures or complex retry logic | Fire-and-forget with console.error() logging | Optimistic updates already show data; pipeline async is best-effort |
| File download URLs from metadata | Storing downloadUrl in GQL metadata | Deriving from zbFileVersionId via DocumentService.getDownloadUrl() | FileService is source of truth for URLs; prevents stale links |

**Key insight:** This phase's complexity is not in the migration pattern (which is proven), but in the tree rebuild algorithm and understanding when GQL metadata is sufficient vs. when FileService must be consulted.

---

## Common Pitfalls

### Pitfall 1: Circular Folder References
**What goes wrong:** A folder's parentId points to a non-existent folder ID, or worse, creates a cycle (A→B→A).

**Why it happens:** Manual tree mutations (drag-and-drop reparenting) can set parentId to invalid references, especially during optimistic updates.

**How to avoid:**
1. Validate parentId before optimistic update — ensure folder with that ID exists in current tree
2. Add cycle detection in tree rebuild: keep visited set, abort if parentId already seen
3. On reparenting failure, revert optimistic update in component

**Warning signs:**
- Tree rendering goes blank or shows infinite nesting
- Browser DevTools shows stack overflow in tree builder
- Folder appears at multiple tree levels

### Pitfall 2: ilike Filter Case Sensitivity
**What goes wrong:** Note search with ilike filter returns no results when it should match (e.g., searching "HIPAA" finds nothing).

**Why it happens:** GQL's ilike() may have different case-sensitivity behavior than expected, or filter format is wrong.

**How to avoid:**
1. Verify RFC4515 ilike syntax: `.ilike.%query%` (not `*query*`)
2. Test case-insensitively: both "HIPAA" and "hipaa" should match "Hipaa Compliance"
3. Escape special characters in filter values (%, *, etc.)

**Warning signs:**
- Search always returns 0 results
- Manual GQL query in devtools works, service doesn't
- Case-sensitive substring matches don't work

### Pitfall 3: Optimistic Update Data Loss on Rejection
**What goes wrong:** Component shows created note, but Pipeline push fails silently. User navigates away. Data loss when app restarts.

**Why it happens:** Fire-and-forget pattern assumes Pipeline will succeed. Occasional network/validation failures are not retried.

**How to avoid:**
1. Log all Pipeline failures to console.error() (this is done)
2. In production: consider storing pending writes in IndexedDB as backup queue (v2 feature)
3. Add error notification to user if write fails (v1.5 — defer to Phase 5 review)
4. Test failure case: mock pipelineWrite to throw, verify component degrades gracefully

**Warning signs:**
- Network tab shows 5xx errors on Pipeline calls
- User sees notification about "error saving note" but refreshes and data is gone
- Phase 5 verification shows orphaned Neon rows that never made it to AuditgraphDB

### Pitfall 4: NoteFolder Drag-and-Drop Reparenting Race Condition
**What goes wrong:** User drags folder B under folder A, component shows update, but before Pipeline push completes, user moves it again. Second move uses stale parentId.

**Why it happens:** Optimistic update doesn't lock the tree structure; component allows further mutations while Pipeline is in-flight.

**How to avoid:**
1. Disable drag-and-drop gestures while tree push is in-flight (set `pipelineWriting` signal)
2. Only optimize for fast networks (< 100ms); disable optimistic updates on slow connections (detect via first latency sample)
3. Revert optimistic update if Pipeline fails (rarely happens, but handle it)

**Warning signs:**
- User performs rapid folder moves, tree gets corrupted
- Folder ends up in wrong parent after batch operations
- Pipeline logs show conflicting updates in quick succession

### Pitfall 5: Document Metadata ↔ FileService Sync Mismatch
**What goes wrong:** SmeMartDocument exists in GQL with zbFileVersionId, but file is gone from FileService. Download fails.

**Why it happens:** FileService garbage collects old file versions, or metadata is stale after FileService deletion.

**How to avoid:**
1. Don't rely on `zbFileVersionId` alone — check FileService existence before showing download button
2. Wrap DocumentService.getDownloadUrl() in try-catch; return "File Not Found" gracefully
3. Log file-not-found errors separately (different from general 404s)
4. Consider adding "file_status" field to SmeMartDocument metadata (exists_in_fs: true/false)

**Warning signs:**
- Download button visible, but click returns 404
- Console shows "zbFileVersionId not found in FileService"
- User sees broken download link after document soft-delete/archival

---

## Code Examples

Verified patterns from Phase 2 codebase (already implemented):

### NotesService — Basic Create + Read
```typescript
// Source: engagements.service.ts pattern (verified 2026-03-18)
@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly impersonation = inject(ImpersonationService);

  readonly notes = signal<Note[]>([]);
  readonly loading = signal(false);

  async createNote(engagementId: string, data: CreateNoteRequest): Promise<Note> {
    const userId = this.impersonation.effectiveUserId();
    const gqlData = {
      id: crypto.randomUUID(),
      engagementId,
      title: data.title,
      body: data.body,
      folderId: data.folder_id ?? null,
      authorZerobiasUserId: userId,
      accessLevel: data.access_level ?? 'boundary',
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    const note = mapGqlToNeon<Note>(gqlData, NOTE_FIELD_MAPPING.gqlToNeon);

    // Fire-and-forget
    this.pipelineWrite.pushEntity('Note', gqlData).catch(err => {
      console.error('[NotesService] Pipeline push failed:', err);
    });

    return note;
  }

  async listNotes(engagementId: string, options?: QueryOptions): Promise<PagedResults<Note>> {
    this.loading.set(true);
    try {
      const result = await this.graphqlRead.query<GqlNoteResponse>(
        'Note',
        ['id', 'title', 'body', 'engagementId', 'folderId', 'authorZerobiasUserId', 'createdAt', 'updatedAt', 'archived', 'accessLevel'],
        {
          filters: { engagementId: `.eq.${engagementId}`, archived: '.eq.false' },
          pageNumber: options?.pageNumber ?? 1,
          pageSize: options?.pageSize ?? 50,
        },
      );

      const items = result.items.map(gql => mapGqlToNeon<Note>(gql, NOTE_FIELD_MAPPING.gqlToNeon));
      this.notes.set(items);

      return PagedResults.fromArray(items, options?.pageNumber ?? 1, options?.pageSize ?? 50, result.page.totalCount);
    } finally {
      this.loading.set(false);
    }
  }
}
```

### NoteFolderService — Flat Fetch + Tree Rebuild
```typescript
// Novel to Phase 3 (client-side tree rebuild)
@Injectable({ providedIn: 'root' })
export class NoteFolderService {
  private readonly graphqlRead = inject(GraphqlReadService);

  async getNoteFolderTree(engagementId: string): Promise<NoteFolderTreeNode[]> {
    // Flat fetch all folders
    const result = await this.graphqlRead.query<GqlNoteFolderResponse>(
      'NoteFolder',
      ['id', 'engagementId', 'parentId', 'name', 'sortOrder', 'createdAt'],
      {
        filters: { engagementId: `.eq.${engagementId}` },
        pageNumber: 1,
        pageSize: 1000,
      },
    );

    const allFolders = result.items.map(gql => mapGqlToNeon<NoteFolder>(gql, NOTE_FOLDER_FIELD_MAPPING.gqlToNeon));

    // Build tree
    const buildNode = (parent: NoteFolder): NoteFolderTreeNode => ({
      ...parent,
      children: allFolders
        .filter(f => f.parent_id === parent.id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map(buildNode),
    });

    return allFolders
      .filter(f => !f.parent_id) // Root folders only
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map(buildNode);
  }
}
```

### OrgDocumentService — Metadata + FileService Pattern
```typescript
// Source: org-document.service.ts pattern (verified 2026-03-18, adapted to GQL)
async uploadDocument(
  orgId: string,
  file: File,
  opts: { documentType: DocumentType; displayName?: string },
): Promise<SmeMartDocument> {
  const userId = this.impersonation.effectiveUserId();

  // Step 1: Upload binary to FileService
  const zbFileId = await this.fileService.createFile(file.name);
  const fileVersionId = await this.fileService.uploadBinary(zbFileId, file);

  // Step 2: Push metadata to Pipeline
  const gqlData = {
    id: crypto.randomUUID(),
    engagementId: undefined, // org-level document (may be refactored later)
    zbFileId,
    zbFileVersionId: fileVersionId,
    filename: file.name,
    mimeType: file.type,
    fileSizeBytes: file.size,
    documentType: opts.documentType,
    displayName: opts.displayName || file.name,
    uploadedByZerobiasUserId: userId,
  };

  // Optimistic return
  const doc = mapGqlToNeon<SmeMartDocument>(gqlData, DOCUMENT_FIELD_MAPPING.gqlToNeon);

  // Fire-and-forget
  this.pipelineWrite.pushEntity('SmeMartDocument', gqlData).catch(err => {
    console.error('[OrgDocumentService] Pipeline push failed:', err);
  });

  return doc;
}

async getDocument(id: string): Promise<SmeMartDocument | null> {
  const doc = await this.graphqlRead.getById<GqlDocumentResponse>(
    'SmeMartDocument',
    id,
    ['id', 'engagementId', 'zbFileId', 'zbFileVersionId', 'filename', 'documentType', 'mimeType', 'fileSizeBytes'],
  );

  if (!doc) return null;

  return mapGqlToNeon<SmeMartDocument>(doc, DOCUMENT_FIELD_MAPPING.gqlToNeon);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Neon PostgreSQL direct queries (SmeMartDbService) | AuditgraphDB via Pipeline + GraphQL | Phase 2 (Engagement/Bids) | Scalable, platform-integrated, ZB Tag/Resource linking available |
| VIEWs with JOINs for summary rollups | Nested GQL queries or flattened responses | Phase 2 | GraphQL more flexible; VIEWs still available but not used |
| RFC4515 filter syntax for searches | Same (ilike operators) | Phase 1 | Standard adopted early; mature, no changes needed |

**Deprecated/outdated:**
- **SmeMartDbService (Neon):** Phase 5 will archive tables after 2-4 week verification period. Services migrated in Phase 2–4 will have no references.
- **v_notes_with_tags VIEW:** Not needed in GQL path; tags are now Hydra Tags and queried separately if needed.
- **v_note_folders_with_counts VIEW:** Not needed; GQL queries can select child count or fetch children separately.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 1.0+ (with Angular TestBed) |
| Config file | `vitest.config.ts` (exists) |
| Quick run command | `npm test -- src/app/core/services/notes.service.spec.ts --run` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MIG-09 | NotesService.createNote() writes via Pipeline | unit | `npm test -- notes.service.spec.ts -t "createNote"` | ✅ exists, needs update |
| MIG-10 | NotesService.listNotes() reads via GQL | unit | `npm test -- notes.service.spec.ts -t "listNotes"` | ✅ exists, needs update |
| MIG-11 | NoteFolderService.createFolder() writes via Pipeline | unit | `npm test -- note-folder.service.spec.ts -t "createFolder"` | ❌ Wave 0 gap |
| MIG-12 | NoteFolderService.getTree() reads flat GQL + rebuilds | unit | `npm test -- note-folder.service.spec.ts -t "getTree"` | ❌ Wave 0 gap |
| MIG-13 | Tree rebuild handles parentId relationships correctly | unit | `npm test -- note-folder.service.spec.ts -t "treeRebuild"` | ❌ Wave 0 gap |
| MIG-14 | OrgDocumentService.uploadDocument() writes metadata via Pipeline | unit | `npm test -- org-document.service.spec.ts -t "uploadDocument"` | ✅ exists, needs update |
| MIG-15 | OrgDocumentService.getDocument() reads metadata from GQL | unit | `npm test -- org-document.service.spec.ts -t "getDocument"` | ✅ exists, needs update |
| ROUNDTRIP | Note field mapping preserves all fields in both directions | unit | `npm test -- note.roundtrip.spec.ts` | ✅ exists, created Phase 1 |
| ROUNDTRIP | NoteFolder field mapping preserves all fields | unit | `npm test -- note-folder.roundtrip.spec.ts` | ✅ exists, created Phase 1 |
| ROUNDTRIP | SmeMartDocument field mapping preserves all fields | unit | `npm test -- document.roundtrip.spec.ts` | ✅ exists, created Phase 1 |

### Sampling Rate
- **Per task commit:** `npm test -- notes.service.spec.ts --run` (quick service tests)
- **Per wave merge:** `npm test` (full suite, ~80% coverage required)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/core/services/note-folder.service.ts` — New service for NoteFolder CRUD + tree rebuild
- [ ] `src/app/core/services/note-folder.service.spec.ts` — Unit tests for tree rebuild algorithm and GQL queries
- [ ] Mock GQL fixtures for NoteFolders with hierarchical data (parent-child test cases)

*(Existing test infrastructure covers Notes and Documents — existing `.spec.ts` files just need migration from SmeMartDbService to Pipeline+GQL mocks)*

---

## Sources

### Primary (HIGH confidence)
- **Phase 1 Field Mappings:** `/src/app/core/field-mappings.ts` — All 8 entity mappings including NOTE_FIELD_MAPPING, NOTE_FOLDER_FIELD_MAPPING, DOCUMENT_FIELD_MAPPING verified 2026-03-18
- **Phase 2 Migration Pattern:** `src/app/core/services/engagements.service.ts` — Service swap pattern verified, reusable for Notes/Documents
- **GQL Types:** `src/app/core/gql-types/{note,note-folder,document}.types.ts` — All response shapes defined and ready
- **Test Helpers:** `src/app/test-helpers/angular.ts` & `gql-fixtures.ts` — fakePipelineWriteService(), fakeGraphqlReadService(), fixture data ready
- **Pipeline + GQL Services:** `pipeline-write.service.ts`, `graphql-read.service.ts` — Verified working in Phase 2, production-ready
- **Project Config:** `.planning/phases/03-wave-2-attachments/03-CONTEXT.md` — User decisions locked for this phase

### Secondary (MEDIUM confidence)
- **ZeroBias Client SDK:** `@zerobias-com/zerobias-client` (workspace source: `~/Projects/zb/clients/packages/`) — API documentation for Platform SDK (SimpleBatch, PipelineApi, GraphqlClient)
- **Phase 2 Roundtrip Tests:** `src/app/core/services/{engagement,bid,bid-response}.roundtrip.spec.ts` — Pattern verified in Phase 1; NOTE/NoteFolder/Document versions created (not yet run)
- **Angular 21 Patterns:** Project CLAUDE.md, existing component consumption patterns — confirmed standalone components + signals used throughout

### Tertiary (LOW confidence — none; research is based on verified sources only)

---

## Open Questions

1. **Tree rebuild algorithm — depth limit?**
   - What we know: Plan assumes <1000 folders per engagement (safe for one query). No mention of max nesting depth.
   - What's unclear: Should we warn if cycle detected? Silently truncate at depth N?
   - Recommendation: Handle cycles with visited set (abort if cycle detected, log error). No depth limit for v1.

2. **Note search with sme-doc:// links — how to handle?**
   - What we know: Current Neon searches filter by `body=*sme-doc://docId*`. GQL ilike should work similarly.
   - What's unclear: Should we normalize link format during migration? Should search be case-sensitive?
   - Recommendation: Keep link format unchanged (sme-doc:// is unique enough). Use ilike for loose matching; exact matching is rare.

3. **OrgDocumentService — engagement-level or org-level documents?**
   - What we know: Currently migrating org_documents table (org-level). Some documents are engagement-specific (engagement_documents).
   - What's unclear: Should we unify both types in SmeMartDocument class, or keep separate?
   - Recommendation: Both are SmeMartDocument in GQL (same class). Keep ogDocumentService for org-level; EngagementDocumentService (Phase 4 or later) for engagement-level.

4. **FileService failover — metadata in GQL but file missing**
   - What we know: File binary is separate from metadata. FileService may drop old versions.
   - What's unclear: How should UI handle download button when file is missing?
   - Recommendation: Always check FileService before showing download button. Gracefully handle 404 with "File not found in vault" message (v1.5 refinement).

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — All tools/libraries verified in Phase 2; no new dependencies needed
- **Architecture:** HIGH — Phase 2 pattern proven; tree rebuild is a known algorithm (standard parentId mapping)
- **Pitfalls:** HIGH — Identified from Phase 2 learnings and common database migration issues
- **Test coverage:** HIGH — Infrastructure exists (vitest + TestBed); Phase 1 roundtrip tests are templates

**Research date:** 2026-03-18
**Valid until:** 2026-04-01 (14 days — GQL schema is stable, field mappings locked, no platform changes expected)

**Assumptions verified:**
- SME_MART_CLASS_IDs in PipelineWriteService include Note, NoteFolder, SmeMartDocument ✓
- Field mappings (NOTE_, NOTE_FOLDER_, DOCUMENT_) exist and are complete ✓
- GQL types (GqlNoteResponse, GqlNoteFolderResponse, GqlDocumentResponse) are defined ✓
- Phase 2 pattern (PipelineWrite + GraphqlRead injection swap) is production-tested ✓
- Test fixtures and mock factories exist and are ready ✓

---

*Research complete: 2026-03-18*
*Phase 3 Research ready for Planning*
