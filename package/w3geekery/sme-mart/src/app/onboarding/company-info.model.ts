/**
 * businessClassification enum — 7 LOCKED values per D-57 (Director precision 2026-06-25)
 */
export enum BusinessClassification {
  NONPROFIT = 'NONPROFIT',
  GOVERNMENT = 'GOVERNMENT',
  HOSPITAL_HEALTHCARE = 'HOSPITAL_HEALTHCARE',
  PUBLICLY_TRADED = 'PUBLICLY_TRADED',
  PE_BACKED = 'PE_BACKED',
  PRIVATELY_HELD = 'PRIVATELY_HELD',
  INDIVIDUAL_SOLE_PROPRIETOR = 'INDIVIDUAL_SOLE_PROPRIETOR',
}

/**
 * employeeCount enum — 7 re-banded values per D-57 (published schema 2.0.6)
 */
export const EMPLOYEE_COUNT_VALUES = ['1-10', '11-50', '51-100', '101-500', '501-1000', '1001-5000', '5000+'] as const;
export type EmployeeCountValue = typeof EMPLOYEE_COUNT_VALUES[number];

/**
 * CompanyInfoStruct — the form's data model (struct-shaped, mirrors form bindings)
 * Uses camelCase field names for TypeScript/form binding convenience.
 */
export interface CompanyInfoStruct {
  legalName: string;           // required
  dba?: string;                // optional
  logoUrl?: string;            // optional, URL
  shortBlurb?: string;         // optional, ≤ 500 chars (maps to tagline)
  longDescription?: string;    // optional, ≤ 5000 chars
  primaryContact?: {
    userId?: string;           // UUID (maps to primaryContactUserId)
    name?: string;
    email?: string;            // RFC5322
  };
  website?: string;            // optional, URL
  hqLocation?: {
    street?: string;           // maps to street1
    city?: string;
    state?: string;            // maps to region
    country?: string;
    postalCode?: string;
  };
  yearsInBusiness?: number;    // optional, integer ≥ 0 (maps to foundedYear)
  employeeCount?: EmployeeCountValue;      // optional, one of 7 re-banded values
  businessClassification?: BusinessClassification;  // optional, one of 7 LOCKED values
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
