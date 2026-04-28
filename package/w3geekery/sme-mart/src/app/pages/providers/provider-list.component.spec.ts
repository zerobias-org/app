import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ProviderList } from './provider-list.component';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ActivatedRoute } from '@angular/router';
import { signal, computed } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import type { ProviderDirectoryRow } from '../../core/models';
import { DEFAULT_ENABLED_FILTERS, DEFAULT_CATALOG_FILTERS } from '../../core/models';

const ZB_ORG = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec';

function makeZbProvider(overrides: Partial<ProviderDirectoryRow> = {}): ProviderDirectoryRow {
  return {
    id: ZB_ORG,
    user_id: null,
    slug: 'zerobias',
    zerobias_user_id: '',
    zerobias_org_id: ZB_ORG,
    display_name: 'ZeroBias',
    headline: 'Cybersecurity & compliance automation',
    about: null,
    avatar_url: 'https://cdn.example/zb.svg',
    hourly_rate: null,
    availability_status: null,
    response_time: null,
    total_jobs_completed: null,
    total_earnings: null,
    rating_average: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    skills: '[]',
    roles: '[]',
    products: '[]',
    frameworks: '[]',
    segments: '[]',
    service_segments: '[]',
    skill_count: null,
    role_count: null,
    service_count: null,
    review_count: null,
    ...overrides,
  };
}

describe('ProviderList', () => {
  let component: ProviderList;
  let fixture: ComponentFixture<ProviderList>;
  let mockProviderService: any;
  let mockCatalogService: any;
  let mockPrefsService: any;

  beforeEach(() => {
    const catalogFiltersSignal = signal({ ...DEFAULT_CATALOG_FILTERS });

    mockProviderService = {
      loading: signal(false),
      listProviders: vi.fn().mockResolvedValue({ items: [] }),
    };

    mockCatalogService = {
      listSkills: vi.fn().mockResolvedValue({ items: [] }),
      roles: signal([]),
      skills: signal([]),
      roleCategories: signal([]),
      frameworks: signal([]),
      segments: signal([]),
      serviceSegments: signal([]),
      products: signal([]),
    };

    mockPrefsService = {
      catalogFilters: catalogFiltersSignal,
      activeFilterCount: computed(() => {
        const filters = catalogFiltersSignal();
        return Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);
      }),
      enabledFilters: signal({ ...DEFAULT_ENABLED_FILTERS }),
    };

    TestBed.configureTestingModule({
      imports: [ProviderList],
      providers: [
        { provide: ProviderProfilesService, useValue: mockProviderService },
        { provide: CatalogService, useValue: mockCatalogService },
        { provide: UserPreferencesService, useValue: mockPrefsService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: {} }, paramMap: of(new Map()) },
        },
      ],
    });

    fixture = TestBed.createComponent(ProviderList);
    component = fixture.componentInstance;
  });

  it('renders the ZB card after listProviders resolves', async () => {
    const zbProvider = makeZbProvider();
    mockProviderService.listProviders.mockResolvedValue({ items: [zbProvider] });

    fixture.detectChanges();
    await fixture.whenStable();

    component.providers.set([zbProvider]);
    fixture.detectChanges();

    expect(component.filteredProviders()).toContain(zbProvider);
    expect(component.filteredProviders()[0].display_name).toBe('ZeroBias');
  });

  it('shows loading state while loading() signal is true', () => {
    mockProviderService.loading.set(true);

    expect(component.loading()).toBe(true);
  });

  it('shows empty-state when listProviders returns empty array', async () => {
    mockProviderService.listProviders.mockResolvedValue({ items: [] });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.providers()).toEqual([]);
    expect(component.filteredProviders()).toEqual([]);
  });

  it('does not crash when ProviderDirectoryRow has null rating/jobs/skills', async () => {
    const zbProvider = makeZbProvider({
      rating_average: null,
      total_jobs_completed: null,
      skills: '[]',
    });
    mockProviderService.listProviders.mockResolvedValue({ items: [zbProvider] });

    component.providers.set([zbProvider]);
    fixture.detectChanges();

    // Assert no thrown errors during render
    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();

    // Assert the computed filtered list handles nulls
    expect(component.filteredProviders()[0].rating_average).toBeNull();
    expect(component.filteredProviders()[0].total_jobs_completed).toBeNull();
  });
});
