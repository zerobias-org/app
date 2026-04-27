# Proposal 003: Notes Feature

**Status:** Complete
**Date:** 2026-02-26
**Related Plans:** 018 (Engagement Activity Center / Timeline), 022 (Project Layer), 023 (Transparency Center)
**Client Feedback:** Clark, Bob Cheek (PMO perspective — V-Team meeting minutes patterns)

---

## Overview

A **searchable, filterable, hierarchical Notes system** integrated with the engagement timeline. Notes are lightweight, user-created records of decisions, meeting minutes, observations, and audit trail entries. Unlike Timeline Comments (which are ZeroBias Task comments), Notes are independent records that *optionally* inject into the Timeline as comments on a dedicated `engagement_notes` SubTask.

**Key differentiator:** Notes are SME Mart data (Neon tables), separate from ZeroBias platform Task comments. This allows:
- User-created note folders/hierarchies without ZB platform dependencies
- Rich metadata (tags, authors, access levels) scoped to SME Mart boundaries/projects
- Meeting minutes as structured note sets (per Bob's V-Team template pattern)
- Audit trail independent of Task comment lifecycle

---

## Requirements

### Functional Requirements

1. **Create & Edit Notes**
   - Markdown-rich text with file/link attachments
   - Title, body, optional meeting date/time
   - Auto-timestamp (created_at, updated_at, updated_by)
   - Access control: personal, boundary-level, or project-level visibility
   - Soft delete (archived flag, not hard delete) for audit trail

2. **Organize Notes into Folder Hierarchy**
   - Unlimited nesting: root folders → subfolders → notes
   - Move/drag operations
   - Folder metadata: name, description, access_level
   - Folder templates for recurring note sets (e.g., V-Team meeting template)

3. **Search & Filter Notes**
   - Full-text search (title + body + tags)
   - Filter by date range, author, tags, engagement, folder, access_level
   - Saved filter presets (e.g., "2026 Board Decisions", "My Meeting Minutes")
   - Search within a folder or across boundary

4. **Tag Notes**
   - User-created tags (no predefined taxonomy at launch)
   - Multiple tags per note
   - Tag management: rename, merge, delete (with cascade behavior)
   - Tag autocomplete in note editor

5. **Inject Note into Timeline**
   - One-click action: "Inject into Timeline"
   - Creates a comment on `engagement_notes` SubTask (auto-create if not exists)
   - References back to original note_id for audit trail
   - Timeline comment shows "Injected from Note" provenance

6. **Access Control**
   - **Personal** — only creator can view/edit
   - **Boundary** — all users in boundary can view/edit
   - **Project** — all users in project can view/edit (future, when Project entity arrives)
   - Share note with specific users (optional MVP enhancement)

7. **Meeting Minutes as Note Type** (per Bob Cheek PMO feedback)
   - Structured template with sections: Attendees, Agenda, Action Items, Open Issues, Next Steps
   - Export to PDF/Markdown
   - Optional: link to Zoom/Teams recording URL

8. **Resource Linking (Inline References)**
   - Notes can link to any engagement resource inline via markdown-style references
   - Supported link targets:
     - **Tasks / SubTasks** — open task detail in context
     - **Timeline items** — jump to specific timeline event
     - **Findings** — display attached finding file in a modal
     - **Any ZB resource** — boundaries, users, connections, etc.
   - Links rendered as clickable chips/pills in the note body
   - Link syntax: `[[task:uuid]]`, `[[finding:uuid]]`, `[[resource:type:uuid]]` (resolved at render time)
   - Autocomplete when typing `[[` — searches engagement tasks, findings, resources
   - Broken link detection — flag if referenced resource was deleted

9. **Attachments (via ZB TaskAttachment)**
   - Notes support file attachments — under the hood these are **ZB Task/SubTask TaskAttachments**
   - When a note gets its first attachment, a backing ZB SubTask is auto-created (or reused if note was already injected to Timeline)
   - Attachment is uploaded via ZB Task Attachments API → stored in ZB-managed AWS S3
   - Note tracks `backing_task_id` to link back to the ZB SubTask holding attachments
   - **Supported file types:**
     - Office documents: CSV, XLSX, DOCX, PDF
     - LLM artifacts: prompts (`.txt`, `.md`), SpecStory session histories (`.jsonl`, `.md`), LLM conversation logs
     - Images: PNG, JPG, SVG (inline preview in note)
     - Archives: ZIP (for bundled exports)
   - Attachment metadata stored in Neon (`note_attachments` table) for search/filter; actual file in ZB S3
   - Inline preview for images and PDFs; download link for everything else
   - Drag-and-drop upload in note editor

---

## Data Model

### Core Tables

#### `notes`

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id VARCHAR(255) NOT NULL,
  folder_id UUID,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  author_zerobias_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by_zerobias_user_id VARCHAR(255),
  archived BOOLEAN DEFAULT FALSE,
  access_level VARCHAR(50) DEFAULT 'boundary',
  meeting_date TIMESTAMP WITH TIME ZONE,
  meeting_duration_minutes INTEGER,
  backing_task_id VARCHAR(255),               -- ZB SubTask for attachments (auto-created on first upload)
  injected_to_task_id VARCHAR(255),
  injected_comment_id VARCHAR(255),
  injected_at TIMESTAMP WITH TIME ZONE,
  is_meeting_minutes BOOLEAN DEFAULT FALSE,
  boundary_id VARCHAR(255),
  project_id VARCHAR(255),

  FOREIGN KEY (engagement_id) REFERENCES work_requests(id),
  FOREIGN KEY (folder_id) REFERENCES note_folders(id)
);

