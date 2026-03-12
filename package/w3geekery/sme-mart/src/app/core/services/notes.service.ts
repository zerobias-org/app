import { Injectable, inject, signal } from '@angular/core';
import { SmeMartDbService } from './sme-mart-db.service';
import { ImpersonationService } from './impersonation.service';
import type { QueryOptions } from '@zerobias-org/data-utils';
import type { PagedResults } from '@zerobias-org/types-core-js';
import type {
  Note,
  NoteWithTags,
  CreateNoteRequest,
  UpdateNoteRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly db = inject(SmeMartDbService);
  private readonly impersonation = inject(ImpersonationService);

  readonly notes = signal<NoteWithTags[]>([]);
  readonly loading = signal(false);

  // ── CRUD ──

  async createNote(engagementId: string, data: CreateNoteRequest): Promise<Note> {
    const userId = this.impersonation.effectiveUserId();
    return this.db.createRow<Note>('notes', {
      engagement_id: engagementId,
      author_zerobias_user_id: userId,
      title: data.title,
      body: data.body,
      folder_id: data.folder_id ?? null,
      access_level: data.access_level ?? 'boundary',
      is_meeting_minutes: data.is_meeting_minutes ?? false,
      meeting_date: data.meeting_date ?? null,
      meeting_duration_minutes: data.meeting_duration_minutes ?? null,
      boundary_id: data.boundary_id ?? null,
      project_id: data.project_id ?? null,
    });
  }

  async updateNote(noteId: string, data: UpdateNoteRequest): Promise<Note> {
    const userId = this.impersonation.effectiveUserId();
    const updateData: Record<string, unknown> = {
      ...data,
      updated_at: new Date().toISOString(),
      updated_by_zerobias_user_id: userId,
    };
    return this.db.updateRow<Note>('notes', noteId, updateData);
  }

  async deleteNote(noteId: string): Promise<Note> {
    return this.db.updateRow<Note>('notes', noteId, { archived: true });
  }

  async getNoteById(noteId: string): Promise<NoteWithTags | null> {
    return this.db.getRow<NoteWithTags>('v_notes_with_tags', noteId);
  }

  // ── List & Search ──

  async listNotes(engagementId: string, options?: QueryOptions): Promise<PagedResults<NoteWithTags>> {
    this.loading.set(true);
    try {
      const filter = `(engagement_id=${engagementId})`;
      const result = await this.db.searchRows<NoteWithTags>('v_notes_with_tags', filter, options);
      this.notes.set(result.items || []);
      return result;
    } finally {
      this.loading.set(false);
    }
  }

  async searchNotes(engagementId: string, query: string, options?: QueryOptions): Promise<PagedResults<NoteWithTags>> {
    this.loading.set(true);
    try {
      const filter = `(&(engagement_id=${engagementId})(|(title=*${query}*)(body=*${query}*)))`;
      const result = await this.db.searchRows<NoteWithTags>('v_notes_with_tags', filter, options);
      this.notes.set(result.items || []);
      return result;
    } finally {
      this.loading.set(false);
    }
  }

  async listNotesByFolder(engagementId: string, folderId: string | null, options?: QueryOptions): Promise<PagedResults<NoteWithTags>> {
    this.loading.set(true);
    try {
      const filter = folderId
        ? `(&(engagement_id=${engagementId})(folder_id=${folderId}))`
        : `(&(engagement_id=${engagementId})(folder_id=))`;
      const result = await this.db.searchRows<NoteWithTags>('v_notes_with_tags', filter, options);
      this.notes.set(result.items || []);
      return result;
    } finally {
      this.loading.set(false);
    }
  }

  // ── Document Cross-Linking ──

  async searchNotesByDocumentLink(engagementId: string, docId: string, options?: QueryOptions): Promise<PagedResults<NoteWithTags>> {
    this.loading.set(true);
    try {
      const filter = `(&(engagement_id=${engagementId})(body=*sme-doc://${docId}*))`;
      const result = await this.db.searchRows<NoteWithTags>('v_notes_with_tags', filter, options);
      this.notes.set(result.items || []);
      return result;
    } finally {
      this.loading.set(false);
    }
  }

  // ── Tags ──
  // Tag operations moved to SmeMartResourceService (sme_resource_tags table).
  // Use SmeResourceTagEditor or ResourceTagAutocomplete component for tag UI.
}
