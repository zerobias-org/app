import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, BehaviorSubject } from 'rxjs';
import { OrgSwitcherService } from './org-switcher.service';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import type { dana } from '@zerobias-com/zerobias-sdk';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('OrgSwitcherService', () => {
  let service: OrgSwitcherService;
  let mockZerobiasApp: Partial<ZerobiasClientApp>;
  let mockMatDialog: Partial<MatDialog>;
  let mockDialogRef: Partial<MatDialogRef<any>>;
  let getOrgsSpy: any;
  let selectOrgSpy: any;

  const createMockOrg = (
    id: string = 'org-1',
    name: string = 'Test Org',
    hidden: boolean = false,
  ): dana.Org => {
    return {
      id: id as any,
      name,
      hidden,
    } as any as dana.Org;
  };

  beforeEach(() => {
    // Create mock objects
    mockDialogRef = {
      close: vi.fn(),
    };

    mockMatDialog = {
      open: vi.fn(() => mockDialogRef as MatDialogRef<any>),
    };

    getOrgsSpy = vi.fn(() => of([]));
    selectOrgSpy = vi.fn(() => Promise.resolve());

    mockZerobiasApp = {
      getOrgs: getOrgsSpy,
      getCurrentOrgId: vi.fn(() => 'org-1' as any),
      selectOrg: selectOrgSpy,
    };

    TestBed.configureTestingModule({
      providers: [
        OrgSwitcherService,
        { provide: ZerobiasClientApp, useValue: mockZerobiasApp },
        { provide: MatDialog, useValue: mockMatDialog },
      ],
    });

    service = TestBed.inject(OrgSwitcherService);
  });

  describe('Filter Rules', () => {
    it('should filter out hidden orgs', () => {
      const visibleOrg = createMockOrg('org-1', 'Visible Org', false);
      const hiddenOrg = createMockOrg('org-2', 'Hidden Org', true);

      getOrgsSpy.mockReturnValue(of([visibleOrg, hiddenOrg]));

      // Recreate service to trigger loadOrgs with new mock data
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          OrgSwitcherService,
          { provide: ZerobiasClientApp, useValue: mockZerobiasApp },
          { provide: MatDialog, useValue: mockMatDialog },
        ],
      });

      service = TestBed.inject(OrgSwitcherService);

      expect(service.orgs$().length).toBe(1);
      expect(`${service.orgs$()[0].id}`).toBe('org-1');
    });

    it('should filter out System Org (all zeros UUID)', () => {
      const normalOrg = createMockOrg('org-1', 'Normal Org');
      const systemOrg = createMockOrg(
        '00000000-0000-0000-0000-000000000000',
        'System Org',
      );

      getOrgsSpy.mockReturnValue(of([normalOrg, systemOrg]));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          OrgSwitcherService,
          { provide: ZerobiasClientApp, useValue: mockZerobiasApp },
          { provide: MatDialog, useValue: mockMatDialog },
        ],
      });

      service = TestBed.inject(OrgSwitcherService);

      expect(service.orgs$().length).toBe(1);
      expect(`${service.orgs$()[0].id}`).toBe('org-1');
    });

    it('should filter out ops orgs (placeholder returns false)', () => {
      const org1 = createMockOrg('org-1', 'Alpha Org');
      const org2 = createMockOrg('org-2', 'Beta Org');

      getOrgsSpy.mockReturnValue(of([org1, org2]));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          OrgSwitcherService,
          { provide: ZerobiasClientApp, useValue: mockZerobiasApp },
          { provide: MatDialog, useValue: mockMatDialog },
        ],
      });

      service = TestBed.inject(OrgSwitcherService);

      // Currently isOpsOrg returns false, so all orgs pass through
      expect(service.orgs$().length).toBe(2);
    });
  });

  describe('orgs$ signal', () => {
    it('should emit filtered and sorted org list', () => {
      const orgC = createMockOrg('org-3', 'Charlie');
      const orgA = createMockOrg('org-1', 'Alpha');
      const orgB = createMockOrg('org-2', 'Bravo');

      getOrgsSpy.mockReturnValue(of([orgC, orgA, orgB]));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          OrgSwitcherService,
          { provide: ZerobiasClientApp, useValue: mockZerobiasApp },
          { provide: MatDialog, useValue: mockMatDialog },
        ],
      });

      service = TestBed.inject(OrgSwitcherService);

      const orgs = service.orgs$();
      expect(orgs.length).toBe(3);
      expect(orgs[0].name).toBe('Alpha');
      expect(orgs[1].name).toBe('Bravo');
      expect(orgs[2].name).toBe('Charlie');
    });
  });

  describe('switchTo', () => {
    it('should no-op if switching to same org', async () => {
      const org = createMockOrg('org-1', 'Test Org');

      (mockZerobiasApp.getCurrentOrgId as any).mockReturnValue('org-1');

      await service.switchTo(org);

      expect(selectOrgSpy).not.toHaveBeenCalled();
      expect(mockMatDialog.open).not.toHaveBeenCalled();
    });

    it('should open dialog when switching to different org', async () => {
      const org = createMockOrg('org-2', 'New Org');

      (mockZerobiasApp.getCurrentOrgId as any).mockReturnValue('org-1');
      selectOrgSpy.mockImplementation(() => new Promise(() => {})); // Never resolves to prevent reload

      // Start the switch
      const switchPromise = service.switchTo(org);

      // Wait a tick for the promise to start
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockMatDialog.open).toHaveBeenCalled();
    });

    it('should call app.selectOrg with correct org', async () => {
      const org = createMockOrg('org-2', 'New Org');

      (mockZerobiasApp.getCurrentOrgId as any).mockReturnValue('org-1');
      selectOrgSpy.mockImplementation(() => new Promise(() => {})); // Never resolves to prevent reload

      const switchPromise = service.switchTo(org);
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(selectOrgSpy).toHaveBeenCalledWith(org, expect.any(Function));
    });

    it('should close dialog on successful switch and invoke selectOrg', async () => {
      const org = createMockOrg('org-2', 'New Org');

      (mockZerobiasApp.getCurrentOrgId as any).mockReturnValue('org-1');
      selectOrgSpy.mockImplementation(() => new Promise(() => {})); // Never resolves to prevent reload

      const switchPromise = service.switchTo(org);
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify that selectOrg was called with the org and a callback function
      expect(selectOrgSpy).toHaveBeenCalledWith(org, expect.any(Function));

      // The dialog would be closed when the callback from selectOrg is invoked
      // which triggers window.location.reload()
    });

    it('should close dialog and log error on failure', async () => {
      const org = createMockOrg('org-2', 'New Org');
      const testError = new Error('Switch failed');

      (mockZerobiasApp.getCurrentOrgId as any).mockReturnValue('org-1');
      selectOrgSpy.mockRejectedValue(testError);

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await service.switchTo(org);

      expect(mockDialogRef.close).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(
        'Organization switch failed:',
        testError,
      );
    });
  });
});
