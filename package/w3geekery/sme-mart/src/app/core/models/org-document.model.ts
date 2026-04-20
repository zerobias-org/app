/**
 * OrgDocument — a file owned by an Organization.
 *
 * Stored via ZB FileService (S3). Metadata tracked in Neon
 * `org_documents` table. Can be shared with engagements/projects
 * via `org_document_shares` join table.
 *
 * Plan 046: Org-Level Document Management
 */

import type { DocumentType } from './document.model';

export interface OrgDocument {
  id: string;
  org_id: string;

  // File identity
  zb_file_id: string | null;
  zb_file_version_id: string | null;
  filename: string;
  mime_type?: string | null;
  file_size_bytes?: number | null;

  // Classification
  document_type: DocumentType;
  display_name?: string | null;
  description?: string | null;

  // Metadata
  uploaded_by_zerobias_user_id: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
}

/** Extended view with share counts (from v_org_document_detail) */
export interface OrgDocumentDetail extends OrgDocument {
  project_share_count: number;
  engagement_share_count: number;
  task_share_count: number;
  /** True if any share has non-'all' visibility (buyer_only or provider_only). */
  has_restricted_shares: boolean;
}

export type ShareTargetType = 'engagement' | 'project' | 'task' | 'note';

/** Controls which party in an engagement can see a shared document. */
export type ShareVisibility = 'all' | 'buyer_only' | 'provider_only';

export interface OrgDocumentShare {
  id: string;
  document_id: string;
  shared_with_type: ShareTargetType;
  shared_with_id: string;
  visibility: ShareVisibility;
  granted_at: string;
  granted_by: string;
}
