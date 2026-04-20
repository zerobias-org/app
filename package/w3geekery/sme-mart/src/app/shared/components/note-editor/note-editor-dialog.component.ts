import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MarkdownEditor } from '../markdown-editor/markdown-editor.component';
import { NotesService } from '../../../core/services/notes.service';
import type { NoteWithTags, NoteAccessLevel } from '../../../core/models';

export interface NoteEditorDialogData {
  engagementId: string;
  existingNote?: NoteWithTags;
  defaultFolderId?: string | null;
}

@Component({
  selector: 'app-note-editor-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatCheckboxModule,
    MatSnackBarModule,
    MarkdownEditor,
  ],
  templateUrl: './note-editor-dialog.component.html',
  styleUrl: './note-editor-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteEditorDialog {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<NoteEditorDialog>);
  private readonly data = inject<NoteEditorDialogData>(MAT_DIALOG_DATA);
  private readonly notesService = inject(NotesService);
  private readonly snackBar = inject(MatSnackBar);

  readonly submitting = signal(false);
  readonly isEdit = !!this.data.existingNote;

  readonly form = this.fb.group({
    title: [this.data.existingNote?.title || '', Validators.required],
    body: [this.data.existingNote?.body || ''],
    access_level: [(this.data.existingNote?.access_level || 'boundary') as NoteAccessLevel],
    is_meeting_minutes: [this.data.existingNote?.is_meeting_minutes || false],
  });

  readonly accessLevelOptions: { label: string; value: NoteAccessLevel }[] = [
    { label: 'Boundary (all users)', value: 'boundary' },
    { label: 'Personal (only me)', value: 'personal' },
    { label: 'Project', value: 'project' },
  ];

  async onSubmit(): Promise<void> {
    if (this.submitting() || this.form.invalid) return;
    this.submitting.set(true);

    try {
      const v = this.form.getRawValue();

      if (this.isEdit) {
        const updated = await this.notesService.updateNote(this.data.existingNote!.id, {
          title: v.title!,
          body: v.body || '',
          access_level: v.access_level!,
          is_meeting_minutes: v.is_meeting_minutes!,
          folder_id: this.data.existingNote?.folder_id ?? null,
        });
        // Return as NoteWithTags (tags unchanged on edit)
        const result: NoteWithTags = {
          ...this.data.existingNote!,
          ...updated,
          tags: this.data.existingNote!.tags,
          tag_count: this.data.existingNote!.tag_count,
        };
        this.snackBar.open('Note updated', 'OK', { duration: 3000 });
        this.dialogRef.close(result);
      } else {
        const created = await this.notesService.createNote(this.data.engagementId, {
          title: v.title!,
          body: v.body || '',
          access_level: v.access_level!,
          is_meeting_minutes: v.is_meeting_minutes!,
          folder_id: this.data.defaultFolderId ?? null,
        });
        const result: NoteWithTags = { ...created, tags: null, tag_count: 0, folder_color: null, folder_name: null };
        this.snackBar.open('Note created', 'OK', { duration: 3000 });
        this.dialogRef.close(result);
      }
    } catch (err: any) {
      this.snackBar.open(`Failed to save: ${err.message}`, 'Dismiss', { duration: 5000 });
      this.submitting.set(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
