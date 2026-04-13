import { Injectable, inject } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { SimpleBatch } from '@zerobias-com/platform-sdk';
import { UUID } from '@zerobias-org/types-core-js';
import { environment } from '../../../environments/environment';

// ---------------------------------------------------------------------------
// SME Mart AuditgraphDB class IDs (deterministic — same across all environments)
// ---------------------------------------------------------------------------
const SME_MART_CLASS_IDS = {
  // Original 8 entities (migrated from Neon in Phases 2-4)
  Engagement:      '7711aa41-e55b-5cda-9b7a-35844a2006a1',
  Bid:             'ccddd2e5-e455-585e-9bb7-902903228b0d',
  BidResponse:     'a024a0b5-50df-59cc-ba8e-25fcd82f69c3',
  ServiceOffering: 'ff689173-4787-52c5-808b-6b2435a625a7',
  Note:            'fe7c58a9-c13b-5a4b-817f-5c4b419ed28c',
  NoteFolder:      '4d50975e-d4dc-5654-8e43-f3c5da01f49d',
  Review:          'ef5d821a-46f5-5f44-8e59-0854777d803c',
  SmeMartDocument: 'e1497ca8-a621-57f6-9263-f9a19fea3c34',

  // Phase 6 Bloom entities (greenfield — built directly on Pipeline+GQL)
  SmeMartProject:  'c66114a2-48e2-5b93-b7d6-7ccd6ef45a03',
  SmeMartBoard:    '20be589b-194e-5227-ba6e-c7edae42f34b',
  SmeMartActivity: '36405d75-76f1-5f4b-ab3b-22c562d41e07',
  SmeMartWorkflow: '295938d2-5c63-5140-a945-2ba28b88b268',
  SmeMartTask:     'e15f1e0a-1bc9-5002-b4bc-3482d4499561',
  ProjectPrd:      '920fca70-4dcf-5d9e-ba16-1dfd0f8061f0',
  PrdSection:      'd30445f3-e26d-5153-83be-fe810f63220c',
  ProjectPlan:     'bc6159da-19a3-51d0-89a8-f2147078c760',
  PlanMilestone:   'ac1a1cc8-db44-5c1d-b359-5fb02e3d381d',

  // Plan 063 — Corporate Vetting (update after schema PR merge + dataloader verify)
  EngagementVettingItem: '66fa174f-86b2-5854-b7c1-7ffe26fcaa46',

  // Plan 041 — Vendor Profile Service (deterministic UUID v5 from schema)
  MarketplaceProfileItem: 'ee1e68b7-f003-5f5f-a111-7ec93b37681c',

  // Phase 14 — Invitation Controls
  RfpInvitation: '941cf01b-d260-5e45-8c6a-50f07b23f196',

  // Phase 15 — Document Templates (TODO: populate after schema PR merge + dataloader verify)
  DocumentTemplate: '00000000-0000-0000-0000-000000000001', // Placeholder
  DocumentInstance: '00000000-0000-0000-0000-000000000002', // Placeholder

  // Phase 16 — Form Builder
  FormSubmission: 'af7eb14f-d2f0-59e3-8371-9e436b7a1bc2',
} as const;

export type SmeMartClassName = keyof typeof SME_MART_CLASS_IDS;

// ---------------------------------------------------------------------------
// Pipeline ID (from environment — per-environment, NOT deterministic)
// ---------------------------------------------------------------------------
const PIPELINE_ID = environment.pipelineId;

/**
 * Pushes SME Mart entity data into AuditgraphDB via the Receiver Pipeline.
 *
 * Uses `platform.Pipeline.receive` — a single-call shortcut that wraps
 * job creation, batch creation, item ingestion, and job completion.
 *
 * All objects must conform to their class schema (id, name required;
 * custom fields as defined in w3geekery.sme-mart.schema YAML).
 */
