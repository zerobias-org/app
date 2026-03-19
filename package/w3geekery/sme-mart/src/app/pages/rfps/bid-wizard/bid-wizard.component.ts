import {
  Component, inject, OnInit, OnDestroy, ViewChild, signal, computed,
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { BidsService } from '../../../core/services/bids.service';
import { BidAiService } from '../../../core/services/bid-ai.service';
import { EngagementsService } from '../../../core/services/engagements.service';
import { ImpersonationService } from '../../../core/services/impersonation.service';
import { ProviderProfilesService } from '../../../core/services/provider-profiles.service';
import { BidResponseService } from '../../../core/services/bid-response.service';
import { MarkdownEditor } from '../../../shared/components/markdown-editor/markdown-editor.component';
import { MarkdownView } from '../../../shared/components/markdown-view/markdown-view.component';
import { AiDraftBadge } from '../../../shared/components/ai-draft-badge/ai-draft-badge.component';
import { AiLoadingPanel } from '../../../shared/components/ai-loading-panel/ai-loading-panel.component';
import { BidMethodChooser } from './bid-method-chooser.component';
import type { Bid, BidWizardData, TaskTypePricing, BidResponse } from '../../../core/models';
import type { BidMethod, BidAiProgress } from '../../../core/models/bid-ai.model';
import type { RfpTaskGroup, RfpData } from '../../../core/models/rfp.model';
import {
  RequirementResponse, type ResponseDraft, type ResponseChange,
} from '../../../shared/components/requirement-response/requirement-response.component';

@Component({
  selector: 'app-bid-wizard',
  standalone: true,
  imports: [
    MatStepperModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule,
    MatCardModule, MatTooltipModule, CurrencyPipe, DecimalPipe,
    MarkdownEditor, MarkdownView, RequirementResponse,
    BidMethodChooser, AiDraftBadge, AiLoadingPanel,
  ],
  templateUrl: './bid-wizard.component.html',
  styleUrl: './bid-wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BidWizard implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly bids = inject(BidsService);
  private readonly bidAi = inject(BidAiService);
  private readonly engagements = inject(EngagementsService);
  private readonly impersonation = inject(ImpersonationService);
  private readonly providerProfiles = inject(ProviderProfilesService);
  private readonly bidResponses = inject(BidResponseService);

  @ViewChild('stepper') stepper!: MatStepper;

  readonly loading = signal(true);
  readonly rfpTitle = signal('');
  readonly rfpDescription = signal('');
  readonly bid = signal<Bid | null>(null);

  // AI-assisted bid state
  readonly bidMethod = signal<BidMethod | null>(null);
  readonly aiLoading = signal(false);
  readonly aiProgress = signal<BidAiProgress>({
    status: 'gathering', message: '', percent: 0,
  });
  readonly aiAssisted = signal(false); // Tracks if any AI content was used

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
  private aiModel = '';
  private progressSub?: Subscription;

  async ngOnInit(): Promise<void> {
    this.rfpId = this.route.snapshot.paramMap.get('id') || '';
    const bidId = this.route.snapshot.paramMap.get('bidId');

    try {
      // Load RFP context
      const rfp = await this.engagements.getEngagement(this.rfpId);
      if (!rfp) {
        this.snackBar.open('RFP not found', 'Dismiss', { duration: 3000 });
        this.router.navigate(['/rfps']);
        return;
      }
      this.rfpTitle.set(rfp.title || '');
      this.rfpDescription.set(rfp.description || '');

      // Load RFP requirements from wizard data
      const rawWr = await this.engagements.getEngagementRaw(this.rfpId);
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
          // If resuming a draft, skip method chooser
          this.bidMethod.set(existing.ai_assisted ? 'ai' : 'manual');
          if (existing.ai_assisted) this.aiAssisted.set(true);
        }
      } else {
        // Check for existing draft, or create one
        const draft = await this.bids.findDraft(this.rfpId, this.providerId);
        if (draft) {
          this.bid.set(draft);
          this.hydrateFromBid(draft);
          this.bidMethod.set(draft.ai_assisted ? 'ai' : 'manual');
          if (draft.ai_assisted) this.aiAssisted.set(true);
          this.router.navigate(['/rfps', this.rfpId, 'bid', draft.id], { replaceUrl: true });
        } else {
          const newDraft = await this.bids.createDraft(this.rfpId, this.providerId);
          this.bid.set(newDraft);
          this.router.navigate(['/rfps', this.rfpId, 'bid', newDraft.id], { replaceUrl: true });
          // New draft — show method chooser (bidMethod stays null)
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
      // Jump to last saved step (if method already chosen)
      if (this.bidMethod()) {
        setTimeout(() => {
          const step = this.bid()?.wizard_step || 0;
          if (step > 0 && this.stepper) {
            this.stepper.selectedIndex = Math.min(step, 4);
          }
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.progressSub?.unsubscribe();
    this.bidAi.cancel();
  }

  // --- Method chooser ---

  async onMethodChosen(method: BidMethod): Promise<void> {
    this.bidMethod.set(method);

    if (method === 'ai') {
      await this.startAiGeneration();
    }
  }

  // --- AI generation ---

  async startAiGeneration(): Promise<void> {
    this.aiLoading.set(true);
    this.aiAssisted.set(true);

    // Subscribe to progress updates
    this.progressSub = this.bidAi.progress$.subscribe(progress => {
      this.aiProgress.set(progress);
    });

    try {
      const response = await this.bidAi.generateBidDraft(this.rfpId, this.providerId);
      this.aiModel = response.model;

      // Hydrate wizard fields from AI response
      const wd = response.wizardData;
      this.executiveSummary.set(wd.approach?.executive_summary || '');
      this.coverLetter.set(wd.approach?.cover_letter || '');
      this.teamDescription.set(wd.team?.team_description || '');
      this.proposedPrice.set(wd.pricing?.proposed_price || '');
      this.proposedTimeline.set(wd.pricing?.proposed_timeline || '');
      this.pricingBreakdown.set(wd.pricing?.pricing_breakdown || []);

      // Hydrate per-requirement responses as saved bid responses
      if (response.requirementResponses.length > 0) {
        const aiResponses: BidResponse[] = response.requirementResponses.map(r => ({
          id: '', // Not persisted yet
          bid_id: this.bid()?.id || '',
          requirement_id: r.requirementId,
          compliance_status: r.complianceStatus,
          response_text: r.responseText,
          estimated_hours: r.estimatedHours,
          estimated_cost: r.estimatedCost,
        }));
        this.savedBidResponses.set(aiResponses);

        // Also populate responseDrafts so they can be saved
        for (const r of response.requirementResponses) {
          this.responseDrafts.set(r.requirementId, {
            compliance_status: r.complianceStatus,
            response_text: r.responseText,
            estimated_hours: r.estimatedHours,
            estimated_cost: r.estimatedCost,
            certification_ref: '',
          });
        }
      }

      // Save the AI draft immediately
      await this.saveDraft(0);

      this.snackBar.open('AI draft ready — review and edit before submitting.', 'OK', { duration: 5000 });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      this.snackBar.open(
        `AI generation failed. Switching to manual entry. (${err.message})`,
        'OK',
        { duration: 5000 },
      );
      this.aiAssisted.set(false);
    } finally {
      this.aiLoading.set(false);
      this.progressSub?.unsubscribe();
    }
  }

  cancelAiGeneration(): void {
    this.bidAi.cancel();
    this.aiLoading.set(false);
    this.snackBar.open('AI generation cancelled. You can fill in fields manually.', 'OK', { duration: 3000 });
  }

  /** Re-generate a single section via AI. */
  async regenerateSection(section: 'executive_summary' | 'cover_letter' | 'team_description'): Promise<void> {
    try {
      const response = await this.bidAi.generateBidDraft(this.rfpId, this.providerId, [section]);
      const wd = response.wizardData;
      switch (section) {
        case 'executive_summary':
          this.executiveSummary.set(wd.approach?.executive_summary || '');
          break;
        case 'cover_letter':
          this.coverLetter.set(wd.approach?.cover_letter || '');
          break;
        case 'team_description':
          this.teamDescription.set(wd.team?.team_description || '');
          break;
      }
      this.snackBar.open('Section regenerated.', 'OK', { duration: 2000 });
    } catch (err: any) {
      this.snackBar.open(`Regeneration failed: ${err.message}`, 'Dismiss', { duration: 3000 });
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
      const aiMetadata = this.aiAssisted()
        ? {
            ai_assisted: true,
            ai_model: this.aiModel || 'claude-sonnet-4-5-20250514',
            ai_generated_at: new Date().toISOString(),
          }
        : undefined;

      await this.bids.submitDraft(b.id, undefined, aiMetadata);
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
    // Track AI-assisted state from existing bid
    if (bid.ai_assisted) {
      this.aiAssisted.set(true);
      this.aiModel = bid.ai_model || '';
    }

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
