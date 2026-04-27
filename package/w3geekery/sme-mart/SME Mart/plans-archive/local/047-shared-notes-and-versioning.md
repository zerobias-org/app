# Plan 047: Shared Notes & Versioning

**Status:** Draft
**Created:** 2026-03-11
**Author:** Clark
**Estimated effort:** 32–40 hrs across 8 phases

---

## Overview

Notes currently default to the engagement scope with `access_level: personal | boundary | project`. This plan adds:

1. **Per-user sharing** — note owners can share individual notes with specific users (viewer/editor permissions)
2. **Note versioning** — each save creates an immutable snapshot; users can view history and revert
3. **Shared Notebook** — a hard-coded folder per engagement that aggregates all notes shared with the current user
4. **Timeline integration** — share/unshare/pin events appear in the engagement timeline
5. **Pinned notes** — sticky notes that stay at the top of a folder or the Shared Notebook
6. **Task-linked checkboxes** — markdown checkboxes linked to ZB Tasks reflect task status automatically

## Architecture

### Database Tables

**`note_shares`** — per-user sharing with permissions

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `note_id` | uuid FK → notes | |
| `shared_by_zerobias_user_id` | text | who shared |
| `shared_with_zerobias_user_id` | text | who receives |
| `permission` | text | `viewer` or `editor` |
| `granted_at` | timestamptz | |
| `revoked_at` | timestamptz NULL | soft revoke |

Unique constraint: `(note_id, shared_with_zerobias_user_id)` where `revoked_at IS NULL`.

**`note_versions`** — immutable snapshots

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `note_id` | uuid FK → notes | |
| `version_number` | integer | auto-increment per note |
| `title` | text | snapshot of title |
| `body` | text | snapshot of body |
| `created_by_zerobias_user_id` | text | who saved |
| `created_at` | timestamptz | |

### Views

**`v_note_shares_detail`** — enriched share rows with note title and user display names (joins `marketplace_users`).

**`v_notes_shared_with_me`** — notes shared with a given user across an engagement, with permission level and sharer info.

---

## Phase 1: Database Schema & Migration (5 hrs)

### 1.1 Create `note_shares` table
- DDL via `mcp__Neon__run_sql_transaction`
- Columns as above + indexes on `note_id`, `shared_with_zerobias_user_id`
- Unique partial index: `(note_id, shared_with_zerobias_user_id) WHERE revoked_at IS NULL`

### 1.2 Create `note_versions` table
- DDL via `mcp__Neon__run_sql_transaction`
- Columns as above + index on `note_id`
- Composite unique: `(note_id, version_number)`

### 1.3 Create views
- `v_note_shares_detail`: join `note_shares` → `notes` → `marketplace_users` (×2 for sharer + recipient)
- `v_notes_shared_with_me`: filtered view for a user's incoming shares (non-revoked, non-archived notes)

### 1.4 Seed test data
- Share a few existing notes between demo users
- Create 2-3 version snapshots for a demo note

**Files:** Neon MCP only (no Angular files)

---

## Phase 2: Service Layer (6 hrs)

### 2.1 Models — `note-share.model.ts`
```typescript
interface NoteShare {
  id: string;
  note_id: string;
  shared_by_zerobias_user_id: string;
  shared_with_zerobias_user_id: string;
  permission: NoteSharePermission;
  granted_at: string;
  revoked_at: string | null;
}

type NoteSharePermission = 'viewer' | 'editor';

interface NoteShareDetail extends NoteShare {
  note_title: string;
  sharer_display_name: string;
  recipient_display_name: string;
}

interface NoteVersion {
  id: string;
  note_id: string;
  version_number: number;
  title: string;
  body: string;
  created_by_zerobias_user_id: string;
  created_at: string;
}
```

### 2.2 `NoteShareService`
- `shareNote(noteId, userId, permission)` → create row in `note_shares`
- `revokeShare(shareId)` → set `revoked_at`
- `updatePermission(shareId, permission)` → update permission
- `listSharesForNote(noteId)` → `v_note_shares_detail` filtered by `note_id`
- `listNotesSharedWithMe(engagementId, userId)` → `v_notes_shared_with_me`
- Access check: `canUserAccess(noteId, userId)` → owner OR active share
- `canUserEdit(noteId, userId)` → owner OR editor share

