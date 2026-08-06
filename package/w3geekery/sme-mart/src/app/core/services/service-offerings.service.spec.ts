/**
 * Unit Tests for ServiceOfferingsService (VendorListing over Pipeline + GraphQL)
 *
 * ServiceOffering was retired in smemart 2.0.8; this service now reads and writes
 * VendorListing. Tests verify the service works with mocked PipelineWriteService and
 * GraphqlReadService, returning data immediately (optimistic updates) without waiting
 * for GQL indexing.
 */

import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ServiceOfferingsService, mapGqlToVendorListing } from './service-offerings.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { VENDOR_LISTING_GQL_FIXTURE } from '../../test-helpers/gql-fixtures';
import { fakePipelineWriteService, fakeGraphqlReadService, fakeProjectContextService } from '../../test-helpers/angular';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ServiceOfferingsService (VendorListing over Pipeline + GraphQL)', () => {
  let service: ServiceOfferingsService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };
  let mockProjectContext: ReturnType<typeof fakeProjectContextService>;

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();
    mockSnackBar = { open: vi.fn() };
    mockProjectContext = fakeProjectContextService(false);

    TestBed.configureTestingModule({
      providers: [
        ServiceOfferingsService,
        DemoVisibilityService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: ProjectContextService, useValue: mockProjectContext },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });

    service = TestBed.inject(ServiceOfferingsService);
  });

  describe('listServices()', () => {
    it('should query GQL for buyer-visible listings via the active filter', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [VENDOR_LISTING_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
      });

      const result = await service.listServices({ pageNumber: 1, pageSize: 50 });

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'VendorListing',
        expect.any(Array),
        expect.objectContaining({ filters: { active: '.eq.true' } }),
      );
      expect(result.items.length).toBe(1);
      expect(result.items[0]).toHaveProperty('title');
    });

    it('should return PagedResults with correct pagination', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [VENDOR_LISTING_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
      });

      const result = await service.listServices({ pageNumber: 1, pageSize: 50 });

      expect(result).toHaveProperty('pageNumber', 1);
      expect(result).toHaveProperty('pageSize', 50);
      expect(result).toHaveProperty('count', 1);
    });

    it('should map GQL responses to the VendorListing model', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [VENDOR_LISTING_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
      });

      const result = await service.listServices();

      expect(result.items[0].title).toBe('HIPAA Compliance Audit and Documentation');
      expect(result.items[0]).toHaveProperty('ownerId', 'provider-001-uuid');
      expect(result.items[0]).not.toHaveProperty('provider_id');
    });
  });

  describe('getServicesByProvider()', () => {
    it('should query GQL with an ownerId filter', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [VENDOR_LISTING_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 100, totalCount: 1 },
      });

      const result = await service.getServicesByProvider('provider-001-uuid');

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'VendorListing',
        expect.any(Array),
        expect.objectContaining({
          filters: { ownerId: '.eq.provider-001-uuid' },
        }),
      );
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
    });

    it('should return array (no pagination) of listings', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [VENDOR_LISTING_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 100, totalCount: 1 },
      });

      const result = await service.getServicesByProvider('provider-001-uuid');

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('ownerId', 'provider-001-uuid');
    });
  });

  describe('createService()', () => {
    it('should push to Pipeline and return an optimistic listing with generated UUID', async () => {
      const result = await service.createService('provider-001-uuid', {
        title: 'New Service',
        summary: 'Listing summary',
        family: 'SERVICE',
        kind: 'BESPOKE_SERVICE',
      });

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'VendorListing',
        expect.objectContaining({ name: 'New Service', title: 'New Service' }),
        [],
        'service-offerings.service:createService',
      );
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title', 'New Service');
      expect(result).toHaveProperty('ownerId', 'provider-001-uuid');
    });

    it('should derive fulfillment from family rather than accepting it', async () => {
      const licensed = await service.createService('provider-001-uuid', {
        title: 'A framework',
        family: 'LICENSED_GOOD',
        kind: 'FRAMEWORK',
      });
      expect(licensed.fulfillment).toBe('ENTITLEMENT_GRANT');

      const bespoke = await service.createService('provider-001-uuid', {
        title: 'Bespoke work',
        family: 'SERVICE',
        kind: 'BESPOKE_SERVICE',
      });
      expect(bespoke.fulfillment).toBe('ENGAGEMENT');
    });

    it('should start a new listing at version 1 with no offers', async () => {
      const result = await service.createService('provider-001-uuid', {
        title: 'Listing Without Optional Fields',
        family: 'SERVICE',
        kind: 'BESPOKE_SERVICE',
      });

      expect(result).toHaveProperty('version', 1);
      expect(result.offers).toEqual([]);
      expect(result).toHaveProperty('summary', null);
      expect(result).toHaveProperty('deliveryTime', null);
    });

    it('should surface error to user on Pipeline rejection', async () => {
      const mockError = new Error('Network failure');
      pipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

      await expect(
        service.createService('provider-001-uuid', {
          title: 'Test',
          family: 'SERVICE',
          kind: 'BESPOKE_SERVICE',
        })
      ).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save listing'),
        'Dismiss',
        expect.any(Object)
      );
    });
  });

  describe('updateService()', () => {
    it('should fetch, merge, and push updates to Pipeline', async () => {
      graphqlRead.getById.mockResolvedValue(VENDOR_LISTING_GQL_FIXTURE);

      const result = await service.updateService('svc-001-uuid-hipaa-audit', {
        active: false,
      });

      expect(graphqlRead.getById).toHaveBeenCalledWith('VendorListing', 'svc-001-uuid-hipaa-audit', expect.any(Array));
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'VendorListing',
        expect.any(Object),
        [],
        'service-offerings.service:updateService',
      );
      expect(result).toHaveProperty('active', false);
    });

    it('should bump version on every update so a buyer can pin what they bought', async () => {
      graphqlRead.getById.mockResolvedValue(VENDOR_LISTING_GQL_FIXTURE);

      const result = await service.updateService('svc-001-uuid-hipaa-audit', { title: 'Renamed' });

      expect(result.version).toBe(2);
    });

    it('should throw error if listing not found', async () => {
      graphqlRead.getById.mockResolvedValue(null);

      await expect(service.updateService('nonexistent-id', { active: false })).rejects.toThrow(
        'VendorListing nonexistent-id not found',
      );
    });

    it('should surface error to user on Pipeline rejection', async () => {
      graphqlRead.getById.mockResolvedValue(VENDOR_LISTING_GQL_FIXTURE);
      const mockError = new Error('Save failed');
      pipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

      await expect(service.updateService('svc-001-uuid-hipaa-audit', { active: false })).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update listing'),
        'Dismiss',
        expect.any(Object),
      );
    });
  });

  describe('setActive()', () => {
    it('should map deactivation to SUSPENDED, not RETIRED', async () => {
      graphqlRead.getById.mockResolvedValue(VENDOR_LISTING_GQL_FIXTURE);

      const result = await service.setActive('svc-001-uuid-hipaa-audit', false);

      expect(result.active).toBe(false);
      expect(result.lifecycle).toBe('SUSPENDED');
    });

    it('should map reactivation to LISTED', async () => {
      graphqlRead.getById.mockResolvedValue(VENDOR_LISTING_GQL_FIXTURE);

      const result = await service.setActive('svc-001-uuid-hipaa-audit', true);

      expect(result.active).toBe(true);
      expect(result.lifecycle).toBe('LISTED');
    });
  });

  describe('deleteService()', () => {
    it('should call pipelineWrite.deleteEntity with VendorListing type and ID', async () => {
      await service.deleteService('svc-001-uuid-hipaa-audit');

      expect(pipelineWrite.deleteEntity).toHaveBeenCalledWith('VendorListing', 'svc-001-uuid-hipaa-audit');
    });

    it('should surface error to user on Pipeline rejection', async () => {
      const mockError = new Error('Delete failed');
      pipelineWrite.deleteEntity.mockRejectedValueOnce(mockError);

      await expect(service.deleteService('svc-001-uuid-hipaa-audit')).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete listing'),
        'Dismiss',
        expect.any(Object),
      );
    });
  });

  describe('mapGqlToVendorListing()', () => {
    it('should fall back to the Object-inherited name when title is absent', () => {
      const listing = mapGqlToVendorListing({
        id: 'x',
        name: 'Inherited name',
      });

      expect(listing.title).toBe('Inherited name');
    });

    it('should normalize a single offer object into an array', () => {
      const listing = mapGqlToVendorListing({
        id: 'x',
        name: 'x',
        offers: { offerId: 'offer-1', label: 'Fixed' },
      });

      expect(listing.offers).toEqual([{ offerId: 'offer-1', label: 'Fixed' }]);
    });

    it('should default absent enums rather than emitting undefined', () => {
      const listing = mapGqlToVendorListing({ id: 'x', name: 'x' });

      expect(listing.family).toBe('SERVICE');
      expect(listing.kind).toBe('BESPOKE_SERVICE');
      expect(listing.lifecycle).toBe('DRAFT');
      expect(listing.active).toBe(false);
      expect(listing.offers).toEqual([]);
    });
  });

  // ── Demo visibility (Phase 24 Plan 03) ──

  describe('Demo visibility (Phase 24 Plan 03)', () => {
    const mockGqlReturn = [
      { ...VENDOR_LISTING_GQL_FIXTURE, id: '1', name: 'Real', tag: null },
      { ...VENDOR_LISTING_GQL_FIXTURE, id: '2', name: 'Real w/ marketplace tag', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }] },
      { ...VENDOR_LISTING_GQL_FIXTURE, id: '3', name: 'Demo (global)', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] },
      { ...VENDOR_LISTING_GQL_FIXTURE, id: '4', name: 'Demo (legacy)', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }] },
    ];

    it('[DG-02] strips demo records for non-admin', async () => {
      graphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listServices();

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2']);
    });

    it('[DG-03] admin sees all records including demo', async () => {
      mockProjectContext.setIsAdmin(true);
      graphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      const result = await service.listServices();

      expect(result.items.map((r: { id?: string }) => r.id)).toEqual(['1', '2', '3', '4']);
    });

    it('[DG-02] does NOT add server-side tag negation filter', async () => {
      graphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      await service.listServices();

      const callArgs = graphqlRead.query.mock.calls[0];
      const filters = (callArgs[2] as { filters?: Record<string, string> })?.filters ?? {};
      const filterValues = Object.values(filters).join(' ');
      expect(filterValues).not.toContain('.not in.');
      expect(filterValues).not.toContain('.ne.');
    });

    it('requests tag field in GQL query', async () => {
      graphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 50, totalCount: 4 },
      });

      await service.listServices();

      const fields = graphqlRead.query.mock.calls[0][1] as string[];
      expect(fields).toContain('tag');
    });

    it('[DG-02] strips demo records for non-admin in getServicesByProvider', async () => {
      graphqlRead.query.mockResolvedValue({
        items: mockGqlReturn,
        page: { pageNumber: 1, pageSize: 100, totalCount: 4 },
      });

      const result = await service.getServicesByProvider('provider-1');

      expect(result.map((r: { id?: string }) => r.id)).toEqual(['1', '2']);
    });
  });
});
