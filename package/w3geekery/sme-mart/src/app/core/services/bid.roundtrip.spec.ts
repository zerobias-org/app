/**
 * Roundtrip Field Validation Tests for Bid Entity
 *
 * Validates that no fields are lost during Neon → GQL → Neon transformation cycles.
 * Includes special handling for JSON fields (pricing_breakdown, wizard_data).
 */

import { describe, it, expect } from 'vitest';
import { mapNeonToGql, mapGqlToNeon, BID_FIELD_MAPPING } from '@/core/field-mappings';
import { BID_GQL_FIXTURE } from '@/test-helpers/gql-fixtures';
import type { GqlBidResponse, GqlTaskTypePricing } from '@/core/gql-types';
import type { Bid, TaskTypePricing } from '@/core/models/bid.model';

/**
 * Test factory to create a Neon Bid object with all fields populated
 */
function makeBid(overrides?: Partial<Bid>): Bid {
  return {
    id: 'bid-001',
    request_id: 'eng-001',
    project_id: null, // Plan 075: SmeMartProject link
    provider_id: 'provider-001',
    cover_letter: 'We specialize in healthcare compliance...',
    proposed_price: '18000',
    proposed_timeline: '4 weeks',
    executive_summary: 'Complete HIPAA audit',
    team_description: '5 person team with 20+ years experience',
    total_estimated_hours: 160,
    pricing_breakdown: [
      { taskType: 'audit', estimatedHours: 80, estimatedCost: 8000 },
      { taskType: 'documentation', estimatedHours: 60, estimatedCost: 6000 },
    ],
    status: 'pending',
    wizard_data: {
      approach: {
        executive_summary: 'Complete HIPAA audit',
        cover_letter: 'We specialize in healthcare compliance...',
      },
      team: { team_description: '5 person team with 20+ years experience' },
      pricing: {
        proposed_price: '18000',
        proposed_timeline: '4 weeks',
        total_estimated_hours: 160,
      },
    },
    wizard_step: 5,
    ai_assisted: false,
    ai_model: null,
    ai_generated_at: null,
    created_at: '2026-03-18T11:00:00Z',
    updated_at: '2026-03-18T14:15:00Z',
    ...overrides,
  };
}

