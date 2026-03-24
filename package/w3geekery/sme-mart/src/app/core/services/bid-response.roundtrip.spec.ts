/**
 * Roundtrip Field Validation Tests for BidResponse Entity
 *
 * Validates that no fields are lost during Neon → GQL → Neon transformation cycles.
 */

import { describe, it, expect } from 'vitest';
import { mapNeonToGql, mapGqlToNeon, BID_RESPONSE_FIELD_MAPPING } from '@/core/field-mappings';
import { BID_RESPONSE_GQL_FIXTURE } from '@/test-helpers/gql-fixtures';
import type { GqlBidResponseResponse } from '@/core/gql-types';
import type { BidResponse, ComplianceStatus as ComplianceStatusType } from '@/core/models/bid-response.model';

/**
 * Test factory to create a Neon BidResponse object with all fields populated
 */
function makeBidResponse(overrides?: Partial<BidResponse>): BidResponse {
  return {
    id: 'bid-resp-001',
    bid_id: 'bid-001',
    requirement_id: 'req-001',
    compliance_status: 'met',
    response_text: 'Encryption is implemented using AES-256',
    estimated_hours: 0,
    estimated_cost: 0,
    certification_ref: 'SOC2_Type2_2025',
    ready_date: '2026-03-18',
    responded_at: '2026-03-18T11:30:00Z',
    updated_at: '2026-03-18T11:30:00Z',
    ...overrides,
  };
}

describe('INFRA-04: BidResponse Roundtrip Field Validation', () => {
  describe('Neon → GQL transformation', () => {
    it('should map all Neon BidResponse fields to GQL camelCase', () => {
      const neonModel = makeBidResponse();

      const gqlData = mapNeonToGql<GqlBidResponseResponse>(
        neonModel,
        BID_RESPONSE_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData.id).toBe('bid-resp-001');
      expect(gqlData.bidId).toBe('bid-001');
      expect(gqlData.requirementId).toBe('req-001');
      expect(gqlData.complianceStatus).toBe('met');
      expect(gqlData.responseText).toBe('Encryption is implemented using AES-256');
      expect(gqlData.estimatedHours).toBe(0);
      expect(gqlData.certificationRef).toBe('SOC2_Type2_2025');
      expect(gqlData.readyDate).toBe('2026-03-18');
      expect(gqlData.respondedAt).toBe('2026-03-18T11:30:00Z');
      expect(gqlData.updatedAt).toBe('2026-03-18T11:30:00Z');
    });

    it('should not lose fields in Neon → GQL mapping', () => {
      const neonModel = makeBidResponse();
      const gqlData = mapNeonToGql<GqlBidResponseResponse>(
        neonModel,
        BID_RESPONSE_FIELD_MAPPING.neonToGql,
      );
      const gqlKeys = Object.keys(gqlData);

      const expectedFieldCount = Object.keys(BID_RESPONSE_FIELD_MAPPING.neonToGql).length;
      expect(gqlKeys.length).toBe(expectedFieldCount);

      expect(gqlData.id).toBeDefined();
      expect(gqlData.bidId).toBeDefined();
      expect(gqlData.requirementId).toBeDefined();
      expect(gqlData.complianceStatus).toBeDefined();
    });

    it('should handle different compliance statuses', () => {
      const statuses: ComplianceStatusType[] = ['met', 'partially_met', 'not_met', 'not_applicable', 'planned'];

      for (const status of statuses) {
        const neonModel = makeBidResponse({ compliance_status: status });
        const gqlData = mapNeonToGql<GqlBidResponseResponse>(
          neonModel,
          BID_RESPONSE_FIELD_MAPPING.neonToGql,
        );
        expect(gqlData.complianceStatus).toBe(status);
      }
    });

    it('should handle null/optional fields correctly', () => {
      const neonModel = makeBidResponse({
        response_text: null,
        certification_ref: null,
        ready_date: null,
      });

      const gqlData = mapNeonToGql<GqlBidResponseResponse>(
        neonModel,
        BID_RESPONSE_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData.responseText).toBeNull();
      expect(gqlData.certificationRef).toBeNull();
      expect(gqlData.readyDate).toBeNull();
    });
  });

  describe('GQL → Neon reverse transformation', () => {
    it('should reverse-map all GQL fields back to Neon snake_case', () => {
      const gqlData = BID_RESPONSE_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<BidResponse>(gqlData, BID_RESPONSE_FIELD_MAPPING.gqlToNeon);

      expect(neonModel.id).toBe('bid-resp-001-uuid');
      expect(neonModel.bid_id).toBe('bid-001-uuid-compliance-experts');
      expect(neonModel.requirement_id).toBe('req-001-uuid-data-encryption');
      expect(neonModel.compliance_status).toBe('met');
      expect(neonModel.response_text).toBeDefined();
    });

    it('should not lose fields in GQL → Neon mapping', () => {
      const gqlData = BID_RESPONSE_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<BidResponse>(gqlData, BID_RESPONSE_FIELD_MAPPING.gqlToNeon);
      const neonKeys = Object.keys(neonModel);

      const expectedFieldCount = Object.keys(BID_RESPONSE_FIELD_MAPPING.gqlToNeon).length;
      expect(neonKeys.length).toBe(expectedFieldCount);
    });
  });

  describe('Roundtrip: Neon → GQL → Neon', () => {
    it('should preserve all fields in complete roundtrip cycle', () => {
      const originalNeon = makeBidResponse({
        id: 'bid-resp-roundtrip-001',
        bid_id: 'bid-roundtrip-001',
        requirement_id: 'req-roundtrip-001',
        compliance_status: 'partially_met',
        response_text: 'Partial implementation with planned enhancements',
      });

      const gqlData = mapNeonToGql<GqlBidResponseResponse>(
        originalNeon,
        BID_RESPONSE_FIELD_MAPPING.neonToGql,
      );
      const roundtrippedNeon = mapGqlToNeon<BidResponse>(gqlData, BID_RESPONSE_FIELD_MAPPING.gqlToNeon);

      expect(roundtrippedNeon.id).toBe('bid-resp-roundtrip-001');
      expect(roundtrippedNeon.bid_id).toBe('bid-roundtrip-001');
      expect(roundtrippedNeon.requirement_id).toBe('req-roundtrip-001');
      expect(roundtrippedNeon.compliance_status).toBe('partially_met');
      expect(roundtrippedNeon.response_text).toBe('Partial implementation with planned enhancements');
    });
  });

  describe('Field count verification', () => {
    it('should have equal forward and reverse mapping sizes', () => {
      const forwardKeys = Object.keys(BID_RESPONSE_FIELD_MAPPING.neonToGql);
      const reverseKeys = Object.keys(BID_RESPONSE_FIELD_MAPPING.gqlToNeon);
      expect(forwardKeys.length).toBe(reverseKeys.length);
    });
  });
});
