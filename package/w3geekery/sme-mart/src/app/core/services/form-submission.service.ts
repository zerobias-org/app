import { Injectable, inject } from '@angular/core';
import { UUID } from '@zerobias-org/types-core-js';
import { FormSubmission } from '../models/form-builder.model';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';

/**
 * FormSubmissionService — Phase 16 Form Builder
 *
 * Manages FormSubmission entity lifecycle for buyer-defined form submissions.
 * Implements:
 * - CRUD operations via Pipeline.receive() and GQL queries
 * - Form lock gate (prevents edits after first submission)
 * - Status lifecycle (draft → submitted → revised → reviewed)
 * - Stale-data mitigation via PipelineWriteCache
 *
 * Patterns:
 * - Uses PipelineWriteService for writes (fire-and-forget async)
 * - Uses GraphqlReadService for reads (from AuditgraphDB)
 * - Implements getCached/seedCache for optimistic updates
 * - All timestamps automatically managed
 */
@Injectable({ providedIn: 'root' })
export class FormSubmissionService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly gqlRead = inject(GraphqlReadService);
  private readonly demoVisibility = inject(DemoVisibilityService);

  /** Scalar fields for standard GQL queries */
  private readonly formSubmissionFields = [
    'id',
    'projectId',
    'bidId',
    'submissionData',
    'status',
    'submittedAt',
    'reviewedAt',
    'reviewedBy',
    'createdAt',
    'updatedAt',
    'tag',
  ];

  /**
   * Create a new form submission (draft) for a project/bid pair.
   * Initializes with empty submissionData and draft status.
   *
   * @throws Error if projectId or bidId is missing
   */
  async create(projectId: UUID, bidId: UUID): Promise<FormSubmission> {
    if (!projectId || !bidId) {
      throw new Error('projectId and bidId are required to create FormSubmission');
    }

    const now = new Date();
    const id = crypto.randomUUID();

    const submission: FormSubmission = {
      id: id as unknown as UUID,
      projectId,
      bidId,
      submissionData: {},
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    // Persist via Pipeline — use flat object, not wrapped
    await this.pipelineWrite.pushEntity('FormSubmission', {
      id: submission.id,
      projectId: submission.projectId,
      bidId: submission.bidId,
      submissionData: JSON.stringify(submission.submissionData),
      status: submission.status,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
    });

    // Seed cache with optimistic data
    this.pipelineWrite.seedCache('FormSubmission', id, {
      ...submission,
      submissionData: JSON.stringify(submission.submissionData),
    });

    return submission;
  }

  /**
   * Fetch FormSubmission by id.
   * Returns null if not found.
   */
  async getById(id: UUID): Promise<FormSubmission | null> {
    try {
      // Check cache first
      const cached = this.pipelineWrite.getCached('FormSubmission', String(id));
      if (cached) {
        return this.parseFormSubmission(cached);
      }

      // Fall back to GQL
      const result = await this.gqlRead.getById<Record<string, unknown>>(
        'FormSubmission',
        String(id),
        this.formSubmissionFields,
      );

      if (!result) return null;

      // Seed cache for next call
      this.pipelineWrite.seedCache('FormSubmission', String(id), result);
      const filtered = this.demoVisibility.applyVisibility([result as (Record<string, unknown> & { tag?: Array<{ value: string }> | null })]).map(item => this.parseFormSubmission(item))[0] ?? null;
      return filtered;
    } catch {
      return null;
    }
  }

  /**
   * Get FormSubmission for a specific project/bid pair.
   * Returns null if no submission exists.
   */
  async getByProjectAndBid(projectId: UUID, bidId: UUID): Promise<FormSubmission | null> {
    try {
      const options: GqlQueryOptions = {
        filters: {
          projectId: `.eq.${String(projectId)}`,
          bidId: `.eq.${String(bidId)}`,
        },
        pageSize: 1,
      };

      const result = await this.gqlRead.query<Record<string, unknown>>(
        'FormSubmission',
        this.formSubmissionFields,
        options,
      );

      const item = result.items[0];
      if (!item) return null;

      // Seed cache with the retrieved item
      const itemId = String(item['id']);
      this.pipelineWrite.seedCache('FormSubmission', itemId, item);
      const filtered = this.demoVisibility.applyVisibility([item as (Record<string, unknown> & { tag?: Array<{ value: string }> | null })]).map(i => this.parseFormSubmission(i))[0] ?? null;
      return filtered;
    } catch {
      return null;
    }
  }

  /**
   * Update FormSubmission with new data and status.
   * Persists via Pipeline and fetches updated entity.
   */
  async update(id: UUID, updates: Partial<FormSubmission>): Promise<FormSubmission> {
    const payload: Record<string, unknown> = {
      id,
      updatedAt: new Date(),
    };

    // Map each update field
    if (updates.status !== undefined) payload['status'] = updates.status;
    if (updates.submittedAt !== undefined) payload['submittedAt'] = updates.submittedAt;
    if (updates.reviewedAt !== undefined) payload['reviewedAt'] = updates.reviewedAt;
    if (updates.reviewedBy !== undefined) payload['reviewedBy'] = updates.reviewedBy;
    if (updates.submissionData !== undefined) {
      payload['submissionData'] = JSON.stringify(updates.submissionData);
    }

    // Pipeline update call — flat object, not wrapped
    await this.pipelineWrite.pushEntity('FormSubmission', payload);

    // Fetch updated entity
    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Failed to update FormSubmission ${id}`);
    }
    return updated;
  }

  /**
   * Mark submission as reviewed by a buyer.
   * Sets status='reviewed', reviewedAt timestamp, and reviewedBy party ID.
   */
  async markReviewed(id: UUID, reviewedBy: UUID): Promise<FormSubmission> {
    return this.update(id, {
      status: 'reviewed',
      reviewedAt: new Date(),
      reviewedBy,
    });
  }

  /**
   * Check if submission is in draft state.
   */
  isDraft(submission: FormSubmission): boolean {
    return submission.status === 'draft';
  }

  /**
   * Form lock gate: Check if form is locked (any submission exists for project).
   * Returns true if ANY submission exists (form should be read-only).
   * Returns false if no submissions exist (buyer can still edit form config).
   *
   * This is the CRITICAL GATE for D-13 (form lock on first submission).
   */
  async getFormSubmissionLock(projectId: UUID): Promise<boolean> {
    try {
      const options: GqlQueryOptions = {
        filters: {
          projectId: `.eq.${String(projectId)}`,
        },
        pageSize: 1,
      };

      const result = await this.gqlRead.query<Record<string, unknown>>(
        'FormSubmission',
        ['id'], // Minimal fields for existence check
        options,
      );

      return result.items.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * List all submissions for a project with pagination.
   * Returns empty array on error.
   */
  async listByProject(
    projectId: UUID,
    pageNumber: number = 1,
    pageSize: number = 10,
  ): Promise<FormSubmission[]> {
    try {
      const options: GqlQueryOptions = {
        filters: {
          projectId: `.eq.${String(projectId)}`,
        },
        pageNumber,
        pageSize,
      };

      const result = await this.gqlRead.query<Record<string, unknown>>(
        'FormSubmission',
        this.formSubmissionFields,
        options,
      );

      const filtered = this.demoVisibility.applyVisibility(result.items as (Record<string, unknown> & { tag?: Array<{ value: string }> | null })[]);
      return filtered.map(item => this.parseFormSubmission(item));
    } catch {
      return [];
    }
  }

  /**
   * Parse FormSubmission from GQL response.
   * Converts JSON string submissionData back to object.
   */
  private parseFormSubmission(raw: Record<string, unknown>): FormSubmission {
    return {
      id: raw['id'] as UUID,
      projectId: raw['projectId'] as UUID,
      bidId: raw['bidId'] as UUID,
      submissionData:
        typeof raw['submissionData'] === 'string'
          ? JSON.parse(raw['submissionData'] as string)
          : (raw['submissionData'] as Record<string, unknown>) || {},
      status: (raw['status'] as FormSubmission['status']) || 'draft',
      submittedAt: raw['submittedAt']
        ? new Date(raw['submittedAt'] as string)
        : undefined,
      reviewedAt: raw['reviewedAt']
        ? new Date(raw['reviewedAt'] as string)
        : undefined,
      reviewedBy: raw['reviewedBy'] as UUID | undefined,
      createdAt: new Date(raw['createdAt'] as string),
      updatedAt: new Date(raw['updatedAt'] as string),
    };
  }
}
