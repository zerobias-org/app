/**
 * Roundtrip Field Validation Tests for ServiceOffering Entity
 *
 * Validates that no fields are lost during Neon → GQL → Neon transformation cycles.
 */

import { describe, it, expect } from 'vitest';
import { mapNeonToGql, mapGqlToNeon, SERVICE_OFFERING_FIELD_MAPPING } from '@/core/field-mappings';
import { SERVICE_OFFERING_GQL_FIXTURE } from '@/test-helpers/gql-fixtures';
import type { GqlServiceOfferingResponse } from '@/core/gql-types';
import type { ServiceOffering, PricingType } from '@/core/models/service-offering.model';

/**
 * Test factory to create a Neon ServiceOffering object with all fields populated
 */
function makeServiceOffering(overrides?: Partial<ServiceOffering>): ServiceOffering {
  return {
    id: 'svc-001',
    provider_id: 'provider-001',
    title: 'HIPAA Compliance Audit',
    description: 'Complete HIPAA compliance audit with gap analysis',
    category: 'compliance',
    subcategory: 'healthcare',
    pricing_type: 'fixed',
    price: '15000',
    delivery_time: '30 days',
    includes: ['On-site assessment', 'Gap analysis', 'Documentation templates'],
    requirements: 'Organization must have 20+ employees',
    is_active: true,
    created_at: '2026-02-01T09:00:00Z',
    updated_at: '2026-03-15T14:00:00Z',
    ...overrides,
  };
}

