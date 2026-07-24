import {
  Component, input, output,
  ChangeDetectionStrategy, signal, computed, effect, inject, OnInit,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FolderDialog, FOLDER_COLORS, type FolderDialogData } from '../folder-dialog/folder-dialog.component';
import { MoveItemDialog, type MoveItemDialogData, type MoveItemDialogResult } from '../move-note-dialog/move-note-dialog.component';
import { NoteHierarchyService, type FolderTreeNode } from '../../../core/services/note-hierarchy.service';
import { UserPreferencesService } from '../../../core/services/user-preferences.service';

@Component({
  selector: 'app-note-folder-tree',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule,
    MatDialogModule, MatSnackBarModule,
  ],
  templateUrl: './note-folder-tree.component.html',
  styleUrl: './note-folder-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteFolderTree implements OnInit {
  private readonly hierarchy = inject(NoteHierarchyService);
  private readonly prefs = inject(UserPreferencesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Signal inputs (modernization)
  readonly engagementId = input.required<string>();
  /** When set, only show folders belonging to this notebook (top-level folder). */
  readonly notebookId = input<string | null>(null);
  readonly selectedFolderId = input<string | null>(null);
  readonly collapsed = input(false);

  // Output signals
  readonly folderSelected = output<string | null>();
  readonly treeChanged = output<void>();
  readonly toggleCollapse = output<void>();
  readonly noteMovedToFolder = output<{ noteId: string; folderId: string }>();

  // Internal mutable signal: component calls selectFolder() to write the
  // current selection; sync from selectedFolderId input via effect.
  private readonly _selectedFolderId = signal<string | null>(null);

  readonly isCollapsed = this.collapsed;

  private readonly _fullTree = signal<FolderTreeNode[]>([]);
  readonly loading = signal(false);
  readonly selectedId = this._selectedFolderId;
  readonly colors = FOLDER_COLORS;
  readonly folderColors = this.prefs.folderColors;

  /** Default parent for new folders: the selected notebook, or null. */
  readonly defaultParentId = this.notebookId;

  constructor() {
    // Sync selectedFolderId input -> internal mutable signal.
    effect(() => this._selectedFolderId.set(this.selectedFolderId()));
  }

  /** Currently dragged folder node (null when not dragging). */
  readonly draggedNode = signal<FolderTreeNode | null>(null);
  /** Folder ID currently hovered as a drop target. */
  readonly dropTargetId = signal<string | null>(null);

  /** Filtered tree: only children of the selected notebook. Empty if none selected. */
  readonly tree = computed(() => {
    const nbId = this.notebookId();
    if (!nbId) return [];
    const notebook = this._fullTree().find(n => n.folder.id === nbId);
    return notebook ? notebook.children : [];
  });

  ngOnInit(): void {
    this.loadTree();
  }

  async loadTree(): Promise<void> {
    const engId = this.engagementId();
    if (!engId) return;

    // Capture in-memory expanded state first, then merge with localStorage
    const memoryIds = this.collectExpandedIds(this._fullTree());
    const storedIds = this.loadExpandedIds(engId);
    const expandedIds = new Set([...memoryIds, ...storedIds]);

    this.loading.set(true);
    try {
      const nodes = await this.hierarchy.getFolderTree(engId);
      if (expandedIds.size > 0) {
        this.restoreExpanded(nodes, expandedIds);
      }
      this._fullTree.set(nodes);

      // Auto-select first folder if none selected
      const visible = this.tree();
      if (!this._selectedFolderId() && visible.length > 0) {
        this.selectFolder(visible[0].folder.id);
      }
    } catch (err) {
      console.error('[NoteFolderTree] Failed to load folders:', err);
    } finally {
      this.loading.set(false);
    }
  }

  private collectExpandedIds(nodes: FolderTreeNode[]): Set<string> {
    const ids = new Set<string>();
    const walk = (list: FolderTreeNode[]) => {
      for (const n of list) {
        if (n.expanded) ids.add(n.folder.id);
        walk(n.children);
      }
    };
    walk(nodes);
    return ids;
  }

  private restoreExpanded(nodes: FolderTreeNode[], expandedIds: Set<string>): void {
    for (const n of nodes) {
      n.expanded = expandedIds.has(n.folder.id);
      this.restoreExpanded(n.children, expandedIds);
    }
  }

  selectFolder(folderId: string | null): void {
    this._selectedFolderId.set(folderId);
    this.folderSelected.emit(folderId);
  }

  toggleExpand(node: FolderTreeNode, event: Event): void {
    event.stopPropagation();
    node.expanded = !node.expanded;
    // Persist expanded state to localStorage
    this.saveExpandedIds(this.engagementId());
    // Trigger change detection by replacing the tree reference
    this._fullTree.set([...this._fullTree()]);
  }

  // ── Drag-and-drop ──

  onDragStart(event: DragEvent, node: FolderTreeNode): void {
    this.draggedNode.set(node);
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', node.folder.id);
    // Slight delay so the row renders before the drag image is captured
    setTimeout(() => this.dropTargetId.set(null), 0);
  }

  onDragOver(event: DragEvent, targetNode: FolderTreeNode): void {
    const dragged = this.draggedNode();

    // Note drag (from notes list) — accept on any folder
    if (!dragged && event.dataTransfer?.types.includes('application/x-sme-note')) {
      event.preventDefault();
      event.dataTransfer!.dropEffect = 'move';
      this.dropTargetId.set(targetNode.folder.id);
      return;
    }

    if (!dragged) return;

    // Can't drop on self
    if (dragged.folder.id === targetNode.folder.id) return;

    // Can't drop on own descendant (cycle)
    if (this.hierarchy.isDescendant(this._fullTree(), dragged.folder.id, targetNode.folder.id)) return;

    // Can't drop on current parent (no-op)
    if (dragged.folder.parent_id === targetNode.folder.id) return;

    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dropTargetId.set(targetNode.folder.id);
  }

  onDragLeave(event: DragEvent): void {
    // Only clear if leaving to an element outside this row
    const related = event.relatedTarget as HTMLElement | null;
    const target = event.currentTarget as HTMLElement;
    if (related && target.contains(related)) return;
    this.dropTargetId.set(null);
  }

  async onDrop(event: DragEvent, targetNode: FolderTreeNode): Promise<void> {
    event.preventDefault();
    this.dropTargetId.set(null);

    // Note drop (from notes list)
    const noteId = event.dataTransfer?.getData('application/x-sme-note');
    if (noteId && !this.draggedNode()) {
      this.noteMovedToFolder.emit({ noteId, folderId: targetNode.folder.id });
      return;
    }

    // Folder drop
    const dragged = this.draggedNode();
    this.draggedNode.set(null);

    if (!dragged || dragged.folder.id === targetNode.folder.id) return;

    // Final safety check: no cycles
    if (this.hierarchy.isDescendant(this._fullTree(), dragged.folder.id, targetNode.folder.id)) return;

    try {
      await this.hierarchy.moveFolder(dragged.folder.id, targetNode.folder.id);
      this.snackBar.open(`Moved "${dragged.folder.name}" into "${targetNode.folder.name}"`, 'OK', { duration: 3000 });
      this.loadTree();
      this.treeChanged.emit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.snackBar.open(`Failed to move folder: ${msg}`, 'Dismiss', { duration: 5000 });
    }
  }

  onDragEnd(): void {
    this.draggedNode.set(null);
    this.dropTargetId.set(null);
  }

  // ── Cross-notebook move (context menu) ──

  openMoveToNotebook(node: FolderTreeNode, event: Event): void {
    event.stopPropagation();
    const engId = this.engagementId();
    const dialogRef = this.dialog.open(MoveItemDialog, {
      data: {
        engagementId: engId,
        itemType: 'folder',
        currentFolderId: node.folder.parent_id,
        currentNotebookId: this.notebookId(),
        itemName: node.folder.name,
      } as MoveItemDialogData,
      width: '420px',
    });

    dialogRef.afterClosed().subscribe(async (result?: MoveItemDialogResult) => {
      if (!result) return;
      try {
        if (result.recreateStructure && result.targetFolderId) {
          // Recreate subfolder structure then move notes into new folders
          const idMap = await this.hierarchy.recreateFolderStructure(
            engId, node.folder.id, result.targetFolderId,
          );
          // Move notes from each old folder to corresponding new folder
          for (const [oldId, newId] of idMap) {
            await this.hierarchy.moveAllNotes(oldId, newId, engId);
          }
          this.snackBar.open(`Recreated "${node.folder.name}" structure and moved notes`, 'OK', { duration: 4000 });
        } else if (result.targetFolderId) {
          // Simple move — reparent folder under target
          await this.hierarchy.moveFolder(node.folder.id, result.targetFolderId);
          this.snackBar.open(`Moved "${node.folder.name}" to new location`, 'OK', { duration: 3000 });
        }
        this.loadTree();
        this.treeChanged.emit();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.snackBar.open(`Failed to move folder: ${msg}`, 'Dismiss', { duration: 5000 });
      }
    });
  }

  openCreateDialog(parentId?: string | null): void {
    // Default to selected folder, then notebook, then null (top level)
    const resolvedParent = parentId ?? this._selectedFolderId() ?? this.notebookId() ?? null;
    const dialogRef = this.dialog.open(FolderDialog, {
      data: {
        engagementId: this.engagementId(),
        parentId: resolvedParent,
        folderTree: this._fullTree(),
      } as FolderDialogData,
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Optimistic insert: new folder shows immediately without waiting for
        // Pipeline -> GQL indexing (typical lag ~1-3s). Background-reload at 3s
        // reconciles against the authoritative tree.
        this.insertFolderOptimistically(result);
        this.treeChanged.emit();
        setTimeout(() => this.loadTree(), 3000);
      }
    });
  }

  openRenameDialog(node: FolderTreeNode, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(FolderDialog, {
      data: {
        engagementId: this.engagementId(),
        existingFolder: node.folder,
      } as FolderDialogData,
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateFolderOptimistically(node.folder.id, result);
        this.treeChanged.emit();
        setTimeout(() => this.loadTree(), 3000);
      }
    });
  }

  // ── Optimistic tree mutations ──

  /** Insert a newly created folder into the in-memory tree without re-querying
   *  GQL. Public so parent components (notes-panel) can also push a freshly
   *  created folder — e.g. the auto-"General" folder from ensureDefaultFolder.
   */
  insertFolderOptimistically(folder: { id: string; name: string; parent_id?: string | null; description?: string | null; color?: string | null; access_level?: string; sort_order?: number }): void {
    const newNode: FolderTreeNode = {
      folder: {
        ...folder,
        parent_id: folder.parent_id ?? null,
        color: folder.color ?? null,
        access_level: folder.access_level ?? 'boundary',
        sort_order: folder.sort_order ?? 0,
        note_count: 0,
        subfolder_count: 0,
      } as FolderTreeNode['folder'],
      children: [],
      level: 0,
      expanded: false,
    };

    const currentTree = this._fullTree();
    const parentId = folder.parent_id;

    if (!parentId) {
      // Root-level: add to the top of _fullTree.
      this._fullTree.set([...currentTree, newNode]);
    } else {
      // Nested: walk the tree and insert under the matching parent.
      const updatedTree = this.insertIntoTree(currentTree, parentId, newNode);
      this._fullTree.set(updatedTree);
    }
  }

  /** Update an existing folder's properties in the tree without re-querying. */
  private updateFolderOptimistically(folderId: string, updated: { name?: string; description?: string; color?: string | null }): void {
    const patchNode = (nodes: FolderTreeNode[]): FolderTreeNode[] =>
      nodes.map(n => {
        if (n.folder.id === folderId) {
          return { ...n, folder: { ...n.folder, ...updated } };
        }
        return { ...n, children: patchNode(n.children) };
      });
    this._fullTree.set(patchNode(this._fullTree()));
  }

  private insertIntoTree(nodes: FolderTreeNode[], parentId: string, newNode: FolderTreeNode): FolderTreeNode[] {
    return nodes.map(n => {
      if (n.folder.id === parentId) {
        newNode.level = n.level + 1;
        return {
          ...n,
          folder: { ...n.folder, subfolder_count: (n.folder.subfolder_count ?? 0) + 1 },
          children: [...n.children, newNode],
          expanded: true,
        };
      }
      return { ...n, children: this.insertIntoTree(n.children, parentId, newNode) };
    });
  }

  /** Resolve color: local preference overrides DB color. */
  resolveColor(node: FolderTreeNode): string | null {
    return this.folderColors()[node.folder.id] ?? node.folder.color ?? null;
  }

  onColorChange(node: FolderTreeNode, color: string | null): void {
    // Update local prefs for immediate UI feedback
    if (color) {
      this.prefs.setFolderColor(node.folder.id, color);
    } else {
      this.prefs.removeFolderColor(node.folder.id);
    }
    // Persist to DB via pipeline
    this.hierarchy.updateFolder(node.folder.id, { color });
  }

  async onDeleteFolder(node: FolderTreeNode, event: Event): Promise<void> {
    event.stopPropagation();

    // Can't delete the last folder in a notebook
    if (this.tree().length <= 1) {
      this.snackBar.open('Cannot delete — at least one folder is required per notebook.', 'OK', { duration: 5000 });
      return;
    }

    const count = node.folder.note_count + node.folder.subfolder_count;
    if (count > 0) {
      this.snackBar.open(
        `Cannot delete — folder contains ${node.folder.note_count} note(s) and ${node.folder.subfolder_count} subfolder(s). Move them first.`,
        'OK', { duration: 5000 },
      );
      return;
    }

    try {
      await this.hierarchy.deleteFolder(node.folder.id);
      this.snackBar.open('Folder deleted', 'OK', { duration: 3000 });
      if (this._selectedFolderId() === node.folder.id) {
        this.selectFolder(null);
      }
      // Optimistically remove from local tree (pipeline soft-delete is async,
      // GQL won't reflect the deletion immediately)
      this._fullTree.update(nodes => this.removeNodeById(nodes, node.folder.id));
      this.treeChanged.emit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.snackBar.open(`Failed to delete: ${msg}`, 'Dismiss', { duration: 5000 });
    }
  }

  /** Recursively remove a node by ID from the tree (immutable). */
  private removeNodeById(nodes: FolderTreeNode[], id: string): FolderTreeNode[] {
    return nodes
      .filter(n => n.folder.id !== id)
      .map(n => ({
        ...n,
        children: this.removeNodeById(n.children, id),
      }));
  }

  // ── localStorage persistence for expanded state ──

  private storageKey(engId: string): string {
    return `sme-mart.folder-expanded.${engId}`;
  }

  private saveExpandedIds(engId: string): void {
    if (!engId) return;
    const ids = this.collectExpandedIds(this._fullTree());
    try {
      localStorage.setItem(this.storageKey(engId), JSON.stringify([...ids]));
    } catch { /* quota exceeded — silently ignore */ }
  }

  private loadExpandedIds(engId: string): Set<string> {
    if (!engId) return new Set();
    try {
      const raw = localStorage.getItem(this.storageKey(engId));
      if (raw) return new Set(JSON.parse(raw));
    } catch { /* corrupt data — ignore */ }
    return new Set();
  }
}
