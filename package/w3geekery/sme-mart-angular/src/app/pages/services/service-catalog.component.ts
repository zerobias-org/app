import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ZbSearchInputComponent, ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { ServiceCard } from '../../shared/components/service-card/service-card.component';
import { CatalogFilters } from '../../shared/components/catalog-filters/catalog-filters.component';
import { ResizableDrawerDirective } from '../../shared/directives/resizable-drawer.directive';
import { ServiceOfferingsService } from '../../core/services/service-offerings.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { CategoriesService } from '../../core/services/categories.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import type { ServiceOffering, Category, CatalogFiltersState, EnabledFilters } from '../../core/models';

@Component({
  selector: 'app-service-catalog',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    ZbSearchInputComponent,
    ZbEmptyStateContainerComponent,
    ServiceCard,
    CatalogFilters,
    ResizableDrawerDirective,
  ],
  templateUrl: './service-catalog.component.html',
  styleUrl: './service-catalog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceCatalog implements OnInit {
  @ViewChild(CatalogFilters) private catalogFiltersComp!: CatalogFilters;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly serviceOfferings = inject(ServiceOfferingsService);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly prefs = inject(UserPreferencesService);

  readonly loading = signal(true);
  readonly services = signal<ServiceOffering[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly sortBy = signal('title');
  readonly drawerOpen = signal(false);

  readonly providerFilter = signal<string | null>(null);
  readonly providerFilterName = signal<string | null>(null);

  readonly enabledFilters = this.prefs.enabledFilters;
  readonly catalogFilters = this.prefs.catalogFilters;
  readonly activeFilterCount = this.prefs.activeFilterCount;

  readonly filteredServices = computed(() => {
    let items = this.services();
    const term = this.searchTerm().toLowerCase();
    const cat = this.selectedCategory();
    const pid = this.providerFilter();

    if (term) {
      items = items.filter(
        (s) =>
          s.title.toLowerCase().includes(term) ||
          (s.description || '').toLowerCase().includes(term),
      );
    }
    if (cat) {
      items = items.filter((s) => s.category === cat);
    }
    if (pid) {
      items = items.filter((s) => s.provider_id === pid);
    }

    // Sort
    const sort = this.sortBy();
    if (sort === 'title') {
      items = [...items].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'category') {
      items = [...items].sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    } else if (sort === 'newest') {
      items = [...items].sort((a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      );
    }

    return items;
  });

  async ngOnInit() {
    const catId = this.route.snapshot.queryParams['category'];
    if (catId) this.selectedCategory.set(catId);

    const providerId = this.route.snapshot.queryParams['provider'];
    if (providerId) {
      this.providerFilter.set(providerId);
      this.loadProviderName(providerId);
    }

    try {
      const [svcResult] = await Promise.all([
        this.serviceOfferings.listServices({ pageSize: 200 }),
        this.categoriesService.loadCategories(),
      ]);
      this.services.set(svcResult.items || []);
      this.categories.set(this.categoriesService.getRootCategories());
    } catch (err) {
      console.warn('[ServiceCatalog] Failed to load:', err);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(term: string | null): void {
    this.searchTerm.set(term || '');
  }

  onCategorySelect(slug: string | null): void {
    this.selectedCategory.set(slug);
  }

  onServiceSelect(service: ServiceOffering): void {
    // No-op for now — card has provider context menu
  }

  onViewProviderServices(providerId: string): void {
    this.providerFilter.set(providerId);
    this.loadProviderName(providerId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { provider: providerId },
      queryParamsHandling: 'merge',
    });
  }

  onViewProviderProfile(providerId: string): void {
    this.router.navigate(['/providers', providerId]);
  }

  clearProviderFilter(): void {
    this.providerFilter.set(null);
    this.providerFilterName.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { provider: null },
      queryParamsHandling: 'merge',
    });
  }

  isCategorySelected(slug: string): boolean {
    return this.selectedCategory() === slug;
  }

  onFiltersChange(filters: CatalogFiltersState): void {
    this.prefs.setCatalogFilters(filters);
  }

  onEnabledChange(enabled: EnabledFilters): void {
    this.prefs.setEnabledFilters(enabled);
  }

  toggleDrawer(): void {
    const opening = !this.drawerOpen();
    this.drawerOpen.set(opening);
    if (opening && this.activeFilterCount() === 0) {
      setTimeout(() => this.catalogFiltersComp?.openFilterMenu(), 300);
    }
  }

  private async loadProviderName(providerId: string): Promise<void> {
    try {
      const provider = await this.providerProfiles.getProvider(providerId);
      if (provider) {
        this.providerFilterName.set(provider.display_name);
      }
    } catch {
      this.providerFilterName.set(null);
    }
  }
}
