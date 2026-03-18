import {
  Component, inject, signal, computed, ChangeDetectionStrategy, OnInit,
  TemplateRef, ViewChild,
} from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { ZbCustomizableTableComponent } from '@zerobias-org/ngx-library';
import { OrgDocumentService } from '../../../core/services/org-document.service';
import type { OrgDocumentDetail } from '../../../core/models/org-document.model';
import type { DocumentType } from '../../../core/models/document.model';
import {
  DocumentShareDialog,
  type DocumentShareDialogResult,
} from '../../../shared/components/document-share-dialog/document-share-dialog.component';

type ViewMode = 'grid' | 'list';
type SortField = 'created_at' | 'filename' | 'file_size_bytes' | 'document_type';
type SortDir = 'asc' | 'desc';

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
  selector: 'app-documents-tab',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatMenuModule, MatChipsModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatDialogModule, MatTooltipModule, MatBadgeModule, MatDividerModule,
    ZbCustomizableTableComponent,
  ],
  providers: [JsonPipe],
  template: `
    <div class="documents-tab">
      <!-- Toolbar -->
      <div class="toolbar">
        <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput placeholder="Search documents..." [ngModel]="searchQuery()" (ngModelChange)="onSearch($event)">
        </mat-form-field>

        <mat-form-field appearance="outline" class="type-filter" subscriptSizing="dynamic">
          <mat-select [value]="typeFilter()" (selectionChange)="onTypeFilter($event.value)" placeholder="All Types">
            <mat-option [value]="null">All Types</mat-option>
            @for (type of docTypes; track type.value) {
              <mat-option [value]="type.value">{{ type.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="toolbar-spacer"></div>

        @if (viewMode() === 'grid') {
          <button mat-icon-button [matMenuTriggerFor]="sortMenu" matTooltip="Sort">
            <mat-icon>sort</mat-icon>
          </button>
          <mat-menu #sortMenu="matMenu">
            <button mat-menu-item (click)="setSort('created_at')">
              <mat-icon>{{ sortField() === 'created_at' ? 'check' : '' }}</mat-icon>
              Date Added
            </button>
            <button mat-menu-item (click)="setSort('filename')">
              <mat-icon>{{ sortField() === 'filename' ? 'check' : '' }}</mat-icon>
              Name
            </button>
            <button mat-menu-item (click)="setSort('file_size_bytes')">
              <mat-icon>{{ sortField() === 'file_size_bytes' ? 'check' : '' }}</mat-icon>
              Size
            </button>
            <button mat-menu-item (click)="setSort('document_type')">
              <mat-icon>{{ sortField() === 'document_type' ? 'check' : '' }}</mat-icon>
              Type
            </button>
            <mat-divider />
            <button mat-menu-item (click)="toggleSortDir()">
              <mat-icon>{{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              {{ sortDir() === 'asc' ? 'Ascending' : 'Descending' }}
            </button>
          </mat-menu>
        }

        <button mat-icon-button (click)="toggleView()" [matTooltip]="viewMode() === 'grid' ? 'List view' : 'Grid view'">
          <mat-icon>{{ viewMode() === 'grid' ? 'view_list' : 'grid_view' }}</mat-icon>
        </button>

        <button mat-flat-button (click)="triggerUpload()">
          <mat-icon>upload_file</mat-icon>
          Upload
        </button>
        <input #fileInput type="file" multiple hidden (change)="onFilesSelected($event)">
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="36" />
          <span>Loading documents…</span>
        </div>
      }

      <!-- Empty state -->
      @else if (filteredDocs().length === 0) {
        <div class="empty-state"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          [class.drag-active]="dragging()">
          <mat-icon class="empty-icon">cloud_upload</mat-icon>
          <h3>{{ allDocs().length === 0 ? 'No documents yet' : 'No matching documents' }}</h3>
          <p>{{ allDocs().length === 0 ? 'Drag & drop files here or click Upload' : 'Try adjusting your search or filters' }}</p>
        </div>
      }

      <!-- Grid view -->
      @else if (viewMode() === 'grid') {
        <div class="doc-grid"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          [class.drag-active]="dragging()">
          @for (doc of filteredDocs(); track doc.id) {
            <div class="doc-card" [matMenuTriggerFor]="cardMenu">
              <div class="card-icon">
                <mat-icon class="file-icon">{{ docService.getFileIcon(doc.mime_type) }}</mat-icon>
              </div>
              <div class="card-body">
                <div class="card-name" [matTooltip]="doc.display_name || doc.filename">
                  {{ doc.display_name || doc.filename }}
                </div>
                <div class="card-meta">
                  <span class="type-chip">{{ typeLabel(doc.document_type) }}</span>
                  <span class="card-size">{{ docService.formatFileSize(doc.file_size_bytes) }}</span>
                </div>
                @if (doc.project_share_count > 0 || doc.engagement_share_count > 0) {
                  <div class="card-shares">
                    <mat-icon class="share-icon">share</mat-icon>
                    <span>{{ doc.engagement_share_count + doc.project_share_count }} shared</span>
                    @if (doc.has_restricted_shares) {
                      <mat-icon class="restricted-icon" matTooltip="Has restricted visibility">visibility_off</mat-icon>
                    }
                  </div>
                }
              </div>
              <mat-menu #cardMenu="matMenu">
                @if (doc.zb_file_version_id) {
                  <a mat-menu-item [href]="docService.getPreviewUrl(doc.zb_file_version_id)" target="_blank">
                    <mat-icon>visibility</mat-icon> Preview
                  </a>
                  <a mat-menu-item [href]="docService.getDownloadUrl(doc.zb_file_version_id)" target="_blank">
                    <mat-icon>download</mat-icon> Download
                  </a>
                }
                <button mat-menu-item (click)="openShareDialog(doc)">
                  <mat-icon>share</mat-icon> Share
                </button>
                <mat-divider />
                <button mat-menu-item (click)="archiveDoc(doc)">
                  <mat-icon>archive</mat-icon> Archive
                </button>
              </mat-menu>
            </div>
          }
        </div>
      }

      <!-- List view — ZbCustomizableTable -->
      @else {
        <div class="list-wrapper"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          [class.drag-active]="dragging()">
          <zb-customizable-table
            [columns]="listColumns"
            [columnLabels]="listColumnLabels"
            [data]="filteredDocs()"
            [loading]="loading()"
            [templateRefs]="cellTemplates"
            [translateHeaders]="false"
            [sortDisabled]="false"
            [selectRowOnClick]="false"
            [emitRowClick]="false"
            [hoverable]="true"
            [multiSelect]="false"
          />
        </div>
      }

      <!-- Upload progress overlay -->
      @if (uploading()) {
        <div class="upload-overlay">
          <mat-spinner diameter="24" />
          <span>Uploading {{ uploadingCount() }} file(s)…</span>
        </div>
      }
    </div>

    <!-- Custom cell templates for list view -->
    <ng-template #nameTpl let-row>
      <div class="cell-name">
        <mat-icon class="row-icon">{{ docService.getFileIcon(row.mime_type) }}</mat-icon>
        <span>{{ row.display_name || row.filename }}</span>
      </div>
    </ng-template>

    <ng-template #typeTpl let-row>
      <span class="type-chip">{{ typeLabel(row.document_type) }}</span>
    </ng-template>

    <ng-template #sizeTpl let-row>
      {{ docService.formatFileSize(row.file_size_bytes) }}
    </ng-template>

    <ng-template #sharedTpl let-row>
      <div class="cell-shared">
        <span>{{ (row.engagement_share_count || 0) + (row.project_share_count || 0) }}</span>
        @if (row.has_restricted_shares) {
          <mat-icon class="restricted-icon" matTooltip="Has restricted visibility">visibility_off</mat-icon>
        }
      </div>
    </ng-template>

    <ng-template #dateTpl let-row>
      {{ formatDate(row.created_at) }}
    </ng-template>

    <ng-template #actionsTpl let-row>
      <button mat-icon-button [matMenuTriggerFor]="rowMenu" (click)="$event.stopPropagation()">
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #rowMenu="matMenu">
        @if (row.zb_file_version_id) {
          <a mat-menu-item [href]="docService.getPreviewUrl(row.zb_file_version_id)" target="_blank">
            <mat-icon>visibility</mat-icon> Preview
          </a>
          <a mat-menu-item [href]="docService.getDownloadUrl(row.zb_file_version_id)" target="_blank">
            <mat-icon>download</mat-icon> Download
          </a>
        }
        <button mat-menu-item (click)="openShareDialog(row)">
          <mat-icon>share</mat-icon> Share
        </button>
        <mat-divider />
        <button mat-menu-item (click)="archiveDoc(row)">
          <mat-icon>archive</mat-icon> Archive
        </button>
      </mat-menu>
    </ng-template>
  `,
  styles: [`
    .documents-tab { position: relative; }

    /* Toolbar */
    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .search-field { flex: 1; min-width: 200px; }
    .type-filter { width: 160px; }
    .toolbar-spacer { flex: 1; }

    /* Loading */
    .loading-state {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: center;
      padding: 48px 0;
      color: var(--mat-sys-on-surface-variant, #666);
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px 24px;
      border: 2px dashed var(--mat-sys-outline-variant, #ccc);
      border-radius: 12px;
      text-align: center;
      transition: border-color 0.2s, background 0.2s;
    }
    .empty-state.drag-active {
      border-color: var(--mat-sys-primary, #1976d2);
      background: color-mix(in srgb, var(--mat-sys-primary, #1976d2) 5%, transparent);
    }
    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--mat-sys-on-surface-variant, #999);
      margin-bottom: 12px;
    }
    .empty-state h3 { margin: 0 0 4px; font-weight: 500; }
    .empty-state p {
      margin: 0;
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant, #666);
    }

    /* Grid */
    .doc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
      min-height: 120px;
      border: 2px dashed transparent;
      border-radius: 8px;
      transition: border-color 0.2s;
    }
    .doc-grid.drag-active {
      border-color: var(--mat-sys-primary, #1976d2);
    }
    .doc-card {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--mat-sys-outline-variant, #ddd);
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    .doc-card:hover {
      border-color: var(--mat-sys-primary, #1976d2);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
    .card-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 0;
    }
    .file-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: var(--mat-sys-primary, #1976d2);
    }
    .card-body { flex: 1; }
    .card-name {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }
    .card-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant, #666);
    }
    .card-shares {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant, #999);
    }
    .share-icon { font-size: 14px; width: 14px; height: 14px; }
    .restricted-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
      color: var(--mat-sys-error, #d32f2f);
    }

    /* Type chip (shared between grid + list cell template) */
    .type-chip {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      background: var(--mat-sys-surface-container, #f0f0f0);
      color: var(--mat-sys-on-surface-variant, #555);
    }

    /* List wrapper (drag target) */
    .list-wrapper {
      border: 2px dashed transparent;
      border-radius: 8px;
      transition: border-color 0.2s;
    }
    .list-wrapper.drag-active {
      border-color: var(--mat-sys-primary, #1976d2);
    }

    /* List cell templates */
    .cell-shared {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .cell-name {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .row-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: var(--mat-sys-primary, #1976d2);
      flex-shrink: 0;
    }

    /* Upload overlay */
    .upload-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
      padding: 8px;
      background: var(--mat-sys-surface-container, #f0f0f0);
      border-radius: 8px;
      font-size: 13px;
      z-index: 10;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsTab implements OnInit {
  readonly docService = inject(OrgDocumentService);
  private readonly app = inject(ZerobiasClientApp);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  // List view cell templates
  @ViewChild('nameTpl', { static: true }) nameTpl!: TemplateRef<any>;
  @ViewChild('typeTpl', { static: true }) typeTpl!: TemplateRef<any>;
  @ViewChild('sizeTpl', { static: true }) sizeTpl!: TemplateRef<any>;
  @ViewChild('sharedTpl', { static: true }) sharedTpl!: TemplateRef<any>;
  @ViewChild('dateTpl', { static: true }) dateTpl!: TemplateRef<any>;
  @ViewChild('actionsTpl', { static: true }) actionsTpl!: TemplateRef<any>;

  readonly allDocs = signal<OrgDocumentDetail[]>([]);
  readonly loading = signal(true);
  readonly uploading = signal(false);
  readonly uploadingCount = signal(0);
  readonly dragging = signal(false);

  // View state
  readonly viewMode = signal<ViewMode>('grid');
  readonly searchQuery = signal('');
  readonly typeFilter = signal<DocumentType | null>(null);
  readonly sortField = signal<SortField>('created_at');
  readonly sortDir = signal<SortDir>('desc');

  private orgId = '';

  // List view table config
  readonly listColumns = ['display_name', 'document_type', 'file_size_bytes', 'shared', 'created_at', 'actions'];
  readonly listColumnLabels = ['Name', 'Type', 'Size', 'Shared', 'Added', ''];
  cellTemplates: Record<string, TemplateRef<any>> = {};

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
    const typeF = this.typeFilter();

    if (query) {
      docs = docs.filter(d =>
        (d.display_name || d.filename).toLowerCase().includes(query) ||
        d.filename.toLowerCase().includes(query),
      );
    }
    if (typeF) {
      docs = docs.filter(d => d.document_type === typeF);
    }

    const field = this.sortField();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    docs.sort((a, b) => {
      const av = (a as any)[field] ?? '';
      const bv = (b as any)[field] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

    return docs;
  });

  async ngOnInit(): Promise<void> {
    // Wire cell templates for list view
    this.cellTemplates = {
      display_name: this.nameTpl,
      document_type: this.typeTpl,
      file_size_bytes: this.sizeTpl,
      shared: this.sharedTpl,
      created_at: this.dateTpl,
      actions: this.actionsTpl,
    };

    try {
      const org = await new Promise<any>((resolve) => {
        let sub: any;
        sub = this.app.getCurrentOrg().subscribe(o => {
          if (o) { resolve(o); sub?.unsubscribe(); }
        });
      });
      this.orgId = org.id?.toString() || '';
      await this.loadDocuments();
    } catch (err: any) {
      this.snackBar.open(`Failed to load: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  private async loadDocuments(): Promise<void> {
    if (!this.orgId) return;
    const docs = await this.docService.listDocuments(this.orgId);
    this.allDocs.set(docs);
  }

  // ---------------------------------------------------------------------------
  // View controls
  // ---------------------------------------------------------------------------

  toggleView(): void {
    this.viewMode.update(m => m === 'grid' ? 'list' : 'grid');
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  onTypeFilter(type: DocumentType | null): void {
    this.typeFilter.set(type);
  }

  setSort(field: SortField): void {
    if (this.sortField() === field) {
      this.toggleSortDir();
    } else {
      this.sortField.set(field);
      this.sortDir.set(field === 'filename' ? 'asc' : 'desc');
    }
  }

  toggleSortDir(): void {
    this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
  }

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------

  triggerUpload(): void {
    const input = document.querySelector<HTMLInputElement>('.documents-tab input[type=file]');
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

  onDragLeave(event: DragEvent): void {
    this.dragging.set(false);
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
    this.uploadingCount.set(files.length);

    try {
      for (const file of files) {
        await this.docService.uploadDocument(this.orgId, file, {
          documentType: 'other',
        });
      }
      this.snackBar.open(`${files.length} file(s) uploaded`, 'OK', { duration: 3000 });
      await this.loadDocuments();
    } catch (err: any) {
      this.snackBar.open(`Upload failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.uploading.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async archiveDoc(doc: OrgDocumentDetail): Promise<void> {
    try {
      await this.docService.archiveDocument(doc.id);
      this.allDocs.update(docs => docs.filter(d => d.id !== doc.id));
      this.snackBar.open('Document archived', 'OK', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open(`Archive failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  openShareDialog(doc: OrgDocumentDetail): void {
    const ref = this.dialog.open(DocumentShareDialog, {
      width: '520px',
      data: { document: doc, orgId: this.orgId },
    });
    ref.afterClosed().subscribe((result: DocumentShareDialogResult | null) => {
      if (result?.sharesCreated) {
        this.loadDocuments();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  typeLabel(type: string): string {
    return DOCTYPE_LABELS[type] || type;
  }

  formatDate(isoDate: string): string {
    try {
      return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }
}
