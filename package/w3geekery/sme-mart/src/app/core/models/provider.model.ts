import { ProficiencyLevel } from './enums';

/**
 * Phase 33 rewrite: org-scoped expertise junctions with Catalog FKs (no zerobias_ prefix)
 * and verification provenance per D-53.
 */

// ProviderSkill: expertise junction (org-scoped)
export interface ProviderSkill {
  id: string;
  orgId: string;                           // org-scoped (not provider_id)
  skillId: string;                         // Catalog FK (not zerobias_skill_id)
  proficiencyLevel: ProficiencyLevel | null;
  yearsExperience: number | null;
  verified: boolean;                       // per D-53: defaults false (asserted)
  verificationSource: string | null;       // per D-53: defaults null
  created_at: string;
}

// ProviderRole: expertise junction (org-scoped)
export interface ProviderRole {
  id: string;
  orgId: string;
  roleId: string;
  isPrimary: boolean;
  yearsInRole: number | null;
  verified: boolean;
  verificationSource: string | null;
  created_at: string;
}

// ProviderProduct: expertise junction (org-scoped)
export interface ProviderProduct {
  id: string;
  orgId: string;
  productId: string;
  proficiencyLevel: ProficiencyLevel | null;
  yearsExperience: number | null;
  certified: boolean;
  certificationDetails: string | null;
  verified: boolean;
  verificationSource: string | null;
  created_at: string;
}

// ProviderFramework: expertise junction (org-scoped)
export interface ProviderFramework {
  id: string;
  orgId: string;
  frameworkId: string;
  proficiencyLevel: ProficiencyLevel | null;
  yearsExperience: number | null;
  assessorCertified: boolean;
  implementationExperience: boolean;
  auditExperience: boolean;
  verified: boolean;
  verificationSource: string | null;
  created_at: string;
}

// ProviderSegment: expertise junction — capability segment (org-scoped)
export interface ProviderSegment {
  id: string;
  orgId: string;
  segmentId: string;
  isPrimary: boolean;
  verified: boolean;
  verificationSource: string | null;
  created_at: string;
}

// ProviderServiceSegment: expertise junction — service segment (org-scoped)
export interface ProviderServiceSegment {
  id: string;
  orgId: string;
  serviceSegmentId: string;
  isPrimary: boolean;
  verified: boolean;
  verificationSource: string | null;
  created_at: string;
}

// OrgProfile: replaces ProviderProfile; 1:1 org record (per D-54, published schema 2.0.6)
export interface OrgProfile {
  id: string;
  orgId: string;
  legalName: string;
  dba: string | null;
  tagline: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  website: string | null;
  logoUrl: string | null;
  employeeCount: string | null;           // enum: re-banded in 2.0.6 per D-57
  businessClassification: string | null;  // enum: 7 values per D-57
  foundedYear: number | null;
  primaryContactUserId: string | null;
  verified: boolean;
  verificationSource: string | null;
  created_at: string;
}

// OrgSegment: org classification segment (org-scoped, new in Phase 33)
export interface OrgSegment {
  id: string;
  orgId: string;
  segmentId: string;
  isPrimary: boolean;
  verified: boolean;
  verificationSource: string | null;
  created_at: string;
}

/**
 * Display row for provider directory (list view).
 * Exposes id/orgId for downstream callers.
 */
export interface ProviderDirectoryView {
  id: string;
  orgId: string;
  legalName: string;
  tagline: string | null;
  logoUrl: string | null;
  segmentCount: number;
  skillCount: number;
  verified: boolean;
}

/**
 * Expertise item with resolved display name and verification status.
 */
export interface ExpertiseItem {
  id: string;
  name: string;
  verified: boolean;
  verificationSource: string | null;
}

/**
 * Display row for provider detail (detail view).
 * Exposes id/orgId + full expertise sections with resolved names.
 */
export interface ProviderDetailView {
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
  employeeCount: string | null;
  businessClassification: string | null;
  verified: boolean;
  skillCount: number;
  segments: ExpertiseItem[];
  serviceSegments: ExpertiseItem[];
  skills: ExpertiseItem[];
  roles: ExpertiseItem[];
  products: ExpertiseItem[];
  frameworks: ExpertiseItem[];
}
