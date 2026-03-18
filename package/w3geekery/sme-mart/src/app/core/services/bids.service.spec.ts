/**
 * Unit Tests for BidsService (Pipeline + GraphQL Migration)
 *
 * Tests verify service works with mocked PipelineWriteService and GraphqlReadService.
 * Covers bid CRUD, wizard flow, and engagement relationships.
 */

import { TestBed } from '@angular/core/testing';
import { BidsService } from './bids.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { NotificationService } from './notification.service';
import { BID_GQL_FIXTURE, BID_GQL_FIXTURE_DRAFT } from '../test-helpers/gql-fixtures';
import { fakePipelineWriteService, fakeGraphqlReadService } from '../test-helpers/angular';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('BidsService (Pipeline + GraphQL)', () => {
  let service: BidsService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;
  let notificationSpy: any;

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();
    notificationSpy = { create: vi.fn().mockResolvedValue(undefined) };

    TestBed.configureTestingModule({
      providers: [
        BidsService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: NotificationService, useValue: notificationSpy },
      ],
    });

    service = TestBed.inject(BidsService);
  });

  describe('listBidsByRequest()', () => {
    it('should query bids filtered by engagementId', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [BID_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 100, totalCount: 1 },
      });

      await service.listBidsByRequest('eng-001');

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'Bid',
        expect.any(Array),
        expect.objectContaining({
          filters: { engagementId: '.eq.eng-001' },
        }),
      );
    });

    it('should return array of Bids transformed from GQL', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [BID_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 100, totalCount: 1 },
      });

      const result = await service.listBidsByRequest('eng-001');

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('request_id');
      expect(result[0]).toHaveProperty('provider_id');
    });
  });

  describe('listBidSummaries()', () => {
    it('should query bids with compliance summary data', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [BID_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 100, totalCount: 1 },
      });

      await service.listBidSummaries('eng-001');

      expect(graphqlRead.query).toHaveBeenCalled();
    });

    it('should include BidSummaryRow fields (compliance counts, etc.)', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [BID_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 100, totalCount: 1 },
      });

      const result = await service.listBidSummaries('eng-001');

      expect(result[0]).toHaveProperty('total_responses');
      expect(result[0]).toHaveProperty('met_count');
      expect(result[0]).toHaveProperty('provider_display_name');
    });
  });

  describe('getBid()', () => {
    it('should fetch single bid by ID', async () => {
      graphqlRead.getById.mockResolvedValue(BID_GQL_FIXTURE);

      await service.getBid('bid-001');

      expect(graphqlRead.getById).toHaveBeenCalledWith('Bid', 'bid-001', expect.any(Array));
    });

    it('should return null when not found', async () => {
      graphqlRead.getById.mockResolvedValue(null);

      const result = await service.getBid('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('submitBid()', () => {
    it('should push bid to Pipeline and return optimistic Bid', async () => {
      const result = await service.submitBid({
        request_id: 'eng-001',
        provider_id: 'provider-001',
        cover_letter: 'Test letter',
        proposed_price: '5000',
      });

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'Bid',
        expect.objectContaining({
          cover_letter: 'Test letter',
        }),
      );
      expect(result).toHaveProperty('id');
      expect(result.status).toBe('pending');
    });
  });

  describe('createDraft()', () => {
    it('should create draft bid with wizard_step 0', async () => {
      const result = await service.createDraft('eng-001', 'provider-001');

      expect(pipelineWrite.pushEntity).toHaveBeenCalled();
      expect(result.status).toBe('draft');
      expect(result.wizard_step).toBe(0);
    });
  });

  describe('saveDraft()', () => {
    it('should fetch current bid, merge wizard data, and push updates', async () => {
      graphqlRead.getById.mockResolvedValue(BID_GQL_FIXTURE_DRAFT);

      const wizardData = {
        approach: { executive_summary: 'Summary' },
        pricing: { proposed_price: '7500' },
      };

      await service.saveDraft('bid-001', wizardData, 2);

      expect(graphqlRead.getById).toHaveBeenCalled();
      expect(pipelineWrite.pushEntity).toHaveBeenCalled();
    });

    it('should flatten nested wizard data to bid columns', async () => {
      graphqlRead.getById.mockResolvedValue(BID_GQL_FIXTURE_DRAFT);

      const wizardData = {
        approach: { executive_summary: 'Test summary' },
        team: { team_description: 'Test team' },
        pricing: {
          proposed_price: '5000',
          total_estimated_hours: 40,
        },
      };

      const result = await service.saveDraft('bid-001', wizardData, 2);

      expect(result.executive_summary).toBe('Test summary');
      expect(result.team_description).toBe('Test team');
      expect(result.proposed_price).toBe('5000');
      expect(result.total_estimated_hours).toBe(40);
    });

    it('should throw error if bid not found', async () => {
      graphqlRead.getById.mockResolvedValue(null);

      await expect(
        service.saveDraft('nonexistent', {}, 0),
      ).rejects.toThrow();
    });
  });

  describe('submitDraft()', () => {
    it('should mark bid as pending and clear wizard_data', async () => {
      graphqlRead.getById.mockResolvedValue(BID_GQL_FIXTURE_DRAFT);

      const result = await service.submitDraft('bid-001', {
        buyerId: 'user-001',
        rfpTitle: 'Test RFP',
      });

      expect(result.status).toBe('pending');
      expect(result.wizard_data).toBeNull();
    });

    it('should attach AI metadata if provided', async () => {
      graphqlRead.getById.mockResolvedValue(BID_GQL_FIXTURE_DRAFT);

      const result = await service.submitDraft('bid-001', undefined, {
        ai_assisted: true,
        ai_model: 'gpt-4',
        ai_generated_at: '2026-03-18T10:00:00Z',
      });

      expect(result.ai_assisted).toBe(true);
      expect(result.ai_model).toBe('gpt-4');
    });

    it('should create notification for buyer', async () => {
      graphqlRead.getById.mockResolvedValue(BID_GQL_FIXTURE_DRAFT);

      await service.submitDraft('bid-001', {
        buyerId: 'user-001',
        rfpTitle: 'Test RFP',
      });

      expect(notificationSpy.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bid_received',
          recipient_id: 'user-001',
        }),
      );
    });
  });

  describe('findDraft()', () => {
    it('should find draft bid by requestId and providerId', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [BID_GQL_FIXTURE_DRAFT],
        page: { pageNumber: 1, pageSize: 1, totalCount: 1 },
      });

      await service.findDraft('eng-001', 'provider-001');

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'Bid',
        expect.any(Array),
        expect.objectContaining({
          filters: expect.objectContaining({
            engagementId: '.eq.eng-001',
            providerId: '.eq.provider-001',
            status: '.eq.draft',
          }),
        }),
      );
    });

    it('should return null if no draft found', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 1, totalCount: 0 },
      });

      const result = await service.findDraft('eng-001', 'provider-001');

      expect(result).toBeNull();
    });
  });

  describe('Status transitions', () => {
    it('acceptBid() should mark bid as accepted', async () => {
      graphqlRead.getById.mockResolvedValue(BID_GQL_FIXTURE);

      const result = await service.acceptBid('bid-001');

      expect(result.status).toBe('accepted');
      expect(pipelineWrite.pushEntity).toHaveBeenCalled();
    });

    it('rejectBid() should mark bid as rejected and notify provider', async () => {
      graphqlRead.getById.mockResolvedValue(BID_GQL_FIXTURE);

      await service.rejectBid('bid-001', {
        providerId: 'provider-001',
        rfpTitle: 'Test RFP',
      });

      expect(notificationSpy.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bid_rejected',
          recipient_id: 'provider-001',
        }),
      );
    });

    it('withdrawBid() should mark bid as withdrawn', async () => {
      graphqlRead.getById.mockResolvedValue(BID_GQL_FIXTURE);

      const result = await service.withdrawBid('bid-001');

      expect(result.status).toBe('withdrawn');
    });
  });

  describe('Pipeline integration', () => {
    it('should handle Pipeline errors gracefully (fire-and-forget)', async () => {
      pipelineWrite.pushEntity.mockRejectedValue(new Error('Pipeline error'));

      await expect(
        service.submitBid({
          request_id: 'eng-001',
          provider_id: 'provider-001',
        }),
      ).resolves.toBeDefined();
    });

    it('should push to Pipeline for all write operations', async () => {
      graphqlRead.getById.mockResolvedValue(BID_GQL_FIXTURE);
      pipelineWrite.pushEntity.mockClear();

      await service.submitBid({ request_id: 'eng-001', provider_id: 'provider-001' });
      expect(pipelineWrite.pushEntity).toHaveBeenCalledTimes(1);

      await service.acceptBid('bid-001');
      expect(pipelineWrite.pushEntity).toHaveBeenCalledTimes(2);
    });
  });

  describe('No SmeMartDbService dependency', () => {
    it('should use only PipelineWriteService and GraphqlReadService', () => {
      expect(service['pipelineWrite']).toBeDefined();
      expect(service['graphqlRead']).toBeDefined();
    });
  });
});