CREATE INDEX idx_notes_engagement ON notes(engagement_id);
CREATE INDEX idx_notes_folder ON notes(folder_id);
CREATE INDEX idx_notes_author ON notes(author_zerobias_user_id);
CREATE INDEX idx_notes_access_level ON notes(access_level);
CREATE INDEX idx_notes_archived ON notes(archived);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_meeting_minutes ON notes(is_meeting_minutes);
CREATE INDEX idx_notes_search ON notes USING GIN (to_tsvector('english', title || ' ' || body));
```

#### `note_folders`

```sql
CREATE TABLE note_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id VARCHAR(255) NOT NULL,
  parent_id UUID,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by_zerobias_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_level VARCHAR(50) DEFAULT 'boundary',
  sort_order INTEGER DEFAULT 0,

  FOREIGN KEY (engagement_id) REFERENCES work_requests(id),
  FOREIGN KEY (parent_id) REFERENCES note_folders(id) ON DELETE CASCADE
);

CREATE INDEX idx_note_folders_engagement ON note_folders(engagement_id);
CREATE INDEX idx_note_folders_parent ON note_folders(parent_id);
```

#### `note_tags`

```sql
CREATE TABLE note_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_by_zerobias_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 1,

  UNIQUE (engagement_id, name),
  FOREIGN KEY (engagement_id) REFERENCES work_requests(id)
);

CREATE INDEX idx_note_tags_engagement ON note_tags(engagement_id);
```

#### `note_tag_assignments`

```sql
CREATE TABLE note_tag_assignments (
  note_id UUID NOT NULL,
  tag_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES note_tags(id) ON DELETE CASCADE
);

CREATE INDEX idx_note_tag_assignments_tag ON note_tag_assignments(tag_id);
```

#### `note_links`

Tracks inline resource references within note body. Denormalized from markdown `[[type:uuid]]` syntax for queryability (e.g., "find all notes that reference Task X").

```sql
CREATE TABLE note_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL,
  target_type VARCHAR(50) NOT NULL,       -- 'task' | 'subtask' | 'finding' | 'resource' | 'timeline_event'
  target_id VARCHAR(255) NOT NULL,        -- ZB resource UUID
  target_label VARCHAR(255),              -- Cached display name (denorm, updated on access)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX idx_note_links_note ON note_links(note_id);
CREATE INDEX idx_note_links_target ON note_links(target_type, target_id);
```

#### `note_attachments`

Metadata for files attached to notes. Actual files live in ZB S3 via TaskAttachment API.

```sql
CREATE TABLE note_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL,
  filename VARCHAR(500) NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT,
  attachment_type VARCHAR(50) DEFAULT 'file',  -- 'file' | 'llm_prompt' | 'llm_history' | 'specstory_session'
  zb_task_attachment_id VARCHAR(255),           -- FK: ZB TaskAttachment ID (actual file in S3)
  backing_task_id VARCHAR(255),                 -- FK: ZB SubTask that owns this attachment
  uploaded_by_zerobias_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,                             -- Optional user description

  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);

