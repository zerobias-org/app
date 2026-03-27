/**
 * GraphQL Response Type Definitions for SME Mart Entities
 *
 * These types define the structure of responses from AuditgraphDB GQL queries.
 * Field names follow camelCase GQL convention (matching AuditgraphDB schema).
 *
 * Generated: 2026-03-18
 */

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export type ComplianceStatus = 'met' | 'partially_met' | 'not_met' | 'not_applicable' | 'planned';

export type EngagementStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export type BidStatus = 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type NoteAccessLevel = 'personal' | 'boundary' | 'project';

export type DocumentType = 'security_requirements' | 'sow' | 'budget' | 'legal_terms' | 'compliance' | 'functional_spec' | 'other';

export type PricingType = 'fixed' | 'hourly' | 'subscription' | 'custom';

// ─────────────────────────────────────────────────────────────────────────────
// Base Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Base interface for all SME Mart entities with common metadata
 */
export interface GqlBaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Engagement Type
// ─────────────────────────────────────────────────────────────────────────────

export interface GqlEngagementResponse extends GqlBaseEntity {
  name: string;
  description?: string | null;
  category?: string | null;
  buyerZerobiasUserId: string;
  buyerZerobiasOrgId?: string | null;
  budgetType?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  timeline?: string | null;
  status: EngagementStatus;
  engagementTag?: string | null;
  zerobiasTagId?: string | null;
  zerobiasBoundaryId?: string | null;
  zerobiasTaskId?: string | null;
  facilitatorUserId?: string | null; // third-party consultant (Plan 056)
  communicationMode?: string | null; // 'direct' | 'mediated' (Plan 056)
  notes?: GqlNoteResponse[] | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bid Type
// ─────────────────────────────────────────────────────────────────────────────

export interface GqlPricingBreakdownItem {
  taskType: string;
  estimatedHours: number;
  estimatedCost: number;
  notes?: string | null;
}

export interface GqlBidWizardData {
  approach?: {
    executiveSummary?: string;
    coverLetter?: string;
  };
  team?: {
    teamDescription?: string;
  };
  pricing?: {
    proposedPrice?: string;
    proposedTimeline?: string;
    totalEstimatedHours?: number;
    pricingBreakdown?: GqlPricingBreakdownItem[];
  };
}

export interface GqlBidResponse extends GqlBaseEntity {
  engagementId: string;
  project?: string | null;
  providerId: string;
  coverLetter?: string | null;
  proposedPrice?: string | null;
  proposedTimeline?: string | null;
  executiveSummary?: string | null;
  teamDescription?: string | null;
  totalEstimatedHours?: number | null;
  pricingBreakdown?: GqlPricingBreakdownItem[] | null;
  status: BidStatus;
  wizardData?: GqlBidWizardData | null;
  wizardStep?: number | null;
  aiAssisted?: boolean | null;
  aiModel?: string | null;
  aiGeneratedAt?: string | null;
  pricingModel?: string | null; // 'fixed' | 'hourly' | 'milestone' | 'nrc_arc' (Plan 055)
  bidValidUntil?: string | null; // ISO date — bid expiration (Plan 055)
}

// ─────────────────────────────────────────────────────────────────────────────
// BidResponse Type
// ─────────────────────────────────────────────────────────────────────────────

export interface GqlBidResponseResponse extends GqlBaseEntity {
  bidId: string;
  requirementId: string;
  complianceStatus: ComplianceStatus;
  responseText?: string | null;
  estimatedHours: number;
  estimatedCost: number;
  certificationRef?: string | null;
  readyDate?: string | null;
  respondedAt?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// NoteFolder Type
// ─────────────────────────────────────────────────────────────────────────────

export interface GqlNoteFolderResponse extends GqlBaseEntity {
  engagementId: string;
  parentId?: string | null;
  name: string;
  description?: string | null;
  createdByZerobiasUserId: string;
  accessLevel: NoteAccessLevel;
  sortOrder?: number | null;
  color?: string | null;
  notes?: GqlNoteResponse[] | null;
  children?: GqlNoteFolderResponse[] | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Note Type
// ─────────────────────────────────────────────────────────────────────────────

export interface GqlNoteResponse extends GqlBaseEntity {
  engagementId?: string | null;
  folderId?: string | null;
  name: string;          // Object base class — used as note title
  content?: string | null; // Custom property — rich-text note body
  authorZerobiasUserId: string;
  updatedByZerobiasUserId?: string | null;
  archived: boolean;
  accessLevel: NoteAccessLevel;
  isMeetingMinutes: boolean;
  meetingDate?: string | null;
  meetingDurationMinutes?: number | null;
  backingTaskId?: string | null;
  injectedToTaskId?: string | null;
  injectedCommentId?: string | null;
  injectedAt?: string | null;
  boundaryId?: string | null;
  projectId?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ServiceOffering Type
// ─────────────────────────────────────────────────────────────────────────────

export interface GqlServiceOfferingResponse extends GqlBaseEntity {
  name: string;
  description?: string | null;
  providerId: string;
  category?: string | null;
  subcategory?: string | null;
  pricingType?: PricingType | null;
  price?: string | null;
  deliveryTime?: string | null;
  includes?: string[] | null;
  requirements?: string | null;
  isActive: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Review Type
// ─────────────────────────────────────────────────────────────────────────────

export interface GqlReviewResponse extends GqlBaseEntity {
  name: string;
  providerId: string;
  reviewerZerobiasUserId: string;
  engagementId: string;
  rating: number;
  reviewText?: string | null;
  approved: boolean;
  approvedAt?: string | null;
  approvedBy?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SmeMartDocument (EngagementDocument) Type
// ─────────────────────────────────────────────────────────────────────────────

export interface GqlDocumentResponse extends GqlBaseEntity {
  engagementId: string;
  zbFileId: string;
  zbFileVersionId?: string | null;
  filename: string;
  name: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  documentType?: DocumentType | null;
  displayName?: string | null;
  description?: string | null;
  zbTaskId?: string | null;
  zbTaskAttachmentId?: string | null;
  archived: boolean;
  uploadedByZerobiasUserId?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SME Mart Project Management Types
// ─────────────────────────────────────────────────────────────────────────────

export type SmeMartPartition = 'demand' | 'supply' | 'execution' | 'P1';

export type ActivityWorkflowStatus = 'todo' | 'in_progress' | 'awaiting_approval' | 'done' | 'cancelled';

export interface GqlCustomField {
  name?: string | null;
  value?: string | null;
  type?: string | null;
  defaultValue?: string | number | null;
  story_points?: number | null;
}

export interface GqlWorkflowTransition {
  from: string;
  to: string;
  action?: string | null;
  label?: string | null;
}

export interface GqlTaskTypePricing {
  taskTypeId: string;
  minHours?: number | null;
  maxHours?: number | null;
  ratePerHour?: string | null;
}

export interface GqlSmeMartProjectResponse extends GqlBaseEntity {
  name: string;
  description?: string | null;
  ownerId?: string | null;
  boundaryId?: string | null;
  partition?: SmeMartPartition | null;
  status?: string | null;
  engagementId?: string | null; // scalar mirror of engagement link (schema v1.0.9)
  projectType?: string | null; // 'rfp' | 'pilot' | 'project' (Plan 077)
  startDate?: string | null;
  endDate?: string | null;
  targetEndDate?: string | null;
  color?: string | null;
  notes?: string | null;
  title?: string | null;
}

export interface GqlSmeMartBoardResponse extends GqlBaseEntity {
  code?: string | null;
  name: string;
  projectId?: string | null;
  partition?: SmeMartPartition | null;
  description?: string | null;
  color?: string | null;
  scope?: string | null;
  parentId?: string | null;
}

export interface GqlSmeMartActivityResponse extends GqlBaseEntity {
  name: string;
  description?: string | null;
  workflowId?: string | null;
  boardId?: string | null;
  icon?: string | null;
  color?: string | null;
  customFields?: GqlCustomField[] | null;
  type?: string | null;
}

export interface GqlSmeMartWorkflowResponse extends GqlBaseEntity {
  name: string;
  description?: string | null;
  status?: string | null;
  states?: string[] | null;
  statuses?: (string | { name: string; color?: string })[] | null;
  transitions?: GqlWorkflowTransition[] | null;
  defaultState?: string | null;
}

export interface GqlSmeMartTaskResponse extends GqlBaseEntity {
  boardId?: string | null;
  activityId?: string | null;
  parentId?: string | null;
  title?: string | null;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  status?: ActivityWorkflowStatus | null;
  assignedTo?: string | null;
  priority?: string | number | null;
  rank?: number | null;
  estimatedHours?: number | null;
  dueDate?: string | null;
  customFields?: GqlCustomField[] | null;
  transparencyConfig?: string | null; // JSON publish/private controls (Plan 078)
}

export interface GqlProjectPrdResponse extends GqlBaseEntity {
  parentId: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  summary?: string | null;
  content?: string | null;
  sections?: GqlPrdSectionResponse[] | null;
  sourceDocuments?: string[] | null;
}

export interface GqlPrdSectionResponse extends GqlBaseEntity {
  parentId: string;
  title?: string | null;
  name?: string | null;
  content?: string | null;
  sortOrder?: number | null;
  type?: string | null;
  sourceDocuments?: string[] | null;
}

export interface GqlProjectPlanResponse extends GqlBaseEntity {
  parentId: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  approach?: string | null;
  estimatedDuration?: string | null;
  content?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  milestones?: GqlPlanMilestoneResponse[] | null;
  teamStructure?: string | { lead: string; team_size: number; roles: string[] } | null;
}

export interface GqlPlanMilestoneResponse extends GqlBaseEntity {
  parentId: string;
  name: string;
  title?: string | null;
  description?: string | null;
  targetDate?: string | null;
  sortOrder?: number | null;
  status?: string | null;
}
