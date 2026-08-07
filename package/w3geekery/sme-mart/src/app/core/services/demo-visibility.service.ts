import { Injectable } from '@angular/core';
import { DEMO_TAG_UUID_LIST } from '../constants/demo-tags';
import type { Tag } from '@zerobias-com/platform-sdk';

/**
 * Shape of a tag array element from GQL Object.tag field.
 * Pattern: `tag: [{ value: "<uuid>" }]`
 */
interface TagShape {
  value: string;
}

/**
 * Union type for polymorphic tag shapes (GQL vs platform.Project).
 * - GQL: tag is array of { value: string }
 * - Platform: tag is single Tag object with id, name, etc.
 */
type TagField = TagShape[] | null | Tag;

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

  /**
   * Pure predicate: returns true iff a record's tag contains a demo UUID.
   *
   * **Polymorphic shapes (D-24):**
   * - GQL shape: `tag: [{ value: "<uuid>" }]` — array of { value: string }
   * - Platform shape: `tag: Tag` — single object with id (UUID), name, etc.
   *
   * **Semantics:**
   * - GQL array with demo UUID: `[{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }]` → true
   * - Platform Tag with demo id: `{ id: '81053c14-a8e5-4939-b538-c122c7d0eb1a', name: '...' }` → true
   * - Non-demo tag → false
   * - `tag: null` → false (no tag is not demo-tagged)
   * - `tag: undefined` → false (absent tag is not demo-tagged)
   *
   * **No side effects:**
   * - This function is pure: no `inject()`, no signal reads, no mutations.
   * - Safe to call from non-DI contexts (e.g., array filter predicates).
   * - Unit-testable without TestBed.
   *
   * @param record - Object with optional `tag` field (GQL array or platform Tag object)
   * @returns true iff tag matches a demo UUID (by value for GQL, by id for Platform)
   */
  isLocalDemoTagged(record: { tag?: TagField }): boolean {
    const tags = record.tag;

    // No tag → not demo-tagged
    if (!tags) {
      return false;
    }

    // D-24: Platform.Tag shape — single object with id, name, etc.
    if (!Array.isArray(tags)) {
      // Check if the Tag object's id matches a demo UUID
      return DEMO_TAG_UUID_LIST.includes(String((tags as unknown as { id: string }).id));
    }

    // GQL shape — array of { value: string }
    // Empty array → not demo-tagged
    if (tags.length === 0) {
      return false;
    }

    // Check if any tag value matches a demo UUID (any-match semantics)
    return tags.some(tag => DEMO_TAG_UUID_LIST.includes(tag.value));
  }

  /**
   * Post-filter for arrays of records. BYPASSED — returns every record unchanged.
   *
   * It previously stripped demo-tagged records for non-admin users and read the
   * admin signal on each call. Both are gone; see the body for why. Call sites are
   * left in place so the later demo-removal pass has one list to work from.
   *
   * **Type preservation:**
   * - Generic `<T>` preserves the domain type (Engagement[], Bid[], Note[], etc.).
   * - Caller does not need to cast or transform the result.
   *
   * @param records - Array of records
   * @returns The same array reference, unfiltered
   */
  applyVisibility<T>(records: T[]): T[] {
    // BYPASSED 2026-08-06 (Clark): demo data is no longer a concept, so nothing
    // should be hidden from anyone. Every record passes through unfiltered.
    //
    // A deliberate bypass at the chokepoint, not a deletion - removing the demo
    // machinery outright touches 19 files, one of them under active rewrite
    // elsewhere. That sweep is its own pass.
    //
    // The bypass is REQUIRED, not cosmetic: the onboarding guard was the only
    // writer of ProjectContextService.setIsAdmin, so with the guard deleted
    // isAdmin is pinned false. The old non-admin branch would then have stripped
    // demo-tagged records from EVERY user.
    return records;
  }
}
