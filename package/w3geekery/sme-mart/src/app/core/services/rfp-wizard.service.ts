import { Injectable, inject, signal, computed } from '@angular/core';
import { SmeMartProjectService } from './sme-mart-project.service';
import { DocumentService } from './document.service';
import { ImpersonationService } from './impersonation.service';
import { SmeMartTagService } from './sme-mart-tag.service';
import type {
  SmeMartProject,
  RfpData,
  RfpTaskGroup,
  EvaluationCriterion,
  EngagementDocument,
} from '../models';
import type { EngagementFormValues } from '../../shared/components/engagement-form/engagement-form.component';

/**
 * RfpWizardService — Plan 075 Phase 2 rewrite
 *
 * Now backed by SmeMartProjectService (SmeMartProject in draft status)
 * instead of EngagementsService. RFP fields live on SmeMartProject.
 */
@Injectable({ providedIn: 'root' })
export class RfpWizardService {
  private readonly projects = inject(SmeMartProjectService);
  private readonly docService = inject(DocumentService);
  private readonly impersonation = inject(ImpersonationService);
  private readonly tagService = inject(SmeMartTagService);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** The SmeMartProject row backing this wizard session. */
  readonly draft = signal<SmeMartProject | null>(null);

  /** Full wizard data (persisted to SmeMartProject.wizardData). */
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
    const project = await this.projects.getProject(id);
    if (!project) throw new Error(`Draft ${id} not found`);

    this.draft.set(project);

    // Hydrate wizard data from the wizardData JSON field
    const wizardData = project.wizardData as RfpData | null;
    this.rfpData.set(wizardData ?? this.emptyRfpData());
    this.currentStep.set(Number(project.wizardStep) || 0);

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

  /** Create the draft project (first save) or update basics on an existing draft. */
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
        // Create new SmeMartProject as RFP draft
        const project = await this.projects.createAsRfp({
          name: values.title,
          description: values.description || undefined,
          category: values.category,
          budgetType: values.budget_type || undefined,
          budgetMin: values.budget_min ? Number(values.budget_min) : undefined,
          budgetMax: values.budget_max ? Number(values.budget_max) : undefined,
          timeline: values.timeline || undefined,
        });
        this.draft.set(project);
        id = project.id;
      } else {
        // Update existing draft project
        const project = await this.projects.updateProject(id, {
          name: values.title,
          description: values.description || undefined,
          category: values.category,
          budgetType: (values.budget_type || undefined) as SmeMartProject['budgetType'],
          budgetMin: values.budget_min ? Number(values.budget_min) : undefined,
          budgetMax: values.budget_max ? Number(values.budget_max) : undefined,
          timeline: values.timeline || undefined,
        });
        this.draft.set(project);
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
  async refreshDocuments(projectId: string): Promise<void> {
    const docs = await this.docService.listDocuments(projectId);
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
      // Also persist deadline fields to top-level SmeMartProject columns
      const data = this.rfpData();
      await this.projects.updateProject(id, {
        responseDeadline: data.responseDeadline,
        questionsDeadline: data.questionsDeadline,
        evaluationCriteria: data.evaluationCriteria?.length
          ? { criteria: data.evaluationCriteria }
          : undefined,
      });
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

      // Publish via SmeMartProjectService (creates tag + sets status)
      const { project } = await this.projects.publishRfp(id, data.rfpTagIdentifier);
      this.draft.set(project);

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
    await this.projects.updateProject(draftId, {
      wizardData: this.rfpData() as unknown as Record<string, unknown>,
      wizardStep: String(step),
    });
  }
}
