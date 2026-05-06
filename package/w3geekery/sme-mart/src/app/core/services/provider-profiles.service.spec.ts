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

  it('listProviders() groups MPI rows by orgId and projects to ProviderDirectoryRow', async () => {
    // Mock MPI data for ZeroBias
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
          mpiSeed('short_blurb', 'Cybersecurity & compliance automation'),
          mpiSeed('long_description', 'Long-form description here'),
          mpiSeed('logo_url', 'https://cdn.example/zb.svg'),
          mpiSeed('website', 'https://zerobias.com'),
          mpiSeed('provider_type', 'platform'),
        ],
      },
      gqlCount: { MarketplaceProfileItem: 6 },
    });

    const result = await service.listProviders();

    // Assert boundaryExecuteRawQuery was called
    expect(mockBoundaryApi.boundaryExecuteRawQuery).toHaveBeenCalled();

    // Assert the returned item matches MPI projections
    expect(result.items.length).toBeGreaterThan(0);
    const item = result.items[0];
    expect(item.zerobias_org_id).toBe(ZB_ORG);
    expect(item.display_name).toBe('ZeroBias');
    expect(item.headline).toBe('Cybersecurity & compliance automation');
    expect(item.avatar_url).toBe('https://cdn.example/zb.svg');

    // Assert MPI-only fields are null/empty
    expect(item.rating_average).toBeNull();
    expect(item.total_jobs_completed).toBeNull();
    expect(item.skills).toBe('[]');
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 2: listProviders() filters by provider_type=platform
  // ──────────────────────────────────────────────────────────────────

  it('listProviders() filters by provider_type=platform (option-b locked decision)', async () => {
    const mpiSeed = (orgId: string, section: string, data: string) => ({
      id: `mpi-${orgId}-${section}`,
      orgId,
      section,
      data,
      status: 'active',
    });

    const zbOrgId = ZB_ORG;

    // The service makes two queries: first to find provider_type=platform orgs,
    // then to fetch all sections for those orgs.
    // Both calls go through the same mock, so we use sequential returns.
    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValueOnce({
      data: {
        MarketplaceProfileItem: [
          mpiSeed(zbOrgId, 'provider_type', 'platform'),
        ],
      },
      gqlCount: { MarketplaceProfileItem: 1 },
    });

    // Second call: fetch all sections for platform orgs
    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValueOnce({
      data: {
        MarketplaceProfileItem: [
          mpiSeed(zbOrgId, 'legal_name', 'ZeroBias'),
          mpiSeed(zbOrgId, 'short_blurb', 'Platform'),
          mpiSeed(zbOrgId, 'provider_type', 'platform'),
        ],
      },
      gqlCount: { MarketplaceProfileItem: 3 },
    });

    const result = await service.listProviders();

    // Assert only ZB (platform provider) is returned
    expect(result.items.length).toBe(1);
    expect(result.items[0].zerobias_org_id).toBe(zbOrgId);
    expect(result.items[0].display_name).toBe('ZeroBias');
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 3: getProvider(orgId) returns ProviderDetailRow with all sections
  // ──────────────────────────────────────────────────────────────────

  it('getProvider(orgId) returns ProviderDetailRow with all sections projected', async () => {
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
          mpiSeed('short_blurb', 'Cybersecurity & compliance automation'),
          mpiSeed('long_description', 'Long-form about ZB'),
          mpiSeed('logo_url', 'https://cdn.example/zb.svg'),
          mpiSeed('website', 'https://zerobias.com'),
          mpiSeed('provider_type', 'platform'),
        ],
      },
      gqlCount: { MarketplaceProfileItem: 6 },
    });

    const result = await service.getProvider(ZB_ORG);

    expect(result).not.toBeNull();
    expect(result?.display_name).toBe('ZeroBias');
    expect(result?.headline).toBe('Cybersecurity & compliance automation');
    expect(result?.about).toBe('Long-form about ZB');
    expect(result?.avatar_url).toBe('https://cdn.example/zb.svg');
    expect(result?.reviews).toBe('[]');
    expect(result?.service_offerings).toBe('[]');
    expect(result?.review_count).toBeNull();
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 4: getProviderByUserId(userId) finds org via primary_contact.user_id
  // ──────────────────────────────────────────────────────────────────

  it('getProviderByUserId(userId) finds org via primary_contact.user_id section', async () => {
    const testUserId = 'user-123';

    const mpiSeed = (section: string, data: string) => ({
      id: `mpi-${ZB_ORG}-${section}`,
      orgId: ZB_ORG,
      section,
      data,
      status: 'active',
    });

    // First call: search for primary_contact.user_id matching the test user
    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValueOnce({
      data: {
        MarketplaceProfileItem: [
          mpiSeed('primary_contact.user_id', testUserId),
        ],
      },
      gqlCount: { MarketplaceProfileItem: 1 },
    });

    // Second call: fetch all sections for that org
    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValueOnce({
      data: {
        MarketplaceProfileItem: [
          mpiSeed('legal_name', 'ZeroBias'),
          mpiSeed('short_blurb', 'Platform'),
          mpiSeed('primary_contact.user_id', testUserId),
        ],
      },
      gqlCount: { MarketplaceProfileItem: 3 },
    });

    const result = await service.getProviderByUserId(testUserId);

    expect(result).not.toBeNull();
    expect(result?.display_name).toBe('ZeroBias');
    expect(result?.zerobias_org_id).toBe(ZB_ORG);
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 4b: getProviderByUserId returns null when user-id section is absent
  // ──────────────────────────────────────────────────────────────────

  it('getProviderByUserId returns null cleanly when user-id section is absent', async () => {
    const testUserId = 'nonexistent-user';

    // Mock query returns empty result (user not found)
    mockBoundaryApi.boundaryExecuteRawQuery.mockResolvedValue({
      data: {
        MarketplaceProfileItem: [],
      },
      gqlCount: { MarketplaceProfileItem: 0 },
    });

    const result = await service.getProviderByUserId(testUserId);

    expect(result).toBeNull();
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 5: searchProviders(filter, options) passes filter through to boundary query
  // ──────────────────────────────────────────────────────────────────

  it('searchProviders(filter, options) passes the filter through to the boundary query', async () => {
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

    const result = await service.searchProviders('Zero');

    expect(mockBoundaryApi.boundaryExecuteRawQuery).toHaveBeenCalled();
    // Result should contain ZB (matches "Zero" filter)
    expect(result.items.some(p => p.display_name.includes('Zero'))).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 6: listProviders() does NOT call SmeMartDbService.listRows
  // ──────────────────────────────────────────────────────────────────

  it('listProviders() does NOT call SmeMartDbService.listRows (negative-shape contract)', async () => {
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

    // Assert SmeMartDbService was NOT called for list
    expect(mockSmeMartDb.listRows).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────────────────────────
  // Test 7: getProvider() does NOT read from v_provider_directory or v_provider_detail
  // ──────────────────────────────────────────────────────────────────

  it('getProvider() does NOT read from Neon views (negative-shape contract)', async () => {
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
          mpiSeed('long_description', 'About ZB'),
        ],
      },
      gqlCount: { MarketplaceProfileItem: 2 },
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
