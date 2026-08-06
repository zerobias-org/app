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
 * employeeCount enum — 5 bands, keys verbatim from
 * `enums/orgProfile.employeeCount.yml` in smemart 2.0.7.
 *
 * The stored value is the enum KEY (`BAND_1_10`), not the label — same
 * convention as businessClassification above. The band boundary at 100 is
 * load-bearing: it aligns with the Foundation/Guild eligibility cutoff so
 * guildEligible is derivable, and it matches the contact-us CRM
 * Number_of_Employees picklist 1:1. Do not re-band without updating both.
 */
export enum EmployeeCountBand {
  BAND_1_10 = 'BAND_1_10',
  BAND_11_50 = 'BAND_11_50',
  BAND_51_100 = 'BAND_51_100',
  BAND_101_500 = 'BAND_101_500',
  BAND_500_PLUS = 'BAND_500_PLUS',
}

/**
 * CompanyInfoStruct — the form's data model (struct-shaped, mirrors form bindings)
 * Uses camelCase field names for TypeScript/form binding convenience.
 */
export interface CompanyInfoStruct {
  legalName: string;           // required -> OrgProfile.legalName
  dba?: string;                // optional -> OrgProfile.dba
  logoUrl?: string;            // optional, URL -> OrgProfile.logoUrl
  shortBlurb?: string;         // optional, ≤ 500 chars -> OrgProfile.shortDescription
  longDescription?: string;    // optional, ≤ 5000 chars -> OrgProfile.longDescription
  primaryContact?: {
    userId?: string;           // UUID -> OrgProfile.primaryContactUserId
    // NO BACKING FIELD. OrgProfile stores only the user id; the schema resolves
    // name/email from the platform User on read rather than denormalizing them.
    // These two are collected by the form and dropped on save until the form
    // shape is settled — see BACKLOG "profile form orphan fields".
    name?: string;
    email?: string;            // RFC5322
  };
  website?: string;            // optional, URL -> OrgProfile.website
  // NO BACKING FIELDS. The Address class was retired in smemart 2.0.7 in favour
  // of the platform base `address` document, and OrgProfile declares no address
  // property, so none of these five persist today.
  hqLocation?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  yearsInBusiness?: number;    // optional, integer ≥ 0 -> derived from OrgProfile.foundedYear
  employeeCount?: EmployeeCountBand;                // optional -> OrgProfile.employeeCount
  businessClassification?: BusinessClassification;  // optional, one of 7 LOCKED values
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
