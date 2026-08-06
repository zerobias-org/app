import { Injectable, inject } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { SimpleBatch } from '@zerobias-com/platform-sdk';
import { UUID } from '@zerobias-org/types-core-js';
import { environment } from '../../../environments/environment';

// ---------------------------------------------------------------------------
// SME Mart AuditgraphDB class IDs
//
// Env-invariant: these are UUIDv5, derived from the class content, so a value
// looked up in one environment is valid in all of them. Every id below was read
// back from platform.Class.getClass rather than computed.
//
// 2026-08-05: 19 entries removed — 15 classes retired by the smemart schema batch,
// plus 4 already dead since 2.0.7 (MarketplaceProfileItem and the three pre-rename
// Provider* names). An entry for a retired class does not keep its readers working,
// it only keeps them COMPILING — which is how the 2.0.7 four stayed broken on UAT
// behind a green build.
// ---------------------------------------------------------------------------
export const SME_MART_CLASS_IDS = {
  // Marketplace core
  Bid:                          'ccddd2e5-e455-585e-9bb7-902903228b0d',
  BidResponse:                  'a024a0b5-50df-59cc-ba8e-25fcd82f69c3',
  Review:                       'ef5d821a-46f5-5f44-8e59-0854777d803c',
  ProjectPrd:                   '920fca70-4dcf-5d9e-ba16-1dfd0f8061f0',
  PrdSection:                   'd30445f3-e26d-5153-83be-fe810f63220c',
  ProjectPlan:                  'bc6159da-19a3-51d0-89a8-f2147078c760',
  PlanMilestone:                'ac1a1cc8-db44-5c1d-b359-5fb02e3d381d',
  RfpInvitation:                '941cf01b-d260-5e45-8c6a-50f07b23f196',
  ProviderRole:                 '6098fe68-f656-51fe-87d8-dde87b50efc6',
  ProviderSegment:              '1b211929-39af-5d81-b205-3bf2c23d45d6',
  ProviderServiceSegment:       '5d698106-3a8a-530d-9060-52e1aa7ab134',
  OrgProfile:                   '8001e339-2609-54ae-b407-9c2ab7ebf413',
  InsuranceCoverage:            '7b0b6b97-b99e-5267-9cf0-2dd3f5888997',
  ClientReference:              '632ced7f-85d5-5f6e-9f99-8258001d14cc',
  Personnel:                    '23dd60e6-100d-5d65-bc09-af594215e27e',
  FinancialProfile:             '5b4cba20-be1c-5747-b355-5ff18b7b76b5',
  OrgSegment:                   '780543c7-fbe5-5e8e-8bd5-5361689c1ce6',

  // Added 2026-08-05 — shipped in smemart 2.0.7; ids read from
  // platform.Class.getClass on UAT and cross-checked via the portal REST endpoint.
  // The three *Proficiency classes are NEW ids, not renames: the originals were
  // retired whole and the replacements born as new class files, so there is no id
  // continuity from ProviderSkill / ProviderProduct / ProviderFramework.
  VendorListing:                'f7a997bd-6b9d-55be-ac82-6a5c56e2b1f3',
  VendorListingSegment:         'f2ad9c7a-15bd-5b23-9320-495cd2b431f6',
  ServiceCapability:            '047feaba-0624-5b92-a953-b10d77e892b7',
  ProviderSkillProficiency:     'aa933d21-64c3-50ae-a40d-d989470a1ad0',
  ProviderProductProficiency:   '8b392156-c572-540e-88db-fcecb08eead7',
  ProviderFrameworkProficiency: 'cd2b61f1-36c6-5a83-b2f6-e91a6523a09e',

  // NOT registered yet, deliberately: OrgCredential, SecurityCredential and
  // UserCredential. They are a Brian ask, landed AHEAD of their consumers — so having
  // no app readers is the expected state, not a symptom. Leave them alone until we need
  // them, and do NOT read the missing entries as evidence they are retirement material.
  //
  // The asymmetry, since a retirement sweep will pass this way again: app coupling is
  // never a reason to KEEP a class, and that does not invert — the absence of coupling
  // is not on its own a reason to KILL one.
} as const;

export type SmeMartClassName = keyof typeof SME_MART_CLASS_IDS;

// ---------------------------------------------------------------------------
// Pipeline ID (from environment — per-environment, NOT deterministic)
// ---------------------------------------------------------------------------
const PIPELINE_ID = environment.pipelineId;

// ---------------------------------------------------------------------------
// Tag Field Helpers
// ---------------------------------------------------------------------------

/**
 * Merge existing tag entries (from data payload) with new tag IDs.
 * Returns a deduplicated, stable-ordered array of tag objects.
 *
 * @param existing Array of {value: string} entries already in the data
 * @param newIds Array of UUID strings to add as tag values
 * @returns Merged array: [existing entries, new entries], deduplicated
 */