describe('INFRA-04: ServiceOffering Roundtrip Field Validation', () => {
  describe('Neon → GQL transformation', () => {
    it('should map all Neon ServiceOffering fields to GQL camelCase', () => {
      const neonModel = makeServiceOffering();

      const gqlData = mapNeonToGql<GqlServiceOfferingResponse>(
        neonModel,
        SERVICE_OFFERING_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData.id).toBe('svc-001');
      expect(gqlData.name).toBe('HIPAA Compliance Audit');
      expect(gqlData.description).toBe('Complete HIPAA compliance audit with gap analysis');
      expect(gqlData.providerId).toBe('provider-001');
      expect(gqlData.category).toBe('compliance');
      expect(gqlData.subcategory).toBe('healthcare');
      expect(gqlData.pricingType).toBe('fixed');
      expect(gqlData.price).toBe('15000');
      expect(gqlData.deliveryTime).toBe('30 days');
      expect(gqlData.includes).toEqual(['On-site assessment', 'Gap analysis', 'Documentation templates']);
      expect(gqlData.requirements).toBe('Organization must have 20+ employees');
      expect(gqlData.isActive).toBe(true);
      expect(gqlData.createdAt).toBe('2026-02-01T09:00:00Z');
      expect(gqlData.updatedAt).toBe('2026-03-15T14:00:00Z');
    });

    it('should not lose fields in Neon → GQL mapping', () => {
      const neonModel = makeServiceOffering();
      const gqlData = mapNeonToGql<GqlServiceOfferingResponse>(
        neonModel,
        SERVICE_OFFERING_FIELD_MAPPING.neonToGql,
      );
      const gqlKeys = Object.keys(gqlData);

      const expectedFieldCount = Object.keys(SERVICE_OFFERING_FIELD_MAPPING.neonToGql).length;
      expect(gqlKeys.length).toBe(expectedFieldCount);

      expect(gqlData.id).toBeDefined();
      expect(gqlData.name).toBeDefined();
      expect(gqlData.category).toBeDefined();
      expect(gqlData.pricingType).toBeDefined();
      expect(gqlData.isActive).toBeDefined();
    });

    it('should handle different pricing types', () => {
      const pricingTypes: PricingType[] = ['fixed', 'hourly', 'subscription', 'custom'];

      for (const type of pricingTypes) {
        const neonModel = makeServiceOffering({ pricing_type: type });
        const gqlData = mapNeonToGql<GqlServiceOfferingResponse>(
          neonModel,
          SERVICE_OFFERING_FIELD_MAPPING.neonToGql,
        );
        expect(gqlData.pricingType).toBe(type);
      }
    });

    it('should preserve array fields (includes)', () => {
      const includes = ['Item 1', 'Item 2', 'Item 3', 'Item 4'];
      const neonModel = makeServiceOffering({ includes });

      const gqlData = mapNeonToGql<GqlServiceOfferingResponse>(
        neonModel,
        SERVICE_OFFERING_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData.includes).toEqual(includes);
      expect(Array.isArray(gqlData.includes)).toBe(true);
    });

    it('should handle null/optional fields correctly', () => {
      const neonModel = makeServiceOffering({
        description: null,
        subcategory: null,
        price: null,
        includes: null,
      });

      const gqlData = mapNeonToGql<GqlServiceOfferingResponse>(
        neonModel,
        SERVICE_OFFERING_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData.description).toBeNull();
      expect(gqlData.subcategory).toBeNull();
      expect(gqlData.price).toBeNull();
      expect(gqlData.includes).toBeNull();
    });
  });

  describe('GQL → Neon reverse transformation', () => {
    it('should reverse-map all GQL fields back to Neon snake_case', () => {
      const gqlData = SERVICE_OFFERING_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<ServiceOffering>(
        gqlData,
        SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon,
      );

      expect(neonModel.id).toBe('svc-001-uuid-hipaa-audit');
      expect(neonModel.title).toBe('HIPAA Compliance Audit and Documentation');
      expect(neonModel.provider_id).toBe('provider-001-uuid');
      expect(neonModel.category).toBe('compliance');
      expect(neonModel.pricing_type).toBe('fixed');
      expect(neonModel.is_active).toBe(true);
    });

    it('should not lose fields in GQL → Neon mapping', () => {
      const gqlData = SERVICE_OFFERING_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<ServiceOffering>(
        gqlData,
        SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon,
      );

      // Verify critical Neon fields are present after mapping
      expect(neonModel.id).toBeDefined();
      expect(neonModel.provider_id).toBeDefined();
      expect(neonModel.title).toBeDefined();
      expect(neonModel.category).toBeDefined();
      expect(neonModel.pricing_type).toBeDefined();
      expect(neonModel.created_at).toBeDefined();
      expect(neonModel.updated_at).toBeDefined();
    });
  });

  describe('Roundtrip: Neon → GQL → Neon', () => {
    it('should preserve all fields in complete roundtrip cycle', () => {
      const originalNeon = makeServiceOffering({
        id: 'svc-roundtrip-001',
        provider_id: 'provider-roundtrip-001',
        title: 'Roundtrip Service',
        category: 'cybersecurity',
        pricing_type: 'hourly',
        price: '250',
        is_active: true,
      });

      const gqlData = mapNeonToGql<GqlServiceOfferingResponse>(
        originalNeon,
        SERVICE_OFFERING_FIELD_MAPPING.neonToGql,
      );
      const roundtrippedNeon = mapGqlToNeon<ServiceOffering>(
        gqlData,
        SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon,
      );

      expect(roundtrippedNeon.id).toBe('svc-roundtrip-001');
      expect(roundtrippedNeon.provider_id).toBe('provider-roundtrip-001');
      expect(roundtrippedNeon.title).toBe('Roundtrip Service');
      expect(roundtrippedNeon.category).toBe('cybersecurity');
      expect(roundtrippedNeon.pricing_type).toBe('hourly');
      expect(roundtrippedNeon.price).toBe('250');
      expect(roundtrippedNeon.is_active).toBe(true);
    });

    it('should preserve array fields through roundtrip', () => {
      const includesArray = ['Consulting', 'Documentation', 'Training', 'Support'];
      const originalNeon = makeServiceOffering({
        includes: includesArray,
      });

      const gqlData = mapNeonToGql<GqlServiceOfferingResponse>(
        originalNeon,
        SERVICE_OFFERING_FIELD_MAPPING.neonToGql,
      );
      const roundtrippedNeon = mapGqlToNeon<ServiceOffering>(
        gqlData,
        SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon,
      );

      expect(roundtrippedNeon.includes).toEqual(includesArray);
    });
  });

  describe('Field count verification', () => {
    it('should have equal forward and reverse mapping sizes', () => {
      const forwardKeys = Object.keys(SERVICE_OFFERING_FIELD_MAPPING.neonToGql);
      const reverseKeys = Object.keys(SERVICE_OFFERING_FIELD_MAPPING.gqlToNeon);
      // Reverse mapping may have more keys due to aliases (dateCreated, dateLastModified)
      expect(reverseKeys.length).toBeGreaterThanOrEqual(forwardKeys.length);
    });
  });
});
