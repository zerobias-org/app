import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { EngagementCard } from '../../shared/components/engagement-card/engagement-card.component';
import { ListPage, SortOption } from '../../shared/components/list-page/list-page.component';
import { WorkRequestsService } from '../../core/services/work-requests.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import { RfpDialog } from '../../shared/components/rfp-dialog/rfp-dialog.component';
import type { EngagementSummaryRow, RequestStatus } from '../../core/models';

type LifecycleFilter = 'all' | 'rfp' | 'engagement';

@Component({
  selector: 'app-engagement-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    EngagementCard,
    ListPage,
  ],
  templateUrl: './engagement-list.component.html',
  styleUrl: './engagement-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementList implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly impersonation = inject(ImpersonationService);
  private readonly workRequests = inject(WorkRequestsService);
  private readonly providerProfiles = inject(ProviderProfilesService);

  readonly loading = this.workRequests.loading;
  readonly engagements = signal<EngagementSummaryRow[]>([]);
  readonly searchTerm = signal('');
  readonly lifecycleFilter = signal<LifecycleFilter>('all');
  readonly statusFilter = signal<RequestStatus | 'all'>('all');
  readonly sortBy = signal<string>('newest');
  readonly myProposalsOnly = signal(false);
  readonly currentProviderId = signal<string | null>(null);

  readonly sortOptions: SortOption[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'budget_high', label: 'Budget: High to Low' },
  ];

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

  toggleMyProposals(): void {
    this.myProposalsOnly.update(v => !v);
  }

  openNewRfpDialog(): void {
    const ref = this.dialog.open(RfpDialog, { width: '560px' });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.router.navigate(['/engagements', result.id]);
      }
    });
  }
}
