import {
  Component, inject, signal, computed, ChangeDetectionStrategy,
  OnInit, ViewChild, ElementRef, AfterViewChecked,
} from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NoteHierarchyService, type FolderTreeNode } from '../../../core/services/note-hierarchy.service';

export interface MoveItemDialogData {
  engagementId: string;
  /** 'note' or 'folder' — controls title, behavior, and "same structure" option. */
  itemType: 'note' | 'folder';
  /** Current folder/parent of the item being moved. Disabled in the list. */
  currentFolderId: string | null;
  /** Current notebook (top-level folder) the item lives in. */
  currentNotebookId: string | null;
  /** Name of the item being moved (for display). */
  itemName?: string;
}

export interface MoveItemDialogResult {
  /** Target folder to move into. */
  targetFolderId: string | null;
  /** Target notebook (if moving cross-notebook). */
  targetNotebookId: string | null;
  /** If true, recreate the source folder structure under the target. */
  recreateStructure: boolean;
}

@Component({
  selector: 'app-move-item-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, MatIconModule, MatInputModule,
    MatListModule, MatSelectModule, MatFormFieldModule,
    MatCheckboxModule, MatProgressSpinnerModule, MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './move-note-dialog.component.html',
  styleUrl: './move-note-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoveItemDialog implements OnInit, AfterViewChecked {
  private readonly dialogRef = inject(MatDialogRef<MoveItemDialog>);
  readonly data = inject<MoveItemDialogData>(MAT_DIALOG_DATA);
  private readonly hierarchy = inject(NoteHierarchyService);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild('folderInput') folderInputRef?: ElementRef<HTMLInputElement>;

  readonly loading = signal(true);
  private readonly fullTree = signal<FolderTreeNode[]>([]);
  readonly selectedNotebookId = signal<string | null>(null);
  readonly selectedFolderId = signal<string | null>(null);
  readonly recreateStructure = signal(false);

  // ── Inline folder creation state ──
  /** Parent folder ID in which we're creating (null = not creating). */
  readonly creatingInParentId = signal<string | null>(null);
  readonly newFolderName = signal('');
  readonly creatingFolder = signal(false);
  private pendingFocus = false;

  // ── Computed ──

  /** Top-level folders (notebooks). */
  readonly notebooks = computed(() =>
    this.fullTree().filter(n => n.folder.parent_id === null),
  );

  /** Whether the user is moving to a different notebook. */
  readonly isCrossNotebook = computed(() =>
    this.selectedNotebookId() !== this.data.currentNotebookId,
  );

  /** Flattened folders under the selected notebook. */
  readonly visibleFolders = computed(() => {
    const nbId = this.selectedNotebookId();
    if (!nbId) return [];
    const notebook = this.fullTree().find(n => n.folder.id === nbId);
    if (!notebook) return [];
    return this.flatten(notebook.children);
  });

  /** Dialog title based on item type. */
  readonly title = computed(() => {
    const name = this.data.itemName ? ` "${this.data.itemName}"` : '';
    return this.data.itemType === 'folder'
      ? `Move Folder${name}`
      : `Move Note${name}`;
  });

  /** Breadcrumb: Notebook › Folder › Subfolder */
  readonly breadcrumbPath = computed(() => {
    const nbId = this.selectedNotebookId();
    if (!nbId) return '';
    const notebook = this.notebooks().find(n => n.folder.id === nbId);
    if (!notebook) return '';

    const folderId = this.selectedFolderId();
    if (!folderId) return notebook.folder.name;

    const segments = this.buildPathSegments(notebook.children, folderId);
    return [notebook.folder.name, ...segments].join(' › ');
  });

  // ── Lifecycle ──

  async ngOnInit(): Promise<void> {
    try {
      const tree = await this.hierarchy.getFolderTree(this.data.engagementId);
      this.fullTree.set(tree);

      const currentNb = this.data.currentNotebookId;
      const notebooks = tree.filter(n => n.folder.parent_id === null);
      this.selectedNotebookId.set(
        currentNb && notebooks.some(n => n.folder.id === currentNb)
          ? currentNb
          : notebooks[0]?.folder.id ?? null,
      );
    } finally {
      this.loading.set(false);
    }
  }

  ngAfterViewChecked(): void {
    if (this.pendingFocus && this.folderInputRef) {
      this.folderInputRef.nativeElement.focus();
      this.pendingFocus = false;
    }
  }

  // ── Notebook / folder selection ──

  onNotebookChange(notebookId: string): void {
    this.selectedNotebookId.set(notebookId);
    this.selectedFolderId.set(null);
    this.cancelCreate();
  }

  onFolderSelect(event: any): void {
    const selected = event.options?.[0]?.value ?? null;
    this.selectedFolderId.set(selected);
  }

  // ── Inline folder creation ──

  startCreate(): void {
    // Create inside the currently selected folder, or directly under the notebook
    const parentId = this.selectedFolderId() ?? this.selectedNotebookId();
    this.creatingInParentId.set(parentId);
    this.newFolderName.set('');
    this.pendingFocus = true;
  }

  cancelCreate(): void {
    this.creatingInParentId.set(null);
    this.newFolderName.set('');
    this.creatingFolder.set(false);
  }

  async confirmCreate(): Promise<void> {
    const name = this.newFolderName().trim();
    const parentId = this.creatingInParentId();
    if (!name || this.creatingFolder()) return;

    // Validate: no duplicate name in same parent
    const siblings = this.visibleFolders().filter(f => f.folder.parent_id === parentId);
    if (siblings.some(f => f.folder.name.toLowerCase() === name.toLowerCase())) {
      this.snackBar.open('A folder with this name already exists here', 'OK', { duration: 3000 });
      return;
    }

    this.creatingFolder.set(true);
    try {
      const created = await this.hierarchy.createFolder(
        this.data.engagementId, name, parentId,
      );

      // Refresh tree so the new folder appears
      const tree = await this.hierarchy.getFolderTree(this.data.engagementId);
      this.fullTree.set(tree);

      // Auto-select the new folder
      this.selectedFolderId.set(created.id);
      this.cancelCreate();
    } catch (err: any) {
      this.snackBar.open(`Failed to create folder: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.creatingFolder.set(false);
    }
  }

  // ── Dialog actions ──

  onConfirm(): void {
    const result: MoveItemDialogResult = {
      targetFolderId: this.selectedFolderId(),
      targetNotebookId: this.isCrossNotebook() ? this.selectedNotebookId() : null,
      recreateStructure: this.recreateStructure(),
    };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close(undefined);
  }

  // ── Helpers ──

  private flatten(nodes: FolderTreeNode[]): FolderTreeNode[] {
    const result: FolderTreeNode[] = [];
    const walk = (list: FolderTreeNode[]) => {
      for (const n of list) {
        result.push(n);
        if (n.children.length > 0) walk(n.children);
      }
    };
    walk(nodes);
    return result;
  }

  /** Walk the tree to build path segments from root to target folder. */
  private buildPathSegments(nodes: FolderTreeNode[], targetId: string): string[] {
    for (const node of nodes) {
      if (node.folder.id === targetId) return [node.folder.name];
      if (node.children.length > 0) {
        const child = this.buildPathSegments(node.children, targetId);
        if (child.length > 0) return [node.folder.name, ...child];
      }
    }
    return [];
  }
}
