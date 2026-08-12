/**
 * Unit Tests for PipelineWriteService
 *
 * Tests cache behavior (TTL, merge, seed), name derivation,
 * pushEntities batching, and deleteEntities.
 */

import { TestBed } from '@angular/core/testing';
import { PipelineWriteService, SME_MART_CLASS_IDS, type SmeMartClassName } from './pipeline-write.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('PipelineWriteService', () => {
  let service: PipelineWriteService;
  let mockPipelineApi: { receive: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockPipelineApi = {
      receive: vi.fn().mockResolvedValue(undefined),
    };

    const mockClientApi = {
      platformClient: {
        getPipelineApi: () => mockPipelineApi,
      },
    };

    TestBed.configureTestingModule({
      providers: [
        PipelineWriteService,
        { provide: ZerobiasClientApi, useValue: mockClientApi },
      ],
    });

    service = TestBed.inject(PipelineWriteService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── pushEntities ──

  describe('pushEntities()', () => {
    it('should call pipeline receive with batch', async () => {
      await service.pushEntities('Bid', [{ id: 'e1', name: 'Test' }]);

      expect(mockPipelineApi.receive).toHaveBeenCalledTimes(1);
    });

    it('should auto-derive name from title if name is missing', async () => {
      await service.pushEntities('Bid', [{ id: 'b1', title: 'My Bid' }]);

      const call = mockPipelineApi.receive.mock.calls[0];
      const batch = call[1];
      // The batch should contain the object with derived name
      expect(batch.data?.[0]?.name ?? batch.items?.[0]?.name).toBeDefined();
    });

    it('should preserve existing name if provided', async () => {
      await service.pushEntities('Review', [{ id: 'n1', name: 'Existing Name' }]);

      // Verify the object wasn't modified
      const cached = service.getCached('Review', 'n1');
      expect(cached?.['name']).toBe('Existing Name');
    });

    it('should populate cache after push', async () => {
      await service.pushEntities('Bid', [{ id: 'e1', name: 'Test', status: 'open' }]);

      const cached = service.getCached('Bid', 'e1');
      expect(cached).not.toBeNull();
      expect(cached?.['name']).toBe('Test');
      expect(cached?.['status']).toBe('open');
    });

    it('should merge into existing cache entries on subsequent push', async () => {
      // First push: full object
      await service.pushEntities('Review', [{ id: 'n1', name: 'My Note', content: 'Hello', folderId: 'f1' }]);

      // Second push: update with name included (pipeline receive is full-replace,
      // so callers always include name). The merge preserves fields from first push.
      await service.pushEntities('Review', [{ id: 'n1', name: 'My Note', folderId: 'f2' }]);

      const cached = service.getCached('Review', 'n1');
      expect(cached?.['name']).toBe('My Note');       // preserved
      expect(cached?.['content']).toBe('Hello');       // preserved from first push (merge)
      expect(cached?.['folderId']).toBe('f2');         // updated by second push
    });

    it('should handle multiple objects in single batch', async () => {
      await service.pushEntities('Review', [
        { id: 'r1', name: 'Review 1' },
        { id: 'r2', name: 'Review 2' },
      ]);

      expect(service.getCached('Review', 'r1')).not.toBeNull();
      expect(service.getCached('Review', 'r2')).not.toBeNull();
    });

    // ── Tag Embedding (2026-05-04 defect-fix) ──
    // SimpleBatch constructor's 3rd argument (tagIds) is batch/job metadata that does NOT
    // populate Object.tag on GQL read-back. Tags MUST be embedded in the data payload.

    it('should embed tagIds into data payload as tag: [{value}] entries', async () => {
      const tagUuid = '81053c14-a8e5-4939-b538-c122c7d0eb1a';
      await service.pushEntities('Bid', [
        { id: 'e1', name: 'Test' },
      ], [tagUuid]);

      expect(mockPipelineApi.receive).toHaveBeenCalledTimes(1);
      const batch = mockPipelineApi.receive.mock.calls[0][1];
      expect(batch.data[0].tag).toEqual([{ value: tagUuid }]);
    });

    it('should NOT add tag field if tagIds is empty', async () => {
      await service.pushEntities('Bid', [
        { id: 'e1', name: 'Test' },
      ], []);

      const batch = mockPipelineApi.receive.mock.calls[0][1];
      expect(batch.data[0].tag).toBeUndefined();
    });

    it('should merge new tagIds with existing tag entries in data payload', async () => {
      const existingTag = '81053c14-a8e5-4939-b538-c122c7d0eb1a';
      const newTag = 'd618b602-21cc-40a1-a9fa-534b7bc1672c';
      await service.pushEntities('Bid', [
        { id: 'e1', name: 'Test', tag: [{ value: existingTag }] },
      ], [newTag]);

      const batch = mockPipelineApi.receive.mock.calls[0][1];
      expect(batch.data[0].tag).toEqual([
        { value: existingTag },
        { value: newTag },
      ]);
    });

    it('should deduplicate tags when merging', async () => {
      const tag1 = '81053c14-a8e5-4939-b538-c122c7d0eb1a';
      const tag2 = 'd618b602-21cc-40a1-a9fa-534b7bc1672c';
      await service.pushEntities('Bid', [
        { id: 'e1', name: 'Test', tag: [{ value: tag1 }, { value: tag2 }] },
      ], [tag1, tag2]); // both already present

      const batch = mockPipelineApi.receive.mock.calls[0][1];
      expect(batch.data[0].tag).toEqual([
        { value: tag1 },
        { value: tag2 },
      ]); // no duplicates
    });

    it('should construct SimpleBatch with 2 args (classId, ensured) — no 3rd tagIds arg', async () => {
      const tagUuid = '81053c14-a8e5-4939-b538-c122c7d0eb1a';
      await service.pushEntities('Bid', [
        { id: 'e1', name: 'Test' },
      ], [tagUuid]);

      expect(mockPipelineApi.receive).toHaveBeenCalledTimes(1);
      const [, batch] = mockPipelineApi.receive.mock.calls[0];
      // SimpleBatch should have data + classId, but tagIds array should be empty
      // (since we embed into data instead)
      expect(batch.tagIds).toEqual([]); // no 3rd-arg tagIds pass
    });
  });

  // ── pushEntity ──

  describe('pushEntity()', () => {
    it('should delegate to pushEntities with single-element array', async () => {
      await service.pushEntity('Bid', { id: 'e1', name: 'Test' });

      expect(mockPipelineApi.receive).toHaveBeenCalledTimes(1);
      expect(service.getCached('Bid', 'e1')).not.toBeNull();
    });
  });

  // ── deleteEntities ──

  describe('deleteEntities()', () => {
    it('should call pipeline receive with markDeleted IDs', async () => {
      await service.deleteEntities('Review', ['n1', 'n2']);

      expect(mockPipelineApi.receive).toHaveBeenCalledTimes(1);
    });
  });

  // ── getCached ──

  describe('getCached()', () => {
    it('should return null for uncached items', () => {
      const result = service.getCached('Bid', 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return a copy (not the original reference)', async () => {
      await service.pushEntity('Review', { id: 'n1', name: 'Test' });

      const copy1 = service.getCached('Review', 'n1');
      const copy2 = service.getCached('Review', 'n1');

      expect(copy1).toEqual(copy2);
      expect(copy1).not.toBe(copy2); // different object references
    });

    it('should evict entries after TTL expires', async () => {
      await service.pushEntity('Bid', { id: 'e1', name: 'Test' });

      // Fast-forward time past TTL (60s)
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);

      const cached = service.getCached('Bid', 'e1');
      expect(cached).toBeNull();
    });

    it('should return fresh entries within TTL', async () => {
      await service.pushEntity('Bid', { id: 'e1', name: 'Test' });

      // 30s later — still within TTL
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 30_000);

      const cached = service.getCached('Bid', 'e1');
      expect(cached).not.toBeNull();
      expect(cached?.['name']).toBe('Test');
    });
  });

  // ── seedCache ──

  describe('seedCache()', () => {
    it('should populate cache from GQL fetch data', () => {
      service.seedCache('Bid', 'b1', { id: 'b1', name: 'Seeded', status: 'pending' });

      const cached = service.getCached('Bid', 'b1');
      expect(cached).not.toBeNull();
      expect(cached?.['name']).toBe('Seeded');
      expect(cached?.['status']).toBe('pending');
    });

    it('should store a copy (not the original reference)', () => {
      const original = { id: 'b1', name: 'Test' };
      service.seedCache('Bid', 'b1', original);

      original['name'] = 'Mutated';

      const cached = service.getCached('Bid', 'b1');
      expect(cached?.['name']).toBe('Test'); // original mutation doesn't affect cache
    });
  });

  // ── Phase 20 Wave 3: Round-trip per class id ──
  //
  // Exercises pushEntities(className, [...]) for EVERY entry in the registry and
  // asserts the resulting SimpleBatch carries that entry's UUID.
  //
  // The per-class canonical-UUID tests that used to sit above this were removed with
  // their classes: they pinned MarketplaceProfileItem and EngagementVettingItem, both
  // retired in smemart 2.0.7, so they asserted ids the registry no longer holds.
  //
  describe('Class-id round-trip for every SME_MART_CLASS_IDS entry (Phase 20 Wave 3)', () => {
    // DERIVED from the registry, not transcribed from it. The previous hand-written
    // CASES list asserted the pre-2.0.7 ids and went stale silently — 15 of its 23
    // rows named retired classes with dead UUIDs, and it only compiled because the
    // call site casts through `any`. Deriving removes that whole drift class: a
    // registry edit updates the suite automatically.
    const CASES = Object.entries(SME_MART_CLASS_IDS) as Array<[SmeMartClassName, string]>;

    it.each(CASES)(
      'pushEntities(%s) routes batch to canonical classId %s',
      async (className, expectedClassId) => {
        await service.pushEntities(className, [
          { id: `rt-${className}-001`, name: `rt-${className}-001` },
        ]);

        expect(mockPipelineApi.receive).toHaveBeenCalledTimes(1);
        const batch = mockPipelineApi.receive.mock.calls[0][1];
        expect(batch.classId.toString()).toBe(expectedClassId);
      },
    );

    it('registry has no duplicate UUIDs or class names', () => {
      const uuids = CASES.map(([, id]) => id);
      const names = CASES.map(([n]) => n);
      expect(new Set(uuids).size).toBe(CASES.length);
      expect(new Set(names).size).toBe(CASES.length);
    });
  });

  // ── Telemetry Instrumentation (FF-03) ──
  //
  // Per Phase 20 requirements, every pushEntities and deleteEntities rejection
  // must log a structured telemetry event so that silent failures become visible
  // in console logs + CloudWatch queries.

  describe('Telemetry Instrumentation (FF-03)', () => {
    it('pushEntities: rejection fires telemetry event with className, callSite, errorMessage', async () => {
      const error = new Error('Pipeline validation failed');
      mockPipelineApi.receive.mockRejectedValueOnce(error);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await service.pushEntities('Bid', [{ id: 'b1', name: 'Test' }], [], 'bid-submit.component.ts:142');
      } catch (_e) {
        // Expected — error is re-thrown
      }

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const [message] = consoleWarnSpy.mock.calls[0];

      expect(message).toContain('[PIPELINE_WRITE_FAILURE]');
      const eventStr = message.split('[PIPELINE_WRITE_FAILURE] ')[1];
      const event = JSON.parse(eventStr);

      expect(event.className).toBe('Bid');
      expect(event.callSite).toBe('bid-submit.component.ts:142');
      expect(event.errorMessage).toBe('Pipeline validation failed');
      expect(event.timestamp).toBeDefined();

      consoleWarnSpy.mockRestore();
    });

    it('pushEntities: rejection re-throws error after logging', async () => {
      const error = new Error('Pipeline error');
      mockPipelineApi.receive.mockRejectedValueOnce(error);
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const promise = service.pushEntities('Bid', [{ id: 'e1', name: 'Test' }]);
      await expect(promise).rejects.toThrow('Pipeline error');
    });

    it('pushEntities: explicit callSiteTag is reflected in telemetry event', async () => {
      mockPipelineApi.receive.mockRejectedValueOnce(new Error('Test error'));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await service.pushEntities('Review', [{ id: 'n1', name: 'Test' }], [], 'reviews.service:52');
      } catch (_e) {
        // Expected
      }

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const [message] = consoleWarnSpy.mock.calls[0];
      const eventStr = message.split('[PIPELINE_WRITE_FAILURE] ')[1];
      const event = JSON.parse(eventStr);

      // Explicit tag matches production caller pattern (Wave 2 services pass file:line)
      expect(event.callSite).toBe('reviews.service:52');

      consoleWarnSpy.mockRestore();
    });

    it('pushEntity: delegates to pushEntities with callSiteTag', async () => {
      mockPipelineApi.receive.mockRejectedValueOnce(new Error('Test error'));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await service.pushEntity('Review', { id: 'r1', name: 'Test' }, [], 'review-submit.component.ts:85');
      } catch (_e) {
        // Expected
      }

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const [message] = consoleWarnSpy.mock.calls[0];
      const eventStr = message.split('[PIPELINE_WRITE_FAILURE] ')[1];
      const event = JSON.parse(eventStr);

      expect(event.callSite).toBe('review-submit.component.ts:85');

      consoleWarnSpy.mockRestore();
    });

    it('deleteEntities: rejection fires telemetry event', async () => {
      mockPipelineApi.receive.mockRejectedValueOnce(new Error('Delete failed'));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await service.deleteEntities('Review', ['n1', 'n2'], 'review-delete.component.ts:99');
      } catch (_e) {
        // Expected
      }

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const [message] = consoleWarnSpy.mock.calls[0];
      const eventStr = message.split('[PIPELINE_WRITE_FAILURE] ')[1];
      const event = JSON.parse(eventStr);

      expect(event.className).toBe('Review');
      expect(event.callSite).toBe('review-delete.component.ts:99');
      expect(event.errorMessage).toBe('Delete failed');

      consoleWarnSpy.mockRestore();
    });

    it('deleteEntity: delegates to deleteEntities with callSiteTag', async () => {
      mockPipelineApi.receive.mockRejectedValueOnce(new Error('Delete failed'));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await service.deleteEntity('Bid', 'e1', 'bid-delete.component.ts:44');
      } catch (_e) {
        // Expected
      }

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const [message] = consoleWarnSpy.mock.calls[0];
      const eventStr = message.split('[PIPELINE_WRITE_FAILURE] ')[1];
      const event = JSON.parse(eventStr);

      expect(event.callSite).toBe('bid-delete.component.ts:44');

      consoleWarnSpy.mockRestore();
    });

    it('telemetry event timestamp is ISO format', async () => {
      mockPipelineApi.receive.mockRejectedValueOnce(new Error('Test'));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await service.pushEntities('Bid', [{ id: 'b1', name: 'Test' }]);
      } catch (_e) {
        // Expected
      }

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const [message] = consoleWarnSpy.mock.calls[0];
      const eventStr = message.split('[PIPELINE_WRITE_FAILURE] ')[1];
      const event = JSON.parse(eventStr);

      // ISO format example: "2026-04-29T12:34:56.789Z"
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('success path does not log telemetry or re-throw', async () => {
      mockPipelineApi.receive.mockResolvedValueOnce(undefined);
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Should complete without throwing or logging
      await service.pushEntities('Bid', [{ id: 'e1', name: 'Test' }]);

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
