/**
 * GQL Response Types for Review entity
 *
 * Review represents a post-engagement rating/feedback of a provider.
 * May link to a ZB Task for approval workflow (future).
 */

// Forward declare to avoid circular dependency
type GqlEngagementResponse = any;

/**
 * GQL Review response type
 *
 * Extends Object base class (inherited fields: id, description, tags, links, dates)
 * Links to: Engagement, Provider (implicit via providerId), Task (if approval workflow)
 */
export interface GqlReviewResponse {
  // Object inherited fields
  id: string;
  name?: string; // Typically "Review of [provider] from [engagement]"
  description?: string;

  // Review-specific fields
  providerId: string;
  reviewerZerobiasUserId: string;
  engagementId: string; // Foreign key to Engagement being reviewed
  rating: number; // Rating scale (e.g., 1-5 or 1-10)
  reviewText?: string | null; // Free-form review content
  approved: boolean; // Admin approval flag
  approvedAt?: string | null; // ISO 8601 when approved
  approvedBy?: string | null; // User who approved

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Optional nested relationships
  engagement?: GqlEngagementResponse; // Parent engagement (if queried)
  // approvalTask?: GqlTaskResponse; // Link to approval Task (if implemented)
}
