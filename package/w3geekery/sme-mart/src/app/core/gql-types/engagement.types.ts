/**
 * GQL Response Types for Engagement entity
 *
 * Engagement represents a buyer's RFP/work request in the SME marketplace.
 * Maps to WorkRequest table in Neon (renamed to Engagement in GQL schema).
 */

/**
 * GQL Engagement response type
 *
 * Extends Object base class (inherited fields: id, name, description, tags, links, dates)
 */
export interface GqlEngagementResponse {
  // Object inherited fields (from GQL Object base class)
  id: string;
  name: string; // Mapped from WorkRequest.title
  description?: string;

  // Engagement-specific fields
  category?: string;
  buyerZerobiasUserId: string;
  buyerZerobiasOrgId?: string | null;
  budgetType?: string;
  budgetMin?: string | number;
  budgetMax?: string | number;
  timeline?: string;
  status: string; // Enum: PUBLISHED, DRAFT, CLOSED, etc.
  engagementTag?: string; // SME Mart tag for engagement phase tracking
  zerobiasTagId?: string; // Platform tag ID for cross-reference
  zerobiasTaskId?: string; // Link to platform Task (if approval workflow exists)

  // Timestamps (from Object)
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Optional nested relationships
  // (populated only when explicitly queried)
  bids?: any[]; // Proposals/bids submitted for this engagement (GqlBidResponse[])
  notes?: any[]; // Engagement notes (GqlNoteResponse[])
  documents?: any[]; // Uploaded documents (GqlDocumentResponse[])
  reviews?: any[]; // Post-engagement reviews (GqlReviewResponse[])
}
