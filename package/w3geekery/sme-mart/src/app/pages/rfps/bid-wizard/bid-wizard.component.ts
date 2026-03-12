import {
  Component, inject, OnInit, ViewChild, signal, computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { BidsService } from '../../../core/services/bids.service';
import { WorkRequestsService } from '../../../core/services/work-requests.service';
import { ImpersonationService } from '../../../core/services/impersonation.service';
import { ProviderProfilesService } from '../../../core/services/provider-profiles.service';
import { MarkdownEditor } from '../../../shared/components/markdown-editor/markdown-editor.component';
import { MarkdownView } from '../../../shared/components/markdown-view/markdown-view.component';
import type { Bid, BidWizardData, TaskTypePricing, BidResponse } from '../../../core/models';
import type { RfpTaskGroup, RfpData } from '../../../core/models/rfp.model';
import { BidResponseService } from '../../../core/services/bid-response.service';
import {
  RequirementResponse, type ResponseDraft, type ResponseChange,
} from '../../../shared/components/requirement-response/requirement-response.component';

@Component({
  selector: 'app-bid-wizard',
  standalone: true,
  imports: [
    MatStepperModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule,
    MatCardModule, CurrencyPipe, DecimalPipe,
    MarkdownEditor, MarkdownView, RequirementResponse,
  ],
  templateUrl: './bid-wizard.component.html',
  styleUrl: './bid-wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BidWizard implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly bids = inject(BidsService);
  private readonly workRequests = inject(WorkRequestsService);
  private readonly impersonation = inject(ImpersonationService);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly bidResponses = inject(BidResponseService);

  @ViewChild('stepper') stepper!: MatStepper;

  readonly loading = signal(true);
  readonly rfpTitle = signal('');
  readonly rfpDescription = signal('');
  readonly bid = signal<Bid | null>(null);

  // Wizard form state
  readonly executiveSummary = signal('');
  readonly coverLetter = signal('');
  readonly teamDescription = signal('');
  readonly proposedPrice = signal('');
  readonly proposedTimeline = signal('');
  readonly pricingBreakdown = signal<TaskTypePricing[]>([]);

  // Requirements & responses
  readonly taskGroups = signal<RfpTaskGroup[]>([]);
  readonly savedBidResponses = signal<BidResponse[]>([]);
  private responseDrafts = new Map<string, ResponseDraft>();

  readonly totalEstimatedHours = computed(() =>
    this.pricingBreakdown().reduce((sum, row) => sum + (row.estimatedHours || 0), 0),
  );

  readonly totalEstimatedCost = computed(() =>
    this.pricingBreakdown().reduce((sum, row) => sum + (row.estimatedCost || 0), 0),
  );

  private rfpId = '';
  private providerId = '';

  async ngOnInit(): Promise<void> {
    this.rfpId = this.route.snapshot.paramMap.get('id') || '';
    const bidId = this.route.snapshot.paramMap.get('bidId');

    try {
      // Load RFP context
      const rfp = await this.workRequests.getEngagement(this.rfpId);
      if (!rfp) {
        this.snackBar.open('RFP not found', 'Dismiss', { duration: 3000 });
        this.router.navigate(['/rfps']);
        return;
      }
      this.rfpTitle.set(rfp.title || '');
      this.rfpDescription.set(rfp.description || '');

      // Load RFP requirements from wizard data
      const rawWr = await this.workRequests.getWorkRequest(this.rfpId);
      const rfpData = (rawWr as any)?.rfp_wizard_data as RfpData | undefined;
      if (rfpData?.taskGroups) {
        this.taskGroups.set(rfpData.taskGroups);
      }

      // Get current provider
      const userId = this.impersonation.effectiveUserId();
      if (userId) {
        const provider = await this.providerProfiles.getProviderByUserId(userId);
        if (provider) this.providerId = provider.id;
      }

      if (!this.providerId) {
        this.snackBar.open('Provider profile required', 'Dismiss', { duration: 3000 });
        this.router.navigate(['/rfps', this.rfpId]);
        return;
      }

      if (bidId) {
        // Resume existing draft
        const existing = await this.bids.getBid(bidId);
        if (existing) {
          this.bid.set(existing);
          this.hydrateFromBid(existing);
        }
      } else {
        // Check for existing draft, or create one
        const draft = await this.bids.findDraft(this.rfpId, this.providerId);
        if (draft) {
          this.bid.set(draft);
          this.hydrateFromBid(draft);
          this.router.navigate(['/rfps', this.rfpId, 'bid', draft.id], { replaceUrl: true });
        } else {
          const newDraft = await this.bids.createDraft(this.rfpId, this.providerId);
          this.bid.set(newDraft);
          this.router.navigate(['/rfps', this.rfpId, 'bid', newDraft.id], { replaceUrl: true });
        }
      }

      // Load existing bid responses for requirements step
      const currentBid = this.bid();
      if (currentBid) {
        const responses = await this.bidResponses.listByBid(currentBid.id);
        this.savedBidResponses.set(responses);
      }
    } catch (err: any) {
      this.snackBar.open(`Failed to load: ${err.message}`, 'Dismiss', { duration: 5000 });
      this.router.navigate(['/rfps']);
    } finally {
      this.loading.set(false);
      // Jump to last saved step
      setTimeout(() => {
        const step = this.bid()?.wizard_step || 0;
        if (step > 0 && this.stepper) {
          this.stepper.selectedIndex = Math.min(step, 4);
        }
      });
    }
  }

  // --- Step navigation ---

  async saveAndNext(step: number): Promise<void> {
    await this.saveDraft(step);
    this.stepper.next();
  }

  async saveRequirementsAndNext(): Promise<void> {
    await this.saveRequirementResponses();
    await this.saveDraft(2);
    this.autoPopulatePricingFromResponses();
    this.stepper.next();
  }

  async saveDraft(step?: number): Promise<void> {
    const b = this.bid();
    if (!b) return;

    const wizardData: BidWizardData = {
      approach: {
        executive_summary: this.executiveSummary(),
        cover_letter: this.coverLetter(),
      },
      team: {
        team_description: this.teamDescription(),
      },
      pricing: {
        proposed_price: this.proposedPrice(),
        proposed_timeline: this.proposedTimeline(),
        total_estimated_hours: this.totalEstimatedHours(),
        pricing_breakdown: this.pricingBreakdown(),
      },
    };

    const currentStep = step ?? this.stepper?.selectedIndex ?? 0;
    try {
      const updated = await this.bids.saveDraft(b.id, wizardData, currentStep);
      this.bid.set(updated);
    } catch (err: any) {
      this.snackBar.open(`Save failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  async submitBid(): Promise<void> {
    const b = this.bid();
    if (!b) return;

    // Save final state first
    await this.saveDraft(4);

    try {
      await this.bids.submitDraft(b.id);
      this.snackBar.open('Bid submitted!', 'OK', { duration: 3000 });
      this.router.navigate(['/rfps', this.rfpId]);
    } catch (err: any) {
      this.snackBar.open(`Submit failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  saveDraftAndExit(): void {
    this.saveDraft().then(() => {
      this.snackBar.open('Draft saved', 'OK', { duration: 2000 });
      this.router.navigate(['/rfps', this.rfpId]);
    });
  }

  // --- Pricing breakdown ---

  addPricingRow(): void {
    this.pricingBreakdown.set([
      ...this.pricingBreakdown(),
      { taskType: '', estimatedHours: 0, estimatedCost: 0 },
    ]);
  }

  removePricingRow(index: number): void {
    const rows = [...this.pricingBreakdown()];
    rows.splice(index, 1);
    this.pricingBreakdown.set(rows);
  }

  updatePricingRow(index: number, field: keyof TaskTypePricing, value: unknown): void {
    const rows = [...this.pricingBreakdown()];
    rows[index] = { ...rows[index], [field]: value };
    this.pricingBreakdown.set(rows);
  }

  // --- Requirements responses ---

  onResponseChanged(change: ResponseChange): void {
    this.responseDrafts.set(change.requirementId, change.draft);
  }

  onAllResponsesChanged(drafts: Map<string, ResponseDraft>): void {
    this.responseDrafts = new Map(drafts);
  }

  async saveRequirementResponses(): Promise<void> {
    const b = this.bid();
    if (!b || this.responseDrafts.size === 0) return;

    try {
      const responseMap = new Map<string, Partial<BidResponse>>();
      for (const [reqId, draft] of this.responseDrafts) {
        responseMap.set(reqId, {
          compliance_status: draft.compliance_status,
          response_text: draft.response_text || undefined,
          estimated_hours: draft.estimated_hours ?? undefined,
          estimated_cost: draft.estimated_cost ?? undefined,
          certification_ref: draft.certification_ref || undefined,
        });
      }
      await this.bidResponses.saveResponses(b.id, responseMap);

      // Refresh saved responses
      const updated = await this.bidResponses.listByBid(b.id);
      this.savedBidResponses.set(updated);
    } catch (err: any) {
      this.snackBar.open(`Save responses failed: ${err.message}`, 'Dismiss', { duration: 5000 });
    }
  }

  /** Auto-populate pricing breakdown from per-requirement estimates. */
  autoPopulatePricingFromResponses(): void {
    if (this.responseDrafts.size === 0) return;

    // Aggregate by task group display name
    const byType = new Map<string, { hours: number; cost: number }>();
    for (const group of this.taskGroups()) {
      for (const req of group.requirements) {
        const draft = this.responseDrafts.get(req.id);
        if (draft) {
          const existing = byType.get(group.displayName) || { hours: 0, cost: 0 };
          existing.hours += draft.estimated_hours || 0;
          existing.cost += draft.estimated_cost || 0;
          byType.set(group.displayName, existing);
        }
      }
    }

    // Only auto-populate if pricing breakdown is empty
    if (this.pricingBreakdown().length === 0 && byType.size > 0) {
      const rows: TaskTypePricing[] = [];
      for (const [taskType, totals] of byType) {
        if (totals.hours > 0 || totals.cost > 0) {
          rows.push({ taskType, estimatedHours: totals.hours, estimatedCost: totals.cost });
        }
      }
      if (rows.length > 0) {
        this.pricingBreakdown.set(rows);
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/rfps', this.rfpId]);
  }

  // --- Private ---

  private hydrateFromBid(bid: Bid): void {
    // Try wizard_data first (structured), fall back to individual fields
    if (bid.wizard_data) {
      const wd = bid.wizard_data as BidWizardData;
      this.executiveSummary.set(wd.approach?.executive_summary || '');
      this.coverLetter.set(wd.approach?.cover_letter || '');
      this.teamDescription.set(wd.team?.team_description || '');
      this.proposedPrice.set(wd.pricing?.proposed_price || '');
      this.proposedTimeline.set(wd.pricing?.proposed_timeline || '');
      this.pricingBreakdown.set(wd.pricing?.pricing_breakdown || []);
    } else {
      this.executiveSummary.set(bid.executive_summary || '');
      this.coverLetter.set(bid.cover_letter || '');
      this.teamDescription.set(bid.team_description || '');
      this.proposedPrice.set(bid.proposed_price || '');
      this.proposedTimeline.set(bid.proposed_timeline || '');
      if (bid.pricing_breakdown) {
        this.pricingBreakdown.set(
          typeof bid.pricing_breakdown === 'string'
            ? JSON.parse(bid.pricing_breakdown)
            : bid.pricing_breakdown,
        );
      }
    }
  }
}
