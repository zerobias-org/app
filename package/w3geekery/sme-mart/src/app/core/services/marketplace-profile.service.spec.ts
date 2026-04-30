import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarketplaceProfileService } from './marketplace-profile.service';
import { GraphqlReadService } from './graphql-read.service';
import { PipelineWriteService } from './pipeline-write.service';
import { CompanyInfoStruct } from '../../onboarding/company-info.model';
import { SECTION_ONBOARDING_COMPLETE } from '../../onboarding/company-info-sections';

describe('MarketplaceProfileService', () => {
  let service: MarketplaceProfileService;
  let mockGqlRead: any;
  let mockPipelineWrite: any;
  let mockClientApi: any;
  let mockSnackBar: any;

  const testOrgId = 'cd7105df-523d-5392-9f9a-3f83d3f30107';

  beforeEach(() => {
    mockGqlRead = {
      query: vi.fn(),
    };

    mockPipelineWrite = {
      pushEntities: vi.fn(),
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
    it('pre-fill from existing MPI records', async () => {
      // Setup: GQL returns 5 MPI records
      mockGqlRead.query.mockResolvedValueOnce({
        items: [
          {
            id: `mpi-${testOrgId}-legal_name`,
            section: 'legal_name',
            data: 'Acme Inc',
            status: 'active',
            expiresAt: null,
          },
          {
            id: `mpi-${testOrgId}-dba`,
            section: 'dba',
            data: 'Acme Trading',
            status: 'active',
            expiresAt: null,
          },
          {
            id: `mpi-${testOrgId}-logo_url`,
            section: 'logo_url',
            data: 'https://logo.acme.com/logo.png',
            status: 'active',
            expiresAt: null,
          },
          {
            id: `mpi-${testOrgId}-website`,
            section: 'website',
            data: 'https://acme.com',
            status: 'active',
            expiresAt: null,
          },
          {
            id: `mpi-${testOrgId}-years_in_business`,
            section: 'years_in_business',
            data: '15',
            status: 'active',
            expiresAt: null,
          },
        ],
        page: { pageNumber: 1, pageSize: 50, totalCount: 5 },
      });

      // Org fallback fetch (shouldn't matter since MPI has the values)
      mockClientApi.danaClient.getMeApi().listMyOrgs.mockResolvedValueOnce([
        {
          id: testOrgId,
          name: 'Org Fallback Name',
          avatarUrl: 'https://org-fallback.png',
        },
      ]);

      // Act
      const result = await service.readProfileForOrg(testOrgId);

      // Assert: form struct has those MPI values, no org fallbacks applied
      expect(result.legalName).toBe('Acme Inc');
      expect(result.dba).toBe('Acme Trading');
      expect(result.logoUrl).toBe('https://logo.acme.com/logo.png');
      expect(result.website).toBe('https://acme.com');
      expect(result.yearsInBusiness).toBe(15);
    });

    it('pre-fill with org fallback for legal_name + logo_url', async () => {
      // Setup: GQL returns 3 records (no legal_name or logo_url)
      mockGqlRead.query.mockResolvedValueOnce({
        items: [
          {
            id: `mpi-${testOrgId}-dba`,
            section: 'dba',
            data: 'Acme LLC',
            status: 'active',
            expiresAt: null,
          },
          {
            id: `mpi-${testOrgId}-website`,
            section: 'website',
            data: 'https://acme-llc.com',
            status: 'active',
            expiresAt: null,
          },
          {
            id: `mpi-${testOrgId}-employee_count`,
            section: 'employee_count',
            data: '51-200',
            status: 'active',
            expiresAt: null,
          },
        ],
        page: { pageNumber: 1, pageSize: 50, totalCount: 3 },
      });

      // Org fallback for legal_name and logo_url
      mockClientApi.danaClient.getMeApi().listMyOrgs.mockResolvedValueOnce([
        {
          id: testOrgId,
          name: 'Acme Inc',
          avatarUrl: 'https://acme-avatar.png',
        },
      ]);

      // Act
      const result = await service.readProfileForOrg(testOrgId);

      // Assert: org fallbacks applied for legal_name + logo_url, MPI values for others
      expect(result.legalName).toBe('Acme Inc'); // org fallback
      expect(result.logoUrl).toBe('https://acme-avatar.png'); // org fallback
      expect(result.dba).toBe('Acme LLC'); // from MPI
      expect(result.website).toBe('https://acme-llc.com'); // from MPI
      expect(result.employeeCount).toBe('51-200'); // from MPI
    });

    it('pre-fill with please-provide for empty fields', async () => {
      // Setup: GQL returns 0 records
      mockGqlRead.query.mockResolvedValueOnce({
        items: [],
        page: { pageNumber: 1, pageSize: 50, totalCount: 0 },
      });

      // Org fallback also missing/null (org not found)
      mockClientApi.danaClient.getMeApi().listMyOrgs.mockResolvedValueOnce([]);

      // Act
      const result = await service.readProfileForOrg(testOrgId);

      // Assert: all fields empty (caller will render "(please provide)" hints)
      expect(result.legalName).toBe('');
      expect(result.dba).toBeUndefined();
      expect(result.logoUrl).toBeUndefined();
      expect(result.shortBlurb).toBeUndefined();
      expect(result.website).toBeUndefined();
    });
  });

  describe('save (CP-04, CP-05)', () => {
    it('save writes only dirty fields with correct record shape', async () => {
      // Setup: dirty fields
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

      mockPipelineWrite.pushEntities.mockResolvedValueOnce(undefined);

      // Act
      await service.save(testOrgId, current, original);

      // Assert: ONE call to pushEntities with 4 records (3 dirty + 1 onboarding_complete)
      expect(mockPipelineWrite.pushEntities).toHaveBeenCalledTimes(1);

      const [className, records, tagIds, callSiteTag] = mockPipelineWrite.pushEntities.mock.calls[0];

      expect(className).toBe('MarketplaceProfileItem');
      expect(tagIds).toEqual([]);
      expect(callSiteTag).toBe('mpi-company-profile-save');

      // Verify record count (3 dirty + 1 onboarding_complete)
      expect(records).toHaveLength(4);

      // Verify record shapes
      expect(records).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringMatching(/^mpi-[a-f0-9-]+-legal_name$/),
            orgId: testOrgId,
            section: 'legal_name',
            data: 'Acme Revised',
            status: 'active',
          }),
          expect.objectContaining({
            id: expect.stringMatching(/^mpi-[a-f0-9-]+-dba$/),
            orgId: testOrgId,
            section: 'dba',
            data: 'Acme LLC',
            status: 'active',
          }),
          expect.objectContaining({
            id: expect.stringMatching(/^mpi-[a-f0-9-]+-website$/),
            orgId: testOrgId,
            section: 'website',
            data: 'https://acme.com',
            status: 'active',
          }),
          expect.objectContaining({
            section: 'onboarding_complete',
            data: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
            status: 'active',
          }),
        ]),
      );
    });

    it('save skips org-fallback pre-fills if user did not edit', async () => {
      // Setup: legal_name came from Org.name, user did not edit
      const original: Partial<CompanyInfoStruct> = {
        legalName: 'Acme Inc', // came from Org.name, not MPI
      };

      const current: Partial<CompanyInfoStruct> = {
        legalName: 'Acme Inc', // unchanged
      };

      mockPipelineWrite.pushEntities.mockResolvedValueOnce(undefined);

      // Act
      await service.save(testOrgId, current, original);

      // Assert: NO record written for legal_name, only onboarding_complete
      const [, records] = mockPipelineWrite.pushEntities.mock.calls[0];
      expect(records).toHaveLength(1); // only onboarding_complete
      expect(records[0].section).toBe('onboarding_complete');

      // Verify no legal_name record
      const legalNameRecord = records.find((r: any) => r.section === 'legal_name');
      expect(legalNameRecord).toBeUndefined();
    });

    it('save includes onboarding_complete marker with ISO date', async () => {
      // Setup: any save
      const original: Partial<CompanyInfoStruct> = { legalName: 'Acme' };
      const current: Partial<CompanyInfoStruct> = { legalName: 'Acme' };

      mockPipelineWrite.pushEntities.mockResolvedValueOnce(undefined);

      // Act
      const beforeDate = new Date().toISOString().split('T')[0];
      await service.save(testOrgId, current, original);
      const afterDate = new Date().toISOString().split('T')[0];

      // Assert: batch includes onboarding_complete with ISO date
      const [, records] = mockPipelineWrite.pushEntities.mock.calls[0];
      const marker = records.find((r: any) => r.section === 'onboarding_complete');

      expect(marker).toBeDefined();
      expect(marker?.id).toBe(`mpi-${testOrgId}-${SECTION_ONBOARDING_COMPLETE}`);
      expect(marker?.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Date should be today (may have midnight boundary edge case, but within 1 day)
      const markerDate = marker?.data;
      expect([beforeDate, afterDate]).toContain(markerDate);
    });

    it('save error path: snackbar + re-throw', async () => {
      // Setup: pipeline error
      const pipelineError = new Error('Pipeline rejected');
      mockPipelineWrite.pushEntities.mockRejectedValueOnce(pipelineError);

      const original: Partial<CompanyInfoStruct> = { legalName: 'Acme' };
      const current: Partial<CompanyInfoStruct> = { legalName: 'Acme Revised' };

      // Act & Assert
      await expect(service.save(testOrgId, current, original)).rejects.toThrow('Pipeline rejected');

      // Verify snackbar was called
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save profile'),
        'Dismiss',
        { duration: 5000 },
      );
    });
  });

  describe('getCompletionStatus (CP-07)', () => {
    it('returns true if onboarding_complete marker exists', async () => {
      // Setup: GQL returns onboarding_complete record
      mockGqlRead.query.mockResolvedValueOnce({
        items: [
          {
            id: `mpi-${testOrgId}-${SECTION_ONBOARDING_COMPLETE}`,
            section: SECTION_ONBOARDING_COMPLETE,
            status: 'active',
          },
        ],
        page: { pageNumber: 1, pageSize: 1, totalCount: 1 },
      });

      // Act
      const result = await service.getCompletionStatus(testOrgId);

      // Assert
      expect(result).toBe(true);
    });

    it('returns false if onboarding_complete marker absent', async () => {
      // Setup: GQL returns empty
      mockGqlRead.query.mockResolvedValueOnce({
        items: [],
        page: { pageNumber: 1, pageSize: 1, totalCount: 0 },
      });

      // Act
      const result = await service.getCompletionStatus(testOrgId);

      // Assert
      expect(result).toBe(false);
    });

    it('returns false on GQL error', async () => {
      // Setup: GQL error
      mockGqlRead.query.mockRejectedValueOnce(new Error('Network error'));

      // Act
      const result = await service.getCompletionStatus(testOrgId);

      // Assert: returns false on error (graceful degradation)
      expect(result).toBe(false);
    });
  });

  describe('dirty-diff edge cases (CP-08)', () => {
    it('treats empty pre-fill + empty user input as not dirty', async () => {
      // Setup: shortBlurb is empty in both original and current
      const original: Partial<CompanyInfoStruct> = {
        legalName: 'Acme',
        shortBlurb: undefined,
      };

      const current: Partial<CompanyInfoStruct> = {
        legalName: 'Acme',
        shortBlurb: undefined,
      };

      mockPipelineWrite.pushEntities.mockResolvedValueOnce(undefined);

      // Act
      await service.save(testOrgId, current, original);

      // Assert: no short_blurb record written, only onboarding_complete
      const [, records] = mockPipelineWrite.pushEntities.mock.calls[0];
      const shortBlurbRecord = records.find((r: any) => r.section === 'short_blurb');
      expect(shortBlurbRecord).toBeUndefined();
      expect(records).toHaveLength(1); // only onboarding_complete
    });

    it('treats empty string and undefined consistently', async () => {
      // Setup: dba is '' in original, '' in current
      const original: Partial<CompanyInfoStruct> = {
        legalName: 'Acme',
        dba: '',
      };

      const current: Partial<CompanyInfoStruct> = {
        legalName: 'Acme',
        dba: '',
      };

      mockPipelineWrite.pushEntities.mockResolvedValueOnce(undefined);

      // Act
      await service.save(testOrgId, current, original);

      // Assert: no dba record written (not dirty)
      const [, records] = mockPipelineWrite.pushEntities.mock.calls[0];
      const dbaRecord = records.find((r: any) => r.section === 'dba');
      expect(dbaRecord).toBeUndefined();
    });

    it('handles numeric fields correctly', async () => {
      // Setup: yearsInBusiness changed
      const original: Partial<CompanyInfoStruct> = {
        legalName: 'Acme',
        yearsInBusiness: 5,
      };

      const current: Partial<CompanyInfoStruct> = {
        legalName: 'Acme',
        yearsInBusiness: 10,
      };

      mockPipelineWrite.pushEntities.mockResolvedValueOnce(undefined);

      // Act
      await service.save(testOrgId, current, original);

      // Assert: years_in_business record written with string value
      const [, records] = mockPipelineWrite.pushEntities.mock.calls[0];
      const yearsRecord = records.find((r: any) => r.section === 'years_in_business');
      expect(yearsRecord).toBeDefined();
      expect(yearsRecord?.data).toBe('10');
    });

    it('handles nested primaryContact fields correctly', async () => {
      // Setup: user_id changed (other fields derived)
      const original: Partial<CompanyInfoStruct> = {
        legalName: 'Acme',
        primaryContact: {
          userId: 'user-1',
          name: 'John Doe',
          email: 'john@acme.com',
        },
      };

      const current: Partial<CompanyInfoStruct> = {
        legalName: 'Acme',
        primaryContact: {
          userId: 'user-2',
          name: 'Jane Smith',
          email: 'jane@acme.com',
        },
      };

      mockPipelineWrite.pushEntities.mockResolvedValueOnce(undefined);

      // Act
      await service.save(testOrgId, current, original);

      // Assert: all three primary_contact fields written (all dirty from userId change)
      const [, records] = mockPipelineWrite.pushEntities.mock.calls[0];
      const userIdRecord = records.find((r: any) => r.section === 'primary_contact.user_id');
      const nameRecord = records.find((r: any) => r.section === 'primary_contact.name');
      const emailRecord = records.find((r: any) => r.section === 'primary_contact.email');

      expect(userIdRecord).toBeDefined();
      expect(nameRecord).toBeDefined();
      expect(emailRecord).toBeDefined();
    });
  });
});