CREATE INDEX idx_note_attachments_note ON note_attachments(note_id);
CREATE INDEX idx_note_attachments_type ON note_attachments(attachment_type);
CREATE INDEX idx_note_attachments_backing_task ON note_attachments(backing_task_id);
```

#### `note_sharing` (Phase 6 — future)

```sql
CREATE TABLE note_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL,
  shared_with_zerobias_user_id VARCHAR(255) NOT NULL,
  permission VARCHAR(50) DEFAULT 'view',
  shared_by_zerobias_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE (note_id, shared_with_zerobias_user_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
);
```

### Views

#### `v_notes_with_tags`

```sql
CREATE VIEW v_notes_with_tags AS
SELECT
  n.*,
  STRING_AGG(nt.name, ', ' ORDER BY nt.name) AS tags,
  (SELECT COUNT(*) FROM note_tag_assignments WHERE note_id = n.id) AS tag_count
FROM notes n
LEFT JOIN note_tag_assignments nta ON nta.note_id = n.id
LEFT JOIN note_tags nt ON nt.id = nta.tag_id
WHERE n.archived = FALSE
GROUP BY n.id;
```

#### `v_note_folders_with_counts`

```sql
CREATE VIEW v_note_folders_with_counts AS
SELECT
  nf.*,
  (SELECT COUNT(*) FROM notes WHERE folder_id = nf.id AND archived = FALSE) AS note_count,
  (SELECT COUNT(*) FROM note_folders WHERE parent_id = nf.id) AS subfolder_count
