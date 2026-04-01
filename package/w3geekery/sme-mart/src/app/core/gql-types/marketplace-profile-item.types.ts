/**
 * GQL Response Types for MarketplaceProfileItem entity
 *
 * Vendor/buyer profile items with section-discriminated JSON data.
 * Data field is a JSON string that service parses into typed section interfaces.
 *
 * Plan 041: Vendor Profile Service (Phase 9)
 */

/**
 * GQL response type for MarketplaceProfileItem
 *
 * Represents profile items as returned by GraphQL.
 * All field names are in camelCase (GQL convention).
 *
 * The `data` field contains a JSON-serialized object matching one of 6 section types:
 * - CorporateIdentityData (corporate_identity)
 * - AttestationData (attestation)
 * - InsuranceData (insurance)
 * - ReferenceData (reference)
 * - PersonnelData (personnel)
 * - FinancialData (financial)
 *
 * Service must call JSON.parse(data) on read and JSON.stringify() on write.
 */
export interface GqlMarketplaceProfileItemResponse {
  // Object inherited fields
  id: string;
  name: string;
  description?: string | null;

  // MarketplaceProfileItem-specific fields
  orgId: string;                     // scalar org ownership
  section: string;                   // corporate_identity | attestation | insurance | reference | personnel | financial
  data: string;                      // JSON string — service must parse to typed object
  expiresAt?: string | null;         // optional expiration date (ISO 8601)
  status?: string | null;            // optional lifecycle state

  // Timestamps (Object base class)
  dateCreated: string;
  dateLastModified: string;
}
