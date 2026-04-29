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

  // ── Phase 20 Wave 3: Round-trip per class id ──
  //
  // For each of the 23 entries in SME_MART_CLASS_IDS, exercise
  // pushEntities(className, [...]) with a minimal-but-valid object and
  // assert that the resulting SimpleBatch carries the canonical
  // platform-assigned UUID. This is the "round-trip writes for the 23
  // explicit class IDs" gate from the Wave 3 plan: each className key in
  // the registry actually reaches the receiver pipeline with the right
  // classId. Pin failures to a per-class assertion so a regression
  // (rename, accidental UUID drift) localizes to the offending class.
  //
  // UUIDs sourced from `pipeline-write.service.ts` SME_MART_CLASS_IDS,
  // re-verified against `platform.Class.getClass` on UAT 2026-04-29 (see
  // AUDIT.md "Class-ID Verification Table"). 23/23 canonical.

  describe('Class-id round-trip for all 23 SME_MART_CLASS_IDS (Phase 20 Wave 3)', () => {
    const CASES: Array<[string, string]> = [
      // Original 8 (Phases 2-4 Neon→Pipeline migration)
      ['Engagement',             '7711aa41-e55b-5cda-9b7a-35844a2006a1'],
      ['Bid',                    'ccddd2e5-e455-585e-9bb7-902903228b0d'],
      ['BidResponse',            'a024a0b5-50df-59cc-ba8e-25fcd82f69c3'],
      ['ServiceOffering',        'ff689173-4787-52c5-808b-6b2435a625a7'],
      ['Note',                   'fe7c58a9-c13b-5a4b-817f-5c4b419ed28c'],
      ['NoteFolder',             '4d50975e-d4dc-5654-8e43-f3c5da01f49d'],
      ['Review',                 'ef5d821a-46f5-5f44-8e59-0854777d803c'],
      ['SmeMartDocument',        'e1497ca8-a621-57f6-9263-f9a19fea3c34'],
      // Phase 6 Bloom (greenfield Pipeline+GQL)
      ['SmeMartProject',         'c66114a2-48e2-5b93-b7d6-7ccd6ef45a03'],
      ['SmeMartBoard',           '20be589b-194e-5227-ba6e-c7edae42f34b'],
      ['SmeMartActivity',        '36405d75-76f1-5f4b-ab3b-22c562d41e07'],
      ['SmeMartWorkflow',        '295938d2-5c63-5140-a945-2ba28b88b268'],
      ['SmeMartTask',            'e15f1e0a-1bc9-5002-b4bc-3482d4499561'],
      ['ProjectPrd',             '920fca70-4dcf-5d9e-ba16-1dfd0f8061f0'],
      ['PrdSection',             'd30445f3-e26d-5153-83be-fe810f63220c'],
      ['ProjectPlan',            'bc6159da-19a3-51d0-89a8-f2147078c760'],
      ['PlanMilestone',          'ac1a1cc8-db44-5c1d-b359-5fb02e3d381d'],
      // Plan 063 + Plan 041 (corrected via Plan 26-04 errata 023)
      ['EngagementVettingItem',  '21f5841f-dd27-53ef-a0f5-6a816ec7f7e1'],
      ['MarketplaceProfileItem', '7bcf86a5-91dc-520d-b9bf-e308b1078d46'],
      // Phase 14 / 15 / 16
      ['RfpInvitation',          '941cf01b-d260-5e45-8c6a-50f07b23f196'],
      ['DocumentTemplate',       'd2493bf7-f28d-5d26-8858-58062d402012'],
      ['DocumentInstance',       '3e1d232f-3105-535e-8ef5-70cb0f80d65f'],
      ['FormSubmission',         '179bd4b1-d1b1-5afc-99be-a5465a662ec6'],
    ];

    it.each(CASES)(
      'pushEntities(%s) routes batch to canonical classId %s',
      async (className, expectedClassId) => {
        await service.pushEntities(className as any, [
          { id: `rt-${className}-001`, name: `rt-${className}-001` },
        ]);

        expect(mockPipelineApi.receive).toHaveBeenCalledTimes(1);
        const batch = mockPipelineApi.receive.mock.calls[0][1];
        expect(batch.classId.toString()).toBe(expectedClassId);
      },
    );

    it('round-trip coverage spans all 23 SME_MART_CLASS_IDS entries', () => {
      // Belt-and-suspenders: if someone adds a new class to the registry
      // without adding a CASES row, this assertion fails so coverage
      // never silently drifts. 23 = canonical count from AUDIT.md.
      expect(CASES).toHaveLength(23);
      // No duplicate UUIDs — protects against copy-paste regression.
      const uuids = CASES.map(([, id]) => id);
      expect(new Set(uuids).size).toBe(23);
      // No duplicate class names.
      const names = CASES.map(([n]) => n);
      expect(new Set(names).size).toBe(23);
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
      } catch (e) {
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

      const promise = service.pushEntities('Engagement', [{ id: 'e1', name: 'Test' }]);
      await expect(promise).rejects.toThrow('Pipeline error');
    });

    it('pushEntities: explicit callSiteTag is reflected in telemetry event', async () => {
      mockPipelineApi.receive.mockRejectedValueOnce(new Error('Test error'));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await service.pushEntities('Note', [{ id: 'n1', name: 'Test' }], [], 'notes.service:52');
      } catch (e) {
        // Expected
      }

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const [message] = consoleWarnSpy.mock.calls[0];
      const eventStr = message.split('[PIPELINE_WRITE_FAILURE] ')[1];
      const event = JSON.parse(eventStr);

      // Explicit tag matches production caller pattern (Wave 2 services pass file:line)
      expect(event.callSite).toBe('notes.service:52');

      consoleWarnSpy.mockRestore();
    });

    it('pushEntity: delegates to pushEntities with callSiteTag', async () => {
      mockPipelineApi.receive.mockRejectedValueOnce(new Error('Test error'));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await service.pushEntity('Review', { id: 'r1', name: 'Test' }, [], 'review-submit.component.ts:85');
      } catch (e) {
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
        await service.deleteEntities('Note', ['n1', 'n2'], 'note-delete.component.ts:99');
      } catch (e) {
        // Expected
      }

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const [message] = consoleWarnSpy.mock.calls[0];
      const eventStr = message.split('[PIPELINE_WRITE_FAILURE] ')[1];
      const event = JSON.parse(eventStr);

      expect(event.className).toBe('Note');
      expect(event.callSite).toBe('note-delete.component.ts:99');
      expect(event.errorMessage).toBe('Delete failed');

      consoleWarnSpy.mockRestore();
    });

    it('deleteEntity: delegates to deleteEntities with callSiteTag', async () => {
      mockPipelineApi.receive.mockRejectedValueOnce(new Error('Delete failed'));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await service.deleteEntity('Engagement', 'e1', 'engagement-delete.component.ts:44');
      } catch (e) {
        // Expected
      }

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      const [message] = consoleWarnSpy.mock.calls[0];
      const eventStr = message.split('[PIPELINE_WRITE_FAILURE] ')[1];
      const event = JSON.parse(eventStr);

      expect(event.callSite).toBe('engagement-delete.component.ts:44');

      consoleWarnSpy.mockRestore();
    });

    it('telemetry event timestamp is ISO format', async () => {
      mockPipelineApi.receive.mockRejectedValueOnce(new Error('Test'));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await service.pushEntities('Bid', [{ id: 'b1', name: 'Test' }]);
      } catch (e) {
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
      await service.pushEntities('Engagement', [{ id: 'e1', name: 'Test' }]);

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