### 2.3 `NoteVersionService`
- `createVersion(noteId)` → snapshot current title/body into `note_versions`, auto-increment `version_number`
- `listVersions(noteId)` → ordered by `version_number DESC`
- `getVersion(versionId)` → single version
- `searchVersions(noteId, query)` → search title + body across all versions for a note (Neon `ILIKE` query)
- `revertToVersion(noteId, versionId)` → update note title/body from version snapshot, create new version entry

### 2.4 Integrate with `NotesService`
- `updateNote()` → call `NoteVersionService.createVersion()` before applying update (snapshot the "before" state)
- Auto-versioning only on body/title changes (skip metadata-only updates)

**Files:**
- `src/app/core/models/note-share.model.ts` (new)
- `src/app/core/models/index.ts` (export)
- `src/app/core/services/note-share.service.ts` (new)
- `src/app/core/services/note-version.service.ts` (new)
- `src/app/core/services/notes.service.ts` (modify — integrate versioning)

---

## Phase 3: Sharing UI (5 hrs)

### 3.1 Share Note Dialog — `NoteShareDialog`
- Opened from note context menu (kebab) → "Share…"
- Input: note ID, engagement ID
- Shows engagement members (from `marketplace_users` filtered by engagement participants)
- Checkboxes + permission dropdown (viewer/editor) per user
- Already-shared users shown with current permission, toggle to revoke
- Search/filter user list

### 3.2 Share Badge on Note Cards
- Small share icon + count badge on notes that have active shares
- Tooltip showing "Shared with N people"

### 3.3 "Shared with Me" Filter in Notes Panel
- Add a virtual folder/filter option: "Shared with Me"
- Uses `NoteShareService.listNotesSharedWithMe()`
- Notes shown as read-only unless user has `editor` permission
- Visual indicator: "Shared by [name]" subtitle

### 3.4 Permission Enforcement in Editor
- If user has `viewer` permission → MarkdownEditor disabled (read-only mode)
- If user has `editor` permission → full editing allowed
- Owner always has full control

**Files:**
- `src/app/shared/components/note-share-dialog/note-share-dialog.component.ts` (new)
- `src/app/shared/components/note-share-dialog/note-share-dialog.component.html` (new)
- `src/app/shared/components/note-share-dialog/note-share-dialog.component.scss` (new)
- `src/app/shared/components/notes-panel/notes-panel.component.ts` (modify — add share menu item, shared-with-me filter)
- `src/app/shared/components/notes-panel/notes-panel.component.html` (modify)
- `src/app/shared/components/note-editor-panel/note-editor-panel.component.ts` (modify — read-only mode)
- `src/app/shared/index.ts` (export)

---

## Phase 4: Versioning UI (7 hrs)

### 4.1 Version History Panel — `NoteVersionHistoryPanel`
- Triggered from note toolbar → "History" button (mat-icon: `history`)
- Opens as a right-side drawer (resizable, same pattern as notes column)
- Each row: version number, date, author, title preview, body snippet (first ~80 chars)
- Click to select a version → loads it in the preview pane (4.2)
- Active version highlighted in the list

### 4.2 Version Browser — Split View
- **Left pane:** Current note (live editor, fully editable)
- **Right pane:** Selected old version (read-only, raw markdown in a `<textarea readonly>` or code view — NOT rendered HTML)
- Raw markdown is key — user needs to select + copy text from old versions and paste into the live editor
- Toggle between raw markdown and rendered preview (mat-button-toggle: `code` / `visibility`)
- "Revert to this version" button in the right pane header
- Revert creates a new version (current becomes snapshot, then overwrite with old) — confirmation dialog

### 4.3 Version Search
- Search input at top of the Version History Panel
- Searches across all version bodies (client-side filter if <100 versions, Neon `LIKE` query if more)
- Highlights matching versions in the list with a match count badge
- When a search-matched version is selected, the search term is highlighted in the raw markdown preview (simple `mark` tag wrapping)
- Also searches version titles

### 4.4 Auto-Versioning Indicator
- Small "v{N}" badge in note editor toolbar showing current version count
- Tooltip: "Last saved: [date] by [author]"
- Click the badge → opens the Version History Panel (shortcut)

