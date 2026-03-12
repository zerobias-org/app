import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { RfpList } from './rfp-list.component';
import { WorkRequestsService } from '../../core/services/work-requests.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { makeEngagementSummaryRow } from '../../test-helpers/factories';

describe('RfpList', () => {
  let component: RfpList;
  let mockWorkRequests: {
    listEngagements: ReturnType<typeof vi.fn>;
    loading: { (): boolean; set: ReturnType<typeof vi.fn> };
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockWorkRequests = {
      listEngagements: vi.fn().mockResolvedValue({
        items: [
          makeEngagementSummaryRow(),
          makeEngagementSummaryRow({ id: 'wr-002', title: 'SOC 2 Audit', description: 'Type II readiness', status: 'draft', budget_max: '20000', created_at: '2026-03-01T00:00:00Z' }),
          makeEngagementSummaryRow({ id: 'eng-001', title: 'Active Engagement', engagement_tag: 'sme-mart.eng.amber-circuit' }),
        ],
      }),
      loading: Object.assign(vi.fn().mockReturnValue(false), { set: vi.fn() }),
    };
    mockRouter = { navigate: vi.fn() };
    mockDialog = {
      open: vi.fn().mockReturnValue({ afterClosed: () => ({ subscribe: vi.fn() }) }),
    };

    TestBed.configureTestingModule({
      imports: [RfpList],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: WorkRequestsService, useValue: mockWorkRequests },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ZerobiasClientApi, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: {} } },
        },
      ],
    });

    const fixture = TestBed.createComponent(RfpList);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // loadData
  // ---------------------------------------------------------------------------

  describe('loadData', () => {
    it('should load and filter to RFPs only (no engagement_tag)', async () => {
      await component.loadData();
      // Should exclude the one with engagement_tag
      expect(component.rfps()).toHaveLength(2);
      expect(component.rfps().every(r => !r.engagement_tag)).toBe(true);
    });

    it('should handle errors without crashing', async () => {
      mockWorkRequests.listEngagements.mockRejectedValue(new Error('API down'));
      await component.loadData();
      expect(component.rfps()).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // filteredRfps computed
  // ---------------------------------------------------------------------------

  describe('filteredRfps', () => {
    beforeEach(async () => {
      await component.loadData();
    });

    it('should return all RFPs with no filters', () => {
      expect(component.filteredRfps()).toHaveLength(2);
    });

    it('should filter by search term in title', () => {
      component.searchTerm.set('hipaa');
      expect(component.filteredRfps()).toHaveLength(1);
      expect(component.filteredRfps()[0].title).toBe('HIPAA Assessment');
    });

    it('should filter by search term in description', () => {
      component.searchTerm.set('compliance review');
      expect(component.filteredRfps()).toHaveLength(1);
    });

    it('should filter by status', () => {
      component.statusFilter.set('draft');
      expect(component.filteredRfps()).toHaveLength(1);
      expect(component.filteredRfps()[0].status).toBe('draft');
    });

    it('should sort by newest first (default)', () => {
      component.sortBy.set('newest');
      const sorted = component.filteredRfps();
      expect(sorted[0].id).toBe('wr-002'); // March > February
    });

    it('should sort by budget high to low', () => {
      component.sortBy.set('budget_high');
      const sorted = component.filteredRfps();
      expect(sorted[0].budget_max).toBe('20000');
    });
  });

  // ---------------------------------------------------------------------------
  // ngOnInit
  // ---------------------------------------------------------------------------

  describe('ngOnInit', () => {
    it('should pick up search term from query params', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [RfpList],
        providers: [
          provideNoopAnimations(),
          provideRouter([]),
          { provide: WorkRequestsService, useValue: mockWorkRequests },
          { provide: Router, useValue: mockRouter },
          { provide: MatDialog, useValue: mockDialog },
          { provide: ZerobiasClientApi, useValue: {} },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { queryParams: { q: 'SOC' } } },
          },
        ],
      });
      const fixture = TestBed.createComponent(RfpList);
      const comp = fixture.componentInstance;
      await comp.ngOnInit();
      expect(comp.searchTerm()).toBe('SOC');
    });
  });

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  describe('openWizard', () => {
    it('should navigate to /rfps/new', () => {
      component.openWizard();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/rfps/new']);
    });
  });

  describe('openNewRfpDialog', () => {
    it('should open RfpDialog', () => {
      component.openNewRfpDialog();
      expect(mockDialog.open).toHaveBeenCalled();
    });
  });
});
