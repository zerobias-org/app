# Notes Filtering, Relationships & Related Items Panel

> **Status:** DRAFT — awaiting Clark's feedback before implementation

---

## Current State

- Notes table has nullable `folder_id` (unassigned notes are possible)
- Tags exist (`note_tags`, `note_tag_assignments` tables)
- Access levels implemented (`personal | boundary | project`)
- Boundary/Project denormalized on notes for fast filtering
- UI: Notebooks → Folders → Notes list → Editor
- No filtering UI yet (only full-text search)
- No folder tagging (only notes can be tagged)
- No related items sidebar

---

## Topic 1: Parentless/Unassigned Notes

Some notes have `folder_id = null` (e.g., "'Nother Note").

### Options

| Option | Pros | Cons |
|--------|------|------|
| **A: Require folder** | Clean data | Breaks quick-capture; migration burden |
| **B: "Unassigned" virtual folder** | Preserves ad-hoc notes; no migration; familiar (Apple Notes) | Virtual folder adds UI complexity |
| **C: Auto-assign to "Inbox"** | Clean data; inbox pattern | Less flexible; every engagement gets an Inbox |

**Recommendation:** Option B — virtual "Unassigned" folder at top of folders list when a notebook is selected.

### Questions
- Does Option B feel right?
- Position: top of folders list, or bottom?
- Should unassigned count be visible?

---

## Topic 2: Filtering System

Tags are the "heavy lifter." Four filtering dimensions:

### Dimensions

1. **Tag Filter** (PRIMARY) — multiselect, AND/OR toggle
2. **Access Level** (SECONDARY) — checkbox: Personal | Boundary | Project
3. **Boundary / Project** (FUTURE) — autocomplete to scope by boundary
4. **Advanced** (NICE-TO-HAVE) — date range, author, meeting minutes only

### UI Placement: Popover Filter Panel

Icon button in top bar opens a floating panel with all filters.

**Why popover?**
- Doesn't disrupt 3-column layout
- Supports complex filters (multiselect, date range)
- Discoverable but not always visible
- Active filter count badge on the icon

```
┌─────────────────────────────────────┐
│ Tags                                │
│ ☐ Board Minutes ☐ Risk Assessment   │
│ ☐ Legal Review  ☐ Compliance        │
│ ○ All tags (AND) ○ Any tag (OR)     │
│                                     │
│ Access Level                        │
│ ☐ Personal ☐ Boundary ☐ Project     │
│                                     │
│ ▶ Advanced (collapsed)              │
│                                     │
│ [Apply]  [Clear All]                │
└─────────────────────────────────────┘
```

### Questions
- Tag filter default: AND or OR?
- Save filter presets? (e.g., "My Board Minutes")
- Boundary filter now or defer?

---

## Topic 3: Right Sidebar — Related Items

When viewing a note, show a collapsible right sidebar with cross-links.

### Related Item Types

1. **Linked Tasks** — tasks referenced via tags or `[[task:uuid]]` in body; show name + status badge
2. **Linked Resources** — findings, subtasks, connections referenced in note
3. **Related Notes** — other notes with overlapping tags
4. **Timeline References** — timeline events that mention this note/engagement

### Architecture

- Lazy-load each section on demand (don't fetch all on note selection)
- Resizable sidebar (drag border)
- Collapsible per section
- Clicking items opens in new tab or viewer dialog

### Questions
- Which related items matter most to PMO? (Tasks? Other notes? Timeline events?)
- Open links in same tab or new tab?
- Show backlink counts? (e.g., "5 other notes link to this")

---

## Topic 4: Notebook & Folder Tagging

**Key idea:** Tags as universal linking mechanism. Folders/notebooks can be tagged, child notes inherit.

### Recommended Approach: Dynamic Tag Aggregation

- Folders are taggable
- Notes' effective tags = direct tags + inherited folder tags
- Computed at query time (no data duplication)

### Example Workflow

1. Create notebook "Board Minutes 2026"
2. Tag it with `TASK-1234` (a Task.code)
3. All notes in the notebook inherit the tag
4. Right sidebar shows related Task items for `TASK-1234`
5. PMO gets cross-links to everything related

### Tag Strategy

- **Tags on notes/folders:** User-friendly labels (`"Board Minutes"`, `"Risk Assessment"`)
- **External links:** `[[task:abc-123]]` in note body → stored in `note_links` table
- Clean separation: tags = organization, links = structured references

### Questions
- Is tagging at the notebook level useful for Bob Cheek's V-Team pattern?
- Should folder tags be visually distinct from note tags?
- Confirm use case: "Tag entire notebook with task ID, all notes inherit it"?

---

## Phased Implementation

### Phase 1: Foundation (Week 1)
- Unassigned notes (virtual folder)
- Tag filtering popover
- Access level filtering
- **Files:** `notes.service.ts`, `notes-filter-panel.component.ts` (NEW), `notes-panel`

### Phase 2: Right Sidebar (Week 2)
- Related items sidebar
- Linked tasks, notes, timeline events
- Requires `note_links` table + resolver service
- **Files:** `related-items-sidebar.component.ts` (NEW), `note-link-resolver.service.ts` (NEW)

### Phase 3: Folder Tags (Week 2-3)
- `note_folder_tags` + `note_folder_tag_assignments` tables
- Query-time tag aggregation (new view: `v_notes_with_all_tags`)
- Folder tag management UI
- **Files:** DB schema, `note-hierarchy.service.ts`, folder dialogs

### Phase 4: Polish (Week 3)
- Performance (lazy loading, caching)
- Edge cases, mobile UX, accessibility

---

## DB Schema Changes

### Phase 3: Folder Tags

```sql
CREATE TABLE note_folder_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_by_zerobias_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (engagement_id, name)
);

CREATE TABLE note_folder_tag_assignments (
  folder_id UUID NOT NULL REFERENCES note_folders(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES note_folder_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (folder_id, tag_id)
);
```

### Phase 3: Aggregated Tags View

```sql
CREATE VIEW v_notes_with_all_tags AS
SELECT
  n.*,
  STRING_AGG(DISTINCT nt.name, ', ') AS tags,
  STRING_AGG(DISTINCT nft.name, ', ') AS folder_tags,
  STRING_AGG(DISTINCT COALESCE(nt.name, nft.name), ', ') AS all_tags
FROM notes n
LEFT JOIN note_tag_assignments nta ON nta.note_id = n.id
LEFT JOIN note_tags nt ON nt.id = nta.tag_id
LEFT JOIN note_folders nf ON nf.id = n.folder_id
LEFT JOIN note_folder_tag_assignments nfta ON nfta.folder_id = nf.id
LEFT JOIN note_folder_tags nft ON nft.id = nfta.tag_id
WHERE n.archived = FALSE
GROUP BY n.id;
```

---

## Success Criteria

- Unassigned notes discoverable and organizable
- Tag filtering is primary way to find notes
- Related items sidebar provides cross-linking context
- Folder tagging enables relationship propagation
- Performance: >500 notes, filtering in <200ms
- PMO can efficiently work with meeting minutes, board decisions, legal reviews
