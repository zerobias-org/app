import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ServiceCard } from '../../shared/components/service-card/service-card.component';
import { ListPage, SortOption } from '../../shared/components/list-page/list-page.component';
import { ServiceOfferingsService } from '../../core/services/service-offerings.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { CategoriesService } from '../../core/services/categories.service';
import type { ServiceOffering, Category } from '../../core/models';

@Component({
  selector: 'app-service-catalog',
  standalone: true,
  imports: [
    MatIconModule,
    MatChipsModule,
    ServiceCard,
    ListPage,
  ],
  templateUrl: './service-catalog.component.html',
  styleUrl: './service-catalog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceCatalog implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly serviceOfferings = inject(ServiceOfferingsService);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly categoriesService = inject(CategoriesService);

  readonly loading = signal(true);
  readonly services = signal<ServiceOffering[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly sortBy = signal('title');

  readonly providerFilter = signal<string | null>(null);
  readonly providerFilterName = signal<string | null>(null);

  readonly sortOptions: SortOption[] = [
    { value: 'title', label: 'Title' },
    { value: 'category', label: 'Category' },
    { value: 'newest', label: 'Newest First' },
  ];

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