### 4.5 Version Diff View
- Third toggle in the right pane: `code` / `visibility` / `difference`
- Uses a lightweight text-diff library (e.g., `diff` npm package) to compare selected version against current note
- Inline diff rendering: additions highlighted green, removals highlighted red, unchanged lines in default color
- Line-by-line diff (not character-level) for readability on large notes
- Diff header shows: "Comparing v{N} (selected) → current"
- User can also diff between any two versions: secondary version picker dropdown in the diff header ("Compare against: [v3 ▾]" defaults to "current")

**Files:**
- `src/app/shared/components/note-version-history/note-version-history.component.ts` (new)
- `src/app/shared/components/note-version-history/note-version-history.component.html` (new)
- `src/app/shared/components/note-version-history/note-version-history.component.scss` (new)
- `src/app/shared/components/note-editor-panel/note-editor-panel.component.ts` (modify — history button, version badge, split-view layout)
- `src/app/shared/components/note-editor-panel/note-editor-panel.component.html` (modify — right pane slot for version browser)
- `src/app/shared/components/note-editor-panel/note-editor-panel.component.scss` (modify — split-view styles)
- `src/app/shared/index.ts` (export)

---

## Phase 5: Shared Notebook (4 hrs)

### 5.1 Auto-Create "Shared" Folder per Engagement
- On engagement load, ensure a special folder exists: `name: "Shared"`, `access_level: "boundary"`, `sort_order: -1`
- Use a convention-based ID or a flag column (`is_shared_notebook: boolean` on `note_folders`)

### 5.2 Shared Notebook Behavior
- Notes placed in the Shared folder are automatically visible to all engagement participants
- Essentially a shortcut: "share with everyone" = move to Shared folder
- Moving a note out of Shared folder revokes the implicit share

### 5.3 Visual Treatment
- Shared folder gets a distinct icon (e.g., `people` or `folder_shared`)
- Cannot be renamed, deleted, or reordered
- Always appears first in the folder tree

**Files:**
- `src/app/core/services/notes.service.ts` (modify — ensure shared folder on engagement load)
- `src/app/core/services/note-hierarchy.service.ts` (modify — shared folder pinned at top)
- `src/app/shared/components/note-folder-tree/note-folder-tree.component.ts` (modify — shared folder icon, non-deletable)
- `src/app/shared/components/note-folder-tree/note-folder-tree.component.html` (modify)
- Neon: add `is_shared_notebook` boolean column to `note_folders` table

---

## Phase 6: Tests (3 hrs)

### 6.1 Service Tests
- `NoteShareService` — share, revoke, permission update, list shares, access checks
- `NoteVersionService` — create version, list versions, search versions, revert, auto-increment

### 6.2 Component Tests
- `NoteShareDialog` — load targets, toggle shares, permission selection, save
- `NoteVersionHistoryPanel` — load versions, search + highlight, select version, split-view toggle, revert action

### 6.3 Smoke Test
- Chrome DevTools MCP: create note → share → verify recipient sees it → revert a version → verify

**Files:**
- `src/app/core/services/note-share.service.spec.ts` (new)
- `src/app/core/services/note-version.service.spec.ts` (new)
- `src/app/shared/components/note-share-dialog/note-share-dialog.component.spec.ts` (new)
- `src/app/shared/components/note-version-history/note-version-history.component.spec.ts` (new)
- `.claude/smoke-tests/shared-notes-versioning.md` (new)
- `.claude/smoke-tests/README.md` (update)

---

---

## Phase 7: Timeline Integration & Pinned Notes (4 hrs)

### 7.1 New Timeline Event Types

Extend `TimelineEventType` and payloads:

```typescript
// Add to timeline-event.model.ts
type TimelineEventType = ... | 'note_shared' | 'note_unshared' | 'note_pinned' | 'note_unpinned';

interface NoteSharedPayload {
  type: 'note_shared';
  noteId: string;
  noteTitle: string;
  sharedWithName: string;
  permission: NoteSharePermission;
}

interface NoteUnsharedPayload {
  type: 'note_unshared';
  noteId: string;
  noteTitle: string;
  unsharedFromName: string;
}

interface NotePinnedPayload {
  type: 'note_pinned' | 'note_unpinned';
  noteId: string;
  noteTitle: string;
  folderName?: string;
}
```

### 7.2 Emit Timeline Events from Services

