import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { EngagementCard } from '../../shared/components/engagement-card/engagement-card.component';
import { ListPage, SortOption } from '../../shared/components/list-page/list-page.component';
import { SmeMartProjectService } from '../../core/services/sme-mart-project.service';
import { RfpDialog } from '../../shared/components/rfp-dialog/rfp-dialog.component';
import type { EngagementSummaryRow } from '../../core/models';
import type { SmeMartProject } from '../../core/models';

@Component({
  selector: 'app-rfp-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    EngagementCard,
    ListPage,
  ],
  templateUrl: './rfp-list.component.html',
  styleUrl: './rfp-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfpList implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly projects = inject(SmeMartProjectService);

  readonly loading = signal(false);
  readonly rfps = signal<EngagementSummaryRow[]>([]);
  readonly searchTerm = signal('');
  readonly statusFilter = signal<string>('all');
  readonly sortBy = signal<string>('newest');

  readonly sortOptions: SortOption[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'budget_high', label: 'Budget: High to Low' },
  ];

  readonly filteredRfps = computed(() => {
    let items = this.rfps();

    const term = this.searchTerm().toLowerCase();
    if (term) {
      items = items.filter(e =>
        e.title.toLowerCase().includes(term) ||
        (e.description || '').toLowerCase().includes(term),
      );
    }

    const sf = this.statusFilter();
    if (sf !== 'all') {
      items = items.filter(e => e.status === sf);
    }

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
    this.loading.set(true);
    try {
      const result = await this.projects.listProjects({ pageSize: 200 });
      // Map SmeMartProject → EngagementSummaryRow shape for EngagementCard
      const items = (result.items || []).map(p => this.projectToCardRow(p));
      this.rfps.set(items);
    } catch (err) {
      console.warn('[RfpList] Failed to load:', err);
    } finally {
      this.loading.set(false);
    }
  }

  openWizard(): void {
    this.router.navigate(['/rfps/new']);
  }

  openNewRfpDialog(): void {
    const ref = this.dialog.open(RfpDialog, { width: '560px' });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.router.navigate(['/rfps', result.id]);
      }
    });
  }

  /**
   * Map SmeMartProject (camelCase) to EngagementSummaryRow (snake_case)
   * for EngagementCard compatibility. Will be removed when EngagementCard
   * is updated to accept SmeMartProject directly.
   */
  private projectToCardRow(p: SmeMartProject): EngagementSummaryRow {
    return {
      id: p.id,
      buyer_user_id: null,
      buyer_zerobias_user_id: '',
      buyer_zerobias_org_id: null,
      title: p.name,
      description: p.description || null,
      category: p.category || '',
      budget_type: p.budgetType || null,
      budget_min: p.budgetMin != null ? String(p.budgetMin) : null,
      budget_max: p.budgetMax != null ? String(p.budgetMax) : null,
      timeline: p.timeline || null,
      status: p.status as any,
      engagement_tag: null, // RFPs don't have engagement tags
      zerobias_tag_id: null,
      zerobias_boundary_id: null,
      zerobias_task_id: null,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
      buyer_display_name: null,
      buyer_avatar_url: null,
      bid_count: 0,
      pending_bid_count: 0,
      accepted_provider_name: null,
      accepted_provider_id: null,
    };
  }
}