/** Cache TTL in milliseconds (60 seconds). */
const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  data: Record<string, unknown>;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class PipelineWriteService {
  private readonly clientApi = inject(ZerobiasClientApi);

  /**
   * Write-through cache for pipeline objects.
   * Pipeline receive is full-replace — partial pushes null unmentioned fields.
   * This cache lets services skip the GQL fetch on rapid successive edits
   * (e.g., color → rename → move) by reusing the last-pushed full object.
   *
   * Entries expire after 60s. Partial pushes merge into existing entries
   * rather than replacing them (prevents data loss from fire-and-forget
   * operations like moveNote that only send {id, folderId, updatedAt}).
   */
  private readonly cache = new Map<string, CacheEntry>();

  private cacheKey(className: string, id: string): string {
    return `${className}:${id}`;
  }

  /**
   * Get a cached object if fresh (within TTL).
   * Services should use: `getCached(...) ?? await gqlRead.getById(...)`
   */
  getCached(className: SmeMartClassName, id: string): Record<string, unknown> | null {
    const key = this.cacheKey(className, id);
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Evict stale entries
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return { ...entry.data };
  }

  /**
   * Seed the cache from a GQL fetch (e.g., after a getById).
   * Services that fetch before pushing should call this so subsequent
   * operations within the TTL window can skip the GQL round-trip.
   */
  seedCache(className: SmeMartClassName, id: string, data: Record<string, unknown>): void {
    this.cache.set(this.cacheKey(className, id), {
      data: { ...data },
      timestamp: Date.now(),
    });
  }

  /**
   * Push one or more objects of a given class into AuditgraphDB.
   * Objects are created or updated based on their `id` field (upsert).
   */
  async pushEntities(
    className: SmeMartClassName,
    data: object[],
    tagIds: string[] = [],
  ): Promise<void> {
    const classId = SME_MART_CLASS_IDS[className];
    const pipelineApi = this.clientApi.platformClient.getPipelineApi();

    // Ensure every object has `name` (required by AuditgraphDB Object base class).
    // If not provided, derive from common fields or use className + id as fallback.
    const ensured = (data as Record<string, unknown>[]).map(obj => {
      if (obj['name']) return obj;
      const name = obj['title'] || obj['coverLetter']?.toString().substring(0, 100)
        || obj['reviewText']?.toString().substring(0, 100)
        || obj['displayName'] || obj['category']
        || `${className}-${obj['id'] ?? 'unknown'}`;
      return { ...obj, name };
    });

    const batch = new SimpleBatch(
      new UUID(classId),
      ensured,
      tagIds.map(id => new UUID(id)),
    );
    await pipelineApi.receive(new UUID(PIPELINE_ID), batch);

    // Update cache with pushed objects (write-through, merge into existing)
    for (const obj of ensured) {
      const id = obj['id'] as string;
      if (id) {
        const key = this.cacheKey(className, id);
        const existing = this.cache.get(key);
        // Merge: overlay new fields onto existing cached data.
        // This prevents partial pushes (e.g., moveNote with {id, folderId})
        // from wiping out other fields in the cache.
        const merged = existing ? { ...existing.data, ...obj } : { ...obj };
        this.cache.set(key, {
          data: merged,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Push a single entity. Convenience wrapper around pushEntities.
   */
  async pushEntity(
    className: SmeMartClassName,
    data: Record<string, unknown>,
    tagIds: string[] = [],
  ): Promise<void> {
    await this.pushEntities(className, [data], tagIds);
  }

  /**
   * Mark entities as deleted in AuditgraphDB (differential mode).
   * Removes objects by their external IDs.
   */
  async deleteEntities(
    className: SmeMartClassName,
    ids: string[],
  ): Promise<void> {
    const classId = SME_MART_CLASS_IDS[className];
    const pipelineApi = this.clientApi.platformClient.getPipelineApi();
    const batch = new SimpleBatch(
      new UUID(classId),
      [],       // no data to add
      [],       // no tags
      ids,      // markDeleted
    );
    await pipelineApi.receive(new UUID(PIPELINE_ID), batch);
  }

  /**
   * Mark a single entity as deleted. Convenience wrapper.
   */
  async deleteEntity(
    className: SmeMartClassName,
    id: string,
  ): Promise<void> {
    await this.deleteEntities(className, [id]);
  }
}
