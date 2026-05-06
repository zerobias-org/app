/**
 * Unit Tests for ServiceOfferingsService (Pipeline + GraphQL Migration)
 *
 * Tests verify service works with mocked PipelineWriteService and GraphqlReadService.
 * All service methods should return data immediately (optimistic updates) without
 * waiting for GQL indexing.
 */

import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ServiceOfferingsService } from './service-offerings.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { SERVICE_OFFERING_FIELD_MAPPING } from '../field-mappings';
import { SERVICE_OFFERING_GQL_FIXTURE } from '../../test-helpers/gql-fixtures';
import { fakePipelineWriteService, fakeGraphqlReadService, fakeProjectContextService } from '../../test-helpers/angular';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ServiceOfferingsService (Pipeline + GraphQL)', () => {
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
    it('should query GQL for active service offerings', async () => {
      const mockResult = {
        items: [SERVICE_OFFERING_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
      };
      graphqlRead.query.mockResolvedValue(mockResult);

      const result = await service.listServices({ pageNumber: 1, pageSize: 50 });

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'ServiceOffering',
        expect.any(Array),
        expect.objectContaining({ filters: { isActive: '.eq.true' } }),
      );
      expect(result.items.length).toBe(1);
      expect(result.items[0]).toHaveProperty('title');
    });

    it('should return PagedResults with correct pagination', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [SERVICE_OFFERING_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
      });

      const result = await service.listServices({ pageNumber: 1, pageSize: 50 });

      expect(result).toHaveProperty('pageNumber', 1);
      expect(result).toHaveProperty('pageSize', 50);
      expect(result).toHaveProperty('count', 1);
    });

    it('should transform GQL responses to Neon shape (title not name)', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [SERVICE_OFFERING_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 50, totalCount: 1 },
      });

      const result = await service.listServices();

      // Result should use Neon shape with 'title' field, not GQL 'name'
      expect(result.items[0]).toHaveProperty('title');
      expect(result.items[0]).not.toHaveProperty('name');
      expect(result.items[0].title).toBe('HIPAA Compliance Audit and Documentation');
    });
  });

  describe('getServicesByProvider()', () => {
    it('should query GQL with providerId filter', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [SERVICE_OFFERING_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 100, totalCount: 1 },
      });

      const result = await service.getServicesByProvider('provider-001-uuid');

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'ServiceOffering',
        expect.any(Array),
        expect.objectContaining({
          filters: { providerId: '.eq.provider-001-uuid' },
        }),
      );
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
    });

    it('should return array (no pagination) of services', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [SERVICE_OFFERING_GQL_FIXTURE],
        page: { pageNumber: 1, pageSize: 100, totalCount: 1 },
      });

      const result = await service.getServicesByProvider('provider-001-uuid');

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('provider_id', 'provider-001-uuid');
    });
  });

  describe('createService()', () => {
    it('should push to Pipeline and return optimistic ServiceOffering with generated UUID', async () => {
      const result = await service.createService('provider-001-uuid', {
        title: 'New Service',
        description: 'Service description',
        category: 'compliance',
        subcategory: null,
        pricing_type: 'fixed',
        price: '5000',
        delivery_time: null,
        includes: null,
        requirements: null,
        is_active: true,
      });

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'ServiceOffering',
        expect.objectContaining({ name: 'New Service' }),
        [],
        'service-offerings.service:109',
      );
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title', 'New Service');
      expect(result).toHaveProperty('provider_id', 'provider-001-uuid');
    });

    it('should apply field mapping during Pipeline push', async () => {
      await service.createService('provider-001-uuid', {
        title: 'Test Service',
        description: null,
        category: 'compliance',
        subcategory: null,
        pricing_type: 'hourly',
        price: null,
        delivery_time: null,
        includes: null,
        requirements: null,
        is_active: true,
      });

      // Verify the pushed data has GQL field names (e.g., providerId not provider_id)
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'ServiceOffering',
        expect.objectContaining({
          providerId: 'provider-001-uuid',
          name: 'Test Service',
          pricingType: 'hourly',
        }),
        [],
        'service-offerings.service:109',
      );
    });

    it('should handle nullable fields with null defaults', async () => {
      const result = await service.createService('provider-001-uuid', {
        title: 'Service Without Optional Fields',
        description: null,
        category: 'compliance',
        subcategory: null,
        pricing_type: 'fixed',
        price: null,
        delivery_time: null,
        includes: null,
        requirements: null,
        is_active: true,
      });

      expect(result).toHaveProperty('description', null);
      expect(result).toHaveProperty('price', null);
      expect(result).toHaveProperty('delivery_time', null);
    });

    it('should surface error to user on Pipeline rejection', async () => {
      const mockError = new Error('Network failure');
      pipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

      await expect(
        service.createService('provider-001-uuid', {
          title: 'Test',
          description: null,
          category: 'compliance',
          subcategory: null,
          pricing_type: 'fixed',
          price: null,
          delivery_time: null,
          includes: null,
          requirements: null,
          is_active: true,
        })
      ).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save service offering'),
        'Dismiss',
        expect.any(Object)
      );
    });
  });

  describe('updateService()', () => {
    it('should fetch, merge, and push updates to Pipeline', async () => {
      graphqlRead.getById.mockResolvedValue(SERVICE_OFFERING_GQL_FIXTURE);

      const result = await service.updateService('svc-001-uuid-hipaa-audit', {
        is_active: false,
      });

      expect(graphqlRead.getById).toHaveBeenCalledWith('ServiceOffering', 'svc-001-uuid-hipaa-audit', expect.any(Array));
      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'ServiceOffering',
        expect.any(Object),
        [],
        'service-offerings.service:148',
      );
      expect(result).toHaveProperty('is_active', false);
    });

    it('should throw error if service not found', async () => {
      graphqlRead.getById.mockResolvedValue(null);

      await expect(service.updateService('nonexistent-id', { is_active: false })).rejects.toThrow(
        'ServiceOffering nonexistent-id not found',
      );
    });

    it('should surface error to user on Pipeline rejection', async () => {
      graphqlRead.getById.mockResolvedValue(SERVICE_OFFERING_GQL_FIXTURE);
      const mockError = new Error('Save failed');
      pipelineWrite.pushEntity.mockRejectedValueOnce(mockError);

      await expect(service.updateService('svc-001-uuid-hipaa-audit', { is_active: false })).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update service offering'),
        'Dismiss',
        expect.any(Object),
      );
    });
  });

  describe('deleteService()', () => {
    it('should call pipelineWrite.deleteEntity with ServiceOffering type and ID', async () => {
      await service.deleteService('svc-001-uuid-hipaa-audit');

      expect(pipelineWrite.deleteEntity).toHaveBeenCalledWith('ServiceOffering', 'svc-001-uuid-hipaa-audit');
    });

    it('should surface error to user on Pipeline rejection', async () => {
      const mockError = new Error('Delete failed');
      pipelineWrite.deleteEntity.mockRejectedValueOnce(mockError);

      await expect(service.deleteService('svc-001-uuid-hipaa-audit')).rejects.toThrow(mockError);

      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete service offering'),
        'Dismiss',
        expect.any(Object),
      );
    });
  });

  describe('field mapping roundtrip', () => {
    it('should correctly map Neon → GQL → Neon', () => {
      const neonOriginal = {
        id: 'svc-001',
        provider_id: 'provider-001',
        title: 'Test Service',
        description: 'Description',
        category: 'compliance',
        subcategory: 'healthcare',
        pricing_type: 'fixed' as const,
        price: '5000',
        delivery_time: '30 days',
        includes: ['item1', 'item2'],
        requirements: 'Requirement text',
        is_active: true,
        created_at: '2026-03-18T10:00:00Z',
        updated_at: '2026-03-18T11:00:00Z',
      };

      // Map Neon → GQL
      const gqlShape = SERVICE_OFFERING_FIELD_MAPPING.neonToGql;
      const gqlData: Record<string, unknown> = {};
      for (const [neonField, gqlField] of Object.entries(gqlShape)) {
        if (neonField in neonOriginal) {
          gqlData[gqlField] = (neonOriginal as unknown as Record<string, unknown>)[neonField];
        }
      }

      // Map GQL → Neon (reverse)
      const gqlReverseShape = SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon;
      const neonResult: Record<string, unknown> = {};
      for (const [gqlField, neonField] of Object.entries(gqlReverseShape)) {
        if (gqlField in gqlData) {
          neonResult[neonField] = gqlData[gqlField];
        }
      }

      // Verify roundtrip preserved all fields
      expect(neonResult['title']).toBe(neonOriginal.title);
      expect(neonResult['provider_id']).toBe(neonOriginal.provider_id);
      expect(neonResult['pricing_type']).toBe(neonOriginal.pricing_type);
      expect(neonResult['is_active']).toBe(neonOriginal.is_active);
    });
  });

  // ── Demo visibility (Phase 24 Plan 03) ──

  describe('Demo visibility (Phase 24 Plan 03)', () => {
    const mockGqlReturn = [
      { ...SERVICE_OFFERING_GQL_FIXTURE, id: '1', name: 'Real', tag: null },
      { ...SERVICE_OFFERING_GQL_FIXTURE, id: '2', name: 'Real w/ marketplace tag', tag: [{ value: 'a81cd320-243e-44eb-bdd9-9824019ef3dd' }] },
      { ...SERVICE_OFFERING_GQL_FIXTURE, id: '3', name: 'Demo (global)', tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }] },
      { ...SERVICE_OFFERING_GQL_FIXTURE, id: '4', name: 'Demo (legacy)', tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }] },
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
