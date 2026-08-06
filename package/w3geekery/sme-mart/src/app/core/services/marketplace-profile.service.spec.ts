import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarketplaceProfileService } from './marketplace-profile.service';
import { GraphqlReadService } from './graphql-read.service';
import { PipelineWriteService } from './pipeline-write.service';
import { CompanyInfoStruct, EmployeeCountBand } from '../../onboarding/company-info.model';

describe('MarketplaceProfileService', () => {
  let service: MarketplaceProfileService;
  let mockGqlRead: { query: ReturnType<typeof vi.fn> };
  let mockPipelineWrite: { pushEntity: ReturnType<typeof vi.fn> };
  let mockClientApi: {
    danaClient: {
      getMeApi: () => { listMyOrgs: ReturnType<typeof vi.fn> };
    };
  };
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };

  const testOrgId = 'cd7105df-523d-5392-9f9a-3f83d3f30107';
  const testRowId = '7f1f2c9e-6b0a-4d3f-9a41-2c8f5e0b7d11';

  /** A stored OrgProfile row, overridable per test. */
  const row = (overrides: Record<string, unknown> = {}) => ({
    id: testRowId,
    name: `OrgProfile-${testOrgId}`,
    orgId: testOrgId,
    ...overrides,
  });

  /** GraphqlReadService.query result envelope. */
  const page = (items: unknown[]) => ({
    items,
    page: { pageNumber: 1, pageSize: 1, totalCount: items.length },
  });

  beforeEach(() => {
    mockGqlRead = {
      query: vi.fn(),
    };

    mockPipelineWrite = {
      pushEntity: vi.fn(),
    };

    mockClientApi = {
      danaClient: {
        getMeApi: vi.fn().mockReturnValue({
          listMyOrgs: vi.fn(),
        }),
      },
    };

    mockSnackBar = {
      open: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        MarketplaceProfileService,
        { provide: GraphqlReadService, useValue: mockGqlRead },
        { provide: PipelineWriteService, useValue: mockPipelineWrite },
        { provide: ZerobiasClientApi, useValue: mockClientApi },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    service = TestBed.inject(MarketplaceProfileService);
  });

  describe('readProfileForOrg (CP-02, CP-03, CP-04 pre-fill leg)', () => {
    it('pre-fill from the stored OrgProfile row', async () => {
      mockGqlRead.query.mockResolvedValueOnce(page([
        row({
          legalName: 'Acme Inc',
          dba: 'Acme Trading',
          logoUrl: 'https://logo.acme.com/logo.png',
          website: 'https://acme.com',
          shortDescription: 'We do compliance.',
          foundedYear: new Date().getFullYear() - 15,
        }),
      ]));

      // Org fallback fetch (shouldn't matter since the row has the values)
      mockClientApi.danaClient.getMeApi().listMyOrgs.mockResolvedValueOnce([
        {
          id: testOrgId,
          name: 'Org Fallback Name',
          avatarUrl: 'https://org-fallback.png',
        },
      ]);

      const result = await service.readProfileForOrg(testOrgId);

      expect(result.legalName).toBe('Acme Inc');
      expect(result.dba).toBe('Acme Trading');
      expect(result.logoUrl).toBe('https://logo.acme.com/logo.png');
      expect(result.website).toBe('https://acme.com');
      expect(result.shortBlurb).toBe('We do compliance.');
      // yearsInBusiness is derived from foundedYear, not stored
      expect(result.yearsInBusiness).toBe(15);
    });

    it('pre-fill with org fallback for legalName + logoUrl', async () => {
      mockGqlRead.query.mockResolvedValueOnce(page([
        row({
          dba: 'Acme LLC',
          website: 'https://acme-llc.com',
          employeeCount: EmployeeCountBand.BAND_51_100,
        }),
      ]));

      mockClientApi.danaClient.getMeApi().listMyOrgs.mockResolvedValueOnce([
        {
          id: testOrgId,
          name: 'Acme Inc',
          avatarUrl: 'https://acme-avatar.png',
        },
      ]);

      const result = await service.readProfileForOrg(testOrgId);

      expect(result.legalName).toBe('Acme Inc'); // org fallback
      expect(result.logoUrl).toBe('https://acme-avatar.png'); // org fallback
      expect(result.dba).toBe('Acme LLC'); // from the row
      expect(result.website).toBe('https://acme-llc.com'); // from the row
      expect(result.employeeCount).toBe(EmployeeCountBand.BAND_51_100);
    });

    it('pre-fill with please-provide for empty fields', async () => {
      mockGqlRead.query.mockResolvedValueOnce(page([]));

      // Org fallback also missing/null (org not found)
      mockClientApi.danaClient.getMeApi().listMyOrgs.mockResolvedValueOnce([]);

      const result = await service.readProfileForOrg(testOrgId);

      expect(result.legalName).toBe('');
      expect(result.dba).toBeUndefined();
      expect(result.logoUrl).toBeUndefined();
      expect(result.shortBlurb).toBeUndefined();
      expect(result.website).toBeUndefined();
      expect(result.yearsInBusiness).toBeUndefined();
    });
  });

  describe('save (CP-04, CP-05)', () => {
    it('save overlays only dirty fields onto one OrgProfile upsert', async () => {
      mockGqlRead.query.mockResolvedValueOnce(page([
        row({ legalName: 'Acme Inc', dba: null, website: null }),
      ]));
      mockPipelineWrite.pushEntity.mockResolvedValueOnce(undefined);

      const original: Partial<CompanyInfoStruct> = {
        legalName: 'Acme Inc',
        dba: '',
        website: '',
      };

      const current: Partial<CompanyInfoStruct> = {
        legalName: 'Acme Revised',
        dba: 'Acme LLC',
        website: 'https://acme.com',
      };

      await service.save(testOrgId, current, original);

      expect(mockPipelineWrite.pushEntity).toHaveBeenCalledTimes(1);

      const [className, payload, tagIds, callSiteTag] = mockPipelineWrite.pushEntity.mock.calls[0];

      expect(className).toBe('OrgProfile');
      expect(tagIds).toEqual([]);
      expect(callSiteTag).toBe('org-profile-company-profile-save');

      // One row, keyed to the org, reusing the stored row's id
      expect(payload).toMatchObject({
        id: testRowId,
        orgId: testOrgId,
        legalName: 'Acme Revised',
        dba: 'Acme LLC',
        website: 'https://acme.com',
      });
    });

    it('save mints a row id when the org has no profile yet', async () => {
      mockGqlRead.query.mockResolvedValueOnce(page([]));
      mockPipelineWrite.pushEntity.mockResolvedValueOnce(undefined);

      await service.save(testOrgId, { legalName: 'Acme' }, {});

      const [, payload] = mockPipelineWrite.pushEntity.mock.calls[0];
      expect(payload.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(payload.name).toBe(`OrgProfile-${testOrgId}`);
      expect(payload.legalName).toBe('Acme');
    });

    it('save skips org-fallback pre-fills if user did not edit', async () => {
      mockGqlRead.query.mockResolvedValueOnce(page([row()]));
      mockPipelineWrite.pushEntity.mockResolvedValueOnce(undefined);

      // legalName came from Org.name, user did not edit
      const original: Partial<CompanyInfoStruct> = { legalName: 'Acme Inc' };
      const current: Partial<CompanyInfoStruct> = { legalName: 'Acme Inc' };

      await service.save(testOrgId, current, original);

      // The unedited fallback is not persisted — the row keeps its own (empty) value
      const [, payload] = mockPipelineWrite.pushEntity.mock.calls[0];
      expect(payload.legalName).toBeNull();
    });

    it('save error path: snackbar + re-throw', async () => {
      mockGqlRead.query.mockResolvedValueOnce(page([row()]));
      mockPipelineWrite.pushEntity.mockRejectedValueOnce(new Error('Pipeline rejected'));

      const original: Partial<CompanyInfoStruct> = { legalName: 'Acme' };
      const current: Partial<CompanyInfoStruct> = { legalName: 'Acme Revised' };

      await expect(service.save(testOrgId, current, original)).rejects.toThrow('Pipeline rejected');

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save profile'),
        'Dismiss',
        { duration: 5000 },
      );
    });

    it('save refuses to write when the current row cannot be read', async () => {
      // A read failure would silently turn an update into an insert, orphaning
      // the stored row — so it must abort rather than guess.
      mockGqlRead.query.mockRejectedValueOnce(new Error('GQL boundary down'));

      await expect(
        service.save(testOrgId, { legalName: 'Acme' }, {}),
      ).rejects.toThrow('GQL boundary down');

      expect(mockPipelineWrite.pushEntity).not.toHaveBeenCalled();
    });
  });

  describe('getCompletionStatus (CP-07)', () => {
    it('returns true when the org has a row with a legalName', async () => {
      mockGqlRead.query.mockResolvedValueOnce(page([row({ legalName: 'Acme Inc' })]));

      expect(await service.getCompletionStatus(testOrgId)).toBe(true);
    });

    it('returns false when the org has no row', async () => {
      mockGqlRead.query.mockResolvedValueOnce(page([]));

      expect(await service.getCompletionStatus(testOrgId)).toBe(false);
    });

    it('returns false when the row exists but legalName is blank', async () => {
      mockGqlRead.query.mockResolvedValueOnce(page([row({ legalName: '   ' })]));

      expect(await service.getCompletionStatus(testOrgId)).toBe(false);
    });

    it('returns false on GQL error', async () => {
      mockGqlRead.query.mockRejectedValueOnce(new Error('Network error'));

      // Graceful degradation — the guard routes to the form and the user retries
      expect(await service.getCompletionStatus(testOrgId)).toBe(false);
    });
  });

  describe('dirty-diff edge cases (CP-08)', () => {
    it('treats empty pre-fill + empty user input as not dirty', async () => {
      mockGqlRead.query.mockResolvedValueOnce(page([row({ shortDescription: 'stored' })]));
      mockPipelineWrite.pushEntity.mockResolvedValueOnce(undefined);

      const original: Partial<CompanyInfoStruct> = {
        legalName: 'Acme',
        shortBlurb: undefined,
      };

      const current: Partial<CompanyInfoStruct> = {
        legalName: 'Acme',
        shortBlurb: undefined,
      };

      await service.save(testOrgId, current, original);

      // Untouched by the diff, so the stored value survives the upsert
      const [, payload] = mockPipelineWrite.pushEntity.mock.calls[0];
      expect(payload.shortDescription).toBe('stored');
    });

    it('treats empty string and undefined consistently', async () => {
      mockGqlRead.query.mockResolvedValueOnce(page([row({ dba: 'stored' })]));
      mockPipelineWrite.pushEntity.mockResolvedValueOnce(undefined);

      const original: Partial<CompanyInfoStruct> = { legalName: 'Acme', dba: '' };
      const current: Partial<CompanyInfoStruct> = { legalName: 'Acme', dba: '' };

      await service.save(testOrgId, current, original);

      const [, payload] = mockPipelineWrite.pushEntity.mock.calls[0];
      expect(payload.dba).toBe('stored');
    });

    it('clearing a field writes null rather than dropping the edit', async () => {
      mockGqlRead.query.mockResolvedValueOnce(page([row({ dba: 'Acme LLC' })]));
      mockPipelineWrite.pushEntity.mockResolvedValueOnce(undefined);

      const original: Partial<CompanyInfoStruct> = { legalName: 'Acme', dba: 'Acme LLC' };
      const current: Partial<CompanyInfoStruct> = { legalName: 'Acme', dba: '' };

      await service.save(testOrgId, current, original);

      const [, payload] = mockPipelineWrite.pushEntity.mock.calls[0];
      expect(payload.dba).toBeNull();
    });

    it('converts yearsInBusiness to foundedYear', async () => {
      mockGqlRead.query.mockResolvedValueOnce(page([row()]));
      mockPipelineWrite.pushEntity.mockResolvedValueOnce(undefined);

      const original: Partial<CompanyInfoStruct> = { legalName: 'Acme', yearsInBusiness: 5 };
      const current: Partial<CompanyInfoStruct> = { legalName: 'Acme', yearsInBusiness: 10 };

      await service.save(testOrgId, current, original);

      const [, payload] = mockPipelineWrite.pushEntity.mock.calls[0];
      expect(payload.foundedYear).toBe(new Date().getFullYear() - 10);
    });

    it('writes primaryContact.userId and drops the resolved-on-read name/email', async () => {
      mockGqlRead.query.mockResolvedValueOnce(page([row()]));
      mockPipelineWrite.pushEntity.mockResolvedValueOnce(undefined);

      const original: Partial<CompanyInfoStruct> = {
        legalName: 'Acme',
        primaryContact: { userId: 'user-1', name: 'John Doe', email: 'john@acme.com' },
      };

      const current: Partial<CompanyInfoStruct> = {
        legalName: 'Acme',
        primaryContact: { userId: 'user-2', name: 'Jane Smith', email: 'jane@acme.com' },
      };

      await service.save(testOrgId, current, original);

      const [, payload] = mockPipelineWrite.pushEntity.mock.calls[0];
      expect(payload.primaryContactUserId).toBe('user-2');
      // OrgProfile resolves these from the platform User; there is nowhere to put them
      expect(payload).not.toHaveProperty('primaryContactName');
      expect(payload).not.toHaveProperty('primaryContactEmail');
    });
  });
});
