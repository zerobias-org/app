import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { ZbSearchInputComponent, ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { EngagementCard } from '../../shared/components/engagement-card/engagement-card.component';
import { CatalogFilters } from '../../shared/components/catalog-filters/catalog-filters.component';
import { WorkRequestsService } from '../../core/services/work-requests.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import type {
  EngagementSummaryRow,
  RequestStatus,
  CatalogFiltersState,
  EnabledFilters,
} from '../../core/models';

type LifecycleFilter = 'all' | 'rfp' | 'engagement';

@Component({
  selector: 'app-engagement-list',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatBadgeModule,
    MatChipsModule,
    FormsModule,
    ZbSearchInputComponent,
    ZbEmptyStateContainerComponent,
    EngagementCard,
    CatalogFilters,
  ],
  templateUrl: './engagement-list.component.html',
  styleUrl: './engagement-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementList implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly impersonation = inject(ImpersonationService);
  private readonly workRequests = inject(WorkRequestsService);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly prefs = inject(UserPreferencesService);

  readonly loading = this.workRequests.loading;
  readonly engagements = signal<EngagementSummaryRow[]>([]);
  readonly searchTerm = signal('');
  readonly lifecycleFilter = signal<LifecycleFilter>('all');
  readonly statusFilter = signal<RequestStatus | 'all'>('all');
  readonly sortBy = signal<'newest' | 'budget_high'>('newest');
  readonly myProposalsOnly = signal(false);
  readonly drawerOpen = signal(false);
  readonly currentProviderId = signal<string | null>(null);

  readonly enabledFilters = this.prefs.enabledFilters;
  readonly catalogFilters = this.prefs.catalogFilters;
  readonly activeFilterCount = this.prefs.activeFilterCount;

  readonly filteredEngagements = computed(() => {
    let items = this.engagements();

    // Lifecycle filter
    const lf = this.lifecycleFilter();
    if (lf === 'rfp') {
      items = items.filter(e => !e.engagement_tag);
    } else if (lf === 'engagement') {
      items = items.filter(e => !!e.engagement_tag);
    }

    // My proposals filter
    if (this.myProposalsOnly()) {
      const pid = this.currentProviderId();
      if (pid) {
        items = items.filter(e => e.accepted_provider_id === pid);
      }
    }

    // Text search
    const term = this.searchTerm().toLowerCase();
    if (term) {
      items = items.filter(e =>
        e.title.toLowerCase().includes(term) ||
        (e.description || '').toLowerCase().includes(term) ||
        (e.engagement_tag || '').toLowerCase().includes(term),
      );
    }

    // Status filter
    const sf = this.statusFilter();
    if (sf !== 'all') {
      items = items.filter(e => e.status === sf);
    }

    // Sort
    const sort = this.sortBy();
    if (sort === 'newest') {
      items = [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === 'budget_high') {
      items = [...items].sort((a, b) => parseFloat(b.budget_max || '0') - parseFloat(a.budget_max || '0'));
    }

    return items;
  });

  async ngOnInit() {
    const q = this.route.snapshot.queryParams['q'];
    if (q) this.searchTerm.set(q);

    await this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      const [engagementResult] = await Promise.all([
        this.workRequests.listEngagements({ pageSize: 200 }),
        this.loadCurrentProvider(),
      ]);
      this.engagements.set(engagementResult.items || []);
    } catch (err) {
      console.warn('[EngagementList] Failed to load:', err);
    }
  }

  private async loadCurrentProvider(): Promise<void> {
    try {
      const userId = this.impersonation.effectiveUserId();
      if (userId) {
        const provider = await this.providerProfiles.getProviderByUserId(userId);
        if (provider) {
          this.currentProviderId.set(provider.id);
        }
      }
    } catch {
      // Not a provider — fine
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
    this.drawerOpen.update(v => !v);
  }

  toggleMyProposals(): void {
    this.myProposalsOnly.update(v => !v);
  }

  navigateToNew(): void {
    this.router.navigate(['/engagements/new']);
  }
}
