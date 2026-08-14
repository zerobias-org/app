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

export type BidStatus = 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

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
  vendorId: string;
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
// VendorListing Type
//
// ServiceOffering was retired in smemart 2.0.8 and replaced by VendorListing.
// Its GQL response type lives in gql-types/vendor-listing.types.ts, following the
// per-file convention the newer types use.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Review Type
// ─────────────────────────────────────────────────────────────────────────────

export interface GqlReviewResponse extends GqlBaseEntity {
  name: string;
  vendorId: string;
  reviewerZerobiasUserId: string;
  engagementId: string;
  rating: number;
  reviewText?: string | null;
  approved: boolean;
  approvedAt?: string | null;
  approvedBy?: string | null;
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
  isInvitationOnly?: boolean | null; // Plan 14 Wave 1: invitation controls
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

// Shapes below follow smemart/classes/*.yml. Every class extends Object, so `name`
// is required and id/createdAt/updatedAt come from GqlBaseEntity.
export interface GqlProjectPrdResponse extends GqlBaseEntity {
  name: string;
  title?: string | null;      // prd.title
  summary?: string | null;    // prd.summary
  projectId?: string | null;  // prd.projectId
  sections?: GqlPrdSectionResponse[] | null; // linkTo PrdSection.id.prd, multi
}

export interface GqlPrdSectionResponse extends GqlBaseEntity {
  name: string;
  sectionType?: string | null; // prdSection.sectionType
  title?: string | null;       // prdSection.title
  content?: string | null;     // prdSection.content
  sortOrder?: number | null;   // prdSection.sortOrder
  prdId?: string | null; // scalar mirror of the prd link
}

export interface GqlProjectPlanResponse extends GqlBaseEntity {
  name: string;
  title?: string | null;             // plan.title
  approach?: string | null;          // plan.approach
  estimatedDuration?: string | null; // plan.estimatedDuration
  teamStructure?: Record<string, unknown> | null; // plan.teamStructure
  projectId?: string | null;         // plan.projectId
  milestones?: GqlPlanMilestoneResponse[] | null; // linkTo PlanMilestone.id.plan, multi
}

export interface GqlPlanMilestoneResponse extends GqlBaseEntity {
  name: string;
  targetDate?: string | null; // milestone.targetDate
  status?: string | null;     // milestone.status
  sortOrder?: number | null;  // milestone.sortOrder
  planId?: string | null; // scalar mirror of the plan link
}

// ─────────────────────────────────────────────────────────────────────────────
// RfpInvitation Type (Plan 14 Wave 1 — Invitation Controls)
// ─────────────────────────────────────────────────────────────────────────────

export type RfpInvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired' | 'requested';

export interface GqlRfpInvitationResponse extends GqlBaseEntity {
  projectId: string;
  vendorOrgId: string;
  status: RfpInvitationStatus;
  invitedAt: string;
  respondedAt?: string | null;
  invitationMessage?: string | null;
  requestReason?: string | null;
}
