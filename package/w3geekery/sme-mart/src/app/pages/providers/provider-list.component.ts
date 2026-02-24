import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { ZbSearchInputComponent, ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { ProviderCard } from '../../shared/components/provider-card/provider-card.component';
import { CatalogFilters } from '../../shared/components/catalog-filters/catalog-filters.component';
import { ResizableDrawerDirective } from '../../shared/directives/resizable-drawer.directive';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { CatalogService } from '../../core/services/catalog.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import type { ProviderDirectoryRow, CatalogFiltersState, EnabledFilters } from '../../core/models';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatBadgeModule,
    FormsModule,
    ZbSearchInputComponent,
    ZbEmptyStateContainerComponent,
    ProviderCard,
    CatalogFilters,
    ResizableDrawerDirective,
  ],
  templateUrl: './provider-list.component.html',
  styleUrl: './provider-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderList implements OnInit {
  @ViewChild(CatalogFilters) private catalogFiltersComp!: CatalogFilters;
  private readonly route = inject(ActivatedRoute);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly catalog = inject(CatalogService);
  private readonly prefs = inject(UserPreferencesService);

  readonly loading = this.providerProfiles.loading;
  readonly providers = signal<ProviderDirectoryRow[]>([]);
  readonly searchTerm = signal('');
  readonly sortBy = signal('name');
  readonly drawerOpen = signal(false);

  readonly enabledFilters = this.prefs.enabledFilters;
  readonly catalogFilters = this.prefs.catalogFilters;
  readonly activeFilterCount = this.prefs.activeFilterCount;

  readonly filteredProviders = computed(() => {
    let items = this.providers();
    const term = this.searchTerm().toLowerCase();
    const filters = this.catalogFilters();

    // Text search
    if (term) {
      items = items.filter(
        (p) =>
          p.display_name.toLowerCase().includes(term) ||
          (p.headline || '').toLowerCase().includes(term),
      );
    }

    // Catalog filter application (client-side)
    if (filters.skills.length) {
      items = items.filter((p) => {
        const skills = this.parseJson<{ zerobias_skill_id: string }>(p.skills);
        return filters.skills.some((id) => skills.some((s) => s.zerobias_skill_id === id));
      });
    }
    if (filters.roles.length) {
      items = items.filter((p) => {
        const roles = this.parseJson<{ zerobias_role_id: string }>(p.roles);
        return filters.roles.some((id) => roles.some((r) => r.zerobias_role_id === id));
      });
    }

    // Sort
    const sort = this.sortBy();
    if (sort === 'rating') {
      items = [...items].sort((a, b) => parseFloat(b.rating_average || '0') - parseFloat(a.rating_average || '0'));
    } else if (sort === 'name') {
      items = [...items].sort((a, b) => a.display_name.localeCompare(b.display_name));
    } else if (sort === 'jobs') {
      items = [...items].sort((a, b) => b.total_jobs_completed - a.total_jobs_completed);
    }

    return items;
  });

  async ngOnInit() {
    // Initial search from query params
    const q = this.route.snapshot.queryParams['q'];
    if (q) this.searchTerm.set(q);

    await this.loadProviders();
  }

  async loadProviders(): Promise<void> {
    try {
      const result = await this.providerProfiles.listProviders({ pageSize: 100 });
      this.providers.set(result.items || []);
    } catch (err) {
      console.warn('[ProviderList] Failed to load:', err);
    }
  }

  onSearch(term: string | null): void {
    this.searchTerm.set(term || '');
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

  private parseJson<T>(json: string | unknown): T[] {
    if (!json) return [];
    try {
      return typeof json === 'string' ? JSON.parse(json) : (json as T[]);
    } catch {
      return [];
    }
  }
}
