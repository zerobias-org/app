import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe, TitleCasePipe, CurrencyPipe } from '@angular/common';
import { ZbEmptyStateContainerComponent } from '@zerobias-org/ngx-library';
import { ProposalCard, type ProposalCardData } from '../../shared/components/proposal-card/proposal-card.component';
import { ProposalForm, type ProposalFormData } from '../../shared/components/proposal-form/proposal-form.component';
import { TimelineView } from '../../shared/components/timeline-view/timeline-view.component';
import { TimelineComposer } from '../../shared/components/timeline-composer/timeline-composer.component';
import { TaskListPanel } from '../../shared/components/task-list-panel/task-list-panel.component';
import { WorkRequestsService } from '../../core/services/work-requests.service';
import { ProposalsService } from '../../core/services/proposals.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { EngagementLifecycleService } from '../../core/services/engagement-lifecycle.service';
import { EngagementTimelineService } from '../../core/services/engagement-timeline.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import type { EngagementDetailRow, Proposal, RequestStatus, TimelineEvent } from '../../core/models';

interface ParsedProposal extends Proposal {
  provider_display_name?: string;
  provider_headline?: string;
  provider_rating?: number;
}

@Component({
  selector: 'app-engagement-detail',
  standalone: true,
  imports: [
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    DatePipe,
    TitleCasePipe,
    CurrencyPipe,
    ZbEmptyStateContainerComponent,
    ProposalCard,
    TimelineView,
    TimelineComposer,
    TaskListPanel,
  ],
  templateUrl: './engagement-detail.component.html',
  styleUrl: './engagement-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EngagementDetail implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly impersonation = inject(ImpersonationService);
  private readonly workRequests = inject(WorkRequestsService);
  private readonly proposals = inject(ProposalsService);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly lifecycle = inject(EngagementLifecycleService);
  private readonly engagementTimeline = inject(EngagementTimelineService);

  private static readonly TAB_NAMES = ['overview', 'details', 'tasks', 'timeline'] as const;

  readonly engagement = signal<EngagementDetailRow | null>(null);
  readonly loading = signal(true);
  readonly currentUserId = signal<string | null>(null);
  readonly currentProviderId = signal<string | null>(null);
  readonly selectedTabIndex = signal(0);

  // Timeline (Activity) tab state — lazy-loaded on tab select
  readonly timelineEvents = signal<TimelineEvent[]>([]);
  readonly timelineLoading = signal(false);
  readonly timelineLoaded = signal(false);

  readonly parsedProposals = computed<ProposalCardData[]>(() => {
    const eng = this.engagement();
    if (!eng?.proposals) return [];
    try {
      const raw: ParsedProposal[] = typeof eng.proposals === 'string'
        ? JSON.parse(eng.proposals)
        : eng.proposals as any;
      return raw.map(p => ({
        id: p.id,
        provider_id: p.provider_id,
        provider_display_name: p.provider_display_name,
        provider_headline: p.provider_headline,
        provider_rating: p.provider_rating,
        cover_letter: p.cover_letter,
        proposed_price: p.proposed_price,
        proposed_timeline: p.proposed_timeline,
        status: p.status,
        created_at: p.created_at,
      }));
    } catch {
      return [];
    }
  });

  readonly isRfp = computed(() => !this.engagement()?.engagement_tag);
  readonly engagementTag = computed(() => this.engagement()?.engagement_tag || null);
  readonly status = computed(() => this.engagement()?.status || 'draft');
  readonly isOwner = computed(() => {
    const uid = this.currentUserId();
    const eng = this.engagement();
    return uid && eng ? eng.buyer_zerobias_user_id === uid : false;
  });
  readonly hasAlreadyProposed = computed(() => {
    const pid = this.currentProviderId();
    if (!pid) return false;
    return this.parsedProposals().some(p => p.provider_id === pid);
  });
  readonly acceptedProposal = computed(() =>
    this.parsedProposals().find(p => p.status === 'accepted') || null,
  );

  readonly statusColor = computed(() => {
    const colorMap: Record<RequestStatus, string> = {
      draft: 'default',
      open: 'primary',
      in_progress: 'accent',
      completed: 'primary',
      cancelled: 'warn',
    };
    return colorMap[this.status()] || 'default';
  });

  async ngOnInit(): Promise<void> {
    // Restore tab from query param
    const tabParam = this.route.snapshot.queryParams['tab'];
    if (tabParam) {
      const idx = EngagementDetail.TAB_NAMES.indexOf(tabParam);
      if (idx >= 0) this.selectedTabIndex.set(idx);
    }

    const id = this.route.snapshot.params['id'];
    try {
      const eng = await this.workRequests.getEngagement(id);

      if (!eng) {
        this.snackBar.open('Engagement not found', 'OK', { duration: 3000 });
        this.router.navigate(['/rfps']);
        return;
      }

      this.engagement.set(eng);
      const userId = this.impersonation.effectiveUserId();
      this.currentUserId.set(userId || null);

      // Check if current user has a provider profile
      if (userId) {
        const provider = await this.providerProfiles.getProviderByUserId(userId);
        if (provider) {
          this.currentProviderId.set(provider.id);
        }
      }
      // Trigger lazy-load for restored tab (onTabChange doesn't fire for initial index)
      // Tasks tab (2) self-loads via ngOnInit, but timeline (3) needs this
      const restoredTab = this.selectedTabIndex();
      if (restoredTab > 0) {
        setTimeout(() => this.onTabChange(restoredTab), 0);
      }
    } catch (err: any) {
      this.snackBar.open(`Failed to load: ${err.message}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  // ===========================================================================
  // Actions
  // ===========================================================================

  openProposalDialog(): void {
    const pid = this.currentProviderId();
    const eng = this.engagement();
    if (!pid || !eng) return;

    const dialogRef = this.dialog.open(ProposalForm, {
      data: { requestId: eng.id, providerId: pid } as ProposalFormData,
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.refresh();
    });
  }

  async acceptProposal(proposalId: string): Promise<void> {
    const eng = this.engagement();
    if (!eng) return;

    try {
      await this.lifecycle.acceptProposal(proposalId, eng.id);
      this.snackBar.open('Proposal accepted — engagement created', 'OK', { duration: 4000 });
      this.refresh();
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async rejectProposal(proposalId: string): Promise<void> {
    try {
      await this.proposals.rejectProposal(proposalId);
      this.snackBar.open('Proposal rejected', 'OK', { duration: 3000 });
      this.refresh();
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async withdrawProposal(proposalId: string): Promise<void> {
    try {
      await this.proposals.withdrawProposal(proposalId);
      this.snackBar.open('Proposal withdrawn', 'OK', { duration: 3000 });
      this.refresh();
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async publishRfp(): Promise<void> {
    const eng = this.engagement();
    if (!eng) return;
    try {
      await this.workRequests.updateRfp(eng.id, { status: 'open' });
      this.snackBar.open('RFP published', 'OK', { duration: 3000 });
      this.refresh();
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async closeRfp(): Promise<void> {
    const eng = this.engagement();
    if (!eng) return;
    try {
      await this.workRequests.cancelEngagement(eng.id);
      this.snackBar.open('RFP closed', 'OK', { duration: 3000 });
      this.refresh();
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async cancelEngagement(): Promise<void> {
    const eng = this.engagement();
    if (!eng) return;
    try {
      await this.workRequests.cancelEngagement(eng.id);
      this.snackBar.open('Engagement cancelled', 'OK', { duration: 3000 });
      this.refresh();
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  editRfp(): void {
    const eng = this.engagement();
    if (eng) this.router.navigate(['/rfps', eng.id, 'edit']);
  }

  // ===========================================================================
  // Timeline tab
  // ===========================================================================

  async onTabChange(tabIndex: number): Promise<void> {
    this.selectedTabIndex.set(tabIndex);

    // Persist tab in URL without triggering navigation
    const tabName = EngagementDetail.TAB_NAMES[tabIndex] || 'overview';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabName },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    // Tasks tab (index 2): TaskListPanel auto-loads via its own ngOnInit
    // (mat-tab lazy-renders content, so ngOnInit fires on first tab select)

    // Timeline tab is index 3 (Overview=0, Details=1, Tasks=2, Timeline=3)
    if (tabIndex === 3 && !this.timelineLoaded() && this.engagement()) {
      this.timelineLoading.set(true);
      try {
        const events = await this.engagementTimeline.getTimelineEvents(this.engagement()!);
        this.timelineEvents.set(events);
        this.timelineLoaded.set(true);
      } catch (err: any) {
        console.error('[EngagementDetail] Failed to load timeline:', err);
        this.snackBar.open('Failed to load timeline', 'Dismiss', { duration: 5000 });
      } finally {
        this.timelineLoading.set(false);
      }
    }
  }

  onCommentPosted(event: TimelineEvent): void {
    this.timelineEvents.update(events => [event, ...events]);
  }

  onTimelineDrillDown(event: TimelineEvent): void {
    // Phase 2: navigate to relevant tab based on event type
    // e.g., proposal events → switch to Details tab
  }

  goBack(): void {
    this.router.navigate(['/rfps']);
  }

  private async refresh(): Promise<void> {
    const id = this.route.snapshot.params['id'];
    const eng = await this.workRequests.getEngagement(id);
    if (eng) this.engagement.set(eng);
  }
}
