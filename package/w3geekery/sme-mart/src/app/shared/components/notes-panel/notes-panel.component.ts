import {
  Component, Input, ChangeDetectionStrategy, OnInit, ViewChild,
  signal, computed, inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ResizableDrawerDirective } from '../../directives/resizable-drawer.directive';
import { NoteEditorPanel } from '../note-editor-panel/note-editor-panel.component';
import { NoteFolderTree } from '../note-folder-tree/note-folder-tree.component';
import { NotesNotebooksColumn } from '../notes-notebooks-column/notes-notebooks-column.component';
import { NotesService } from '../../../core/services/notes.service';
import { NoteHierarchyService } from '../../../core/services/note-hierarchy.service';
import { UserPreferencesService } from '../../../core/services/user-preferences.service';
import type { NoteWithTags } from '../../../core/models';

@Component({
  selector: 'app-notes-panel',
  standalone: true,
  imports: [
    DatePipe, FormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule, MatSidenavModule,
    ResizableDrawerDirective,
    NoteEditorPanel, NoteFolderTree, NotesNotebooksColumn,
  ],
  templateUrl: './notes-panel.component.html',
  styleUrl: './notes-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesPanel implements OnInit {
  private readonly notesService = inject(NotesService);
  private readonly hierarchy = inject(NoteHierarchyService);
  private readonly prefs = inject(UserPreferencesService);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild(NoteFolderTree) folderTree?: NoteFolderTree;
  @ViewChild(NotesNotebooksColumn) notebooksCol?: NotesNotebooksColumn;

  private readonly _engagementId = signal('');

  @Input({ required: true })
  set engagementId(value: string) { this._engagementId.set(value); }

  readonly notes = signal<NoteWithTags[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly selectedNotebookId = signal<string | null>(null);
  readonly selectedFolderId = signal<string | null>(null);
  readonly selectedNoteId = signal<string | null>(null);
  readonly drawerOpen = signal(true);
  readonly showNotebooks = signal(true);
  readonly showFolders = signal(true);

  readonly noteCount = computed(() => this.notes().length);
  readonly engId = this._engagementId;
  readonly folderColors = this.prefs.folderColors;
  readonly draggedNoteId = signal<string | null>(null);

  readonly selectedNote = computed(() => {
    const id = this.selectedNoteId();
    if (!id) return null;
    return this.notes().find(n => n.id === id) ?? null;
  });

  ngOnInit(): void {
    // Notes load is driven by notebook/folder selection — notebooks column
    // auto-selects the first notebook on load, which triggers loadNotes().
  }

  async loadNotes(): Promise<void> {
    const engId = this._engagementId();
    if (!engId) return;

    const query = this.searchQuery().trim();
    const folderId = this.selectedFolderId();

    // Don't load all notes — require a folder or search query
    if (!query && !folderId) {
      this.notes.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    try {
      let result;
      if (query) {
        result = await this.notesService.searchNotes(engId, query, { pageNumber: 1, pageSize: 50 });
      } else {
        result = await this.notesService.listNotesByFolder(engId, folderId!, { pageNumber: 1, pageSize: 50 });
      }
      this.notes.set(result.items || []);
    } catch (err: any) {
      console.error('[NotesPanel] Failed to load notes:', err);
      this.snackBar.open('Failed to load notes', 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(): void {
    this.selectedNoteId.set(null);
    this.loadNotes();
  }

  async onNotebookSelected(notebookId: string | null): Promise<void> {
    this.selectedNotebookId.set(notebookId);
    this.selectedFolderId.set(null);
    this.selectedNoteId.set(null);
    this.searchQuery.set('');
    this.notes.set([]);

    if (notebookId) {
      // Ensure notebook has at least one folder (creates "General" if empty)
      const created = await this.hierarchy.ensureDefaultFolder(this._engagementId(), notebookId);
      if (created) {
        // Reload both trees so the new folder shows up
        this.folderTree?.loadTree();
        this.notebooksCol?.loadTree();
      }
    }
  }

  onFolderSelected(folderId: string | null): void {
    this.selectedFolderId.set(folderId);
    this.selectedNoteId.set(null);
    this.searchQuery.set('');
    this.loadNotes();
  }

  onFolderTreeChanged(): void {
    this.folderTree?.loadTree();
    this.notebooksCol?.loadTree();
  }

  toggleDrawer(): void {
    this.drawerOpen.update(v => !v);
  }

  toggleNotebooks(): void {
    this.showNotebooks.update(v => !v);
  }

  toggleFolders(): void {
    this.showFolders.update(v => !v);
  }

  selectNote(note: NoteWithTags): void {
    this.selectedNoteId.set(note.id);
  }

  async createNewNote(): Promise<void> {
    const engId = this._engagementId();
    const folderId = this.selectedFolderId();
    if (!engId) return;

    try {
      const created = await this.notesService.createNote(engId, {
        title: 'Untitled',
        body: '',
        folder_id: folderId,
        access_level: 'boundary',
      });

      // Build a NoteWithTags from the raw Note so the editor panel can use it
      const newNote: NoteWithTags = {
        ...created,
        tags: null,
        tag_count: 0,
        folder_color: null,
        folder_name: null,
      };

      this.notes.update(list => [newNote, ...list]);
      this.selectedNoteId.set(newNote.id);
      this.folderTree?.loadTree();
    } catch (err: any) {
      this.snackBar.open(`Failed to create note: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  // ── Note drag-and-drop ──

  onNoteDragStart(event: DragEvent, note: NoteWithTags): void {
    this.draggedNoteId.set(note.id);
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('application/x-sme-note', note.id);
  }

  onNoteDragEnd(): void {
    this.draggedNoteId.set(null);
  }

  async onNoteMovedToFolder(event: { noteId: string; folderId: string }): Promise<void> {
    this.draggedNoteId.set(null);

    const note = this.notes().find(n => n.id === event.noteId);
    if (!note) return;

    // No-op if already in the target folder
    if (note.folder_id === event.folderId) return;

    try {
      await this.hierarchy.moveNote(event.noteId, event.folderId);
      this.snackBar.open(`Moved "${note.title}" to folder`, 'OK', { duration: 3000 });
      // Remove note from current list (it's now in a different folder)
      this.notes.update(list => list.filter(n => n.id !== event.noteId));
      if (this.selectedNoteId() === event.noteId) {
        this.selectedNoteId.set(null);
      }
      this.folderTree?.loadTree();
    } catch (err: any) {
      this.snackBar.open(`Failed to move note: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  /** Called when the inline editor saves a note. */
  onNoteSaved(updated: NoteWithTags): void {
    this.notes.update(list =>
      list.map(n => n.id === updated.id ? updated : n),
    );
  }

  /** Called when the inline editor deletes (archives) a note. */
  onNoteDeleted(noteId: string): void {
    this.notes.update(list => list.filter(n => n.id !== noteId));
    if (this.selectedNoteId() === noteId) {
      this.selectedNoteId.set(null);
    }
    this.folderTree?.loadTree();
  }

}
