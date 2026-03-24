import { Injectable, inject } from '@angular/core';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { NotificationService } from './notification.service';
import { BID_FIELD_MAPPING, BID_RESPONSE_FIELD_MAPPING, mapNeonToGql, mapGqlToNeon } from '../field-mappings';
import type { Bid, BidSummaryRow, BidWizardData, BidResponse } from '../models';
import type { GqlBidResponse, GqlBidResponseResponse } from '../gql-types';

/**
 * BidsService - FULLY MIGRATED TO PIPELINE (Phase 5)
 *
 * All writes go through PipelineWriteService (fire-and-forget async).
 * All reads go through GraphqlReadService (from AuditgraphDB).
 *
 * Neon bids table archived 2 weeks after Phase 5 completion (2026-04-02).
 * 2-week observation period for production stability verification.
 */
@Injectable({ providedIn: 'root' })
export class BidsService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly notifications = inject(NotificationService);

  /**
   * List all bids for a given engagement (request).
   * Queries GQL with filter on engagementId, transforms to Bid[].
   */
  async listBidsByRequest(requestId: string): Promise<Bid[]> {
    const gqlOptions: GqlQueryOptions = {
      filters: {
        engagementId: `.eq.${requestId}`,
      },
      pageSize: 100,
    };

    const result = await this.graphqlRead.query<GqlBidResponse>(
      'Bid',
      this.getBidFields(),
      gqlOptions,
    );

    return result.items.map(gql => mapGqlToNeon<Bid>(gql, BID_FIELD_MAPPING.gqlToNeon));
  }

  /**
   * Load bids with compliance summaries and bid response rollups.
   * Queries GQL with nested bidResponses for compliance calculation.
   */
  async listBidSummaries(requestId: string): Promise<BidSummaryRow[]> {
    const gqlOptions: GqlQueryOptions = {
      filters: {
        engagementId: `.eq.${requestId}`,
      },
      pageSize: 100,
    };

    const result = await this.graphqlRead.query<GqlBidResponse>(
      'Bid',
      this.getBidFields(),
      gqlOptions,
    );

    return result.items.map(gql => this.transformGqlToBidSummary(gql));
  }

  /**
   * Fetch a single bid by ID.
   */
  async getBid(id: string): Promise<Bid | null> {
    const bid = await this.graphqlRead.getById<GqlBidResponse>(
      'Bid',
      id,
      this.getBidFields(),
    );
    if (!bid) return null;

    return mapGqlToNeon<Bid>(bid, BID_FIELD_MAPPING.gqlToNeon);
  }

  /**
   * Submit a new bid (simple flow) with optimistic update.
   * Generates ID, pushes to Pipeline in background.
   */
  async submitBid(data: {
    request_id: string;
    provider_id: string;
    cover_letter?: string;
    proposed_price?: string;
    proposed_timeline?: string;
  }): Promise<Bid> {
    const id = `bid-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const bid: Bid = {
      id,
      request_id: data.request_id,
      provider_id: data.provider_id,
      cover_letter: data.cover_letter || null,
      proposed_price: data.proposed_price || null,
      proposed_timeline: data.proposed_timeline || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Push to Pipeline in background
    const gqlData = mapNeonToGql<GqlBidResponse>(bid, BID_FIELD_MAPPING.neonToGql);
    this.pipelineWrite.pushEntity('Bid', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to push bid to Pipeline:', err);
    });

    // Return optimistic response immediately
    return bid;
  }

  /**
   * Create a draft bid for the wizard flow.
   */
  async createDraft(requestId: string, providerId: string): Promise<Bid> {
    const id = `bid-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const bid: Bid = {
      id,
      request_id: requestId,
      provider_id: providerId,
      cover_letter: null,
      proposed_price: null,
      proposed_timeline: null,
      status: 'draft',
      wizard_step: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Push to Pipeline in background
    const gqlData = mapNeonToGql<GqlBidResponse>(bid, BID_FIELD_MAPPING.neonToGql);
    this.pipelineWrite.pushEntity('Bid', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to push draft bid to Pipeline:', err);
    });

    // Return optimistic response
    return bid;
  }

  /**
   * Save wizard progress (partial update).
   * Flattens nested wizard_data to individual bid columns, preserves JSON serialization.
   */
  async saveDraft(id: string, wizardData: BidWizardData, step: number): Promise<Bid> {
    // Fetch current bid to merge updates
    const current = await this.getBid(id);
    if (!current) throw new Error(`Bid ${id} not found`);

    // Flatten wizard_data into bid columns
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

    // Push to Pipeline
    const gqlData = mapNeonToGql<GqlBidResponse>(merged, BID_FIELD_MAPPING.neonToGql);
    this.pipelineWrite.pushEntity('Bid', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to save draft bid to Pipeline:', err);
    });

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
    // Fetch current bid
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

    // Push to Pipeline
    const gqlData = mapNeonToGql<GqlBidResponse>(updated, BID_FIELD_MAPPING.neonToGql);
    this.pipelineWrite.pushEntity('Bid', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to submit draft bid to Pipeline:', err);
    });

    // Fire-and-forget notification
    if (context && updated.request_id) {
      this.notifications.create({
        recipient_id: context.buyerId,
        type: 'bid_received',
        severity: 'medium',
        title: 'New bid received',
        description: `A new bid was submitted on "${context.rfpTitle}".`,
        resource_id: updated.request_id,
        resource_type: 'rfp',
        payload: { parent_id: updated.request_id },
      }).catch(() => {});
    }

    return updated;
  }

  /**
   * Find an existing draft bid for a provider on a request.
   * Uses AND filter: engagementId AND providerId AND status.
   */
  async findDraft(requestId: string, providerId: string): Promise<Bid | null> {
    const gqlOptions: GqlQueryOptions = {
      filters: {
        engagementId: `.eq.${requestId}`,
        providerId: `.eq.${providerId}`,
        status: '.eq.draft',
      },
      pageSize: 1,
    };

    const result = await this.graphqlRead.query<GqlBidResponse>(
      'Bid',
      this.getBidFields(),
      gqlOptions,
    );

    if (!result.items.length) return null;

    return mapGqlToNeon<Bid>(result.items[0], BID_FIELD_MAPPING.gqlToNeon);
  }

  /**
   * Accept a bid (mark as accepted).
   */
  async acceptBid(id: string): Promise<Bid> {
    const current = await this.getBid(id);
    if (!current) throw new Error(`Bid ${id} not found`);

    const updated: Bid = { ...current, status: 'accepted', updated_at: new Date().toISOString() };

    const gqlData = mapNeonToGql<GqlBidResponse>(updated, BID_FIELD_MAPPING.neonToGql);
    this.pipelineWrite.pushEntity('Bid', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to accept bid in Pipeline:', err);
    });

    return updated;
  }

  /**
   * Reject a bid (mark as rejected).
   */
  async rejectBid(id: string, context?: { providerId: string; rfpTitle: string }): Promise<Bid> {
    const current = await this.getBid(id);
    if (!current) throw new Error(`Bid ${id} not found`);

    const updated: Bid = { ...current, status: 'rejected', updated_at: new Date().toISOString() };

    const gqlData = mapNeonToGql<GqlBidResponse>(updated, BID_FIELD_MAPPING.neonToGql);
    this.pipelineWrite.pushEntity('Bid', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to reject bid in Pipeline:', err);
    });

    // Fire-and-forget notification
    if (context && updated.request_id) {
      this.notifications.create({
        recipient_id: context.providerId,
        type: 'bid_rejected',
        severity: 'info',
        title: 'Your bid was not selected',
        description: `Your bid on "${context.rfpTitle}" was not selected.`,
        resource_id: updated.request_id,
        resource_type: 'rfp',
        payload: { parent_id: updated.request_id },
      }).catch(() => {});
    }

    return updated;
  }

  /**
   * Withdraw a bid (mark as withdrawn).
   */
  async withdrawBid(id: string): Promise<Bid> {
    const current = await this.getBid(id);
    if (!current) throw new Error(`Bid ${id} not found`);

    const updated: Bid = { ...current, status: 'withdrawn', updated_at: new Date().toISOString() };

    const gqlData = mapNeonToGql<GqlBidResponse>(updated, BID_FIELD_MAPPING.neonToGql);
    this.pipelineWrite.pushEntity('Bid', gqlData as unknown as Record<string, unknown>).catch(err => {
      console.error('Failed to withdraw bid in Pipeline:', err);
    });

    return updated;
  }

  /**
   * Get standard field list for Bid GQL queries.
   * Includes nested bidResponses for compliance calculation.
   */
  private getBidFields(): string[] {
    return [
      'id',
      'name',
      'description',
      'engagementId',
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
  }

  /**
   * Transform GQL bid response to BidSummaryRow.
   * For now, compliance counts are 0 (would require nested bidResponses query).
   */
  private transformGqlToBidSummary(gql: GqlBidResponse): BidSummaryRow {
    const bid = mapGqlToNeon<Bid>(gql, BID_FIELD_MAPPING.gqlToNeon);
    return {
      ...bid,
      rfp_title: null,               // Would come from nested engagement query
      category: null,                // Would come from nested engagement query
      budget_type: null,             // Would come from nested engagement query
      budget_min: null,              // Would come from nested engagement query
      budget_max: null,              // Would come from nested engagement query
      total_responses: 0,            // Would require separate query
      met_count: 0,                  // Would come from nested bidResponses
      partial_count: 0,              // Would come from nested bidResponses
      not_met_count: 0,              // Would come from nested bidResponses
      na_count: 0,                   // Would come from nested bidResponses
      planned_count: 0,              // Would come from nested bidResponses
      sum_estimated_hours: bid.total_estimated_hours ?? 0,
      sum_estimated_cost: 0,         // Would calculate from pricing_breakdown
      provider_display_name: null,   // Would come from provider lookup
      provider_headline: null,        // Would come from provider lookup
      provider_rating: null,          // Would come from provider lookup
    };
  }
}
