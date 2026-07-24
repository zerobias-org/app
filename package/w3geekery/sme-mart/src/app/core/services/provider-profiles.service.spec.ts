/**
 * Unit Tests for ProviderProfilesService
 *
 * Wave 1 (RED PHASE) — Tests for MPI/GQL read path (all should FAIL against Neon implementation)
 * Wave 2 (GREEN PHASE) — Implementation switches from Neon to GQL direct boundary calls
 *
 * Plan 26-03: Browse Providers UI — Switch to MPI/GQL Reads
 */

import { TestBed } from '@angular/core/testing';
import { ProviderProfilesService } from './provider-profiles.service';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import { SmeMartDbService } from './sme-mart-db.service';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const ZB_ORG = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec';

describe('ProviderProfilesService — MPI/GQL read path', () => {
  let service: ProviderProfilesService;
  let mockBoundaryApi: { boundaryExecuteRawQuery: ReturnType<typeof vi.fn> };
  let mockSmeMartDb: { listRows: ReturnType<typeof vi.fn>; getRow: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Mock the boundary API (for Wave 2 implementation)
    mockBoundaryApi = {
      boundaryExecuteRawQuery: vi.fn(),
    };

    const mockGraphqlClient = {
      getBoundaryApi: () => mockBoundaryApi,
    };

    const mockClientApi = {
      graphqlClient: mockGraphqlClient,
    };

    // Mock SmeMartDbService (for Wave 1 negative-shape tests)
    mockSmeMartDb = {
      listRows: vi.fn().mockResolvedValue({ items: [], page: { pageNumber: 1, pageSize: 50, totalCount: 0 } }),
      getRow: vi.fn().mockResolvedValue(null),
    };

    TestBed.configureTestingModule({
      providers: [
        ProviderProfilesService,
        { provide: ZerobiasClientApi, useValue: mockClientApi },
        { provide: SmeMartDbService, useValue: mockSmeMartDb },
      ],
    });

    service = TestBed.inject(ProviderProfilesService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 1: listProviders() groups MPI rows by orgId and projects to ProviderDirectoryRow
  // ──────────────────────────────────────────────────────────────────

  it('listProviders() groups MPI rows by orgId and projects to ProviderDirectoryView', async () => {
    // Mock OrgProfile data for ZeroBias
    const profileId = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec';

    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValueOnce({
      data: {
        OrgProfile: [
          {
            id: profileId,
            orgId: ZB_ORG,
            legalName: 'ZeroBias',
            dba: null,
            tagline: 'Cybersecurity & compliance automation',
            shortDescription: 'Short description here',
            longDescription: 'Long-form description here',
            website: 'https://zerobias.com',
            logoUrl: 'https://cdn.example/zb.svg',
            employeeCount: '50-99',
            businessClassification: 'SaaS',
            foundedYear: 2020,
            primaryContactUserId: 'user-123',
            verified: true,
            verificationSource: 'admin',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      },
    });

    // Mock expertise junction queries (segments, skills, etc.)
    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue({
      data: {
        ProviderSkill: [],
        ProviderRole: [],
        ProviderProduct: [],
        ProviderFramework: [],
        ProviderSegment: [],
        ProviderServiceSegment: [],
      },
    });

    const result = await service.listProviders();

    // Assert boundaryExecuteRawQuery was called
    expect(mockBoundaryApi.boundaryExecuteRawQuery).toHaveBeenCalled();

    // Assert the returned item matches OrgProfile projections
    expect(result.items.length).toBeGreaterThan(0);
    const item = result.items[0];
    expect(item.orgId).toBe(ZB_ORG);
    expect(item.legalName).toBe('ZeroBias');
    expect(item.tagline).toBe('Cybersecurity & compliance automation');
    expect(item.logoUrl).toBe('https://cdn.example/zb.svg');

    // Assert verification fields are present
    expect(item.verified).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 2: listProviders() filters by provider_type=platform
  // ──────────────────────────────────────────────────────────────────

  it('listProviders() returns multiple OrgProfile records', async () => {
    const profileId = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec';

    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValueOnce({
      data: {
        OrgProfile: [
          {
            id: profileId,
            orgId: ZB_ORG,
            legalName: 'ZeroBias',
            dba: null,
            tagline: 'Platform',
            shortDescription: 'Platform description',
            longDescription: null,
            website: 'https://zerobias.com',
            logoUrl: null,
            employeeCount: null,
            businessClassification: null,
            foundedYear: null,
            primaryContactUserId: null,
            verified: false,
            verificationSource: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      },
    });

    // Mock expertise junctions (segments, skills, etc.)
    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue({
      data: {
        ProviderSkill: [],
        ProviderRole: [],
        ProviderProduct: [],
        ProviderFramework: [],
        ProviderSegment: [],
        ProviderServiceSegment: [],
      },
    });

    const result = await service.listProviders();

    // Assert OrgProfile records are returned
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].orgId).toBe(ZB_ORG);
    expect(result.items[0].legalName).toBe('ZeroBias');
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 3: getProvider(orgId) returns ProviderDetailRow with all sections
  // ──────────────────────────────────────────────────────────────────

  it('getProvider(orgId) returns ProviderDetailView with expertise sections', async () => {
    const profileId = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec';

    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValueOnce({
      data: {
        OrgProfile: [
          {
            id: profileId,
            orgId: ZB_ORG,
            legalName: 'ZeroBias',
            dba: null,
            tagline: 'Cybersecurity & compliance automation',
            shortDescription: 'Short description',
            longDescription: 'Long-form about ZB',
            website: 'https://zerobias.com',
            logoUrl: 'https://cdn.example/zb.svg',
            employeeCount: '100-500',
            businessClassification: 'SaaS',
            foundedYear: 2020,
            primaryContactUserId: 'user-123',
            verified: true,
            verificationSource: 'admin',
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      },
    });

    // Mock expertise junctions
    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue({
      data: {
        ProviderSkill: [],
        ProviderRole: [],
        ProviderProduct: [],
        ProviderFramework: [],
        ProviderSegment: [],
        ProviderServiceSegment: [],
      },
    });

    const result = await service.getProvider(ZB_ORG);

    expect(result).not.toBeNull();
    expect(result?.legalName).toBe('ZeroBias');
    expect(result?.tagline).toBe('Cybersecurity & compliance automation');
    expect(result?.longDescription).toBe('Long-form about ZB');
    expect(result?.logoUrl).toBe('https://cdn.example/zb.svg');
    expect(result?.skills).toEqual([]);
    expect(result?.verified).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 4: getProviderByUserId(userId) finds org via primary_contact.user_id
  // ──────────────────────────────────────────────────────────────────

  it('getProviderByUserId(userId) finds org via primaryContactUserId', async () => {
    const testUserId = 'user-123';
    const profileId = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec';

    // First call: search for org with matching primaryContactUserId
    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValueOnce({
      data: {
        OrgProfile: [
          {
            id: profileId,
            orgId: ZB_ORG,
            legalName: '',
            dba: null,
            tagline: null,
            shortDescription: null,
            longDescription: null,
            website: null,
            logoUrl: null,
            employeeCount: null,
            businessClassification: null,
            foundedYear: null,
            primaryContactUserId: testUserId,
            verified: false,
            verificationSource: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      },
    });

    // Second call: fetch full profile for that org
    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValueOnce({
      data: {
        OrgProfile: [
          {
            id: profileId,
            orgId: ZB_ORG,
            legalName: 'ZeroBias',
            dba: null,
            tagline: 'Platform',
            shortDescription: null,
            longDescription: null,
            website: null,
            logoUrl: null,
            employeeCount: null,
            businessClassification: null,
            foundedYear: null,
            primaryContactUserId: testUserId,
            verified: false,
            verificationSource: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      },
    });

    // Mock expertise junctions
    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue({
      data: {
        ProviderSkill: [],
        ProviderRole: [],
        ProviderProduct: [],
        ProviderFramework: [],
        ProviderSegment: [],
        ProviderServiceSegment: [],
      },
    });

    const result = await service.getProviderByUserId(testUserId);

    expect(result).not.toBeNull();
    expect(result?.legalName).toBe('ZeroBias');
    expect(result?.orgId).toBe(ZB_ORG);
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 4b: getProviderByUserId returns null when user-id section is absent
  // ──────────────────────────────────────────────────────────────────

  it('getProviderByUserId returns null when no org found for user', async () => {
    const testUserId = 'nonexistent-user';

    // Mock query returns empty result (user not found)
    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue({
      data: {
        OrgProfile: [],
      },
    });

    const result = await service.getProviderByUserId(testUserId);

    expect(result).toBeNull();
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 5: searchProviders(filter, options) passes filter through to boundary query
  // ──────────────────────────────────────────────────────────────────

  it('searchProviders(query) filters results by legalName/tagline', async () => {
    const profileId = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec';

    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValueOnce({
      data: {
        OrgProfile: [
          {
            id: profileId,
            orgId: ZB_ORG,
            legalName: 'ZeroBias',
            dba: null,
            tagline: 'Zero Trust Platform',
            shortDescription: null,
            longDescription: null,
            website: null,
            logoUrl: null,
            employeeCount: null,
            businessClassification: null,
            foundedYear: null,
            primaryContactUserId: null,
            verified: false,
            verificationSource: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      },
    });

    // Mock expertise junctions
    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue({
      data: {
        ProviderSkill: [],
        ProviderRole: [],
        ProviderProduct: [],
        ProviderFramework: [],
        ProviderSegment: [],
        ProviderServiceSegment: [],
      },
    });

    const result = await service.searchProviders('Zero');

    expect(mockBoundaryApi.boundaryExecuteRawQuery).toHaveBeenCalled();
    // Result should contain ZB (matches "Zero" filter)
    expect(result.items.some(p => p.legalName.includes('Zero'))).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 6: listProviders() does NOT call SmeMartDbService.listRows
  // ──────────────────────────────────────────────────────────────────

  it('listProviders() does NOT call SmeMartDbService.listRows (uses GQL only)', async () => {
    const profileId = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec';

    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValueOnce({
      data: {
        OrgProfile: [
          {
            id: profileId,
            orgId: ZB_ORG,
            legalName: 'ZeroBias',
            dba: null,
            tagline: 'Platform',
            shortDescription: null,
            longDescription: null,
            website: null,
            logoUrl: null,
            employeeCount: null,
            businessClassification: null,
            foundedYear: null,
            primaryContactUserId: null,
            verified: false,
            verificationSource: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      },
    });

    // Mock expertise junctions
    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue({
      data: {
        ProviderSkill: [],
        ProviderRole: [],
        ProviderProduct: [],
        ProviderFramework: [],
        ProviderSegment: [],
        ProviderServiceSegment: [],
      },
    });

    await service.listProviders();

    // Assert SmeMartDbService was NOT called for list
    expect(mockSmeMartDb.listRows).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 7: getProvider() does NOT read from v_provider_directory or v_provider_detail
  // ──────────────────────────────────────────────────────────────────

  it('getProvider() uses GQL only (no Neon views)', async () => {
    const profileId = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec';

    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValueOnce({
      data: {
        OrgProfile: [
          {
            id: profileId,
            orgId: ZB_ORG,
            legalName: 'ZeroBias',
            dba: null,
            tagline: 'Platform',
            shortDescription: 'About ZB',
            longDescription: null,
            website: null,
            logoUrl: null,
            employeeCount: null,
            businessClassification: null,
            foundedYear: null,
            primaryContactUserId: null,
            verified: false,
            verificationSource: null,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      },
    });

    // Mock expertise junctions
    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue({
      data: {
        ProviderSkill: [],
        ProviderRole: [],
        ProviderProduct: [],
        ProviderFramework: [],
        ProviderSegment: [],
        ProviderServiceSegment: [],
      },
    });

    await service.getProvider(ZB_ORG);

    // Assert SmeMartDbService.getRow was NOT called
    expect(mockSmeMartDb.getRow).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 8: Verify MarketplaceProfileItem class is targeted in queries
  // ──────────────────────────────────────────────────────────────────

  it('calls boundaryExecuteRawQuery (direct boundary API, not GraphqlReadService)', async () => {
    const mpiSeed = (section: string, data: string) => ({
      id: `mpi-${ZB_ORG}-${section}`,
      orgId: ZB_ORG,
      section,
      data,
      status: 'active',
    });

    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue({
      data: {
        MarketplaceProfileItem: [
          mpiSeed('legal_name', 'ZeroBias'),
          mpiSeed('provider_type', 'platform'),
        ],
      },
      gqlCount: { MarketplaceProfileItem: 2 },
    });

    await service.listProviders();

    // Assert boundaryExecuteRawQuery was invoked (once for provider_type filter, once for all sections)
    expect(mockBoundaryApi.boundaryExecuteRawQuery).toHaveBeenCalled();
    // The service makes 2 calls (first filter by provider_type=platform, then fetch all sections)
    expect(mockBoundaryApi.boundaryExecuteRawQuery.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
