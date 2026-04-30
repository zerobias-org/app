/**
 * CompanyInfoStruct — the form's data model (struct-shaped, mirrors form bindings)
 * Uses camelCase field names for TypeScript/form binding convenience.
 */
export interface CompanyInfoStruct {
  legalName: string;           // required
  dba?: string;                // optional
  logoUrl?: string;            // optional, URL
  shortBlurb?: string;         // optional, ≤ 500 chars
  longDescription?: string;    // optional, ≤ 5000 chars
  primaryContact?: {
    userId?: string;           // UUID
    name?: string;
    email?: string;            // RFC5322
  };
  website?: string;            // optional, URL
  hqLocation?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  yearsInBusiness?: number;    // optional, integer ≥ 0
  employeeCount?: string;      // optional, one of: '1-10', '11-50', '51-200', '201-500', '500+'
}

/**
 * MarketplaceProfileItemRecord — the MPI record DTO for Pipeline.receive
 * Flat structure with plain-string data field (no JSON-encoded values).
 * Replace key is id only; per-section independence validated via UAT experiment.
 */
export interface MarketplaceProfileItemRecord {
  id: string;                  // deterministic: 'mpi-<orgId>-<section>'
  orgId: string;
  section: string;             // from company-info-sections.ts
  data: string;                // always plain string
  status: 'active' | 'archived'; // typically 'active'
}

/**
 * DirtyDiffSnapshot — snapshot for dirty-field tracking
 * Captures original pre-fill state to enable dirty-only writes on save.
 */
export interface DirtyDiffSnapshot {
  original: Partial<CompanyInfoStruct>;
  current: Partial<CompanyInfoStruct>;
}

/**
 * DirtyFields — helper type for save operations
 * Maps section names to their values for dirty-only record generation.
 */
export type DirtyFields = Record<string, string | number | undefined>;
