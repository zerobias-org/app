import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { ZerobiasClientApi, getZerobiasClientUrl } from '@zerobias-com/zerobias-client';
import type { FileView } from '@zerobias-com/fileservice-sdk';
import { Nmtoken } from '@zerobias-org/types-core-js';
import { Md5 } from 'ts-md5';
import { Subject } from 'rxjs';
import { SmeMartDbService } from './sme-mart-db.service';
import { ImpersonationService } from './impersonation.service';
import type { EngagementDocument, DocumentType } from '../models/document.model';
import type { OrgDocument } from '../models/org-document.model';
import { environment } from '../../../environments/environment';

export interface UploadProgress {
  filename: string;
  percent: number;
  done: boolean;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly http = inject(HttpClient);
  private readonly db = inject(SmeMartDbService);
  private readonly impersonation = inject(ImpersonationService);

  /** Emits progress updates during uploads */
  readonly uploadProgress$ = new Subject<UploadProgress>();

  // ---------------------------------------------------------------------------
  // Upload — single source of truth: org_documents + context share
  // ---------------------------------------------------------------------------

  /**
   * Upload a file to org_documents and link it to the originating engagement.
   * All files live in org_documents; engagement_documents is deprecated.
   */
  async uploadDocument(
    engagementId: string,
    file: File,
    opts: { documentType: DocumentType; displayName?: string; description?: string },
  ): Promise<EngagementDocument> {
    const filename = file.name;
    this.uploadProgress$.next({ filename, percent: 0, done: false });

    // 1. Read file as ArrayBuffer
    const arrayBuffer = await this.readFileAsArrayBuffer(file);

    // 2. MD5 checksum
    const md5 = new Md5();
    md5.appendByteArray(new Uint8Array(arrayBuffer));
    const checksum = md5.end() as string;

    // 3. Try FileService upload (may fail if S3 permissions not ready)
    let zbFileId = '';
    let fileVersionId = '';
    try {
      const folderId = await this.ensureEngagementFolder(engagementId);

      const fileView = await this.clientApi.fileClient
        .getFileApi()
        .create({
          name: filename,
          description: opts.description || '',
          folderId: folderId ? this.clientApi.toUUID(folderId) : undefined,
          retentionPolicy: {},
          syncPolicy: {},
        } as any);

      zbFileId = fileView.id?.toString() || '';

      fileVersionId = await this.uploadBinary(
        fileView, arrayBuffer, file.type, checksum, filename,
      );
    } catch (fsErr: any) {
      console.warn('[DocumentService] FileService upload unavailable, storing metadata only:', fsErr.message);
      this.uploadProgress$.next({ filename, percent: 50, done: false });
    }

    // 4. Insert into org_documents (single source of truth)
    const userId = this.impersonation.effectiveUserId();
    const orgId = this.impersonation.effectiveOrgId();
    const doc = await this.db.createRow<OrgDocument>('org_documents', {
      org_id: orgId,
      zb_file_id: zbFileId || null,
      zb_file_version_id: fileVersionId || null,
      filename,
      mime_type: file.type || null,
      file_size_bytes: file.size,
      document_type: opts.documentType,
      display_name: opts.displayName || filename,
      description: opts.description || null,
      uploaded_by_zerobias_user_id: userId,
    });

    // 5. Create share linking this document to the engagement
    await this.db.createRow('org_document_shares', {
      document_id: doc.id,
      shared_with_type: 'engagement',
      shared_with_id: engagementId,
      granted_by: userId,
    });

    this.uploadProgress$.next({ filename, percent: 100, done: true });

    // Return as EngagementDocument shape for backward compat
    return {
      ...doc,
      engagement_id: engagementId,
      zb_task_id: null,
      zb_task_attachment_id: null,
    } as EngagementDocument;
  }

  // ---------------------------------------------------------------------------
  // List / Get — query org_documents via shares
  // ---------------------------------------------------------------------------

  async listDocuments(
    engagementId: string,
    opts?: { documentType?: DocumentType; archived?: boolean },
  ): Promise<EngagementDocument[]> {
    const archived = opts?.archived ?? false;
    const typeClause = opts?.documentType
      ? `AND od.document_type = '${this.escapeValue(opts.documentType)}'`
      : '';

    const rows = await this.db.neonQueryPublic<EngagementDocument>(`
      SELECT od.*,
        '${this.escapeValue(engagementId)}'::uuid AS engagement_id,
        NULL::uuid AS zb_task_id,
        NULL::uuid AS zb_task_attachment_id
      FROM org_documents od
      INNER JOIN org_document_shares ods
        ON od.id = ods.document_id
        AND ods.shared_with_type = 'engagement'
        AND ods.shared_with_id = '${this.escapeValue(engagementId)}'
      WHERE od.archived = ${archived}
        ${typeClause}
      ORDER BY od.created_at DESC
    `);
    return rows;
  }

  async getDocument(id: string): Promise<EngagementDocument | null> {
    return this.db.getRow<EngagementDocument>('org_documents', id);
  }

  // ---------------------------------------------------------------------------
  // Preview / Download URLs
  // ---------------------------------------------------------------------------

