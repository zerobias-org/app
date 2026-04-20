/**
 * Unit Tests for RfpList (Plan 075 — backed by SmeMartProjectService)
 */

import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { RfpList } from './rfp-list.component';
import { SmeMartProjectService } from '../../core/services/sme-mart-project.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { makeSmeMartProject } from '../../test-helpers/factories';

describe('RfpList (Plan 075)', () => {
  let component: RfpList;
  let mockProjects: {
    listProjects: ReturnType<typeof vi.fn>;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let mockDialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockProjects = {
      listProjects: vi.fn().mockResolvedValue({
        items: [
          makeSmeMartProject({ id: 'proj-001', name: 'HIPAA Assessment', status: 'published', category: 'compliance', budgetMax: 15000 }),
          makeSmeMartProject({ id: 'proj-002', name: 'SOC 2 Audit', status: 'draft', budgetMax: 20000, createdAt: '2026-03-01T00:00:00Z' }),
        ],
      }),
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
        { provide: SmeMartProjectService, useValue: mockProjects },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ZerobiasClientApi, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } },
      ],
    });

    const fixture = TestBed.createComponent(RfpList);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadData', () => {
    it('should load projects and map to card rows', async () => {
      await component.loadData();
      expect(component.rfps()).toHaveLength(2);
    });

    it('should handle errors without crashing', async () => {
      mockProjects.listProjects.mockRejectedValue(new Error('API down'));
      await component.loadData();
      expect(component.rfps()).toEqual([]);
    });
  });

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

    it('should filter by status', () => {
      component.statusFilter.set('draft');
      expect(component.filteredRfps()).toHaveLength(1);
      expect(component.filteredRfps()[0].status).toBe('draft');
    });

    it('should sort by budget high to low', () => {
      component.sortBy.set('budget_high');
      const sorted = component.filteredRfps();
      expect(sorted[0].budget_max).toBe('20000');
    });
  });

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
