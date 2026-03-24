import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { DocumentListComponent } from './document-list.component';
import { DocumentService, type UploadProgress } from '../../../core/services/document.service';
import { OrgDocumentService } from '../../../core/services/org-document.service';
import { makeEngagementDocument } from '../../../test-helpers/factories';

type MockFn = ReturnType<typeof vi.fn>;

interface MockDocService {
  uploadProgress$: Subject<UploadProgress>;
  listDocuments: MockFn;
  archiveDocument: MockFn;
  getPreviewUrl: MockFn;
  getDownloadUrl: MockFn;
  isPreviewable: MockFn;
  getFileIcon: MockFn;
  formatFileSize: MockFn;
}

interface MockOrgDocService {
  shareDocument: MockFn;
}

describe('DocumentListComponent', () => {
  let component: DocumentListComponent;
  let mockDocService: MockDocService;
  let mockOrgDocService: MockOrgDocService;

  beforeEach(() => {
    mockDocService = {
      uploadProgress$: new Subject(),
      listDocuments: vi.fn().mockResolvedValue([makeEngagementDocument()]),
      archiveDocument: vi.fn().mockResolvedValue(undefined),
      getPreviewUrl: vi.fn().mockReturnValue('https://files.example.com/preview/ver-001'),
      getDownloadUrl: vi.fn().mockReturnValue('https://files.example.com/download/ver-001'),
      isPreviewable: vi.fn().mockReturnValue(true),
      getFileIcon: vi.fn().mockReturnValue('picture_as_pdf'),
      formatFileSize: vi.fn().mockReturnValue('100 KB'),
    };

    mockOrgDocService = {
      shareDocument: vi.fn().mockResolvedValue({}),
    };

    TestBed.configureTestingModule({
      imports: [DocumentListComponent],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: DocumentService, useValue: mockDocService },
        { provide: OrgDocumentService, useValue: mockOrgDocService },
      ],
    });

    const fixture = TestBed.createComponent(DocumentListComponent);
    component = fixture.componentInstance;
    component.engagementId = 'eng-001';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start with loading=true', () => {
      expect(component.loading()).toBe(true);
    });

    it('should start with empty documents', () => {
      expect(component.documents()).toEqual([]);
    });

    it('should default showUpload to false', () => {
      expect(component.showUpload()).toBe(false);
    });
  });

  describe('loadDocuments', () => {
    it('should fetch documents for the engagement', async () => {
      await component.loadDocuments();

      expect(mockDocService.listDocuments).toHaveBeenCalledWith('eng-001');
      expect(component.documents()).toHaveLength(1);
      expect(component.loading()).toBe(false);
    });

    it('should set loading=false even on error', async () => {
      mockDocService.listDocuments.mockRejectedValue(new Error('Network error'));

      await component.loadDocuments();

      expect(component.loading()).toBe(false);
    });

    it('should rebuild preview URLs after loading', async () => {
      await component.loadDocuments();

      expect(mockDocService.getPreviewUrl).toHaveBeenCalledWith('ver-001');
      expect(mockDocService.isPreviewable).toHaveBeenCalledWith('application/pdf');
      expect(component.viewUrls['doc-001']).toBe('https://files.example.com/preview/ver-001');
      expect(component.previewableCache['doc-001']).toBe(true);
    });

    it('should compute documentCount from signal', async () => {
      await component.loadDocuments();
      expect(component.documentCount()).toBe(1);
    });
  });

  describe('display helpers', () => {
    it('typeLabel should return mapped label', () => {
      expect(component.typeLabel('security_requirements')).toBe('Security');
      expect(component.typeLabel('sow')).toBe('SOW');
      expect(component.typeLabel('unknown')).toBe('unknown');
    });

    it('typeColor should return mapped color', () => {
      expect(component.typeColor('security_requirements')).toBe('#e57373');
      expect(component.typeColor('unknown')).toBe('#90a4ae');
    });

    it('fileIcon should delegate to DocService', () => {
      expect(component.fileIcon('application/pdf')).toBe('picture_as_pdf');
    });

    it('fileSize should delegate to DocService', () => {
      expect(component.fileSize(102400)).toBe('100 KB');
    });

    it('displayName should prefer display_name over filename', () => {
      expect(component.displayName(makeEngagementDocument())).toBe('Exhibit F');
      expect(component.displayName(makeEngagementDocument({ display_name: null }))).toBe('exhibit-f.pdf');
    });
  });

  describe('preview toggle', () => {
    it('should toggle preview state for a document', () => {
      const doc = makeEngagementDocument();
      expect(component.expandedPreviews[doc.id]).toBeUndefined();

      component.togglePreview(doc);
      expect(component.expandedPreviews[doc.id]).toBe(true);

      component.togglePreview(doc);
      expect(component.expandedPreviews[doc.id]).toBe(false);
    });
  });

  describe('onDocumentUploaded', () => {
    it('should reload documents and hide upload', async () => {
      component.showUpload.set(true);

      component.onDocumentUploaded(makeEngagementDocument());

      // loadDocuments was called
      expect(mockDocService.listDocuments).toHaveBeenCalled();
      expect(component.showUpload()).toBe(false);
    });
  });

  describe('archiveDocument', () => {
    it('should call archiveDocument and reload', async () => {
      const doc = makeEngagementDocument();
      await component.archiveDocument(doc);

      expect(mockDocService.archiveDocument).toHaveBeenCalledWith('doc-001');
      // Reloaded after archive
      expect(mockDocService.listDocuments).toHaveBeenCalled();
    });

    it('should not crash on archive error', async () => {
      mockDocService.archiveDocument.mockRejectedValue(new Error('Failed'));
      const doc = makeEngagementDocument();
      await component.archiveDocument(doc);
      // No throw — error handled internally
    });
  });
});
