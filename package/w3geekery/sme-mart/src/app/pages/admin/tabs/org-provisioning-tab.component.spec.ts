import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApp, ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { ZerobiasClientOrgIdService } from '@zerobias-com/zerobias-angular-client';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrgProvisioningTabComponent } from './org-provisioning-tab.component';
import { PlatformEngagementProvisioner } from '../../../core/services/platform-engagement-provisioner.service';

describe('OrgProvisioningTabComponent', () => {
  type Mock = ReturnType<typeof vi.fn>;
  let component: OrgProvisioningTabComponent;

  let app: { getOrgs: Mock; whoAmI: Mock; getCurrentOrgId: Mock };
  let clientApi: {
    toUUID: Mock;
    reconnectWithOrgId: Mock;
    danaClient: { getOrgApi: Mock };
    platformClient: { getPartyApi: Mock };
    hydraClient: { getGroupApi: Mock };
  };
  let provisioner: { isOrgProvisioned: Mock; ensurePlatformEngagement: Mock };
  let orgIdService: { setCurrrenOrgId: Mock; getCurrentOrgId: Mock };
  let snackBar: { open: Mock };

  let listPartiesMock: Mock;
  let getPartyMock: Mock;
  let listGroupMembersMock: Mock;
  let platformSelectOrgMock: Mock;

  const ORIGINAL_ORG = 'orig-org-1';
  const TARGET_ORG = 'target-org-2';
  const TARGET_ADMIN_GROUP = 'target-admin-group-9';
  const TARGET_ORG_PARTY = 'target-org-party';
  const TARGET_USER_PRINCIPAL = 'target-user-principal';
  const TARGET_USER_PARTY = 'target-user-party';

  beforeEach(() => {
    listPartiesMock = vi.fn();
    getPartyMock = vi.fn();
    listGroupMembersMock = vi.fn();
    platformSelectOrgMock = vi.fn().mockResolvedValue(undefined);

    app = {
      getOrgs: vi.fn().mockReturnValue(of([
        {
          id: TARGET_ORG,
          name: 'Target Org',
          slug: 'targetorg',
          adminGroupId: TARGET_ADMIN_GROUP,
        },
      ])),
      whoAmI: vi.fn().mockResolvedValue({ id: 'admin-running-recipe' }),
      getCurrentOrgId: vi.fn().mockReturnValue(ORIGINAL_ORG),
    };

    clientApi = {
      toUUID: vi.fn((id: string) => id),
      reconnectWithOrgId: vi.fn().mockResolvedValue(undefined),
      danaClient: {
        getOrgApi: vi.fn().mockReturnValue({
          selectOrg: platformSelectOrgMock,
        }),
      },
      platformClient: {
        getPartyApi: vi.fn().mockReturnValue({
          list: listPartiesMock,
          get: getPartyMock,
        }),
      },
      hydraClient: {
        getGroupApi: vi.fn().mockReturnValue({
          listGroupMembers: listGroupMembersMock,
        }),
      },
    };

    provisioner = {
      isOrgProvisioned: vi.fn().mockResolvedValue(false),
      ensurePlatformEngagement: vi.fn().mockResolvedValue({
        engagementId: 'eng-x',
        projectId: 'proj-x',
        created: true,
      }),
    };

    orgIdService = {
      setCurrrenOrgId: vi.fn(),
      getCurrentOrgId: vi.fn().mockReturnValue(ORIGINAL_ORG),
    };

    snackBar = { open: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        OrgProvisioningTabComponent,
        { provide: ZerobiasClientApp, useValue: app },
        { provide: ZerobiasClientApi, useValue: clientApi },
        { provide: ZerobiasClientOrgIdService, useValue: orgIdService },
        { provide: PlatformEngagementProvisioner, useValue: provisioner },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    component = TestBed.inject(OrgProvisioningTabComponent);
  });

  describe('loadOrgs', () => {
    it('captures slug and adminGroupId from each org row', async () => {
      await component.loadOrgs();
      const rows = component.rows();
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        id: TARGET_ORG,
        name: 'Target Org',
        slug: 'targetorg',
        adminGroupId: TARGET_ADMIN_GROUP,
        dryRunStatus: 'idle',
      });
    });

    it('passes slug to isOrgProvisioned probe', async () => {
      await component.loadOrgs();
      expect(provisioner.isOrgProvisioned).toHaveBeenCalledWith(
        TARGET_ORG,
        'Target Org',
        'targetorg',
      );
    });
  });

  describe('dryRun', () => {
    beforeEach(async () => {
      await component.loadOrgs();
      listPartiesMock.mockResolvedValue({
        items: [{ id: TARGET_ORG_PARTY, partyType: 'org' }],
      });
      listGroupMembersMock.mockResolvedValue({
        items: [
          { id: 'svc-acct-skip', type: 'SERVICE_ACCOUNT' },
          { id: TARGET_USER_PRINCIPAL, type: 'USER' },
        ],
      });
      getPartyMock.mockResolvedValue({ id: TARGET_USER_PARTY });
    });

    it('flips orgIdService to target before party lookups, restores after, no recipe call', async () => {
      const row = component.rows()[0];
      await component.dryRun(row);

      // The actual mechanism that flips server scope: sessionStorage via orgIdService.
      // First call sets target; last call restores original.
      expect(orgIdService.setCurrrenOrgId).toHaveBeenCalledWith(TARGET_ORG);
      const setOrgCalls = orgIdService.setCurrrenOrgId.mock.calls;
      expect(setOrgCalls[setOrgCalls.length - 1][0]).toBe(ORIGINAL_ORG);

      // setCurrrenOrgId(target) must fire BEFORE party.list (otherwise lookups land in old scope).
      const targetSwitchOrder = setOrgCalls.findIndex((c: unknown[]) => c[0] === TARGET_ORG);
      const targetSwitchInvocationOrder = orgIdService.setCurrrenOrgId.mock.invocationCallOrder[targetSwitchOrder];
      const listPartiesOrder = listPartiesMock.mock.invocationCallOrder[0];
      expect(targetSwitchInvocationOrder).toBeLessThan(listPartiesOrder);

      // Recipe NOT called on dry run.
      expect(provisioner.ensurePlatformEngagement).not.toHaveBeenCalled();

      const updated = component.rows()[0];
      expect(updated.dryRunStatus).toBe('success');
      expect(updated.dryRunReport).toEqual({
        orgPartyId: TARGET_ORG_PARTY,
        adminUserPrincipalId: TARGET_USER_PRINCIPAL,
        adminUserPartyId: TARGET_USER_PARTY,
      });
    });

    it('marks failed and snackbars when no org-party exists', async () => {
      listPartiesMock.mockResolvedValue({ items: [] });
      const row = component.rows()[0];
      await component.dryRun(row);

      const updated = component.rows()[0];
      expect(updated.dryRunStatus).toBe('failed');
      expect(updated.dryRunReport).toBeUndefined();
      expect(updated.dryRunError).toContain('No org-party');
      // Restored original org on resolve failure (last setCurrrenOrgId call).
      const setOrgCalls = orgIdService.setCurrrenOrgId.mock.calls;
      expect(setOrgCalls[setOrgCalls.length - 1][0]).toBe(ORIGINAL_ORG);
    });

    it('marks failed when no admin USER exists in adminGroup', async () => {
      listGroupMembersMock.mockResolvedValue({
        items: [{ id: 'svc-only', type: 'SERVICE_ACCOUNT' }],
      });
      const row = component.rows()[0];
      await component.dryRun(row);

      expect(component.rows()[0].dryRunStatus).toBe('failed');
      expect(provisioner.ensurePlatformEngagement).not.toHaveBeenCalled();
    });

    it('marks failed when row has no adminGroupId', async () => {
      const row = component.rows()[0];
      const noAdminRow = { ...row, adminGroupId: undefined };
      await component.dryRun(noAdminRow);

      // The row in component state is matched by id, so update should land.
      expect(component.rows()[0].dryRunStatus).toBe('failed');
      expect(clientApi.reconnectWithOrgId).not.toHaveBeenCalled();
    });
  });

  describe('provisionOrg — gated by dry-run success', () => {
    beforeEach(async () => {
      await component.loadOrgs();
      listPartiesMock.mockResolvedValue({
        items: [{ id: TARGET_ORG_PARTY, partyType: 'org' }],
      });
      listGroupMembersMock.mockResolvedValue({
        items: [{ id: TARGET_USER_PRINCIPAL, type: 'USER' }],
      });
      getPartyMock.mockResolvedValue({ id: TARGET_USER_PARTY });
    });

    it('blocks Provision when dry-run has not succeeded (idle)', async () => {
      const row = component.rows()[0];
      await component.provisionOrg(row);
      expect(clientApi.reconnectWithOrgId).not.toHaveBeenCalled();
      expect(provisioner.ensurePlatformEngagement).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Run Dry Run first'),
        'Dismiss',
        expect.any(Object),
      );
    });

    it('blocks Provision when dry-run failed', async () => {
      // Force a failed dry run first.
      listPartiesMock.mockResolvedValueOnce({ items: [] });
      await component.dryRun(component.rows()[0]);
      expect(component.rows()[0].dryRunStatus).toBe('failed');

      // Now try to provision — should be blocked.
      // Clear call counts so we only count provision-time calls.
      clientApi.reconnectWithOrgId.mockClear();
      orgIdService.setCurrrenOrgId.mockClear();
      await component.provisionOrg(component.rows()[0]);
      expect(orgIdService.setCurrrenOrgId).not.toHaveBeenCalled();
      expect(clientApi.reconnectWithOrgId).not.toHaveBeenCalled();
      expect(provisioner.ensurePlatformEngagement).not.toHaveBeenCalled();
    });

    it('runs the recipe after a successful dry-run, with correctly resolved RACI parties', async () => {
      await component.dryRun(component.rows()[0]);
      expect(component.rows()[0].dryRunStatus).toBe('success');

      await component.provisionOrg(component.rows()[0]);
      expect(provisioner.ensurePlatformEngagement).toHaveBeenCalledWith({
        currentOrgId: TARGET_ORG,
        currentOrgName: 'Target Org',
        currentOrgSlug: 'targetorg',
        buyerUserId: TARGET_USER_PRINCIPAL,
        assignedPartyId: TARGET_ORG_PARTY,
        accountablePartyId: TARGET_USER_PARTY,
      });
    });

    it('switches back to original org BEFORE invoking the recipe (Pipeline.receive lives in W3Geekery)', async () => {
      await component.dryRun(component.rows()[0]);
      orgIdService.setCurrrenOrgId.mockClear();

      await component.provisionOrg(component.rows()[0]);

      // Order: party-fetch in target → switch back to original → recipe.
      // Find the LAST setCurrrenOrgId(originalOrgId) call BEFORE the recipe call.
      const recipeCallOrder = provisioner.ensurePlatformEngagement.mock.invocationCallOrder[0];
      const setOrgInvocations = orgIdService.setCurrrenOrgId.mock.invocationCallOrder;
      const setOrgCalls = orgIdService.setCurrrenOrgId.mock.calls;

      // Identify which setCurrrenOrgId calls happened BEFORE the recipe.
      const preRecipeSwitches = setOrgInvocations
        .map((order: number, idx: number) => ({ order, args: setOrgCalls[idx] }))
        .filter((c: { order: number }) => c.order < recipeCallOrder);

      // The most recent pre-recipe switch must be back to original org.
      const lastPreRecipeSwitch = preRecipeSwitches[preRecipeSwitches.length - 1];
      expect(lastPreRecipeSwitch.args[0]).toBe(ORIGINAL_ORG);
    });

    it('always restores original org on recipe failure', async () => {
      await component.dryRun(component.rows()[0]);
      provisioner.ensurePlatformEngagement.mockRejectedValue(new Error('boom'));
      orgIdService.setCurrrenOrgId.mockClear();
      await component.provisionOrg(component.rows()[0]);
      // Last setCurrrenOrgId call must be the restore to original.
      const setOrgCalls = orgIdService.setCurrrenOrgId.mock.calls;
      expect(setOrgCalls[setOrgCalls.length - 1][0]).toBe(ORIGINAL_ORG);
      expect(component.rows()[0].status).toBe('error');
    });
  });
});
