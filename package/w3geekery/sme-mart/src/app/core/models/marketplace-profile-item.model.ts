/**
 * MarketplaceProfileItem — vendor/buyer profile items with section-discriminated JSON data.
 *
 * Single class with 6 section types (insurance, attestation, corporate_identity, reference, personnel, financial).
 * Each section stores typed JSON in the `data` field, which service serializes/deserializes.
 *
 * Plan 041: Vendor Profile Service (Phase 9)
 * Plan 035: Vendor Profile Schema (Phase 8)
 */

// ── Enums ──

/**
 * Section type discriminator — determines which typed interface applies to the data field.
 * Per Phase 8 schema: UPPER_SNAKE_CASE enum values.
 */
export type SectionType =
  | 'corporate_identity'
  | 'attestation'
  | 'insurance'
  | 'reference'
  | 'personnel'
  | 'financial';

// ── Section Data Interfaces (provisional) ──

/**
 * Corporate identity profile data
 * @provisional — fields may evolve in Phase 10 (UI refinement)
 */
export interface CorporateIdentityData {
  legalEntityName: string;
  businessType: string;
  foundedYear: number;
  yearsInBusiness: number;
  certifications?: string[];
  numberOfEmployees?: number;
}

/**
 * Attestation/certification profile data
 * @provisional — fields may evolve in Phase 10 (UI refinement)
 */
export interface AttestationData {
  serviceType: string;
  yearsExperience: number;
  clientCount?: number;
  avgProjectDuration?: string;
  certifications?: string[];
  specializations?: string[];
}

/**
 * Insurance coverage profile data
 * @provisional — fields may evolve in Phase 10 (UI refinement)
 */
export interface InsuranceData {
  policyNumber: string;
  carrier: string;
  coverageType: string;
  coverageAmount: number;
  effectiveDate: string;
  expirationDate: string;
  limits?: string;
  deductible?: number;
}

/**
 * Client reference profile data
 * @provisional — fields may evolve in Phase 10 (UI refinement)
 */
export interface ReferenceData {
  clientName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  projectType: string;
  projectDuration: string;
  outcome?: string;
}

/**
 * Key personnel profile data
 * @provisional — fields may evolve in Phase 10 (UI refinement)
 */
export interface PersonnelData {
  name: string;
  title: string;
  yearsExperience: number;
  specialization: string;
  credentials?: string[];
  certifications?: string[];
}

/**
 * Financial profile data
 * @provisional — fields may evolve in Phase 10 (UI refinement)
 */
export interface FinancialData {
  annualRevenue: number;
  profitMargin: number;
  employeeCount: number;
  yearsOperating: number;
  revenueGrowth?: number;
}

// ── Domain Model (snake_case — matches Neon schema) ──

/**
 * MarketplaceProfileItem domain model
 *
 * Represents a profile item scoped to an organization.
 * The `data` field contains JSON-serialized section-specific content.
 * Org-scoped: single scalar orgId field (no bidirectional link to Organization).
 *
 * Base fields (inherited from Object class):
 * - id, name, description, dateCreated, dateLastModified (mapped to created_at, updated_at)
 *
 * Custom fields:
 * - section: SectionType enum (corporate_identity, attestation, insurance, reference, personnel, financial)
 * - data: JSON string (parsed to typed interface matching section)
 * - expiresAt: optional expiration date
 * - status: optional lifecycle state (e.g., "active", "archived")
 * - orgId: scalar string (org ownership, not a link)
 */
export interface MarketplaceProfileItem {
  id: string;
  org_id: string;                    // scalar, no link
  section: SectionType;              // discriminator
  name: string;                      // inherited from Object
  description?: string | null;       // inherited from Object
  data: string;                      // JSON string of section-specific data
  expires_at?: string | null;        // optional expiration (ISO 8601)
  status?: string | null;            // optional lifecycle state
  created_at: string;                // inherited from Object (dateCreated)
  updated_at: string;                // inherited from Object (dateLastModified)
}

// ── Request Types ──

/**
 * Request to create a new MarketplaceProfileItem
 *
 * The `data` field accepts a typed union of all 6 section data interfaces.
 * Service serializes to JSON string before Pipeline write.
 */
export interface CreateMarketplaceProfileItemRequest {
  section: SectionType;
  name: string;
  description?: string;
  data:
    | CorporateIdentityData
    | AttestationData
    | InsuranceData
    | ReferenceData
    | PersonnelData
    | FinancialData;
  expiresAt?: string;
  status?: string;
}

/**
 * Request to update an existing MarketplaceProfileItem
 *
 * All fields are optional (partial update).
 * If `data` is provided, service re-serializes to JSON string.
 */
export interface UpdateMarketplaceProfileItemRequest {
  section?: SectionType;
  name?: string;
  description?: string;
  data?:
    | CorporateIdentityData
    | AttestationData
    | InsuranceData
    | ReferenceData
    | PersonnelData
    | FinancialData;
  expiresAt?: string;
  status?: string;
}
