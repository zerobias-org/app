/**
 * Unit Tests for DocumentInstanceService (Plan 15 Wave 1)
 *
 * Tests instantiation flow with variable substitution, validation, and duplicate prevention.
 * Covers CRUD operations and integration with DocumentTemplateService.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { DocumentInstanceService } from './document-instance.service';
import { PipelineWriteService } from './pipeline-write.service';
import { GraphqlReadService } from './graphql-read.service';
import { DocumentTemplateService } from './document-template.service';
import { VariableSubstitutionService } from './variable-substitution.service';
import { DemoVisibilityService } from './demo-visibility.service';
import { ProjectContextService } from './project-context.service';
import { fakePipelineWriteService, fakeGraphqlReadService, fakeProjectContextService } from '../../test-helpers/angular';
import type { DocumentTemplate, DocumentInstance, InstantiateTemplateDto } from '../models';

describe('DocumentInstanceService', () => {
  let service: DocumentInstanceService;
  let pipelineWrite: ReturnType<typeof fakePipelineWriteService>;
  let graphqlRead: ReturnType<typeof fakeGraphqlReadService>;
  let documentTemplateService: { getById: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn>; listByOrg: ReturnType<typeof vi.fn>; publish: ReturnType<typeof vi.fn>; archive: ReturnType<typeof vi.fn> };
  let variableSubstitution: { parseCustomVariables: ReturnType<typeof vi.fn>; validateRequired: ReturnType<typeof vi.fn>; substitute: ReturnType<typeof vi.fn>; extractVariableNames: ReturnType<typeof vi.fn>; getBuiltInVariables: ReturnType<typeof vi.fn>; generatePreviewVariables: ReturnType<typeof vi.fn> };
  let demoVisibility: { applyVisibility: ReturnType<typeof vi.fn> };
  let projectContext: ReturnType<typeof fakeProjectContextService>;

  const mockTemplate: DocumentTemplate = {
    id: 'template-1',
    name: 'MSA Template',
    description: 'Standard MSA',
    documentType: 'msa',
    content: 'Agreement between {{buyerOrgName}} and {{vendorOrgName}}.',
    variableSchema: JSON.stringify([
      { name: 'clientName', label: 'Client Name', required: true }
    ]),
    version: 1,
    status: 'published',
    orgId: 'org-123',
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockInstance: DocumentInstance = {
    id: 'instance-1',
    name: 'MSA Template',
    description: 'Standard MSA',
    documentType: 'msa',
    content: 'Agreement between Acme Corp and Security Experts Ltd.',
    originalContent: 'Agreement between Acme Corp and Security Experts Ltd.',
    templateId: 'template-1',
    templateVersion: 1,
    variableValues: '{"clientName":"Acme Corp"}',
    engagementId: 'eng-1',
    projectId: 'proj-1',
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    pipelineWrite = fakePipelineWriteService();
    graphqlRead = fakeGraphqlReadService();
    demoVisibility = {
      applyVisibility: vi.fn((records) => records)
    };
    projectContext = fakeProjectContextService(false);

    documentTemplateService = {
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      listByOrg: vi.fn(),
      publish: vi.fn(),
      archive: vi.fn()
    };

    variableSubstitution = {
      parseCustomVariables: vi.fn(),
      validateRequired: vi.fn(),
      substitute: vi.fn(),
      extractVariableNames: vi.fn(),
      getBuiltInVariables: vi.fn(),
      generatePreviewVariables: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        DocumentInstanceService,
        DemoVisibilityService,
        { provide: PipelineWriteService, useValue: pipelineWrite },
        { provide: GraphqlReadService, useValue: graphqlRead },
        { provide: DocumentTemplateService, useValue: documentTemplateService },
        { provide: VariableSubstitutionService, useValue: variableSubstitution },
        { provide: DemoVisibilityService, useValue: demoVisibility },
        { provide: ProjectContextService, useValue: projectContext }
      ]
    });

    service = TestBed.inject(DocumentInstanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('instantiate()', () => {
    it('instantiates template with variable substitution', async () => {
      const dto: InstantiateTemplateDto = {
        templateId: 'template-1',
        engagementId: 'eng-1',
        projectId: 'proj-1',
        customVariables: { clientName: 'Acme Corp' }
      };

      documentTemplateService.getById.mockResolvedValue(mockTemplate);
      variableSubstitution.parseCustomVariables.mockReturnValue([
        { name: 'clientName', label: 'Client Name', required: true }
      ]);
      variableSubstitution.validateRequired.mockReturnValue([]);
      variableSubstitution.getBuiltInVariables.mockReturnValue({
        buyerOrgName: 'Acme Corp',
        vendorOrgName: 'Security Experts Ltd',
        engagementTitle: '',
        engagementId: 'eng-1',
        projectName: '',
        projectId: 'proj-1',
        effectiveDate: '',
        expirationDate: '',
        todayDate: '2026-04-10'
      });
      variableSubstitution.substitute.mockReturnValue({
        content: 'Agreement between Acme Corp and Security Experts Ltd.',
        missingRequired: []
      });

      const result = await service.instantiate(dto);

      expect(result.name).toBe('MSA Template');
      expect(result.templateId).toBe('template-1');
      expect(result.engagementId).toBe('eng-1');
      expect(result.status).toBe('draft');
      expect(result.templateVersion).toBe(1);
      expect(pipelineWrite.pushEntities).toHaveBeenCalledWith('DocumentInstance', expect.any(Array));
    });

    it('blocks instantiation if required variable missing', async () => {
      const dto: InstantiateTemplateDto = {
        templateId: 'template-1',
        engagementId: 'eng-1',
        customVariables: {} // Missing required clientName
      };

      documentTemplateService.getById.mockResolvedValue(mockTemplate);
      variableSubstitution.parseCustomVariables.mockReturnValue([
        { name: 'clientName', label: 'Client Name', required: true }
      ]);
      variableSubstitution.validateRequired.mockReturnValue(['clientName']);

      await expect(service.instantiate(dto))
        .rejects
        .toThrow('Missing required variables: clientName');
    });

    it('throws error if template not found', async () => {
      const dto: InstantiateTemplateDto = {
        templateId: 'not-found',
        engagementId: 'eng-1',
        customVariables: {}
      };

      documentTemplateService.getById.mockResolvedValue(null);

      await expect(service.instantiate(dto))
        .rejects
        .toThrow('Template not-found not found');
    });

    it('stores custom variable values as JSON', async () => {
      const dto: InstantiateTemplateDto = {
        templateId: 'template-1',
        engagementId: 'eng-1',
        customVariables: { clientName: 'Acme Corp', region: 'US' }
      };

      documentTemplateService.getById.mockResolvedValue(mockTemplate);
      variableSubstitution.parseCustomVariables.mockReturnValue([]);
      variableSubstitution.validateRequired.mockReturnValue([]);
      variableSubstitution.getBuiltInVariables.mockReturnValue({
        buyerOrgName: '', vendorOrgName: '', engagementTitle: '',
        engagementId: 'eng-1', projectName: '', projectId: '',
        effectiveDate: '', expirationDate: '', todayDate: '2026-04-10'
      });
      variableSubstitution.substitute.mockReturnValue({
        content: 'Resolved content',
        missingRequired: []
      });

      await service.instantiate(dto);

      const passedInstance = pipelineWrite.pushEntities.mock.calls[0][1][0];
      expect(passedInstance.variableValues).toBe(JSON.stringify({ clientName: 'Acme Corp', region: 'US' }));
    });
  });

  describe('checkDuplicate()', () => {
    it('detects duplicate instantiation', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [mockInstance],
        page: { pageNumber: 1, pageSize: 100 }
      });

      const result = await service.checkDuplicate('template-1', 'eng-1', 'proj-1');

      expect(result.isDuplicate).toBe(true);
      expect(result.existingInstance).toEqual(mockInstance);
    });

    it('returns false if no duplicate exists', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 100 }
      });

      const result = await service.checkDuplicate('template-1', 'eng-1', 'proj-1');

      expect(result.isDuplicate).toBe(false);
      expect(result.existingInstance).toBeUndefined();
    });

    it('allows duplicate instantiation with different projectId', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [mockInstance],
        page: { pageNumber: 1, pageSize: 100 }
      });

      const result = await service.checkDuplicate('template-1', 'eng-1', 'different-proj');

      expect(result.isDuplicate).toBe(false);
    });
  });

  describe('getByEngagement()', () => {
    it('returns all instances for engagement', async () => {
      const instances = [mockInstance, { ...mockInstance, id: 'instance-2' }];
      graphqlRead.query.mockResolvedValue({
        items: instances,
        page: { pageNumber: 1, pageSize: 100 }
      });

      const result = await service.getByEngagement('eng-1');

      expect(result).toEqual(instances);
      expect(graphqlRead.query).toHaveBeenCalledWith(
        'DocumentInstance',
        expect.any(Array),
        expect.objectContaining({ filters: expect.objectContaining({ engagementId: '.eq.eng-1' }) })
      );
    });
  });

  describe('getInstancesByTemplate()', () => {
    it('returns instances for specific template and engagement', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [mockInstance],
        page: { pageNumber: 1, pageSize: 100 }
      });

      const result = await service.getInstancesByTemplate('template-1', 'eng-1');

      expect(result).toEqual([mockInstance]);
      expect(graphqlRead.query).toHaveBeenCalledWith(
        'DocumentInstance',
        expect.any(Array),
        expect.objectContaining({
          filters: expect.objectContaining({
            templateId: '.eq.template-1',
            engagementId: '.eq.eng-1'
          })
        })
      );
    });
  });

  describe('update()', () => {
    it('updates instance content', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [mockInstance],
        page: { pageNumber: 1, pageSize: 1 }
      });

      const result = await service.update('instance-1', {
        content: 'Updated content'
      });

      expect(result.content).toBe('Updated content');
      expect(pipelineWrite.pushEntities).toHaveBeenCalled();
    });

    it('throws error if instance not found', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [],
        page: { pageNumber: 1, pageSize: 1 }
      });

      await expect(service.update('not-found', { content: 'New' }))
        .rejects
        .toThrow('Instance not-found not found');
    });
  });

  describe('getById()', () => {
    it('returns instance by id', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [mockInstance],
        page: { pageNumber: 1, pageSize: 1 }
      });

      const result = await service.getById('instance-1');

      expect(result).toEqual(mockInstance);
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

  describe('delete()', () => {
    it('soft deletes instance by setting status to deleted', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [mockInstance],
        page: { pageNumber: 1, pageSize: 1 }
      });

      await service.delete('instance-1');

      expect(pipelineWrite.pushEntities).toHaveBeenCalled();
      const passedInstance = pipelineWrite.pushEntities.mock.calls[0][1][0];
      expect(passedInstance.status).toBe('deleted');
    });
  });

  describe('Demo Visibility (Option X - Client-Side Post-Filter)', () => {
    it('[DG-02] getByEngagement strips demo records for non-admin users', async () => {
      const realInstance = { ...mockInstance, id: 'real-1', tag: null };
      const demoGlobalInstance = {
        ...mockInstance,
        id: 'demo-global-1',
        tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }]
      };
      const demoLegacyInstance = {
        ...mockInstance,
        id: 'demo-legacy-1',
        tag: [{ value: 'd618b602-21cc-40a1-a9fa-534b7bc1672c' }]
      };

      graphqlRead.query.mockResolvedValue({
        items: [realInstance, demoGlobalInstance, demoLegacyInstance],
        page: { pageNumber: 1, pageSize: 100 }
      });
      demoVisibility.applyVisibility.mockImplementation((records: Array<DocumentInstance & { tag?: Array<{ value: string }> | null }>) =>
        records.filter(r => !r.tag?.some((t) => [
          '81053c14-a8e5-4939-b538-c122c7d0eb1a',
          'd618b602-21cc-40a1-a9fa-534b7bc1672c'
        ].includes(t.value)))
      );

      const result = await service.getByEngagement('eng-1');

      expect(demoVisibility.applyVisibility).toHaveBeenCalled();
      expect(result).toEqual([realInstance]);
    });

    it('[DG-03] getByEngagement includes demo records for admin users', async () => {
      const realInstance = { ...mockInstance, id: 'real-1', tag: null };
      const demoInstance = {
        ...mockInstance,
        id: 'demo-1',
        tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }]
      };

      projectContext.setIsAdmin(true);
      graphqlRead.query.mockResolvedValue({
        items: [realInstance, demoInstance],
        page: { pageNumber: 1, pageSize: 100 }
      });
      demoVisibility.applyVisibility.mockReturnValue([realInstance, demoInstance]);

      const result = await service.getByEngagement('eng-1');

      expect(demoVisibility.applyVisibility).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('[DG-02/Regression] prevents server-side negation filters (Option X only)', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [mockInstance],
        page: { pageNumber: 1, pageSize: 100 }
      });

      await service.getByEngagement('eng-1');

      const callArgs = graphqlRead.query.mock.calls[0];
      const filters = callArgs[2]?.filters;
      expect(filters).not.toHaveProperty('tag.not');
      expect(filters).not.toHaveProperty('tag.ne');
    });

    it('[DG-02] includes tag field in GQL query', async () => {
      graphqlRead.query.mockResolvedValue({
        items: [mockInstance],
        page: { pageNumber: 1, pageSize: 100 }
      });

      await service.getByEngagement('eng-1');

      const fieldList = graphqlRead.query.mock.calls[0][1];
      expect(fieldList).toContain('tag');
    });

    it('[DG-02] getInstancesByTemplate strips demo records for non-admin', async () => {
      const realInstance = { ...mockInstance, id: 'real-1', tag: null };
      const demoInstance = {
        ...mockInstance,
        id: 'demo-1',
        tag: [{ value: '81053c14-a8e5-4939-b538-c122c7d0eb1a' }]
      };

      graphqlRead.query.mockResolvedValue({
        items: [realInstance, demoInstance],
        page: { pageNumber: 1, pageSize: 100 }
      });
      demoVisibility.applyVisibility.mockImplementation((records: Array<DocumentInstance & { tag?: Array<{ value: string }> | null }>) =>
        records.filter(r => !r.tag?.some((t) => [
          '81053c14-a8e5-4939-b538-c122c7d0eb1a',
          'd618b602-21cc-40a1-a9fa-534b7bc1672c'
        ].includes(t.value)))
      );

      const result = await service.getInstancesByTemplate('template-1', 'eng-1');

      expect(result).toEqual([realInstance]);
    });
  });
});
