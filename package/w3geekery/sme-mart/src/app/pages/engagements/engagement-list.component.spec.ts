import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { EngagementList } from './engagement-list.component';
import { WorkRequestsService } from '../../core/services/work-requests.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { makeEngagementSummaryRow } from '../../test-helpers/factories';

describe('EngagementList', () => {
  let component: EngagementList;
  let mockWorkRequests: {
    listEngagements: ReturnType<typeof vi.fn>;
    loading: { (): boolean; set: ReturnType<typeof vi.fn> };
  };
  let mockProviderProfiles: { getProviderByUserId: ReturnType<typeof vi.fn> };
  let mockImpersonation: { effectiveUserId: ReturnType<typeof vi.fn> };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  const rfp = makeEngagementSummaryRow();
  const engagement = makeEngagementSummaryRow({
    id: 'wr-002',
    title: 'Active Engagement',
    status: 'in_progress',
    engagement_tag: 'sme-mart.eng.amber-circuit',
    accepted_provider_id: 'prov-001',
    created_at: '2026-03-01T00:00:00Z',
    budget_max: '20000',
  });
  const draftRfp = makeEngagementSummaryRow({
    id: 'wr-003',
    title: 'Draft RFP',
    status: 'draft',
    created_at: '2026-01-01T00:00:00Z',
    budget_max: '5000',
  });

  beforeEach(() => {
    mockWorkRequests = {
      listEngagements: vi.fn().mockResolvedValue({ items: [rfp, engagement, draftRfp] }),
      loading: Object.assign(vi.fn().mockReturnValue(false), { set: vi.fn() }),
    };
    mockProviderProfiles = {
      getProviderByUserId: vi.fn().mockResolvedValue(null),
    };
    mockImpersonation = {
      effectiveUserId: vi.fn().mockReturnValue('u-100'),
    };
    mockRouter = { navigate: vi.fn() };
    mockDialog = {
      open: vi.fn().mockReturnValue({ afterClosed: () => ({ subscribe: vi.fn() }) }),
    };

    TestBed.configureTestingModule({
      imports: [EngagementList],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: WorkRequestsService, useValue: mockWorkRequests },
        { provide: ProviderProfilesService, useValue: mockProviderProfiles },
        { provide: ImpersonationService, useValue: mockImpersonation },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ZerobiasClientApi, useValue: {} },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: {} } },
        },
      ],
    });

    const fixture = TestBed.createComponent(EngagementList);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // loadData
  // ---------------------------------------------------------------------------

  describe('loadData', () => {
    it('should load all engagements', async () => {
      await component.loadData();
      expect(component.engagements()).toHaveLength(3);
    });

    it('should handle errors', async () => {
      mockWorkRequests.listEngagements.mockRejectedValue(new Error('fail'));
      await component.loadData();
      expect(component.engagements()).toEqual([]);
    });

    it('should load current provider', async () => {
      mockProviderProfiles.getProviderByUserId.mockResolvedValue({ id: 'prov-001' });
      await component.loadData();
      expect(component.currentProviderId()).toBe('prov-001');
    });
  });

  // ---------------------------------------------------------------------------
  // filteredEngagements
  // ---------------------------------------------------------------------------

  describe('filteredEngagements', () => {
    beforeEach(async () => {
      await component.loadData();
    });

    it('should return all with no filters', () => {
      expect(component.filteredEngagements()).toHaveLength(3);
    });

    it('should filter by lifecycle: rfp only', () => {
      component.lifecycleFilter.set('rfp');
      const result = component.filteredEngagements();
      expect(result.every(e => !e.engagement_tag)).toBe(true);
    });

    it('should filter by lifecycle: engagement only', () => {
      component.lifecycleFilter.set('engagement');
      const result = component.filteredEngagements();
      expect(result.every(e => !!e.engagement_tag)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('should filter by search term in title', () => {
      component.searchTerm.set('hipaa');
      expect(component.filteredEngagements()).toHaveLength(1);
    });

    it('should filter by search term in engagement_tag', () => {
      component.searchTerm.set('amber-circuit');
      expect(component.filteredEngagements()).toHaveLength(1);
    });

    it('should filter by status', () => {
      component.statusFilter.set('draft');
      expect(component.filteredEngagements()).toHaveLength(1);
    });

    it('should filter my bids only', async () => {
      component.currentProviderId.set('prov-001');
      component.myBidsOnly.set(true);
      const result = component.filteredEngagements();
      expect(result).toHaveLength(1);
      expect(result[0].accepted_provider_id).toBe('prov-001');
    });

    it('should sort by newest first', () => {
      component.sortBy.set('newest');
      const result = component.filteredEngagements();
      expect(result[0].id).toBe('wr-002'); // March
    });

    it('should sort by budget high to low', () => {
      component.sortBy.set('budget_high');
      const result = component.filteredEngagements();
      expect(result[0].budget_max).toBe('20000');
    });
  });

  // ---------------------------------------------------------------------------
  // toggleMyBids
  // ---------------------------------------------------------------------------

  describe('toggleMyBids', () => {
    it('should toggle myBidsOnly signal', () => {
      expect(component.myBidsOnly()).toBe(false);
      component.toggleMyBids();
      expect(component.myBidsOnly()).toBe(true);
      component.toggleMyBids();
      expect(component.myBidsOnly()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // openNewRfpDialog
  // ---------------------------------------------------------------------------

  describe('openNewRfpDialog', () => {
    it('should open dialog', () => {
      component.openNewRfpDialog();
      expect(mockDialog.open).toHaveBeenCalled();
    });
  });
});
