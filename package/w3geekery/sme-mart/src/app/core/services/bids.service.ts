import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { NotificationService } from './notification.service';
import { BID_FIELD_MAPPING, mapNeonToGql, mapGqlToNeon } from '../field-mappings';
import type { Bid, BidSummaryRow, BidWizardData } from '../models';
import type { GqlBidResponse } from '../gql-types';

/**
 * BidsService — Plan 075 Phase 2 refactor
 *
 * Bids now link to SmeMartProject (via `project` link field) instead of Engagement.
 * The `project` field is a GQL link — queries use rawQuery with `project { id }` syntax.
 *
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 */
@Injectable({ providedIn: 'root' })
export class BidsService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly notifications = inject(NotificationService);

  /** Scalar fields for standard queries (no link fields) */
  private readonly scalarBidFields = [
    'id',
    'name',
    'description',
    'providerId',
    'coverLetter',
    'price',
    'status',
    'timeline',
    'executiveSummary',
    'teamDescription',
    'totalEstimatedHours',
    'pricingBreakdown',
    'wizardData',
    'wizardStep',
    'dateCreated',
    'dateLastModified',
  ];

  /** Fields including project link expansion — for rawQuery only */
  private readonly allBidFields = [
    ...this.scalarBidFields,
    'project { id }',
  ];

  // ---------------------------------------------------------------------------
  // Query by Project (Plan 075 — replaces query-by-engagement)
  // ---------------------------------------------------------------------------

  /**
   * List all bids for a given project (RFP).
   * Uses rawQuery because `project` is a link field requiring nested filter.
   */
  async listBidsByProject(projectId: string): Promise<Bid[]> {
    const fieldStr = this.allBidFields.join(' ');
    const query = `{ Bid(project: { id: ".eq.${projectId}" }) { ${fieldStr} } }`;

    const data = await this.graphqlRead.rawQuery(query, 1, 100);
    const rawItems = (data['Bid'] as Record<string, unknown>[]) ?? [];

    return rawItems.map(gql => this.flattenAndMap(gql));
  }

  /**
   * Load bids with compliance summaries for a project.
   */
  async listBidSummaries(projectId: string): Promise<BidSummaryRow[]> {
    const bids = await this.listBidsByProject(projectId);
    return bids.map(bid => this.toBidSummary(bid));
  }

  /**
   * Find an existing draft bid for a provider on a project.
   * Uses rawQuery with compound filter on project link + providerId + status.
   */
  async findDraft(projectId: string, providerId: string): Promise<Bid | null> {
    const fieldStr = this.allBidFields.join(' ');
    const query = `{ Bid(project: { id: ".eq.${projectId}" }, providerId: ".eq.${providerId}", status: ".eq.draft") { ${fieldStr} } }`;

    const data = await this.graphqlRead.rawQuery(query, 1, 1);
    const rawItems = (data['Bid'] as Record<string, unknown>[]) ?? [];

    if (!rawItems.length) return null;
    return this.flattenAndMap(rawItems[0]);
  }

  // ---------------------------------------------------------------------------
  // Legacy query by engagement (backward compatibility during migration)
  // ---------------------------------------------------------------------------

  /**
   * @deprecated Use listBidsByProject() instead. Kept for components not yet migrated.
   */
  async listBidsByRequest(requestId: string): Promise<Bid[]> {
    const gqlOptions: GqlQueryOptions = {
      filters: { engagementId: `.eq.${requestId}` },
      pageSize: 100,
    };

    const result = await this.graphqlRead.query<GqlBidResponse>(
      'Bid',
      this.scalarBidFields,
      gqlOptions,
    );

    return result.items.map(gql => mapGqlToNeon<Bid>(gql, BID_FIELD_MAPPING.gqlToNeon));
  }

  // ---------------------------------------------------------------------------
  // Single bid operations
  // ---------------------------------------------------------------------------

  /**
   * Fetch a single bid by ID.
   */
  async getBid(id: string): Promise<Bid | null> {
    // Check write-through cache first (avoids GQL round-trip on rapid edits)
    const cached = this.pipelineWrite.getCached('Bid', id);
    if (cached) {
      return mapGqlToNeon<Bid>(cached, BID_FIELD_MAPPING.gqlToNeon);
    }

    const bid = await this.graphqlRead.getById<GqlBidResponse>(
      'Bid',
      id,
      this.scalarBidFields,
    );
    if (!bid) return null;

    this.pipelineWrite.seedCache('Bid', id, bid as unknown as Record<string, unknown>);
    return mapGqlToNeon<Bid>(bid, BID_FIELD_MAPPING.gqlToNeon);
  }

  // ---------------------------------------------------------------------------
  // Create / Submit
  // ---------------------------------------------------------------------------

  /**
   * Submit a new bid (simple flow) with optimistic update.
   * Links bid to SmeMartProject via `project` link field.
   */
  async submitBid(data: {
    project_id: string;
    provider_id: string;
    cover_letter?: string;
    proposed_price?: string;
    proposed_timeline?: string;
  }): Promise<Bid> {
    const id = `bid-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const bid: Bid = {
      id,
      request_id: null, // Legacy — no longer used
      project_id: data.project_id,
      provider_id: data.provider_id,
      cover_letter: data.cover_letter || null,
      proposed_price: data.proposed_price || null,
      proposed_timeline: data.proposed_timeline || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.pushBid(bid);
    return bid;
  }

  /**
   * Create a draft bid for the wizard flow.
   * Links to SmeMartProject (the RFP).
   */
  async createDraft(projectId: string, providerId: string): Promise<Bid> {
    const id = `bid-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const bid: Bid = {
      id,
      request_id: null,
      project_id: projectId,
      provider_id: providerId,
      cover_letter: null,
      proposed_price: null,
      proposed_timeline: null,
      status: 'draft',
      wizard_step: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.pushBid(bid);
    return bid;
  }

  /**
   * Save wizard progress (partial update).
   * Flattens nested wizard_data to individual bid columns.
   */
  async saveDraft(id: string, wizardData: BidWizardData, step: number): Promise<Bid> {
    const current = await this.getBid(id);
    if (!current) throw new Error(`Bid ${id} not found`);

    const updated: Partial<Bid> = {
      wizard_data: wizardData as unknown as Record<string, unknown>,
      wizard_step: step,
      updated_at: new Date().toISOString(),
    };

    // Flatten approach fields
    if (wizardData.approach?.executive_summary !== undefined) {
      updated.executive_summary = wizardData.approach.executive_summary;
    }
    if (wizardData.approach?.cover_letter !== undefined) {
      updated.cover_letter = wizardData.approach.cover_letter;
    }

    // Flatten team fields
    if (wizardData.team?.team_description !== undefined) {
      updated.team_description = wizardData.team.team_description;
    }

    // Flatten pricing fields
    if (wizardData.pricing?.proposed_price !== undefined) {
      updated.proposed_price = wizardData.pricing.proposed_price;
    }
    if (wizardData.pricing?.proposed_timeline !== undefined) {
      updated.proposed_timeline = wizardData.pricing.proposed_timeline;
    }
    if (wizardData.pricing?.total_estimated_hours !== undefined) {
      updated.total_estimated_hours = wizardData.pricing.total_estimated_hours;
    }
    if (wizardData.pricing?.pricing_breakdown !== undefined) {
      updated.pricing_breakdown = wizardData.pricing.pricing_breakdown;
    }

    const merged: Bid = { ...current, ...updated } as Bid;
    this.pushBid(merged);
    return merged;
  }

  /**
   * Submit a draft bid (finalize): mark as pending, clear wizard_data.
   */
  async submitDraft(
    id: string,
    context?: { buyerId: string; rfpTitle: string },
    aiMetadata?: { ai_assisted: boolean; ai_model: string; ai_generated_at: string },
  ): Promise<Bid> {
    const current = await this.getBid(id);
    if (!current) throw new Error(`Bid ${id} not found`);

    const updated: Bid = {
      ...current,
      status: 'pending',
      wizard_data: null,
      ai_assisted: aiMetadata?.ai_assisted ?? null,
      ai_model: aiMetadata?.ai_model ?? null,
      ai_generated_at: aiMetadata?.ai_generated_at ?? null,
      updated_at: new Date().toISOString(),
    };

    this.pushBid(updated);

    // Fire-and-forget notification
    const resourceId = updated.project_id || updated.request_id;
    if (context && resourceId) {
      this.notifications.create({
        recipient_id: context.buyerId,
        type: 'bid_received',
        severity: 'medium',
        title: 'New bid received',
        description: `A new bid was submitted on "${context.rfpTitle}".`,
        resource_id: resourceId,
        resource_type: 'rfp',
        payload: { parent_id: resourceId },
      }).catch(() => {});
    }

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Status transitions
  // ---------------------------------------------------------------------------

  async acceptBid(id: string): Promise<Bid> {
    return this.updateBidStatus(id, 'accepted');
  }

  async rejectBid(id: string, context?: { providerId: string; rfpTitle: string }): Promise<Bid> {
    const bid = await this.updateBidStatus(id, 'rejected');

    const resourceId = bid.project_id || bid.request_id;
    if (context && resourceId) {
      this.notifications.create({
        recipient_id: context.providerId,
        type: 'bid_rejected',
        severity: 'info',
        title: 'Your bid was not selected',
        description: `Your bid on "${context.rfpTitle}" was not selected.`,
        resource_id: resourceId,
        resource_type: 'rfp',
        payload: { parent_id: resourceId },
      }).catch(() => {});
    }

    return bid;
  }

  async withdrawBid(id: string): Promise<Bid> {
    return this.updateBidStatus(id, 'withdrawn');
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private async updateBidStatus(id: string, status: string): Promise<Bid> {
    const current = await this.getBid(id);
    if (!current) throw new Error(`Bid ${id} not found`);

    const updated: Bid = { ...current, status: status as Bid['status'], updated_at: new Date().toISOString() };
    this.pushBid(updated);
    return updated;
  }

  private pushBid(bid: Bid): void {
    const gqlData = mapNeonToGql<Record<string, unknown>>(bid, BID_FIELD_MAPPING.neonToGql);
    this.pipelineWrite.pushEntity('Bid', gqlData).catch(err => {
      console.error('[BidsService] Failed to push bid:', err);
    });
  }

  /**
   * Flatten GQL link field { project: { id: "..." } } → project_id
   * then map to Neon model.
   */
  private flattenAndMap(gql: Record<string, unknown>): Bid {
    const flat = { ...gql };
    if (flat['project'] && typeof flat['project'] === 'object') {
      flat['project'] = (flat['project'] as Record<string, unknown>)['id'];
    }
    return mapGqlToNeon<Bid>(flat as any, BID_FIELD_MAPPING.gqlToNeon);
  }

  private toBidSummary(bid: Bid): BidSummaryRow {
    return {
      ...bid,
      rfp_title: null,
      category: null,
      budget_type: null,
      budget_min: null,
      budget_max: null,
      total_responses: 0,
      met_count: 0,
      partial_count: 0,
      not_met_count: 0,
      na_count: 0,
      planned_count: 0,
      sum_estimated_hours: bid.total_estimated_hours ?? 0,
      sum_estimated_cost: 0,
      provider_display_name: null,
      provider_headline: null,
      provider_rating: null,
    };
  }
}