FROM note_folders nf;
```

---

## Component Architecture

### New Files

| File | Type | Purpose |
|------|------|---------|
| `core/models/note.model.ts` | Model | `Note`, `NoteFolder`, `NoteTag` interfaces |
| `core/services/notes.service.ts` | Service | CRUD, list, search, tag management |
| `core/services/note-hierarchy.service.ts` | Service | Folder tree navigation, move ops, access control |
| `core/services/note-injection.service.ts` | Service | Timeline injection — creates `engagement_notes` SubTask + comment |
| `core/services/note-attachment.service.ts` | Service | Upload/download via ZB TaskAttachment API, manage backing task |
| `core/services/note-link-resolver.service.ts` | Service | Resolve `[[type:uuid]]` references, autocomplete, broken link detection |
| `shared/components/notes-panel/` | Component | Main panel container (tab in engagement detail) |
| `shared/components/notes-list/` | Component | Virtual-scrolled note list with filters |
| `shared/components/note-editor/` | Component | Create/edit note with markdown editor |
| `shared/components/note-folder-tree/` | Component | Collapsible folder tree with drag-to-move |
| `shared/components/notes-search-filters/` | Component | Date range, author, tags, access level filters |
| `shared/components/note-card/` | Component | Single note display (read-only preview) |
| `shared/components/note-meeting-minutes/` | Component | Structured meeting minutes template |
| `shared/components/note-attachment-list/` | Component | File list with upload, preview, download |
| `shared/components/note-link-autocomplete/` | Component | `[[` triggered autocomplete for resource references |
| `shared/components/finding-preview-modal/` | Component | Modal to display a finding/attachment inline |

### Component Hierarchy

```
engagement-detail (existing)
├── notes-panel (new tab)
│   ├── notes-search-filters
│   ├── note-folder-tree
│   └── notes-list
│       └── note-card
│           └── [context menu: Edit, Delete, Inject to Timeline, Share]
└── timeline-panel (existing)
    └── [injected note shows "Injected from Note" badge + back-link]
```

---

## Service Layer

### NotesService

```typescript
@Injectable({ providedIn: 'root' })
export class NotesService {
  createNote(engagementId: string, data: CreateNoteRequest): Promise<Note>;
  updateNote(noteId: string, data: UpdateNoteRequest): Promise<Note>;
  deleteNote(noteId: string): Promise<void>;  // soft delete (archived = true)
  listNotes(engagementId: string, options?: QueryOptions): Promise<PagedResults<Note>>;
  searchNotes(engagementId: string, query: string, filters: NoteFilterRequest): Promise<PagedResults<Note>>;
  getNoteById(noteId: string): Promise<Note | null>;

  // Tag management
  listTags(engagementId: string): Promise<NoteTag[]>;
  createTag(engagementId: string, name: string): Promise<NoteTag>;
  deleteTag(tagId: string, mergeIntoTagId?: string): Promise<void>;
  assignTags(noteId: string, tagIds: string[]): Promise<void>;
}
```

### NoteHierarchyService

```typescript
@Injectable({ providedIn: 'root' })
export class NoteHierarchyService {
  listFolders(engagementId: string): Promise<NoteFolder[]>;  // tree structure
  createFolder(engagementId: string, parentId: string | null, name: string): Promise<NoteFolder>;
  updateFolder(folderId: string, data: Partial<NoteFolder>): Promise<NoteFolder>;
  moveFolder(folderId: string, newParentId: string | null): Promise<void>;
  deleteFolder(folderId: string, moveNotesTo?: string): Promise<void>;
  moveNote(noteId: string, newFolderId: string | null): Promise<void>;
  canAccessNote(noteId: string, userId: string): Promise<boolean>;
}
```

### NoteInjectionService

```typescript
@Injectable({ providedIn: 'root' })
export class NoteInjectionService {
  /**
   * Injects a note into the engagement timeline:
   * 1. Find or create `engagement_notes` SubTask for this engagement
   * 2. Post comment to SubTask with note content + provenance
   * 3. Update note record with injection metadata
   */
  injectNoteToTimeline(noteId: string, engagementId: string): Promise<void>;
}
```

### NoteAttachmentService

```typescript
@Injectable({ providedIn: 'root' })
export class NoteAttachmentService {
  /**
   * Attachments use ZB TaskAttachment API under the hood.
   * On first attachment, auto-creates a backing ZB SubTask for the note.
   * If the note was already injected to Timeline, reuses that SubTask.
   */
  uploadAttachment(noteId: string, file: File, type?: AttachmentType): Promise<NoteAttachment>;
  listAttachments(noteId: string): Promise<NoteAttachment[]>;
  deleteAttachment(attachmentId: string): Promise<void>;
  getDownloadUrl(attachmentId: string): Promise<string>;  // Signed URL from ZB S3
  getPreviewUrl(attachmentId: string): Promise<string>;   // For inline preview (images, PDFs)

  // Ensure backing ZB SubTask exists for this note
  private getOrCreateBackingTask(noteId: string, engagementId: string): Promise<string>;
}
```

### NoteLinkResolverService

```typescript
@Injectable({ providedIn: 'root' })
export class NoteLinkResolverService {
  /**
   * Resolves [[type:uuid]] references in note body to display data.
   * Provides autocomplete for the note editor.
   */
  resolveLinks(noteBody: string): Promise<ResolvedLink[]>;
  searchResources(engagementId: string, query: string, types?: LinkTargetType[]): Promise<LinkTarget[]>;
  syncNoteLinks(noteId: string, body: string): Promise<void>;  // Parse body, upsert note_links table
  detectBrokenLinks(noteId: string): Promise<BrokenLink[]>;
}

type LinkTargetType = 'task' | 'subtask' | 'finding' | 'resource' | 'timeline_event';

interface ResolvedLink {
  type: LinkTargetType;
  id: string;
  label: string;
  status?: string;     // e.g., task status
  exists: boolean;     // false = broken link
}
```

---

## Resource Linking

### Link Syntax

Notes use a wiki-style `[[type:uuid]]` syntax for inline resource references:

```markdown
Per the compliance review in [[task:abc-123]], we identified three gaps.
See the audit finding [[finding:def-456]] for details.
Discussed with [[resource:user:ghi-789]] during standup.
```

### Rendering

At render time, `NoteLinkResolverService` resolves each reference:
- `[[task:uuid]]` → clickable chip showing task name + status badge, opens task detail
- `[[finding:uuid]]` → clickable chip, opens finding file in preview modal
- `[[subtask:uuid]]` → chip with subtask name, opens subtask detail
- `[[resource:type:uuid]]` → generic ZB resource chip (user, boundary, connection, etc.)
- Broken links render as red strikethrough chips with "Resource not found" tooltip

### Autocomplete

When user types `[[` in the note editor:
1. Dropdown appears with resource type tabs (Tasks, Findings, Resources)
2. Type-ahead search filters within the engagement
3. Selecting inserts `[[type:uuid|Display Name]]` — display name cached in `note_links.target_label`

### Link Tracking

On note save, `NoteLinkResolverService.syncNoteLinks()` parses the body and upserts the `note_links` table. This enables reverse queries: "find all notes that reference Task X."

---

## Attachments

### Architecture

```
Note (Neon)                    ZB Platform (S3)
┌──────────────┐              ┌──────────────────┐
│ note          │              │ SubTask           │
│  backing_     │─────────────▶│  (auto-created)   │
│  task_id      │              │                    │
└──────────────┘              │  TaskAttachment 1  │──▶ S3 object
                              │  TaskAttachment 2  │──▶ S3 object
┌──────────────┐              │  TaskAttachment 3  │──▶ S3 object
│ note_         │              └──────────────────┘
│ attachments   │
│  (metadata    │  Neon stores metadata for search/filter.
│   + index)    │  ZB S3 stores actual files.
└──────────────┘
```

### Upload Flow

1. User drags file onto note editor (or clicks attach button)
2. `NoteAttachmentService.uploadAttachment()`:
   a. If `note.backing_task_id` is null → create ZB SubTask via Tasks API, save ID to note
   b. If note was already injected (`injected_to_task_id` exists) → reuse that SubTask
   c. Upload file via ZB Task Attachments API → returns attachment ID + S3 URL
   d. Insert row into `note_attachments` (Neon) with metadata
3. Note editor shows file in attachment list with preview/download

### Attachment Types

| `attachment_type` | Description | Preview Behavior |
|---|---|---|
| `file` | Generic file (DOCX, XLSX, CSV, PDF) | PDF inline viewer; others download |
| `llm_prompt` | LLM prompt text file (.txt, .md) | Inline markdown preview |
| `llm_history` | LLM conversation log | Formatted conversation view |
| `specstory_session` | SpecStory session history (.jsonl, .md) | Session timeline view |
| `image` | PNG, JPG, SVG | Inline image preview |

### Reuse Pattern: Injection + Attachments Share a Backing Task

If a note is injected to Timeline **and** has attachments, both use the same ZB SubTask:
- Timeline injection creates a comment on the SubTask
- Attachments are TaskAttachments on the same SubTask
- One SubTask per note, not per operation

---

## Timeline Injection Mechanism

When a note is injected:

1. **NoteInjectionService** finds or creates `engagement_notes` SubTask linked to the engagement
2. Posts comment to that SubTask: `**Injected from Note:** [Title](#note-id)\n\n{body}`
3. Updates note record: `injected_to_task_id`, `injected_comment_id`, `injected_at`
4. Timeline renders with special "Injected from Note" badge and back-link to original

**Key rule:** Notes are NOT Task Comments by default. They only become comments when explicitly injected.

---

## Access Control

| access_level | Who can view | Who can edit |
|---|---|---|
| `personal` | Creator only | Creator only |
| `boundary` | All boundary users | All boundary users |
| `project` | All project members (future) | All project members |
| Shared (future) | Specific users via `note_sharing` | Per `permission` column |

---

## Meeting Minutes Template (Bob Cheek PMO Pattern)

Special note type with structured fields:

- **meeting_date** (required), **duration**, **attendees** (chip list)
- **Sections:** Agenda, Decisions, Action Items (assignee + status + due date), Open Issues, Next Steps
- **Action Items** match Bob's V-Team pattern: per-person checkboxes with status
- **Export** to PDF/Markdown

---

## Search & Filter

### NoteFilterRequest

```typescript
interface NoteFilterRequest {
  folderId?: string;
  authorIds?: string[];
  tagIds?: string[];          // AND logic
  dateRange?: { start: Date; end: Date };
  accessLevel?: 'personal' | 'boundary' | 'project';
  isMeetingMinutes?: boolean;
}
```

Full-text search uses PostgreSQL `to_tsvector` / `plainto_tsquery` on title + body.

---

## Phase Breakdown

### Phase 1: Core Notes (2 weeks)
- Create data model (tables, indexes, views)
- Implement NotesService (CRUD, list, search)
- Create note-editor component (markdown editor)
- Create notes-list component with basic filtering
- Add Notes tab to engagement-detail

### Phase 2: Folder Hierarchy (2 weeks)
- Implement NoteHierarchyService
- Create note-folder-tree component (collapsible tree, drag-to-move)
- Folder CRUD in notes-panel
- Move note to folder

### Phase 3: Tags & Advanced Filters (2 weeks)
- **BLOCKED on tag backend decision** — see "Open Decisions" section
- Tag management: local Neon (current) OR ZB platform tags with prefix convention (proposed)
- Mat chips + autocomplete UI component (done: `note-tag-editor`)
- Create notes-search-filters component
- Tag autocomplete in note-editor
- Saved filter presets
- If ZB tags: `ZbTagPipe` for prefix stripping, `NoteTagService` wrapper for ZB API

### Phase 4: Resource Linking (2 weeks)
- Implement NoteLinkResolverService
- `[[type:uuid]]` parser + renderer in note editor
- Autocomplete dropdown on `[[` trigger (search tasks, findings, resources)
- `note_links` table sync on save
- Clickable resource chips with modal preview for findings
- Broken link detection

### Phase 5: Attachments (2 weeks)
- Implement NoteAttachmentService
- Auto-create backing ZB SubTask on first upload
- Upload via ZB Task Attachments API
- `note_attachments` metadata in Neon
- Drag-and-drop upload in note editor
- Inline preview for images/PDFs, download for other types
- Attachment type classification (file, llm_prompt, llm_history, specstory_session)

### Phase 6: Timeline Injection (2 weeks)
- Implement NoteInjectionService
- Create/find `engagement_notes` SubTask logic (reuse backing task if exists)
- "Inject to Timeline" button on note-card
- Update timeline-panel to show injection provenance + back-link
- Injected notes show attachments in timeline view

### Phase 7: Meeting Minutes Template (2 weeks)
- Create note-meeting-minutes component
- Structured fields: attendees, agenda, decisions, action items, open issues
- Export to PDF/Markdown

### Phase 8: Access Control & Sharing (2 weeks)
- Enforce access_level in NotesService
- Access level selector in note-editor
- Note-sharing modal (share with specific users)

### Phase 9: Polish & Integration (2-3 weeks)
- Keyboard shortcuts (Cmd+K search, Cmd+N new note)
- Drag-to-move between folders
- Responsive mobile layout
- Performance testing with 100+ notes

---

## Design Decisions

### Why separate from Task Comments?
1. **Flexibility** — folder hierarchy, tags, access levels without ZB Task constraints
2. **Metadata** — rich structure that Task comments don't support
3. **Audit trail** — independent record separate from Task lifecycle
4. **No platform dependency** — just Neon tables, no ZB API changes needed

### Why soft delete?
- Regulatory/audit trail requirement (Bob: "full program history")
- Reversible if accidental
- Legal hold compliance

### Why denormalize boundary_id/project_id on notes?
- Fast filtering without JOIN to work_requests
- Efficient access control checks
- Acceptable redundancy for non-critical data

---

## Open Decisions

### DECISION NEEDED: Tag Backend — Local Neon vs ZeroBias Platform Tags

**Full design extracted to:** [029-hierarchical-tag-naming.md](./029-hierarchical-tag-naming.md)

**Summary:** Migrate to ZB platform tags with dot-separated namespaced prefix convention (`sme-mart.{engagement}.{boundary}.{project}.{resource}.{tag-name}`). Prefix depth encodes hierarchy scope. `searchTags` POST partial matching confirmed working (2026-03-04). See Plan 029 for full design, service API, migration plan, and validated API capabilities.

---

## Future Enhancements (Post-MVP)

- Note versioning (edit history, rollback)
- Comments on notes (discussion within note system)
- AI summarization from meeting transcripts
- Transcription integration (Zoom/Teams)
- RLS (row-level security) at database level
- Regulatory WBS note templates (SOC 2, ISO 27001, etc.)
- Jira sync (create issues from meeting action items)

---

## Integration Points

| System | Integration |
|---|---|
| Engagement Detail | New "Notes" tab |
| Timeline | Inject mechanism → `engagement_notes` SubTask comment |
| Project Layer (Plan 022) | Project-level visibility when Projects arrive |
| Transparency Center (Plan 023) | Audit trail, readiness assessment references |
| ZeroBias Tasks | Auto-create `engagement_notes` SubTask per engagement |
