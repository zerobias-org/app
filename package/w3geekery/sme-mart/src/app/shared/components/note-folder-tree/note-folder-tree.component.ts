import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, signal, computed, inject, OnInit,
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

  private readonly _engagementId = signal('');
  private readonly _notebookId = signal<string | null>(null);
  private readonly _selectedFolderId = signal<string | null>(null);

  @Input({ required: true })
  set engagementId(value: string) { this._engagementId.set(value); }

  /** When set, only show folders belonging to this notebook (top-level folder). */
  @Input()
  set notebookId(value: string | null) { this._notebookId.set(value); }

  @Input()
  set selectedFolderId(value: string | null) { this._selectedFolderId.set(value); }

  private readonly _collapsed = signal(false);

  @Input()
  set collapsed(value: boolean) { this._collapsed.set(value); }

  @Output() folderSelected = new EventEmitter<string | null>();
  @Output() treeChanged = new EventEmitter<void>();
  @Output() toggleCollapse = new EventEmitter<void>();
  @Output() noteMovedToFolder = new EventEmitter<{ noteId: string; folderId: string }>();

  readonly isCollapsed = this._collapsed;

  private readonly _fullTree = signal<FolderTreeNode[]>([]);
  readonly loading = signal(false);
  readonly selectedId = this._selectedFolderId;
  readonly colors = FOLDER_COLORS;
  readonly folderColors = this.prefs.folderColors;

  /** Default parent for new folders: the selected notebook, or null. */
  readonly defaultParentId = this._notebookId;

  /** Currently dragged folder node (null when not dragging). */
  readonly draggedNode = signal<FolderTreeNode | null>(null);
  /** Folder ID currently hovered as a drop target. */
  readonly dropTargetId = signal<string | null>(null);

  /** Filtered tree: only children of the selected notebook. Empty if none selected. */
  readonly tree = computed(() => {
    const nbId = this._notebookId();
    if (!nbId) return [];
    const notebook = this._fullTree().find(n => n.folder.id === nbId);
    return notebook ? notebook.children : [];
  });

  ngOnInit(): void {
    this.loadTree();
  }

  async loadTree(): Promise<void> {
    const engId = this._engagementId();
    if (!engId) return;

    // Capture expanded state before reload
    const expandedIds = this.collectExpandedIds(this._fullTree());

    this.loading.set(true);
    try {
      const nodes = await this.hierarchy.getFolderTree(engId);
      // Restore expanded state from before reload
      if (expandedIds.size > 0) {
        this.restoreExpanded(nodes, expandedIds);
      }
      this._fullTree.set(nodes);

      // Auto-select first folder if none selected
      const visible = this.tree();
      if (!this._selectedFolderId() && visible.length > 0) {
        this.selectFolder(visible[0].folder.id);
      }
    } catch (err: any) {
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
    } catch (err: any) {
      this.snackBar.open(`Failed to move folder: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  onDragEnd(): void {
    this.draggedNode.set(null);
    this.dropTargetId.set(null);
  }

  // ── Cross-notebook move (context menu) ──

  openMoveToNotebook(node: FolderTreeNode, event: Event): void {
    event.stopPropagation();
    const engId = this._engagementId();
    const dialogRef = this.dialog.open(MoveItemDialog, {
      data: {
        engagementId: engId,
        itemType: 'folder',
        currentFolderId: node.folder.parent_id,
        currentNotebookId: this._notebookId(),
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
      } catch (err: any) {
        this.snackBar.open(`Failed to move folder: ${err.message}`, 'Dismiss', { duration: 5000 });
      }
    });
  }

  openCreateDialog(parentId?: string | null): void {
    // Default to selected folder, then notebook, then null (top level)
    const resolvedParent = parentId ?? this._selectedFolderId() ?? this._notebookId() ?? null;
    const dialogRef = this.dialog.open(FolderDialog, {
      data: {
        engagementId: this._engagementId(),
        parentId: resolvedParent,
        folderTree: this._fullTree(),
      } as FolderDialogData,
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTree();
        this.treeChanged.emit();
      }
    });
  }

  openRenameDialog(node: FolderTreeNode, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(FolderDialog, {
      data: {
        engagementId: this._engagementId(),
        existingFolder: node.folder,
      } as FolderDialogData,
      width: '400px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTree();
        this.treeChanged.emit();
      }
    });
  }

  onColorChange(node: FolderTreeNode, color: string | null): void {
    if (color) {
      this.prefs.setFolderColor(node.folder.id, color);
    } else {
      this.prefs.removeFolderColor(node.folder.id);
    }
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
      this.loadTree();
      this.treeChanged.emit();
    } catch (err: any) {
      this.snackBar.open(`Failed to delete: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }
}
