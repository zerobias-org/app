/**
 * Vendor profile — six typed classes replacing the MarketplaceProfileItem blob.
 *
 * The blob stored six section-discriminated JSON payloads in one class. Each section
 * now has its own schema class, transcribed from the shipped smemart package
 * (schema/package/w3geekery/smemart/ts/src/class/*.ts), not from a planning doc.
 *
 * CARDINALITY IS NOT UNIFORM. OrgProfile and FinancialProfile are 1:1 per org — an org
 * has one identity and one financial position. The other four are 1:many. The tab needs
 * both interaction modes; see SECTION_CARDINALITY.
 *
 * All five attestation classes extend VendorAttestationBase -> Verifiable, so every row
 * carries its own provenance. This page is the org's attestation surface, not a set of
 * self-reported blobs.
 */

// ── Provenance, from Verifiable ──────────────────────────────────────────────

/** The five provenance fields every attestation row carries. */
export interface VerifiableFields {
  verified: boolean;
  verificationSource: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  verificationExpiresAt: string | null;
}

// ── Closed enums (generated classes type these as bare string) ───────────────

/** Shared 7-value taxonomy with the contact-us CRM Business Classification field. */
export type BusinessClassification =
  | 'NONPROFIT'
  | 'GOVERNMENT'
  | 'HOSPITAL_HEALTHCARE'
  | 'PUBLICLY_TRADED'
  | 'PE_BACKED'
  | 'PRIVATELY_HELD'
  | 'INDIVIDUAL_SOLE_PROPRIETOR';

/**
 * Employee headcount band. The 100 boundary aligns with ZeroBias Foundation/Guild
 * eligibility, so guildEligible is derivable from the band. Matches the contact-us CRM
 * picklist 1:1 — do not re-band without updating both.
 */
export type EmployeeCountBand =
  | 'BAND_1_10'
  | 'BAND_11_50'
  | 'BAND_51_100'
  | 'BAND_101_500'
  | 'BAND_500_PLUS';

export const BUSINESS_CLASSIFICATION_LABELS: Record<BusinessClassification, string> = {
  NONPROFIT: 'Nonprofit / Not-for-profit',
  GOVERNMENT: 'Government',
  HOSPITAL_HEALTHCARE: 'Hospital / Healthcare Institution',
  PUBLICLY_TRADED: 'Publicly-traded Company',
  PE_BACKED: 'PE-backed Company',
  PRIVATELY_HELD: 'Privately-held Company',
  INDIVIDUAL_SOLE_PROPRIETOR: 'Individual / Sole Proprietor',
};

export const EMPLOYEE_COUNT_LABELS: Record<EmployeeCountBand, string> = {
  BAND_1_10: '1-10 employees',
  BAND_11_50: '11-50 employees',
  BAND_51_100: '51-100 employees',
  BAND_101_500: '101-500 employees',
  BAND_500_PLUS: '500+ employees',
};

// ── The six section classes ─────────────────────────────────────────────────

/** Corporate identity. SINGLETON per org. Extends Verifiable but is NOT an attestation. */
export interface OrgProfileRecord extends VerifiableFields {
  id: string;
  orgId: string;
  legalName: string;
  dba: string | null;
  tagline: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  website: string | null;
  logoUrl: string | null;
  foundedYear: number | null;
  /** Was the free-text businessType. */
  businessClassification: BusinessClassification | null;
  /** Was the numeric numberOfEmployees. */
  employeeCount: EmployeeCountBand | null;
  primaryContactUserId: string | null;
}

/** Service capability. 1:many. Was the `attestation` section. */
export interface ServiceCapabilityRecord extends VerifiableFields {
  id: string;
  orgId: string;
  /** Was the free-text serviceType. A Catalog service-segment UUID. */
  serviceSegmentId: string | null;
  yearsExperience: number | null;
  clientCount: number | null;
  avgProjectDuration: string | null;
}

/** Insurance coverage. 1:many. */
export interface InsuranceCoverageRecord extends VerifiableFields {
  id: string;
  orgId: string;
  carrier: string | null;
  policyNumber: string | null;
  coverageType: string | null;
  coverageAmount: number | null;
  currency: string | null;
  effectiveDate: string | null;
  /** Was expirationDate. */
  expiresAt: string | null;
  certificateUrl: string | null;
}

