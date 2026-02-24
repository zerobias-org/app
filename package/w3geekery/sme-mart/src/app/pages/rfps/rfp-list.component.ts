import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { ZbSearchInputComponent, ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { EngagementCard } from '../../shared/components/engagement-card/engagement-card.component';
import { CatalogFilters } from '../../shared/components/catalog-filters/catalog-filters.component';
import { ResizableDrawerDirective } from '../../shared/directives/resizable-drawer.directive';
import { WorkRequestsService } from '../../core/services/work-requests.service';
import { UserPreferencesService } from '../../core/services/user-preferences.service';
import { RfpDialog } from '../../shared/components/rfp-dialog/rfp-dialog.component';
import type {
  EngagementSummaryRow,
  RequestStatus,
  CatalogFiltersState,
  EnabledFilters,
} from '../../core/models';

@Component({
  selector: 'app-rfp-list',
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
    EngagementCard,
    CatalogFilters,
    ResizableDrawerDirective,
  ],
  templateUrl: './rfp-list.component.html',
  styleUrl: './rfp-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfpList implements OnInit {
  @ViewChild(CatalogFilters) private catalogFiltersComp!: CatalogFilters;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly workRequests = inject(WorkRequestsService);
  private readonly prefs = inject(UserPreferencesService);

  readonly loading = this.workRequests.loading;
  readonly rfps = signal<EngagementSummaryRow[]>([]);
  readonly searchTerm = signal('');
  readonly statusFilter = signal<RequestStatus | 'all'>('all');
  readonly sortBy = signal<'newest' | 'budget_high'>('newest');
  readonly drawerOpen = signal(false);

  readonly enabledFilters = this.prefs.enabledFilters;
  readonly catalogFilters = this.prefs.catalogFilters;
  readonly activeFilterCount = this.prefs.activeFilterCount;

  readonly filteredRfps = computed(() => {
    let items = this.rfps();

    // Text search
    const term = this.searchTerm().toLowerCase();
    if (term) {
      items = items.filter(e =>
        e.title.toLowerCase().includes(term) ||
        (e.description || '').toLowerCase().includes(term),
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
      const result = await this.workRequests.listEngagements({ pageSize: 200 });
      // Filter to RFPs only (no engagement_tag)
      const rfpsOnly = (result.items || []).filter(e => !e.engagement_tag);
      this.rfps.set(rfpsOnly);
    } catch (err) {
      console.warn('[RfpList] Failed to load:', err);
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

  openNewRfpDialog(): void {
    const ref = this.dialog.open(RfpDialog, { width: '560px' });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.router.navigate(['/rfps', result.id]);
      }
    });
  }
}
