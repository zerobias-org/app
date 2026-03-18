/**
 * GQL Response Types for BidResponse entity
 *
 * BidResponse represents a vendor's response to a specific compliance requirement.
 * Each Bid can have multiple BidResponses (one per requirement).
 */

import type { GqlBidResponse } from './bid.types';

/**
 * Compliance status enumeration
 */
export type ComplianceStatus = 'met' | 'partially_met' | 'not_met' | 'not_applicable' | 'planned';

/**
 * GQL BidResponse response type
 *
 * Extends Object base class (inherited fields: id, name, description, tags, links, dates)
 * Links to: Bid (parent), Requirement
 */
export interface GqlBidResponseResponse {
  // Object inherited fields
  id: string;
  name?: string; // Typically requirement name + compliance status
  description?: string;

  // BidResponse-specific fields
  bidId: string; // Foreign key to Bid
  requirementId: string; // Foreign key to Requirement (if applicable)
  complianceStatus: ComplianceStatus;
  responseText?: string | null;
  estimatedHours?: number | null;
  estimatedCost?: number | null;
  certificationRef?: string | null; // Reference to certification satisfying requirement
  readyDate?: string | null; // When compliance will be ready (if planned)

  // Timestamps
  respondedAt?: string | null; // ISO 8601 when response was submitted
  updatedAt?: string | null; // ISO 8601

  // Optional nested relationships
  bid?: GqlBidResponse; // Parent bid (if queried)
}
