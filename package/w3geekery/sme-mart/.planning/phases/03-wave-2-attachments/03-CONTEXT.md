# Phase 3: Wave 2 - Attachments - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate Note, NoteFolder, and SmeMartDocument services from SmeMartDbService (Neon) to PipelineWriteService (writes) + GraphqlReadService (reads). Folder parent/child hierarchy must be preserved. Document file binaries stay in FileService — only metadata moves to GQL. Zero component changes.

</domain>

<decisions>
## Implementation Decisions

### Folder Hierarchy
- **Flat fetch + client rebuild** — Fetch all NoteFolders in a single flat GQL query, rebuild tree client-side using parentId. Works at any depth, one round-trip.
- Drag-and-drop reparenting: same behavior, new backend. Update parentId, push via Pipeline, UI optimistically moves folder.

### Document File Handling
- **Metadata in GQL, files in FileService** — Document metadata (name, type, engagement link, documentType) moves to Pipeline+GQL. Actual file binary stays in ZB FileService. downloadUrl comes from FileService, not GQL.
- SmeMartDocument extends File in schema — fileVersionId, mimeType, size come from GQL; downloadUrl/viewUrl from FileService.

### Note Search
- **Use GQL ilike for now** — RFC4515 ilike filter on note content/name fields. Covers basic substring matching. Less powerful than Neon full-text search but good enough for v1.
- sme-doc:// cross-links and access level filtering translate to GQL filters on those fields.

### Claude's Discretion
- Exact GQL query structure for flat NoteFolder fetch
- Tree rebuild algorithm (parentId → children mapping)
- How to handle notes with sme-doc:// links during migration (link format stays the same)
- Error handling for FileService failures (document metadata exists in GQL but file not found)
- Whether to consolidate Note + NoteFolder into a single service migration or keep separate tasks

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 Infrastructure (dependencies)
- `src/app/core/field-mappings.ts` — NOTE_FIELD_MAPPING, NOTE_FOLDER_FIELD_MAPPING, DOCUMENT_FIELD_MAPPING constants
- `src/app/core/gql-types/note.types.ts` — GqlNoteResponse interface
- `src/app/core/gql-types/note-folder.types.ts` — GqlNoteFolderResponse interface
- `src/app/core/gql-types/document.types.ts` — GqlDocumentResponse interface
- `src/app/test-helpers/angular.ts` — fakePipelineWriteService(), fakeGraphqlReadService()
- `src/app/test-helpers/gql-fixtures.ts` — Note/NoteFolder/Document fixtures

### Services being migrated
- `src/app/core/services/notes.service.ts` — Current Neon-backed notes service
- `src/app/core/services/org-document.service.ts` — Current Neon-backed document service

### Schema reference
- `.claude/plans/local/034-gql-schema-migration.md` — Note, NoteFolder, SmeMartDocument YAML definitions
- `.claude/plans/local/026-notes-feature.md` — Notes feature architecture
- `.claude/plans/local/046-org-document-management.md` — Document management architecture

### Prior phase patterns
- `.planning/phases/02-wave-1-migrations/02-CONTEXT.md` — Phase 2 decisions (flatten GQL, rename pattern)
- `src/app/core/services/engagements.service.ts` — Reference: how Phase 2 migrated a service

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **PipelineWriteService + GraphqlReadService**: Built in Phase 1, used in Phase 2. Same pattern applies.
- **Field mappings**: NOTE_FIELD_MAPPING, NOTE_FOLDER_FIELD_MAPPING, DOCUMENT_FIELD_MAPPING already created.
- **GQL types + fixtures**: Ready for all 3 entities.
- **Phase 2 pattern**: EngagementsService migration is the template — same swap approach.

### Established Patterns
- Service swap: remove SmeMartDbService inject, add PipelineWriteService + GraphqlReadService inject
- Flatten GQL responses into component-facing types
- Optimistic updates: return data immediately, fire-and-forget Pipeline push
- Roundtrip tests verify no field loss

### Integration Points
- **Notes sidebar**: OneNote-style layout with folder tree. Consumes NotesService for tree data.
- **Document list**: Engagement and org-level document lists. Consumes OrgDocumentService.
- **FileService**: Document upload/download stays on FileService — not migrated.
- **sme-doc:// links**: Cross-links between documents and notes. Link format unchanged.
- **Drag-and-drop**: HTML5 drag-drop for folder reparenting. Consumes NotesService.

</code_context>

<specifics>
## Specific Ideas

- Follow the Phase 2 pattern exactly — this is a mechanical repeat for different entities.
- The folder tree rebuild is the only novel aspect (flat fetch → parentId tree).
- Document migration is the simplest — metadata-only, FileService handles binaries.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-wave-2-attachments*
*Context gathered: 2026-03-18*
