/**
 * DocumentTemplateService — Wave 1: Service Layer (Phase 15 Plan 02)
 *
 * Manages reusable document templates with CRUD operations.
 * Templates are org-scoped; org admins create and publish templates.
 * All writes go through PipelineWriteService.
 * All reads go through GraphqlReadService (from AuditgraphDB).
 */

import { Injectable, inject } from '@angular/core';
import type {
  DocumentTemplate,
  CustomVariable,
  CreateDocumentTemplateDto,
  UpdateDocumentTemplateDto,
  DocumentTemplateStatus
} from '../models';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService, type GqlQueryOptions } from './graphql-read.service';

@Injectable({ providedIn: 'root' })
export class DocumentTemplateService {
  private readonly pipelineWrite = inject(PipelineWriteService);
  private readonly graphqlRead = inject(GraphqlReadService);

  /** Scalar fields for standard queries */
  private readonly scalarFields = [
    'id',
    'name',
    'description',
    'documentType',
    'content',
    'variableSchema',
    'version',
    'status',
    'orgId',
    'createdBy',
    'createdAt',
    'updatedAt'
  ];

  /**
   * Create a new document template.
   * Returns template with id assigned by Platform, version=1, status='draft'.
   */
  async create(dto: CreateDocumentTemplateDto): Promise<DocumentTemplate> {
    const template: DocumentTemplate = {
      id: '', // Will be assigned by Platform on receive
      name: dto.name,
      description: dto.description,
      documentType: dto.documentType,
      content: dto.content,
      variableSchema: dto.variableSchema ? JSON.stringify(dto.variableSchema) : undefined,
      version: 1,
      status: 'draft',
      orgId: dto.orgId,
      createdBy: '', // Set by current user context if needed
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Fire-and-forget write to Pipeline
    await this.pipelineWrite.pushEntities('DocumentTemplate', [template]);

    return template;
  }

  /**
   * Update an existing template.
   * Increments version if content or schema changes.
   */
  async update(id: string, dto: UpdateDocumentTemplateDto): Promise<DocumentTemplate> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Template ${id} not found`);

    const updated: DocumentTemplate = {
      ...existing,
      ...dto,
      variableSchema: dto.variableSchema ? JSON.stringify(dto.variableSchema) : existing.variableSchema,
      version: (dto.content || dto.variableSchema) ? existing.version + 1 : existing.version,
      updatedAt: new Date()
    };

    await this.pipelineWrite.pushEntities('DocumentTemplate', [updated]);

    return updated;
  }

  /**
   * Delete (archive) a template by id.
   * Sets status='archived' rather than hard delete for audit trail.
   */
  async delete(id: string): Promise<void> {
    await this.update(id, { status: 'archived' });
  }

  /**
   * Get a single template by id.
   */
  async getById(id: string): Promise<DocumentTemplate | null> {
    const gqlOptions: GqlQueryOptions = {
      filters: { id: `.eq.${id}` },
      pageSize: 1,
    };

    const result = await this.graphqlRead.query<DocumentTemplate>(
      'DocumentTemplate',
      this.scalarFields,
      gqlOptions,
    );

    return result.items[0] ?? null;
  }

  /**
   * List all templates for an org, optionally filtered by status.
   */
  async listByOrg(orgId: string, status?: DocumentTemplateStatus): Promise<DocumentTemplate[]> {
    const filters: Record<string, string> = { orgId: `.eq.${orgId}` };
    if (status) {
      filters['status'] = `.eq.${status}`;
    }

    const gqlOptions: GqlQueryOptions = {
      filters,
      pageSize: 100,
    };

    const result = await this.graphqlRead.query<DocumentTemplate>(
      'DocumentTemplate',
      this.scalarFields,
      gqlOptions,
    );

    return result.items;
  }

  /**
   * Publish a template (status: draft → published).
   * Published templates appear in instantiation pickers.
   */
  async publish(id: string): Promise<DocumentTemplate> {
    return this.update(id, { status: 'published' });
  }

  /**
   * Archive a template (status → archived).
   * Archived templates don't appear in pickers but preserve for existing instances.
   */
  async archive(id: string): Promise<DocumentTemplate> {
    return this.update(id, { status: 'archived' });
  }
}
