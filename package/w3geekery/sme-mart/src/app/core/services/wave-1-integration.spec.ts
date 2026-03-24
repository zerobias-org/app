/**
 * Wave 1 Integration Test
 *
 * Simulates end-to-end flow: create engagement → submit bid → list bids.
 * Verifies both services work together via mocked Pipeline/GraphQL.
 */

import { TestBed } from '@angular/core/testing';
import { EngagementsService } from '../../core/services/engagements.service';
import { BidsService } from './bids.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { NotificationService } from './notification.service';
import { ENGAGEMENT_GQL_FIXTURE, BID_GQL_FIXTURE } from '../../test-helpers/gql-fixtures';
import { fakePipelineWriteService, fakeGraphqlReadService } from '../../test-helpers/angular';
import type { GqlBidResponse } from '../gql-types';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Wave 1 Integration: Engagement → Bid Flow', () => {
  let workRequestsService: EngagementsService;
  let bidsService: BidsService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;
  let notificationSpy: any;

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();
    notificationSpy = { create: vi.fn().mockResolvedValue(undefined) };

    TestBed.configureTestingModule({
      providers: [
        EngagementsService,
        BidsService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: NotificationService, useValue: notificationSpy },
      ],
    });

    workRequestsService = TestBed.inject(EngagementsService);
    bidsService = TestBed.inject(BidsService);
  });

  it('should complete wave 1 flow: create engagement → submit bid → list bids', async () => {
    // 1. Create engagement
    const createdEngagement = await workRequestsService.createRfp({
      buyer_zerobias_user_id: 'buyer-001',
      title: 'HIPAA Compliance Audit',
      category: 'compliance',
      budget_min: '10000',
      budget_max: '25000',
      status: 'open',
    });

    expect(createdEngagement).toBeDefined();
    expect(createdEngagement.id).toBeDefined();
    expect(createdEngagement.title).toBe('HIPAA Compliance Audit');
    expect(createdEngagement.status).toBe('open');

    // Verify notification sent
    expect(notificationSpy.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rfp_published',
        recipient_id: 'buyer-001',
      }),
    );

    // Verify Pipeline was called for write
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
      'Engagement',
      expect.objectContaining({
        name: 'HIPAA Compliance Audit',
        buyerZerobiasUserId: 'buyer-001',
      }),
    );

    // 2. Submit bid on engagement
    const submittedBid = await bidsService.submitBid({
      request_id: createdEngagement.id,
      provider_id: 'provider-001',
      cover_letter: 'We can help',
      proposed_price: '15000',
      proposed_timeline: '30 days',
    });

    expect(submittedBid).toBeDefined();
    expect(submittedBid.id).toBeDefined();
    expect(submittedBid.request_id).toBe(createdEngagement.id);
    expect(submittedBid.status).toBe('pending');

    // Verify Pipeline was called for bid write
    expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
      'Bid',
      expect.objectContaining({
        coverLetter: 'We can help',
      }),
    );

    // 3. List bids for engagement (GQL query)
    graphqlRead.query.mockResolvedValue({
      items: [
        {
          ...BID_GQL_FIXTURE,
          engagementId: createdEngagement.id,
          providerId: 'provider-001',
        },
      ],
      page: { pageNumber: 1, pageSize: 100, totalCount: 1 },
    });

    const bids = await bidsService.listBidsByRequest(createdEngagement.id);

    expect(bids.length).toBeGreaterThan(0);
    expect(bids[0].request_id).toBe(createdEngagement.id);
    expect(graphqlRead.query).toHaveBeenCalledWith(
      'Bid',
      expect.any(Array),
      expect.objectContaining({
        filters: { engagementId: `.eq.${createdEngagement.id}` },
      }),
    );

    // 4. Verify services coordinated correctly
    expect(pipelineWrite.pushEntity).toHaveBeenCalledTimes(2); // 1 engagement + 1 bid
  });

  it('should handle engagement lifecycle: publish → graduate → complete', async () => {
    // Create
    const engagement = await workRequestsService.createRfp({
      buyer_zerobias_user_id: 'buyer-001',
      title: 'Test',
      category: 'compliance',
    });

    graphqlRead.getById.mockResolvedValue(ENGAGEMENT_GQL_FIXTURE);

    // Graduate to in_progress
    const graduated = await workRequestsService.graduateToEngagement(
      engagement.id,
      'sme-mart.engagement.test',
      'tag-123',
    );
    expect(graduated.status).toBe('in_progress');

    // Complete
    const completed = await workRequestsService.completeEngagement(engagement.id);
    expect(completed.status).toBe('completed');

    // Verify Pipeline pushes
    expect(pipelineWrite.pushEntity).toHaveBeenCalledTimes(3); // create + graduate + complete
  });

  it('should handle bid wizard flow: draft → save → submit', async () => {
    // Create draft
    const draft = await bidsService.createDraft('eng-001', 'provider-001');
    expect(draft.status).toBe('draft');
    expect(draft.wizard_step).toBe(0);

    // Save progress
    const wizardData = {
      approach: { executive_summary: 'Summary' },
      pricing: { proposed_price: '7500', total_estimated_hours: 40 },
    };

    // Build GQL response for saveDraft mock (draft converted to GQL shape)
    const draftGql: GqlBidResponse = {
      id: draft.id,
      engagementId: draft.request_id!,
      providerId: draft.provider_id!,
      coverLetter: draft.cover_letter ?? undefined,
      proposedPrice: draft.proposed_price ?? undefined,
      proposedTimeline: draft.proposed_timeline ?? undefined,
      status: 'DRAFT',
      wizardStep: 0,
      createdAt: draft.created_at,
      updatedAt: draft.updated_at,
    };

    graphqlRead.getById.mockResolvedValue(draftGql);
    const saved = await bidsService.saveDraft(draft.id, wizardData, 2);
    expect(saved.wizard_step).toBe(2);
    expect(saved.proposed_price).toBe('7500');

    // Build GQL response for submitDraft mock (saved bid with pricing)
    const savedGql: GqlBidResponse = {
      ...draftGql,
      proposedPrice: '7500',
      totalEstimatedHours: 40,
      wizardData: wizardData as any,
      wizardStep: 2,
      updatedAt: new Date().toISOString(),
    };

    graphqlRead.getById.mockResolvedValue(savedGql);

    // Submit
    const submitted = await bidsService.submitDraft(draft.id, {
      buyerId: 'buyer-001',
      rfpTitle: 'Test RFP',
    });
    expect(submitted.status).toBe('pending');
    expect(submitted.wizard_data).toBeNull();

    // Verify notifications and pipeline
    expect(notificationSpy.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bid_received' }),
    );
    expect(pipelineWrite.pushEntity).toHaveBeenCalledTimes(3); // create + save + submit
  });
});
