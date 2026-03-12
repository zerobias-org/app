import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { BidsService } from './bids.service';
import { SmeMartDbService } from './sme-mart-db.service';
import type { BidWizardData } from '../models';
import { makeBid } from '../../test-helpers/factories';
import { fakeSmeMartDb } from '../../test-helpers/angular';

describe('BidsService', () => {
  let service: BidsService;
  let mockDb: ReturnType<typeof fakeSmeMartDb>;

  beforeEach(() => {
    mockDb = fakeSmeMartDb();
    mockDb.searchRows.mockResolvedValue({ items: [makeBid()], totalCount: 1 });
    mockDb.getRow.mockResolvedValue(makeBid());
    mockDb.createRow.mockResolvedValue(makeBid());
    mockDb.updateRow.mockResolvedValue(makeBid({ status: 'accepted' }));

    TestBed.configureTestingModule({
      providers: [
        BidsService,
        { provide: SmeMartDbService, useValue: mockDb },
      ],
    });

    service = TestBed.inject(BidsService);
  });

  // ---------------------------------------------------------------------------
  // listBidsByRequest
  // ---------------------------------------------------------------------------

  describe('listBidsByRequest', () => {
    it('should search bids table with RFC4515 filter', async () => {
      await service.listBidsByRequest('wr-001');
      expect(mockDb.searchRows).toHaveBeenCalledWith(
        'bids',
        '(request_id=wr-001)',
        { pageSize: 100 },
      );
    });

    it('should return items array', async () => {
      const result = await service.listBidsByRequest('wr-001');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('bid-001');
    });

    it('should return empty array when items is undefined', async () => {
      mockDb.searchRows.mockResolvedValue({ items: undefined });
      const result = await service.listBidsByRequest('wr-001');
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // listBidSummaries
  // ---------------------------------------------------------------------------

  describe('listBidSummaries', () => {
    it('should query v_bid_summary view', async () => {
      await service.listBidSummaries('wr-002');
      expect(mockDb.searchRows).toHaveBeenCalledWith(
        'v_bid_summary',
        '(request_id=wr-002)',
        { pageSize: 100 },
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getBid
  // ---------------------------------------------------------------------------

  describe('getBid', () => {
    it('should fetch by id from bids table', async () => {
      const result = await service.getBid('bid-001');
      expect(mockDb.getRow).toHaveBeenCalledWith('bids', 'bid-001');
      expect(result?.id).toBe('bid-001');
    });
  });

  // ---------------------------------------------------------------------------
  // submitBid
  // ---------------------------------------------------------------------------

  describe('submitBid', () => {
    it('should create row with pending status', async () => {
      await service.submitBid({
        request_id: 'wr-001',
        provider_id: 'u-300',
        cover_letter: 'Ready.',
      });
      expect(mockDb.createRow).toHaveBeenCalledWith('bids', expect.objectContaining({
        request_id: 'wr-001',
        provider_id: 'u-300',
        cover_letter: 'Ready.',
        status: 'pending',
      }));
    });
  });

  // ---------------------------------------------------------------------------
  // createDraft
  // ---------------------------------------------------------------------------

  describe('createDraft', () => {
    it('should create row with draft status and wizard_step 0', async () => {
      await service.createDraft('wr-001', 'u-300');
      expect(mockDb.createRow).toHaveBeenCalledWith('bids', {
        request_id: 'wr-001',
        provider_id: 'u-300',
        status: 'draft',
        wizard_step: 0,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // saveDraft
  // ---------------------------------------------------------------------------

  describe('saveDraft', () => {
    it('should flatten approach fields onto bid columns', async () => {
      const wizardData: BidWizardData = {
        approach: {
          executive_summary: 'Our plan.',
          cover_letter: 'Dear buyer.',
        },
      };
      await service.saveDraft('bid-001', wizardData, 1);
      expect(mockDb.updateRow).toHaveBeenCalledWith('bids', 'bid-001', expect.objectContaining({
        wizard_step: 1,
        executive_summary: 'Our plan.',
        cover_letter: 'Dear buyer.',
      }));
    });

    it('should flatten team fields', async () => {
      const wizardData: BidWizardData = {
        team: { team_description: 'Senior consultants.' },
      };
      await service.saveDraft('bid-001', wizardData, 2);
      expect(mockDb.updateRow).toHaveBeenCalledWith('bids', 'bid-001', expect.objectContaining({
        team_description: 'Senior consultants.',
      }));
    });

    it('should flatten pricing fields and JSON-stringify breakdown', async () => {
      const breakdown = [{ taskType: 'Audit', estimatedHours: 40, estimatedCost: 4000 }];
      const wizardData: BidWizardData = {
        pricing: {
          proposed_price: '10000',
          proposed_timeline: '4 weeks',
          total_estimated_hours: 80,
          pricing_breakdown: breakdown,
        },
      };
      await service.saveDraft('bid-001', wizardData, 3);
      const call = mockDb.updateRow.mock.calls[0][2];
      expect(call.proposed_price).toBe('10000');
      expect(call.pricing_breakdown).toBe(JSON.stringify(breakdown));
    });

    it('should JSON-stringify wizard_data', async () => {
      const wizardData: BidWizardData = {};
      await service.saveDraft('bid-001', wizardData, 0);
      const call = mockDb.updateRow.mock.calls[0][2];
      expect(call.wizard_data).toBe(JSON.stringify(wizardData));
    });
  });

  // ---------------------------------------------------------------------------
  // submitDraft
  // ---------------------------------------------------------------------------

  describe('submitDraft', () => {
    it('should set status to pending and clear wizard_data', async () => {
      await service.submitDraft('bid-001');
      expect(mockDb.updateRow).toHaveBeenCalledWith('bids', 'bid-001', {
        status: 'pending',
        wizard_data: null,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // findDraft
  // ---------------------------------------------------------------------------

  describe('findDraft', () => {
    it('should search with compound RFC4515 filter', async () => {
      mockDb.searchRows.mockResolvedValue({ items: [makeBid({ status: 'draft' })] });
      const result = await service.findDraft('wr-001', 'u-300');
      expect(mockDb.searchRows).toHaveBeenCalledWith(
        'bids',
        '(&(request_id=wr-001)(provider_id=u-300)(status=draft))',
        { pageSize: 1 },
      );
      expect(result?.status).toBe('draft');
    });

    it('should return null when no draft exists', async () => {
      mockDb.searchRows.mockResolvedValue({ items: [] });
      const result = await service.findDraft('wr-001', 'u-300');
      expect(result).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Status updates
  // ---------------------------------------------------------------------------

  describe('acceptBid', () => {
    it('should update status to accepted', async () => {
      await service.acceptBid('bid-001');
      expect(mockDb.updateRow).toHaveBeenCalledWith('bids', 'bid-001', { status: 'accepted' });
    });
  });

  describe('rejectBid', () => {
    it('should update status to rejected', async () => {
      await service.rejectBid('bid-001');
      expect(mockDb.updateRow).toHaveBeenCalledWith('bids', 'bid-001', { status: 'rejected' });
    });
  });

  describe('withdrawBid', () => {
    it('should update status to withdrawn', async () => {
      await service.withdrawBid('bid-001');
      expect(mockDb.updateRow).toHaveBeenCalledWith('bids', 'bid-001', { status: 'withdrawn' });
    });
  });
});
