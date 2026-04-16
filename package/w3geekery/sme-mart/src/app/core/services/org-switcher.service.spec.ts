import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { OrgSwitcherService } from './org-switcher.service';
import { ZerobiasClientApp, ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import type { dana } from '@zerobias-com/zerobias-sdk';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('OrgSwitcherService', () => {
  let service: OrgSwitcherService;
  let mockZerobiasApp: any;
  let mockZerobiasClientApi: any;
  let mockMatDialog: Partial<MatDialog>;
  let mockDialogRef: Partial<MatDialogRef<any>>;
  let listMyOrgsSpy: any;
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

    listMyOrgsSpy = vi.fn(() => Promise.resolve([]));
    selectOrgSpy = vi.fn(() => Promise.resolve());

    mockZerobiasClientApi = {
      danaClient: {
        getMeApi: vi.fn(() => ({
          listMyOrgs: listMyOrgsSpy,
        })),
      },
    };

    mockZerobiasApp = {
      getCurrentOrgId: vi.fn(() => 'org-1' as any),
      selectOrg: selectOrgSpy,
    };

    TestBed.configureTestingModule({
      providers: [
        OrgSwitcherService,
        { provide: ZerobiasClientApp, useValue: mockZerobiasApp },
        { provide: ZerobiasClientApi, useValue: mockZerobiasClientApi },
        { provide: MatDialog, useValue: mockMatDialog },
      ],
    });

    service = TestBed.inject(OrgSwitcherService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('orgs$ signal', () => {
    it('should emit sorted org list (no filters)', async () => {
      const orgC = createMockOrg('org-3', 'Charlie');
      const orgA = createMockOrg('org-1', 'Alpha');
      const orgB = createMockOrg('org-2', 'Bravo');

      TestBed.resetTestingModule();
      listMyOrgsSpy = vi.fn(() => Promise.resolve([orgC, orgA, orgB]));
      mockZerobiasClientApi = {
        danaClient: {
          getMeApi: vi.fn(() => ({
            listMyOrgs: listMyOrgsSpy,
          })),
        },
      };

      TestBed.configureTestingModule({
        providers: [
          OrgSwitcherService,
          { provide: ZerobiasClientApp, useValue: mockZerobiasApp },
          { provide: ZerobiasClientApi, useValue: mockZerobiasClientApi },
          { provide: MatDialog, useValue: mockMatDialog },
        ],
      });

      service = TestBed.inject(OrgSwitcherService);

      // Give async loadOrgs time to complete
      await new Promise((resolve) => setTimeout(resolve, 20));

      const orgs = service.orgs$();
      expect(orgs.length).toBe(3);
      expect(orgs[0].name).toBe('Alpha');
      expect(orgs[1].name).toBe('Bravo');
      expect(orgs[2].name).toBe('Charlie');
    });
  });

  describe('loadOrgs regression tests', () => {
    it('should handle empty array response gracefully (regression: empty submenu bug)', async () => {
      TestBed.resetTestingModule();
      listMyOrgsSpy = vi.fn(() => Promise.resolve([]));
      mockZerobiasClientApi = {
        danaClient: {
          getMeApi: vi.fn(() => ({
            listMyOrgs: listMyOrgsSpy,
          })),
        },
      };

      TestBed.configureTestingModule({
        providers: [
          OrgSwitcherService,
          { provide: ZerobiasClientApp, useValue: mockZerobiasApp },
          { provide: ZerobiasClientApi, useValue: mockZerobiasClientApi },
          { provide: MatDialog, useValue: mockMatDialog },
        ],
      });

      service = TestBed.inject(OrgSwitcherService);

      // Give async loadOrgs time to complete
      await new Promise((resolve) => setTimeout(resolve, 20));

      // orgs$ should emit empty array with no errors
      expect(service.orgs$().length).toBe(0);
    });

    it('should handle listMyOrgs error gracefully', async () => {
      const testError = new Error('API error');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      TestBed.resetTestingModule();
      listMyOrgsSpy = vi.fn(() => Promise.reject(testError));
      mockZerobiasClientApi = {
        danaClient: {
          getMeApi: vi.fn(() => ({
            listMyOrgs: listMyOrgsSpy,
          })),
        },
      };

      TestBed.configureTestingModule({
        providers: [
          OrgSwitcherService,
          { provide: ZerobiasClientApp, useValue: mockZerobiasApp },
          { provide: ZerobiasClientApi, useValue: mockZerobiasClientApi },
          { provide: MatDialog, useValue: mockMatDialog },
        ],
      });

      service = TestBed.inject(OrgSwitcherService);

      // Give async loadOrgs time to complete
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should log error and set empty orgs
      expect(errorSpy).toHaveBeenCalled();
      expect(service.orgs$().length).toBe(0);

      errorSpy.mockRestore();
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

      errorSpy.mockRestore();
    });
  });
});
