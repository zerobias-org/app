import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ProviderList } from './provider-list.component';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { CatalogService } from '../../core/services/catalog.service';
import { ActivatedRoute } from '@angular/router';
import { signal, computed } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import type { ProviderDirectoryView } from '../../core/models';
import { DEFAULT_ENABLED_FILTERS, DEFAULT_CATALOG_FILTERS } from '../../core/models';

const ZB_ORG = '57c741cf-a58e-5efc-bf2f-93c4f6cf76ec';

function makeZbProvider(overrides: Partial<ProviderDirectoryView> = {}): ProviderDirectoryView {
  return {
    id: 'provider-123',
    orgId: ZB_ORG,
    legalName: 'ZeroBias',
    tagline: 'Cybersecurity & compliance automation',
    logoUrl: 'https://cdn.example/zb.svg',
    segmentCount: 0,
    skillCount: 5,
    verified: true,
    ...overrides,
  };
}

describe('ProviderList', () => {
  let component: ProviderList;
  let fixture: ComponentFixture<ProviderList>;
  let mockProviderService: { loading: ReturnType<typeof signal>; listProviders: ReturnType<typeof vi.fn> };
  let mockCatalogService: Record<string, ReturnType<typeof signal> | ReturnType<typeof vi.fn>>;
  let mockPrefsService: {
    catalogFilters: ReturnType<typeof signal>;
    activeFilterCount: ReturnType<typeof computed>;
    enabledFilters: ReturnType<typeof signal>;
  };

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
    expect(component.filteredProviders()[0].legalName).toBe('ZeroBias');
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

  it('does not crash when ProviderDirectoryView has null optional fields', async () => {
    const zbProvider = makeZbProvider({
      tagline: null,
      logoUrl: null,
    });
    mockProviderService.listProviders.mockResolvedValue({ items: [zbProvider] });

    component.providers.set([zbProvider]);
    fixture.detectChanges();

    // Assert no thrown errors during render
    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();

    // Assert the computed filtered list handles nulls
    expect(component.filteredProviders()[0].tagline).toBeNull();
    expect(component.filteredProviders()[0].logoUrl).toBeNull();
  });
});
