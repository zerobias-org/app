/**
 * GQL Response Types for Engagement entity
 *
 * Engagement represents a corp-to-corp agreement (buyer org ↔ provider org).
 * RFP fields moved to SmeMartProject in Plan 075.
 */

/**
 * GQL Engagement response type
 *
 * Extends Object base class (inherited fields: id, name, description, tags, links, dates)
 */
export interface GqlEngagementResponse {
  // Object inherited fields (from GQL Object base class)
  id: string;
  name: string;
  description?: string;
  tag?: Array<{ value: string }> | null; // Object tag array for demo-visibility gating

  // Engagement-specific fields (RFP fields removed in schema PR #20)
  buyerZerobiasUserId: string;
  buyerZerobiasOrgId?: string | null;
  status: string; // Enum: in_progress, completed, cancelled
  engagementTag?: string; // SME Mart tag for engagement phase tracking
  zerobiasTagId?: string; // Platform tag ID for cross-reference
  zerobiasTaskId?: string; // Link to platform Task (if approval workflow exists)

  // Timestamps (from Object)
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Optional nested relationships
  // (populated only when explicitly queried)
  notes?: Record<string, unknown>[]; // Engagement notes (GqlNoteResponse[])
  documents?: Record<string, unknown>[]; // Uploaded documents (GqlDocumentResponse[])
  reviews?: Record<string, unknown>[]; // Post-engagement reviews (GqlReviewResponse[])
}
