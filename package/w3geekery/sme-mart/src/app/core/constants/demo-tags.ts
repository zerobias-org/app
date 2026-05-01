/**
 * Demo-seeded record tag UUIDs.
 *
 * Phase 24: Demo Data Visibility Gate
 * These two UUIDs are used to identify demo records during the transition period:
 * - GLOBAL_DEMO: new demo records (preferred, marketplace tagType)
 * - LEGACY_W3GEEKERY: existing demo records (legacy, 'other' tagType, retained to avoid UUID churn)
 */

export const DEMO_TAG_UUIDS = {
  GLOBAL_DEMO: '81053c14-a8e5-4939-b538-c122c7d0eb1a',
  LEGACY_W3GEEKERY: 'd618b602-21cc-40a1-a9fa-534b7bc1672c',
} as const;

/**
 * Flattened list of demo-tag UUID values for use in array filters and predicates.
 * Example: checking if a record.tag contains ANY of these UUIDs.
 */
export const DEMO_TAG_UUID_LIST: readonly string[] = Object.values(DEMO_TAG_UUIDS);
