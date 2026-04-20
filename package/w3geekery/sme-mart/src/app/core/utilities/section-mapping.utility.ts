/**
 * Section-to-VettingType Mapping — Exact Matches Only
 *
 * Per D-01: Suggest profile items where SectionType === VettingType.
 * Four pairs: corporate_identity, insurance, reference, financial.
 * Non-overlapping types (attestation, personnel) map to null (no suggestions).
 *
 * Usage:
 * - Filter vetting items: if (canSuggestForVettingType(item.vetting_type))
 * - Get suggestable section: getSuggestableSection(item.vetting_type)
 */

import { SectionType } from '../models/marketplace-profile-item.model';
import { VettingType } from '../models/vetting-item.model';

/** Exact-match mapping from VettingType to SectionType (D-01) */
const SECTION_TO_VETTING_TYPE_MAP: Record<VettingType, SectionType | null> = {
  corporate_identity: 'corporate_identity',
  insurance: 'insurance',
  reference: 'reference',
  financial: 'financial',
  compliance: null,       // No profile section match
  legal: null,            // No profile section match
  certification: null,    // No profile section match
  documentation: null,    // No profile section match
};

/**
 * Check if a vetting type has a suggestible profile section (D-01)
 *
 * @param vettingType VettingType enum value
 * @returns true if section exists for this type, false otherwise
 *
 * Example:
 * canSuggestForVettingType('insurance') → true
 * canSuggestForVettingType('legal') → false
 */
export function canSuggestForVettingType(vettingType: VettingType): boolean {
  return getSuggestableSection(vettingType) !== null;
}

/**
 * Get the profile section that matches a vetting type (D-01)
 *
 * @param vettingType VettingType enum value
 * @returns SectionType if match exists, null otherwise
 *
 * Example:
 * getSuggestableSection('corporate_identity') → 'corporate_identity'
 * getSuggestableSection('compliance') → null
 */
export function getSuggestableSection(vettingType: VettingType): SectionType | null {
  return SECTION_TO_VETTING_TYPE_MAP[vettingType] ?? null;
}

/**
 * Get all vetting types that have suggestible sections (D-01)
 *
 * @returns Array of VettingType values that can be suggested
 *
 * Example:
 * getSuggestableVettingTypes() → ['corporate_identity', 'insurance', 'reference', 'financial']
 */
export function getSuggestableVettingTypes(): VettingType[] {
  return Object.entries(SECTION_TO_VETTING_TYPE_MAP)
    .filter(([, section]) => section !== null)
    .map(([vettingType]) => vettingType as VettingType);
}

export { SECTION_TO_VETTING_TYPE_MAP };
