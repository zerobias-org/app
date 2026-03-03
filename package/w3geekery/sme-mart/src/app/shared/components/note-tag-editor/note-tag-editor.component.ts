import {
  Component, Input, Output, EventEmitter, ViewChild, ElementRef,
  ChangeDetectionStrategy, inject, signal, computed, OnInit, OnChanges, SimpleChanges,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { startWith } from 'rxjs';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { NotesService } from '../../../core/services/notes.service';
import type { NoteTag } from '../../../core/models';

@Component({
  selector: 'app-note-tag-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatAutocompleteModule, MatChipsModule, MatFormFieldModule, MatIconModule,
  ],
  templateUrl: './note-tag-editor.component.html',
  styleUrl: './note-tag-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteTagEditor implements OnInit, OnChanges {
  private readonly notesService = inject(NotesService);

  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;

  @Input({ required: true }) noteId!: string;
  @Input({ required: true }) engagementId!: string;
  /** Comma-separated tag string from v_notes_with_tags, e.g. "Risk, Board" */
  @Input() tags: string | null = null;

  @Output() tagsChanged = new EventEmitter<string | null>();

  readonly tagCtrl = new FormControl('');
  readonly separatorKeyCodes = [ENTER, COMMA] as const;

  /** All tags available for this engagement */
  readonly allTags = signal<NoteTag[]>([]);
  /** Tags currently assigned to this note */
  readonly assignedTags = signal<NoteTag[]>([]);

  /** Reactive signal from FormControl so computed() can track it */
  private readonly inputValue = toSignal(
    this.tagCtrl.valueChanges.pipe(startWith('')),
    { initialValue: '' },
  );

  /** Filtered suggestions based on input text (excludes already-assigned) */
  readonly filteredTags = computed(() => {
    const input = (this.inputValue() || '').toLowerCase().trim();
    const assignedIds = new Set(this.assignedTags().map(t => t.id));
    const available = this.allTags().filter(t => !assignedIds.has(t.id));
    if (!input) return available;
    return available.filter(t => t.name.toLowerCase().includes(input));
  });

  async ngOnInit(): Promise<void> {
    await this.loadAllTags();
    this.syncAssignedFromTagString();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tags'] && !changes['tags'].firstChange) {
      this.syncAssignedFromTagString();
    }
  }

  private async loadAllTags(): Promise<void> {
    const tags = await this.notesService.listTags(this.engagementId);
    this.allTags.set(tags);
  }

  private syncAssignedFromTagString(): void {
    if (!this.tags) {
      this.assignedTags.set([]);
      return;
    }
    const names = this.tags.split(', ').map(n => n.trim()).filter(Boolean);
    const matched = this.allTags().filter(t => names.includes(t.name));
    this.assignedTags.set(matched);
  }

  async onChipRemoved(tag: NoteTag): Promise<void> {
    await this.notesService.removeTag(this.noteId, tag.id);
    this.assignedTags.update(tags => tags.filter(t => t.id !== tag.id));
    this.emitTagString();
  }

  async onSelected(event: MatAutocompleteSelectedEvent): Promise<void> {
    const tag = event.option.value as NoteTag;
    await this.notesService.assignTags(this.noteId, [tag.id]);
    this.assignedTags.update(tags => [...tags, tag]);
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue('');
    this.emitTagString();
  }

  async onChipInput(event: MatChipInputEvent): Promise<void> {
    const name = (event.value || '').trim();
    if (!name) return;

    // Check if tag already exists
    let tag = this.allTags().find(t => t.name.toLowerCase() === name.toLowerCase());
    if (!tag) {
      // Create new tag
      tag = await this.notesService.createTag(this.engagementId, name);
      this.allTags.update(tags => [...tags, tag!]);
    }

    // Check if already assigned
    if (this.assignedTags().some(t => t.id === tag!.id)) {
      event.chipInput.clear();
      this.tagCtrl.setValue('');
      return;
    }

    await this.notesService.assignTags(this.noteId, [tag.id]);
    this.assignedTags.update(tags => [...tags, tag!]);
    event.chipInput.clear();
    this.tagCtrl.setValue('');
    this.emitTagString();
  }

  displayFn(tag: NoteTag): string {
    return tag?.name ?? '';
  }

  private emitTagString(): void {
    const tags = this.assignedTags();
    const str = tags.length > 0 ? tags.map(t => t.name).join(', ') : null;
    this.tagsChanged.emit(str);
  }
}
