/**
 * Unit Tests for PipelineWriteService
 *
 * Tests cache behavior (TTL, merge, seed), name derivation,
 * pushEntities batching, and deleteEntities.
 */

import { TestBed } from '@angular/core/testing';
import { PipelineWriteService } from './pipeline-write.service';
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
      await service.pushEntities('Engagement', [{ id: 'e1', name: 'Test' }]);

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
      await service.pushEntities('Note', [{ id: 'n1', name: 'Existing Name' }]);

      // Verify the object wasn't modified
      const cached = service.getCached('Note', 'n1');
      expect(cached?.['name']).toBe('Existing Name');
    });

    it('should populate cache after push', async () => {
      await service.pushEntities('Engagement', [{ id: 'e1', name: 'Test', status: 'open' }]);

      const cached = service.getCached('Engagement', 'e1');
      expect(cached).not.toBeNull();
      expect(cached?.['name']).toBe('Test');
      expect(cached?.['status']).toBe('open');
    });

    it('should merge into existing cache entries on subsequent push', async () => {
      // First push: full object
      await service.pushEntities('Note', [{ id: 'n1', name: 'My Note', content: 'Hello', folderId: 'f1' }]);

      // Second push: update with name included (pipeline receive is full-replace,
      // so callers always include name). The merge preserves fields from first push.
      await service.pushEntities('Note', [{ id: 'n1', name: 'My Note', folderId: 'f2' }]);

      const cached = service.getCached('Note', 'n1');
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
  });

  // ── pushEntity ──

  describe('pushEntity()', () => {
    it('should delegate to pushEntities with single-element array', async () => {
      await service.pushEntity('Engagement', { id: 'e1', name: 'Test' });

      expect(mockPipelineApi.receive).toHaveBeenCalledTimes(1);
      expect(service.getCached('Engagement', 'e1')).not.toBeNull();
    });
  });

  // ── deleteEntities ──

  describe('deleteEntities()', () => {
    it('should call pipeline receive with markDeleted IDs', async () => {
      await service.deleteEntities('Note', ['n1', 'n2']);

      expect(mockPipelineApi.receive).toHaveBeenCalledTimes(1);
    });
  });

  // ── getCached ──

  describe('getCached()', () => {
    it('should return null for uncached items', () => {
      const result = service.getCached('Engagement', 'nonexistent');
      expect(result).toBeNull();
    });

    it('should return a copy (not the original reference)', async () => {
      await service.pushEntity('Note', { id: 'n1', name: 'Test' });

      const copy1 = service.getCached('Note', 'n1');
      const copy2 = service.getCached('Note', 'n1');

      expect(copy1).toEqual(copy2);
      expect(copy1).not.toBe(copy2); // different object references
    });

    it('should evict entries after TTL expires', async () => {
      await service.pushEntity('Engagement', { id: 'e1', name: 'Test' });

      // Fast-forward time past TTL (60s)
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);

      const cached = service.getCached('Engagement', 'e1');
      expect(cached).toBeNull();
    });

    it('should return fresh entries within TTL', async () => {
      await service.pushEntity('Engagement', { id: 'e1', name: 'Test' });

      // 30s later — still within TTL
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 30_000);

      const cached = service.getCached('Engagement', 'e1');
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

  // ── SME_MART_CLASS_IDS canonical UUIDs ──
  //
  // Plan 26-04: pipeline-write.service.ts had two FICTIONAL deterministic-UUID-v5
  // class id consts that were never registered with the platform. Pipeline.receive
  // returned "No such Class" for both, and every write through these classes
  // failed silently (the call sites .catch(err => console.error(...)) and never
  // surface the failure).
  //
  // These tests pin the canonical platform-assigned ids so future regressions
  // (e.g., someone "correcting" the comment back to UUID v5 form) fail fast.

  describe('SME_MART_CLASS_IDS canonical UUIDs', () => {
    it('MarketplaceProfileItem must use canonical class id 7bcf86a5-91dc-520d-b9bf-e308b1078d46', async () => {
      await service.pushEntities('MarketplaceProfileItem', [
        { id: 'mpi-test-uuid-check', name: 'mpi-test-uuid-check', section: 'legal_name', data: 'Test', orgId: 'test-org' },
      ]);

      expect(mockPipelineApi.receive).toHaveBeenCalledTimes(1);
      const batch = mockPipelineApi.receive.mock.calls[0][1];
      // SimpleBatch.classId is a UUID instance — toString() yields the string form.
      expect(batch.classId.toString()).toBe('7bcf86a5-91dc-520d-b9bf-e308b1078d46');
    });

    it('EngagementVettingItem must use canonical class id 21f5841f-dd27-53ef-a0f5-6a816ec7f7e1', async () => {
      await service.pushEntities('EngagementVettingItem', [
        { id: 'evi-test-uuid-check', name: 'evi-test-uuid-check' },
      ]);

      expect(mockPipelineApi.receive).toHaveBeenCalledTimes(1);
      const batch = mockPipelineApi.receive.mock.calls[0][1];
      expect(batch.classId.toString()).toBe('21f5841f-dd27-53ef-a0f5-6a816ec7f7e1');
    });
  });
});
