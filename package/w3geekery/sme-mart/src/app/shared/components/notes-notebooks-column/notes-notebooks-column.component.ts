import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, signal, inject, OnInit, computed,
} from '@angular/core';
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
  selector: 'app-notes-notebooks-column',
  standalone: true,
  imports: [
    MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule,
    MatDialogModule, MatSnackBarModule,
  ],
  templateUrl: './notes-notebooks-column.component.html',
  styleUrl: './notes-notebooks-column.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesNotebooksColumn implements OnInit {
  private readonly hierarchy = inject(NoteHierarchyService);
  private readonly prefs = inject(UserPreferencesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly _engagementId = signal('');
  private readonly _selectedFolderId = signal<string | null>(null);

  @Input({ required: true })
  set engagementId(value: string) { this._engagementId.set(value); }

  @Input()
  set selectedFolderId(value: string | null) { this._selectedFolderId.set(value); }

  private readonly _collapsed = signal(false);

  @Input()
  set collapsed(value: boolean) { this._collapsed.set(value); }

  @Output() folderSelected = new EventEmitter<string | null>();
  @Output() treeChanged = new EventEmitter<void>();
  @Output() toggleCollapse = new EventEmitter<void>();
  /** Emitted when a note is dropped onto a notebook. Parent handles the move. */
  @Output() noteDroppedOnNotebook = new EventEmitter<{ noteId: string; notebookId: string }>();
  /** Emitted when a folder is dropped onto a notebook. Parent handles the dialog. */
  @Output() folderDroppedOnNotebook = new EventEmitter<{ folderId: string; notebookId: string }>();

  readonly isCollapsed = this._collapsed;

  readonly tree = signal<FolderTreeNode[]>([]);
  readonly loading = signal(false);
  readonly selectedId = this._selectedFolderId;
  readonly colors = FOLDER_COLORS;
  readonly folderColors = this.prefs.folderColors;
  readonly dropTargetId = signal<string | null>(null);
  /** True when something is being dragged over this column. */
  readonly isDragging = signal(false);

  readonly topLevelFolders = computed(() => this.tree());

  ngOnInit(): void {
    this.loadTree();
  }

  async loadTree(): Promise<void> {
    const engId = this._engagementId();
    if (!engId) return;

    this.loading.set(true);
    try {
      const nodes = await this.hierarchy.getFolderTree(engId);
      this.tree.set(nodes);

      // Auto-select first notebook if none selected
      if (!this._selectedFolderId() && nodes.length > 0) {
        this.selectFolder(nodes[0].folder.id);
      }
    } catch (err: any) {
      console.error('[NotesNotebooksColumn] Failed to load folders:', err);
    } finally {
      this.loading.set(false);
    }
  }

  selectFolder(folderId: string | null): void {
    this._selectedFolderId.set(folderId);
    this.folderSelected.emit(folderId);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(FolderDialog, {
      data: {
        engagementId: this._engagementId(),
        parentId: null,
        folderTree: this.tree(),
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

  openEditDialog(node: FolderTreeNode, event: Event): void {
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

  async onDeleteFolder(node: FolderTreeNode, event: Event): Promise<void> {
    event.stopPropagation();

    // Can't delete the last notebook
    if (this.tree().length <= 1) {
      this.snackBar.open('Cannot delete — at least one notebook is required.', 'OK', { duration: 5000 });
      return;
    }

    const count = node.folder.note_count + node.folder.subfolder_count;
    if (count > 0) {
      this.snackBar.open(
        `Cannot delete — contains ${node.folder.note_count} note(s) and ${node.folder.subfolder_count} subfolder(s).`,
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

  onColorChange(node: FolderTreeNode, color: string | null): void {
    if (color) {
      this.prefs.setFolderColor(node.folder.id, color);
    } else {
      this.prefs.removeFolderColor(node.folder.id);
    }
  }

  // ── Drop targets for cross-notebook DnD ──

  onDragOver(event: DragEvent, node: FolderTreeNode): void {
    const types = event.dataTransfer?.types || [];
    // Accept folder drags (text/plain) or note drags (application/x-sme-note)
    const hasFolder = types.includes('text/plain');
    const hasNote = types.includes('application/x-sme-note');
    if (!hasFolder && !hasNote) return;

    // Don't accept drops on the currently selected notebook (same-notebook)
    if (node.folder.id === this._selectedFolderId()) return;

    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    this.dropTargetId.set(node.folder.id);
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    const related = event.relatedTarget as HTMLElement | null;
    const target = event.currentTarget as HTMLElement;
    if (related && target.contains(related)) return;
    this.dropTargetId.set(null);
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent, node: FolderTreeNode): void {
    event.preventDefault();
    this.dropTargetId.set(null);
    this.isDragging.set(false);

    // Note drop
    const noteId = event.dataTransfer?.getData('application/x-sme-note');
    if (noteId) {
      this.noteDroppedOnNotebook.emit({ noteId, notebookId: node.folder.id });
      return;
    }

    // Folder drop
    const folderId = event.dataTransfer?.getData('text/plain');
    if (folderId) {
      this.folderDroppedOnNotebook.emit({ folderId, notebookId: node.folder.id });
    }
  }

  accessLabel(level: string): string {
    switch (level) {
      case 'personal': return 'Personal';
      case 'project': return 'Project';
      default: return 'Boundary';
    }
  }
}
