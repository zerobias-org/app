/**
 * GQL Response Types for EngagementVettingItem entity
 *
 * Corporate vetting checklist items scoped to an engagement.
 * Bidirectional: buyer and provider each have requirements of the other.
 *
 * Plan 063: Corporate Vetting Flow
 */

export interface GqlVettingItemResponse {
  // Object inherited fields
  id: string;
  name: string;
  description?: string | null;

  // Vetting-specific fields
  engagementId: string;
  category: string;          // always | conditional | nice_to_have
  vettingType: string;       // corporate_identity | insurance | compliance | financial | legal | reference | certification | documentation
  evidenceType: string;      // document | form | certification | attestation | reference
  status: string;            // not_started | submitted | under_review | verified | rejected | expired | waived
  direction: string;         // buyer_requires | provider_requires
  conditionTrigger?: string | null;
  documentIds?: string | null;  // JSON string of SmeMartDocument ID array
  submittedAt?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  expiresAt?: string | null;
  rejectionReason?: string | null;
  waivedReason?: string | null;
  notes?: string | null;

  // Timestamps (Object base class)
  dateCreated: string;
  dateLastModified: string;
}
