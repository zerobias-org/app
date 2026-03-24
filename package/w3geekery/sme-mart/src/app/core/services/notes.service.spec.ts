import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NotesService } from './notes.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { ImpersonationService } from './impersonation.service';
import { makeNote, makeNoteWithTags } from '../../test-helpers/factories';
import { fakePipelineWriteService, fakeGraphqlReadService, fakeImpersonation } from '../../test-helpers/angular';
import type { GqlNoteResponse } from '../gql-types/note.types';

describe('NotesService', () => {
  let service: NotesService;
  let mockPipeline: ReturnType<typeof fakePipelineWriteService>;
  let mockGql: ReturnType<typeof fakeGraphqlReadService>;
  let mockImpersonation: ReturnType<typeof fakeImpersonation>;

  beforeEach(() => {
    mockPipeline = fakePipelineWriteService();
    mockGql = fakeGraphqlReadService();
    mockImpersonation = fakeImpersonation();

    // Default GQL fixtures
    const noteFixture: GqlNoteResponse = {
      id: 'note-001',
      title: 'Test Note',
      body: 'Test Content',
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
      expect(mockPipeline.pushEntity).toHaveBeenCalledWith('Note', expect.objectContaining({
        engagementId: 'wr-001',
        authorZerobiasUserId: 'u-100',
        title: 'New Note',
        body: 'Content',
      }));
    });

    it('should default optional fields in GQL format', async () => {
      await service.createNote('wr-001', { title: 'X', body: 'Y' });
      const call = mockPipeline.pushEntity.mock.calls[0][1];
      expect(call.folderId).toBeNull();
      expect(call.accessLevel).toBe('boundary');
      expect(call.isMeetingMinutes).toBe(false);
      expect(call.meetingDate).toBeNull();
    });

    it('should return optimistically before Pipeline completes', async () => {
      // Delay pipeline resolution
      mockPipeline.pushEntity.mockImplementationOnce(() => new Promise(r => setTimeout(r, 100)));
      const promise = service.createNote('wr-001', { title: 'Async Note', body: 'Content' });
      // Should resolve immediately without waiting for pipeline
      const result = await Promise.race([promise, Promise.resolve('immediate')]);
      expect(result).not.toBe('immediate'); // Promise resolved before timeout
      expect(mockPipeline.pushEntity).toHaveBeenCalled();
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
      expect(mockPipeline.pushEntity).toHaveBeenCalledWith('Note', expect.objectContaining({
        id: 'note-001',
        title: 'Revised',
      }));
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
  });

  // ---------------------------------------------------------------------------
  // deleteNote
  // ---------------------------------------------------------------------------

  describe('deleteNote', () => {
    it('should soft-delete by setting archived to true', async () => {
      await service.deleteNote('note-001');
      expect(mockPipeline.pushEntity).toHaveBeenCalledWith('Note', expect.objectContaining({
        archived: true,
      }));
    });

    it('should fetch current note before archiving', async () => {
      await service.deleteNote('note-001');
      expect(mockGql.getById).toHaveBeenCalledWith('Note', 'note-001', expect.any(Array));
    });

    it('should throw if note not found', async () => {
      mockGql.getById.mockResolvedValueOnce(null);
      await expect(service.deleteNote('nonexistent')).rejects.toThrow('not found');
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
            title: '.ilike.%HIPAA%',
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
    it('should search for sme-doc:// links in body', async () => {
      await service.searchNotesByDocumentLink('wr-001', 'doc-abc');
      expect(mockGql.query).toHaveBeenCalledWith(
        'Note',
        expect.any(Array),
        expect.objectContaining({
          filters: expect.objectContaining({
            body: '.ilike.%sme-doc://doc-abc%',
          }),
        }),
      );
    });
  });
});
