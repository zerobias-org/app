import {
  Component, Input, Output, EventEmitter, inject, signal, computed,
  ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, ElementRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ZbSimplePanelComponent, ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { SafeResourceUrlPipe } from '../../pipes/safe-resource-url.pipe';
import { DocumentService } from '../../../core/services/document.service';
import { OrgDocumentService } from '../../../core/services/org-document.service';
import { DocumentUploadComponent } from '../document-upload/document-upload.component';
import {
  OrgDocumentChooser,
  type OrgDocumentChooserResult,
} from '../org-document-chooser/org-document-chooser.component';
import type { EngagementDocument } from '../../../core/models/document.model';

const DOCTYPE_LABELS: Record<string, string> = {
  security_requirements: 'Security',
  sow: 'SOW',
  budget: 'Budget',
  legal_terms: 'Legal',
  compliance: 'Compliance',
  functional_spec: 'Functional',
  other: 'Other',
};

const DOCTYPE_COLORS: Record<string, string> = {
  security_requirements: '#e57373',
  sow: '#64b5f6',
  budget: '#81c784',
  legal_terms: '#ffb74d',
  compliance: '#ba68c8',
  functional_spec: '#4dd0e1',
  other: '#90a4ae',
};

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatMenuModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
    ZbSimplePanelComponent,
    ZbEmptyStateContainerComponent,
    SafeResourceUrlPipe,
    DocumentUploadComponent,
  ],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentListComponent implements OnInit, OnDestroy {
  @Input({ required: true }) engagementId!: string;
  @Input() isOwner = false;
  @Output() showRelatedNotes = new EventEmitter<string>();

  private readonly docService = inject(DocumentService);
  private readonly orgDocService = inject(OrgDocumentService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly elRef = inject(ElementRef);
  private readonly dialog = inject(MatDialog);

  readonly documents = signal<EngagementDocument[]>([]);
  readonly loading = signal(true);
  readonly showUpload = signal(false);

  // Preview state (keyed by document ID)
  readonly expandedPreviews: Record<string, boolean> = {};
  readonly previewHeights: Record<string, number> = {};
  readonly viewUrls: Record<string, string> = {};
  readonly previewableCache: Record<string, boolean> = {};

  readonly DEFAULT_PREVIEW_HEIGHT = 300;
  private readonly MIN_PREVIEW_HEIGHT = 100;
  private readonly MAX_PREVIEW_HEIGHT = 800;

  // Resize state
  private resizing = false;
  private resizeDocId = '';
  private resizeStartY = 0;
  private resizeStartHeight = 0;

  readonly documentCount = computed(() => this.documents().length);

  /** Document ID to highlight (from query param). */
  readonly highlightDocId = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadDocuments();

    // Auto-expand preview if navigated from a doc link (?doc=UUID)
    const docId = this.route.snapshot.queryParams['doc'];
    if (docId) {
      this.highlightAndExpandDoc(docId);
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onResizeEnd);
  }

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------

  async loadDocuments(): Promise<void> {
    this.loading.set(true);
    try {
      const docs = await this.docService.listDocuments(this.engagementId);
      this.documents.set(docs);
      this.rebuildViewUrls(docs);
    } catch (err: any) {
      this.snackBar.open(`Failed to load documents: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  onDocumentUploaded(_doc: EngagementDocument): void {
    this.loadDocuments();
    this.showUpload.set(false);
  }

  // ---------------------------------------------------------------------------
  // Display helpers
  // ---------------------------------------------------------------------------

  typeLabel(docType: string): string {
    return DOCTYPE_LABELS[docType] || docType;
  }

  typeColor(docType: string): string {
    return DOCTYPE_COLORS[docType] || '#90a4ae';
  }

  fileIcon(mimeType?: string | null): string {
    return this.docService.getFileIcon(mimeType);
  }

  fileSize(bytes?: number | null): string {
    return this.docService.formatFileSize(bytes);
  }

  displayName(doc: EngagementDocument): string {
    return doc.display_name || doc.filename;
  }

  // ---------------------------------------------------------------------------
  // Preview
  // ---------------------------------------------------------------------------

  togglePreview(doc: EngagementDocument): void {
    this.expandedPreviews[doc.id] = !this.expandedPreviews[doc.id];
  }

  /** Highlight a document row and expand its preview if previewable. */
  private highlightAndExpandDoc(docId: string): void {
    this.highlightDocId.set(docId);

    if (this.previewableCache[docId]) {
      this.expandedPreviews[docId] = true;
    }

    // Scroll to the row after Angular renders
    setTimeout(() => {
      const row = this.elRef.nativeElement.querySelector(`[data-doc-id="${docId}"]`);
      row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  openInNewTab(doc: EngagementDocument): void {
    const url = this.viewUrls[doc.id];
    if (url) window.open(url, '_blank');
  }

  onResizeStart(event: MouseEvent, doc: EngagementDocument): void {
    event.preventDefault();
    this.resizing = true;
    this.resizeDocId = doc.id;
    this.resizeStartY = event.clientY;
    this.resizeStartHeight = this.previewHeights[doc.id] ?? this.DEFAULT_PREVIEW_HEIGHT;
    document.addEventListener('mousemove', this.onResizeMove);
    document.addEventListener('mouseup', this.onResizeEnd);
  }

  private onResizeMove = (event: MouseEvent): void => {
    if (!this.resizing) return;
    const deltaY = event.clientY - this.resizeStartY;
    const newHeight = Math.max(
      this.MIN_PREVIEW_HEIGHT,
      Math.min(this.MAX_PREVIEW_HEIGHT, this.resizeStartHeight + deltaY),
    );
    this.previewHeights[this.resizeDocId] = newHeight;
    this.cdr.detectChanges();
  };

  private onResizeEnd = (): void => {
    this.resizing = false;
    document.removeEventListener('mousemove', this.onResizeMove);
    document.removeEventListener('mouseup', this.onResizeEnd);
  };

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async archiveDocument(doc: EngagementDocument): Promise<void> {
    try {
      await this.docService.archiveDocument(doc.id);
      this.snackBar.open('Document archived', 'OK', { duration: 3000 });
      await this.loadDocuments();
    } catch (err: any) {
      this.snackBar.open(`Archive failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  downloadDocument(doc: EngagementDocument): void {
    const url = this.docService.getDownloadUrl(doc.zb_file_version_id);
    window.open(url, '_blank');
  }

  // ---------------------------------------------------------------------------
  // Library chooser
  // ---------------------------------------------------------------------------

  openLibrary(): void {
    const ref = this.dialog.open(OrgDocumentChooser, {
      width: '600px',
      data: {
        scope: 'engagement',
        engagementId: this.engagementId,
        multiple: true,
        title: 'Attach Documents from Library',
      },
    });
    ref.afterClosed().subscribe(async (result: OrgDocumentChooserResult | null) => {
      if (!result) return;
      const allDocs = [...result.selected, ...result.uploaded];
      if (allDocs.length === 0) return;

      let shared = 0;
      for (const doc of allDocs) {
        try {
          await this.orgDocService.shareDocument({
            documentId: doc.id,
            targetType: 'engagement',
            targetId: this.engagementId,
          });
          shared++;
        } catch (err) {
          console.warn('[DocumentList] Share failed for doc:', doc.id, err);
        }
      }

      if (shared > 0) {
        this.snackBar.open(`${shared} document(s) attached`, 'OK', { duration: 3000 });
        await this.loadDocuments();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private rebuildViewUrls(docs: EngagementDocument[]): void {
    for (const doc of docs) {
      this.viewUrls[doc.id] = this.docService.getPreviewUrl(doc.zb_file_version_id);
      this.previewableCache[doc.id] = this.docService.isPreviewable(doc.mime_type);
    }
  }
}
