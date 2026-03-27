import { Injectable, inject, signal } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import { NOTE_FIELD_MAPPING, mapGqlToNeon } from '../field-mappings';
import { PagedResults } from '@zerobias-org/types-core-js';
import type { QueryOptions } from '@zerobias-org/data-utils';
import type {
  Note,
  NoteWithTags,
  CreateNoteRequest,
  UpdateNoteRequest,
} from '../models';
import type { GqlNoteResponse } from '../gql-types/note.types';

/**
 * NotesService - FULLY MIGRATED TO PIPELINE (Phase 5)
 *
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 *
 * Neon notes table archived 2 weeks after Phase 5 completion (2026-04-02).
 * 2-week observation period for production stability verification.
 */
@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly impersonation = inject(ImpersonationService);

  readonly notes = signal<NoteWithTags[]>([]);
  readonly loading = signal(false);

  // ── CRUD ──

  async createNote(engagementId: string, data: CreateNoteRequest): Promise<Note> {
    const userId = this.impersonation.effectiveUserId();

    // Build GQL data with camelCase field names
    // GQL uses `name` (Object base) and `content` (custom property)
    const gqlData: Record<string, unknown> = {
      id: crypto.randomUUID(),
      name: data.title || 'Untitled Note',
      content: data.body ?? null,
      engagementId,
      folderId: data.folder_id ?? null,
      accessLevel: data.access_level ?? 'boundary',
      archived: false,
    };

    // Fire-and-forget Pipeline push
    this.pipelineWrite.pushEntity('Note', gqlData).catch(err => {
      console.error('Failed to push note to Pipeline:', err);
    });

    // Return optimistically (transform GQL to Neon shape)
    const neonData = mapGqlToNeon<Note>(gqlData, NOTE_FIELD_MAPPING.gqlToNeon);
    return neonData;
  }

  async updateNote(noteId: string, data: UpdateNoteRequest): Promise<Note> {
    const userId = this.impersonation.effectiveUserId();

    // Check write-through cache first, fall back to GQL fetch
    let current = this.pipelineWrite.getCached('Note', noteId) as GqlNoteResponse | null;
    if (!current) {
      current = await this.graphqlRead.getById<GqlNoteResponse>(
        'Note',
        noteId,
        this.getNoteFields(),
      );
      if (!current) throw new Error(`Note ${noteId} not found`);
      this.pipelineWrite.seedCache('Note', noteId, current as unknown as Record<string, unknown>);
    }

    // Build updated GQL data
    const gqlData: Record<string, unknown> = {
      ...current,
      ...Object.entries(data).reduce((acc, [key, val]) => {
        const gqlKey = NOTE_FIELD_MAPPING.neonToGql[key as keyof typeof NOTE_FIELD_MAPPING.neonToGql];
        if (gqlKey) acc[gqlKey] = val;
        return acc;
      }, {} as Record<string, unknown>),
      updatedAt: new Date().toISOString(),
      updatedByZerobiasUserId: userId,
    };

    // Fire-and-forget Pipeline push
    this.pipelineWrite.pushEntity('Note', gqlData).catch(err => {
      console.error('Failed to update note in Pipeline:', err);
    });

    // Return optimistically
    const neonData = mapGqlToNeon<Note>(gqlData, NOTE_FIELD_MAPPING.gqlToNeon);
    return neonData;
  }

  async deleteNote(noteId: string): Promise<Note> {
    // Check write-through cache first, fall back to GQL fetch
    let current = this.pipelineWrite.getCached('Note', noteId) as GqlNoteResponse | null;
    if (!current) {
      current = await this.graphqlRead.getById<GqlNoteResponse>(
        'Note',
        noteId,
        this.getNoteFields(),
      );
      if (!current) throw new Error(`Note ${noteId} not found`);
    }

    // Build updated GQL data with archived: true
    const gqlData: Record<string, unknown> = {
      ...current,
      archived: true,
      updatedAt: new Date().toISOString(),
    };

    // Fire-and-forget Pipeline push
    this.pipelineWrite.pushEntity('Note', gqlData).catch(err => {
      console.error('Failed to archive note in Pipeline:', err);
    });

    // Return optimistically
    const neonData = mapGqlToNeon<Note>(gqlData, NOTE_FIELD_MAPPING.gqlToNeon);
    return neonData;
  }

  async getNoteById(noteId: string): Promise<NoteWithTags | null> {
    const note = await this.graphqlRead.getById<GqlNoteResponse>(
      'Note',
      noteId,
      this.getNoteFields(),
    );
    if (!note) return null;

    // Transform GQL response to Note, then add tag support
    const neonData = mapGqlToNeon<NoteWithTags>(note, NOTE_FIELD_MAPPING.gqlToNeon);
    // Note: tags would come from hydra.TagApi if implemented separately
    return neonData;
  }

  // ── List & Search ──

  async listNotes(engagementId: string, options?: QueryOptions): Promise<PagedResults<NoteWithTags>> {
    this.loading.set(true);
    try {
      const pageNumber = options?.pageNumber ?? 1;
      const pageSize = options?.pageSize ?? 50;

      const gqlOptions: GqlQueryOptions = {
        filters: {
          engagementId: `.eq.${engagementId}`,
          archived: '.eq.false',
        },
        pageNumber,
        pageSize,
      };

      const result = await this.graphqlRead.query<GqlNoteResponse>(
        'Note',
        this.getNoteFields(),
        gqlOptions,
      );

      // Transform GQL responses to Note/NoteWithTags
      const items = result.items.map(gql => mapGqlToNeon<NoteWithTags>(gql, NOTE_FIELD_MAPPING.gqlToNeon));
      this.notes.set(items);

      return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
    } finally {
      this.loading.set(false);
    }
  }

  async searchNotes(engagementId: string, query: string, options?: QueryOptions): Promise<PagedResults<NoteWithTags>> {
    this.loading.set(true);
    try {
      const pageNumber = options?.pageNumber ?? 1;
      const pageSize = options?.pageSize ?? 50;

      const gqlOptions: GqlQueryOptions = {
        filters: {
          engagementId: `.eq.${engagementId}`,
          archived: '.eq.false',
          name: `.ilike.%${query}%`,
        },
        pageNumber,
        pageSize,
      };

      const result = await this.graphqlRead.query<GqlNoteResponse>(
        'Note',
        this.getNoteFields(),
        gqlOptions,
      );

      const items = result.items.map(gql => mapGqlToNeon<NoteWithTags>(gql, NOTE_FIELD_MAPPING.gqlToNeon));
      this.notes.set(items);

      return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
    } finally {
      this.loading.set(false);
    }
  }

  async listNotesByFolder(engagementId: string, folderId: string | null, options?: QueryOptions): Promise<PagedResults<NoteWithTags>> {
    this.loading.set(true);
    try {
      const pageNumber = options?.pageNumber ?? 1;
      const pageSize = options?.pageSize ?? 50;

      const filters: Record<string, string> = {
        engagementId: `.eq.${engagementId}`,
        archived: '.eq.false',
      };
      if (folderId) {
        filters['folderId'] = `.eq.${folderId}`;
      } else {
        filters['folderId'] = '.is.null';
      }

      const gqlOptions: GqlQueryOptions = {
        filters,
        pageNumber,
        pageSize,
      };

      const result = await this.graphqlRead.query<GqlNoteResponse>(
        'Note',
        this.getNoteFields(),
        gqlOptions,
      );

      const items = result.items.map(gql => mapGqlToNeon<NoteWithTags>(gql, NOTE_FIELD_MAPPING.gqlToNeon));
      this.notes.set(items);

      return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Document Cross-Linking ──

  async searchNotesByDocumentLink(engagementId: string, docId: string, options?: QueryOptions): Promise<PagedResults<NoteWithTags>> {
    this.loading.set(true);
    try {
      const pageNumber = options?.pageNumber ?? 1;
      const pageSize = options?.pageSize ?? 50;

      const gqlOptions: GqlQueryOptions = {
        filters: {
          engagementId: `.eq.${engagementId}`,
          archived: '.eq.false',
          content: `.ilike.%sme-doc://${docId}%`,
        },
        pageNumber,
        pageSize,
      };

      const result = await this.graphqlRead.query<GqlNoteResponse>(
        'Note',
        this.getNoteFields(),
        gqlOptions,
      );

      const items = result.items.map(gql => mapGqlToNeon<NoteWithTags>(gql, NOTE_FIELD_MAPPING.gqlToNeon));
      this.notes.set(items);

      return PagedResults.fromArray(items, pageNumber, pageSize, result.page.totalCount ?? items.length);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Tags ──
  // Tag operations moved to SmeMartResourceService (sme_resource_tags table).
  // Use SmeResourceTagEditor or ResourceTagAutocomplete component for tag UI.

  /**
   * Get note counts per folder for an engagement.
   * Returns a map of folderId → count (only non-archived notes).
   */
  async getNoteCounts(engagementId: string): Promise<Map<string, number>> {
    const result = await this.graphqlRead.query<{ id: string; folderId: string | null }>(
      'Note',
      ['id', 'folderId'],
      {
        filters: {
          engagementId: `.eq.${engagementId}`,
          archived: '.eq.false',
        },
        pageSize: 1000,
      },
    );

    const counts = new Map<string, number>();
    for (const note of result.items) {
      if (note.folderId) {
        counts.set(note.folderId, (counts.get(note.folderId) ?? 0) + 1);
      }
    }
    return counts;
  }

  /**
   * Get standard field list for Note GQL queries.
   */
  private getNoteFields(): string[] {
    return [
      'id',
      'name',
      'description',
      'engagementId',
      'folderId',
      'archived',
      'authorZerobiasUserId',
      'isMeetingMinutes',
      'boundaryId',
      'projectId',
      'content',
      'accessLevel',
      'dateCreated',
      'dateLastModified',
    ];
  }
}
