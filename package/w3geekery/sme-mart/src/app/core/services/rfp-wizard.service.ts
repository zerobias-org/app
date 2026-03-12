import { Injectable, inject, signal, computed } from '@angular/core';
import { WorkRequestsService } from './work-requests.service';
import { DocumentService } from './document.service';
import { ImpersonationService } from './impersonation.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import type {
  WorkRequest,
  RfpData,
  RfpTaskGroup,
  EvaluationCriterion,
  EngagementDocument,
} from '../models';
import type { EngagementFormValues } from '../../shared/components/engagement-form/engagement-form.component';

@Injectable({ providedIn: 'root' })
export class RfpWizardService {
  private readonly workRequests = inject(WorkRequestsService);
  private readonly docService = inject(DocumentService);
  private readonly impersonation = inject(ImpersonationService);
  private readonly tagService = inject(SmeMartTagService);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** The work_requests row backing this wizard session. */
  readonly draft = signal<WorkRequest | null>(null);

  /** Full wizard data (persisted to rfp_wizard_data JSONB). */
  readonly rfpData = signal<RfpData>(this.emptyRfpData());

  /** Last completed step (0-indexed). */
  readonly currentStep = signal(0);

  /** Documents loaded for step 2. */
  readonly documents = signal<EngagementDocument[]>([]);

  /** True while any save/load is in progress. */
  readonly saving = signal(false);

  readonly draftId = computed(() => this.draft()?.id ?? null);

  // ---------------------------------------------------------------------------
  // Load / Resume
  // ---------------------------------------------------------------------------

  /** Load an existing draft for resuming the wizard. */
  async loadDraft(id: string): Promise<void> {
    const row = await this.workRequests.getWorkRequest(id);
    if (!row) throw new Error(`Draft ${id} not found`);

    this.draft.set(row);

    // Hydrate wizard data from JSONB column
    const wizardData = (row as any).rfp_wizard_data as RfpData | null;
    this.rfpData.set(wizardData ?? this.emptyRfpData());
    this.currentStep.set((row as any).rfp_wizard_step ?? 0);

    // Load documents
    const docs = await this.docService.listDocuments(id);
    this.documents.set(docs);
  }

  /** Reset wizard state for a new RFP. */
  reset(): void {
    this.draft.set(null);
    this.rfpData.set(this.emptyRfpData());
    this.currentStep.set(0);
    this.documents.set([]);
  }

  /** Update the RFP tag identifier (word-word part only). */
  updateTagIdentifier(identifier: string): void {
    this.rfpData.update(d => ({ ...d, rfpTagIdentifier: identifier }));
  }

  // ---------------------------------------------------------------------------
  // Step 1: Basics
  // ---------------------------------------------------------------------------

  /** Create the draft row (first save) or update basics on an existing draft. */
  async saveBasics(values: EngagementFormValues): Promise<string> {
    this.saving.set(true);
    try {
      const data = this.rfpData();
      const updated: RfpData = {
        ...data,
        title: values.title,
        description: values.description,
        category: values.category,
        budgetType: values.budget_type,
        budgetMin: values.budget_min ? Number(values.budget_min) : undefined,
        budgetMax: values.budget_max ? Number(values.budget_max) : undefined,
        timeline: values.timeline ?? undefined,
      };
      this.rfpData.set(updated);

      let id = this.draftId();
      if (!id) {
        // Create new draft row
        const row = await this.workRequests.createRfp({
          buyer_zerobias_user_id: this.impersonation.effectiveUserId(),
          title: values.title,
          description: values.description || undefined,
          category: values.category,
          budget_type: values.budget_type || undefined,
          budget_min: values.budget_min || undefined,
          budget_max: values.budget_max || undefined,
          timeline: values.timeline || undefined,
          status: 'draft',
        });
        this.draft.set(row);
        id = row.id;
      } else {
        // Update existing draft
        await this.workRequests.updateRfp(id, {
          title: values.title,
          description: values.description || null,
          category: values.category,
          budget_type: values.budget_type || null,
          budget_min: values.budget_min || null,
          budget_max: values.budget_max || null,
          timeline: values.timeline || null,
        } as Partial<WorkRequest>);
      }

      await this.persistWizardState(id, 1);
      return id;
    } finally {
      this.saving.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 2: Documents
  // ---------------------------------------------------------------------------

  /** Reload documents from the service (e.g., after attaching from library). */
  async refreshDocuments(engagementId: string): Promise<void> {
    const docs = await this.docService.listDocuments(engagementId);
    this.documents.set(docs);
  }

  /** Called when a document is uploaded — update local state + persist. */
  async onDocumentUploaded(doc: EngagementDocument): Promise<void> {
    this.documents.update(docs => [...docs, doc]);
    this.rfpData.update(d => ({
      ...d,
      documentIds: [...d.documentIds, doc.id],
    }));
  }

  /** Save step 2 completion. */
  async saveDocuments(): Promise<void> {
    const id = this.draftId();
    if (!id) return;
    this.saving.set(true);
    try {
      await this.persistWizardState(id, 2);
    } finally {
      this.saving.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 3: Requirements
  // ---------------------------------------------------------------------------

  updateTaskGroups(groups: RfpTaskGroup[]): void {
    this.rfpData.update(d => ({ ...d, taskGroups: groups }));
  }

  async saveRequirements(): Promise<void> {
    const id = this.draftId();
    if (!id) return;
    this.saving.set(true);
    try {
      await this.persistWizardState(id, 3);
    } finally {
      this.saving.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 4: Terms
  // ---------------------------------------------------------------------------

  updateTerms(terms: {
    responseDeadline?: string;
    questionsDeadline?: string;
    evaluationCriteria?: EvaluationCriterion[];
    confidentialityRequirements?: string;
  }): void {
    this.rfpData.update(d => ({ ...d, ...terms }));
  }

  async saveTerms(): Promise<void> {
    const id = this.draftId();
    if (!id) return;
    this.saving.set(true);
    try {
      await this.persistWizardState(id, 4);
    } finally {
      this.saving.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 5: Publish
  // ---------------------------------------------------------------------------

  async publishRfp(): Promise<void> {
    const id = this.draftId();
    if (!id) throw new Error('No draft to publish');

    this.saving.set(true);
    try {
      const data = this.rfpData();

      // Create the RFP tag: sme-mart.rfp.{identifier}
      const rfpTagName = this.tagService.generateRfpTag(data.rfpTagIdentifier);
      const tag = await this.tagService.createTag(rfpTagName, `RFP: ${data.title}`);

      // Update work_request with tag info and status
      await this.workRequests.updateRfp(id, {
        engagement_tag: rfpTagName,
        zerobias_tag_id: tag?.id?.toString() || null,
        status: 'open',
      } as Partial<WorkRequest>);

      await this.persistWizardState(id, 5);
    } finally {
      this.saving.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private emptyRfpData(): RfpData {
    return {
      title: '',
      description: '',
      category: '',
      budgetType: null,
      rfpTagIdentifier: this.tagService.generateIdentifier(),
      documentIds: [],
      taskGroups: [],
      evaluationCriteria: [],
    };
  }

  private async persistWizardState(draftId: string, step: number): Promise<void> {
    this.currentStep.set(step);
    await this.workRequests.updateRfp(draftId, {
      rfp_wizard_data: this.rfpData() as any,
      rfp_wizard_step: step,
    } as any);
  }
}
