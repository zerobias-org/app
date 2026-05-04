/**
 * GQL Response Types for Bid entity (called Proposal in GQL schema)
 *
 * Bid represents a vendor's response to an engagement/RFP.
 * Contains pricing, timeline, and compliance response data.
 */

// Forward declare to avoid circular dependency
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GqlEngagementResponse = any;

/**
 * Pricing breakdown for bid (JSON object from wizard_data.pricing.pricing_breakdown)
 */
export interface GqlTaskTypePricing {
  taskType: string;
  estimatedHours: number;
  estimatedCost: number;
  notes?: string;
}

/**
 * GQL Bid response type (called Proposal in schema, but code uses Bid)
 *
 * Extends Object base class (inherited fields: id, name, description, tags, links, dates)
 * Links to: Engagement (bidirectional), ServiceOffering (optional)
 */
export interface GqlBidResponse {
  // Object inherited fields
  id: string;
  name?: string; // Typically derived from engagement title + provider
  description?: string;
  tag?: Array<{ value: string }> | null; // Object tag array for demo-visibility gating

  // Bid-specific fields
  engagementId?: string; // Legacy — removed from schema in Plan 075
  project?: string | { id: string }; // Link to SmeMartProject (scalar ID or nested object)
  providerId: string;
  coverLetter?: string;
  proposedPrice?: string | number;
  proposedTimeline?: string;
  executiveSummary?: string;
  teamDescription?: string;
  totalEstimatedHours?: number;
  pricingBreakdown?: GqlTaskTypePricing[]; // JSON array from pricing_breakdown
  status: string; // Enum: PENDING, ACCEPTED, REJECTED, WITHDRAWN

  // Wizard/draft state
  wizardData?: unknown; // JSON object from bid wizard (all steps as object)
  wizardStep?: number; // Current step in draft process (0-5)

  // AI-assisted generation metadata
  aiAssisted?: boolean;
  aiModel?: string;
  aiGeneratedAt?: string; // ISO 8601

  // Timestamps
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601

  // Optional nested relationships
  engagement?: GqlEngagementResponse; // Parent engagement (if queried)
  bidResponses?: GqlBidResponseResponse[]; // Compliance responses (if queried)
}

// Re-export BidResponse for nested relationship reference
// (Full definition in bid-response.types.ts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GqlBidResponseResponse = any; // Placeholder for circular dependency
