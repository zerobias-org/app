import { documentToResource } from './document-resource.mapper';
import type { EngagementDocument } from '../models';

describe('documentToResource', () => {
  const doc: EngagementDocument = {
    id: 'doc-001',
    engagement_id: 'eng-001',
    zb_file_id: 'file-001',
    zb_file_version_id: 'fv-001',
    filename: 'security-requirements.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 204800,
    document_type: 'security_requirements',
    display_name: 'Security Requirements v2',
    description: 'Updated security requirements for Q2',
    zb_task_id: 'task-001',
    zb_task_attachment_id: 'att-001',
    uploaded_by_zerobias_user_id: 'u-100',
    created_at: '2026-01-10T09:00:00Z',
    updated_at: '2026-01-12T14:30:00Z',
    archived: false,
  };

  it('should map core fields', () => {
    const r = documentToResource(doc);
    expect(r.id).toBe('doc-001');
    expect(r.type).toBe('sme-mart:document');
    expect(r.ownerId).toBe('u-100');
    expect(r.description).toBe('Updated security requirements for Q2');
    expect(r.engagementId).toBe('eng-001');
  });

  it('should use display_name when available', () => {
    const r = documentToResource(doc);
    expect(r.name).toBe('Security Requirements v2');
  });

  it('should fallback to filename when display_name is null', () => {
    const noDisplay = { ...doc, display_name: null };
    expect(documentToResource(noDisplay).name).toBe('security-requirements.pdf');
  });

  it('should map parentId from zb_task_id', () => {
    expect(documentToResource(doc).parentId).toBe('task-001');
  });

  it('should set parentId null when no zb_task_id', () => {
    const noTask = { ...doc, zb_task_id: null };
    expect(documentToResource(noTask).parentId).toBeNull();
  });

  it('should set deleted to updated_at when archived', () => {
    const archived = { ...doc, archived: true };
    expect(documentToResource(archived).deleted).toBe('2026-01-12T14:30:00Z');
  });

  it('should set deleted to null when not archived', () => {
    expect(documentToResource(doc).deleted).toBeNull();
  });

  it('should map timestamps', () => {
    const r = documentToResource(doc);
    expect(r.created).toBe('2026-01-10T09:00:00Z');
    expect(r.updated).toBe('2026-01-12T14:30:00Z');
  });
});
