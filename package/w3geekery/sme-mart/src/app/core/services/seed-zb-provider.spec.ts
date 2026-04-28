import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ZerobiasClientApi } from '@zerobias-com/zerobias-client';
import {
  SeedZbProviderService,
  SEED_SECTIONS,
  buildMPIRecord,
} from './seed-zb-provider';

describe('seed-zb-provider', () => {
  describe('buildMPIRecord', () => {
    it('builds deterministic id from orgId + section', () => {
      const r = buildMPIRecord({ section: 'legal_name', data: 'ZeroBias' });
      expect(r.id).toBe('mpi-57c741cf-a58e-5efc-bf2f-93c4f6cf76ec-legal_name');
      expect(r.orgId).toBe('57c741cf-a58e-5efc-bf2f-93c4f6cf76ec');
      expect(r.section).toBe('legal_name');
      expect(r.data).toBe('ZeroBias');
      expect(r.status).toBe('active');
      expect(r.name).toBe('MPI - ZeroBias - legal_name');
    });

    it('omits Object.tag entirely (option-b distinguisher)', () => {
      const r = buildMPIRecord({ section: 'provider_type', data: 'platform' });
      expect((r as unknown as Record<string, unknown>)['tag']).toBeUndefined();
    });
  });

  describe('SEED_SECTIONS', () => {
    it('includes provider_type=platform for option-b distinguisher', () => {
      const providerType = SEED_SECTIONS.find(s => s.section === 'provider_type');
      expect(providerType).toBeDefined();
      expect(providerType?.data).toBe('platform');
    });

    it('covers the 7 baseline company_info sections + provider_type', () => {
      const names = SEED_SECTIONS.map(s => s.section);
      expect(names).toEqual([
        'legal_name',
        'logo_url',
        'short_blurb',
        'long_description',
        'website',
        'years_in_business',
        'employee_count',
        'provider_type',
      ]);
    });
  });

  describe('SeedZbProviderService', () => {
    let service: SeedZbProviderService;
    let mockPipelineApi: { receive: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      mockPipelineApi = { receive: vi.fn().mockResolvedValue(undefined) };
      const mockClientApi = {
        platformClient: { getPipelineApi: () => mockPipelineApi },
      };
      TestBed.configureTestingModule({
        providers: [
          SeedZbProviderService,
          { provide: ZerobiasClientApi, useValue: mockClientApi },
        ],
      });
      service = TestBed.inject(SeedZbProviderService);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('exposes empirically-validated UAT class id and ZB org id', () => {
      expect(service.classId).toBe('7bcf86a5-91dc-520d-b9bf-e308b1078d46');
      expect(service.orgId).toBe('57c741cf-a58e-5efc-bf2f-93c4f6cf76ec');
    });

    it('declares the cleanup residue ids per CLEANUP-25', () => {
      expect(service.cleanupIds).toEqual([
        'mpi-test-a-cd7105df',
        'mpi-test-b-cd7105df',
      ]);
    });

    it('builds a SimpleBatch wrapping all 8 sections + cleanup ids', () => {
      const batch = service.buildBatch();
      // SimpleBatch shape varies by SDK version; both `data`/`items` accessors
      // observed in the field. Coerce to record bag for inspection.
      const bag = batch as unknown as Record<string, unknown>;
      const data = (bag['data'] ?? bag['items']) as Array<Record<string, unknown>>;
      const markDeleted = (bag['markDeleted'] ?? bag['deletedIds']) as string[];

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(8);
      const sections = data.map(r => r['section']);
      expect(sections).toContain('provider_type');
      expect(sections).toContain('legal_name');

      expect(markDeleted).toContain('mpi-test-a-cd7105df');
      expect(markDeleted).toContain('mpi-test-b-cd7105df');
    });

    it('seed() calls pipelineApi.receive with the batch', async () => {
      await service.seed();
      expect(mockPipelineApi.receive).toHaveBeenCalledTimes(1);
      const call = mockPipelineApi.receive.mock.calls[0];
      // Two-arg signature: (UUID(pipelineId), SimpleBatch)
      expect(call.length).toBe(2);
    });
  });
});
