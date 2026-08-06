import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { ServiceCard } from './service-card.component';
import { describe, it, expect, beforeEach } from 'vitest';
import type { VendorListing } from '../../../core/models';

function makeListing(overrides: Partial<VendorListing> = {}): VendorListing {
  return {
    id: 'svc-001',
    ownerId: 'prov-001',
    family: 'SERVICE',
    kind: 'BESPOKE_SERVICE',
    title: 'SOC 2 Assessment',
    summary: 'Comprehensive SOC 2 Type I/II readiness and assessment services.',
    catalogRef: null,
    fulfillment: 'ENGAGEMENT',
    lifecycle: 'LISTED',
    active: true,
    offers: [{ offerId: 'offer-001', label: 'Fixed price' }],
    terms: null,
    includesSummary: null,
    deliveryTime: '4-6 weeks',
    prerequisitesSummary: null,
    version: 1,
    publishedAt: '2026-01-01',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ownerDisplayName: 'Jane Smith',
    ...overrides,
  };
}

describe('ServiceCard', () => {
  let fixture: ComponentFixture<ServiceCard>;
  let component: ServiceCard;

  function setListing(listing: VendorListing): void {
    fixture.componentRef.setInput('service', listing);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ServiceCard] });
    fixture = TestBed.createComponent(ServiceCard);
    component = fixture.componentInstance;
    setListing(makeListing());
  });

  it('should compute title', () => {
    expect(component.title()).toBe('SOC 2 Assessment');
  });

  it('should truncate long summaries', () => {
    setListing(makeListing({ summary: 'A'.repeat(200) }));
    expect(component.description().length).toBeLessThanOrEqual(123);
    expect(component.description().endsWith('...')).toBe(true);
  });

  it('should render the listing kind as a display label', () => {
    expect(component.kindLabel()).toBe('Bespoke Service');
  });

  it('should surface the first offer label instead of a price', () => {
    expect(component.offerLabel()).toBe('Fixed price');
  });

  it('should return null offer label when the listing has no offers', () => {
    setListing(makeListing({ offers: [] }));
    expect(component.offerLabel()).toBeNull();
  });

  it('should emit serviceSelect on click', () => {
    let emitted: VendorListing | null = null;
    component.serviceSelect.subscribe((s: VendorListing) => { emitted = s; });
    component.onClick();
    expect(emitted).not.toBeNull();
    expect(emitted!.id).toBe('svc-001');
  });
});
