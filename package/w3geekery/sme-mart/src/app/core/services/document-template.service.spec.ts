/**
 * Unit Tests for DocumentTemplateService (Plan 15 Wave 1)
 *
 * Tests CRUD operations: create, update, delete, getById, listByOrg, publish, archive.
 * Covers version incrementing, status transitions, and custom variable schema handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DocumentTemplateService } from './document-template.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { fakePipelineWriteService, fakeGraphqlReadService, fakeProjectContextService } from '../../test-helpers/angular';
import type { DocumentTemplate, CreateDocumentTemplateDto, CustomVariable } from '../models';

describe('DocumentTemplateService', () => {
  let service: DocumentTemplateService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;
  let demoVisibility: { applyVisibility: ReturnType<typeof vi.fn> };
  let projectContext: ReturnType<typeof fakeProjectContextService>;

  const mockTemplate: DocumentTemplate = {
    id: 'template-1',
    name: 'MSA Template',
    description: 'Standard MSA',
    documentType: 'msa',
    content: 'Agreement {{buyerOrgName}}',
    variableSchema: undefined,
    version: 1,
    status: 'draft',
    orgId: 'org-123',
    createdBy: 'user-1',
    createdAt: new Date('2026-04-10'),
    updatedAt: new Date('2026-04-10')
  };

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();
    demoVisibility = {
      applyVisibility: vi.fn((records) => records)
    };
    projectContext = fakeProjectContextService(false);

    TestBed.configureTestingModule({
      providers: [
        DocumentTemplateService,
        DemoVisibilityService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: DemoVisibilityService, useValue: demoVisibility },
        { provide: ProjectContextService, useValue: projectContext }
      ]
    });

    service = TestBed.inject(DocumentTemplateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('create()', () => {
    it('creates template with version=1 and status=draft', async () => {
      const dto: CreateDocumentTemplateDto = {
        name: 'MSA Template',
        description: 'Standard MSA',
        documentType: 'msa',
        content: 'Agreement text {{buyerOrgName}}',
        orgId: 'org-123'
      };

      const result = await service.create(dto);

      expect(result.name).toBe('MSA Template');
      expect(result.version).toBe(1);
      expect(result.status).toBe('draft');
      expect(result.orgId).toBe('org-123');
      expect(pipelineWrite.pushEntities).toHaveBeenCalledWith('DocumentTemplate', expect.any(Array));
    });

    it('stringifies custom variable schema', async () => {
      const customVars: CustomVariable[] = [
        { name: 'clientName', label: 'Client', required: true }
      ];
      const dto: CreateDocumentTemplateDto = {
        name: 'Test',
        documentType: 'other',
        content: 'Test {{clientName}}',
        variableSchema: customVars,
        orgId: 'org-123'
      };

      const result = await service.create(dto);

      expect(typeof result.variableSchema).toBe('string');
      expect(JSON.parse(result.variableSchema as string)).toEqual(customVars);
    });
  });

  describe('update()', () => {
    it('updates template and increments version on content change', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [mockTemplate],
        page: { pageNumber: 1, pageSize: 1 }
      });

      const result = await service.update('template-1', {
        content: 'New content'
      });

      expect(result.version).toBe(2);
      expect(result.content).toBe('New content');
      expect(pipelineWrite.pushEntities).toHaveBeenCalled();
    });

    it('increments version on schema change', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [mockTemplate],
        page: { pageNumber: 1, pageSize: 1 }
      });

      const newSchema: CustomVariable[] = [
        { name: 'field', label: 'Field' }
      ];

      const result = await service.update('template-1', {
        variableSchema: newSchema
      });

      expect(result.version).toBe(2);
      expect(typeof result.variableSchema).toBe('string');
    });

    it('does not increment version on status-only change', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [mockTemplate],
        page: { pageNumber: 1, pageSize: 1 }
      });

      const result = await service.update('template-1', {
        status: 'published'
      });

      expect(result.version).toBe(1);
      expect(result.status).toBe('published');
    });

    it('throws error if template not found', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 1 }
      });

      await expect(service.update('not-found', { name: 'New' }))
        .rejects
        .toThrow('Template not-found not found');
    });
  });

  describe('delete()', () => {
    it('archives template instead of hard delete', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [mockTemplate],
        page: { pageNumber: 1, pageSize: 1 }
      });

      await service.delete('template-1');

      expect(pipelineWrite.pushEntities).toHaveBeenCalled();
      const passedData = pipelineWrite.pushEntities.mock.calls[0][1][0];
      expect(passedData['status']).toBe('archived');
    });
  });

  describe('getById()', () => {
    it('returns template by id', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [mockTemplate],
        page: { pageNumber: 1, pageSize: 1 }
      });

      const result = await service.getById('template-1');

      expect(result).toEqual(mockTemplate);
      expect(graphqlRead.query).toHaveBeenCalledWith(
        'DocumentTemplate',
        expect.any(Array),
        expect.objectContaining({ filters: { id: '.eq.template-1' } })
      );
    });

    it('returns null if not found', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 1 }
      });

      const result = await service.getById('not-found');

      expect(result).toBeNull();
    });
  });

  describe('listByOrg()', () => {
    const mockTemplates: DocumentTemplate[] = [
      {
        id: 'template-1',
        name: 'MSA',
        documentType: 'msa',
        content: 'Content 1',
        version: 1,
        status: 'published',
        orgId: 'org-123',
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'template-2',
        name: 'NDA',
        documentType: 'nda',
        content: 'Content 2',
        version: 1,
        status: 'draft',
        orgId: 'org-123',
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('lists all templates for org', async () => {
      graphqlRead.query.mockResolvedValue({
        items: mockTemplates,
        page: { pageNumber: 1, pageSize: 100, totalCount: 2 }
      });

      const result = await service.listByOrg('org-123');

      expect(result).toEqual(mockTemplates);
      expect(graphqlRead.query).toHaveBeenCalledWith(
        'DocumentTemplate',
        expect.any(Array),
        expect.objectContaining({ filters: expect.objectContaining({ orgId: '.eq.org-123' }) })
      );
    });

    it('filters by status when provided', async () => {
      const publishedOnly = [mockTemplates[0]];
      graphqlRead.query.mockResolvedValue({
        items: publishedOnly,
        page: { pageNumber: 1, pageSize: 100, totalCount: 1 }
      });

      const result = await service.listByOrg('org-123', 'published');

      expect(result).toEqual(publishedOnly);
      expect(graphqlRead.query).toHaveBeenCalledWith(
        'DocumentTemplate',
        expect.any(Array),
        expect.objectContaining({
          filters: expect.objectContaining({
            orgId: '.eq.org-123',
            status: '.eq.published'
          })
        })
      );
    });
  });

  describe('publish()', () => {
    it('publishes template (status: draft → published)', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [mockTemplate],
        page: { pageNumber: 1, pageSize: 1 }
      });

      const result = await service.publish('template-1');

      expect(result.status).toBe('published');
      expect(pipelineWrite.pushEntities).toHaveBeenCalled();
    });
  });

  describe('archive()', () => {
    const publishedTemplate: DocumentTemplate = {
      ...mockTemplate,
      version: 2,
      status: 'published'
    };

    it('archives template (status → archived)', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [publishedTemplate],
        page: { pageNumber: 1, pageSize: 1 }
      });

      const result = await service.archive('template-1');

      expect(result.status).toBe('archived');
      expect(pipelineWrite.pushEntities).toHaveBeenCalled();
    });
  });

  describe('Demo Visibility (Option X - Client-Side Post-Filter)', () => {
    it('[DG-02] listByOrg strips demo records for non-admin users', async () => {
      const realTemplate = { ...mockTemplate, id: 'real-1', tag: null };
      const demoGlobalTemplate = {
        ...mockTemplate,
        id: 'demo-global-1',
        tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }]
      };
      const demoLegacyTemplate = {
        ...mockTemplate,
        id: 'demo-legacy-1',
        tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }]
      };

      graphqlRead.query.mockResolvedValue({
        items: [realTemplate, demoGlobalTemplate, demoLegacyTemplate],
        page: { pageNumber: 1, pageSize: 100 }
      });
      demoVisibility.applyVisibility.mockImplementation((records: Array<DocumentTemplate & { tag?: Array<{ value: string }> | null }>) =>
        records.filter(r => !r.tag?.some((t) => [
          '81053c14-a8e5-4939-b538-c122c7d0eb1a',
          'd618b602-21cc-40a1-a9fa-534b7bc1672c'
        ].includes(t.value)))
      );

      const result = await service.listByOrg('org-123');

      expect(demoVisibility.applyVisibility).toHaveBeenCalled();
      expect(result).toEqual([realTemplate]);
    });

    it('[DG-03] listByOrg includes demo records for admin users', async () => {
      const realTemplate = { ...mockTemplate, id: 'real-1', tag: null };
      const demoTemplate = {
        ...mockTemplate,
        id: 'demo-1',
        tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }]
      };

      projectContext.setIsAdmin(true);
      graphqlRead.query.mockResolvedValue({
        items: [realTemplate, demoTemplate],
        page: { pageNumber: 1, pageSize: 100 }
      });
      demoVisibility.applyVisibility.mockReturnValue([realTemplate, demoTemplate]);

      const result = await service.listByOrg('org-123');

      expect(demoVisibility.applyVisibility).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('[DG-02] getById strips demo record for non-admin', async () => {
      const demoTemplate = {
        ...mockTemplate,
        id: 'demo-1',
        tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }]
      };

      graphqlRead.query.mockResolvedValue({
        items: [demoTemplate],
        page: { pageNumber: 1, pageSize: 1 }
      });
      demoVisibility.applyVisibility.mockReturnValue([]);

      const result = await service.getById('demo-1');

      expect(result).toBeNull();
    });

    it('[DG-02] includes tag field in GQL query', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [mockTemplate],
        page: { pageNumber: 1, pageSize: 100 }
      });

      await service.listByOrg('org-123');

      const fieldList = graphqlRead.query.mock.calls[0][1];
      expect(fieldList).toContain('tag');
    });
  });
});
