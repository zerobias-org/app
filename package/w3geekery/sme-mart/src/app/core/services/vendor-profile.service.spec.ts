/**
 * Unit Tests for VendorProfileService (Plan 041 — Vendor Profile Service)
 *
 * Tests verify CRUD operations, field mapping, JSON serialization, and error handling.
 */

import { TestBed } from '@angular/core/testing';
import { VendorProfileService } from './vendor-profile.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { fakePipelineWriteService, fakeGraphqlReadService } from '../../test-helpers/angular';
import type { GqlMarketplaceProfileItemResponse } from '../gql-types/marketplace-profile-item.types';
import type { MarketplaceProfileItem, InsuranceData, AttestationData, CorporateIdentityData } from '../models/marketplace-profile-item.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Test Fixtures ──

function createMockInsuranceData(): InsuranceData {
  return {
    policyNumber: 'POL-2024-001',
    carrier: 'Zurich North America',
    coverageType: 'general_liability',
    coverageAmount: 2000000,
    effectiveDate: '2024-01-01',
    expirationDate: '2025-12-31',
    limits: '2M/5M/2M',
    deductible: 5000,
  };
}

function createMockAttestationData(): AttestationData {
  return {
    serviceType: 'security_audit',
    yearsExperience: 12,
    clientCount: 45,
    avgProjectDuration: '8 weeks',
    certifications: ['ISO 27001', 'CEH'],
    specializations: ['cloud_security'],
  };
}

function createMockCorporateIdentityData(): CorporateIdentityData {
  return {
    legalEntityName: 'Acme Security LLC',
    businessType: 'llc',
    foundedYear: 2015,
    yearsInBusiness: 9,
    certifications: ['ISO 27001'],
    numberOfEmployees: 42,
  };
}

function createMockGqlItem(
  overrides?: Partial<GqlMarketplaceProfileItemResponse>,
): GqlMarketplaceProfileItemResponse {
  return {
    id: 'profile-001',
    orgId: 'org-001',
    name: 'Insurance Profile',
    description: 'D&O insurance coverage',
    section: 'insurance',
    data: JSON.stringify(createMockInsuranceData()),
    expiresAt: '2026-12-31T23:59:59Z',
    status: 'active',
    dateCreated: '2026-03-18T10:00:00Z',
    dateLastModified: '2026-03-18T10:00:00Z',
    ...overrides,
  };
}