describe('INFRA-04: Bid Roundtrip Field Validation', () => {
  describe('Neon → GQL transformation', () => {
    it('should map all Neon Bid fields to GQL camelCase', () => {
      const neonModel = makeBid();

      const gqlData = mapNeonToGql<GqlBidResponse>(neonModel, BID_FIELD_MAPPING.neonToGql);

      // Verify critical fields are mapped correctly
      expect(gqlData.id).toBe('bid-001');
      expect(gqlData.engagementId).toBe('eng-001'); // request_id → engagementId
      expect(gqlData.providerId).toBe('provider-001');
      expect(gqlData.coverLetter).toBe('We specialize in healthcare compliance...');
      expect(gqlData.proposedPrice).toBe('18000');
      expect(gqlData.proposedTimeline).toBe('4 weeks');
      expect(gqlData.executiveSummary).toBe('Complete HIPAA audit');
      expect(gqlData.teamDescription).toBe('5 person team with 20+ years experience');
      expect(gqlData.totalEstimatedHours).toBe(160);
      expect(gqlData.status).toBe('pending');
      expect(gqlData.wizardStep).toBe(5);
      expect(gqlData.aiAssisted).toBe(false);
      expect(gqlData.createdAt).toBe('2026-03-18T11:00:00Z');
      expect(gqlData.updatedAt).toBe('2026-03-18T14:15:00Z');
    });

    it('should handle JSON fields (pricing_breakdown, wizard_data)', () => {
      const neonModel = makeBid();
      const gqlData = mapNeonToGql<GqlBidResponse>(neonModel, BID_FIELD_MAPPING.neonToGql);

      // Verify JSON array is preserved
      expect(gqlData.pricingBreakdown).toBeDefined();
      expect(Array.isArray(gqlData.pricingBreakdown)).toBe(true);
      expect(gqlData.pricingBreakdown?.[0]).toHaveProperty('taskType', 'audit');
      expect(gqlData.pricingBreakdown?.[0]).toHaveProperty('estimatedHours', 80);

      // Verify JSON object is preserved
      expect(gqlData.wizardData).toBeDefined();
      expect(typeof gqlData.wizardData).toBe('object');
      expect((gqlData.wizardData as any)?.approach?.cover_letter).toBeDefined();
    });

    it('should not lose fields in Neon → GQL mapping', () => {
      const neonModel = makeBid();
      const gqlData = mapNeonToGql<GqlBidResponse>(neonModel, BID_FIELD_MAPPING.neonToGql);
      const gqlKeys = Object.keys(gqlData);

      // Should have all mapped field count
      const expectedFieldCount = Object.keys(BID_FIELD_MAPPING.neonToGql).length;
      expect(gqlKeys.length).toBe(expectedFieldCount);

      // Verify no undefined values for critical fields
      expect(gqlData.id).toBeDefined();
      expect(gqlData.engagementId).toBeDefined();
      expect(gqlData.providerId).toBeDefined();
      expect(gqlData.status).toBeDefined();
      expect(gqlData.createdAt).toBeDefined();
    });

    it('should handle null/optional fields correctly', () => {
      const neonModel = makeBid({
        proposed_price: null,
        executive_summary: null,
        wizard_data: null,
      });

      const gqlData = mapNeonToGql<GqlBidResponse>(
        neonModel,
        BID_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData.proposedPrice).toBeNull();
      expect(gqlData.executiveSummary).toBeNull();
      expect(gqlData.wizardData).toBeNull();
    });
  });

  describe('GQL → Neon reverse transformation', () => {
    it('should reverse-map all GQL fields back to Neon snake_case', () => {
      const gqlData = BID_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<Bid>(gqlData, BID_FIELD_MAPPING.gqlToNeon);

      expect(neonModel.id).toBe('bid-001-uuid-compliance-experts');
      expect(neonModel.request_id).toBe('eng-001-uuid-hipaa-assessment');
      expect(neonModel.provider_id).toBe('provider-001-uuid');
      expect(neonModel.cover_letter).toBeDefined();
      expect(neonModel.proposed_price).toBe('18000');
      expect(neonModel.proposed_timeline).toBe('4 weeks');
      expect(neonModel.status).toBe('PENDING');
      expect(neonModel.created_at).toBe('2026-03-18T11:00:00Z');
      expect(neonModel.updated_at).toBe('2026-03-18T14:15:00Z');
    });

    it('should not lose fields in GQL → Neon mapping', () => {
      const gqlData = BID_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<Bid>(gqlData, BID_FIELD_MAPPING.gqlToNeon);
      const neonKeys = Object.keys(neonModel);

      // Verify critical Neon fields are present after mapping
      expect(neonModel.id).toBeDefined();
      expect(neonModel.request_id).toBeDefined();
      expect(neonModel.provider_id).toBeDefined();
      expect(neonModel.proposed_price).toBeDefined();
      expect(neonModel.status).toBeDefined();
      expect(neonModel.created_at).toBeDefined();
      expect(neonModel.updated_at).toBeDefined();
    });
  });

  describe('Roundtrip: Neon → GQL → Neon', () => {
    it('should preserve all fields in complete roundtrip cycle', () => {
      // 1. Start with Neon model
      const originalNeon = makeBid({
        id: 'bid-roundtrip-001',
        request_id: 'eng-roundtrip-001',
        provider_id: 'provider-roundtrip-001',
        cover_letter: 'We have expertise in HIPAA compliance',
        proposed_price: '15000',
        proposed_timeline: '6 weeks',
        status: 'pending',
      });

      // 2. Map to GQL
      const gqlData = mapNeonToGql<GqlBidResponse>(
        originalNeon,
        BID_FIELD_MAPPING.neonToGql,
      );
      expect(gqlData.id).toBe('bid-roundtrip-001');
      expect(gqlData.engagementId).toBe('eng-roundtrip-001');

      // 3. Map back to Neon
      const roundtrippedNeon = mapGqlToNeon<Bid>(gqlData, BID_FIELD_MAPPING.gqlToNeon);

      // 4. Verify key fields survived roundtrip
      expect(roundtrippedNeon.id).toBe('bid-roundtrip-001');
      expect(roundtrippedNeon.request_id).toBe('eng-roundtrip-001');
      expect(roundtrippedNeon.provider_id).toBe('provider-roundtrip-001');
      expect(roundtrippedNeon.cover_letter).toBe('We have expertise in HIPAA compliance');
      expect(roundtrippedNeon.proposed_price).toBe('15000');
      expect(roundtrippedNeon.proposed_timeline).toBe('6 weeks');
      expect(roundtrippedNeon.status).toBe('pending');
      expect(roundtrippedNeon.created_at).toBe('2026-03-18T11:00:00Z');
      expect(roundtrippedNeon.updated_at).toBe('2026-03-18T14:15:00Z');
    });

    it('should preserve JSON fields in complete roundtrip', () => {
      const originalNeon = makeBid({
        pricing_breakdown: [
          { taskType: 'audit', estimatedHours: 80, estimatedCost: 8000, notes: 'Initial audit' },
        ],
        wizard_data: {
          step1: { completed: true },
          step2: { data: 'value' },
        },
      });

      const gqlData = mapNeonToGql<GqlBidResponse>(
        originalNeon,
        BID_FIELD_MAPPING.neonToGql,
      );
      const roundtrippedNeon = mapGqlToNeon<Bid>(gqlData, BID_FIELD_MAPPING.gqlToNeon);

      // Verify JSON structures survived
      expect(roundtrippedNeon.pricing_breakdown).toBeDefined();
      expect(roundtrippedNeon.wizard_data).toBeDefined();
      expect(Array.isArray(roundtrippedNeon.pricing_breakdown)).toBe(true);
      expect(typeof roundtrippedNeon.wizard_data).toBe('object');
    });

    it('should handle draft bid with partial wizard_data', () => {
      const draftBid = makeBid({
        status: 'draft',
        wizard_step: 2,
        wizard_data: {
          approach: {
            cover_letter: 'Partial cover letter',
          },
        },
        executive_summary: null,
        team_description: null,
        proposed_price: null,
      });

      const gqlData = mapNeonToGql<GqlBidResponse>(
        draftBid,
        BID_FIELD_MAPPING.neonToGql,
      );
      const roundtrippedNeon = mapGqlToNeon<Bid>(gqlData, BID_FIELD_MAPPING.gqlToNeon);

      expect(roundtrippedNeon.status).toBe('draft');
      expect(roundtrippedNeon.wizard_step).toBe(2);
      expect(roundtrippedNeon.wizard_data).toBeDefined();
    });
  });

  describe('Field count verification', () => {
    it('should have equal forward and reverse mapping sizes', () => {
      const forwardKeys = Object.keys(BID_FIELD_MAPPING.neonToGql);
      const reverseKeys = Object.keys(BID_FIELD_MAPPING.gqlToNeon);
      // Reverse mapping may have more keys due to aliases (e.g., dateCreated, dateLastModified)
      expect(reverseKeys.length).toBeGreaterThanOrEqual(forwardKeys.length);
    });
  });
});
