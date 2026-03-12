import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Subject } from 'rxjs';
import { OrgDocumentService } from './org-document.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { SmeMartDbService } from './sme-mart-db.service';
import { DocumentService } from './document.service';
import { ImpersonationService } from './impersonation.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import type { OrgDocument, OrgDocumentDetail, OrgDocumentShare } from '../models/org-document.model';
import { makeOrgDocument, makeOrgDocumentDetail, makeOrgDocumentShare } from '../../test-helpers/factories';
import { TEST_ORG_ID, TEST_DOC_ID, TEST_TAG_ID, TEST_USER_ID, TEST_ENG_ID } from '../../test-helpers/constants';
import { fakeSmeMartDb, fakeImpersonation } from '../../test-helpers/angular';

type MockFn = ReturnType<typeof vi.fn>;

interface MockDocService {
  uploadProgress$: Subject<any>;
  uploadBinary: MockFn;
  getPreviewUrl: MockFn;
  getDownloadUrl: MockFn;
  isPreviewable: MockFn;
  getFileIcon: MockFn;
  formatFileSize: MockFn;
}

interface MockClientApi {
  fileClient: { getFileApi: MockFn; getFolderApi: MockFn };
  hydraClient: { getResourceApi: MockFn };
  toUUID: MockFn;
}

interface MockTagService {
  // Not directly used by OrgDocumentService methods under test, but injected
}

