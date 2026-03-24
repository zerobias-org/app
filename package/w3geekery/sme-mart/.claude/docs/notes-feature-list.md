# Notes — Feature List

## Core

- **Rich-text editing** — Milkdown markdown editor with bold, italic, headings, lists, code blocks, tables, links, and task checkboxes
- **Markdown rendering** — Read-only view with DOMPurify sanitization
- **Create, edit, soft-delete** — Full CRUD with auto-timestamping (created_at, updated_at, updated_by)
- **Access levels** — Personal, Boundary, or Project scope per note

## Organization

- **Hierarchical folders** — Unlimited nesting depth with collapsible tree navigation
- **Notebooks** — Top-level folders as "notebooks" in a dedicated column (OneNote-style 3-column layout)
- **Drag-and-drop** — Drag notes between folders, drag folders into other folders, cross-notebook moves with optional folder structure recreation
- **Column toggles** — Show/hide notebooks column and folders column independently; notes list always visible
- **Folder colors** — User-assignable folder colors stored in preferences

## Search & Filtering

- **Full-text search** — Search notes by title and body content
- **Folder filtering** — Browse by folder or view all notes in an engagement
- **Tag filtering** — Filter notes by resource tags (unified tagging via SmeMartResourceService)
- **Document cross-linking search** — Find all notes that reference a specific org document via `sme-doc://` links

## Document Integration

- **sme-doc:// links** — Insert links to org documents directly in note body via document chooser dialog
- **Document chooser toolbar button** — Browse and select org documents without leaving the editor
- **Bidirectional navigation** — Click a doc link in a note to view the document; search notes from a document's detail view

## Meeting Minutes

- **Meeting metadata** — Optional meeting date, duration, and "is meeting minutes" flag on any note
- **Meeting minutes template** — Structured sections for meeting notes (planned)

## Sharing *(Plan 047)*

- **Per-user sharing** — Share individual notes with specific users as viewer or editor
- **Shared Notebook** — Auto-created folder per engagement visible to all participants
- **Share badges** — Icon + count on shared notes; "Shared by [name]" subtitle
- **Permission enforcement** — Viewer = read-only editor; Editor = full editing; Owner = full control
- **"Shared with Me" filter** — Virtual folder showing all notes shared with the current user

## Versioning *(Plan 047)*

- **Auto-versioning** — Each save snapshots the previous title + body as an immutable version
- **Version history panel** — Right-side drawer listing all versions with date, author, and body snippet
- **Version browser (split view)** — Current note on left, selected old version on right as raw copyable markdown; toggle between raw / rendered / diff view
- **Version search** — Search across all version bodies to find previous content; matches highlighted in preview
- **Version diff** — Inline diff comparing any two versions (or version vs. current); additions in green, removals in red
- **Revert** — Restore a previous version (creates a new version snapshot of current before reverting)
- **Version badge** — "v{N}" indicator in editor toolbar; click to open history

## Timeline Integration *(Plan 047)*

- **Share/unshare events** — Note sharing actions appear in the engagement timeline
- **Pin/unpin events** — Pinning actions appear in the engagement timeline
- **Clickable links** — Timeline event cards link back to the note in the Notes tab

## Pinned Notes *(Plan 047)*

- **Pin to top** — Pin important notes so they appear first in any folder view
- **Engagement-global** — Pinned notes visible to all engagement participants
- **Push-pin badge** — Visual indicator on pinned notes
- **Filter by context** — Use existing tags and project_id to narrow pinned notes by topic

## Task-Linked Checkboxes *(Plan 047)*

- **Link checkboxes to ZB Tasks** — Markdown checkboxes reflect live task status (read-only)
- **Configurable match statuses** — User defines which task statuses mean "checked" (e.g., done, approved)
- **Status chip** — Small status indicator next to each linked checkbox showing current task state
- **Task picker** — Toolbar button to browse engagement tasks and insert linked checkboxes
- **Tooltip** — Hover shows task title and current status

## Technical

- **Neon PostgreSQL storage** — Independent from ZeroBias Task comments; dedicated tables + views
- **Engagement-scoped** — All notes belong to an engagement
- **Resource tagging** — Unified tagging via SmeMartResourceService and ZB Hydra tags
- **Soft delete** — Archived flag for regulatory compliance and reversibility
