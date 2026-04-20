import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { DocumentUploadComponent } from './document-upload.component';
import { DocumentService, type UploadProgress } from '../../../core/services/document.service';
import { makeFile } from '../../../test-helpers/factories';

type MockFn = ReturnType<typeof vi.fn>;

interface MockDocService {
  uploadProgress$: Subject<UploadProgress>;
  uploadDocument: MockFn;
  formatFileSize: MockFn;
}

describe('DocumentUploadComponent', () => {
  let component: DocumentUploadComponent;
  let mockDocService: MockDocService;

  beforeEach(() => {
    mockDocService = {
      uploadProgress$: new Subject<UploadProgress>(),
      uploadDocument: vi.fn().mockResolvedValue({
        id: 'doc-001',
        filename: 'test.pdf',
        document_type: 'other',
      }),
      formatFileSize: vi.fn().mockReturnValue('1 KB'),
    };

    TestBed.configureTestingModule({
      imports: [DocumentUploadComponent],
      providers: [
        provideNoopAnimations(),
        { provide: DocumentService, useValue: mockDocService },
      ],
    });

    const fixture = TestBed.createComponent(DocumentUploadComponent);
    component = fixture.componentInstance;
    component.engagementId = 'eng-001';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty file list', () => {
      expect(component.files()).toEqual([]);
    });

    it('should not be uploading', () => {
      expect(component.uploading()).toBe(false);
    });

    it('should not be in drag-over state', () => {
      expect(component.dragOver()).toBe(false);
    });

    it('should default documentType to other', () => {
      expect(component.documentType).toBe('other');
    });
  });

  describe('file selection', () => {
    it('should add file via onFileSelected', () => {
      const file = makeFile('test.pdf');
      const mockInput = { target: { files: [file] as any, value: '' } } as any;
      component.onFileSelected(mockInput);

      expect(component.files()).toHaveLength(1);
      expect(component.files()[0].file.name).toBe('test.pdf');
      expect(component.files()[0].progress).toBe(0);
      expect(component.files()[0].done).toBe(false);
    });

    it('should reject files over 50MB', () => {
      const bigFile = makeFile('huge.pdf', 51 * 1024 * 1024);
      const mockInput = { target: { files: [bigFile] as any, value: '' } } as any;
      component.onFileSelected(mockInput);

      expect(component.files()).toHaveLength(0);
    });

    it('should remove file by index', () => {
      const f1 = makeFile('a.pdf');
      const f2 = makeFile('b.pdf');
      const mockInput = { target: { files: [f1, f2] as any, value: '' } } as any;
      component.onFileSelected(mockInput);
      expect(component.files()).toHaveLength(2);

      component.removeFile(0);
      expect(component.files()).toHaveLength(1);
      expect(component.files()[0].file.name).toBe('b.pdf');
    });
  });

  describe('drag and drop', () => {
    it('should set dragOver on dragover', () => {
      const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as any;
      component.onDragOver(event);
      expect(component.dragOver()).toBe(true);
    });

    it('should accept dropped files', () => {
      const file = makeFile('dropped.pdf');
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files: [file] as any },
      } as any;

      component.onDrop(event);
      expect(component.dragOver()).toBe(false);
      expect(component.files()).toHaveLength(1);
      expect(component.files()[0].file.name).toBe('dropped.pdf');
    });
  });

  describe('upload', () => {
    it('should call docService.uploadDocument for each file', async () => {
      const file = makeFile('test.pdf');
      const mockInput = { target: { files: [file] as any, value: '' } } as any;
      component.onFileSelected(mockInput);

      await component.upload();

      expect(mockDocService.uploadDocument).toHaveBeenCalledWith(
        'eng-001',
        file,
        expect.objectContaining({ documentType: 'other' }),
      );
    });

    it('should set uploading flag during upload', async () => {
      const file = makeFile('test.pdf');
      const mockInput = { target: { files: [file] as any, value: '' } } as any;
      component.onFileSelected(mockInput);

      expect(component.uploading()).toBe(false);
      const promise = component.upload();
      expect(component.uploading()).toBe(true);
      await promise;
      expect(component.uploading()).toBe(false);
    });

    it('should emit uploaded event on success', async () => {
      const emitSpy = vi.spyOn(component.uploaded, 'emit');
      const file = makeFile('test.pdf');
      const mockInput = { target: { files: [file] as any, value: '' } } as any;
      component.onFileSelected(mockInput);

      await component.upload();
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('should no-op when no files', async () => {
      await component.upload();
      expect(mockDocService.uploadDocument).not.toHaveBeenCalled();
    });

    it('should handle upload errors gracefully', async () => {
      mockDocService.uploadDocument.mockRejectedValue(new Error('Network error'));
      const file = makeFile('fail.pdf');
      const mockInput = { target: { files: [file] as any, value: '' } } as any;
      component.onFileSelected(mockInput);

      await component.upload();

      expect(component.uploading()).toBe(false);
      expect(component.files()[0].error).toBe('Network error');
    });
  });

  describe('cancel', () => {
    it('should clear files and emit cancelled', () => {
      const cancelSpy = vi.spyOn(component.cancelled, 'emit');
      const file = makeFile('test.pdf');
      const mockInput = { target: { files: [file] as any, value: '' } } as any;
      component.onFileSelected(mockInput);

      component.cancel();
      expect(component.files()).toEqual([]);
      expect(cancelSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('formatSize', () => {
    it('should delegate to DocumentService', () => {
      expect(component.formatSize(1024)).toBe('1 KB');
      expect(mockDocService.formatFileSize).toHaveBeenCalledWith(1024);
    });
  });
});
