import { Injectable, inject, signal } from '@angular/core';
import { SmeMartDbService } from './sme-mart-db.service';
import type { QueryOptions } from '@zerobias-org/data-utils';
import type { PagedResults } from '@zerobias-org/types-core-js';
import type {
  WorkRequest,
  EngagementSummaryRow,
  EngagementDetailRow,
  BudgetType,
} from '../models';

@Injectable({ providedIn: 'root' })
export class WorkRequestsService {
  private readonly db = inject(SmeMartDbService);

  readonly engagements = signal<EngagementSummaryRow[]>([]);
  readonly loading = signal(false);

  async listEngagements(options?: QueryOptions): Promise<PagedResults<EngagementSummaryRow>> {
    this.loading.set(true);
    try {
      const result = await this.db.listRows<EngagementSummaryRow>('v_engagement_summary', options);
      this.engagements.set(result.items || []);
      return result;
    } finally {
      this.loading.set(false);
    }
  }

  async searchEngagements(filter: string, options?: QueryOptions): Promise<PagedResults<EngagementSummaryRow>> {
    this.loading.set(true);
    try {
      const result = await this.db.searchRows<EngagementSummaryRow>('v_engagement_summary', filter, options);
      this.engagements.set(result.items || []);
      return result;
    } finally {
      this.loading.set(false);
    }
  }

  async getEngagement(id: string): Promise<EngagementDetailRow | null> {
    return this.db.getRow<EngagementDetailRow>('v_engagement_detail', id);
  }

  /** Fetch raw work_requests row (includes rfp_wizard_data/step). */
  async getWorkRequest(id: string): Promise<WorkRequest | null> {
    return this.db.getRow<WorkRequest>('work_requests', id);
  }

  async createRfp(data: {
    buyer_zerobias_user_id: string;
    buyer_zerobias_org_id?: string;
    title: string;
    description?: string;
    category: string;
    budget_type?: BudgetType;
    budget_min?: string;
    budget_max?: string;
    timeline?: string;
    status?: 'draft' | 'open';
  }): Promise<WorkRequest> {
    return this.db.createRow<WorkRequest>('work_requests', {
      ...data,
      status: data.status || 'open',
    });
  }

  async updateRfp(id: string, data: Partial<WorkRequest>): Promise<WorkRequest> {
    return this.db.updateRow<WorkRequest>('work_requests', id, data as Record<string, unknown>);
  }

  async graduateToEngagement(id: string, engagementTag: string, zerobiasTagId?: string): Promise<WorkRequest> {
    return this.db.updateRow<WorkRequest>('work_requests', id, {
      engagement_tag: engagementTag,
      zerobias_tag_id: zerobiasTagId || null,
      status: 'in_progress',
    });
  }

  async cancelEngagement(id: string): Promise<WorkRequest> {
    return this.db.updateRow<WorkRequest>('work_requests', id, { status: 'cancelled' });
  }

  async completeEngagement(id: string): Promise<WorkRequest> {
    return this.db.updateRow<WorkRequest>('work_requests', id, { status: 'completed' });
  }
}
