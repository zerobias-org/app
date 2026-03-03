import { Component, inject, signal, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe, TitleCasePipe, CurrencyPipe } from '@angular/common';
import { ProposalCard, type ProposalCardData } from '../../shared/components/proposal-card/proposal-card.component';
import { ProposalForm, type ProposalFormData } from '../../shared/components/proposal-form/proposal-form.component';
import { WorkRequestsService } from '../../core/services/work-requests.service';
import { ProposalsService } from '../../core/services/proposals.service';
import { ProviderProfilesService } from '../../core/services/provider-profiles.service';
import { EngagementLifecycleService } from '../../core/services/engagement-lifecycle.service';
import { ImpersonationService } from '../../core/services/impersonation.service';
import type { EngagementDetailRow, Proposal, RequestStatus } from '../../core/models';

interface ParsedProposal extends Proposal {
  provider_display_name?: string;
  provider_headline?: string;
  provider_rating?: number;
}

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
    ProposalCard,
  ],
  templateUrl: './rfp-detail.component.html',
  styleUrl: './rfp-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RfpDetail implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly impersonation = inject(ImpersonationService);
  private readonly workRequests = inject(WorkRequestsService);
  private readonly proposals = inject(ProposalsService);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly lifecycle = inject(EngagementLifecycleService);

  // --- local signals (no EngagementContextService) ---
  readonly loading = signal(true);
  readonly rfp = signal<EngagementDetailRow | null>(null);
  readonly currentUserId = signal<string | null>(null);
  readonly currentProviderId = signal<string | null>(null);

  readonly status = computed<RequestStatus>(() => this.rfp()?.status || 'draft');

  readonly isOwner = computed(() => {
    const uid = this.currentUserId();
    const eng = this.rfp();
    return uid && eng ? eng.buyer_zerobias_user_id === uid : false;
  });

  readonly parsedProposals = computed<ProposalCardData[]>(() => {
    const eng = this.rfp();
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

  readonly hasAlreadyProposed = computed(() => {
    const pid = this.currentProviderId();
    if (!pid) return false;
    return this.parsedProposals().some(p => p.provider_id === pid);
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.params['id'];
    try {
      const eng = await this.workRequests.getEngagement(id);

      if (!eng) {
        this.snackBar.open('RFP not found', 'OK', { duration: 3000 });
        this.router.navigate(['/rfps']);
        return;
      }

      // If this is actually an engagement (has tag), redirect to engagement route
      if (eng.engagement_tag) {
        this.router.navigate(['/engagements', eng.id, 'overview'], { replaceUrl: true });
        return;
      }

      this.rfp.set(eng);

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

  openProposalDialog(): void {
    const pid = this.currentProviderId();
    const eng = this.rfp();
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
    const eng = this.rfp();
    if (!eng) return;

    try {
      const result = await this.lifecycle.acceptProposal(proposalId, eng.id);
      this.snackBar.open('Proposal accepted — engagement created', 'OK', { duration: 4000 });
      // Navigate to the new engagement's overview
      this.router.navigate(['/engagements', eng.id, 'overview']);
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
    const eng = this.rfp();
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
    const eng = this.rfp();
    if (!eng) return;
    try {
      await this.workRequests.cancelEngagement(eng.id);
      this.snackBar.open('RFP closed', 'OK', { duration: 3000 });
      this.refresh();
    } catch (err: any) {
      this.snackBar.open(`Failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
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
    const eng = await this.workRequests.getEngagement(id);
    if (eng) this.rfp.set(eng);
  }
}