function mergeTagValues(
  existing: Array<{ value: string }> = [],
  newIds: string[] = [],
): Array<{ value: string }> {
  const values = new Set<string>();
  const result: Array<{ value: string }> = [];

  // Add existing entries first, preserving order
  for (const entry of existing) {
    if (!values.has(entry.value)) {
      values.add(entry.value);
      result.push(entry);
    }
  }

  // Add new IDs in order
  for (const id of newIds) {
    if (!values.has(id)) {
      values.add(id);
      result.push({ value: id });
    }
  }

  return result;
}

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
   *
   * @param className Entity type
   * @param data Array of objects to push
   * @param tagIds Optional tag UUIDs to embed into each Object's `tag` field as `{ value: <uuid> }` entries.
   *               Note: this populates `Object.tag` on GQL read-back; the SimpleBatch third-arg / Pipeline.receive
   *               body-level `tagIds` field is batch/job metadata and does NOT populate `Object.tag`
   *               (verified 2026-05-04 via Director MCP probe).
   * @param callSiteTag Optional explicit caller identifier for telemetry. If not provided,
   *                     derived from stack trace as fallback.
   */
  async pushEntities(
    className: SmeMartClassName,
    data: object[],
    tagIds: string[] = [],
    callSiteTag?: string,
  ): Promise<void> {
    const classId = SME_MART_CLASS_IDS[className];
    const pipelineApi = this.clientApi.platformClient.getPipelineApi();

    // Ensure every object has `name` (required by AuditgraphDB Object base class).
    // If not provided, derive from common fields or use className + id as fallback.
    // Also embed tagIds into the data payload as `tag: [{value: <uuid>}]` entries.
    const ensured = (data as Record<string, unknown>[]).map(obj => {
      let result: Record<string, unknown> = obj['name'] ? { ...obj } : {
        ...obj,
        name: obj['title'] || obj['coverLetter']?.toString().substring(0, 100)
          || obj['reviewText']?.toString().substring(0, 100)
          || obj['displayName'] || obj['category']
          || `${className}-${obj['id'] ?? 'unknown'}`,
      };

      // Embed tags into the data payload if any tagIds were provided
      if (tagIds.length > 0) {
        const existingTag = (result['tag'] as Array<{ value: string }> | undefined) ?? [];
        result = {
          ...result,
          tag: mergeTagValues(existingTag, tagIds),
        };
      }

      return result;
    });

    const batch = new SimpleBatch(
      new UUID(classId),
      ensured,
      [], // tagIds: batch/job metadata (does NOT populate Object.tag) — tags embedded in data instead
    );

    try {
      await pipelineApi.receive(new UUID(PIPELINE_ID), batch);
    } catch (err) {
      // FF-03: Telemetry instrumentation — log rejection with caller context
      const callSite = callSiteTag || this.deriveCallSiteFromStack();
      const errorMessage = err instanceof Error ? err.message : String(err);
      const event = {
        className,
        callSite,
        errorMessage,
        timestamp: new Date().toISOString(),
      };
      console.warn(`[PIPELINE_WRITE_FAILURE] ${JSON.stringify(event)}`);
      throw err;  // Re-throw so caller can handle normally
    }

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
   *
   * @param callSiteTag Optional explicit caller identifier for telemetry.
   */
  async pushEntity(
    className: SmeMartClassName,
    data: Record<string, unknown>,
    tagIds: string[] = [],
    callSiteTag?: string,
  ): Promise<void> {
    await this.pushEntities(className, [data], tagIds, callSiteTag);
  }

  /**
   * Mark entities as deleted in AuditgraphDB (differential mode).
   * Removes objects by their external IDs.
   *
   * @param callSiteTag Optional explicit caller identifier for telemetry.
   */
  async deleteEntities(
    className: SmeMartClassName,
    ids: string[],
    callSiteTag?: string,
  ): Promise<void> {
    const classId = SME_MART_CLASS_IDS[className];
    const pipelineApi = this.clientApi.platformClient.getPipelineApi();
    const batch = new SimpleBatch(
      new UUID(classId),
      [],       // no data to add
      [],       // no tags
      ids,      // markDeleted
    );

    try {
      await pipelineApi.receive(new UUID(PIPELINE_ID), batch);
    } catch (err) {
      // FF-03: Telemetry instrumentation — log rejection with caller context
      const callSite = callSiteTag || this.deriveCallSiteFromStack();
      const errorMessage = err instanceof Error ? err.message : String(err);
      const event = {
        className,
        callSite,
        errorMessage,
        timestamp: new Date().toISOString(),
      };
      console.warn(`[PIPELINE_WRITE_FAILURE] ${JSON.stringify(event)}`);
      throw err;  // Re-throw so caller can handle normally
    }
  }

  /**
   * Mark a single entity as deleted. Convenience wrapper.
   *
   * @param callSiteTag Optional explicit caller identifier for telemetry.
   */
  async deleteEntity(
    className: SmeMartClassName,
    id: string,
    callSiteTag?: string,
  ): Promise<void> {
    await this.deleteEntities(className, [id], callSiteTag);
  }

  /**
   * Derive call site from the stack trace as a fallback when callSiteTag is not provided.
   * Extracts the first caller outside this service as a location hint.
   *
   * @internal
   */
  private deriveCallSiteFromStack(): string {
    try {
      const stack = new Error().stack || '';
      const lines = stack.split('\n');
      // Lines format: "    at FunctionName (file.ts:line:col)"
      // Skip first 2 lines (Error.stack header + this function)
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i];
        if (line && !line.includes('pipeline-write.service.ts')) {
          // Extract filename and line number
          const match = line.match(/at\s+(\w+)?\s*\(([^:]+):(\d+):/);
          if (match) {
            const [, , file, lineNum] = match;
            const filename = file.split('/').pop() || 'unknown';
            return `${filename}:${lineNum}`;
          }
        }
      }
    } catch {
      // Stack parsing failed
    }
    return 'unknown-callsite';
  }
}
