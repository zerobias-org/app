import { Injectable, inject } from '@angular/core';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { SimpleBatch } from '@zerobias-com/platform-sdk';
import { UUID } from '@zerobias-org/types-core-js';

// ---------------------------------------------------------------------------
// SME Mart AuditgraphDB class IDs (prod)
// ---------------------------------------------------------------------------
// Phase 1-5 migrated entities (original 8 from Neon)
const SME_MART_CLASS_IDS = {
  Engagement:     '7711aa41-e55b-5cda-9b7a-35844a2006a1',
  Bid:            'ccddd2e5-e455-585e-9bb7-902903228b0d',
  BidResponse:    'a024a0b5-50df-59cc-ba8e-25fcd82f69c3',
  ServiceOffering:'ff689173-4787-52c5-808b-6b2435a625a7',
  Note:           'fe7c58a9-c13b-5a4b-817f-5c4b419ed28c',
  NoteFolder:     '4d50975e-d4dc-5654-8e43-f3c5da01f49d',
  Review:         'ef5d821a-46f5-5f44-8e59-0854777d803c',
  SmeMartDocument:'e1497ca8-a621-57f6-9263-f9a19fea3c34',

  // Phase 6 Bloom entities (greenfield, no Neon)
  // TODO: Replace placeholders with actual class IDs from platform after PR #8 merge
  SmeMartProject:   'TODO-uuid-placeholder-sme-mart-project',
  SmeMartBoard:     'TODO-uuid-placeholder-sme-mart-board',
  SmeMartActivity:  'TODO-uuid-placeholder-sme-mart-activity',
  SmeMartWorkflow:  'TODO-uuid-placeholder-sme-mart-workflow',
} as const;

export type SmeMartClassName = keyof typeof SME_MART_CLASS_IDS;

// ---------------------------------------------------------------------------
// Pipeline ID (prod — receiver differential)
// ---------------------------------------------------------------------------
const PIPELINE_ID = '091d5068-0527-4f45-9839-37f6d5c1669e';

/**
 * Pushes SME Mart entity data into AuditgraphDB via the Receiver Pipeline.
 *
 * Uses `platform.Pipeline.receive` — a single-call shortcut that wraps
 * job creation, batch creation, item ingestion, and job completion.
 *
 * All objects must conform to their class schema (id, name required;
 * custom fields as defined in w3geekery.sme-mart.schema YAML).
 */
@Injectable({ providedIn: 'root' })
export class PipelineWriteService {
  private readonly clientApi = inject(ZerobiasClientApi);

  /**
   * Push one or more objects of a given class into AuditgraphDB.
   * Objects are created or updated based on their `id` field (upsert).
   */
  async pushEntities(
    className: SmeMartClassName,
    data: Record<string, unknown>[],
    tagIds: string[] = [],
  ): Promise<void> {
    const classId = SME_MART_CLASS_IDS[className];
    const pipelineApi = this.clientApi.platformClient.getPipelineApi();
    const batch = new SimpleBatch(
      new UUID(classId),
      data,
      tagIds.map(id => new UUID(id)),
    );
    await pipelineApi.receive(new UUID(PIPELINE_ID), batch);
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
