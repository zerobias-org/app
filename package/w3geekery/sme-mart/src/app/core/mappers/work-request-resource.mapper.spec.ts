import { workRequestToResource } from './work-request-resource.mapper';
import type { WorkRequest } from '../models';

describe('workRequestToResource', () => {
  const wr: WorkRequest = {
    id: 'wr-001',
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
    const r = workRequestToResource(wr);
    expect(r.id).toBe('wr-001');
    expect(r.name).toBe('SOC 2 Readiness Assessment');
    expect(r.type).toBe('sme-mart:work-request');
    expect(r.ownerId).toBe('u-200');
    expect(r.created).toBe('2026-01-01T00:00:00Z');
    expect(r.updated).toBe('2026-02-01T12:00:00Z');
  });

  it('should set engagementId to its own id', () => {
    expect(workRequestToResource(wr).engagementId).toBe('wr-001');
  });

  it('should map boundaryId', () => {
    expect(workRequestToResource(wr).boundaryId).toBe('b-001');
  });

  it('should set parentId to null (top-level entity)', () => {
    expect(workRequestToResource(wr).parentId).toBeNull();
  });

  it('should fallback updated to created_at when updated_at is undefined', () => {
    const noUpdate = { ...wr, updated_at: undefined as any };
    expect(workRequestToResource(noUpdate).updated).toBe('2026-01-01T00:00:00Z');
  });
});
