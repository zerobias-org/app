import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { ZbSearchInputComponent, ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { ServiceCard } from '../../shared/components/service-card/service-card.component';
import { ServiceOfferingsService } from '../../core/services/service-offerings.service';
import { CategoriesService } from '../../core/services/categories.service';
import type { ServiceOffering, Category } from '../../core/models';

@Component({
  selector: 'app-service-catalog',
  standalone: true,
  imports: [
    MatChipsModule,
    ZbSearchInputComponent,
    ZbEmptyStateContainerComponent,
    ServiceCard,
  ],
  templateUrl: './service-catalog.component.html',
  styleUrl: './service-catalog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceCatalog implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly serviceOfferings = inject(ServiceOfferingsService);
  private readonly categoriesService = inject(CategoriesService);

  readonly loading = signal(true);
  readonly services = signal<ServiceOffering[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly searchTerm = signal('');

  readonly filteredServices = computed(() => {
    let items = this.services();
    const term = this.searchTerm().toLowerCase();
    const cat = this.selectedCategory();

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
    return items;
  });

  async ngOnInit() {
    const catId = this.route.snapshot.queryParams['category'];
    if (catId) this.selectedCategory.set(catId);

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
    if (service.provider_id) {
      this.router.navigate(['/providers', service.provider_id]);
    }
  }

  isCategorySelected(slug: string): boolean {
    return this.selectedCategory() === slug;
  }
}
