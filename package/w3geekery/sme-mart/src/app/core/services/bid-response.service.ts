import { Injectable, inject } from '@angular/core';
import { SmeMartDbService } from './sme-mart-db.service';
import type { BidResponse, ComplianceSummary } from '../models';

@Injectable({ providedIn: 'root' })
export class BidResponseService {
  private readonly db = inject(SmeMartDbService);

  /** Load all responses for a bid. */
  async listByBid(bidId: string): Promise<BidResponse[]> {
    const result = await this.db.searchRows<BidResponse>(
      'bid_responses',
      `(bid_id=${bidId})`,
      { pageSize: 200 },
    );
    return result.items || [];
  }

  /** Get a single response by bid + requirement. */
  async getByRequirement(bidId: string, requirementId: string): Promise<BidResponse | null> {
    const result = await this.db.searchRows<BidResponse>(
      'bid_responses',
      `(&(bid_id=${bidId})(requirement_id=${requirementId}))`,
      { pageSize: 1 },
    );
    return result.items?.[0] || null;
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

    const fields: Record<string, unknown> = {
      ...data,
      responded_at: new Date().toISOString(),
    };

    if (existing) {
      return this.db.updateRow<BidResponse>('bid_responses', existing.id, fields);
    }

    return this.db.createRow<BidResponse>('bid_responses', {
      bid_id: bidId,
      requirement_id: requirementId,
      ...fields,
    });
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
