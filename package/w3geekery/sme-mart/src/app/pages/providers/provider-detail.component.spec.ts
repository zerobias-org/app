import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ProviderDetail } from './provider-detail.component';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { ServiceOfferingsService } from '../../core/services/service-offerings.service';
import { ReviewsService } from '../../core/services/reviews.service';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import type { ProviderDetailRow } from '../../core/models';

const ZB_ORG = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec';

function makeZbDetailProvider(overrides: Partial<ProviderDetailRow> = {}): ProviderDetailRow {
  return {
    id: ZB_ORG,
    user_id: null,
    slug: 'zerobias',
    zerobias_user_id: '',
    zerobias_org_id: ZB_ORG,
    display_name: 'ZeroBias',
    headline: 'Cybersecurity & compliance automation',
    about: 'ZeroBias is a platform for automating cybersecurity and compliance frameworks.',
    avatar_url: 'https://zerobias.com/logo.png',
    hourly_rate: null,
    availability_status: null,
    response_time: null,
    total_jobs_completed: null,
    total_earnings: null,
    rating_average: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_email: null,
    user_org_id: ZB_ORG,
    skills: '[]',
    roles: '[]',
    products: '[]',
    frameworks: '[]',
    segments: '[]',
    service_segments: '[]',
    service_offerings: '[]',
    reviews: '[]',
    review_count: null,
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
    expect(provider?.display_name).toBe('ZeroBias');
    expect(provider?.headline).toBe('Cybersecurity & compliance automation');
    expect(provider?.about).toBe('ZeroBias is a platform for automating cybersecurity and compliance frameworks.');
    expect(provider?.avatar_url).toBe('https://zerobias.com/logo.png');
  });

  it('renders gracefully with null reviews/skills/jobs', async () => {
    const zbDetail = makeZbDetailProvider({
      reviews: '[]',
      skills: '[]',
      total_jobs_completed: null,
    });
    mockProviderService.getProvider.mockResolvedValue(zbDetail);

    component.ngOnInit();
    await fixture.whenStable();

    // Assert no thrown errors during render
    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();

    expect(component.provider()?.reviews).toBe('[]');
    expect(component.reviews()).toEqual([]);
  });

  it('shows not-found state when getProvider returns null', async () => {
    mockProviderService.getProvider.mockResolvedValue(null);

    component.ngOnInit();
    await fixture.whenStable();

    expect(component.provider()).toBeNull();
  });
});
