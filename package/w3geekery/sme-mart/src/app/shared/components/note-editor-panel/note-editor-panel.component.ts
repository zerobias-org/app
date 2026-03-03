import {
  Component, Input, Output, EventEmitter, ViewChild, ElementRef,
  ChangeDetectionStrategy, inject, signal, effect, computed,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MarkdownView } from '../markdown-view/markdown-view.component';
import { MarkdownEditor } from '../markdown-editor/markdown-editor.component';
import { NoteTagEditor } from '../note-tag-editor/note-tag-editor.component';
import { NotesService } from '../../../core/services/notes.service';
import type { NoteWithTags, NoteAccessLevel } from '../../../core/models';

@Component({
  selector: 'app-note-editor-panel',
  standalone: true,
  imports: [
    DatePipe, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatMenuModule, MatTooltipModule, MatSnackBarModule,
    MarkdownView, MarkdownEditor, NoteTagEditor,
  ],
  templateUrl: './note-editor-panel.component.html',
  styleUrl: './note-editor-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteEditorPanel {
  private readonly fb = inject(FormBuilder);
  private readonly notesService = inject(NotesService);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild(MarkdownEditor) editor?: MarkdownEditor;
  @ViewChild('titleInput') titleInput?: ElementRef<HTMLInputElement>;
  @ViewChild('accessSelect') accessSelect?: MatSelect;

  /** The note currently loaded. */
  readonly note = signal<NoteWithTags | null>(null);

  @Input({ required: true })
  set noteData(value: NoteWithTags | null) {
    this.note.set(value);
  }

  @Output() noteSaved = new EventEmitter<NoteWithTags>();
  @Output() noteDeleted = new EventEmitter<string>();

  readonly submitting = signal(false);

  /** Whether body is in edit mode (markdown editor) vs view mode (rendered). */
  readonly editing = signal(false);
  /** Whether title is in inline-edit mode. */
  readonly editingTitle = signal(false);
  /** Whether access level dropdown is open. */
  readonly editingAccess = signal(false);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    body: [''],
    access_level: ['boundary' as NoteAccessLevel],
  });

  readonly accessLevelOptions: { label: string; value: NoteAccessLevel; icon: string }[] = [
    { label: 'Boundary', value: 'boundary', icon: 'groups' },
    { label: 'Personal', value: 'personal', icon: 'lock' },
    { label: 'Project', value: 'project', icon: 'business' },
  ];

  readonly currentAccessOption = computed(() => {
    const n = this.note();
    if (!n) return this.accessLevelOptions[0];
    return this.accessLevelOptions.find(o => o.value === n.access_level) ?? this.accessLevelOptions[0];
  });

  /** Track the ID of the last loaded note to detect selection changes. */
  private loadedNoteId: string | null = null;

  constructor() {
    // Reset to view mode and populate form when a different note is selected.
    effect(() => {
      const n = this.note();
      if (!n) {
        this.loadedNoteId = null;
        this.editing.set(false);
        this.editingTitle.set(false);
        this.editingAccess.set(false);
        return;
      }
      if (n.id === this.loadedNoteId) return;
      this.loadedNoteId = n.id;

      const isNew = n.title === 'Untitled' && !n.body;
      this.editing.set(isNew);
      this.editingTitle.set(isNew);
      this.editingAccess.set(false);
      this.resetForm(n);

      // Auto-focus and select the title for new notes
      if (isNew) {
        setTimeout(() => {
          const el = this.titleInput?.nativeElement;
          if (el) { el.focus(); el.select(); }
        }, 0);
      }
    });
  }

  private resetForm(n: NoteWithTags): void {
    this.form.patchValue({
      title: n.title,
      body: n.body,
      access_level: n.access_level,
    }, { emitEvent: false });
    this.form.markAsPristine();
  }

  // ── Mode switches ──

  enterEditMode(): void {
    this.editing.set(true);
  }

  enterTitleEdit(): void {
    this.editingTitle.set(true);
    // Focus the input after it renders
    setTimeout(() => this.titleInput?.nativeElement.focus(), 0);
  }

  openAccessDropdown(): void {
    this.editingAccess.set(true);
    // Open the panel after Angular renders the select
    setTimeout(() => this.accessSelect?.open(), 0);
  }

  onTitleBlur(): void {
    // Stay in edit mode if title changed (form is dirty) — user needs to save.
    const n = this.note();
    if (n && this.form.get('title')!.value === n.title) {
      this.editingTitle.set(false);
    }
  }

  onAccessClosed(): void {
    this.editingAccess.set(false);
  }

  // ── Handlers ──

  onBodyChange(markdown: string): void {
    this.form.get('body')!.setValue(markdown);
    this.form.get('body')!.markAsDirty();
  }

  async onAccessLevelChange(newLevel: NoteAccessLevel): Promise<void> {
    const n = this.note();
    if (!n || newLevel === n.access_level) return;

    this.submitting.set(true);
    try {
      await this.notesService.updateNote(n.id, { access_level: newLevel });
      const updated: NoteWithTags = { ...n, access_level: newLevel };
      this.note.set(updated);
      this.noteSaved.emit(updated);
      this.snackBar.open('Access level updated', 'OK', { duration: 2000 });
    } catch (err: any) {
      this.snackBar.open(`Failed to update: ${err.message}`, 'Dismiss', { duration: 5000 });
      this.form.patchValue({ access_level: n.access_level }, { emitEvent: false });
    } finally {
      this.submitting.set(false);
      this.editingAccess.set(false);
    }
  }

  async saveNote(): Promise<void> {
    const n = this.note();
    if (!n || this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    try {
      const v = this.form.getRawValue();
      const updated = await this.notesService.updateNote(n.id, {
        title: v.title!,
        body: v.body || '',
        access_level: v.access_level!,
      });

      const result: NoteWithTags = {
        ...n,
        ...updated,
        tags: n.tags,
        tag_count: n.tag_count,
      };
      this.note.set(result);
      this.loadedNoteId = result.id;
      this.form.markAsPristine();
      this.editing.set(false);
      this.editingTitle.set(false);
      this.snackBar.open('Note saved', 'OK', { duration: 2000 });
      this.noteSaved.emit(result);
    } catch (err: any) {
      this.snackBar.open(`Failed to save: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.submitting.set(false);
    }
  }

  async onArchive(): Promise<void> {
    const n = this.note();
    if (!n) return;

    this.submitting.set(true);
    try {
      await this.notesService.deleteNote(n.id);
      this.snackBar.open('Note archived', 'OK', { duration: 3000 });
      this.noteDeleted.emit(n.id);
    } catch (err: any) {
      this.snackBar.open(`Failed to archive: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.submitting.set(false);
    }
  }

  onTagsChanged(tagString: string | null): void {
    const n = this.note();
    if (!n) return;
    const updated: NoteWithTags = {
      ...n,
      tags: tagString,
      tag_count: tagString ? tagString.split(', ').length : 0,
    };
    this.note.set(updated);
    this.noteSaved.emit(updated);
  }

  discardChanges(): void {
    const n = this.note();
    if (n) {
      this.resetForm(n);
      this.editing.set(false);
      this.editingTitle.set(false);
    }
  }
}
