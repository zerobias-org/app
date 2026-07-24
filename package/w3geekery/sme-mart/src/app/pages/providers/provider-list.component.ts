import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProviderCard } from '../../shared/components/provider-card/provider-card.component';
import { ListPage, SortOption } from '../../shared/components/list-page/list-page.component';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import type { ProviderDirectoryView } from '../../core/models';

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

  readonly loading = this.providerProfiles.loading;
  readonly providers = signal<ProviderDirectoryView[]>([]);
  readonly searchTerm = signal('');
  readonly sortBy = signal('name');

  readonly sortOptions: SortOption[] = [
    { value: 'name', label: 'Name' },
    { value: 'verified', label: 'Verified' },
    { value: 'skills', label: 'Skills' },
  ];

  readonly filteredProviders = computed(() => {
    let items = this.providers();
    const term = this.searchTerm().toLowerCase();

    // Text search
    if (term) {
      items = items.filter(
        (p) =>
          p.legalName.toLowerCase().includes(term) ||
          (p.tagline?.toLowerCase().includes(term) ?? false),
      );
    }

    // Sort
    const sort = this.sortBy();
    if (sort === 'verified') {
      items = [...items].sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0));
    } else if (sort === 'name') {
      items = [...items].sort((a, b) => a.legalName.localeCompare(b.legalName));
    } else if (sort === 'skills') {
      items = [...items].sort((a, b) => b.skillCount - a.skillCount);
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
      const result = await this.providerProfiles.listProviders(undefined, 100);
      this.providers.set(result.items || []);
    } catch (err) {
      console.warn('[ProviderList] Failed to load:', err);
    }
  }
}
