import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProviderCard } from '../../shared/components/provider-card/provider-card.component';
import { ListPage, SortOption } from '../../shared/components/list-page/list-page.component';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { CatalogService } from '../../core/services/catalog.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import type { ProviderDirectoryRow } from '../../core/models';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [
    ProviderCard,
    ListPage,
  ],
  templateUrl: './provider-list.component.html',
  styleUrl: './provider-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProviderList implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly catalog = inject(CatalogService);
  private readonly prefs = inject(UserPreferencesService);

  readonly loading = this.providerProfiles.loading;
  readonly providers = signal<ProviderDirectoryRow[]>([]);
  readonly searchTerm = signal('');
  readonly sortBy = signal('name');

  readonly sortOptions: SortOption[] = [
    { value: 'name', label: 'Name' },
    { value: 'rating', label: 'Rating' },
    { value: 'jobs', label: 'Jobs Completed' },
  ];

  readonly filteredProviders = computed(() => {
    let items = this.providers();
    const term = this.searchTerm().toLowerCase();
    const filters = this.prefs.catalogFilters();

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
      items = [...items].sort((a, b) => (b.total_jobs_completed ?? 0) - (a.total_jobs_completed ?? 0));
    }

    return items;
  });

  async ngOnInit() {
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

  private parseJson<T>(json: string | unknown): T[] {
    if (!json) return [];
    try {
      return typeof json === 'string' ? JSON.parse(json) : (json as T[]);
    } catch {
      return [];
    }
  }
}
