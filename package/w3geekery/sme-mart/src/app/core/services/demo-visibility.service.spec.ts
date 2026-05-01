import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { fakeProjectContextService } from '../../test-helpers/angular';

describe('DemoVisibilityService', () => {
  let service: DemoVisibilityService;
  let mockProjectContext: ReturnType<typeof fakeProjectContextService>;

  beforeEach(() => {
    mockProjectContext = fakeProjectContextService(false); // Non-admin by default

    TestBed.configureTestingModule({
      providers: [
        DemoVisibilityService,
        { provide: ProjectContextService, useValue: mockProjectContext },
      ],
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
  // Group 2: applyVisibility<T>(records) post-filter tests (admin signal)
  // ===========================================================================

  describe('applyVisibility()', () => {
    // Test fixture setup
    const mockRecords = [
      { id: '1', name: 'Real Engagement', tag: null },
      { id: '2', name: 'Real Engagement w/ marketplace tag', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }] },
      { id: '3', name: 'Demo Engagement (Global)', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] },
      { id: '4', name: 'Demo Engagement (Legacy)', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }] },
      { id: '5', name: 'Empty tag array', tag: [] },
    ];

    // Case 1: Admin sees all records
    it('should return all records unchanged for admin', () => {
      mockProjectContext.setIsAdmin(true);
      const result = service.applyVisibility(mockRecords);

      expect(result.length).toBe(5);
      expect(result).toEqual(mockRecords);
    });

    // Case 2: Non-admin sees only non-demo records
    it('should filter out demo-tagged records for non-admin', () => {
      mockProjectContext.setIsAdmin(false);
      const result = service.applyVisibility(mockRecords);

      expect(result.length).toBe(3);
      const ids = result.map(r => r.id);
      expect(ids).toEqual(['1', '2', '5']);
    });

    // Case 3: Signal flip mid-test
    it('should respect admin signal flip (no caching)', () => {
      // Start as non-admin
      mockProjectContext.setIsAdmin(false);
      let result = service.applyVisibility(mockRecords);
      expect(result.length).toBe(3);

      // Switch to admin
      mockProjectContext.setIsAdmin(true);
      result = service.applyVisibility(mockRecords);
      expect(result.length).toBe(5);

      // Switch back to non-admin
      mockProjectContext.setIsAdmin(false);
      result = service.applyVisibility(mockRecords);
      expect(result.length).toBe(3);
    });

    // Case 4: Generic type preservation
    it('should preserve generic type parameter', () => {
      mockProjectContext.setIsAdmin(false);
      interface TypedRecord {
        id: string;
        name: string;
        tag?: { value: string }[] | null;
      }
      const typedRecords: TypedRecord[] = mockRecords;
      const result = service.applyVisibility<TypedRecord>(typedRecords);

      // Type check: result should be TypedRecord[], not widened
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result.length).toBe(3);
    });

    // Case 5: Input array immutability
    it('should not mutate the input array', () => {
      mockProjectContext.setIsAdmin(false);
      const inputCopy = [...mockRecords];
      service.applyVisibility(mockRecords);

      expect(mockRecords).toEqual(inputCopy);
      expect(mockRecords.length).toBe(5);
    });
  });
});
