/**
 * Demo Data Models for SME Mart Entity Seeding
 *
 * TypeScript interfaces for demo entity payloads used in DemoDataService.
 * All fields use camelCase (matching GQL schema field names, not snake_case).
 *
 * Phase 5 Migration: Demo data now seeded via Pipeline instead of Neon SQL.
 */

/**
 * Demo Engagement payload.
 * Corresponds to GQL Engagement entity.
 */
export interface DemoEngagement {
  id: string;
  name: string;
  description: string;
  category: string;
  buyerZerobiasUserId: string;
  buyerZerobiasOrgId: string;
  budgetType: 'fixed' | 'hourly' | 'negotiable';
  budgetMin: number;
  budgetMax: number;
  timeline: string;
  status: string;
  engagementTag: string;
  zerobiasTagId: string;
  zerobiasTaskId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Demo Bid payload.
 * Corresponds to GQL Bid entity.
 */
export interface DemoBid {
  id: string;
  name: string;
  engagementId?: string; // Legacy — being replaced by project
  project: string; // GQL link field to SmeMartProject (Plan 075)
  providerId: string;
  coverLetter: string;
  proposedPrice: number;
  proposedTimeline: string;
  executiveSummary?: string;
  teamDescription?: string;
  totalEstimatedHours?: number;
  pricingBreakdown?: Record<string, unknown>[];
  status: string;
  wizardData?: Record<string, unknown>;
  wizardStep?: string;
  aiAssisted?: boolean;
  aiModel?: string;
  aiGeneratedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Demo BidResponse payload.
 * Corresponds to GQL BidResponse entity.
 */
export interface DemoBidResponse {
  id: string;
  name: string;
  bidId: string;
  requirementId: string;
  complianceStatus: 'met' | 'partially_met' | 'not_met' | 'not_applicable' | 'planned';
  responseText: string;
  estimatedHours?: number;
  estimatedCost?: number;
  certificationRef?: string;
  readyDate?: string;
  respondedAt?: string;
  updatedAt: string;
}

/**
 * Demo Note payload.
 * Corresponds to GQL Note entity.
 */
export interface DemoNote {
  id: string;
  name: string;
  engagementId: string;
  folderId?: string;
  title: string;
  body: string;
  authorZerobiasUserId: string;
  createdAt: string;
  updatedAt: string;
  updatedByZerobiasUserId?: string;
  archived: boolean;
  accessLevel: 'personal' | 'boundary' | 'project';
  meetingDate?: string;
  meetingDurationMinutes?: number;
  backingTaskId?: string;
  injectedToTaskId?: string;
  injectedCommentId?: string;
  injectedAt?: string;
  isMeetingMinutes: boolean;
  boundaryId?: string;
  projectId?: string;
}

/**
 * Demo NoteFolder payload.
 * Corresponds to GQL NoteFolder entity.
 */
export interface DemoNoteFolder {
  id: string;
  engagementId: string;
  parentId?: string;
  name: string;
  description?: string;
  createdByZerobiasUserId: string;
  createdAt: string;
  updatedAt: string;
  accessLevel: 'personal' | 'boundary' | 'project';
  sortOrder: number;
  color?: string;
}

/**
 * Demo SmeMartDocument payload.
 * Corresponds to GQL SmeMartDocument entity.
 */
export interface DemoSmeMartDocument {
  id: string;
  name: string;
  engagementId: string;
  zbFileId?: string;
  zbFileVersionId?: string;
  fileVersionId: string;
  size: number;
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  documentType: string;
  displayName: string;
  description?: string;
  zbTaskId?: string;
  zbTaskAttachmentId?: string;
  uploadedByZerobiasUserId: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
}

/**
 * Demo ServiceOffering payload.
 * Corresponds to GQL ServiceOffering entity.
 */
export interface DemoServiceOffering {
  id: string;
  providerId: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  pricingType: string;
  price: number;
  deliveryTime?: string;
  includes?: string[];
  requirements?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Demo SmeMartProject payload.
 * Corresponds to GQL SmeMartProject entity.
 * Serves as both project container AND RFP entity (Plan 075).
 */
export interface DemoSmeMartProject {
  id: string;
  name: string;
  description: string;
  status: string; // 'draft', 'published', 'active', 'completed', 'archived'
  engagement?: string; // GQL link field name — only for active projects under engagements
  startDate: string;  // YYYY-MM-DD
  targetEndDate?: string; // YYYY-MM-DD
  // RFP fields (Plan 075)
  category?: string;
  budgetType?: 'fixed' | 'hourly' | 'negotiable';
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  responseDeadline?: string; // ISO 8601
  questionsDeadline?: string; // ISO 8601
  buyerZerobiasUserId?: string; // for RFP ownership display
  buyerZerobiasOrgId?: string;
}

/**
 * Demo Review payload.
 * Corresponds to GQL Review entity.
 */
export interface DemoReview {
  id: string;
  name: string;
  providerId: string;
  reviewerZerobiasUserId: string;
  engagementId: string;
  rating: number;
  reviewText: string;
  approved: boolean;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}
