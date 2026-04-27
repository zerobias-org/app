# Document-Notes Cross-Linking

**Status:** Complete (all 5 phases)
**Updated:** 2026-03-10

## Overview

Bidirectional linking between documents and notes within engagements. Users insert document references as markdown links in notes via a chooser dialog, and can find related notes from the document list.

## Link Format

Standard markdown link with custom URI scheme:
```markdown
[📄 filename.pdf](sme-doc://DOC_UUID)
```

## Phases

### Phase 1: Foundation — FontAwesome & Utilities

**1.1 Install FontAwesome**
- `@fortawesome/angular-fontawesome@4`
- `@fortawesome/fontawesome-svg-core@6.7.2`
- `@fortawesome/free-solid-svg-icons@6.7.2`
- `@fortawesome/free-brands-svg-icons@6.7.2`
- Matches ZB UI versions

**1.2 MIME Type to FontAwesome Icon Pipe**
- `src/app/shared/pipes/mimetype-to-fontawesome-icon.pipe.ts`
- Standalone pipe, returns `IconDefinition`
- Maps: PDF, Word, Excel, PowerPoint, images, video, audio, text, JSON, code, archives
- Default: `faFile`
- Pattern: ZB UI's `MimetypeToFontawesomeIconPipe`

**1.3 SME Doc Link Service**
- `src/app/core/services/sme-doc-link.service.ts`
- `parseDocId(uri)`, `createLink(docId)`, `isSmeMartDocLink(href)`
- Centralize URI scheme logic

---

### Phase 2: Document Chooser Dialog & Condensed List

**2.1 Document Chooser Dialog**
- `src/app/shared/dialogs/document-chooser-dialog/`
- MatDialog listing engagement documents
- Click to select, returns `EngagementDocument`
- Inline upload toggle (reuses DocumentUploadComponent)
- New uploads auto-associate with current engagement

**2.2 Document List Condensed Component**
- `src/app/shared/components/document-list-condensed/`
- Single collapsible row: "Documents (N)" with expand icon
- Click expands to show documents inline
- FontAwesome file-type icons, doc type chip, compact layout
- For embedding in task cards

**2.3 Integrate into Task Card**
- Add `<app-document-list-condensed>` to task-card.component.html
- Below subtasks section

---

### Phase 3: Milkdown Plugin & Link Renderer

**3.1 SME Doc Link Milkdown Plugin**
- `src/app/shared/plugins/sme-doc-link.plugin.ts`
- Patches link node renderer to detect `sme-doc://` URIs
- Renders styled inline element instead of plain link
- **HIGH RISK** — Milkdown internals are complex
- Fallback: regex-based `marked` post-processor

**3.2 SME Doc Link Renderer Component**
- `src/app/shared/components/sme-doc-link-renderer/`
- Inline: FontAwesome file icon + document name
- Clickable — emits event to parent for navigation

**3.3 Integrate Plugin into Note Editor**
- Add plugin to Crepe editor config in note-editor-panel
- Register mark type and renderer

---

### Phase 4: Toolbar Button & Chooser Integration

**4.1 Add "Link Document" Toolbar Button**
- Custom button in note-editor-panel toolbar
- Opens DocumentChooserDialog with current engagementId
- On selection: inserts `[icon filename](sme-doc://UUID)` at cursor

---

### Phase 5: Notes Search by Document Link

**5.1 Extend Notes Service**
- `searchNotesByDocumentLink(engagementId, docId)`
- Filter: `body` contains `sme-doc://DOC_ID`
- RFC4515: `(&(engagement_id=...)(body=*sme-doc://DOC_ID*))`

**5.2 "Show Related Notes" in Document List**
- New menu action on document row
- Emits `showRelatedNotes` event with docId
- Parent navigates to Notes tab with filter

**5.3 Notes Panel Document Filter**
- New input: `filterByDocumentId`
- Visual indicator: "Showing notes linked to [Doc Name]"
- "Clear filter" button

**5.4 Wire Up in Engagement Detail**
- Listen for `showRelatedNotes` from DocumentList
- Navigate to Notes tab, pass filter to NotesPanel

---

### Phase 6: Testing

- Unit: pipes, services, URI parsing
- Integration: dialog workflow, link insertion, filter
- E2E: upload doc -> create note with link -> show related notes

---

## New Files

| File | Type | Phase |
|------|------|-------|
| `shared/pipes/mimetype-to-fontawesome-icon.pipe.ts` | Pipe | 1 |
| `core/services/sme-doc-link.service.ts` | Service | 1 |
| `shared/dialogs/document-chooser-dialog/*` | Component | 2 |
| `shared/components/document-list-condensed/*` | Component | 2 |
| `shared/plugins/sme-doc-link.plugin.ts` | Plugin | 3 |
| `shared/components/sme-doc-link-renderer/*` | Component | 3 |

## Modified Files

| File | Changes | Phase |
|------|---------|-------|
| `package.json` | FontAwesome deps | 1 |
| `note-editor-panel.component.*` | Plugin + toolbar button | 3-4 |
| `notes.service.ts` | `searchNotesByDocumentLink()` | 5 |
| `document-list.component.*` | "Show related notes" action | 5 |
| `notes-panel.component.*` | Document link filter | 5 |
| `task-card.component.*` | Condensed doc list section | 2 |
| `engagement-detail.component.*` | Filter event wiring | 5 |

## Risks

1. **Milkdown plugin (HIGH)** — Complex internals. Fallback: regex-based marked renderer
2. **Notes search perf (MEDIUM)** — Substring search on body. Mitigate with pagination, future junction table
3. **URI consistency (MEDIUM)** — Users editing markdown could break links. Validate on insert, handle gracefully

## Phase Dependencies

```
Phase 1 (Foundation)
  |
  +---> Phase 2 (UI Components) --+
  |                                |
  +---> Phase 3 (Rendering) ------+--> Phase 4 (Integration) --> Phase 5 (Search)
```

Phase 6 (Testing) runs concurrent with all phases.
