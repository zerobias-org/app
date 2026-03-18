/**
 * GQL Response Types for SmeMartDocument entity
 *
 * SmeMartDocument represents an uploaded file tracked via ZB FileService (S3).
 * Extends the File base class (inherits fileVersionId, downloadUrl, etc.)
 */

// Forward declare to avoid circular dependency
type GqlEngagementResponse = any;

/**
 * Document type enumeration
 */
export type DocumentType =
  | 'security_requirements'
  | 'sow'
  | 'budget'
  | 'legal_terms'
  | 'compliance'
  | 'functional_spec'
  | 'other';

/**
 * GQL SmeMartDocument response type
 *
 * Extends File base class (inherited fields: id, description, fileVersionId, mimeType, size, downloadUrl)
 * Links to: Engagement, Task (optional, for evidence uploads)
 */
export interface GqlDocumentResponse {
  // File inherited fields
  id: string;
  name: string; // File display name (from displayName or filename)
  description?: string;
  fileName?: string; // Original filename from upload
  filePath?: string; // S3 path or CDN URL
  mimeType?: string; // MIME type of file
  fileSize?: number | string; // File size in bytes

  // SmeMartDocument-specific fields
  engagementId: string; // Foreign key to Engagement
  zbFileId: string; // ZB FileService file ID
  zbFileVersionId: string; // ZB FileService version ID
  filename: string; // Original filename from upload
  fileSizeBytes?: number | null; // File size in bytes
  documentType: DocumentType;
  displayName?: string | null; // User-friendly display name
  archived: boolean;

  // Task attachment (Plan 033 Phase 1 — vendor evidence uploads)
  zbTaskId?: string | null; // Link to ZB Task
  zbTaskAttachmentId?: string | null; // Attachment record ID in ZB Task

  // Metadata
  uploadedByZerobiasUserId: string;

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Optional nested relationships
  engagement?: GqlEngagementResponse; // Parent engagement (if queried)
  // downloadUrl can be derived from zbFileVersionId or included from File base
}
