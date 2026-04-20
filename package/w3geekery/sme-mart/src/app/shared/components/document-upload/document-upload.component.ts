import {
  Component, Input, Output, EventEmitter, inject, signal,
  ChangeDetectionStrategy, HostListener, ElementRef, OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { DocumentService, type UploadProgress } from '../../../core/services/document.service';
import type { EngagementDocument, DocumentType } from '../../../core/models/document.model';

interface FileEntry {
  file: File;
  progress: number;
  done: boolean;
  error?: string;
}

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'security_requirements', label: 'Security Requirements' },
  { value: 'sow', label: 'Statement of Work' },
  { value: 'budget', label: 'Budget / Cost Proposal' },
  { value: 'legal_terms', label: 'Legal Terms' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'functional_spec', label: 'Functional Spec' },
  { value: 'other', label: 'Other' },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentUploadComponent implements OnDestroy {
  @Input({ required: true }) engagementId!: string;
  @Output() uploaded = new EventEmitter<EngagementDocument>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly docService = inject(DocumentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly elRef = inject(ElementRef);
  private progressSub?: Subscription;

  readonly typeOptions = DOCUMENT_TYPE_OPTIONS;
  readonly files = signal<FileEntry[]>([]);
  readonly uploading = signal(false);
  readonly dragOver = signal(false);

  documentType: DocumentType = 'other';
  displayName = '';
  description = '';

  ngOnDestroy(): void {
    this.progressSub?.unsubscribe();
  }

  // ---------------------------------------------------------------------------
  // Drag & Drop
  // ---------------------------------------------------------------------------

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    // Only set false if leaving the host element itself
    if (!this.elRef.nativeElement.contains(event.relatedTarget as Node)) {
      this.dragOver.set(false);
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles) {
      this.addFiles(droppedFiles);
    }
  }

  // ---------------------------------------------------------------------------
  // File selection
  // ---------------------------------------------------------------------------

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(input.files);
      input.value = ''; // Reset so same file can be re-selected
    }
  }

  removeFile(index: number): void {
    this.files.update(files => files.filter((_, i) => i !== index));
  }

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------

  async upload(): Promise<void> {
    const entries = this.files();
    if (entries.length === 0) return;

    this.uploading.set(true);

    // Subscribe to progress updates
    this.progressSub = this.docService.uploadProgress$.subscribe((p: UploadProgress) => {
      this.files.update(files =>
        files.map(f =>
          f.file.name === p.filename
            ? { ...f, progress: p.percent, done: p.done, error: p.error }
            : f,
        ),
      );
    });

    let successCount = 0;
    for (const entry of entries) {
      if (entry.done) continue;
      try {
        const doc = await this.docService.uploadDocument(
          this.engagementId, entry.file, {
            documentType: this.documentType,
            displayName: this.displayName || undefined,
            description: this.description || undefined,
          },
        );
        this.uploaded.emit(doc);
        successCount++;
      } catch (err: any) {
        console.error('[DocumentUpload] Upload failed:', err);
        this.files.update(files =>
          files.map(f =>
            f.file.name === entry.file.name
              ? { ...f, error: err.message || 'Upload failed', done: true }
              : f,
          ),
        );
      }
    }

    this.progressSub?.unsubscribe();
    this.uploading.set(false);

    if (successCount > 0) {
      this.snackBar.open(
        `${successCount} document${successCount > 1 ? 's' : ''} uploaded`,
        'OK', { duration: 3000 },
      );
    }
  }

  cancel(): void {
    this.files.set([]);
    this.cancelled.emit();
  }

  formatSize(bytes: number): string {
    return this.docService.formatFileSize(bytes);
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private addFiles(fileList: FileList): void {
    const newEntries: FileEntry[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > MAX_FILE_SIZE) {
        this.snackBar.open(`${file.name} exceeds 50MB limit`, 'Dismiss', { duration: 5000 });
        continue;
      }
      newEntries.push({ file, progress: 0, done: false });
    }
    this.files.update(files => [...files, ...newEntries]);
  }
}
