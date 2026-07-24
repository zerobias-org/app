import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ProviderDetail } from './provider-detail.component';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { ServiceOfferingsService } from '../../core/services/service-offerings.service';
import { ReviewsService } from '../../core/services/reviews.service';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import type { ProviderDetailView, ExpertiseItem } from '../../core/models';

const ZB_ORG = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec';

function makeZbDetailProvider(overrides: Partial<ProviderDetailView> = {}): ProviderDetailView {
  return {
    id: 'profile-123',
    orgId: ZB_ORG,
    legalName: 'ZeroBias',
    dba: null,
    tagline: 'Cybersecurity & compliance automation',
    shortDescription: 'Short description',
    longDescription: 'ZeroBias is a platform for automating cybersecurity and compliance frameworks.',
    website: 'https://zerobias.com',
    logoUrl: 'https://zerobias.com/logo.png',
    foundedYear: 2020,
    employeeCount: '50-99',
    businessClassification: 'SaaS',
    verified: true,
    skillCount: 5,
    segments: [] as ExpertiseItem[],
    serviceSegments: [] as ExpertiseItem[],
    skills: [] as ExpertiseItem[],
    roles: [] as ExpertiseItem[],
    products: [] as ExpertiseItem[],
    frameworks: [] as ExpertiseItem[],
    ...overrides,
  };
}

describe('ProviderDetail', () => {
  let component: ProviderDetail;
  let fixture: ComponentFixture<ProviderDetail>;
  let mockProviderService: { getProvider: ReturnType<typeof vi.fn> };
  let mockServiceOfferingsService: { getServicesByProvider: ReturnType<typeof vi.fn> };
  let mockReviewsService: { listReviewsByProvider: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockProviderService = {
      getProvider: vi.fn().mockResolvedValue(null),
    };

    mockServiceOfferingsService = {
      getServicesByProvider: vi.fn().mockResolvedValue([]),
    };

    mockReviewsService = {
      listReviewsByProvider: vi.fn().mockResolvedValue([]),
    };

    TestBed.configureTestingModule({
      imports: [ProviderDetail],
      providers: [
        { provide: ProviderProfilesService, useValue: mockProviderService },
        { provide: ServiceOfferingsService, useValue: mockServiceOfferingsService },
        { provide: ReviewsService, useValue: mockReviewsService },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['id', ZB_ORG]])),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(ProviderDetail);
    component = fixture.componentInstance;
  });

  it('renders all populated sections', async () => {
    const zbDetail = makeZbDetailProvider();
    mockProviderService.getProvider.mockResolvedValue(zbDetail);

    component.ngOnInit();
    await fixture.whenStable();

    fixture.detectChanges();

    const provider = component.provider();
    expect(provider?.legalName).toBe('ZeroBias');
    expect(provider?.tagline).toBe('Cybersecurity & compliance automation');
    expect(provider?.longDescription).toBe('ZeroBias is a platform for automating cybersecurity and compliance frameworks.');
    expect(provider?.logoUrl).toBe('https://zerobias.com/logo.png');
  });

  it('renders gracefully with null reviews/skills/jobs', async () => {
    const zbDetail = makeZbDetailProvider({
      skills: [],
    });
    mockProviderService.getProvider.mockResolvedValue(zbDetail);

    component.ngOnInit();
    await fixture.whenStable();

    // Assert no thrown errors during render
    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();

    expect(component.provider()?.skills).toEqual([]);
    expect(component.reviews()).toEqual([]);
  });

  it('shows not-found state when getProvider returns null', async () => {
    mockProviderService.getProvider.mockResolvedValue(null);

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.provider()).toBeNull();
  });
});
