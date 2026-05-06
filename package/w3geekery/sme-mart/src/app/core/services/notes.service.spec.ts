import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NotesService } from './notes.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { fakePipelineWriteService, fakeGraphqlReadService, fakeImpersonation, fakeProjectContextService } from '../../test-helpers/angular';
import type { GqlNoteResponse } from '../gql-types/note.types';

describe('NotesService', () => {
  let service: NotesService;
  let mockPipeline: ReturnType<typeof fakePipelineWriteService>;
  let mockGql: ReturnType<typeof fakeGraphqlReadService>;
  let mockImpersonation: ReturnType<typeof fakeImpersonation>;
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockPipeline = fakePipelineWriteService();
    mockGql = fakeGraphqlReadService();
    mockImpersonation = fakeImpersonation();
    mockSnackBar = { open: vi.fn() };

    // Default GQL fixtures
    const noteFixture: GqlNoteResponse = {
      id: 'note-001',
      name: 'Test Note',
      content: 'Test Content',
      engagementId: 'wr-001',
      folderId: null,
      authorZerobiasUserId: 'u-100',
      archived: false,
      accessLevel: 'boundary',
      isMeetingMinutes: false,
      createdAt: '2026-03-18T22:00:00Z',
      updatedAt: '2026-03-18T22:00:00Z',
    };

    mockGql.query.mockResolvedValue({
      items: [noteFixture],
      page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
    });
    mockGql.getById.mockResolvedValue(noteFixture);

    TestBed.configureTestingModule({
      providers: [
        NotesService,
        { provide: PipelineWriteService, useValue: mockPipeline },
        { provide: GraphqlReadService, useValue: mockGql },
        { provide: ImpersonationService, useValue: mockImpersonation },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    service = TestBed.inject(NotesService);
  });

  // ---------------------------------------------------------------------------
  // createNote
  // ---------------------------------------------------------------------------

  describe('createNote', () => {
    it('should push note to Pipeline with camelCase GQL data', async () => {
      await service.createNote('wr-001', { title: 'New Note', body: 'Content' });
      expect(mockPipeline.pushEntity).toHaveBeenCalledWith(
        'Note',
        expect.objectContaining({
          engagementId: 'wr-001',
          name: 'New Note',
          content: 'Content',
        }),
        [],
        'notes.service:52'
      );
    });

    it('should default optional fields in GQL format', async () => {
      await service.createNote('wr-001', { title: 'X', body: 'Y' });
      const call = mockPipeline.pushEntity.mock.calls[0][1];
      expect(call.folderId).toBeNull();
      expect(call.accessLevel).toBe('boundary');
      expect(call.archived).toBe(false);
    });

    it('should await Pipeline push and return optimistic Note', async () => {
      const result = await service.createNote('wr-001', { title: 'New Note', body: 'Content' });
      expect(mockPipeline.pushEntity).toHaveBeenCalled();
      expect(result.id).toBeDefined();
      expect(result.title).toBe('New Note');
    });

    it('should surface error to user on Pipeline rejection', async () => {
      const mockError = new Error('Validation failed: missing required field');
      mockPipeline.pushEntity.mockRejectedValueOnce(mockError);

      await expect(
        service.createNote('wr-001', { title: 'Test', body: 'Content' })
      ).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save note'),
        'Dismiss',
        expect.any(Object)
      );
    });
  });

  // ---------------------------------------------------------------------------
  // updateNote
  // ---------------------------------------------------------------------------

  describe('updateNote', () => {
    it('should fetch current note from GQL before updating', async () => {
      await service.updateNote('note-001', { title: 'Revised' });
      expect(mockGql.getById).toHaveBeenCalledWith('Note', 'note-001', expect.any(Array));
    });

    it('should push updated note to Pipeline', async () => {
      await service.updateNote('note-001', { title: 'Revised' });
      expect(mockPipeline.pushEntity).toHaveBeenCalledWith(
        'Note',
        expect.objectContaining({
          id: 'note-001',
          name: 'Revised', // neonToGql maps title → name (GQL Object base class)
        }),
        [],
        'notes.service:89'
      );
    });

    it('should set updatedByZerobiasUserId and updatedAt', async () => {
      await service.updateNote('note-001', { title: 'Revised' });
      const call = mockPipeline.pushEntity.mock.calls[0][1];
      expect(call.updatedByZerobiasUserId).toBe('u-100');
      expect(call.updatedAt).toBeDefined();
    });

    it('should throw if note not found', async () => {
      mockGql.getById.mockResolvedValueOnce(null);
      await expect(service.updateNote('nonexistent', { title: 'X' })).rejects.toThrow('not found');
    });

    it('should surface error to user on Pipeline rejection', async () => {
      const mockError = new Error('Network error');
      mockPipeline.pushEntity.mockRejectedValueOnce(mockError);

      await expect(
        service.updateNote('note-001', { title: 'Revised' })
      ).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update note'),
        'Dismiss',
        expect.any(Object)
      );
    });
  });

  // ---------------------------------------------------------------------------
  // deleteNote
  // ---------------------------------------------------------------------------

  describe('deleteNote', () => {
    it('should soft-delete by setting archived to true', async () => {
      await service.deleteNote('note-001');
      expect(mockPipeline.pushEntity).toHaveBeenCalledWith(
        'Note',
        expect.objectContaining({
          archived: true,
        }),
        [],
        'notes.service:118'
      );
    });

    it('should fetch current note before archiving', async () => {
      await service.deleteNote('note-001');
      expect(mockGql.getById).toHaveBeenCalledWith('Note', 'note-001', expect.any(Array));
    });

    it('should throw if note not found', async () => {
      mockGql.getById.mockResolvedValueOnce(null);
      await expect(service.deleteNote('nonexistent')).rejects.toThrow('not found');
    });

    it('should surface error to user on Pipeline rejection', async () => {
      const mockError = new Error('Server error');
      mockPipeline.pushEntity.mockRejectedValueOnce(mockError);

      await expect(
        service.deleteNote('note-001')
      ).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete note'),
        'Dismiss',
        expect.any(Object)
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getNoteById
  // ---------------------------------------------------------------------------

  describe('getNoteById', () => {
    it('should query GQL for note by id', async () => {
      const result = await service.getNoteById('note-001');
      expect(mockGql.getById).toHaveBeenCalledWith('Note', 'note-001', expect.any(Array));
      expect(result?.id).toBe('note-001');
    });

    it('should return null if not found', async () => {
      mockGql.getById.mockResolvedValueOnce(null);
      const result = await service.getNoteById('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // listNotes
  // ---------------------------------------------------------------------------

  describe('listNotes', () => {
    it('should query GQL with engagementId and archived filters', async () => {
      await service.listNotes('wr-001');
      expect(mockGql.query).toHaveBeenCalledWith(
        'Note',
        expect.any(Array),
        expect.objectContaining({
          filters: {
            engagementId: '.eq.wr-001',
            archived: '.eq.false',
          },
        }),
      );
    });

    it('should update notes signal', async () => {
      expect(service.notes()).toEqual([]);
      await service.listNotes('wr-001');
      expect(service.notes()).toHaveLength(1);
    });

    it('should manage loading flag', async () => {
      const promise = service.listNotes('wr-001');
      expect(service.loading()).toBe(true);
      await promise;
      expect(service.loading()).toBe(false);
    });

    it('should reset loading on error', async () => {
      mockGql.query.mockRejectedValueOnce(new Error('fail'));
      await expect(service.listNotes('wr-001')).rejects.toThrow();
      expect(service.loading()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // searchNotes
  // ---------------------------------------------------------------------------

  describe('searchNotes', () => {
    it('should build GQL filter with title ilike', async () => {
      await service.searchNotes('wr-001', 'HIPAA');
      expect(mockGql.query).toHaveBeenCalledWith(
        'Note',
        expect.any(Array),
        expect.objectContaining({
          filters: expect.objectContaining({
            name: '.ilike.%HIPAA%',
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // listNotesByFolder
  // ---------------------------------------------------------------------------

  describe('listNotesByFolder', () => {
    it('should filter by folderId', async () => {
      await service.listNotesByFolder('wr-001', 'folder-1');
      expect(mockGql.query).toHaveBeenCalledWith(
        'Note',
        expect.any(Array),
        expect.objectContaining({
          filters: expect.objectContaining({
            folderId: '.eq.folder-1',
          }),
        }),
      );
    });

    it('should filter for null folder', async () => {
      await service.listNotesByFolder('wr-001', null);
      expect(mockGql.query).toHaveBeenCalledWith(
        'Note',
        expect.any(Array),
        expect.objectContaining({
          filters: expect.objectContaining({
            folderId: '.is.null',
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // searchNotesByDocumentLink
  // ---------------------------------------------------------------------------

  describe('searchNotesByDocumentLink', () => {
    it('should search for sme-doc:// links in content', async () => {
      await service.searchNotesByDocumentLink('wr-001', 'doc-abc');
      expect(mockGql.query).toHaveBeenCalledWith(
        'Note',
        expect.any(Array),
        expect.objectContaining({
          filters: expect.objectContaining({
            content: '.ilike.%sme-doc://doc-abc%',
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Demo Visibility (Phase 24 Plan 03)
  // ---------------------------------------------------------------------------

  describe('demo visibility (Phase 24 Plan 03)', () => {
    let mockProjectContextDV: ReturnType<typeof fakeProjectContextService>;
    let mockGqlReadDV: ReturnType<typeof fakeGraphqlReadService>;

    const mockGqlReturn = [
      { id: '1', name: 'Real', tag: null, archived: false, engagementId: 'wr-001', content: 'Test', authorZerobiasUserId: 'u-1', accessLevel: 'boundary', isMeetingMinutes: false, createdAt: '', updatedAt: '' } as unknown as GqlNoteResponse,
      { id: '2', name: 'Real w/ marketplace tag', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }], archived: false, engagementId: 'wr-001', content: 'Test', authorZerobiasUserId: 'u-2', accessLevel: 'boundary', isMeetingMinutes: false, createdAt: '', updatedAt: '' } as unknown as GqlNoteResponse,
      { id: '3', name: 'Demo (global)', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }], archived: false, engagementId: 'wr-001', content: 'Test', authorZerobiasUserId: 'u-3', accessLevel: 'boundary', isMeetingMinutes: false, createdAt: '', updatedAt: '' } as unknown as GqlNoteResponse,
      { id: '4', name: 'Demo (legacy)', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }], archived: false, engagementId: 'wr-001', content: 'Test', authorZerobiasUserId: 'u-4', accessLevel: 'boundary', isMeetingMinutes: false, createdAt: '', updatedAt: '' } as unknown as GqlNoteResponse,
    ];

    beforeEach(() => {
      // Parent describe's beforeEach already instantiated TestBed; reset before
      // reconfiguring with the demo-visibility provider set.
      TestBed.resetTestingModule();
      mockProjectContextDV = fakeProjectContextService(false);
      mockGqlReadDV = fakeGraphqlReadService();

      TestBed.configureTestingModule({
        providers: [
          NotesService,
          DemoVisibilityService,
          { provide: ProjectContextService, useValue: mockProjectContextDV },
          { provide: PipelineWriteService, useValue: fakePipelineWriteService() },
          { provide: GraphqlReadService, useValue: mockGqlReadDV },
          { provide: ImpersonationService, useValue: fakeImpersonation() },
          { provide: MatSnackBar, useValue: { open: vi.fn() } },
        ],
      });
      service = TestBed.inject(NotesService);
    });

    it('[DG-02] strips demo records for non-admin', async () => {
      mockGqlReadDV.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });
      const result = await service.listNotes('wr-001');
      expect(result.items.map(r => r.id)).toEqual(['1', '2']);
    });

    it('[DG-03] admin sees all records including demo', async () => {
      mockProjectContextDV.setIsAdmin(true);
      mockGqlReadDV.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });
      const result = await service.listNotes('wr-001');
      expect(result.items.map(r => r.id)).toEqual(['1', '2', '3', '4']);
    });

    it('[DG-02] does NOT add server-side tag negation filter', async () => {
      mockGqlReadDV.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });
      await service.listNotes('wr-001');
      const callArgs = mockGqlReadDV.query.mock.calls[0];
      const filters = callArgs[2]?.filters ?? {};
      const filterValues = Object.values(filters).join(' ');
      expect(filterValues).not.toContain('.not in.');
      expect(filterValues).not.toContain('.ne.');
    });

    it('requests tag field in GQL query', async () => {
      mockGqlReadDV.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });
      await service.listNotes('wr-001');
      const callArgs = mockGqlReadDV.query.mock.calls[0];
      const fields = callArgs[1] as string[];
      expect(fields).toContain('tag');
    });

    it('[DG-02] returns null when non-admin fetches a demo record by id', async () => {
      const demoNote: GqlNoteResponse = { id: '3', name: 'Demo', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }], archived: false, engagementId: 'wr-001', content: 'Test', authorZerobiasUserId: 'u-3', accessLevel: 'boundary', isMeetingMinutes: false, createdAt: '', updatedAt: '' } as unknown as GqlNoteResponse;
      mockGqlReadDV.getById.mockResolvedValue(demoNote);
      const result = await service.getNoteById('3');
      expect(result).toBeNull();
    });
  });
});
