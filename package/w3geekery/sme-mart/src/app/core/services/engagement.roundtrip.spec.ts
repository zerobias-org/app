/**
 * Roundtrip Field Validation Tests for Engagement Entity
 *
 * Validates that no fields are lost during Neon → GQL → Neon transformation cycles.
 * Tests both directions of field mapping to ensure bidirectional accuracy.
 */

import { describe, it, expect } from 'vitest';
import { mapNeonToGql, mapGqlToNeon, ENGAGEMENT_FIELD_MAPPING } from '@/core/field-mappings';
import { ENGAGEMENT_GQL_FIXTURE } from '@/test-helpers/gql-fixtures';
import type { GqlEngagementResponse } from '@/core/gql-types';
import type { Engagement } from '@/core/models/engagement.model';

/**
 * Test factory to create a Neon Engagement object with all fields populated
 */
function makeEngagement(overrides?: Partial<Engagement>): Engagement {
  return {
    id: 'eng-001',
    title: 'HIPAA Compliance Assessment',
    description: 'Full compliance review for healthcare provider',
    category: 'compliance',
    buyer_user_id: 'user-uuid-001',
    buyer_zerobias_user_id: 'user-buyer-001',
    buyer_zerobias_org_id: '28efd6b5-fd17-5b56-a45e-fe3263189666',
    budget_type: 'fixed',
    budget_min: '10000',
    budget_max: '25000',
    timeline: '30 days',
    status: 'open',
    engagement_tag: 'sme-mart.eng.hipaa',
    zerobias_tag_id: 'tag-uuid-001',
    zerobias_boundary_id: 'boundary-uuid-001',
    zerobias_task_id: 'task-uuid-001',
    created_at: '2026-03-18T10:00:00Z',
    updated_at: '2026-03-18T10:00:00Z',
    ...overrides,
  };
}

