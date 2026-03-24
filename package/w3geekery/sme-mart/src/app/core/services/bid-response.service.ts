import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { BID_RESPONSE_FIELD_MAPPING, mapGqlToNeon, mapNeonToGql } from '../field-mappings';
import type { BidResponse, ComplianceSummary } from '../models';

/** GQL fields to request for BidResponse queries */
const GQL_FIELDS = [
  'id', 'bidId', 'requirementId', 'complianceStatus', 'responseText',
  'estimatedHours', 'estimatedCost', 'certificationRef', 'readyDate',
  'respondedAt', 'updatedAt',
];

/**
 * BidResponseService — MIGRATED TO PIPELINE + GQL (Plan 059 Wave 5)
 *
 * Reads: GraphqlReadService (AuditgraphDB)
 * Writes: PipelineWriteService (Receiver Pipeline)
 *
 * Model uses snake_case (BidResponse interface). GQL returns camelCase.
 * mapGqlToNeon converts GQL responses back to snake_case for consumers.
 */
@Injectable({ providedIn: 'root' })
export class BidResponseService {
  private readonly pipeline = inject(PipelineWriteService);
  private readonly gql = inject(GraphqlReadService);

  /** Load all responses for a bid. */
  async listByBid(bidId: string): Promise<BidResponse[]> {
    const result = await this.gql.query<Record<string, unknown>>(
      'BidResponse',
      GQL_FIELDS,
      { filters: { bidId: `.eq.${bidId}` }, pageSize: 200 },
    );
    return result.items.map(gql =>
      mapGqlToNeon<BidResponse>(gql, BID_RESPONSE_FIELD_MAPPING.gqlToNeon),
    );
  }

  /** Get a single response by bid + requirement. */
  async getByRequirement(bidId: string, requirementId: string): Promise<BidResponse | null> {
    const result = await this.gql.query<Record<string, unknown>>(
      'BidResponse',
      GQL_FIELDS,
      {
        filters: {
          bidId: `.eq.${bidId}`,
          requirementId: `.eq.${requirementId}`,
        },
        pageSize: 1,
      },
    );
    if (!result.items.length) return null;
    return mapGqlToNeon<BidResponse>(result.items[0], BID_RESPONSE_FIELD_MAPPING.gqlToNeon);
  }

  /** Create or update a response (upsert pattern). */
  async saveResponse(bidId: string, requirementId: string, data: {
    compliance_status: string;
    response_text?: string;
    estimated_hours?: number;
    estimated_cost?: number;
    certification_ref?: string;
    ready_date?: string;
  }): Promise<BidResponse> {
    const existing = await this.getByRequirement(bidId, requirementId);

    const neonFields: Record<string, unknown> = {
      bid_id: bidId,
      requirement_id: requirementId,
      ...data,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      neonFields['id'] = existing.id;
    } else {
      neonFields['id'] = `br-${bidId.slice(0, 8)}-${requirementId.slice(0, 8)}-${Date.now()}`;
    }

    const gqlData = mapNeonToGql<Record<string, unknown>>(neonFields, BID_RESPONSE_FIELD_MAPPING.neonToGql);
    await this.pipeline.pushEntity('BidResponse', gqlData);

    // Return the local model immediately (optimistic — pipeline is async)
    return { ...existing, ...neonFields } as BidResponse;
  }

  /** Batch save multiple responses. */
  async saveResponses(bidId: string, responses: Map<string, Partial<BidResponse>>): Promise<void> {
    const promises: Promise<BidResponse>[] = [];
    for (const [requirementId, data] of responses) {
      if (data.compliance_status) {
        promises.push(this.saveResponse(bidId, requirementId, {
          compliance_status: data.compliance_status,
          response_text: data.response_text || undefined,
          estimated_hours: data.estimated_hours ?? undefined,
          estimated_cost: data.estimated_cost ?? undefined,
          certification_ref: data.certification_ref || undefined,
          ready_date: data.ready_date || undefined,
        }));
      }
    }
    await Promise.all(promises);
  }

  /** Compute compliance summary from a list of responses. */
  computeSummary(responses: BidResponse[], totalRequirements: number): ComplianceSummary {
    const summary: ComplianceSummary = {
      met: 0,
      partially_met: 0,
      not_met: 0,
      not_applicable: 0,
      planned: 0,
      total: totalRequirements,
      responded: responses.length,
    };

    for (const r of responses) {
      const status = r.compliance_status;
      if (status in summary) {
        (summary as any)[status]++;
      }
    }

    return summary;
  }
}
