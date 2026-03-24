import {
  Component, inject, signal, computed, ChangeDetectionStrategy, OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ZbDialogComponent } from '@zerobias-org/ngx-library';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { OrgDocumentService } from '../../../core/services/org-document.service';
import type { OrgDocumentDetail } from '../../../core/models/org-document.model';
import type { DocumentType } from '../../../core/models/document.model';

export type ChooserScope = 'org' | 'engagement' | 'project';

export interface OrgDocumentChooserData {
  /** Scope determines which documents are shown first. */
  scope: ChooserScope;
  /** If scope is 'engagement', pass the engagement ID to show shared docs first. */
  engagementId?: string;
  /** If scope is 'project', pass the project ID. */
  projectId?: string;
  /** Allow multiple selection. Default: true */
  multiple?: boolean;
  /** Document type filter. */
  documentType?: DocumentType;
  /** Dialog title override. */
  title?: string;
}

export interface OrgDocumentChooserResult {
  /** Selected existing documents. */
  selected: OrgDocumentDetail[];
  /** Newly uploaded documents (uploaded during this dialog session). */
  uploaded: OrgDocumentDetail[];
}

const DOCTYPE_LABELS: Record<string, string> = {
  security_requirements: 'Security',
  sow: 'SOW',
  budget: 'Budget',
  legal_terms: 'Legal',
  compliance: 'Compliance',
  functional_spec: 'Functional',
  other: 'Other',
};

