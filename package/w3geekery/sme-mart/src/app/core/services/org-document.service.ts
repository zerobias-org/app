import { Injectable, inject } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { Nmtoken } from '@zerobias-org/types-core-js';
import { Md5 } from 'ts-md5';
import { SmeMartDbService } from './sme-mart-db.service';
import { DocumentService } from './document.service';
import { ImpersonationService } from './impersonation.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import type {
  OrgDocument,
  OrgDocumentDetail,
  OrgDocumentShare,
  ShareTargetType,
  ShareVisibility,
} from '../models/org-document.model';
import type { DocumentType } from '../models/document.model';

export interface OrgDocListOptions {
  documentType?: DocumentType;
  archived?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface ShareDocumentOptions {
  documentId: string;
  targetType: ShareTargetType;
  targetId: string;
  visibility?: ShareVisibility;
}

/**
 * Service for org-level document CRUD, uploads, and sharing.
 *
 * Delegates file upload mechanics to DocumentService (FileService + binary upload).
 * Manages org_documents and org_document_shares Neon tables.
 *
 * Plan 046: Org-Level Document Management
 */
@Injectable({ providedIn: 'root' })
export class OrgDocumentService {
  private readonly clientApi = inject(ZerobiasClientApi);
  private readonly db = inject(SmeMartDbService);
  private readonly docService = inject(DocumentService);
  private readonly impersonation = inject(ImpersonationService);
  private readonly tagService = inject(SmeMartTagService);

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------

  /**
   * Upload a file to the org document library.
   * Uses DocumentService for FileService upload, then inserts org_documents row.
   */
  async uploadDocument(
    orgId: string,
    file: File,
    opts: { documentType: DocumentType; displayName?: string; description?: string },
  ): Promise<OrgDocument> {
    const filename = file.name;
    this.docService.uploadProgress$.next({ filename, percent: 0, done: false });

    // Read file + MD5 via DocumentService's pattern
    const arrayBuffer = await this.readFileAsArrayBuffer(file);

    // Try FileService upload (reuse DocumentService's progress stream)
    let zbFileId = '';
    let fileVersionId = '';
    try {
      const md5 = new Md5();
      md5.appendByteArray(new Uint8Array(arrayBuffer));
      const checksum = md5.end() as string;

      // Ensure org folder in FileService
      const folderId = await this.ensureOrgFolder(orgId);

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
      fileVersionId = await this.docService.uploadBinary(
        fileView, arrayBuffer, file.type, checksum, filename,
      );
    } catch (fsErr: any) {
      console.warn('[OrgDocumentService] FileService upload unavailable, storing metadata only:', fsErr.message);
      this.docService.uploadProgress$.next({ filename, percent: 50, done: false });
    }

    // Insert Neon catalog row
    const userId = this.impersonation.effectiveUserId();
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

    this.docService.uploadProgress$.next({ filename, percent: 100, done: true });
    return doc;
  }

  // ---------------------------------------------------------------------------
  // List / Get
  // ---------------------------------------------------------------------------

  /** List org documents from v_org_document_detail view (includes share counts). */
  async listDocuments(orgId: string, opts?: OrgDocListOptions): Promise<OrgDocumentDetail[]> {
    const archived = opts?.archived ?? false;
    const page = opts?.pageNumber ?? 1;
    const size = opts?.pageSize ?? 50;

    let filter = `(&(org_id=${orgId})(archived=${archived}))`;
    if (opts?.documentType) {
      filter = `(&(org_id=${orgId})(document_type=${opts.documentType})(archived=${archived}))`;
    }

    const result = await this.db.searchRows<OrgDocumentDetail>(
      'v_org_document_detail', filter, { pageNumber: page, pageSize: size },
    );
    return result.items || [];
  }

  /** Get a single document by ID. */
  async getDocument(id: string): Promise<OrgDocument | null> {
    return this.db.getRow<OrgDocument>('org_documents', id);
  }

