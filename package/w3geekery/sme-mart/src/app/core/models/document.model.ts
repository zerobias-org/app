/**
 * EngagementDocument — a file uploaded to an engagement.
 *
 * Stored via ZB FileService (S3). Metadata tracked in Neon
 * `engagement_documents` table. Used by both buyer uploads (Plan 031)
 * and vendor evidence uploads (Plan 033).
 *
 * Resource type: `sme-mart:document`
 */

export type DocumentType =
  | 'security_requirements'
  | 'sow'
  | 'budget'
  | 'legal_terms'
  | 'compliance'
  | 'functional_spec'
  | 'other';

export interface EngagementDocument {
  id: string;
  engagement_id: string;

  // File identity
  zb_file_id: string;
  zb_file_version_id: string;
  filename: string;
  mime_type?: string | null;
  file_size_bytes?: number | null;

  // Classification
  document_type: DocumentType;
  display_name?: string | null;
  description?: string | null;

  // Task attachment
  zb_task_id?: string | null;
  zb_task_attachment_id?: string | null;

  // Metadata
  uploaded_by_zerobias_user_id: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
}