  getPreviewUrl(zbFileVersionId: string): string {
    const url = getZerobiasClientUrl(
      `file-service/files/${zbFileVersionId}/view`,
      true, environment.isLocalDev, true,
    );
    return url.toString();
  }

  getDownloadUrl(zbFileVersionId: string): string {
    const url = getZerobiasClientUrl(
      `file-service/files/${zbFileVersionId}/download`,
      true, environment.isLocalDev, true,
    );
    return url.toString();
  }

  // ---------------------------------------------------------------------------
  // Task Attachment
  // ---------------------------------------------------------------------------

  async attachToTask(
    documentId: string,
    taskId: string,
    fileVersionId: string,
    commentText?: string,
  ): Promise<void> {
    const attachment = await this.clientApi.platformClient
      .getTaskApi()
      .addAttachment(this.clientApi.toUUID(taskId), {
        fileVersionId: this.clientApi.toUUID(fileVersionId),
        commentTxt: commentText || undefined,
      } as any);

    // Update org_documents row with task link
    await this.db.updateRow('org_documents', documentId, {
      updated_at: new Date().toISOString(),
    });

    // Create a task share
    const userId = this.impersonation.effectiveUserId();
    await this.db.createRow('org_document_shares', {
      document_id: documentId,
      shared_with_type: 'task',
      shared_with_id: taskId,
      granted_by: userId,
    });
  }

  // ---------------------------------------------------------------------------
  // Archive (soft delete)
  // ---------------------------------------------------------------------------

  async archiveDocument(documentId: string): Promise<void> {
    await this.db.updateRow('org_documents', documentId, {
      archived: true,
      updated_at: new Date().toISOString(),
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  isPreviewable(mimeType?: string | null): boolean {
    if (!mimeType) return false;
    const m = mimeType.toLowerCase();
    return (
      m.startsWith('image/') ||
      m.startsWith('video/') ||
      m.startsWith('audio/') ||
      m.startsWith('text/') ||
      m.includes('pdf') ||
      m.includes('json') ||
      m.includes('yaml') ||
      m.includes('xml') ||
      m.includes('html') ||
      m.includes('css') ||
      m.includes('xlsx') ||
      m.includes('spreadsheetml')
    );
  }

  getFileIcon(mimeType?: string | null): string {
    if (!mimeType) return 'insert_drive_file';
    const m = mimeType.toLowerCase();
    if (m.startsWith('image/')) return 'image';
    if (m.startsWith('video/')) return 'videocam';
    if (m.startsWith('audio/')) return 'audiotrack';
    if (m.includes('pdf')) return 'picture_as_pdf';
    if (m.includes('spreadsheet') || m.includes('excel') || m.includes('csv')) return 'table_chart';
    if (m.includes('document') || m.includes('word') || m.includes('text')) return 'description';
    if (m.includes('presentation') || m.includes('powerpoint')) return 'slideshow';
    if (m.includes('zip') || m.includes('archive')) return 'folder_zip';
    if (m.includes('json') || m.includes('xml') || m.includes('javascript')) return 'code';
    return 'insert_drive_file';
  }

  formatFileSize(bytes?: number | null): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + units[i];
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.readAsArrayBuffer(file);
    });
  }

  uploadBinary(
    fileView: FileView,
    arrayBuffer: ArrayBuffer,
    contentType: string,
    checksum: string,
    filename: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const rootUrl = getZerobiasClientUrl(
        'file-service', true, environment.isLocalDev, true,
      );
      const url = `${rootUrl.toString()}/files/${fileView.id?.toString()}/upload?checksum=${checksum}`;
      const headers = new HttpHeaders({
        'content-type': contentType || 'application/octet-stream',
      });

      this.http.post(url, arrayBuffer, {
        headers,
        reportProgress: true,
        observe: 'events',
        withCredentials: true,
      }).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            const percent = Math.round(100 * event.loaded / event.total);
            this.uploadProgress$.next({ filename, percent, done: false });
          } else if (event.type === HttpEventType.Response) {
            const body = event.body as any;
            resolve(body?.id?.toString() || body?.toString() || '');
          }
        },
        error: (err) => {
          this.uploadProgress$.next({ filename, percent: 0, done: true, error: err.message });
          reject(err);
        },
      });
    });
  }

  /** Ensure a FileService folder exists for the engagement */
  private async ensureEngagementFolder(engagementId: string): Promise<string | null> {
    const folderName = `SME-Mart-${engagementId.slice(0, 8)}`;
    try {
      const results = await this.clientApi.hydraClient
        .getResourceApi()
        .searchResources(
          undefined, undefined,
          [folderName],
          undefined,
          [new Nmtoken('folder')],
        );
      const existing = results.items?.find((r: any) => r.name === folderName);
      if (existing) return existing.id?.toString() || null;

      const folder = await this.clientApi.fileClient
        .getFolderApi()
        .create({ name: folderName } as any);
      return folder.id?.toString() || null;
    } catch (err) {
      console.warn('[DocumentService] Failed to ensure folder, uploading to root:', err);
      return null;
    }
  }

  private escapeValue(value: string): string {
    return value.replace(/'/g, "''");
  }
}
