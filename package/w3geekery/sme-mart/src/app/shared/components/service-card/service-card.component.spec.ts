import { TestBed } from '@angular/core/testing';
import { ServiceCard } from './service-card.component';
import { describe, it, expect, beforeEach } from 'vitest';
import type { ServiceOffering } from '../../../core/models';

function makeService(overrides: Partial<ServiceOffering> = {}): ServiceOffering {
  return {
    id: 'svc-001',
    provider_id: 'prov-001',
    title: 'SOC 2 Assessment',
    description: 'Comprehensive SOC 2 Type I/II readiness and assessment services.',
    category: 'assessors',
    price: '15000',
    pricing_type: 'fixed',
    delivery_time: '4-6 weeks',
    includes: null,
    requirements: null,
    is_active: true,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    provider_display_name: 'Jane Smith',
    ...overrides,
  } as ServiceOffering;
}

describe('ServiceCard', () => {
  let component: ServiceCard;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ServiceCard] });
    const fixture = TestBed.createComponent(ServiceCard);
    component = fixture.componentInstance;
    component.service = makeService();
  });

  it('should compute title', () => {
    expect(component.title()).toBe('SOC 2 Assessment');
  });

  it('should truncate long descriptions', () => {
    component.service = makeService({ description: 'A'.repeat(200) });
    expect(component.description().length).toBeLessThanOrEqual(123);
    expect(component.description().endsWith('...')).toBe(true);
  });

  it('should format price with dollar sign', () => {
    expect(component.price()).toBe('$15,000');
  });

  it('should return null price when not set', () => {
    component.service = makeService({ price: null });
    expect(component.price()).toBeNull();
  });

  it('should emit serviceSelect on click', () => {
    let emitted: ServiceOffering | null = null;
    component.serviceSelect.subscribe((s: ServiceOffering) => { emitted = s; });
    component.onClick();
    expect(emitted).not.toBeNull();
    expect(emitted!.id).toBe('svc-001');
  });
});
