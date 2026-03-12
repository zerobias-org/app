import {
  Component, inject, signal, ChangeDetectionStrategy, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { JsonPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ZerobiasClientApp } from '@zerobias-com/zerobias-client';
import { ZbChipColorsDirective, ZbCustomizableTableComponent, ZbResourceStatusComponent } from '@zerobias-org/ngx-library';
import { WorkRequestsService } from '../../../core/services/work-requests.service';
import type { EngagementSummaryRow } from '../../../core/models';

@Component({
  selector: 'app-org-engagements-tab',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule, MatChipsModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule,
    ZbChipColorsDirective, ZbCustomizableTableComponent, ZbResourceStatusComponent,
  ],
  providers: [JsonPipe],
  template: `
    <div class="org-engagements">
      @if (!loading() && engagements().length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">work_off</mat-icon>
          <h3>No engagements yet</h3>
          <p>Engagements for this organization will appear here.</p>
          <a mat-flat-button routerLink="/rfps">
            <mat-icon>add</mat-icon>
            Browse RFPs
          </a>
        </div>
      } @else {
        <zb-customizable-table
          [columns]="columns"
          [columnLabels]="columnLabels"
          [data]="engagements()"
          [loading]="loading()"
          [page]="page"
          [templateRefs]="cellTemplates"
          [translateHeaders]="false"
          [sortDisabled]="false"
          [selectRowOnClick]="false"
          [emitRowClick]="true"
          [hoverable]="true"
          [highlightActiveRow]="true"
          [multiSelect]="false"
          (rowClick)="onRowClick($event)"
        />
      }
    </div>

    <!-- Custom cell templates -->
    <ng-template #categoryTpl let-row>
      <mat-chip class="chip-condensed" zbChipColors [zbChipColor]="categoryColor(row.category)">
        {{ row.category }}
      </mat-chip>
    </ng-template>

    <ng-template #statusTpl let-row>
      <zb-resource-status [label]="normalizeStatus(row.status)" />
    </ng-template>

    <ng-template #bidsTpl let-row>
      {{ row.bid_count || 0 }}
    </ng-template>

    <ng-template #providerTpl let-row>
      @if (row.accepted_provider_id) {
        <a class="provider-link" [routerLink]="['/providers', row.accepted_provider_id]" (click)="$event.stopPropagation()">
          {{ row.accepted_provider_name }}
        </a>
      } @else {
        <span class="no-provider">—</span>
      }
    </ng-template>

    <ng-template #dateTpl let-row>
      {{ formatDate(row.created_at) }}
    </ng-template>
  `,
  styles: [`
    .org-engagements { min-height: 200px; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 24px;
      text-align: center;
      color: var(--mat-sys-on-surface-variant, #666);
    }
    .empty-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
    .empty-state h3 { margin: 0 0 4px; font-weight: 500; }
    .empty-state p { margin: 0 0 16px; font-size: 14px; }

    .provider-link {
      color: var(--mat-sys-primary, #1976d2);
      text-decoration: none;
      font-weight: 500;
    }
    .provider-link:hover { text-decoration: underline; }
    .no-provider { color: var(--mat-sys-on-surface-variant, #999); }

    .chip-condensed {
      --mat-chip-container-height: 24px;
      --mat-chip-label-text-size: 12px;
      --mat-chip-container-shape-radius: 4px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementsTab implements OnInit {
  private readonly router = inject(Router);
  private readonly app = inject(ZerobiasClientApp);
  private readonly workRequests = inject(WorkRequestsService);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild('categoryTpl', { static: true }) categoryTpl!: TemplateRef<any>;
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<any>;
  @ViewChild('bidsTpl', { static: true }) bidsTpl!: TemplateRef<any>;
  @ViewChild('providerTpl', { static: true }) providerTpl!: TemplateRef<any>;
  @ViewChild('dateTpl', { static: true }) dateTpl!: TemplateRef<any>;

  readonly loading = signal(true);
  readonly engagements = signal<EngagementSummaryRow[]>([]);

  readonly page: Record<string, any> = {};
  readonly columns = ['title', 'category', 'status', 'bid_count', 'accepted_provider_name', 'created_at'];
  readonly columnLabels = ['Title', 'Category', 'Status', 'Bids', 'Provider', 'Created'];

  cellTemplates: Record<string, TemplateRef<any>> = {};

  async ngOnInit(): Promise<void> {
    // Wire up custom cell templates
    this.cellTemplates = {
      category: this.categoryTpl,
      status: this.statusTpl,
      bid_count: this.bidsTpl,
      accepted_provider_name: this.providerTpl,
      created_at: this.dateTpl,
    };

    try {
      const result = await this.workRequests.listEngagements({ pageNumber: 1, pageSize: 100 });
      this.engagements.set(result.items || []);
    } catch (err: any) {
      this.snackBar.open(`Failed to load engagements: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  onRowClick(row: EngagementSummaryRow): void {
    this.router.navigate(['/engagements', row.id]);
  }

  /** Map SME Mart request statuses to zb-resource-status color classes. */
  normalizeStatus(status: string): string {
    const mapped: Record<string, string> = {
      open: 'ACTIVE',
      cancelled: 'DELETED',
    };
    const key = (status || '').toLowerCase();
    return mapped[key] ?? key.replace(/\s+/g, '_');
  }

  /** Stable color for any category string. */
  categoryColor(category: string): string {
    const palette = [
      '#2196F3', '#9C27B0', '#009688', '#FF9800', '#E91E63',
      '#3F51B5', '#00BCD4', '#4CAF50', '#FF5722', '#607D8B',
    ];
    let hash = 0;
    for (let i = 0; i < (category || '').length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
  }

  formatDate(isoDate: string): string {
    try {
      return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }
}
