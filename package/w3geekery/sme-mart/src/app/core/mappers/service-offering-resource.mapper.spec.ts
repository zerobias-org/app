import { serviceOfferingToResource } from './service-offering-resource.mapper';
import type { ServiceOffering } from '../models';

describe('serviceOfferingToResource', () => {
  const offering: ServiceOffering = {
    id: 'so-001',
    provider_id: 'u-300',
    provider_display_name: 'Acme Security',
    title: 'SOC 2 Readiness Package',
    description: 'Complete SOC 2 Type I preparation and gap analysis.',
    category: 'compliance',
    subcategory: 'soc2',
    pricing_type: 'fixed',
    price: '15000',
    delivery_time: '6 weeks',
    includes: ['Gap analysis', 'Policy templates', 'Readiness report'],
    requirements: 'Access to existing security documentation',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-15T12:00:00Z',
  };

  it('should map core fields', () => {
    const r = serviceOfferingToResource(offering);
    expect(r.id).toBe('so-001');
    expect(r.name).toBe('SOC 2 Readiness Package');
    expect(r.type).toBe('sme-mart:service-offering');
    expect(r.ownerId).toBe('u-300');
    expect(r.description).toBe('Complete SOC 2 Type I preparation and gap analysis.');
  });

  it('should set deleted to null when active', () => {
    expect(serviceOfferingToResource(offering).deleted).toBeNull();
  });

  it('should set deleted when inactive', () => {
    const inactive = { ...offering, is_active: false };
    expect(serviceOfferingToResource(inactive).deleted).toBe('2026-01-01T00:00:00Z');
  });

  it('should set engagement and boundary to null (catalog-level)', () => {
    const r = serviceOfferingToResource(offering);
    expect(r.engagementId).toBeNull();
    expect(r.boundaryId).toBeNull();
  });

  it('should set parentId to null (top-level)', () => {
    expect(serviceOfferingToResource(offering).parentId).toBeNull();
  });
});
