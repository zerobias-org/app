import { noteToResource, noteFolderToResource } from './note-resource.mapper';
import type { Note, NoteFolder } from '../models';

describe('noteToResource', () => {
  const note: Note = {
    id: 'n-001',
    engagement_id: 'eng-001',
    folder_id: 'f-001',
    title: 'Risk Assessment Notes',
    body: 'Detailed risk assessment body text',
    author_zerobias_user_id: 'u-100',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-02-20T14:30:00Z',
    updated_by_zerobias_user_id: 'u-100',
    archived: false,
    access_level: 'boundary',
    meeting_date: null,
    meeting_duration_minutes: null,
    backing_task_id: null,
    injected_to_task_id: null,
    injected_comment_id: null,
    injected_at: null,
    is_meeting_minutes: false,
    boundary_id: 'b-001',
    project_id: 'p-001',
  };

  it('should map core fields', () => {
    const r = noteToResource(note);
    expect(r.id).toBe('n-001');
    expect(r.name).toBe('Risk Assessment Notes');
    expect(r.type).toBe('sme-mart:note');
    expect(r.ownerId).toBe('u-100');
    expect(r.created).toBe('2026-01-15T10:00:00Z');
    expect(r.updated).toBe('2026-02-20T14:30:00Z');
  });

  it('should map parentId from folder_id', () => {
    expect(noteToResource(note).parentId).toBe('f-001');
  });

  it('should map context fields', () => {
    const r = noteToResource(note);
    expect(r.boundaryId).toBe('b-001');
    expect(r.engagementId).toBe('eng-001');
    expect(r.projectId).toBe('p-001');
  });

  it('should truncate description to 500 chars', () => {
    const longBody = 'x'.repeat(600);
    const r = noteToResource({ ...note, body: longBody });
    expect(r.description!.length).toBe(500);
  });

  it('should set deleted to null when not archived', () => {
    expect(noteToResource(note).deleted).toBeNull();
  });

  it('should set deleted to updated_at when archived', () => {
    const archived = { ...note, archived: true };
    expect(noteToResource(archived).deleted).toBe('2026-02-20T14:30:00Z');
  });
});

describe('noteFolderToResource', () => {
  const folder: NoteFolder = {
    id: 'f-001',
    engagement_id: 'eng-001',
    parent_id: null,
    name: 'Compliance',
    description: 'Compliance documents',
    created_by_zerobias_user_id: 'u-100',
    created_at: '2026-01-10T09:00:00Z',
    updated_at: '2026-01-10T09:00:00Z',
    access_level: 'boundary',
    sort_order: 0,
    color: '#ff0000',
  };

  it('should map core fields', () => {
    const r = noteFolderToResource(folder);
    expect(r.id).toBe('f-001');
    expect(r.name).toBe('Compliance');
    expect(r.type).toBe('sme-mart:note-folder');
    expect(r.ownerId).toBe('u-100');
    expect(r.description).toBe('Compliance documents');
  });

  it('should set deleted and boundaryId to null', () => {
    const r = noteFolderToResource(folder);
    expect(r.deleted).toBeNull();
    expect(r.boundaryId).toBeNull();
  });

  it('should map parentId from parent_id', () => {
    const nested = { ...folder, parent_id: 'f-000' };
    expect(noteFolderToResource(nested).parentId).toBe('f-000');
  });
});
