import { engagementToResource, workRequestToResource } from './work-request-resource.mapper';
import type { Engagement } from '../models';

describe('engagementToResource', () => {
  const engagement: Engagement = {
    id: 'eng-001',
    buyer_user_id: null,
    buyer_zerobias_user_id: 'u-200',
    buyer_zerobias_org_id: 'org-001',
    title: 'SOC 2 Readiness Assessment',
    description: 'Need help preparing for SOC 2 Type I audit',
    category: 'compliance',
    budget_type: 'fixed',
    budget_min: '5000',
    budget_max: '10000',
    timeline: '4 weeks',
    status: 'open',
    engagement_tag: 'crystal-harbor',
    zerobias_tag_id: 'tag-001',
    zerobias_boundary_id: 'b-001',
    zerobias_task_id: 'task-001',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-02-01T12:00:00Z',
  };

  it('should map core fields', () => {
    const r = engagementToResource(engagement);
    expect(r.id).toBe('eng-001');
    expect(r.name).toBe('SOC 2 Readiness Assessment');
    expect(r.type).toBe('sme-mart:engagement');
    expect(r.ownerId).toBe('u-200');
    expect(r.created).toBe('2026-01-01T00:00:00Z');
    expect(r.updated).toBe('2026-02-01T12:00:00Z');
  });

  it('should set engagementId to its own id', () => {
    expect(engagementToResource(engagement).engagementId).toBe('eng-001');
  });

  it('should map boundaryId', () => {
    expect(engagementToResource(engagement).boundaryId).toBe('b-001');
  });

  it('should set parentId to null (top-level entity)', () => {
    expect(engagementToResource(engagement).parentId).toBeNull();
  });

  it('should fallback updated to created_at when updated_at is undefined', () => {
    const noUpdate = { ...engagement, updated_at: undefined as any };
    expect(engagementToResource(noUpdate).updated).toBe('2026-01-01T00:00:00Z');
  });

  describe('backwards compatibility alias', () => {
    it('should support deprecated workRequestToResource function', () => {
      const r = workRequestToResource(engagement);
      expect(r.id).toBe('eng-001');
    });
  });
});
