import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BidsService } from '../../core/services/bids.service';
import { BidResponseService } from '../../core/services/bid-response.service';
import { EngagementsService } from '../../core/services/engagements.service';
import { EngagementLifecycleService } from '../../core/services/engagement-lifecycle.service';
import {
  BidComparison, type ComparisonBid, type CategoryCompliance,
} from '../../shared/components/bid-comparison/bid-comparison.component';
import {
  BidReview, type RequirementGroup, type RequirementWithResponse,
} from '../../shared/components/bid-review/bid-review.component';
import {
  AcceptBidDialog, type AcceptBidDialogData, type AcceptBidDialogResult,
} from '../../shared/components/accept-bid-dialog/accept-bid-dialog.component';
import type {
  BidSummaryRow, BidResponse, ComplianceSummary,
} from '../../core/models';
import type { RfpTaskGroup, RfpData } from '../../core/models/rfp.model';

type ViewMode = 'comparison' | 'review';

@Component({
  selector: 'app-bid-comparison-page',
  standalone: true,
  imports: [
    MatSnackBarModule, MatDialogModule, MatButtonModule, MatIconModule,
    BidComparison, BidReview,
  ],
  template: `
    <div class="comparison-page">
      @if (loading()) {
        <p class="loading-msg">Loading bids...</p>
      } @else {
        <div class="page-header">
          <button mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon> Back to RFP
          </button>
        </div>

        @if (viewMode() === 'comparison') {
          <app-bid-comparison
            [bids]="comparisonBids()"
            [rfpTitle]="rfpTitle()"
            (viewBid)="onViewBid($event)"
            (acceptBid)="onAcceptBid($event)"
            (rejectBid)="onRejectBid($event)" />
        } @else {
          @if (reviewBid(); as bid) {
            <app-bid-review
              [bid]="bid"
              [requirementGroups]="reviewGroups()"
              (accept)="onAcceptBid($event)"
              (reject)="onRejectBid($event)"
              (back)="backToComparison()" />
          }
        }
      }
    </div>
  `,
  styles: [`
    .comparison-page {
      padding: 1.5rem;
    }

    .loading-msg {
      text-align: center;
      padding: 3rem;
      color: var(--zb-secondary-text);
    }

    .page-header {
      margin-bottom: 1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BidComparisonPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly bids = inject(BidsService);
  private readonly bidResponses = inject(BidResponseService);
  private readonly engagements = inject(EngagementsService);
  private readonly lifecycle = inject(EngagementLifecycleService);

  readonly loading = signal(true);
  readonly viewMode = signal<ViewMode>('comparison');
  readonly rfpTitle = signal('');
  readonly bidSummaries = signal<BidSummaryRow[]>([]);
  readonly taskGroups = signal<RfpTaskGroup[]>([]);

  // For review mode
  readonly selectedBidId = signal<string | null>(null);
  readonly selectedBidResponses = signal<BidResponse[]>([]);

  private rfpId = '';

  readonly comparisonBids = computed<ComparisonBid[]>(() => {
    const summaries = this.bidSummaries();
    return summaries
      .filter(s => s.status !== 'draft' && s.status !== 'withdrawn')
      .map(s => this.toComparisonBid(s));
  });

  readonly reviewBid = computed<BidSummaryRow | null>(() => {
    const id = this.selectedBidId();
    if (!id) return null;
    return this.bidSummaries().find(s => s.id === id) || null;
  });

  readonly reviewGroups = computed<RequirementGroup[]>(() => {
    const groups = this.taskGroups();
    const responses = this.selectedBidResponses();
    const responseMap = new Map(responses.map(r => [r.requirement_id, r]));

    return groups.map(g => {
      const reqs: RequirementWithResponse[] = g.requirements.map(req => ({
        requirementId: req.id,
        requirementText: req.title + (req.description ? ` — ${req.description}` : ''),
        taskType: g.taskTypeTagName,
        response: responseMap.get(req.id),
      }));

      const met = reqs.filter(r => r.response?.compliance_status === 'met').length;
      const responded = reqs.filter(r => r.response).length;

      return {
        taskType: g.displayName,
        requirements: reqs,
        met,
        total: reqs.length,
        responded,
      };
    });
  });

  async ngOnInit(): Promise<void> {
    this.rfpId = this.route.snapshot.paramMap.get('id') || '';

    try {
      // Load RFP
      const rfp = await this.engagements.getEngagement(this.rfpId);
      if (!rfp) {
        this.snackBar.open('RFP not found', 'Dismiss', { duration: 3000 });
        this.router.navigate(['/rfps']);
        return;
      }
      this.rfpTitle.set(rfp.title || '');

      // Load requirements from wizard data
      const rawWr = await this.engagements.getWorkRequest(this.rfpId);
      const rfpData = (rawWr as any)?.rfp_wizard_data as RfpData | undefined;
      if (rfpData?.taskGroups) {
        this.taskGroups.set(rfpData.taskGroups);
      }

      // Load bid summaries
      const summaries = await this.bids.listBidSummaries(this.rfpId);
      this.bidSummaries.set(summaries);
    } catch (err: any) {
      this.snackBar.open(`Failed to load: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  async onViewBid(bidId: string): Promise<void> {
    this.selectedBidId.set(bidId);

    // Load per-requirement responses for this bid
    try {
      const responses = await this.bidResponses.listByBid(bidId);
      this.selectedBidResponses.set(responses);
    } catch {
      this.selectedBidResponses.set([]);
    }

    this.viewMode.set('review');
  }

  backToComparison(): void {
    this.viewMode.set('comparison');
    this.selectedBidId.set(null);
    this.selectedBidResponses.set([]);
  }

  async onAcceptBid(bidId: string): Promise<void> {
    const bid = this.bidSummaries().find(s => s.id === bidId);
    if (!bid) return;

    const otherPending = this.bidSummaries().filter(
      s => s.id !== bidId && s.status === 'pending',
    ).length;

    const dialogRef = this.dialog.open<AcceptBidDialog, AcceptBidDialogData, AcceptBidDialogResult>(
      AcceptBidDialog,
      {
        data: {
          bidId,
          providerName: bid.provider_display_name || 'Vendor',
          proposedPrice: bid.proposed_price,
          proposedTimeline: bid.proposed_timeline,
          compliance: this.buildCompliance(bid),
          otherBidCount: otherPending,
        },
        width: '500px',
      },
    );

    const result = await dialogRef.afterClosed().toPromise();
    if (!result?.confirmed) return;

    try {
      // Reject all other pending bids
      const otherBids = this.bidSummaries().filter(
        s => s.id !== bidId && s.status === 'pending',
      );
      await Promise.all(otherBids.map(b => this.bids.rejectBid(b.id)));

      // Accept the selected bid → creates engagement
      const acceptResult = await this.lifecycle.acceptBid(bidId, this.rfpId);
      this.snackBar.open('Bid accepted — engagement created', 'OK', { duration: 4000 });
      this.router.navigate(['/engagements', this.rfpId, 'overview']);
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async onRejectBid(bidId: string): Promise<void> {
    try {
      await this.bids.rejectBid(bidId);
      this.snackBar.open('Bid rejected', 'OK', { duration: 3000 });
      await this.refresh();
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  goBack(): void {
    this.router.navigate(['/rfps', this.rfpId]);
  }

  private async refresh(): Promise<void> {
    const summaries = await this.bids.listBidSummaries(this.rfpId).catch(() => []);
    this.bidSummaries.set(summaries);
  }

  private toComparisonBid(s: BidSummaryRow): ComparisonBid {
    return {
      id: s.id,
      provider_display_name: s.provider_display_name || 'Vendor',
      provider_headline: s.provider_headline ?? undefined,
      proposed_price: s.proposed_price,
      proposed_timeline: s.proposed_timeline,
      total_estimated_hours: s.total_estimated_hours ?? null,
      status: s.status,
      compliance: this.buildCompliance(s),
      categoryCompliance: this.buildCategoryCompliance(s),
      sum_estimated_cost: Number(s.sum_estimated_cost) || 0,
    };
  }

  private buildCompliance(s: BidSummaryRow): ComplianceSummary | null {
    if (!s.total_responses) return null;
    return {
      met: Number(s.met_count) || 0,
      partially_met: Number(s.partial_count) || 0,
      not_met: Number(s.not_met_count) || 0,
      not_applicable: Number(s.na_count) || 0,
      planned: Number(s.planned_count) || 0,
      total: Number(s.total_responses) || 0,
      responded: Number(s.total_responses) || 0,
    };
  }

  /**
   * Build per-category compliance from requirement groups.
   * Since v_bid_summary doesn't have per-category data, we only have
   * totals. Per-category drill-down is in the review view (loaded on demand).
   * For comparison table, we show placeholder data from task groups.
   */
  private buildCategoryCompliance(_s: BidSummaryRow): CategoryCompliance[] {
    // Category compliance requires loading bid_responses per bid,
    // which we do lazily in the review view. For the comparison table,
    // we show total requirements per category from the RFP structure.
    return this.taskGroups().map(g => ({
      category: g.displayName,
      met: 0, // populated when responses are loaded
      total: g.requirements.length,
    }));
  }
}
