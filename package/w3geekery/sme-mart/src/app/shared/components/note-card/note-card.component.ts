import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, signal,
} from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MarkdownView } from '../../components/markdown-view/markdown-view.component';
import type { NoteWithTags, NoteAccessLevel } from '../../../core/models';

@Component({
  selector: 'app-note-card',
  standalone: true,
  imports: [
    DatePipe, SlicePipe,
    MatCardModule, MatIconModule, MatButtonModule,
    MatChipsModule, MatMenuModule, MatTooltipModule,
    MarkdownView,
  ],
  templateUrl: './note-card.component.html',
  styleUrl: './note-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteCard {
  private readonly _note = signal<NoteWithTags | null>(null);

  @Input({ required: true })
  set note(value: NoteWithTags) { this._note.set(value); }

  @Output() edit = new EventEmitter<NoteWithTags>();
  @Output() delete = new EventEmitter<NoteWithTags>();
  @Output() move = new EventEmitter<NoteWithTags>();

  readonly noteData = this._note;
  readonly expanded = signal(false);

  get tagList(): string[] {
    const tags = this._note()?.tags;
    if (!tags) return [];
    return tags.split(', ').filter(Boolean);
  }

  toggleExpand(): void {
    this.expanded.update(v => !v);
  }

  onEdit(): void {
    const n = this._note();
    if (n) this.edit.emit(n);
  }

  onDelete(): void {
    const n = this._note();
    if (n) this.delete.emit(n);
  }

  onMove(): void {
    const n = this._note();
    if (n) this.move.emit(n);
  }

  accessIcon(level: NoteAccessLevel): string {
    switch (level) {
      case 'personal': return 'lock';
      case 'project': return 'business';
      default: return 'groups';
    }
  }

  accessLabel(level: NoteAccessLevel): string {
    switch (level) {
      case 'personal': return 'Personal';
      case 'project': return 'Project';
      default: return 'Boundary';
    }
  }

  accessTooltip(level: NoteAccessLevel): string {
    switch (level) {
      case 'personal': return 'Only visible to you';
      case 'project': return 'Visible to project members';
      default: return 'Visible to all boundary users';
    }
  }
}
