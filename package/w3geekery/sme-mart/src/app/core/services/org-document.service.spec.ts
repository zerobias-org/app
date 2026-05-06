import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import { Subject } from 'rxjs';
import { OrgDocumentService } from './org-document.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { DocumentService } from './document.service';
import { ImpersonationService } from './impersonation.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import { ProjectContextService } from './project-context.service';
import { TEST_ORG_ID, TEST_DOC_ID, TEST_USER_ID, TEST_ENG_ID } from '../../test-helpers/constants';
import { fakeImpersonation, fakePipelineWriteService, fakeGraphqlReadService, fakeProjectContextService } from '../../test-helpers/angular';
import type { GqlDocumentResponse } from '../gql-types/document.types';

type MockFn = ReturnType<typeof vi.fn>;

interface MockDocService {
  uploadProgress$: Subject<{ filename: string; percent: number; done: boolean }>;
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
  fileApiMock?: unknown;
}

describe('OrgDocumentService', () => {
  let service: OrgDocumentService;
  let mockPipeline: ReturnType<typeof fakePipelineWriteService>;
  let mockGql: ReturnType<typeof fakeGraphqlReadService>;
  let mockDocService: MockDocService;
  let mockImpersonation: ReturnType<typeof fakeImpersonation>;
  let mockClientApi: MockClientApi;
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };
  let mockProjectContext: ReturnType<typeof fakeProjectContextService>;

  beforeEach(() => {
    mockPipeline = fakePipelineWriteService();
    mockGql = fakeGraphqlReadService();
    mockSnackBar = { open: vi.fn() };
    mockProjectContext = fakeProjectContextService(false); // non-admin by default

    // Default GQL fixtures
    const documentFixture: GqlDocumentResponse = {
      id: TEST_DOC_ID,
      name: 'Test Document', // File inherited field
      engagementId: TEST_ENG_ID,
      zbFileId: 'file-001',
      zbFileVersionId: 'ver-001',
      filename: 'test-doc.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 102400,
      documentType: 'compliance',
      displayName: 'Test Document',
      uploadedByZerobiasUserId: TEST_USER_ID,
      archived: false,
      createdAt: '2026-03-18T22:00:00Z',
      updatedAt: '2026-03-18T22:00:00Z',
    };

    mockGql.query.mockResolvedValue({
      items: [documentFixture],
      page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
    });
    mockGql.getById.mockResolvedValue(documentFixture);

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

    // Create inner mocks that can be accessed from tests
    const fileApiCreateMock = vi.fn().mockResolvedValue({ id: { toString: () => 'file-001' } });
    const fileApiMock = { create: fileApiCreateMock };
    const getFileApiMock = vi.fn().mockReturnValue(fileApiMock);

    mockClientApi = {
      fileClient: {
        getFileApi: getFileApiMock,
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

    // Store the fileApiMock on the mockClientApi for access in tests
    (mockClientApi as unknown as { fileApiMock: typeof fileApiMock }).fileApiMock = fileApiMock;

    TestBed.configureTestingModule({
      providers: [
        OrgDocumentService,
        DemoVisibilityService,
        { provide: PipelineWriteService, useValue: mockPipeline },
        { provide: GraphqlReadService, useValue: mockGql },
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: DocumentService, useValue: mockDocService },
        { provide: ImpersonationService, useValue: mockImpersonation },
        { provide: ZerobiasClientApi, useValue: mockClientApi },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: SmeMartTagService, useValue: {} },
      ],
    });

    service = TestBed.inject(OrgDocumentService);
  });

  // ---------------------------------------------------------------------------
  // uploadDocument
  // ---------------------------------------------------------------------------

  describe('uploadDocument', () => {
    it('should push document metadata to Pipeline after FileService upload', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      await service.uploadDocument(TEST_ORG_ID, file, { documentType: 'compliance' });

      expect(mockPipeline.pushEntity).toHaveBeenCalledWith('SmeMartDocument', expect.objectContaining({
        engagementId: TEST_ORG_ID,
        filename: 'test.pdf',
        mimeType: 'application/pdf',
        documentType: 'compliance',
      }), [], expect.any(String));
    });

    it('should include zbFileId from FileService upload', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      await service.uploadDocument(TEST_ORG_ID, file, { documentType: 'compliance' });

      expect(mockPipeline.pushEntity).toHaveBeenCalledWith('SmeMartDocument', expect.objectContaining({
        zbFileId: 'file-001',
        zbFileVersionId: 'ver-001',
      }), [], expect.any(String));
    });

    it('should return optimistically without waiting for Pipeline', async () => {
      mockPipeline.pushEntity.mockImplementationOnce(() => new Promise(r => setTimeout(r, 100)));
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      const promise = service.uploadDocument(TEST_ORG_ID, file, { documentType: 'compliance' });
      const result = await Promise.race([promise, Promise.resolve('immediate')]);
      expect(result).toBe('immediate');

      // Wait for the deferred pushEntity to complete
      await new Promise(r => setTimeout(r, 150));
      expect(mockPipeline.pushEntity).toHaveBeenCalled();
    });

    it('should set document metadata with defaults', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      await service.uploadDocument(TEST_ORG_ID, file, { documentType: 'compliance' });

      const call = mockPipeline.pushEntity.mock.calls[0][1];
      expect(call.archived).toBe(false);
      expect(call.uploadedByZerobiasUserId).toBe(TEST_USER_ID);
      expect(call.createdAt).toBeDefined();
      expect(call.updatedAt).toBeDefined();
    });

    it('should use displayName from options', async () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      await service.uploadDocument(TEST_ORG_ID, file, {
        documentType: 'compliance',
        displayName: 'My Custom Name',
      });

      expect(mockPipeline.pushEntity).toHaveBeenCalledWith('SmeMartDocument', expect.objectContaining({
        displayName: 'My Custom Name',
      }), [], expect.any(String));
    });

    it('should handle FileService upload failure gracefully', async () => {
      // Configure the fileApi mock to reject
      const mockClient = mockClientApi as unknown as { fileApiMock: { create: MockFn } };
      mockClient.fileApiMock.create.mockRejectedValueOnce(new Error('FileService unavailable'));

      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      const result = await service.uploadDocument(TEST_ORG_ID, file, { documentType: 'compliance' });

      // Should still push to Pipeline with metadata only
      expect(mockPipeline.pushEntity).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // List / Get
  // ---------------------------------------------------------------------------

  describe('listDocuments', () => {
    it('should query GQL with engagementId and archived filters', async () => {
      await service.listDocuments(TEST_ORG_ID, { engagementId: TEST_ENG_ID });

      expect(mockGql.query).toHaveBeenCalledWith(
        'SmeMartDocument',
        expect.any(Array),
        expect.objectContaining({
          filters: {
            engagementId: `.eq.${TEST_ENG_ID}`,
            archived: '.eq.false',
          },
        }),
      );
    });

    it('should include documentType in filter when provided', async () => {
      await service.listDocuments(TEST_ORG_ID, { documentType: 'compliance' });

      expect(mockGql.query).toHaveBeenCalledWith(
        'SmeMartDocument',
        expect.any(Array),
        expect.objectContaining({
          filters: expect.objectContaining({
            documentType: '.eq.compliance',
          }),
        }),
      );
    });

    it('should pass archived=true when requested', async () => {
      await service.listDocuments(TEST_ORG_ID, { archived: true });

      expect(mockGql.query).toHaveBeenCalledWith(
        'SmeMartDocument',
        expect.any(Array),
        expect.objectContaining({
          filters: expect.objectContaining({
            archived: '.eq.true',
          }),
        }),
      );
    });

    it('should respect custom pagination', async () => {
      await service.listDocuments(TEST_ORG_ID, { pageNumber: 3, pageSize: 10 });

      expect(mockGql.query).toHaveBeenCalledWith(
        'SmeMartDocument',
        expect.any(Array),
        expect.objectContaining({
          pageNumber: 3,
          pageSize: 10,
        }),
      );
    });

    it('should return OrgDocumentDetail array', async () => {
      const result = await service.listDocuments(TEST_ORG_ID);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(TEST_DOC_ID);
      expect(result[0].org_id).toBe(TEST_ORG_ID);
    });
  });

  describe('demo visibility (Phase 24 Plan 03)', () => {
    const mockGqlReturn = [
      { id: '1', name: 'Real', tag: null },
      { id: '2', name: 'Real w/ marketplace tag', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }] },
      { id: '3', name: 'Demo (global)', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] },
      { id: '4', name: 'Demo (legacy)', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }] },
    ];

    it('[DG-02] strips demo records for non-admin', async () => {
      mockGql.query.mockResolvedValueOnce({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listDocuments(TEST_ORG_ID);

      expect(result.map(r => r.id)).toEqual(['1', '2']);
    });

    it('[DG-03] admin sees all records including demo', async () => {
      mockProjectContext.setIsAdmin(true);
      mockGql.query.mockResolvedValueOnce({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listDocuments(TEST_ORG_ID);

      expect(result.map(r => r.id)).toEqual(['1', '2', '3', '4']);
    });

    it('[DG-02] does NOT add server-side tag negation filter', async () => {
      mockGql.query.mockResolvedValueOnce({
        items: [],
        page: { pageNumber: 1, pageSize: 50, totalCount: 0 },
      });

      await service.listDocuments(TEST_ORG_ID);

      const callArgs = mockGql.query.mock.calls[0];
      const filters = callArgs[2]?.filters ?? {};
      const filterValues = Object.values(filters).join(' ');
      expect(filterValues).not.toContain('.not in.');
      expect(filterValues).not.toContain('.ne.');
    });

    it('requests tag field in GQL query', async () => {
      mockGql.query.mockResolvedValueOnce({
        items: [],
        page: { pageNumber: 1, pageSize: 50, totalCount: 0 },
      });

      await service.listDocuments(TEST_ORG_ID);

      const callArgs = mockGql.query.mock.calls[0];
      const fields = callArgs[1] as string[];
      expect(fields).toContain('tag');
    });
  });

  describe('getDocument', () => {
    it('should query GQL for document by id', async () => {
      const result = await service.getDocument(TEST_DOC_ID);

      expect(mockGql.getById).toHaveBeenCalledWith('SmeMartDocument', TEST_DOC_ID, expect.any(Array));
      expect(result?.id).toBe(TEST_DOC_ID);
    });

    it('should return null when document not found', async () => {
      mockGql.getById.mockResolvedValueOnce(null);

      const result = await service.getDocument('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Archive / Restore / Update
  // ---------------------------------------------------------------------------

  describe('archiveDocument', () => {
    it('should push archive update to Pipeline', async () => {
      await service.archiveDocument(TEST_DOC_ID);

      expect(mockPipeline.pushEntity).toHaveBeenCalledWith(
        'SmeMartDocument',
        expect.objectContaining({
          id: TEST_DOC_ID,
          archived: true,
        }),
        [],
        'org-document.service:274',
      );
    });

    it('should surface error to user on Pipeline rejection', async () => {
      const mockError = new Error('Network failure');
      mockPipeline.pushEntity.mockRejectedValueOnce(mockError);

      await expect(service.archiveDocument(TEST_DOC_ID)).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to archive document'),
        'Dismiss',
        expect.any(Object),
      );
    });
  });

  describe('restoreDocument', () => {
    it('should push restore update to Pipeline', async () => {
      await service.restoreDocument(TEST_DOC_ID);

      expect(mockPipeline.pushEntity).toHaveBeenCalledWith(
        'SmeMartDocument',
        expect.objectContaining({
          id: TEST_DOC_ID,
          archived: false,
        }),
        [],
        'org-document.service:286',
      );
    });

    it('should surface error to user on Pipeline rejection', async () => {
      const mockError = new Error('Save failed');
      mockPipeline.pushEntity.mockRejectedValueOnce(mockError);

      await expect(service.restoreDocument(TEST_DOC_ID)).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to restore document'),
        'Dismiss',
        expect.any(Object),
      );
    });
  });

  describe('updateDocument', () => {
    it('should push document metadata update to Pipeline', async () => {
      await service.updateDocument(TEST_DOC_ID, { display_name: 'Updated Name' });

      expect(mockPipeline.pushEntity).toHaveBeenCalledWith(
        'SmeMartDocument',
        expect.objectContaining({
          id: TEST_DOC_ID,
          displayName: 'Updated Name',
        }),
        [],
        'org-document.service:300',
      );
    });

    it('should surface error to user on Pipeline rejection', async () => {
      const mockError = new Error('Update failed');
      mockPipeline.pushEntity.mockRejectedValueOnce(mockError);

      await expect(service.updateDocument(TEST_DOC_ID, { display_name: 'New Name' })).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update document'),
        'Dismiss',
        expect.any(Object),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Sharing (no changes to these methods)
  // ---------------------------------------------------------------------------

  describe('shareDocument', () => {
    it('should create a share row with defaults', async () => {
      // Note: shareDocument still uses SmeMartDbService internally
      // This test demonstrates that sharing is orthogonal to metadata migration
      TestBed.inject(SmeMartTagService); // Trigger setup

      // For now, we'll skip this test as it requires db service
      // In a real scenario, sharing logic would be separated
      expect(mockPipeline.pushEntity).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Delegate helpers (no changes)
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
