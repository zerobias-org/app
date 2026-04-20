/**
 * SmeMartResource — mirrors ZeroBias platform Resource base class.
 *
 * Every SME Mart entity (Note, NoteFolder, WorkRequest, Bid, Review,
 * ServiceOffering) can be represented as a SmeMartResource for unified
 * tagging, linking, and search. On migration day, SmeMartResource maps
 * field-by-field to ZB's Resource class.
 *
 * See: Plan 030 (sme-mart-resource-abstraction.md)
 */

// ── Resource types ──

/** Resource types — each becomes a ZB resource type on migration */
export type SmeMartResourceType =
  | 'sme-mart:note'
  | 'sme-mart:note-folder'
  | 'sme-mart:work-request'
  | 'sme-mart:bid'
  | 'sme-mart:review'
  | 'sme-mart:service-offering'
  | 'sme-mart:document';

/** Human-readable labels for resource types */
export const RESOURCE_TYPE_LABELS: Record<SmeMartResourceType, string> = {
  'sme-mart:note': 'Note',
  'sme-mart:note-folder': 'Notebook',
  'sme-mart:work-request': 'Engagement',
  'sme-mart:bid': 'Bid',
  'sme-mart:review': 'Review',
  'sme-mart:service-offering': 'Service Offering',
  'sme-mart:document': 'Document',
};

/** Material icon for each resource type */
export const RESOURCE_TYPE_ICONS: Record<SmeMartResourceType, string> = {
  'sme-mart:note': 'description',
  'sme-mart:note-folder': 'folder',
  'sme-mart:work-request': 'handshake',
  'sme-mart:bid': 'request_quote',
  'sme-mart:review': 'rate_review',
  'sme-mart:service-offering': 'storefront',
  'sme-mart:document': 'attach_file',
};

// ── Base resource interface ──

/**
 * Base resource interface — mirrors ZB Resource field names.
 * Every SME Mart entity implements this via a mapper function.
 */
export interface SmeMartResource {
  // ZB Resource-compatible fields (same names, same semantics)
  id: string;
  name: string;
  type: SmeMartResourceType;
  ownerId: string;             // zerobias_user_id of creator/owner
  created: string;             // ISO timestamp
  updated: string;             // ISO timestamp
  description?: string | null;
  parentId?: string | null;    // folder_id, parent_id, request_id, etc.
  deleted?: string | null;     // soft-delete timestamp (null = active)
  boundaryId?: string | null;  // ZB boundary ID

  // SME Mart context (not in ZB Resource, needed for scoping)
  engagementId?: string | null; // links to work_requests.id
  projectId?: string | null;
}

/** Resource with resolved tags (mirrors ZB ResourceView) */
export interface SmeMartResourceView extends SmeMartResource {
  tags: SmeMartResourceTag[];
}

// ── Tag assignments ──

/** Tag assignment record (Neon-backed, migrates to ResourceApi.tagResource) */
export interface SmeMartResourceTag {
  resourceId: string;
  resourceType: SmeMartResourceType;
  zbTagId: string;             // ZB platform tag ID
  zbTagName: string;           // Full prefixed name
  displayName: string;         // Prefix-stripped name
  assignedAt: string;
  assignedBy: string;          // zerobias_user_id
}

/** Row shape from sme_resource_tags Neon table */
export interface SmeMartResourceTagRow {
  resource_id: string;
  resource_type: SmeMartResourceType;
  zb_tag_id: string;
  zb_tag_name: string;
  assigned_at: string;
  assigned_by: string;
}

// ── Resource links ──

/** Link types — mirrors ZB link type semantics */
export type SmeMartLinkType =
  | 'relates_to'       // generic relationship
  | 'references'       // note references a work request, etc.
  | 'child_of'         // hierarchical (folder→subfolder, note→folder)
  | 'evidence_for'     // note/document is evidence for a finding/requirement
  | 'deliverable_for'  // note is a deliverable for an engagement
  | 'attachment_for';  // document attached to a task or engagement

/** Human-readable labels for link types */
export const LINK_TYPE_LABELS: Record<SmeMartLinkType, string> = {
  relates_to: 'Relates To',
  references: 'References',
  child_of: 'Child Of',
  evidence_for: 'Evidence For',
  deliverable_for: 'Deliverable For',
  attachment_for: 'Attachment For',
};

/** All link types as array for dropdowns */
export const ALL_LINK_TYPES: SmeMartLinkType[] = [
  'relates_to', 'references', 'child_of', 'evidence_for', 'deliverable_for', 'attachment_for',
];

/** All resource types as array for dropdowns */
export const ALL_RESOURCE_TYPES: SmeMartResourceType[] = [
  'sme-mart:note', 'sme-mart:note-folder', 'sme-mart:work-request',
  'sme-mart:bid', 'sme-mart:review', 'sme-mart:service-offering',
  'sme-mart:document',
];

/** Resource link (Neon-backed, migrates to ResourceApi.linkResources) */
export interface SmeMartResourceLink {
  id: string;
  fromResourceId: string;
  fromResourceType: SmeMartResourceType;
  toResourceId: string;
  toResourceType: SmeMartResourceType;
  linkType: SmeMartLinkType;
  created: string;
  createdBy: string;
  context?: Record<string, unknown>;
}

/** Row shape from sme_resource_links Neon table */
export interface SmeMartResourceLinkRow {
  id: string;
  from_resource_id: string;
  from_resource_type: SmeMartResourceType;
  to_resource_id: string;
  to_resource_type: SmeMartResourceType;
  link_type: SmeMartLinkType;
  created_at: string;
  created_by: string;
  context: Record<string, unknown> | null;
}

// ── Search options ──

export interface ResourceSearchOptions {
  engagementId?: string;
  type?: SmeMartResourceType;
  query?: string;           // full-text on name + description
  zbTagIds?: string[];      // must have ALL of these tags
  boundaryId?: string;
  page?: number;
  pageSize?: number;
}