- `NoteShareService.shareNote()` → emit `note_shared` event (post comment to engagement's ZB task)
- `NoteShareService.revokeShare()` → emit `note_unshared` event
- Pin/unpin actions → emit `note_pinned` / `note_unpinned` events
- All events use `EngagementTimelineService.postComment()` with a structured markdown template:
  ```
  📝 **Note shared:** "Meeting Notes Q1" shared with Jane Doe (editor)
  📌 **Note pinned:** "Action Items" pinned in Shared Notebook
  ```

### 7.3 Timeline Card Rendering
- `TimelineEventCard` already renders by type — add icon + color for note events
- Note events: `description` icon (blue) for share/unshare, `push_pin` icon (amber) for pin/unpin
- Clickable note title links to the note in the Notes tab

### 7.4 Pinned Notes — Database
- Add `pinned_at` (timestamptz, nullable) column to `notes` table
- `pinned_at IS NOT NULL` = pinned; `NULL` = not pinned
- Pinning is **engagement-global** — if you pin it, everyone in the engagement sees it pinned
- Sort: pinned notes first (by `pinned_at ASC`), then regular notes by `updated_at DESC`
- No separate pin-scoping column — notes already have `project_id` and resource tags for filtering by context. Pinning answers "is this important?" while tags/project_id answer "what is this related to?"

### 7.5 Pinned Notes — UI
- Pin/unpin from note context menu (kebab) → "Pin" / "Unpin"
- Pinned notes show a `push_pin` icon badge in the note list
- Pinned notes rendered in a separate "Pinned" section at top of folder view
- In Shared Notebook, pinned notes appear as sticky headers
- Users can filter pinned notes by tag or project_id using existing filter controls — no new scoping mechanism needed

**Files:**
- `src/app/core/models/timeline-event.model.ts` (modify — new types + payloads)
- `src/app/core/services/note-share.service.ts` (modify — emit timeline events)
- `src/app/core/services/notes.service.ts` (modify — pin/unpin methods, pinned sorting)
- `src/app/shared/components/timeline-event-card/timeline-event-card.component.ts` (modify — note event rendering)
- `src/app/shared/components/timeline-event-card/timeline-event-card.component.html` (modify)
- `src/app/shared/components/notes-panel/notes-panel.component.ts` (modify — pin menu item, pinned section)
- `src/app/shared/components/notes-panel/notes-panel.component.html` (modify)
- Neon: `ALTER TABLE notes ADD COLUMN pinned_at timestamptz`

---

## Phase 8: Task-Linked Checkboxes (3 hrs)

### 8.1 Concept

Markdown checkboxes in notes can be linked to ZB Tasks/Subtasks. Checkboxes are **read-only status reflections** — they show whether the linked task's current status matches the user-defined "done" statuses. The ZB Task is the single source of truth; the checkbox is a live indicator, not an input.

### 8.2 Link Syntax

Extend the `sme-doc://` link pattern with a task link convention:

```markdown
- [ ] Complete security assessment <!-- sme-task://task-uuid:done,approved -->
- [x] Submit compliance docs <!-- sme-task://task-uuid:done -->
```

- `<!-- sme-task://UUID:statuses -->` — HTML comment, invisible in rendered markdown
- `statuses` = comma-separated list of ZB task statuses that mean "checked" (default: `done` if omitted)
- The `[ ]` / `[x]` in the raw markdown is irrelevant — rendered state comes from live task status

### 8.3 `NoteTaskLinkService`

- `resolveTaskLinks(noteBody: string)` → parse all `sme-task://` entries (UUID + target statuses), batch-fetch task statuses from ZB platform
- `isTaskMatched(taskStatus: string, targetStatuses: string[])` → true if current status is in the target list
- Returns a map: `{ [taskUuid]: { status, title, isMatched, targetStatuses } }`
- No write operations — purely read-only resolution

### 8.4 Rendering

- Custom `marked` extension (or Milkdown plugin) that:
  1. Detects `<!-- sme-task://UUID:statuses -->` after a checkbox line
  2. Renders checkbox as checked/unchecked based on resolved task status (not raw markdown state)
  3. Adds a small task status chip next to the checkbox (e.g., `In Progress` or `Done`) using `zb-resource-status`
  4. Checkbox is **disabled** (non-interactive) — clicking does nothing
  5. Tooltip on hover: `"Task: {task.title} — Status: {task.status}"` with link to open task
  6. Visual distinction: task-linked checkboxes have a subtle `link` icon or border to differentiate from regular checkboxes

### 8.5 Linking UI

- In the note editor, a toolbar button "Link to Task" opens a task picker dialog
- User selects a ZB Task from the engagement's task tree
- User picks which statuses mean "checked" (defaults to `done`, multi-select from available statuses)
- Inserts `- [ ] {task.name} <!-- sme-task://{task.id}:{selectedStatuses} -->` at cursor
- Editing an existing link: click the status chip → reopens picker to change target statuses

**Files:**
- `src/app/core/services/note-task-link.service.ts` (new)
- `src/app/shared/components/note-editor-panel/note-editor-panel.component.ts` (modify — task link toolbar button)
- `src/app/shared/components/markdown-view/markdown-view.component.ts` (modify — task checkbox rendering)
- `src/app/shared/components/note-task-picker/note-task-picker.component.ts` (new — task + status selection dialog)
- `src/app/shared/components/note-task-picker/note-task-picker.component.html` (new)
- `src/app/shared/components/note-task-picker/note-task-picker.component.scss` (new)
- `src/app/shared/index.ts` (export)

---

## Dependencies

- Plan 026 (Notes Feature) — **complete**
- Plan 018 (Timeline) — **complete** (timeline event model + rendering)
- Plan 046 (Org Documents) — **complete** (pattern reference for sharing dialog)
- `marketplace_users` table — needed for user display names in share views
- `ImpersonationService` — used for effective user ID in all operations
- ZB Platform Task API — needed for Phase 8 task-linked checkboxes

## Risks

| Risk | Mitigation |
|------|------------|
| DataProducer doesn't support partial unique indexes | Use Neon DDL directly; DataProducer reads are fine since views flatten the data |
| Version table grows large for heavily edited notes | Add pagination to version list; consider TTL/archival later |
| Engagement participant list may not be available | Fall back to all `marketplace_users`; refine later with engagement-scoped user lists |
| Shared folder convention fragile | Use `is_shared_notebook` flag column rather than name matching |
| `sme-task://` HTML comments may be stripped by sanitizer | Ensure DOMPurify config allows HTML comments, or use a data attribute on the checkbox element instead |
| Task status fetch latency on notes with many links | Batch-fetch with a single `Promise.all`; cache resolved statuses for the session; show spinner per-checkbox while loading |

## Resolved Decisions

1. **Pinned notes: per-user or global?** → **Global per engagement.** Pinning means "important for this engagement." Use existing tags and `project_id` for context filtering — no new scoping dimension.
2. **Task-linked checkboxes: interactive or read-only?** → **Read-only.** Checkboxes reflect live task status. ZB Task is the single source of truth. No accidental state changes, no permission issues. User defines which statuses mean "checked" at link time.

## Open Questions

1. Should version snapshots capture folder_id and access_level, or just title+body?
2. Max versions per note? (Suggest: no limit initially, add pruning later if needed)
3. Should "Shared Notebook" notes auto-share with new engagement members added later? (Suggest: yes, by virtue of folder access_level)

---

## Roadmap — Future Plans

### Plan 048: Notification Center (Backlog)

In-app notification system for SME Mart. Designed for eventual migration into ZB platform events.

**Scope:**
- `notifications` table: `id`, `user_id`, `type`, `title`, `body`, `read_at`, `action_url`, `metadata` (jsonb), `created_at`
- `NotificationService`: create, list unread, mark read, mark all read
- Notification bell icon in app toolbar with unread count badge
- Dropdown panel showing recent notifications (last 20)
- Click → navigate to `action_url`

**Event types (initial):**
- `note_shared` — "Alice shared 'Meeting Notes' with you"
- `note_mention` — "@you was mentioned in a note" (future)
- `bid_received` — "New bid on your RFP" (currently only in timeline)
- `task_assigned` — "You were assigned to a task"
- `document_shared` — "A document was shared with your engagement"

**Migration path to ZB platform:**
- Notification types map 1:1 to ZB Event types
- `metadata` jsonb stores the same payload structure as ZB Events
- When ZB platform events are available, swap `NotificationService` to write ZB Events instead of local table
- UI stays the same — only the data source changes

**Estimated effort:** 8–12 hrs (separate plan)
