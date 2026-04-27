# 028 — Drag-and-Drop for Folders & Notes

**Status:** Complete
**Parent:** 026 (Notes Feature), 027 (OneNote Layout)

## Context

The Notes UI has notebooks, folders, and notes in a 3-column layout. Users need to reorganize by dragging folders into other folders/notebooks and notes into other folders/notebooks. Cross-notebook moves need a dialog for target selection with optional "same folder structure" recreation.

**Key constraints:** No color inheritance (folders/notes don't inherit parent color). Angular CDK drag-drop already in dependencies (v21.1.4). Existing `move-note-dialog` component can be extended.

## Phase 1: Enhance Move Dialog + Service Layer

### 1.1 Extend MoveNoteDialog → MoveItemDialog
- **File:** `src/app/shared/components/move-note-dialog/move-note-dialog.component.ts`
- Rename component and data interface to handle both notes and folders
- Add `itemType: 'note' | 'folder'` to dialog data
- Add notebook selector (mat-select of top-level folders)
- Add folder tree scoped to selected notebook
- Add "Same folder structure" checkbox (visible only for folders moving cross-notebook)
- Return: `{ folderId?: string; recreateStructure?: boolean; targetNotebookId?: string }`

### 1.2 Add folder structure recreation to NoteHierarchyService
- **File:** `src/app/core/services/note-hierarchy.service.ts`
- `createFolderStructure(engId, templateFolderId, targetParentId)` — recursively recreate folder hierarchy in target notebook
- `moveFolderToNotebook(folderId, targetNotebookId, targetParentId)` — move folder, updating parent_id

## Phase 2: Folder Drag-Drop (Same Notebook)

### 2.1 Add CDK drag-drop to folder tree
- **File:** `src/app/shared/components/note-folder-tree/note-folder-tree.component.ts`
- Import `DragDropModule`
- `onFolderDropped(event)` handler — get source/target, validate no cycles (BFS check), call `moveFolder()`
- Cycle detection: target must not be descendant of source

### 2.2 Update folder tree template
- **File:** `src/app/shared/components/note-folder-tree/note-folder-tree.component.html`
- `cdkDropList` on `.folder-tree`, `cdkDrag` on `.folder-row`
- `cdkDragPreview` for visual feedback
- Disable drag when collapsed

### 2.3 Add drag-drop SCSS
- **File:** `src/app/shared/components/note-folder-tree/note-folder-tree.component.scss`
- `.cdk-drag-placeholder` — dashed border indicator
- `.cdk-drag-preview` — compact preview card
- `.folder-row.drop-target` — highlight valid drop zone

## Phase 3: Note Drag-Drop (Same Notebook)

### 3.1 Add CDK drag-drop to notes list
- **File:** `src/app/shared/components/notes-panel/notes-panel.component.ts`
- Import `DragDropModule`
- `onNoteDropped(event)` handler — call `hierarchy.moveNote(noteId, targetFolderId)`
- Connected drop lists: notes list ↔ folder tree (drop note onto folder)

### 3.2 Update notes panel template
- **File:** `src/app/shared/components/notes-panel/notes-panel.component.html`
- `cdkDropList` on `.list-items`, `cdkDrag` on `.list-item`
- `cdkDragPreview` showing note title
- Folder rows also accept note drops (connected lists)

## Phase 4: Cross-Notebook Moves

### 4.1 Cross-notebook folder moves
- **File:** `src/app/shared/components/note-folder-tree/note-folder-tree.component.ts`
- Detect cross-notebook drop → open MoveItemDialog
- Dialog result: either target folder ID, or "recreate structure" flag
- If recreate: call `createFolderStructure()` then move notes

### 4.2 Cross-notebook note moves
- **File:** `src/app/shared/components/notes-panel/notes-panel.component.ts`
- Detect note dropped onto different notebook's folder → open MoveItemDialog
- Dialog shows notebooks + folder tree of selected notebook
- Move note to selected folder

### 4.3 Context menu fallbacks
- Add "Move to Notebook…" menu item to folder context menu (note-folder-tree)
- Add "Move to…" menu item to note list items (notes-panel)
- Both open MoveItemDialog — DnD is not the only path

## Key Files

| File | Changes |
|------|---------|
| `move-note-dialog/move-note-dialog.component.ts` | Extend → MoveItemDialog |
| `note-hierarchy.service.ts` | Add `createFolderStructure()`, `moveFolderToNotebook()` |
| `note-folder-tree/note-folder-tree.component.ts` | CDK drag-drop, cycle detection |
| `note-folder-tree/note-folder-tree.component.html` | cdkDrag/cdkDropList directives |
| `note-folder-tree/note-folder-tree.component.scss` | Drag preview + drop zone styles |
| `notes-panel/notes-panel.component.ts` | Note drag-drop, connected lists |
| `notes-panel/notes-panel.component.html` | cdkDrag on notes, connected to folders |

## Risks

| Risk | Mitigation |
|------|-----------|
| Cycle creation (folder → own child) | BFS validation before committing move |
| Large trees slow during drag | `cdkDropListDisabled` when collapsed; virtual scroll if >100 |
| Rename MoveNoteDialog breaks callers | Grep all imports, update in Phase 1 |

## Verification

1. `npx ng build --configuration development` — compiles cleanly after each phase
2. Manual test: drag folder into sibling → parent_id updates, tree refreshes
3. Manual test: drag note onto folder → folder_id updates, list refreshes
4. Manual test: drag folder to different notebook → dialog opens, tree/structure options work
5. Manual test: context menu "Move to Notebook…" → same dialog flow
6. Verify no color inheritance on any move operation