describe('VendorProfileService', () => {
  let service: VendorProfileService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();

    TestBed.configureTestingModule({
      providers: [
        VendorProfileService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
      ],
    });

    service = TestBed.inject(VendorProfileService);
  });

  // ── listProfileItems ──

  describe('listProfileItems()', () => {
    it('should return list of profile items for given orgId', async () => {
      const fixture1 = createMockGqlItem({ id: 'profile-001' });
      const fixture2 = createMockGqlItem({ id: 'profile-002', name: 'Attestation' });

      graphqlRead.query.mockResolvedValue({
        items: [fixture1, fixture2],
        page: { pageNumber: 1, pageSize: 200, totalCount: 2 },
      });

      const result = await service.listProfileItems('org-001');

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'MarketplaceProfileItem',
        expect.any(Array),
        expect.objectContaining({
          filters: { orgId: '.eq.org-001' },
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Attestation'); // Sorted alphabetically
    });

    it('should return filtered list when section parameter provided', async () => {
      const fixture = createMockGqlItem({ section: 'attestation' });
      graphqlRead.query.mockResolvedValue({
        items: [fixture],
        page: { pageNumber: 1, pageSize: 200, totalCount: 1 },
      });

      const result = await service.listProfileItems('org-001', 'attestation');

      expect(graphqlRead.query).toHaveBeenCalledWith(
        'MarketplaceProfileItem',
        expect.any(Array),
        expect.objectContaining({
          filters: expect.objectContaining({
            orgId: '.eq.org-001',
            section: '.eq.attestation',
          }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].section).toBe('attestation');
    });

    it('should filter out soft-deleted items', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [
          createMockGqlItem(),
          { ...createMockGqlItem(), dateDeleted: '2026-03-20' } as any,
        ],
        page: { pageNumber: 1, pageSize: 200, totalCount: 2 },
      });

      const result = await service.listProfileItems('org-001');

      expect(result).toHaveLength(1);
    });

    it('should parse JSON data field for each item', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [createMockGqlItem()],
        page: { pageNumber: 1, pageSize: 200, totalCount: 1 },
      });

      const result = await service.listProfileItems('org-001');

      expect(result[0].data).toBeTruthy();
      const parsed = JSON.parse(result[0].data) as InsuranceData;
      expect(parsed.policyNumber).toBe('POL-2024-001');
    });

    it('should return empty array when no items found', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 200, totalCount: 0 },
      });

      const result = await service.listProfileItems('org-001');

      expect(result).toHaveLength(0);
    });
  });

  // ── getProfileItem ──

  describe('getProfileItem()', () => {
    it('should return cached item if available', async () => {
      const gqlFixture = createMockGqlItem();
      pipelineWrite.getCached.mockReturnValue(gqlFixture as any);

      const result = await service.getProfileItem('profile-001');

      expect(result?.id).toBe('profile-001');
      expect(graphqlRead.getById).not.toHaveBeenCalled();
    });

    it('should fetch from GQL if not cached', async () => {
      const gqlFixture = createMockGqlItem();
      pipelineWrite.getCached.mockReturnValue(null);
      graphqlRead.getById.mockResolvedValue(gqlFixture);

      const result = await service.getProfileItem('profile-001');

      expect(result?.id).toBe('profile-001');
      expect(graphqlRead.getById).toHaveBeenCalledWith(
        'MarketplaceProfileItem',
        'profile-001',
        expect.any(Array),
      );
    });

    it('should return null if item not found', async () => {
      pipelineWrite.getCached.mockReturnValue(null);
      graphqlRead.getById.mockResolvedValue(null);

      const result = await service.getProfileItem('nonexistent');

      expect(result).toBeNull();
    });

    it('should seed cache after fetch', async () => {
      const gqlFixture = createMockGqlItem();
      pipelineWrite.getCached.mockReturnValue(null);
      graphqlRead.getById.mockResolvedValue(gqlFixture);

      await service.getProfileItem('profile-001');

      expect(pipelineWrite.seedCache).toHaveBeenCalledWith(
        'MarketplaceProfileItem',
        'profile-001',
        expect.any(Object),
      );
    });
  });

  // ── createProfileItem ──

  describe('createProfileItem()', () => {
    it('should validate required fields (name, section)', async () => {
      await expect(
        service.createProfileItem('org-001', {
          section: 'insurance',
          name: '',
          data: createMockInsuranceData(),
        }),
      ).rejects.toThrow('name is required');

      await expect(
        service.createProfileItem('org-001', {
          section: 'insurance',
          name: 'Test',
          data: createMockInsuranceData(),
        } as any),
      ).resolves.toBeTruthy(); // Should not throw
    });

    it('should validate section is one of 6 valid values', async () => {
      await expect(
        service.createProfileItem('org-001', {
          section: 'invalid_section' as any,
          name: 'Test',
          data: createMockInsuranceData(),
        }),
      ).rejects.toThrow('Invalid section');
    });

    it('should generate UUID for new item', async () => {
      const result = await service.createProfileItem('org-001', {
        section: 'insurance',
        name: 'Test',
        data: createMockInsuranceData(),
      });

      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should serialize section data to JSON', async () => {
      const result = await service.createProfileItem('org-001', {
        section: 'insurance',
        name: 'Test',
        data: createMockInsuranceData(),
      });

      expect(typeof result.data).toBe('string');
      const parsed = JSON.parse(result.data) as InsuranceData;
      expect(parsed.policyNumber).toBe('POL-2024-001');
    });

    it('should call pushEntity with correct class ID', async () => {
      await service.createProfileItem('org-001', {
        section: 'insurance',
        name: 'Test Item',
        data: createMockInsuranceData(),
      });

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'MarketplaceProfileItem',
        expect.objectContaining({
          name: 'Test Item',
          section: 'insurance',
        }),
      );
    });

    it('should return created item with all fields', async () => {
      const result = await service.createProfileItem('org-001', {
        section: 'insurance',
        name: 'Test Item',
        description: 'Test description',
        data: createMockInsuranceData(),
        expiresAt: '2026-12-31',
        status: 'active',
      });

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Test Item');
      expect(result.org_id).toBe('org-001');
      expect(result.section).toBe('insurance');
      expect(result.status).toBe('active');
      expect(result.expires_at).toBe('2026-12-31');
      expect(result.created_at).toBeTruthy();
      expect(result.updated_at).toBeTruthy();
    });
  });

  // ── updateProfileItem ──

  describe('updateProfileItem()', () => {
    beforeEach(() => {
      pipelineWrite.getCached.mockReturnValue(null);
    });

    it('should fetch current item before update', async () => {
      const fixture = createMockGqlItem();
      graphqlRead.getById.mockResolvedValue(fixture);

      await service.updateProfileItem('profile-001', { name: 'Updated' });

      expect(graphqlRead.getById).toHaveBeenCalledWith(
        'MarketplaceProfileItem',
        'profile-001',
        expect.any(Array),
      );
    });

    it('should merge partial update into current item', async () => {
      const fixture = createMockGqlItem({
        name: 'Original',
        description: 'Original description',
      });
      graphqlRead.getById.mockResolvedValue(fixture);

      const result = await service.updateProfileItem('profile-001', {
        name: 'Updated',
      });

      expect(result.name).toBe('Updated');
      expect(result.description).toBe('Original description');
    });

    it('should re-serialize data if provided in update', async () => {
      const fixture = createMockGqlItem({
        data: JSON.stringify(createMockInsuranceData()),
      });
      graphqlRead.getById.mockResolvedValue(fixture);

      const newData = createMockAttestationData();
      const result = await service.updateProfileItem('profile-001', {
        data: newData,
      });

      const parsed = JSON.parse(result.data) as AttestationData;
      expect(parsed.serviceType).toBe('security_audit');
    });

    it('should call pushEntity with full object', async () => {
      const fixture = createMockGqlItem();
      graphqlRead.getById.mockResolvedValue(fixture);

      await service.updateProfileItem('profile-001', { status: 'archived' });

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'MarketplaceProfileItem',
        expect.objectContaining({
          id: 'profile-001',
          status: 'archived',
        }),
      );
    });

    it('should return updated item', async () => {
      const fixture = createMockGqlItem();
      graphqlRead.getById.mockResolvedValue(fixture);

      const result = await service.updateProfileItem('profile-001', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(result.id).toBe('profile-001');
    });
  });

  // ── deleteProfileItem ──

  describe('deleteProfileItem()', () => {
    beforeEach(() => {
      pipelineWrite.getCached.mockReturnValue(null);
    });

    it('should fetch current item', async () => {
      const fixture = createMockGqlItem();
      graphqlRead.getById.mockResolvedValue(fixture);

      await service.deleteProfileItem('profile-001');

      expect(graphqlRead.getById).toHaveBeenCalledWith(
        'MarketplaceProfileItem',
        'profile-001',
        expect.any(Array),
      );
    });

    it('should mark for deletion via dateDeleted', async () => {
      const fixture = createMockGqlItem();
      graphqlRead.getById.mockResolvedValue(fixture);

      await service.deleteProfileItem('profile-001');

      expect(pipelineWrite.pushEntity).toHaveBeenCalledWith(
        'MarketplaceProfileItem',
        expect.objectContaining({
          dateDeleted: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        }),
      );
    });

    it('should return successfully', async () => {
      const fixture = createMockGqlItem();
      graphqlRead.getById.mockResolvedValue(fixture);

      await expect(service.deleteProfileItem('profile-001')).resolves.toBeUndefined();
    });
  });

  // ── Field Mapping ──

  describe('Field Mapping', () => {
    it('should apply camelCase→snake_case mapping (fromGql)', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [createMockGqlItem()],
        page: { pageNumber: 1, pageSize: 200, totalCount: 1 },
      });

      const result = await service.listProfileItems('org-001');
      const item = result[0];

      expect(item).toHaveProperty('org_id', 'org-001');
      expect(item).toHaveProperty('created_at');
      expect(item).toHaveProperty('updated_at');
      expect(item).not.toHaveProperty('orgId');
      expect(item).not.toHaveProperty('dateCreated');
    });

    it('should apply snake_case→camelCase mapping (toGql)', async () => {
      await service.createProfileItem('org-001', {
        section: 'insurance',
        name: 'Test',
        data: createMockInsuranceData(),
      });

      const call = pipelineWrite.pushEntity.mock.calls[0];
      const pushed = call[1] as Record<string, unknown>;

      expect(pushed).toHaveProperty('orgId');
      expect(pushed).not.toHaveProperty('org_id');
    });

    it('should preserve all fields in bidirectional round-trip', async () => {
      const gqlFixture = createMockGqlItem({
        id: 'profile-round-trip',
        orgId: 'org-test',
        section: 'corporate_identity',
        name: 'Test Name',
        description: 'Test Desc',
        status: 'active',
        expiresAt: '2026-12-31',
      });
      graphqlRead.getById.mockResolvedValue(gqlFixture);

      const domain = await service.getProfileItem('profile-round-trip');
      if (!domain) throw new Error('Item not found');

      // Verify domain has snake_case fields
      expect(domain.org_id).toBe('org-test');
      expect(domain.name).toBe('Test Name');
      expect(domain.section).toBe('corporate_identity');

      // Update (triggers toGql transformation)
      await service.updateProfileItem('profile-round-trip', { status: 'archived' });

      // Verify Pipeline push had camelCase fields
      const call = pipelineWrite.pushEntity.mock.calls[0];
      const pushed = call[1] as Record<string, unknown>;
      expect(pushed['orgId']).toBe('org-test');
      expect(pushed['name']).toBe('Test Name');
    });
  });

  // ── Error Handling ──

  describe('Error Handling', () => {
    it('should handle malformed JSON in data field', async () => {
      const malformed = createMockGqlItem({
        data: 'not json',
      });
      graphqlRead.query.mockResolvedValue({
        items: [malformed],
        page: { pageNumber: 1, pageSize: 200, totalCount: 1 },
      });

      const result = await service.listProfileItems('org-001');

      // Service keeps raw data string — consumer handles parse errors
      expect(result[0].data).toBe('not json');
    });

    it('should throw ValidationError for invalid section', async () => {
      await expect(
        service.createProfileItem('org-001', {
          section: 'invalid' as any,
          name: 'Test',
          data: createMockInsuranceData(),
        }),
      ).rejects.toThrow('Invalid section');
    });

    it('should throw ValidationError for missing name', async () => {
      await expect(
        service.createProfileItem('org-001', {
          section: 'insurance',
          name: '   ',
          data: createMockInsuranceData(),
        }),
      ).rejects.toThrow('name is required');
    });

    it('should propagate GQL query errors', async () => {
      graphqlRead.query.mockRejectedValue(new Error('GQL Error'));

      await expect(service.listProfileItems('org-001')).rejects.toThrow('GQL Error');
    });

    it('should throw error when updating nonexistent item', async () => {
      pipelineWrite.getCached.mockReturnValue(null);
      graphqlRead.getById.mockResolvedValue(null);

      await expect(service.updateProfileItem('nonexistent', { name: 'Test' })).rejects.toThrow('not found');
    });
  });
});