/** Client reference. 1:many. */
export interface ClientReferenceRecord extends VerifiableFields {
  id: string;
  orgId: string;
  clientName: string | null;
  /** Was contactPerson. */
  contactName: string | null;
  /** Was email. */
  contactEmail: string | null;
  /** Was phone. */
  contactPhone: string | null;
  relationship: string | null;
  projectName: string | null;
  startDate: string | null;
  endDate: string | null;
  /** Was outcome. */
  summary: string | null;
}

/** Key personnel. 1:many. */
export interface PersonnelRecord extends VerifiableFields {
  id: string;
  orgId: string;
  /** Was name. */
  fullName: string | null;
  title: string | null;
  email: string | null;
  specialization: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  isKeyPersonnel: boolean | null;
  backgroundCheckStatus: string | null;
  /**
   * Platform User this person maps to. NULLABLE — and load-bearing: UserCredential is
   * keyed on userId, so a Personnel row without one cannot hold credentials.
   */
  userId: string | null;
  roleId: string | null;
}

/** Financial position. SINGLETON per org. */
export interface FinancialProfileRecord extends VerifiableFields {
  id: string;
  orgId: string;
  annualRevenue: number | null;
  revenueCurrency: string | null;
  creditScore: number | null;
  creditRatingAgency: string | null;
  bankName: string | null;
  dunsNumber: string | null;
  yearEndMonth: number | null;
}

// ── Credential claim junctions ──────────────────────────────────────────────

/**
 * An org's claim on an org-scope catalog credential.
 *
 * Same shape as the six Provider* expertise junctions: owner id + catalog ref +
 * attributes + provenance. `securityCredential` is the SecurityCredential catalog UUID.
 */
export interface OrgCredentialRecord extends VerifiableFields {
  id: string;
  orgId: string;
  securityCredential: string | null;
  credentialNumber: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  notes: string | null;
}

/** A user's claim on an individual-scope catalog credential. Keyed on userId, not orgId. */
export interface UserCredentialRecord extends VerifiableFields {
  id: string;
  userId: string;
  securityCredential: string | null;
  credentialNumber: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  notes: string | null;
}

/**
 * Catalog entry a credential claim points at.
 *
 * `scope` gates which junction is legal: an individual-scope entry is claimable via
 * UserCredential, an org-scope one via OrgCredential. A picker MUST filter on it.
 * `frameworkIds` is legitimately empty on most entries — treat empty as normal, not as
 * missing data.
 */
export interface SecurityCredentialRecord {
  id: string;
  name: string;
  code: string | null;
  scope: 'individual' | 'org' | 'product' | null;
  ecosystemCode: string | null;
  proficiency: string | null;
  frameworkIds: string[];
  issuerVendorId: string | null;
  sourceUrl: string | null;
  status: string | null;
}

// ── Section wiring ──────────────────────────────────────────────────────────

/** UI grouping on the profile tab. One section per schema class. */
export type SectionType =
  | 'corporate_identity'
  | 'attestation'
  | 'insurance'
  | 'reference'
  | 'personnel'
  | 'financial';

/** Which schema class backs each section. */
export const SECTION_CLASS = {
  corporate_identity: 'OrgProfile',
  attestation: 'ServiceCapability',
  insurance: 'InsuranceCoverage',
  reference: 'ClientReference',
  personnel: 'Personnel',
  financial: 'FinancialProfile',
} as const;

/**
 * Singleton sections hold at most one row per org and render an edit-in-place form.
 * The other four are collections with add/remove.
 */
export const SECTION_CARDINALITY: Record<SectionType, 'one' | 'many'> = {
  corporate_identity: 'one',
  financial: 'one',
  attestation: 'many',
  insurance: 'many',
  reference: 'many',
  personnel: 'many',
};

export const SECTION_LABELS: Record<SectionType, string> = {
  corporate_identity: 'Corporate Identity',
  attestation: 'Service Capabilities',
  insurance: 'Insurance',
  reference: 'Client References',
  personnel: 'Key Personnel',
  financial: 'Financial',
};

/** Any row the profile tab can render. */
export type VendorProfileRecord =
  | OrgProfileRecord
  | ServiceCapabilityRecord
  | InsuranceCoverageRecord
  | ClientReferenceRecord
  | PersonnelRecord
  | FinancialProfileRecord;

/** Every section's rows, as the tab consumes them. */
export interface VendorProfileBundle {
  corporate_identity: OrgProfileRecord | null;
  financial: FinancialProfileRecord | null;
  attestation: ServiceCapabilityRecord[];
  insurance: InsuranceCoverageRecord[];
  reference: ClientReferenceRecord[];
  personnel: PersonnelRecord[];
}
