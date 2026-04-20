/**
 * DocumentInstanceService — Wave 1: Service Layer (Phase 15 Plan 02)
 *
 * Manages instantiation of DocumentTemplate into DocumentInstance.
 * Handles variable substitution, required variable validation, and duplicate prevention.
 * All writes go through PipelineWriteService.
 * All reads go through GraphqlReadService (from AuditgraphDB).
 */

import { Injectable, inject } from '@angular/core';
import type {
  DocumentInstance,
  DocumentTemplate,
  CustomVariable,
  InstantiateTemplateDto,
  DuplicateCheckResult,
  DocumentInstanceStatus
} from '../models';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';
import { DocumentTemplateService } from './document-template.service';
import { VariableSubstitutionService } from './variable-substitution.service';

@Injectable({ providedIn: 'root' })
export class DocumentInstanceService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);
  private readonly documentTemplateService = inject(DocumentTemplateService);
  private readonly variableSubstitution = inject(VariableSubstitutionService);

  /** Scalar fields for standard queries */
  private readonly scalarFields = [
    'id',
    'name',
    'description',
    'documentType',
    'content',
    'originalContent',
    'templateId',
    'templateVersion',
    'variableValues',
    'engagementId',
    'projectId',
    'status',
    'createdAt',
    'updatedAt'
  ];

  /**
   * Check if template is already instantiated for this engagement/project combination.
   * Per D-04: Duplicate prevention — warn but allow (show "already instantiated" message).
   */
  async checkDuplicate(
    templateId: string,
    engagementId: string,
    projectId?: string
  ): Promise<DuplicateCheckResult> {
    const instances = await this.getInstancesByTemplate(templateId, engagementId);
    const duplicate = instances.find(i =>
      i.templateId === templateId &&
      i.engagementId === engagementId &&
      i.projectId === projectId
    );
    return {
      isDuplicate: !!duplicate,
      existingInstance: duplicate
    };
  }

  /**
   * Instantiate a template into an engagement with variable substitution.
   *
   * Flow:
   * 1. Get template and parse custom variables
   * 2. Validate required custom variables are provided
   * 3. Merge built-in + custom variables
   * 4. Run substitution (template.content with vars → instance.content)
   * 5. Write instance to Pipeline
   * 6. Return resolved instance
   */
  async instantiate(dto: InstantiateTemplateDto): Promise<DocumentInstance> {
    const template = await this.documentTemplateService.getById(dto.templateId);
    if (!template) throw new Error(`Template ${dto.templateId} not found`);

    // Parse custom variables from template schema
    const customVariables = this.variableSubstitution.parseCustomVariables(
      template.variableSchema ?? undefined
    );

    // Validate required custom variables present
    const missingRequired = this.variableSubstitution.validateRequired(
      template.content,
      dto.customVariables,
      customVariables
    );

    if (missingRequired.length > 0) {
      throw new Error(
        `Missing required variables: ${missingRequired.join(', ')}`
      );
    }

    // Merge built-in + custom variables
    const allVariables = {
      ...this.variableSubstitution.getBuiltInVariables({
        engagementId: dto.engagementId,
        projectId: dto.projectId
      }),
      ...dto.customVariables
    };

    // Perform substitution
    const substitutionResult = this.variableSubstitution.substitute(
      template.content,
      allVariables,
      customVariables
    );

    if (substitutionResult.missingRequired.length > 0) {
      throw new Error(
        `Cannot instantiate: missing required variables: ${substitutionResult.missingRequired.join(', ')}`
      );
    }

    // Create instance
    const instance: DocumentInstance = {
      id: '', // Assigned by Platform
      name: template.name,
      description: template.description,
      documentType: template.documentType,
      content: substitutionResult.content,
      originalContent: substitutionResult.content, // For diff tracking (D-03)
      templateId: dto.templateId,
      templateVersion: template.version,
      variableValues: JSON.stringify(dto.customVariables),
      engagementId: dto.engagementId,
      projectId: dto.projectId,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.pipelineWrite.pushEntities('DocumentInstance', [instance]);

    return instance;
  }

  /**
   * Get all instances for an engagement.
   */
  async getByEngagement(engagementId: string): Promise<DocumentInstance[]> {
    const gqlOptions: GqlQueryOptions = {
      filters: { engagementId: `.eq.${engagementId}` },
      pageSize: 100,
    };

    const result = await this.graphqlRead.query<DocumentInstance>(
      'DocumentInstance',
      this.scalarFields,
      gqlOptions,
    );

    return result.items;
  }

  /**
   * Get instances of a specific template in an engagement.
   */
  async getInstancesByTemplate(
    templateId: string,
    engagementId: string
  ): Promise<DocumentInstance[]> {
    const gqlOptions: GqlQueryOptions = {
      filters: {
        templateId: `.eq.${templateId}`,
        engagementId: `.eq.${engagementId}`
      },
      pageSize: 100,
    };

    const result = await this.graphqlRead.query<DocumentInstance>(
      'DocumentInstance',
      this.scalarFields,
      gqlOptions,
    );

    return result.items;
  }

  /**
   * Update an instance (e.g., edit content after instantiation).
   * Per D-03: Instances are editable with diff tracking.
   */
  async update(id: string, updates: Partial<DocumentInstance>): Promise<DocumentInstance> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Instance ${id} not found`);

    const updated: DocumentInstance = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };

    await this.pipelineWrite.pushEntities('DocumentInstance', [updated]);

    return updated;
  }

  /**
   * Get a single instance by id.
   */
  async getById(id: string): Promise<DocumentInstance | null> {
    const gqlOptions: GqlQueryOptions = {
      filters: { id: `.eq.${id}` },
      pageSize: 1,
    };

    const result = await this.graphqlRead.query<DocumentInstance>(
      'DocumentInstance',
      this.scalarFields,
      gqlOptions,
    );

    return result.items[0] ?? null;
  }

  /**
   * Delete an instance (soft delete via status).
   */
  async delete(id: string): Promise<void> {
    await this.update(id, { status: 'deleted' as DocumentInstanceStatus });
  }
}
