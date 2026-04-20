/**
 * Tag prefix utilities for the sme-mart.* dot-delimited convention.
 *
 * Convention: sme-mart.{dimension}.{word-word}[.{scope}...]
 *
 * Examples:
 *   sme-mart.eng.amber-circuit          — engagement tag
 *   sme-mart.proj.falcon-ridge          — project tag
 *   sme-mart.task.coral-delta           — task grouping tag
 *   sme-mart.eng.amber-circuit.risk     — scoped tag within an engagement
 */

/** Root prefix for all SME Mart tags */
export const SME_MART_PREFIX = 'sme-mart.';

/** Hierarchy dimension prefixes (segment after sme-mart.) */
export type TagDimension = 'eng' | 'proj' | 'task';

/** Parsed tag scope from a fully-qualified tag name */
export interface TagScope {
  /** Dimension segment (eng, proj, task) */
  dimension?: TagDimension;
  /** The word-word identifier (e.g., amber-circuit) */
  identifier?: string;
  /** Additional scope segments beyond dimension.identifier */
  segments?: string[];
}

/** Check if a tag name uses the sme-mart.* convention */
export function isSmeMartTag(name: string): boolean {
  return name.toLowerCase().startsWith(SME_MART_PREFIX.toLowerCase());
}

/** Check if a tag is a protected hierarchy tag (engagement or project) */
export function isProtectedTag(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.startsWith('sme-mart.eng.') ||
    lower.startsWith('sme-mart.proj.') ||
    // Backward compat: old convention
    name.startsWith('ENG-') ||
    name.startsWith('PROJ-')
  );
}

/** Check if a tag uses the old ENG-/PROJ-/TASK- convention */
export function isOldConventionTag(name: string): boolean {
  return name.startsWith('ENG-') || name.startsWith('PROJ-') || name.startsWith('TASK-');
}

/**
 * Parse a fully-qualified tag name into a TagScope.
 *
 * Examples:
 *   "sme-mart.eng.amber-circuit"       → { dimension: 'eng', identifier: 'amber-circuit' }
 *   "sme-mart.proj.falcon-ridge"       → { dimension: 'proj', identifier: 'falcon-ridge' }
 *   "sme-mart.eng.amber-circuit.risk"  → { dimension: 'eng', identifier: 'amber-circuit', segments: ['risk'] }
 *   "sme-mart.compliance"              → { segments: ['compliance'] }
 */
export function parseScope(fullName: string): TagScope {
  if (!isSmeMartTag(fullName)) return {};

  const rest = fullName.slice(SME_MART_PREFIX.length);
  const parts = rest.split('.');

  if (parts.length === 0) return {};

  const dim = parts[0] as TagDimension;
  if (dim === 'eng' || dim === 'proj' || dim === 'task') {
    return {
      dimension: dim,
      identifier: parts[1] || undefined,
      segments: parts.length > 2 ? parts.slice(2) : undefined,
    };
  }

  // No dimension — global SME Mart tag
  return { segments: parts };
}

/**
 * Build a full tag name from scope parts.
 *
 * buildPrefix({ dimension: 'eng', identifier: 'amber-circuit' })
 *   → "sme-mart.eng.amber-circuit"
 *
 * buildPrefix({ dimension: 'eng', identifier: 'amber-circuit', segments: ['risk'] })
 *   → "sme-mart.eng.amber-circuit.risk"
 */
export function buildPrefix(scope: TagScope): string {
  const parts = [SME_MART_PREFIX.slice(0, -1)]; // "sme-mart" without trailing dot
  if (scope.dimension) {
    parts.push(scope.dimension);
    if (scope.identifier) parts.push(scope.identifier);
  }
  if (scope.segments) parts.push(...scope.segments);
  return parts.join('.');
}

/**
 * Strip the sme-mart.* prefix from a tag name for display.
 * Falls back to stripping old ENG-/PROJ-/TASK- prefix if present.
 *
 * "sme-mart.eng.amber-circuit"  → "amber-circuit"
 * "sme-mart.proj.falcon-ridge"  → "falcon-ridge"
 * "ENG-amber-circuit"           → "amber-circuit"
 * "my-tag"                      → "my-tag"
 */
export function stripPrefix(fullName: string): string {
  if (isSmeMartTag(fullName)) {
    const scope = parseScope(fullName);
    // Return rightmost meaningful part
    if (scope.segments?.length) return scope.segments.join('.');
    if (scope.identifier) return scope.identifier;
    return fullName;
  }

  // Old convention
  if (fullName.startsWith('ENG-')) return fullName.slice(4);
  if (fullName.startsWith('PROJ-')) return fullName.slice(5);
  if (fullName.startsWith('TASK-')) return fullName.slice(5);

  return fullName;
}

/**
 * Map old convention tag names to new convention.
 *
 * "ENG-amber-circuit"  → "sme-mart.eng.amber-circuit"
 * "PROJ-falcon-ridge"  → "sme-mart.proj.falcon-ridge"
 * "TASK-coral-delta"   → "sme-mart.task.coral-delta"
 */
export function migrateOldTag(oldName: string): string | null {
  if (oldName.startsWith('ENG-')) return `sme-mart.eng.${oldName.slice(4)}`;
  if (oldName.startsWith('PROJ-')) return `sme-mart.proj.${oldName.slice(5)}`;
  if (oldName.startsWith('TASK-')) return `sme-mart.task.${oldName.slice(5)}`;
  return null;
}

/** Map old convention hierarchy level to dimension */
const OLD_PREFIX_TO_DIMENSION: Record<string, TagDimension> = {
  'ENG-': 'eng',
  'PROJ-': 'proj',
  'TASK-': 'task',
};

/**
 * Determine hierarchy level from a tag name (supports both old and new conventions).
 * Returns null for non-hierarchy tags.
 */
export function parseHierarchyLevel(name: string): 'project' | 'boundary' | 'task' | null {
  const lower = name.toLowerCase();
  if (lower.startsWith('sme-mart.eng.') || name.startsWith('ENG-')) return 'boundary';
  if (lower.startsWith('sme-mart.proj.') || name.startsWith('PROJ-')) return 'project';
  if (lower.startsWith('sme-mart.task.') || name.startsWith('TASK-')) return 'task';
  return null;
}
