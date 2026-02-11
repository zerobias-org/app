/**
 * Engagement Lifecycle Helpers
 *
 * Lifecycle is determined by the presence of `engagementTag`:
 * - No tag → RFP phase (soliciting proposals)
 * - Has tag → Engagement phase (proposal accepted, work in progress)
 *
 * The ZeroBias Tag is created when a buyer accepts a proposal,
 * graduating the RFP to an Engagement.
 */

/** RFP phase: no engagement tag yet (draft, open, or cancelled before acceptance) */
export function isRfpPhase(engagementTag: string | null | undefined): boolean {
  return !engagementTag;
}

/** Engagement phase: has engagement tag (in_progress, completed, or cancelled after acceptance) */
export function isEngagementPhase(engagementTag: string | null | undefined): boolean {
  return !!engagementTag;
}

/** Get the lifecycle label for display */
export function getLifecycleLabel(engagementTag: string | null | undefined): string {
  return isRfpPhase(engagementTag) ? 'RFP' : 'Engagement';
}
