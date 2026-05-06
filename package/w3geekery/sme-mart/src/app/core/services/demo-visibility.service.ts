import { Injectable, inject } from '@angular/core';
import { DEMO_TAG_UUID_LIST } from '../constants/demo-tags';
import { ProjectContextService } from './project-context.service';

/**
 * Shape of a tag array element from GQL Object.tag field.
 * Pattern: `tag: [{ value: "<uuid>" }]`
 */
interface TagShape {
  value: string;
}

/**
 * Helper service for client-side demo-data visibility gating.
 *
 * **Strategy (Option X — per Phase 24 Context "Object.tag Field Pattern" REVISED 2026-05-01):**
 * Server-side GQL negation (`.ne.` / `.not in.`) on tag arrays is non-viable per Decision-Probe-1
 * (silently broken on ZB GQL backend). This service implements client-side post-filtering:
 *
 * 1. Queries fetch records unfiltered from the GQL API
 * 2. Service applies a pure predicate `isLocalDemoTagged(record)` to identify demo records
 * 3. Service applies post-filter `applyVisibility(records)` which:
 *    - Returns records unchanged if `ProjectContextService.isAdmin()` is true
 *    - Otherwise filters out records whose tag array contains a demo UUID
 *
 * **Why client-side is acceptable for v1.4:**
 * - Post-filter runs after pageSize results are fetched
 * - If 3/25 results are demo, user sees 22 instead of backfill to 25
 * - v1.4 dataset is < 100 records total per class — pagination under-fill is cosmetic
 * - DO NOT implement compensating over-fetch logic; escalate pagination accuracy to v1.5
 *
 * **Immutability:** Input arrays are never mutated; filter returns a new array.
 *
 * See Decision-Probe-1 RESULT (CONTEXT.md) for empirical evidence of backend negation failure.
 */
@Injectable({ providedIn: 'root' })
export class DemoVisibilityService {
  private readonly projectContext = inject(ProjectContextService);

  /**
   * Pure predicate: returns true iff a record's tag array contains a demo UUID.
   *
   * **Semantics:**
   * - `tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }]` → true (GLOBAL_DEMO match)
   * - `tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }]` → true (LEGACY_W3GEEKERY match)
   * - `tag: [{ value: 'other-uuid' }]` → false (not a demo UUID)
   * - `tag: [{ value: 'global-demo' }, { value: 'other-uuid' }]` → true (any-match: one element matches)
   * - `tag: null` → false (no tag is not demo-tagged)
   * - `tag: undefined` → false (absent tag is not demo-tagged)
   * - `tag: []` → false (empty array is not demo-tagged)
   *
   * **No side effects:**
   * - This function is pure: no `inject()`, no signal reads, no mutations.
   * - Safe to call from non-DI contexts (e.g., array filter predicates).
   * - Unit-testable without TestBed.
   *
   * @param record - Object with optional `tag` field of shape `[{ value: string }][]`
   * @returns true iff any element's value matches a demo UUID
   */
  isLocalDemoTagged(record: { tag?: TagShape[] | null }): boolean {
    const tags = record.tag;

    // No tag → not demo-tagged
    if (!tags) {
      return false;
    }

    // Empty array → not demo-tagged
    if (tags.length === 0) {
      return false;
    }

    // Check if any tag value matches a demo UUID (any-match semantics)
    return tags.some(tag => DEMO_TAG_UUID_LIST.includes(tag.value));
  }

  /**
   * Post-filter for arrays of records: strips demo-tagged records for non-admin users.
   *
   * **Behavior:**
   * - Admin (`isAdmin() === true`): returns input array unchanged (full visibility)
   * - Non-admin (`isAdmin() === false`): returns new array with demo-tagged records removed
   *
   * **Signal reads:**
   * - Calls `projectContext.isAdmin()` exactly once per invocation (no caching).
   * - Each call respects the current admin signal value — signal changes are reflected on next call.
   * - Suitable for re-reading the signal on every listing fetch (e.g., in a service method).
   *
   * **Immutability:**
   * - Never mutates the input array.
   * - Returns a new array via `Array.prototype.filter()` or the original reference (admin case).
   *
   * **Type preservation:**
   * - Generic `<T>` preserves the domain type (Engagement[], Bid[], Note[], etc.).
   * - Caller does not need to cast or transform the result.
   *
   * @param records - Array of records with optional `tag` field
   * @returns Filtered array (new reference if non-admin; original reference if admin)
   */
  applyVisibility<T extends { tag?: TagShape[] | null }>(records: T[]): T[] {
    // Admin bypass: return unfiltered
    if (this.projectContext.isAdmin()) {
      return records;
    }

    // Non-admin: filter out demo-tagged records
    return records.filter(record => !this.isLocalDemoTagged(record));
  }
}
