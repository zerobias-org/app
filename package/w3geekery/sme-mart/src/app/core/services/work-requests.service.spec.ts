import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { WorkRequestsService } from './work-requests.service';
import { SmeMartDbService } from './sme-mart-db.service';
import { NotificationService } from './notification.service';
import { makeEngagementSummaryRow, makeWorkRequest } from '../../test-helpers/factories';
import { fakeSmeMartDb, fakeNotificationService } from '../../test-helpers/angular';

describe('WorkRequestsService', () => {
  let service: WorkRequestsService;
  let mockDb: ReturnType<typeof fakeSmeMartDb>;

  beforeEach(() => {
    mockDb = fakeSmeMartDb();
    mockDb.listRows.mockResolvedValue({ items: [makeEngagementSummaryRow()], totalCount: 1 });
    mockDb.searchRows.mockResolvedValue({ items: [makeEngagementSummaryRow()], totalCount: 1 });
    mockDb.getRow.mockResolvedValue(makeWorkRequest());
    mockDb.createRow.mockResolvedValue(makeWorkRequest());
    mockDb.updateRow.mockResolvedValue(makeWorkRequest({ status: 'in_progress' }));

    TestBed.configureTestingModule({
      providers: [
        WorkRequestsService,
        { provide: SmeMartDbService, useValue: mockDb },
        { provide: NotificationService, useValue: fakeNotificationService() },
      ],
    });

    service = TestBed.inject(WorkRequestsService);
  });

  // ---------------------------------------------------------------------------
  // listEngagements
  // ---------------------------------------------------------------------------

  describe('listEngagements', () => {
    it('should call listRows on v_engagement_summary', async () => {
      const result = await service.listEngagements();
      expect(mockDb.listRows).toHaveBeenCalledWith(
        'v_engagement_summary',
        undefined,
      );
      expect(result.items).toHaveLength(1);
    });

    it('should update engagements signal', async () => {
      await service.listEngagements();
      expect(service.engagements()).toHaveLength(1);
    });

    it('should toggle loading signal', async () => {
      const promise = service.listEngagements();
      expect(service.loading()).toBe(true);
      await promise;
      expect(service.loading()).toBe(false);
    });

    it('should handle errors and reset loading', async () => {
      mockDb.listRows.mockRejectedValue(new Error('fail'));
      await expect(service.listEngagements()).rejects.toThrow();
      expect(service.loading()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // searchEngagements
  // ---------------------------------------------------------------------------

  describe('searchEngagements', () => {
    it('should call searchRows on v_engagement_summary', async () => {
      await service.searchEngagements('(status=open)');
      expect(mockDb.searchRows).toHaveBeenCalledWith(
        'v_engagement_summary',
        '(status=open)',
        undefined,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getEngagement
  // ---------------------------------------------------------------------------

  describe('getEngagement', () => {
    it('should fetch from v_engagement_detail view', async () => {
      const result = await service.getEngagement('wr-001');
      expect(mockDb.getRow).toHaveBeenCalledWith('v_engagement_detail', 'wr-001');
      expect(result?.id).toBe('wr-001');
    });
  });

  // ---------------------------------------------------------------------------
  // getWorkRequest
  // ---------------------------------------------------------------------------

  describe('getWorkRequest', () => {
    it('should fetch from work_requests table', async () => {
      const result = await service.getWorkRequest('wr-001');
      expect(mockDb.getRow).toHaveBeenCalledWith('work_requests', 'wr-001');
      expect(result?.id).toBe('wr-001');
    });
  });

  // ---------------------------------------------------------------------------
  // createRfp
  // ---------------------------------------------------------------------------

  describe('createRfp', () => {
    it('should create with default status open', async () => {
      await service.createRfp({ title: 'New RFP' } as any);
      const body = mockDb.createRow.mock.calls[0][1];
      expect(body.status).toBe('open');
    });

    it('should allow explicit status', async () => {
      await service.createRfp({ title: 'New RFP', status: 'open' } as any);
      const body = mockDb.createRow.mock.calls[0][1];
      expect(body.status).toBe('open');
    });
  });

  // ---------------------------------------------------------------------------
  // updateRfp
  // ---------------------------------------------------------------------------

  describe('updateRfp', () => {
    it('should update work_requests row', async () => {
      await service.updateRfp('wr-001', { title: 'Updated' });
      expect(mockDb.updateRow).toHaveBeenCalledWith('work_requests', 'wr-001', { title: 'Updated' });
    });
  });

  // ---------------------------------------------------------------------------
  // graduateToEngagement
  // ---------------------------------------------------------------------------

  describe('graduateToEngagement', () => {
    it('should update with engagement_tag and in_progress status', async () => {
      await service.graduateToEngagement('wr-001', 'sme-mart.eng.amber-circuit', 'tag-uuid');
      expect(mockDb.updateRow).toHaveBeenCalledWith('work_requests', 'wr-001', expect.objectContaining({
        engagement_tag: 'sme-mart.eng.amber-circuit',
        zerobias_tag_id: 'tag-uuid',
        status: 'in_progress',
      }));
    });

    it('should handle null zerobias_tag_id', async () => {
      await service.graduateToEngagement('wr-001', 'sme-mart.eng.amber-circuit', null as any);
      const body = mockDb.updateRow.mock.calls[0][2];
      expect(body.zerobias_tag_id).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // cancelEngagement
  // ---------------------------------------------------------------------------

  describe('cancelEngagement', () => {
    it('should update status to cancelled', async () => {
      await service.cancelEngagement('wr-001');
      expect(mockDb.updateRow).toHaveBeenCalledWith('work_requests', 'wr-001', { status: 'cancelled' });
    });
  });

  // ---------------------------------------------------------------------------
  // completeEngagement
  // ---------------------------------------------------------------------------

  describe('completeEngagement', () => {
    it('should update status to completed', async () => {
      await service.completeEngagement('wr-001');
      expect(mockDb.updateRow).toHaveBeenCalledWith('work_requests', 'wr-001', { status: 'completed' });
    });
  });
});