describe('OrgDocumentService', () => {
  let service: OrgDocumentService;
  let mockDb: ReturnType<typeof fakeSmeMartDb>;
  let mockDocService: MockDocService;
  let mockImpersonation: ReturnType<typeof fakeImpersonation>;
  let mockClientApi: MockClientApi;

  beforeEach(() => {
    mockDb = fakeSmeMartDb();
    mockDb.createRow.mockResolvedValue(makeOrgDocument());
    mockDb.getRow.mockResolvedValue(makeOrgDocument());
    mockDb.searchRows.mockResolvedValue({ items: [makeOrgDocumentDetail()] });
    mockDb.updateRow.mockResolvedValue(undefined);
    mockDb.deleteRow.mockResolvedValue(undefined);
    mockDb.neonQueryPublic.mockResolvedValue([makeOrgDocumentDetail()]);

    mockDocService = {
      uploadProgress$: new Subject(),
      uploadBinary: vi.fn().mockResolvedValue('ver-001'),
      getPreviewUrl: vi.fn().mockReturnValue('https://files.example.com/preview/ver-001'),
      getDownloadUrl: vi.fn().mockReturnValue('https://files.example.com/download/ver-001'),
      isPreviewable: vi.fn().mockReturnValue(true),
      getFileIcon: vi.fn().mockReturnValue('picture_as_pdf'),
      formatFileSize: vi.fn().mockReturnValue('100 KB'),
    };

    mockImpersonation = fakeImpersonation();

    mockClientApi = {
      fileClient: {
        getFileApi: vi.fn().mockReturnValue({
          create: vi.fn().mockResolvedValue({ id: { toString: () => 'file-001' } }),
        }),
        getFolderApi: vi.fn().mockReturnValue({
          create: vi.fn().mockResolvedValue({ id: { toString: () => 'folder-001' } }),
        }),
      },
      hydraClient: {
        getResourceApi: vi.fn().mockReturnValue({
          searchResources: vi.fn().mockResolvedValue({ items: [] }),
        }),
      },
      toUUID: vi.fn().mockImplementation((v: string) => v),
    };

    TestBed.configureTestingModule({
      providers: [
        OrgDocumentService,
        { provide: SmeMartDbService, useValue: mockDb },
        { provide: DocumentService, useValue: mockDocService },
        { provide: ImpersonationService, useValue: mockImpersonation },
        { provide: ZerobiasClientApi, useValue: mockClientApi },
        { provide: SmeMartTagService, useValue: {} },
      ],
    });

    service = TestBed.inject(OrgDocumentService);
  });

  // ---------------------------------------------------------------------------
  // List / Get
  // ---------------------------------------------------------------------------

  describe('listDocuments', () => {
    it('should query v_org_document_detail with org filter', async () => {
      const result = await service.listDocuments(TEST_ORG_ID);

      expect(mockDb.searchRows).toHaveBeenCalledTimes(1);
      expect(mockDb.searchRows).toHaveBeenCalledWith(
        'v_org_document_detail',
        expect.stringContaining(TEST_ORG_ID),
        expect.objectContaining({ pageNumber: 1, pageSize: 50 }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(TEST_DOC_ID);
    });

    it('should include documentType in filter when provided', async () => {
      await service.listDocuments(TEST_ORG_ID, { documentType: 'compliance' as any });

      const filter = mockDb.searchRows.mock.calls[0][1] as string;
      expect(filter).toContain('document_type=compliance');
    });

    it('should default archived to false', async () => {
      await service.listDocuments(TEST_ORG_ID);

      const filter = mockDb.searchRows.mock.calls[0][1] as string;
      expect(filter).toContain('archived=false');
    });

    it('should pass archived=true when requested', async () => {
      await service.listDocuments(TEST_ORG_ID, { archived: true });

      const filter = mockDb.searchRows.mock.calls[0][1] as string;
      expect(filter).toContain('archived=true');
    });

    it('should respect custom pagination', async () => {
      await service.listDocuments(TEST_ORG_ID, { pageNumber: 3, pageSize: 10 });

      expect(mockDb.searchRows).toHaveBeenCalledWith(
        'v_org_document_detail',
        expect.any(String),
        expect.objectContaining({ pageNumber: 3, pageSize: 10 }),
      );
    });

    it('should return empty array when no items', async () => {
      mockDb.searchRows.mockResolvedValue({ items: [] });

      const result = await service.listDocuments(TEST_ORG_ID);
      expect(result).toEqual([]);
    });

    it('should return empty array when items is undefined', async () => {
      mockDb.searchRows.mockResolvedValue({});

      const result = await service.listDocuments(TEST_ORG_ID);
      expect(result).toEqual([]);
    });
  });

  describe('getDocument', () => {
    it('should fetch from org_documents table by ID', async () => {
      const result = await service.getDocument(TEST_DOC_ID);

      expect(mockDb.getRow).toHaveBeenCalledWith('org_documents', TEST_DOC_ID);
      expect(result?.id).toBe(TEST_DOC_ID);
    });

    it('should return null when document not found', async () => {
      mockDb.getRow.mockResolvedValue(null);

      const result = await service.getDocument('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('listSharedDocuments', () => {
    it('should execute Neon JOIN query for engagement target', async () => {
      const result = await service.listSharedDocuments('engagement', TEST_ENG_ID, TEST_ORG_ID);

      expect(mockDb.neonQueryPublic).toHaveBeenCalledTimes(1);
      const query = mockDb.neonQueryPublic.mock.calls[0][0] as string;
      expect(query).toContain('org_document_shares');
      expect(query).toContain(TEST_ENG_ID);
      expect(query).toContain(TEST_ORG_ID);
      expect(result).toHaveLength(1);
    });

    it('should work for project target type', async () => {
      const projectId = 'proj-001';
      await service.listSharedDocuments('project', projectId, TEST_ORG_ID);

      const query = mockDb.neonQueryPublic.mock.calls[0][0] as string;
      expect(query).toContain(projectId);
    });

    it('should return empty array when no shared docs', async () => {
      mockDb.neonQueryPublic.mockResolvedValue([]);

      const result = await service.listSharedDocuments('engagement', TEST_ENG_ID, TEST_ORG_ID);
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Sharing
  // ---------------------------------------------------------------------------

  describe('shareDocument', () => {
    it('should create a share row with defaults', async () => {
      await service.shareDocument({
        documentId: TEST_DOC_ID,
        targetType: 'engagement',
        targetId: TEST_ENG_ID,
      });

      expect(mockDb.createRow).toHaveBeenCalledWith('org_document_shares', {
        document_id: TEST_DOC_ID,
        shared_with_type: 'engagement',
        shared_with_id: TEST_ENG_ID,
        visibility: 'all',
        granted_by: TEST_USER_ID,
      });
    });

    it('should respect custom visibility', async () => {
      await service.shareDocument({
        documentId: TEST_DOC_ID,
        targetType: 'engagement',
        targetId: TEST_ENG_ID,
        visibility: 'buyer_only',
      });

      const body = mockDb.createRow.mock.calls[0][1];
      expect(body.visibility).toBe('buyer_only');
    });

    it('should use impersonated user as granted_by', async () => {
      const customUserId = 'impersonated-user-123';
      mockImpersonation.effectiveUserId.mockReturnValue(customUserId);

      await service.shareDocument({
        documentId: TEST_DOC_ID,
        targetType: 'task',
        targetId: 'task-001',
      });

      const body = mockDb.createRow.mock.calls[0][1];
      expect(body.granted_by).toBe(customUserId);
    });
  });

  describe('unshareDocument', () => {
    it('should delete the share row', async () => {
      await service.unshareDocument(TEST_TAG_ID);

      expect(mockDb.deleteRow).toHaveBeenCalledWith('org_document_shares', TEST_TAG_ID);
    });
  });

  describe('listShares', () => {
    it('should search org_document_shares by document_id', async () => {
      mockDb.searchRows.mockResolvedValue({ items: [makeOrgDocumentShare()] });

      const result = await service.listShares(TEST_DOC_ID);

      expect(mockDb.searchRows).toHaveBeenCalledWith(
        'org_document_shares',
        `(document_id=${TEST_DOC_ID})`,
        expect.objectContaining({ pageNumber: 1, pageSize: 100 }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].shared_with_type).toBe('engagement');
    });

    it('should return empty array when no shares exist', async () => {
      mockDb.searchRows.mockResolvedValue({ items: [] });

      const result = await service.listShares(TEST_DOC_ID);
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Archive / Restore
  // ---------------------------------------------------------------------------

  describe('archiveDocument', () => {
    it('should soft-delete by setting archived=true', async () => {
      await service.archiveDocument(TEST_DOC_ID);

      expect(mockDb.updateRow).toHaveBeenCalledWith(
        'org_documents',
        TEST_DOC_ID,
        expect.objectContaining({ archived: true }),
      );
    });

    it('should set updated_at timestamp', async () => {
      await service.archiveDocument(TEST_DOC_ID);

      const updates = mockDb.updateRow.mock.calls[0][2];
      expect(updates.updated_at).toBeDefined();
      // Should be a valid ISO string
      expect(new Date(updates.updated_at).toISOString()).toBe(updates.updated_at);
    });
  });

  describe('restoreDocument', () => {
    it('should restore by setting archived=false', async () => {
      await service.restoreDocument(TEST_DOC_ID);

      expect(mockDb.updateRow).toHaveBeenCalledWith(
        'org_documents',
        TEST_DOC_ID,
        expect.objectContaining({ archived: false }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Update metadata
  // ---------------------------------------------------------------------------

  describe('updateDocument', () => {
    it('should update display_name and description', async () => {
      mockDb.updateRow.mockResolvedValue(makeOrgDocument({ display_name: 'Updated Name' }));

      const result = await service.updateDocument(TEST_DOC_ID, {
        display_name: 'Updated Name',
        description: 'Updated description',
      });

      expect(mockDb.updateRow).toHaveBeenCalledWith(
        'org_documents',
        TEST_DOC_ID,
        expect.objectContaining({
          display_name: 'Updated Name',
          description: 'Updated description',
        }),
      );
      expect(result.display_name).toBe('Updated Name');
    });

    it('should update document_type', async () => {
      mockDb.updateRow.mockResolvedValue(makeOrgDocument({ document_type: 'compliance' as any }));

      await service.updateDocument(TEST_DOC_ID, { document_type: 'compliance' as any });

      const updates = mockDb.updateRow.mock.calls[0][2];
      expect(updates.document_type).toBe('compliance');
    });

    it('should always set updated_at', async () => {
      mockDb.updateRow.mockResolvedValue(makeOrgDocument());

      await service.updateDocument(TEST_DOC_ID, { display_name: 'Test' });

      const updates = mockDb.updateRow.mock.calls[0][2];
      expect(updates.updated_at).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Delegate helpers
  // ---------------------------------------------------------------------------

  describe('getPreviewUrl', () => {
    it('should delegate to DocumentService', () => {
      const url = service.getPreviewUrl('ver-001');
      expect(mockDocService.getPreviewUrl).toHaveBeenCalledWith('ver-001');
      expect(url).toBe('https://files.example.com/preview/ver-001');
    });
  });

  describe('getDownloadUrl', () => {
    it('should delegate to DocumentService', () => {
      const url = service.getDownloadUrl('ver-001');
      expect(mockDocService.getDownloadUrl).toHaveBeenCalledWith('ver-001');
      expect(url).toBe('https://files.example.com/download/ver-001');
    });
  });

  describe('isPreviewable', () => {
    it('should delegate to DocumentService', () => {
      expect(service.isPreviewable('application/pdf')).toBe(true);
      expect(mockDocService.isPreviewable).toHaveBeenCalledWith('application/pdf');
    });

    it('should handle null/undefined', () => {
      mockDocService.isPreviewable.mockReturnValue(false);
      expect(service.isPreviewable(null)).toBe(false);
      expect(service.isPreviewable(undefined)).toBe(false);
    });
  });

  describe('getFileIcon', () => {
    it('should delegate to DocumentService', () => {
      expect(service.getFileIcon('application/pdf')).toBe('picture_as_pdf');
      expect(mockDocService.getFileIcon).toHaveBeenCalledWith('application/pdf');
    });
  });

  describe('formatFileSize', () => {
    it('should delegate to DocumentService', () => {
      expect(service.formatFileSize(102400)).toBe('100 KB');
      expect(mockDocService.formatFileSize).toHaveBeenCalledWith(102400);
    });

    it('should handle null/undefined', () => {
      mockDocService.formatFileSize.mockReturnValue('—');
      expect(service.formatFileSize(null)).toBe('—');
    });
  });
});
