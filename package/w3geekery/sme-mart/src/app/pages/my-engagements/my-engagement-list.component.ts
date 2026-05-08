import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ZbSearchInputComponent, ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { EngagementCard } from '../../shared/components/engagement-card/engagement-card.component';
import { EngagementsService } from '../../core/services/engagements.service';
import type { EngagementSummaryRow, RequestStatus } from '../../core/models';

@Component({
  selector: 'app-my-engagement-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    ZbSearchInputComponent,
    ZbEmptyStateContainerComponent,
    EngagementCard,
  ],
  templateUrl: './my-engagement-list.component.html',
  styleUrl: './my-engagement-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyEngagementList implements OnInit {
  private readonly engagements = inject(EngagementsService);
  private readonly app = inject(ZerobiasClientApp);

  readonly loading = signal(true);
  readonly items = signal<EngagementSummaryRow[]>([]);
  readonly searchTerm = signal('');
  readonly statusFilter = signal<RequestStatus | 'all'>('all');
  readonly sortBy = signal<'newest' | 'status'>('newest');

  readonly filteredEngagements = computed(() => {
    let items = this.items();

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
      items = [...items].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else if (sort === 'status') {
      const order: Record<string, number> = { in_progress: 0, open: 1, draft: 2, completed: 3, cancelled: 4 };
      items = [...items].sort((a, b) =>
        (order[a.status] ?? 99) - (order[b.status] ?? 99),
      );
    }

    return items;
  });

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      // Scope to engagements where the active org is the buyer. Provider-side view
      // is a separate concern (no providerZerobiasOrgId field on the schema today;
      // direction is implicit in the engagement name "<Buyer> <- <Provider>").
      const buyerOrgId = String(this.app.getCurrentOrgId() ?? '') || undefined;
      const result = await this.engagements.listEngagements({ pageSize: 200, buyerOrgId });
      this.items.set(result.items || []);
    } catch (err) {
      console.warn('[MyEngagementList] Failed to load:', err);
    } finally {
      this.loading.set(false);
    }
  }

  onSearch(term: string | null): void {
    this.searchTerm.set(term || '');
  }
}
