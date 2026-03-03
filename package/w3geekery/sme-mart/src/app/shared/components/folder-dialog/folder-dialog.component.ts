import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoteHierarchyService, type FolderTreeNode } from '../../../core/services/note-hierarchy.service';
import type { NoteFolder } from '../../../core/models';

export const FOLDER_COLORS = [
  { value: '#ef5350', label: 'Red' },
  { value: '#ff7043', label: 'Orange' },
  { value: '#ffca28', label: 'Yellow' },
  { value: '#66bb6a', label: 'Green' },
  { value: '#26c6da', label: 'Cyan' },
  { value: '#42a5f5', label: 'Blue' },
  { value: '#7e57c2', label: 'Purple' },
  { value: '#ec407a', label: 'Pink' },
  { value: '#8d6e63', label: 'Brown' },
  { value: '#78909c', label: 'Gray' },
] as const;

export interface FolderDialogData {
  engagementId: string;
  parentId?: string | null;
  existingFolder?: NoteFolder;
  /** Full folder tree for the parent selector. Only needed for create mode. */
  folderTree?: FolderTreeNode[];
}

/** Flattened option for the parent select dropdown. */
interface ParentOption {
  id: string | null;
  label: string;
  level: number;
}

@Component({
  selector: 'app-folder-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatSnackBarModule, MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Folder' : 'New Folder' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        @if (!isEdit && parentOptions.length > 0) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Create under</mat-label>
            <mat-select formControlName="parentId">
              @for (opt of parentOptions; track opt.id) {
                <mat-option [value]="opt.id">
                  <span [style.padding-left.px]="opt.level * 16">{{ opt.label }}</span>
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Folder Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Meeting Minutes" cdkFocusInitial>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description (optional)</mat-label>
          <input matInput formControlName="description">
        </mat-form-field>

        <div class="color-section">
          <label class="color-label">Color</label>
          <div class="color-swatches">
            <button type="button" class="swatch swatch-none"
                    [class.active]="!selectedColor()"
                    [matTooltip]="'None'"
                    (click)="selectColor(null)">
              @if (!selectedColor()) {
                <span class="check">✓</span>
              }
            </button>
            @for (c of colors; track c.value) {
              <button type="button" class="swatch"
                      [style.background]="c.value"
                      [class.active]="selectedColor() === c.value"
                      [matTooltip]="c.label"
                      (click)="selectColor(c.value)">
                @if (selectedColor() === c.value) {
                  <span class="check">✓</span>
                }
              </button>
            }
          </div>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="submitting()">Cancel</button>
      <button mat-flat-button color="primary"
        [disabled]="form.invalid || submitting()"
        (click)="onSubmit()">
        @if (submitting()) { Saving… } @else { {{ isEdit ? 'Save' : 'Create' }} }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .color-section { margin-bottom: 1rem; }
    .color-label {
      display: block;
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
      margin-bottom: 0.5rem;
    }
    .color-swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .swatch {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: transform 0.15s ease, border-color 0.15s ease;
    }
    .swatch:hover { transform: scale(1.15); }
    .swatch.active { border-color: var(--mat-sys-on-surface); }
    .swatch-none {
      background: var(--mat-sys-surface-variant);
      border-style: dashed;
    }
    .check {
      font-size: 14px;
      color: #fff;
      text-shadow: 0 1px 2px rgba(0,0,0,0.4);
    }
    .swatch-none .check { color: var(--mat-sys-on-surface-variant); text-shadow: none; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FolderDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<FolderDialog>);
  private readonly data = inject<FolderDialogData>(MAT_DIALOG_DATA);
  private readonly hierarchy = inject(NoteHierarchyService);
  private readonly snackBar = inject(MatSnackBar);

  readonly submitting = signal(false);
  readonly isEdit = !!this.data.existingFolder;
  readonly selectedColor = signal<string | null>(this.data.existingFolder?.color ?? null);
  readonly colors = FOLDER_COLORS;

  /** Flattened folder options for the parent selector. */
  readonly parentOptions: ParentOption[] = this.buildParentOptions();

  readonly form = this.fb.group({
    name: [this.data.existingFolder?.name || '', Validators.required],
    description: [this.data.existingFolder?.description || ''],
    parentId: [this.data.parentId ?? null as string | null],
  });

  selectColor(color: string | null): void {
    this.selectedColor.set(color);
  }

  async onSubmit(): Promise<void> {
    if (this.submitting() || this.form.invalid) return;
    this.submitting.set(true);

    try {
      const v = this.form.getRawValue();
      const color = this.selectedColor();
      if (this.isEdit) {
        const updated = await this.hierarchy.updateFolder(this.data.existingFolder!.id, {
          name: v.name!,
          description: v.description || undefined,
          color,
        });
        this.snackBar.open('Folder updated', 'OK', { duration: 3000 });
        this.dialogRef.close(updated);
      } else {
        const created = await this.hierarchy.createFolder(
          this.data.engagementId,
          v.name!,
          v.parentId ?? null,
          v.description || undefined,
          color,
        );
        this.snackBar.open('Folder created', 'OK', { duration: 3000 });
        this.dialogRef.close(created);
      }
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
      this.submitting.set(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  /** Flatten the folder tree into indented select options. */
  private buildParentOptions(): ParentOption[] {
    const tree = this.data.folderTree;
    if (!tree || tree.length === 0) return [];

    const options: ParentOption[] = [
      { id: null, label: '(Top level)', level: 0 },
    ];
    const flatten = (nodes: FolderTreeNode[], depth: number): void => {
      for (const node of nodes) {
        const indent = '─'.repeat(depth);
        options.push({
          id: node.folder.id,
          label: depth > 0 ? `${indent} ${node.folder.name}` : node.folder.name,
          level: depth,
        });
        if (node.children.length > 0) {
          flatten(node.children, depth + 1);
        }
      }
    };
    flatten(tree, 0);
    return options;
  }
}
