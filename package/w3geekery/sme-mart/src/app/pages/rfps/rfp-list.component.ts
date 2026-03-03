import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { EngagementCard } from '../../shared/components/engagement-card/engagement-card.component';
import { ListPage, SortOption } from '../../shared/components/list-page/list-page.component';
import { WorkRequestsService } from '../../core/services/work-requests.service';
import { RfpDialog } from '../../shared/components/rfp-dialog/rfp-dialog.component';
import type { EngagementSummaryRow, RequestStatus } from '../../core/models';

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
  private readonly workRequests = inject(WorkRequestsService);

  readonly loading = this.workRequests.loading;
  readonly rfps = signal<EngagementSummaryRow[]>([]);
  readonly searchTerm = signal('');
  readonly statusFilter = signal<RequestStatus | 'all'>('all');
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
    try {
      const result = await this.workRequests.listEngagements({ pageSize: 200 });
      const rfpsOnly = (result.items || []).filter(e => !e.engagement_tag);
      this.rfps.set(rfpsOnly);
    } catch (err) {
      console.warn('[RfpList] Failed to load:', err);
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