  /** List documents shared with a specific engagement or project. */
  async listSharedDocuments(
    targetType: ShareTargetType,
    targetId: string,
    orgId: string,
  ): Promise<OrgDocumentDetail[]> {
    // Use a JOIN query in Neon mode
    const rows = await this.db.neonQueryPublic<OrgDocumentDetail>(`
      SELECT od.*,
        COUNT(DISTINCT CASE WHEN ods2.shared_with_type = 'project' THEN ods2.shared_with_id END) AS project_share_count,
        COUNT(DISTINCT CASE WHEN ods2.shared_with_type = 'engagement' THEN ods2.shared_with_id END) AS engagement_share_count
      FROM org_documents od
      INNER JOIN org_document_shares ods ON od.id = ods.document_id
        AND ods.shared_with_type = '${this.escapeValue(targetType)}'
        AND ods.shared_with_id = '${this.escapeValue(targetId)}'
      LEFT JOIN org_document_shares ods2 ON od.id = ods2.document_id
      WHERE od.org_id = '${this.escapeValue(orgId)}'
        AND od.archived = false
      GROUP BY od.id
      ORDER BY od.created_at DESC
    `);
    return rows;
  }

  // ---------------------------------------------------------------------------
  // Sharing
  // ---------------------------------------------------------------------------

  /** Share a document with an engagement, project, task, or note. */
  async shareDocument(opts: ShareDocumentOptions): Promise<OrgDocumentShare> {
    const userId = this.impersonation.effectiveUserId();
    return this.db.createRow<OrgDocumentShare>('org_document_shares', {
      document_id: opts.documentId,
      shared_with_type: opts.targetType,
      shared_with_id: opts.targetId,
      visibility: opts.visibility || 'all',
      granted_by: userId,
    });
  }

  /** Remove a share (unshare a document from a target). */
  async unshareDocument(shareId: string): Promise<void> {
    await this.db.deleteRow('org_document_shares', shareId);
  }

  /** List all shares for a specific document. */
  async listShares(documentId: string): Promise<OrgDocumentShare[]> {
    const result = await this.db.searchRows<OrgDocumentShare>(
      'org_document_shares',
      `(document_id=${documentId})`,
      { pageNumber: 1, pageSize: 100 },
    );
    return result.items || [];
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

  async restoreDocument(documentId: string): Promise<void> {
    await this.db.updateRow('org_documents', documentId, {
      archived: false,
      updated_at: new Date().toISOString(),
    });
  }

  // ---------------------------------------------------------------------------
  // Update metadata
  // ---------------------------------------------------------------------------

  async updateDocument(
    documentId: string,
    updates: { display_name?: string; description?: string; document_type?: DocumentType },
  ): Promise<OrgDocument> {
    return this.db.updateRow<OrgDocument>('org_documents', documentId, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  }

  // ---------------------------------------------------------------------------
  // Delegate helpers from DocumentService
  // ---------------------------------------------------------------------------

  getPreviewUrl(zbFileVersionId: string): string {
    return this.docService.getPreviewUrl(zbFileVersionId);
  }

  getDownloadUrl(zbFileVersionId: string): string {
    return this.docService.getDownloadUrl(zbFileVersionId);
  }

  isPreviewable(mimeType?: string | null): boolean {
    return this.docService.isPreviewable(mimeType);
  }

  getFileIcon(mimeType?: string | null): string {
    return this.docService.getFileIcon(mimeType);
  }

  formatFileSize(bytes?: number | null): string {
    return this.docService.formatFileSize(bytes);
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

  /** Ensure a FileService folder exists for the org */
  private async ensureOrgFolder(orgId: string): Promise<string | null> {
    try {
      const folderName = `SME-Mart-Org-${orgId.slice(0, 8)}`;

      const results = await this.clientApi.hydraClient
        .getResourceApi()
        .searchResources(undefined, undefined, [folderName], undefined, [new Nmtoken('folder')]);
      const existing = results.items?.find((r: any) => r.name === folderName);
      if (existing) return existing.id?.toString() || null;

      const folder = await this.clientApi.fileClient
        .getFolderApi()
        .create({ name: folderName } as any);
      return folder.id?.toString() || null;
    } catch (err) {
      console.warn('[OrgDocumentService] Failed to ensure org folder, uploading to root:', err);
      return null;
    }
  }

  private escapeValue(value: string): string {
    return value.replace(/'/g, "''");
  }
}
