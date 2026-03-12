import { Injectable, inject } from '@angular/core';
import { SmeMartDbService } from './sme-mart-db.service';
import type { Bid, BidSummaryRow, BidWizardData } from '../models';

@Injectable({ providedIn: 'root' })
export class BidsService {
  private readonly db = inject(SmeMartDbService);

  async listBidsByRequest(requestId: string): Promise<Bid[]> {
    const result = await this.db.searchRows<Bid>(
      'bids',
      `(request_id=${requestId})`,
      { pageSize: 100 },
    );
    return result.items || [];
  }

  /** Load bids with compliance summaries from the v_bid_summary view. */
  async listBidSummaries(requestId: string): Promise<BidSummaryRow[]> {
    const result = await this.db.searchRows<BidSummaryRow>(
      'v_bid_summary',
      `(request_id=${requestId})`,
      { pageSize: 100 },
    );
    return result.items || [];
  }

  async getBid(id: string): Promise<Bid | null> {
    return this.db.getRow<Bid>('bids', id);
  }

  /** Create a new bid (simple submit — existing flow) */
  async submitBid(data: {
    request_id: string;
    provider_id: string;
    cover_letter?: string;
    proposed_price?: string;
    proposed_timeline?: string;
  }): Promise<Bid> {
    return this.db.createRow<Bid>('bids', {
      ...data,
      status: 'pending',
    });
  }

  /** Create a draft bid for the wizard flow */
  async createDraft(requestId: string, providerId: string): Promise<Bid> {
    return this.db.createRow<Bid>('bids', {
      request_id: requestId,
      provider_id: providerId,
      status: 'draft',
      wizard_step: 0,
    });
  }

  /** Save wizard progress (partial update) */
  async saveDraft(id: string, wizardData: BidWizardData, step: number): Promise<Bid> {
    const fields: Record<string, unknown> = {
      wizard_data: JSON.stringify(wizardData),
      wizard_step: step,
    };

    // Flatten approach fields onto bid columns
    if (wizardData.approach) {
      if (wizardData.approach.executive_summary !== undefined) {
        fields['executive_summary'] = wizardData.approach.executive_summary;
      }
      if (wizardData.approach.cover_letter !== undefined) {
        fields['cover_letter'] = wizardData.approach.cover_letter;
      }
    }

    // Flatten team fields
    if (wizardData.team) {
      if (wizardData.team.team_description !== undefined) {
        fields['team_description'] = wizardData.team.team_description;
      }
    }

    // Flatten pricing fields
    if (wizardData.pricing) {
      if (wizardData.pricing.proposed_price !== undefined) {
        fields['proposed_price'] = wizardData.pricing.proposed_price;
      }
      if (wizardData.pricing.proposed_timeline !== undefined) {
        fields['proposed_timeline'] = wizardData.pricing.proposed_timeline;
      }
      if (wizardData.pricing.total_estimated_hours !== undefined) {
        fields['total_estimated_hours'] = wizardData.pricing.total_estimated_hours;
      }
      if (wizardData.pricing.pricing_breakdown !== undefined) {
        fields['pricing_breakdown'] = JSON.stringify(wizardData.pricing.pricing_breakdown);
      }
    }

    return this.db.updateRow<Bid>('bids', id, fields);
  }

  /** Submit a draft bid (finalize) */
  async submitDraft(id: string): Promise<Bid> {
    return this.db.updateRow<Bid>('bids', id, {
      status: 'pending',
      wizard_data: null,
    });
  }

  /** Find an existing draft bid for a provider on a request */
  async findDraft(requestId: string, providerId: string): Promise<Bid | null> {
    const result = await this.db.searchRows<Bid>(
      'bids',
      `(&(request_id=${requestId})(provider_id=${providerId})(status=draft))`,
      { pageSize: 1 },
    );
    return result.items?.[0] || null;
  }

  async acceptBid(id: string): Promise<Bid> {
    return this.db.updateRow<Bid>('bids', id, { status: 'accepted' });
  }

  async rejectBid(id: string): Promise<Bid> {
    return this.db.updateRow<Bid>('bids', id, { status: 'rejected' });
  }

  async withdrawBid(id: string): Promise<Bid> {
    return this.db.updateRow<Bid>('bids', id, { status: 'withdrawn' });
  }
}
