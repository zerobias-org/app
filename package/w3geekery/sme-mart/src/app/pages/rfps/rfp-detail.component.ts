import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe, TitleCasePipe, CurrencyPipe } from '@angular/common';
import { BidCard, type BidCardData } from '../../shared/components/bid-card/bid-card.component';
import { SmeMartProjectService } from '../../core/services/sme-mart-project.service';
import { BidsService } from '../../core/services/bids.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { EngagementLifecycleService } from '../../core/services/engagement-lifecycle.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import type { BidSummaryRow, ComplianceSummary, SmeMartProject } from '../../core/models';

@Component({
  selector: 'app-rfp-detail',
  standalone: true,
  imports: [
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    DatePipe,
    TitleCasePipe,
    CurrencyPipe,
    BidCard,
  ],
  templateUrl: './rfp-detail.component.html',
  styleUrl: './rfp-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfpDetail implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly impersonation = inject(ImpersonationService);
  private readonly projects = inject(SmeMartProjectService);
  private readonly bids = inject(BidsService);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly lifecycle = inject(EngagementLifecycleService);

  // --- local signals (no EngagementContextService) ---
  readonly loading = signal(true);
  readonly rfp = signal<SmeMartProject | null>(null);
  readonly bidSummaries = signal<BidSummaryRow[]>([]);
  readonly currentUserId = signal<string | null>(null);
  readonly currentProviderId = signal<string | null>(null);

  readonly status = computed(() => this.rfp()?.status || 'draft');

  // TODO(Plan 075 Phase 4): SmeMartProject doesn't carry buyer ID yet.
  // Owner check needs platform context or a buyerUserId field on SmeMartProject.
  readonly isOwner = computed(() => {
    const uid = this.currentUserId();
    const project = this.rfp();
    return !!(uid && project);
  });

  readonly parsedBids = computed<BidCardData[]>(() => {
    const summaries = this.bidSummaries();
    if (summaries.length === 0) return [];

    return summaries.map(s => ({
      id: s.id,
      provider_id: s.provider_id,
      cover_letter: s.cover_letter,
      proposed_price: s.proposed_price,
      proposed_timeline: s.proposed_timeline,
      status: s.status,
      created_at: s.created_at,
      executive_summary: s.executive_summary,
      team_description: s.team_description,
      total_estimated_hours: s.total_estimated_hours,
      compliance: this.buildComplianceSummary(s),
    }));
  });

  readonly hasAlreadyBid = computed(() => {
    const pid = this.currentProviderId();
    if (!pid) return false;
    return this.parsedBids().some(p => p.provider_id === pid);
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.params['id'];
    try {
      const project = await this.projects.getProject(id);

      if (!project) {
        this.snackBar.open('RFP not found', 'OK', { duration: 3000 });
        this.router.navigate(['/rfps']);
        return;
      }

      // If this project is active (has engagement link), redirect to engagement route
      if (project.status === 'active' || project.engagementId) {
        this.router.navigate(['/engagements', project.engagementId || id, 'overview'], { replaceUrl: true });
        return;
      }

      this.rfp.set(project);

      // Load bids with compliance summaries
      try {
        const summaries = await this.bids.listBidSummaries(id);
        this.bidSummaries.set(summaries);
      } catch {
        // Fall back to embedded bids from the view
      }

      const userId = this.impersonation.effectiveUserId();
      this.currentUserId.set(userId || null);

      if (userId) {
        const provider = await this.providerProfiles.getProviderByUserId(userId);
        if (provider) {
          this.currentProviderId.set(provider.id);
        }
      }
    } catch (err: any) {
      this.snackBar.open(`Failed to load: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  // ===========================================================================
  // RFP Actions
  // ===========================================================================

  startBidWizard(): void {
    const eng = this.rfp();
    if (!eng) return;
    this.router.navigate(['/rfps', eng.id, 'bid']);
  }

  async acceptBid(bidId: string): Promise<void> {
    const eng = this.rfp();
    if (!eng) return;

    try {
      const result = await this.lifecycle.acceptBid(bidId, eng.id);
      this.snackBar.open('Bid accepted — engagement created', 'OK', { duration: 4000 });
      // Navigate to the new engagement's overview
      this.router.navigate(['/engagements', eng.id, 'overview']);
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async rejectBid(bidId: string): Promise<void> {
    try {
      await this.bids.rejectBid(bidId);
      this.snackBar.open('Bid rejected', 'OK', { duration: 3000 });
      this.refresh();
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async withdrawBid(bidId: string): Promise<void> {
    try {
      await this.bids.withdrawBid(bidId);
      this.snackBar.open('Bid withdrawn', 'OK', { duration: 3000 });
      this.refresh();
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async publishRfp(): Promise<void> {
    const eng = this.rfp();
    if (!eng) return;
    try {
      await this.projects.publishRfp(eng.id);
      this.snackBar.open('RFP published', 'OK', { duration: 3000 });
      this.refresh();
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async closeRfp(): Promise<void> {
    const eng = this.rfp();
    if (!eng) return;
    try {
      await this.projects.updateProject(eng.id, { status: 'cancelled' });
      this.snackBar.open('RFP closed', 'OK', { duration: 3000 });
      this.refresh();
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  navigateToComparison(): void {
    const eng = this.rfp();
    if (eng) this.router.navigate(['/rfps', eng.id, 'compare']);
  }

  editRfp(): void {
    const eng = this.rfp();
    if (eng) this.router.navigate(['/rfps', eng.id, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/rfps']);
  }

  // ===========================================================================
  // Private
  // ===========================================================================

  private async refresh(): Promise<void> {
    const id = this.route.snapshot.params['id'];
    const [project, summaries] = await Promise.all([
      this.projects.getProject(id),
      this.bids.listBidSummaries(id).catch(() => [] as BidSummaryRow[]),
    ]);
    if (project) this.rfp.set(project);
    this.bidSummaries.set(summaries);
  }

  private buildComplianceSummary(s: BidSummaryRow): ComplianceSummary | null {
    if (s.total_responses === 0) return null;
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
}
