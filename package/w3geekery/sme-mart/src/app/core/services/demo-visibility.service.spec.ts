import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { DemoVisibilityService } from './demo-visibility.service';

describe('DemoVisibilityService', () => {
  let service: DemoVisibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DemoVisibilityService],
    });

    service = TestBed.inject(DemoVisibilityService);
  });

  // ===========================================================================
  // Group 1: isLocalDemoTagged() predicate tests (no admin signal)
  // ===========================================================================

  describe('isLocalDemoTagged()', () => {
    // Case 1: Global demo UUID match
    it('should return true for record with global demo UUID tag', () => {
      const record = {
        tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }],
      };
      expect(service.isLocalDemoTagged(record)).toBe(true);
    });

    // Case 2: Legacy demo UUID match
    it('should return true for record with legacy w3geekery demo UUID tag', () => {
      const record = {
        tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }],
      };
      expect(service.isLocalDemoTagged(record)).toBe(true);
    });

    // Case 3: Non-demo UUID
    it('should return false for record with non-demo UUID tag', () => {
      const record = {
        tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }],
      };
      expect(service.isLocalDemoTagged(record)).toBe(false);
    });

    // Case 4: Mixed tags (any-match semantics)
    it('should return true when any tag in array is a demo UUID', () => {
      const record = {
        tag: [
          { value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }, // Non-demo
          { value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }, // Global demo
        ],
      };
      expect(service.isLocalDemoTagged(record)).toBe(true);
    });

    // Case 5: null tag
    it('should return false for record with null tag', () => {
      const record = { tag: null };
      expect(service.isLocalDemoTagged(record)).toBe(false);
    });

    // Case 6: undefined tag
    it('should return false for record with undefined tag', () => {
      const record = { tag: undefined };
      expect(service.isLocalDemoTagged(record)).toBe(false);
    });

    // Case 7: empty tag array
    it('should return false for record with empty tag array', () => {
      const record = { tag: [] };
      expect(service.isLocalDemoTagged(record)).toBe(false);
    });
  });

  // ===========================================================================
  // Group 2: applyVisibility<T>(records)
  //
  // BYPASSED 2026-08-06 (Clark): demo data is no longer a concept. applyVisibility
  // now returns every record unchanged, so the admin/non-admin filtering cases are
  // gone — there is no admin signal left to flip. The call sites and the
  // isLocalDemoTagged predicate above survive for the later demo-removal pass.
  // ===========================================================================

  describe('applyVisibility()', () => {
    const mockRecords = [
      { id: '1', name: 'Untagged', tag: null },
      { id: '2', name: 'Marketplace tag', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }] },
      { id: '3', name: 'Demo tag (Global)', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] },
      { id: '4', name: 'Demo tag (Legacy)', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }] },
      { id: '5', name: 'Empty tag array', tag: [] },
    ];

    it('returns every record, including demo-tagged ones', () => {
      const result = service.applyVisibility(mockRecords);

      expect(result.length).toBe(5);
      expect(result.map(r => r.id)).toEqual(['1', '2', '3', '4', '5']);
    });

    it('preserves the generic type parameter', () => {
      interface TypedRecord {
        id: string;
        name: string;
        tag?: { value: string }[] | null;
      }
      const typedRecords: TypedRecord[] = mockRecords;
      const result = service.applyVisibility<TypedRecord>(typedRecords);

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result.length).toBe(5);
    });

    it('does not mutate the input array', () => {
      const inputCopy = [...mockRecords];
      service.applyVisibility(mockRecords);

      expect(mockRecords).toEqual(inputCopy);
      expect(mockRecords.length).toBe(5);
    });
  });
});