@Component({
  selector: 'app-org-document-chooser',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatCheckboxModule, MatTabsModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatChipsModule, MatTooltipModule,
    ZbDialogComponent,
  ],
  template: `
    <zb-dialog
      [title]="dialogTitle()"
      subTitle="Select existing documents or upload new ones"
      actionLabel="Attach Selected"
      [actionDisabled]="totalSelected() === 0"
      cancelLabel="Cancel"
      [showCloseX]="true"
      (action)="confirm()"
      (cancel)="close()"
    >
      <div class="chooser-content">
        <mat-tab-group animationDuration="200ms" (selectedTabChange)="activeTab.set($event.index)">
          <!-- Tab 1: Browse Existing -->
          <mat-tab label="Org Files">
            <div class="tab-body">
              <!-- Search + Filter -->
              <div class="browse-toolbar">
                <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
                  <mat-icon matPrefix>search</mat-icon>
                  <input matInput
                    placeholder="Search documents..."
                    [ngModel]="searchQuery()"
                    (ngModelChange)="searchQuery.set($event)">
                </mat-form-field>

                @if (!data.documentType) {
                  <mat-form-field appearance="outline" class="type-filter" subscriptSizing="dynamic">
                    <mat-select [value]="typeFilter()" (selectionChange)="typeFilter.set($event.value)" placeholder="All Types">
                      <mat-option [value]="null">All Types</mat-option>
                      @for (type of docTypes; track type.value) {
                        <mat-option [value]="type.value">{{ type.label }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                }
              </div>

              @if (loading()) {
                <div class="loading-state">
                  <mat-spinner diameter="32" />
                  <span>Loading documents...</span>
                </div>
              } @else if (filteredDocs().length === 0) {
                <div class="empty-state">
                  <mat-icon>folder_off</mat-icon>
                  <p>No documents found.</p>
                </div>
              } @else {
                <div class="doc-list">
                  @for (doc of filteredDocs(); track doc.id) {
                    <div class="doc-row"
                      [class.selected]="isSelected(doc.id)"
                      (click)="toggleDoc(doc)">
                      <mat-checkbox
                        [checked]="isSelected(doc.id)"
                        (click)="$event.stopPropagation()"
                        (change)="toggleDoc(doc)" />
                      <mat-icon class="file-icon">{{ docService.getFileIcon(doc.mime_type) }}</mat-icon>
                      <div class="doc-info">
                        <span class="doc-name">{{ doc.display_name || doc.filename }}</span>
                        <span class="doc-meta">
                          <span class="type-chip">{{ typeLabel(doc.document_type) }}</span>
                          {{ docService.formatFileSize(doc.file_size_bytes) }}
                        </span>
                      </div>
                      @if (doc.engagement_share_count > 0 || doc.project_share_count > 0) {
                        <mat-icon class="shared-badge" matTooltip="Shared">share</mat-icon>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </mat-tab>

          <!-- Tab 2: Upload New -->
          <mat-tab label="Upload New">
            <div class="tab-body">
              <div class="upload-zone"
                (dragover)="onDragOver($event)"
                (dragleave)="dragging.set(false)"
                (drop)="onDrop($event)"
                [class.drag-active]="dragging()"
                (click)="triggerUpload()">
                <mat-icon class="upload-icon">cloud_upload</mat-icon>
                <h3>Drag & drop files here</h3>
                <p>or click to browse</p>
                <input #fileInput type="file" multiple hidden (change)="onFilesSelected($event)">
              </div>

              @if (data.documentType) {
                <p class="upload-hint">Files will be tagged as <strong>{{ typeLabel(data.documentType) }}</strong></p>
              }

              @if (uploading()) {
                <div class="upload-progress">
                  <mat-spinner diameter="24" />
                  <span>Uploading...</span>
                </div>
              }

              @if (uploadedDocs().length > 0) {
                <div class="uploaded-list">
                  <h4>Uploaded ({{ uploadedDocs().length }})</h4>
                  @for (doc of uploadedDocs(); track doc.id) {
                    <div class="doc-row uploaded">
                      <mat-icon class="file-icon">{{ docService.getFileIcon(doc.mime_type) }}</mat-icon>
                      <div class="doc-info">
                        <span class="doc-name">{{ doc.display_name || doc.filename }}</span>
                        <span class="doc-meta">{{ docService.formatFileSize(doc.file_size_bytes) }}</span>
                      </div>
                      <mat-icon class="check-icon">check_circle</mat-icon>
                    </div>
                  }
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>

        @if (totalSelected() > 0 || uploadedDocs().length > 0) {
          <div class="selection-summary">
            @if (selectedIds().size > 0) {
              <span>{{ selectedIds().size }} selected</span>
            }
            @if (selectedIds().size > 0 && uploadedDocs().length > 0) {
              <span> + </span>
            }
            @if (uploadedDocs().length > 0) {
              <span>{{ uploadedDocs().length }} uploaded</span>
            }
          </div>
        }
      </div>
    </zb-dialog>
  `,
  styles: [`
    .chooser-content {
      min-width: 480px;
      max-width: 600px;
    }

    .tab-body { padding: 16px 0; }

    .browse-toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }
    .search-field { flex: 1; }
    .type-filter { width: 140px; }

    .loading-state, .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 32px 0;
      color: var(--mat-sys-on-surface-variant, #666);
    }
    .empty-state {
      flex-direction: column;
      mat-icon { font-size: 36px; width: 36px; height: 36px; }
    }

    .doc-list {
      max-height: 340px;
      overflow-y: auto;
      border: 1px solid var(--mat-sys-outline-variant, #e0e0e0);
      border-radius: 8px;
    }

    .doc-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--mat-sys-outline-variant, #f0f0f0);
      cursor: pointer;
      transition: background 0.15s;

      &:last-child { border-bottom: none; }
      &:hover { background: var(--mat-sys-surface-variant, #f5f5f5); }
      &.selected { background: color-mix(in srgb, var(--mat-sys-primary, #1976d2) 8%, transparent); }
      &.uploaded { cursor: default; }
    }

    .file-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: var(--mat-sys-primary, #1976d2);
      flex-shrink: 0;
    }

    .doc-info { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .doc-name {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .doc-meta {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant, #666);
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .type-chip {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      background: var(--mat-sys-surface-container, #f0f0f0);
      color: var(--mat-sys-on-surface-variant, #555);
    }

    .shared-badge {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--mat-sys-on-surface-variant, #999);
    }

    .check-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--mat-sys-primary, #1976d2);
    }

    /* Upload zone */
    .upload-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      border: 2px dashed var(--mat-sys-outline-variant, #ccc);
      border-radius: 12px;
      cursor: pointer;
      text-align: center;
      transition: border-color 0.2s, background 0.2s;

      &:hover, &.drag-active {
        border-color: var(--mat-sys-primary, #1976d2);
        background: color-mix(in srgb, var(--mat-sys-primary, #1976d2) 5%, transparent);
      }

      h3 { margin: 8px 0 4px; font-weight: 500; }
      p { margin: 0; font-size: 14px; color: var(--mat-sys-on-surface-variant, #666); }
    }
    .upload-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--mat-sys-primary, #1976d2);
    }

    .upload-hint {
      margin: 12px 0 0;
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant, #666);
      text-align: center;
    }

    .upload-progress {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
      padding: 12px 0;
      font-size: 13px;
    }

    .uploaded-list {
      margin-top: 16px;
      h4 { margin: 0 0 8px; font-size: 14px; font-weight: 500; }
    }

    .selection-summary {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 12px 0 0;
      font-size: 13px;
      font-weight: 500;
      color: var(--mat-sys-primary, #1976d2);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrgDocumentChooser implements OnInit {
  readonly data = inject<OrgDocumentChooserData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<OrgDocumentChooser>);
  readonly docService = inject(OrgDocumentService);
  private readonly app = inject(ZerobiasClientApp);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly dragging = signal(false);
  readonly activeTab = signal(0);
  readonly searchQuery = signal('');
  readonly typeFilter = signal<DocumentType | null>(null);

  readonly allDocs = signal<OrgDocumentDetail[]>([]);
  readonly selectedIds = signal(new Set<string>());
  readonly uploadedDocs = signal<OrgDocumentDetail[]>([]);

  private orgId = '';
  private multiple = true;

  readonly docTypes = [
    { value: 'security_requirements' as DocumentType, label: 'Security' },
    { value: 'sow' as DocumentType, label: 'SOW' },
    { value: 'budget' as DocumentType, label: 'Budget' },
    { value: 'legal_terms' as DocumentType, label: 'Legal' },
    { value: 'compliance' as DocumentType, label: 'Compliance' },
    { value: 'functional_spec' as DocumentType, label: 'Functional' },
    { value: 'other' as DocumentType, label: 'Other' },
  ];

  readonly filteredDocs = computed(() => {
    let docs = [...this.allDocs()];
    const query = this.searchQuery().toLowerCase();
    const typeF = this.typeFilter() || this.data.documentType || null;

    if (query) {
      docs = docs.filter(d =>
        (d.display_name || d.filename).toLowerCase().includes(query) ||
        d.filename.toLowerCase().includes(query),
      );
    }
    if (typeF) {
      docs = docs.filter(d => d.document_type === typeF);
    }

    // Sort: shared-with-context first, then by date
    if (this.data.scope === 'engagement' && this.data.engagementId) {
      docs.sort((a, b) => {
        const aShared = a.engagement_share_count > 0 ? 1 : 0;
        const bShared = b.engagement_share_count > 0 ? 1 : 0;
        if (aShared !== bShared) return bShared - aShared;
        return (b.created_at || '').localeCompare(a.created_at || '');
      });
    } else {
      docs.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    }

    return docs;
  });

  readonly totalSelected = computed(() =>
    this.selectedIds().size + this.uploadedDocs().length,
  );

  dialogTitle = computed(() =>
    this.data.title || 'Select Documents',
  );

  async ngOnInit(): Promise<void> {
    this.multiple = this.data.multiple !== false;

    try {
      const org = await new Promise<any>((resolve) => {
        const sub = this.app.getCurrentOrg().subscribe(o => {
          if (o) { resolve(o); sub.unsubscribe(); }
        });
      });
      this.orgId = org.id?.toString() || '';

      // Load org documents (or shared docs for the context)
      let docs: OrgDocumentDetail[];
      if (this.data.scope === 'engagement' && this.data.engagementId) {
        // Show all org docs but sort context-shared ones first
        docs = await this.docService.listDocuments(this.orgId, {
          documentType: this.data.documentType,
        });
      } else {
        docs = await this.docService.listDocuments(this.orgId, {
          documentType: this.data.documentType,
        });
      }
      this.allDocs.set(docs);
    } catch (err: any) {
      this.snackBar.open(`Failed to load documents: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggleDoc(doc: OrgDocumentDetail): void {
    this.selectedIds.update(ids => {
      const next = new Set(ids);
      if (next.has(doc.id)) {
        next.delete(doc.id);
      } else {
        if (!this.multiple) next.clear();
        next.add(doc.id);
      }
      return next;
    });
  }

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------

  triggerUpload(): void {
    const input = document.querySelector<HTMLInputElement>('.upload-zone input[type=file]');
    input?.click();
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (files.length === 0) return;
    input.value = '';
    await this.uploadFiles(files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.dragging.set(false);
    const files = Array.from(event.dataTransfer?.files || []);
    if (files.length > 0) {
      await this.uploadFiles(files);
    }
  }

  private async uploadFiles(files: File[]): Promise<void> {
    this.uploading.set(true);
    try {
      for (const file of files) {
        const doc = await this.docService.uploadDocument(this.orgId, file, {
          documentType: this.data.documentType || 'other',
        }) as unknown as OrgDocumentDetail;
        // Add share counts for consistency
        (doc as any).project_share_count = 0;
        (doc as any).engagement_share_count = 0;
        this.uploadedDocs.update(list => [...list, doc]);
      }
      this.snackBar.open(`${files.length} file(s) uploaded`, 'OK', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(`Upload failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.uploading.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  confirm(): void {
    const allDocs = this.allDocs();
    const selected = allDocs.filter(d => this.selectedIds().has(d.id));

    this.dialogRef.close({
      selected,
      uploaded: this.uploadedDocs(),
    } as OrgDocumentChooserResult);
  }

  close(): void {
    this.dialogRef.close(null);
  }

  typeLabel(type: string): string {
    return DOCTYPE_LABELS[type] || type;
  }
}
