/**
 * Roundtrip Field Validation Tests for Engagement Entity (Plan 075)
 *
 * Engagement is now a corp-to-corp agreement. RFP fields moved to SmeMartProject.
 * Tests verify the remaining Engagement fields survive Neon ↔ GQL roundtrip.
 */

import { describe, it, expect } from 'vitest';
import { mapNeonToGql, mapGqlToNeon, ENGAGEMENT_FIELD_MAPPING } from '@/core/field-mappings';
import { ENGAGEMENT_GQL_FIXTURE } from '@/test-helpers/gql-fixtures';
import type { Engagement } from '@/core/models/engagement.model';

function makeEngagement(overrides?: Partial<Engagement>): Engagement {
  return {
    id: 'eng-001',
    title: 'Pinnacle Corp ↔ W3Geekery',
    description: 'Master service agreement',
    category: '',
    buyer_user_id: null,
    buyer_zerobias_user_id: 'user-buyer-001',
    buyer_zerobias_org_id: '28efd6b5-fd17-5b56-a45e-fe3263189666',
    budget_type: null,
    budget_min: null,
    budget_max: null,
    timeline: null,
    status: 'in_progress',
    engagement_tag: 'sme-mart.eng.pinnacle',
    zerobias_tag_id: 'tag-uuid-001',
    zerobias_boundary_id: null,
    zerobias_task_id: 'task-uuid-001',
    created_at: '2026-03-18T10:00:00Z',
    updated_at: '2026-03-18T10:00:00Z',
    ...overrides,
  };
}

describe('Engagement Roundtrip (Plan 075 — corp-to-corp)', () => {
  describe('Neon → GQL transformation', () => {
    it('should map core Engagement fields to GQL camelCase', () => {
      const neonModel = makeEngagement();
      const gqlData = mapNeonToGql<Record<string, unknown>>(
        neonModel,
        ENGAGEMENT_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData['id']).toBe('eng-001');
      expect(gqlData['name']).toBe('Pinnacle Corp ↔ W3Geekery');
      expect(gqlData['description']).toBe('Master service agreement');
      expect(gqlData['buyerZerobiasUserId']).toBe('user-buyer-001');
      expect(gqlData['status']).toBe('in_progress');
      expect(gqlData['engagementTag']).toBe('sme-mart.eng.pinnacle');
      expect(gqlData['zerobiasTaskId']).toBe('task-uuid-001');
    });

    it('should handle null/optional fields correctly', () => {
      const neonModel = makeEngagement({
        description: null,
        engagement_tag: null,
        zerobias_task_id: null,
      });
      const gqlData = mapNeonToGql<Record<string, unknown>>(
        neonModel,
        ENGAGEMENT_FIELD_MAPPING.neonToGql,
      );

      expect(gqlData['description']).toBeNull();
      expect(gqlData['engagementTag']).toBeNull();
      expect(gqlData['zerobiasTaskId']).toBeNull();
    });
  });

  describe('GQL → Neon reverse transformation', () => {
    it('should reverse-map GQL fields back to Neon snake_case', () => {
      const gqlData = ENGAGEMENT_GQL_FIXTURE;
      const neonModel = mapGqlToNeon<Engagement>(gqlData, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);

      expect(neonModel.id).toBe('eng-001-uuid-hipaa-assessment');
      expect(neonModel.title).toBe('HIPAA Compliance Assessment for Regional Healthcare Provider');
      expect(neonModel.buyer_zerobias_user_id).toBe('user-buyer-001-uuid');
      expect(neonModel.status).toBe('in_progress');
    });
  });

  describe('Roundtrip: Neon → GQL → Neon', () => {
    it('should preserve core fields in complete roundtrip cycle', () => {
      const originalNeon = makeEngagement({
        id: 'eng-roundtrip-001',
        title: 'Test Agreement',
        status: 'in_progress',
        engagement_tag: 'sme-mart.eng.test',
      });

      const gqlData = mapNeonToGql<Record<string, unknown>>(
        originalNeon,
        ENGAGEMENT_FIELD_MAPPING.neonToGql,
      );
      expect(gqlData['name']).toBe('Test Agreement');

      const roundtripped = mapGqlToNeon<Engagement>(gqlData, ENGAGEMENT_FIELD_MAPPING.gqlToNeon);
      expect(roundtripped.id).toBe('eng-roundtrip-001');
      expect(roundtripped.title).toBe('Test Agreement');
      expect(roundtripped.status).toBe('in_progress');
      expect(roundtripped.engagement_tag).toBe('sme-mart.eng.test');
    });
  });
});