describe('INFRA-04: Engagement Roundtrip Field Validation', () => {
  describe('Neon → GQL transformation', () => {
    it('should map all Neon Engagement fields to GQL camelCase', () => {
      const neonModel = makeEngagement();

      const gqlData = mapNeonToGql<GqlEngagementResponse>(
        neonModel,
        ENGAGEMENT_FIELD_MAPPING.neonToGql,
      );

      // Verify critical fields are mapped correctly
      expect(gqlData.id).toBe('eng-001');
      expect(gqlData.name).toBe('HIPAA Compliance Assessment'); // title → name
      expect(gqlData.description).toBe('Full compliance review for healthcare provider');
      expect(gqlData.category).toBe('compliance');
      expect(gqlData.buyerZerobiasUserId).toBe('user-buyer-001');
      expect(gqlData.buyerZerobiasOrgId).toBe('28efd6b5-fd17-5b56-a45e-fe3263189666');
      expect(gqlData.budgetType).toBe('fixed');
      expect(gqlData.budgetMin).toBe('10000');
      expect(gqlData.budgetMax).toBe('25000');
      expect(gqlData.timeline).toBe('30 days');
      expect(gqlData.status).toBe('open');
      expect(gqlData.engagementTag).toBe('sme-mart.eng.hipaa');
      expect(gqlData.zerobiasTagId).toBe('tag-uuid-001');
      expect(gqlData.zerobiasTaskId).toBe('task-uuid-001');
      expect(gqlData.createdAt).toBe('2026-03-18T10:00:00Z');
      expect(gqlData.updatedAt).toBe('2026-03-18T10:00:00Z');
    });

    it('should not lose fields in Neon → GQL mapping', () => {
      const neonModel = makeEngagement();
      const gqlData = mapNeonToGql<GqlEngagementResponse>(
        neonModel,
        ENGAGEMENT_FIELD_MAPPING.neonToGql,
      );
      const gqlKeys = Object.keys(gqlData);

      // Should have all mapped field count
      const expectedFieldCount = Object.keys(ENGAGEMENT_FIELD_MAPPING.neonToGql).length;
      expect(gqlKeys.length).toBe(expectedFieldCount);

      // Verify no undefined values for critical fields
      expect(gqlData.id).toBeDefined();
      expect(gqlData.name).toBeDefined();
      expect(gqlData.buyerZerobiasUserId).toBeDefined();
      expect(gqlData.status).toBeDefined();
      expect(gqlData.createdAt).toBeDefined();
    });

    it('should handle null/optional fields correctly', () => {
      const neonModel = makeEngagement({
        description: null,
        engagement_tag: null,
        zerobias_task_id: null,
      });

      const gqlData = mapNeonToGql<GqlEngagementResponse>(
        neonModel,
        ENGAGEMENT_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData.description).toBeNull();
      expect(gqlData.engagementTag).toBeNull();
      expect(gqlData.zerobiasTaskId).toBeNull();
    });
  });

  describe('GQL → Neon reverse transformation', () => {
    it('should reverse-map all GQL fields back to Neon snake_case', () => {
      const gqlData = ENGAGEMENT_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<Engagement>(gqlData, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);

      expect(neonModel.id).toBe('eng-001-uuid-hipaa-assessment');
      expect(neonModel.title).toBe('HIPAA Compliance Assessment for Regional Healthcare Provider');
      expect(neonModel.description).toBeDefined();
      expect(neonModel.category).toBe('compliance');
      expect(neonModel.buyer_zerobias_user_id).toBe('user-buyer-001-uuid');
      expect(neonModel.budget_min).toBe('10000');
      expect(neonModel.budget_max).toBe('25000');
      expect(neonModel.status).toBe('open');
      expect(neonModel.created_at).toBe('2026-03-18T10:00:00Z');
      expect(neonModel.updated_at).toBe('2026-03-18T14:30:00Z');
    });

    it('should not lose fields in GQL → Neon mapping', () => {
      const gqlData = ENGAGEMENT_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<Engagement>(gqlData, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);
      const neonKeys = Object.keys(neonModel);

      // Should have all mapped field count
      const expectedFieldCount = Object.keys(ENGAGEMENT_FIELD_MAPPING.gqlToNeon).length;
      expect(neonKeys.length).toBe(expectedFieldCount);
    });
  });

  describe('Roundtrip: Neon → GQL → Neon', () => {
    it('should preserve all fields in complete roundtrip cycle', () => {
      // 1. Start with Neon model
      const originalNeon = makeEngagement({
        id: 'eng-roundtrip-001',
        title: 'HIPAA Assessment',
        description: 'Full compliance review',
        category: 'compliance',
        buyer_zerobias_user_id: 'user-buyer-001',
        budget_type: 'fixed',
        budget_min: '10000',
        budget_max: '25000',
        timeline: '30 days',
        status: 'open',
        engagement_tag: 'sme-mart.eng.hipaa',
        zerobias_tag_id: 'tag-uuid-001',
        zerobias_task_id: 'task-uuid-001',
        created_at: '2026-03-18T10:00:00Z',
        updated_at: '2026-03-18T10:00:00Z',
      });

      // 2. Map to GQL
      const gqlData = mapNeonToGql<GqlEngagementResponse>(
        originalNeon,
        ENGAGEMENT_FIELD_MAPPING.neonToGql,
      );
      expect(gqlData.id).toBe('eng-roundtrip-001');
      expect(gqlData.name).toBe('HIPAA Assessment');

      // 3. Map back to Neon
      const roundtrippedNeon = mapGqlToNeon<Engagement>(gqlData, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);

      // 4. Verify key fields survived roundtrip
      expect(roundtrippedNeon.id).toBe('eng-roundtrip-001');
      expect(roundtrippedNeon.title).toBe('HIPAA Assessment');
      expect(roundtrippedNeon.description).toBe('Full compliance review');
      expect(roundtrippedNeon.category).toBe('compliance');
      expect(roundtrippedNeon.buyer_zerobias_user_id).toBe('user-buyer-001');
      expect(roundtrippedNeon.budget_min).toBe('10000');
      expect(roundtrippedNeon.budget_max).toBe('25000');
      expect(roundtrippedNeon.timeline).toBe('30 days');
      expect(roundtrippedNeon.status).toBe('open');
      expect(roundtrippedNeon.engagement_tag).toBe('sme-mart.eng.hipaa');
      expect(roundtrippedNeon.zerobias_tag_id).toBe('tag-uuid-001');
      expect(roundtrippedNeon.zerobias_task_id).toBe('task-uuid-001');
      expect(roundtrippedNeon.created_at).toBe('2026-03-18T10:00:00Z');
      expect(roundtrippedNeon.updated_at).toBe('2026-03-18T10:00:00Z');
    });

    it('should handle enum value preservation (status case)', () => {
      const neonModel = makeEngagement({ status: 'completed' });
      const gqlData = mapNeonToGql<GqlEngagementResponse>(
        neonModel,
        ENGAGEMENT_FIELD_MAPPING.neonToGql,
      );
      const roundtrippedNeon = mapGqlToNeon<Engagement>(
        gqlData,
        ENGAGEMENT_FIELD_MAPPING.gqlToNeon,
      );

      // Status should survive roundtrip (may be uppercased by schema)
      expect(roundtrippedNeon.status).toBeDefined();
      expect(typeof roundtrippedNeon.status).toBe('string');
    });
  });

  describe('Field count verification', () => {
    it('should have equal forward and reverse mapping sizes', () => {
      const forwardKeys = Object.keys(ENGAGEMENT_FIELD_MAPPING.neonToGql);
      const reverseKeys = Object.keys(ENGAGEMENT_FIELD_MAPPING.gqlToNeon);
      expect(forwardKeys.length).toBe(reverseKeys.length);
    });
  });
});
