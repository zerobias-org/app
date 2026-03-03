import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatDialogModule, MatButtonModule, MatIconModule,
    MatListModule, MatSelectModule, MatFormFieldModule,
    MatCheckboxModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ title() }}</h2>
    <mat-dialog-content>
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="32"></mat-spinner>
        </div>
      } @else {
        <!-- Notebook selector -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notebook</mat-label>
          <mat-select [value]="selectedNotebookId()"
                      (selectionChange)="onNotebookChange($event.value)">
            @for (nb of notebooks(); track nb.folder.id) {
              <mat-option [value]="nb.folder.id">{{ nb.folder.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Folder tree for selected notebook -->
        @if (visibleFolders().length > 0) {
          <div class="folder-label">Select destination folder:</div>
          <mat-selection-list [multiple]="false" (selectionChange)="onFolderSelect($event)">
            @for (node of visibleFolders(); track node.folder.id) {
              <mat-list-option [value]="node.folder.id"
                               [selected]="selectedFolderId() === node.folder.id"
                               [disabled]="node.folder.id === data.currentFolderId && !isCrossNotebook()">
                <mat-icon matListItemIcon [style.color]="node.folder.color">folder</mat-icon>
                <span matListItemTitle [style.padding-left.px]="(node.level - 1) * 16">
                  {{ node.folder.name }}
                </span>
              </mat-list-option>
            }
          </mat-selection-list>
        } @else {
          <div class="empty-message">No folders in this notebook.</div>
        }

        <!-- "Same folder structure" checkbox — only for folders moving cross-notebook -->
        @if (data.itemType === 'folder' && isCrossNotebook()) {
          <mat-checkbox [checked]="recreateStructure()"
                        (change)="recreateStructure.set($event.checked)"
                        class="structure-checkbox">
            Recreate subfolder structure in destination
          </mat-checkbox>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary" (click)="onConfirm()"
              [disabled]="loading() || (!selectedFolderId() && !recreateStructure())">
        Move
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { min-width: 350px; max-height: 450px; overflow-y: auto; }
    .full-width { width: 100%; }
    .loading-container { text-align: center; padding: 1rem; }
    .folder-label {
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 4px;
    }
    .empty-message {
      text-align: center;
      padding: 1rem;
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.85rem;
    }
    .structure-checkbox {
      display: block;
      margin-top: 12px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoveItemDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<MoveItemDialog>);
  readonly data = inject<MoveItemDialogData>(MAT_DIALOG_DATA);
  private readonly hierarchy = inject(NoteHierarchyService);

  readonly loading = signal(true);
  private readonly fullTree = signal<FolderTreeNode[]>([]);
  readonly selectedNotebookId = signal<string | null>(null);
  readonly selectedFolderId = signal<string | null>(null);
  readonly recreateStructure = signal(false);

  /** Top-level folders (notebooks). */
  readonly notebooks = computed(() =>
    this.fullTree().filter(n => n.folder.parent_id === null)
  );

  /** Whether the user is moving to a different notebook. */
  readonly isCrossNotebook = computed(() =>
    this.selectedNotebookId() !== this.data.currentNotebookId
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

  async ngOnInit(): Promise<void> {
    try {
      const tree = await this.hierarchy.getFolderTree(this.data.engagementId);
      this.fullTree.set(tree);

      // Default to current notebook, or first available
      const currentNb = this.data.currentNotebookId;
      const notebooks = tree.filter(n => n.folder.parent_id === null);
      this.selectedNotebookId.set(
        currentNb && notebooks.some(n => n.folder.id === currentNb)
          ? currentNb
          : notebooks[0]?.folder.id ?? null
      );
    } finally {
      this.loading.set(false);
    }
  }

  onNotebookChange(notebookId: string): void {
    this.selectedNotebookId.set(notebookId);
    this.selectedFolderId.set(null); // Reset folder selection on notebook change
  }

  onFolderSelect(event: any): void {
    const selected = event.options?.[0]?.value ?? null;
    this.selectedFolderId.set(selected);
  }

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
}
