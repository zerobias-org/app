import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { NotesService } from './notes.service';
import { SmeMartDbService } from './sme-mart-db.service';
import { ImpersonationService } from './impersonation.service';
import { makeNote, makeNoteWithTags } from '../../test-helpers/factories';
import { fakeSmeMartDb, fakeImpersonation } from '../../test-helpers/angular';

describe('NotesService', () => {
  let service: NotesService;
  let mockDb: ReturnType<typeof fakeSmeMartDb>;
  let mockImpersonation: ReturnType<typeof fakeImpersonation>;

  beforeEach(() => {
    mockDb = fakeSmeMartDb();
    mockDb.createRow.mockResolvedValue(makeNote());
    mockDb.updateRow.mockResolvedValue(makeNote());
    mockDb.getRow.mockResolvedValue(makeNoteWithTags());
    mockDb.searchRows.mockResolvedValue({ items: [makeNoteWithTags()], totalCount: 1 });

    mockImpersonation = fakeImpersonation();

    TestBed.configureTestingModule({
      providers: [
        NotesService,
        { provide: SmeMartDbService, useValue: mockDb },
        { provide: ImpersonationService, useValue: mockImpersonation },
      ],
    });

    service = TestBed.inject(NotesService);
  });

  // ---------------------------------------------------------------------------
  // createNote
  // ---------------------------------------------------------------------------

  describe('createNote', () => {
    it('should create row with engagement_id and effective user', async () => {
      await service.createNote('wr-001', { title: 'New Note', body: 'Content' });
      expect(mockDb.createRow).toHaveBeenCalledWith('notes', expect.objectContaining({
        engagement_id: 'wr-001',
        author_zerobias_user_id: 'u-100',
        title: 'New Note',
        body: 'Content',
      }));
    });

    it('should default optional fields', async () => {
      await service.createNote('wr-001', { title: 'X', body: 'Y' });
      const call = mockDb.createRow.mock.calls[0][1];
      expect(call.folder_id).toBeNull();
      expect(call.access_level).toBe('boundary');
      expect(call.is_meeting_minutes).toBe(false);
      expect(call.meeting_date).toBeNull();
    });

    it('should pass explicit optional fields', async () => {
      await service.createNote('wr-001', {
        title: 'Minutes',
        body: 'Discussion',
        folder_id: 'folder-1',
        access_level: 'personal',
        is_meeting_minutes: true,
        meeting_date: '2026-03-01',
        meeting_duration_minutes: 60,
      });
      const call = mockDb.createRow.mock.calls[0][1];
      expect(call.folder_id).toBe('folder-1');
      expect(call.access_level).toBe('personal');
      expect(call.is_meeting_minutes).toBe(true);
      expect(call.meeting_date).toBe('2026-03-01');
      expect(call.meeting_duration_minutes).toBe(60);
    });
  });

  // ---------------------------------------------------------------------------
  // updateNote
  // ---------------------------------------------------------------------------

  describe('updateNote', () => {
    it('should add updated_at and effective user', async () => {
      await service.updateNote('note-001', { title: 'Revised' });
      const call = mockDb.updateRow.mock.calls[0][2];
      expect(call.title).toBe('Revised');
      expect(call.updated_by_zerobias_user_id).toBe('u-100');
      expect(call.updated_at).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // deleteNote
  // ---------------------------------------------------------------------------

  describe('deleteNote', () => {
    it('should soft-delete by setting archived to true', async () => {
      await service.deleteNote('note-001');
      expect(mockDb.updateRow).toHaveBeenCalledWith('notes', 'note-001', { archived: true });
    });
  });

  // ---------------------------------------------------------------------------
  // getNoteById
  // ---------------------------------------------------------------------------

  describe('getNoteById', () => {
    it('should fetch from v_notes_with_tags view', async () => {
      const result = await service.getNoteById('note-001');
      expect(mockDb.getRow).toHaveBeenCalledWith('v_notes_with_tags', 'note-001');
      expect(result?.id).toBe('note-001');
    });
  });

  // ---------------------------------------------------------------------------
  // listNotes
  // ---------------------------------------------------------------------------

  describe('listNotes', () => {
    it('should search with engagement_id filter', async () => {
      await service.listNotes('wr-001');
      expect(mockDb.searchRows).toHaveBeenCalledWith(
        'v_notes_with_tags',
        '(engagement_id=wr-001)',
        undefined,
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
      mockDb.searchRows.mockRejectedValue(new Error('fail'));
      await expect(service.listNotes('wr-001')).rejects.toThrow();
      expect(service.loading()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // searchNotes
  // ---------------------------------------------------------------------------

  describe('searchNotes', () => {
    it('should build compound filter with title and body wildcards', async () => {
      await service.searchNotes('wr-001', 'HIPAA');
      expect(mockDb.searchRows).toHaveBeenCalledWith(
        'v_notes_with_tags',
        '(&(engagement_id=wr-001)(|(title=*HIPAA*)(body=*HIPAA*)))',
        undefined,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // listNotesByFolder
  // ---------------------------------------------------------------------------

  describe('listNotesByFolder', () => {
    it('should filter by folder_id', async () => {
      await service.listNotesByFolder('wr-001', 'folder-1');
      expect(mockDb.searchRows).toHaveBeenCalledWith(
        'v_notes_with_tags',
        '(&(engagement_id=wr-001)(folder_id=folder-1))',
        undefined,
      );
    });

    it('should filter for root folder (null)', async () => {
      await service.listNotesByFolder('wr-001', null);
      expect(mockDb.searchRows).toHaveBeenCalledWith(
        'v_notes_with_tags',
        '(&(engagement_id=wr-001)(folder_id=))',
        undefined,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // searchNotesByDocumentLink
  // ---------------------------------------------------------------------------

  describe('searchNotesByDocumentLink', () => {
    it('should search for sme-doc:// links in body', async () => {
      await service.searchNotesByDocumentLink('wr-001', 'doc-abc');
      expect(mockDb.searchRows).toHaveBeenCalledWith(
        'v_notes_with_tags',
        '(&(engagement_id=wr-001)(body=*sme-doc://doc-abc*))',
        undefined,
      );
    });
  });
});
